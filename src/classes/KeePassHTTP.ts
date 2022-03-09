import * as sjcl from 'sjcl-all';
import { Mutex } from 'async-mutex';
import * as IMessage from '../IMessage';
import { loadSettings } from '../Settings';

export interface IRequestBody
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

export interface IEntry
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

export interface IResponseBody
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

export class KeePassHTTP
{
    /** Mutex to prevent CKP from checking association before the key is loaded */
    private _loadingKeyMutex = new Mutex();
    private static _id: string | null = '';
    private static _key: string | null = '';

    constructor()
    {
        // Enable CBC mode
        (sjcl as any).beware["CBC mode is dangerous because it doesn't protect message integrity."]();

        this._loadKey();
    }

    /** Load association key */
    private _loadKey()
    {
        this._loadingKeyMutex.runExclusive(()=>{
            return new Promise<void>((resolve, reject)=>{
                KeePassHTTP._id = localStorage.getItem('KeePassHttpId');
                KeePassHTTP._key = localStorage.getItem('KeePassHttpKey');
                if(KeePassHTTP._id && KeePassHTTP._key) // Found key using the old method?
                {
                    this._saveKey();
                    localStorage.removeItem('KeePassHttpId');
                    localStorage.removeItem('KeePassHttpKey');
                }
                else
                {
                    chrome.storage.local.get('KeePassHttp', res=>{
                        if(chrome.runtime.lastError)
                            reject(chrome.runtime.lastError);
                        else
                        {
                            KeePassHTTP._id = res.KeePassHttp.Id;
                            KeePassHTTP._key = res.KeePassHttp.Key;
                            resolve();
                        }
                    });
                }
            });
        });
    }

    /** Save the association key */
    private _saveKey()
    {
        return new Promise<void>((resolve, reject)=>{
            chrome.storage.local.set({
                KeePassHttp: {
                    Id: KeePassHTTP._id,
                    Key: KeePassHTTP._key
                },
            }, ()=>{
                if(chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
                else
                    resolve();
            });
        });
    }

    /**
     * Get the Id used associating with KeePass. Will return an empty string when not associated
     */
    get id(): string
    {
        return KeePassHTTP._id || '';
    }

    public associate(): Promise<boolean>
    {
        return new Promise<boolean>((resolve, reject)=>{
            KeePassHTTP._key = KeePassHTTP._generateSharedKey();

            KeePassHTTP._fetchJson({
                RequestType: 'associate',
                Key: KeePassHTTP._key,
            }).then((json)=>{
                if(json.Success) // Successfully associated?
                {
                    KeePassHTTP._id = json.Id;
                    this._saveKey();
                    resolve(true);
                }
                else
                    resolve(false);
            }).catch(reject);
        });
    }

    /**
     * Test association with KeePassHttp
     */
    public async testAssociate(): Promise<boolean>
    {
        await this._loadingKeyMutex.waitForUnlock();

        return new Promise<boolean>((resolve, reject)=>{
            KeePassHTTP._fetchJson({RequestType: 'test-associate'}).then((json)=>{
                if(json.Id) KeePassHTTP._id = json.Id;

                resolve(json.Success);
            }).catch(reject);
        });
    }

    /**
     * fetch credentials using KeePassHttp
     */
    public getLogins(url: string): Promise<IMessage.Credential[]>
    {
        return new Promise<IMessage.Credential[]>((resolve, reject)=>{
            KeePassHTTP._fetchJson({RequestType: 'get-logins', Url: url}).then((json)=>{
                if(json.Entries && json.Nonce)
                {
                    const output: IMessage.Credential[] = [];

                    json.Entries.forEach((entry)=>{
                        output.push({
                            title: KeePassHTTP._decryptData(entry.Name, json.Nonce as string),
                            username: KeePassHTTP._decryptData(entry.Login, json.Nonce as string),
                            password: KeePassHTTP._decryptData(entry.Password, json.Nonce as string),
                        });
                    });

                    resolve(output);
                }
                else
                    reject('We received an invalid response');

            }).catch(reject);
        });
    }

    /**
     * fetch wrapper for KeePassHttp requests
     */
    private static async _fetchJson(body: IRequestBody): Promise<IResponseBody>
    {
        if(KeePassHTTP._key) // Do we have a key?
        {
            const nonce = KeePassHTTP._generateNonce();
            body = Object.assign({}, body, {
                Nonce: nonce, // Add the Nonce to the request
                Verifier: KeePassHTTP._encryptData(nonce, nonce), // Add the Verifier to the request
                Id: KeePassHTTP._id?KeePassHTTP._id:'', // Add the Id, if we have one
            } as IRequestBody);

            if(body.Url) body.Url = KeePassHTTP._encryptData(body.Url, nonce);
            if(body.SubmitUrl) body.SubmitUrl = KeePassHTTP._encryptData(body.SubmitUrl, nonce);
        }        
        
        const request: RequestInit = {
            method: 'POST',
            body: JSON.stringify(body),
        };

        // Load our host and port
        const settings = await loadSettings();

        // Send the request to KeePass
        const response = await fetch(`http://${settings.keePassHost}:${settings.keePassPort}`, request);
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
    private static _encryptData(data: string, nonce: string)
    {
        const encrypted = sjcl.mode.cbc.encrypt(
            new sjcl.cipher.aes(sjcl.codec.base64.toBits(KeePassHTTP._key as string)),
            sjcl.codec.utf8String.toBits(data),
            sjcl.codec.base64.toBits(nonce)
        );
        
        return sjcl.codec.base64.fromBits(encrypted);
    }

    /**
     * Decrypt the data we want to received from KeePassHttp
     */
    private static _decryptData(data: string, nonce: string)
    {
        const decrypted = sjcl.mode.cbc.decrypt(
            new sjcl.cipher.aes(sjcl.codec.base64.toBits(KeePassHTTP._key as string)),
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
        let key = '';
        for(let i=0; i<16; i++)
            key += String.fromCharCode(Math.floor(Math.random()*256)); // Random char from char 0 to 255

        return btoa(key);
    }

    /**
     * Generate a (256bit) shared key, base64 encoded
     */
    private static _generateSharedKey(): string
    {
        let key = '';
        for(let i=0; i<32; i++)
            key += String.fromCharCode(Math.floor(Math.random()*256)); // Random char from char 0 to 255

        return btoa(key);
    }
    
}

const KeePassHTTPInstance = new KeePassHTTP();
export default KeePassHTTPInstance;
