import * as IMessage from '../../../IMessage';
import {KeePassConnection} from '../KeePass';
import {box, BoxKeyPair, randomBytes} from 'tweetnacl';
import {decodeBase64, decodeUTF8, encodeBase64, encodeUTF8} from 'tweetnacl-util';
import {MutexProtectedLocalStorageVariable, MutexProtectedVariable} from '../../MutexProtectedVariable';
import {ISettings} from '../../../Settings';

/** Our association with the KeePass database. */
interface Association {
    /** The id of the association. */
    readonly id: string;

    /** The identification key that is used to identify ourselves. */
    readonly identificationKey: BoxKeyPair;
}

/** Temporary keys used for encryption during a session. */
interface EncryptionKeys {

    /** Our key. */
    readonly myKey: BoxKeyPair;

    /** The public key of KeePass. */
    readonly keePassPublicKey: Uint8Array;
}

/** A mutex protected accessor for the association data, backed by local storage. */
class MutexProtectedAssociation extends MutexProtectedLocalStorageVariable<Association> {
    constructor() {
        super('KeePassNative');
    }

    protected _deserialize(rawValue: any): Association | null {
        const id = rawValue.id;
        const identificationKey = rawValue.identificationKey;
        if (!id || !identificationKey) {
            return null;
        }
        return {
            id: id,
            identificationKey: box.keyPair.fromSecretKey(decodeBase64(identificationKey)),
        } as Association;
    }

    protected _serialize(value: Association | null): any {
        return value ? {
            id: value.id,
            identificationKey: encodeBase64(value.identificationKey.secretKey),
        } : null;
    }
}

/** The length of a nonce used in communication in bytes. */
const NONCE_LENGTH = 24;


/**
 * A connection to KeePass via the KeePassNatMsg plugin.
 * https://github.com/smorks/keepassnatmsg
 */
export class KeePassNative implements KeePassConnection {
    /** Accessor to the association data. */
    private _association = new MutexProtectedAssociation();

    /** Accessor to the encryption keys of the current session. */
    private _encryptionKeys = new MutexProtectedVariable<EncryptionKeys | null>(() => null);

    /** Our client id during the current session. */
    private readonly _clientId = encodeBase64(randomBytes(24));

    /** The native app id of the KeePassNatMsg plugin. */
    private _keePassAppId: string;

    constructor(settings: ISettings) {
        this._keePassAppId = settings.keePassNativeAppId;
    }

    updateFromSettings(settings: ISettings): void {
        this._keePassAppId = settings.keePassNativeAppId;
    }

    get id(): Promise<string> {
        return this._association.get().then((association) => association?.id || '');
    }

    get pluginName(): string {
        return 'KeePassNatMsg';
    }

    public async associate(): Promise<boolean> {
        const key = box.keyPair();
        const connection = await this._loadEncryptionKeys();
        const json = await this._requestJson<'associate'>({
            action: 'associate',
            key: encodeBase64(connection.myKey.publicKey),
            idKey: encodeBase64(key.publicKey),
        }, connection);
        if (json.success !== 'true') {
            return false;
        }
        await this._association.set(() => ({
            id: json.id,
            identificationKey: key,
        } as Association));
        return true;
    }

    public async testAssociate(): Promise<boolean> {
        const association = await this._association.get();
        if (!association?.id) {
            return false;
        }
        const json = await this._requestJson<'test-associate'>({
            action: 'test-associate',
            id: association.id,
            key: encodeBase64(association.identificationKey.publicKey),
        });
        if (json.success !== 'true') {
            return false;
        }
        if (json.id !== association.id) {
            await this._association.set(() => ({
                id: json.id,
                identificationKey: association.identificationKey,
            } as Association));
        }
        return true;
    }

    public async getLogins(url: string, forHttpBasicAuth?: boolean): Promise<IMessage.Credential[]> {
        const association = await this._association.get()
        if (!association) {
            throw 'Not associated';
        }
        const json = await this._requestJson<'get-logins'>({
            action: 'get-logins',
            url: url,
            httpAuth: forHttpBasicAuth ? 'true' : 'false',
            keys: [{
                id: association.id,
                key: encodeBase64(association.identificationKey.publicKey),
            }]
        });
        if (json.success !== 'true') {
            throw 'Failed to request logins: Response indicated a failure';
        }
        if (!json.entries) {
            throw 'Failed to request logins: Response contains no entries';
        }
        return json.entries.filter((entry) => !entry.expired).map((entry) => ({
            title: entry.name,
            username: entry.login,
            password: entry.password,
        }));
    }

