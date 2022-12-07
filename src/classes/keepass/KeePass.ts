import * as IMessage from '../../IMessage';
import {KeePassHTTP} from './KeePassHTTP';
import {KeePassNative} from './native/KeePassNative';
import {ConnectionType, ISettings, loadSettings} from '../../Settings';

/** A connection to the KeePass database. */
export interface KeePassConnection {

    /**
     * Update the connection based on the given settings.
     * @param settings The new settings.
     */
    updateFromSettings(settings: ISettings): void;

    /** Get the id used associating with KeePass. Will return an empty string when not associated. */
    get id(): Promise<string>;

    /** The name of the KeePass plugin that is used by this plugin. */
    get pluginName(): string;

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
    const settings = await loadSettings();
    let connectionClass;
    switch (settings.connectionType) {
        case ConnectionType.Native:
            connectionClass = KeePassNative;
            break;
        case ConnectionType.HTTP:
            connectionClass = KeePassHTTP;
            break;
    }
    if (_keePassConnectionInstance instanceof connectionClass) {
        _keePassConnectionInstance.updateFromSettings(settings)
    } else {
        _keePassConnectionInstance = new connectionClass(settings);
    }
    return _keePassConnectionInstance;
}
