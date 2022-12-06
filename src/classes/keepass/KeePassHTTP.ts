import * as sjcl from 'sjcl-all';
import { Mutex } from 'async-mutex';
import * as IMessage from '../../IMessage';
import {ISettings} from '../../Settings';
import { Buffer } from 'buffer';
import {KeePassConnection} from './KeePass';

interface IRequestBody
{
    RequestType: 'test-associate' | 'associate' | 'get-logins' | 'get-logins-count' | 'set-login';
    /** Don't really understand why this is here, this is an option in the KeePassHTTP options screen within KeePass */
    TriggerUnlock?: boolean;
    /** 128 bit (16 bytes) long random vector, base64 encoded, used as IV for aes encryption */
    Nonce?: string;
    /** ENCRYPTED: verifier, base64 encoded AES encrypted data: `encrypt(base64_encode($nonce), $key, $nonce);` */
    Verifier?: string;
    /** Key id entered into KeePass GUI while `associate`, not used during `associate` */
    Id?: string;
    /** The key used when associating */
    Key?: string;
    /** URL for getting or setting logins (will be encrypted before sending) */
    Url?: string;
    /** Submit URL for getting or setting logins (will be encrypted before sending) */
    SubmitUrl?: string;
}

interface IEntry
{
    /** ENCRYPTED: Login name */
    Login: string;
    /** ENCRYPTED: Item name */
    Name: string;
    /** ENCRYPTED: Password */
    Password: string;
    /** ENCRYPTED: Field names? We don't use this */
    StringFields: string;
    /** ENCRYPTED: UUID */
    Uuid: string;
}

interface IResponseBody
{
    /** Number of logins when RequestType is `get-logins-count` */
    Count: number;
    /** Found entries when RequestType is `get-logins` */
    Entries?: IEntry[];
    /** Returned error message */
    Error?: string;
    Hash: string;
    /** Key id entered into KeePass GUI while `associate` */
    Id: string;
    Nonce?: string;
    /** The RequestType we send */
    RequestType: string;
    /** Was the request successful or not? */
    Success: boolean;
    Verifier?: string;
    /** KeePassHttp version */
    Version: string;
}

export class KeePassHTTP implements KeePassConnection {
    /** Mutex to prevent CKP from checking association before the key is loaded */
    private _loadingKeyMutex = new Mutex();
    private _id: string | null = '';
    private _key: string | null = '';

    /** The host where to KeePassHttp plugin can be reached. */
    private _host: string;

    /** The port where to KeePassHttp plugin can be reached. */
    private _port: number;

    constructor(settings: ISettings)
    {
        this._host = settings.keePassHost;
        this._port = settings.keePassPort;
        // Enable CBC mode
        (sjcl as any).beware["CBC mode is dangerous because it doesn't protect message integrity."]();

        this._loadKey();
    }

    /** Load association key */
    private _loadKey()
    {
        this._loadingKeyMutex.runExclusive(async ()=>{
            const res = await chrome.storage.local.get('KeePassHttp');
            this._id = res.KeePassHttp?.Id;
            this._key = res.KeePassHttp?.Key;
        }).catch((reason) => console.error(`Failed to load the key: ${reason}`));
    }

    /** Save the association key */
    private _saveKey(): Promise<void>
    {
        return chrome.storage.local.set({
            KeePassHttp: {
                Id: this._id,
                Key: this._key
            },
        });
    }

    updateFromSettings(settings: ISettings): void {
        this._host = settings.keePassHost;
        this._port = settings.keePassPort;
    }

    /**
     * Get the id used associating with KeePass. Will return an empty string when not associated.
     */
    get id(): Promise<string>
    {
        return Promise.resolve(this._id || '');
    }

    public async associate(): Promise<boolean>
    {
        this._key = KeePassHTTP._generateSharedKey();
        const json = await this._fetchJson({
            RequestType: 'associate',
            Key: this._key,
        });
        if (json.Success) {
            this._id = json.Id;
            await this._saveKey();
        }
        return json.Success;
    }

    /**
     * Test association with KeePassHttp
     */
    public async testAssociate(): Promise<boolean>
    {
        await this._loadingKeyMutex.waitForUnlock();
        const json = await this._fetchJson({RequestType: 'test-associate'});
        if (json.Id) {
            this._id = json.Id;
        }
        return json.Success;
    }

    /**
     * fetch credentials using KeePassHttp
     */
    public async getLogins(url: string, forHttpBasicAuth?: boolean): Promise<IMessage.Credential[]>
    {
        const json = await this._fetchJson({RequestType: 'get-logins', Url: url});
        if (!(json.Entries && json.Nonce)) {
            throw 'We received an invalid response';
        }
        return json.Entries.map((entry) => ({
            title: this._decryptData(entry.Name, json.Nonce as string),
            username: this._decryptData(entry.Login, json.Nonce as string),
            password: this._decryptData(entry.Password, json.Nonce as string),
        }));
    }

    /**
     * fetch wrapper for KeePassHttp requests
     */
    private async _fetchJson(body: IRequestBody): Promise<IResponseBody>
    {
        if(this._key) // Do we have a key?
        {
            const nonce = KeePassHTTP._generateNonce();
            body = Object.assign({}, body, {
                Nonce: nonce, // Add the Nonce to the request
                Verifier: this._encryptData(nonce, nonce), // Add the Verifier to the request
                Id: this._id?this._id:'', // Add the id, if we have one
            } as IRequestBody);

            if(body.Url) body.Url = this._encryptData(body.Url, nonce);
            if(body.SubmitUrl) body.SubmitUrl = this._encryptData(body.SubmitUrl, nonce);
        }

        const request: RequestInit = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        };

        // Send the request to KeePass
        // noinspection HttpUrlsUsage
        const response = await fetch(`http://${this._host}:${this._port}`, request);
        if(response.ok)
        {
            try {
                return await response.json();
            } catch {
                throw 'Parsing response JSON failed';
            }
        }
        else
            throw `HTTP error ${response.status}`
    }

    /**
     * Encrypt the data we want to send to KeePassHttp
     */
    private _encryptData(data: string, nonce: string)
    {
        const encrypted = sjcl.mode.cbc.encrypt(
            new sjcl.cipher.aes(sjcl.codec.base64.toBits(this._key as string)),
            sjcl.codec.utf8String.toBits(data),
            sjcl.codec.base64.toBits(nonce)
        );

        return sjcl.codec.base64.fromBits(encrypted);
    }

    /**
     * Decrypt the data we want to receive from KeePassHttp
     */
    private _decryptData(data: string, nonce: string)
    {
        const decrypted = sjcl.mode.cbc.decrypt(
            new sjcl.cipher.aes(sjcl.codec.base64.toBits(this._key as string)),
            sjcl.codec.base64.toBits(data),
            sjcl.codec.base64.toBits(nonce)
        );

        return sjcl.codec.utf8String.fromBits(decrypted);
    }

    /**
     * Generate a (128bit) Nonce, base64 encoded
     */
    private static _generateNonce(): string
    {
        const buffer = new Uint8Array(16);
        self.crypto.getRandomValues(buffer);
        return Buffer.from(buffer).toString('base64');
    }

    /**
     * Generate a (256bit) shared key, base64 encoded
     */
    private static _generateSharedKey(): string
    {
        const buffer = new Uint8Array(32);
        self.crypto.getRandomValues(buffer);
        return Buffer.from(buffer).toString('base64');
    }

}
