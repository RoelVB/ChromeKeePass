/**
 * This file contains (a subset of) the protocol that KeePassNatMsg uses
 * to communicate with clients over the native messaging channel.
 *
 * https://github.com/keepassxreboot/keepassxc-browser/blob/develop/keepassxc-protocol.md
 */

/** A type of request identifying it's intended action. */
type RequestType =
    'change-public-keys' |
    'associate' |
    'test-associate' |
    'get-logins';

/**
 * Request for passing public keys from client to server and back.
 * This is the first message that must be sent when the native messaging channel is initialized.
 * It is sent unencrypted, and its response allows us to send all future messages encrypted.
 * @see ChangePublicKeyResponse
 */
interface ChangePublicKeyBody {
    action: 'change-public-keys';

    /** The public key of the client (this extension) that should be used for this session. */
    publicKey: string;

    /** 24 bytes long random data, base64 encoded. */
    nonce: string;

    /**
     * 24 bytes long random data, base64 encoded.
     * This is used for a single session to identify different browsers if multiple are used with proxy application.
     */
    clientID: string;
}

/**
 * Request for associating a new client with KeePassXC.
 * @see AssociateResponse
 */
interface AssociateBody {
    action: 'associate';

    /** The public key of the client (this extension) that is used for communication during this session. */
    key: string;

    /** A new identification public key that will be used to identify this client and its association. */
    idKey: string;
}

/**
 * Request for testing if the client has been associated with KeePassXC.
 * @see TestAssociateResponse
 */
interface TestAssociateBody {
    action: 'test-associate';

    /** The identifier that was received from the associate request. */
    id: string;

    /** The identification public key that was used in the associate request. */
    key: string;
}

/** A key that identifies a client (this extension). */
interface IdentificationKey {
    /** The identifier that was received from the associate request. */
    id: string,

    /** The identification public key that was used in the associate request. */
    key: string;
}

/**
 * Requests for receiving credentials for the current URL match.
 * @see GetLoginsResponse
 */
interface GetLoginsBody {
    action: 'get-logins';

    /** The url for which to get the logins. */
    url: string;

    /** For a form, the url that the form will submit to. */
    submitUrl?: string;

    /** Whether the request is for a http basic auth. */
    httpAuth?: 'true' | 'false';
    keys: IdentificationKey[];
}

/** The unencrypted body of the request for the type T. */
type UnencryptedRequestBody<T> =
    T extends 'change-public-keys' ? ChangePublicKeyBody :
        T extends 'associate' ? AssociateBody :
            T extends 'test-associate' ? TestAssociateBody :
                T extends 'get-logins' ? GetLoginsBody :
                    never;

/** An encrypted request body. */
interface EncryptedBody {
    action: RequestType;

    /** The encrypted message, base64 encoded. */
    message: string;

    /** 24 bytes long random data, base64 encoded. This is incremented to the response. */
    nonce: string;

    /**
     * 24 bytes long random data, base64 encoded.
     * This is used for a single session to identify different browsers if multiple are used with proxy application.
     */
    clientID: string;

    /** A random 8 character string. Used to identify error responses. Currently used only with generate-password. */
    requestID?: string;
}

/** The response body for a {@link ChangePublicKeyBody} request. */
interface ChangePublicKeyResponse {
    action: 'change-public-keys';

    /** The version of KeePassNatMsg that generated the response. */
    version: string;

    /** The public key of KeePassNatMsg that will be used for encrypted messages during this session. */
    publicKey: string;

    /** Whether the request succeeded. */
    success: 'true' | 'false';
}

/** The response body for a {@link AssociateBody} request. */
interface AssociateResponse {
    /** The hash of the database that the client (this extension) was associated with. */
    hash: string;

    /** The version of KeePassNatMsg that generated the response. */
    version: string;

    /** Whether the request succeeded. */
    success: 'true' | 'false';

    /** The id of this association. */
    id: string;

    /**
     * 24 bytes base64 encoded incremented nonce that was generated from the nonce sent in the request
     * and used for encrypting the message.
     */
    nonce: string;
}

/** The response body for a {@link TestAssociateBody} request. */
interface TestAssociateResponse {
    /** The version of KeePassNatMsg that generated the response. */
    version: string;

    /**
     * 24 bytes base64 encoded incremented nonce that was generated from the nonce sent in the request
     * and used for encrypting the message.
     */
    nonce: string;

    /** The hash of the database that the client (this extension) is associated with. */
    hash: string;

    /** The id of the association. */
    id: string;

    /** Whether the request succeeded. */
    success: 'true' | 'false';
}

/** A credentials entry for a website. */
interface LoginEntry {
    /** The username. */
    login: string;

    /** The name of the credentials. */
    name: string;

    /** The password. */
    password: string;

    /** Whether the credentials are expired. */
    expired: 'true' | 'false';
}

/** The response body for a {@link GetLoginsBody} request. */
interface GetLoginsResponse {
    /** The number of credentials in the response. */
    count: string;

    /** The credentials found for the requested url. */
    entries: LoginEntry[];

    /**
     * 24 bytes base64 encoded incremented nonce that was generated from the nonce sent in the request
     * and used for encrypting the message.
     */
    nonce: string;

    /** Whether the request succeeded. */
    success: 'true' | 'false';

    /** The hash of the database that the credentials originate from. */
    hash: string;

    /** The version of KeePassNatMsg that generated the response. */
    version: string;
}

/** The response body of the request for the type T. */
type ResponseBody<T> =
    T extends 'change-public-keys' ? ChangePublicKeyResponse :
        T extends 'associate' ? AssociateResponse :
            T extends 'test-associate' ? TestAssociateResponse :
                T extends 'get-logins' ? GetLoginsResponse :
                    never;

/** A response indicating an error. */
interface ErrorResponse {
    /** The request type this error responds to. */
    action: RequestType;

    /** An error code identifying the error. */
    errorCode?: number;

    /** An error message describing the error. */
    error?: string;
}
