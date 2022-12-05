
export enum RequestType
{
    /** Request credentials lookup */
    findCredentials,
    /** Open the extension's options */
    openOptions,
    /** Check KeePass association */
    testAssociate,
    /** Associate with KeePass */
    associate,
    /** Re-detect the credentials fields */
    reDetectFields,
    /** Get extension commands */
    getCommands,
}

export interface Request
{
    type: RequestType;
}

export type Response = Credential[] | Association | chrome.commands.Command[];

export interface Credential
{
    title: string;
    username: string;
    password: string;
}

export interface Association
{
    Id: string;
    Associated: boolean;
    Error?: string;
}

export interface BasicAuth
{
    command?: 'selectCredential'|'getCredentials';
    nonce: number;
    credential?: Credential;
}

export interface BasicAuthResponse
{
    credentials?: Credential[];
    url?: string;
}
