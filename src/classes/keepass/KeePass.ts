import * as IMessage from '../../IMessage';
import {KeePassHTTP} from './KeePassHTTP';
import {KeePassNative} from './native/KeePassNative';

/** A connection to the KeePass database. */
export interface KeePassConnection {

    /** Get the id used associating with KeePass. Will return an empty string when not associated. */
    get id(): Promise<string>;

    /**
     * Associate this extension as a client with the database.
     * @returns Whether the association was successful.
     */
    associate(): Promise<boolean>;

    /**
     * Test association with KeePass.
     * @returns Whether we are associated.
     */
    testAssociate(): Promise<boolean>;

    /**
     * Fetch credentials using KeePass.
     * @param url The url for which to fetch credentials.
     * @param forHttpBasicAuth Whether the request is made for http basic auth.
     * @returns A list of credentials for the given url.
     */
    getLogins(url: string, forHttpBasicAuth?: boolean): Promise<IMessage.Credential[]>;
}

let _keePassConnectionInstance: KeePassConnection | null = null;

/**
 * @returns The currently KeePass connection as selected in the settings.
 */
export async function getKeePass(): Promise<KeePassConnection> {
    // const connectionClass = KeePassHTTP;
    const connectionClass = KeePassNative;
    if (!(_keePassConnectionInstance instanceof connectionClass)) {
        _keePassConnectionInstance = new connectionClass();
    }
    return _keePassConnectionInstance;
}