    /**
     * Load the encryption keys either from the cache or from KeePass.
     * @returns The encryption keys.
     */
    private async _loadEncryptionKeys(): Promise<EncryptionKeys> {
        const cachedKeys = await this._encryptionKeys.get();
        if (cachedKeys) {
            return cachedKeys;
        }
        return await this._encryptionKeys.set(() => this._requestEncryptionKeys());
    }

    /**
     * Request new encryption keys for the current session from KeePass.
     * @returns The new encryption keys.
     */
    private async _requestEncryptionKeys(): Promise<EncryptionKeys> {
        const key = box.keyPair();
        const nonce = randomBytes(NONCE_LENGTH);
        const json = await this._requestJson<'change-public-keys'>({
            action: 'change-public-keys',
            publicKey: encodeBase64(key.publicKey),
            nonce: encodeBase64(nonce),
            clientID: this._clientId,
        });
        if (json.success !== 'true') {
            throw 'Requesting the public key failed, response indicates a failure';
        }
        if (!json.publicKey) {
            throw 'Requesting the public key failed, response doesn\'t contain a public key';
        }
        return {
            myKey: key,
            keePassPublicKey: decodeBase64(json.publicKey),
        } as EncryptionKeys;
    }

    /** Forget the current encryption keys. */
    private async _clearEncryptionKeys(): Promise<void> {
        await this._encryptionKeys.set(() => null);
    }

    /**
     * Make a request to the KeePassNatMsg plugin and return the parsed response.
     *
     * @param unencryptedBody The unencrypted body to send. Will be encrypted depending on the request type.
     * @param encryptionKeys The encryption keys to use when encrypting the message.
     * @returns The response received from KeePassNatMsg.
     */
    private async _requestJson<T extends RequestType>(
        unencryptedBody: UnencryptedRequestBody<T>,
        encryptionKeys?: EncryptionKeys): Promise<Partial<ResponseBody<T>>> {
        let body: EncryptedBody | UnencryptedRequestBody<T> = unencryptedBody;
        if (!encryptionKeys && unencryptedBody.action !== 'change-public-keys') {
            encryptionKeys = await this._loadEncryptionKeys();
        }
        let nonce: Uint8Array | null = null;
        if (encryptionKeys) {
            nonce = randomBytes(NONCE_LENGTH);
            body = {
                action: unencryptedBody.action,
                message: encodeBase64(box(decodeUTF8(JSON.stringify(unencryptedBody)), nonce,
                    encryptionKeys.keePassPublicKey, encryptionKeys.myKey.secretKey)),
                nonce: encodeBase64(nonce),
                clientID: this._clientId,
            }
        }
        // Send the request to KeePass
        const response = await chrome.runtime.sendNativeMessage(
            this._keePassAppId, body) as Partial<EncryptedBody> | ErrorResponse;
        if (response.action !== unencryptedBody.action) {
            throw 'Invalid response (Different action in response)';
        }
        if ('error' in response) {
            throw `Error response (${response.errorCode ?? '?'}): ${response.error}`
        }
        if (!encryptionKeys || !nonce) {
            return response as Partial<ResponseBody<T>>;
        }
        if (!('message' in response) || !response.message) {
            throw 'Invalid response (No message)';
        }
        if (!response.nonce) {
            throw 'Invalid response (No nonce)';
        }
        this._incrementedNonce(nonce);
        if (response.nonce !== encodeBase64(nonce)) {
            throw 'Invalid response (Invalid nonce)';
        }
        const message = box.open(decodeBase64(response.message), nonce,
            encryptionKeys.keePassPublicKey, encryptionKeys.myKey.secretKey);
        if (!message) {
            await this._clearEncryptionKeys();
            throw 'Failed to decrypt response';
        }
        try {
            return JSON.parse(encodeUTF8(message)) as Partial<ResponseBody<T>>;
        } catch (error) {
            console.warn(`Parsing response JSON failed: ${error}`);
            throw 'Parsing response JSON failed';
        }
    }

    /**
     * Increment the nonce as defined by the KeePassNatMsg protocol.
     * @param nonce The nonce to increment, will be altered in place.
     */
    private _incrementedNonce(nonce: Uint8Array) {
        let c = 1;
        for (let i = 0; i < nonce.length; i++) {
            c += nonce[i];
            nonce[i] = c;
            c >>= 8;
        }
    };
}
