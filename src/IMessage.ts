
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
    /** Redetect the credetials fields */
    redetectFields,
}

export interface Request
{
    type: RequestType;
}

export type Response = Credential[] | Association;

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
