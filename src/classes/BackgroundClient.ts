import * as IMessage from '../IMessage';

/**
 * This class is to make the communication with the Background process easier to understand
 */
export default class BackgroundClient
{

    /**
     * Associate with KeePassHttp
     */
    public static associate(): Promise<IMessage.Association>
    {
        return chrome.runtime.sendMessage({
            type: IMessage.RequestType.associate,
        });
    }

    /**
     * Test the association with KeePassHttp
     */
    public static testAssociate(): Promise<IMessage.Association>
    {
        return chrome.runtime.sendMessage({
            type: IMessage.RequestType.testAssociate,
        });
    }

    /**
     * Find credentials for current url
     */
    public static findCredentials(): Promise<IMessage.Credential[]>
    {
        return chrome.runtime.sendMessage({
            type: IMessage.RequestType.findCredentials,
        });
    }

    /**
     * Open the extensions' options
     */
    public static openOptions(): void
    {
        chrome.runtime.sendMessage({
            type: IMessage.RequestType.openOptions,
        }).catch((reason) => console.error(`Failed to send open the options: ${reason}`));
    }

    /**
     * Get extension commands/shortcuts
     */
    public static getExtensionCommands(): Promise<chrome.commands.Command[]>
    {
        return chrome.runtime.sendMessage({
            type: IMessage.RequestType.getCommands,
        });
    }

}
