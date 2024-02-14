
export enum RequestType
{
    /** Request credentials lookup */
    findCredentials,
    /** Open the extension's options */
    openOptions,
    /** Check KeePassHttp association */
    testAssociate,
    /** Associate with KeePassHttp */
    associate,
    /** Re-detect the credentials fields */
    redetectFields,
    /** Get extension commands */
    getCommands,

    /** Send to a tab when the "Fill user + password" was selected in the contextmenu */
    contextMenuFillUserPass,
    /** Send to a tab when the "Fill user" was selected in the contextmenu */
    contextMenuFillUser,
    /** Send to a tab when the "Fill password" was selected in the contextmenu */
    contextMenuFillPass,
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
