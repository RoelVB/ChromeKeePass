import * as IMessage from '../IMessage';
import {getKeePass} from './KeePass';

export default class BackgroundListener
{

    constructor()
    {
        chrome.runtime.onMessage.addListener(this._onMessage.bind(this));

        this._testAssociate().catch(error => console.error(`Failed to initially test the association: ${error}`));
    }

    /** When a message is received */
    private _onMessage(message: IMessage.Request, sender: chrome.runtime.MessageSender, sendResponse: (response: IMessage.Response)=>void)
    {
        let responsePromise: Promise<IMessage.Response> | undefined;

        switch(message.type)
        {
            case IMessage.RequestType.openOptions:
                chrome.runtime.openOptionsPage();
                break;
            case IMessage.RequestType.testAssociate:
                responsePromise = this._testAssociate();
                break;
            case IMessage.RequestType.associate:
                responsePromise = this._associate();
                break;
            case IMessage.RequestType.findCredentials:
                responsePromise = this._findCredentials(sender.url || '');
                break;
            case IMessage.RequestType.getCommands:
                responsePromise = this._getExtensionCommands();
                break;
        }

        if(responsePromise) // Did the switch-case result in a promise?
        {
            // Send the response when the Promise finishes
            responsePromise.then((response)=>sendResponse(response)).catch((error)=>console.log('Uncaught error in BackgroundListener', error));

            return true; // We need to return true, to let Chrome know the sendResponse will be called asynchronously
        }
    }

    /**
     * We got a credentials request
     * @param url URL the user wants credentials for
     */
    private async _findCredentials(url: string): Promise<IMessage.Credential[]>
    {
        console.log('get credentials for ', url);
        if (!url) {
            return []; // We didn't get a URL
        }
        const connection = await getKeePass();
        let result;
        try {
            result = await connection.getLogins(url);
        } catch(error) {
            BackgroundListener._setErrorIcon();
            throw error;
        }
        BackgroundListener._setErrorIcon(true);
        return result;
    }

    /** Associate with KeePass */
    private async _associate(): Promise<IMessage.Association>
    {
        const connection = await getKeePass();
        let associated;
        try {
            associated = await connection.associate();
        } catch (error) {
            console.error(error);
            BackgroundListener._setErrorIcon();
            return {
                Id: await connection.id,
                Associated: false,
                Error: 'Something went wrong... did you accept the connection within KeePass?',
            };
        }
        BackgroundListener._setErrorIcon(true);
        return {
            Id: await connection.id,
            Associated: associated,
        };
    }

    /** Test the association with KeePass */
    private async _testAssociate(): Promise<IMessage.Association>
    {
        const connection = await getKeePass();
        let associated;
        try {
            associated = await connection.testAssociate();
        } catch (error) {
            console.error(error);
            BackgroundListener._setErrorIcon();
            return {
                Id: await connection.id,
                Associated: false,
                Error: 'Something went wrong... is KeePass running and is the KeePassHttp plugin installed?',
            };
        }
        BackgroundListener._setErrorIcon(associated);
        return {
            Id: await connection.id,
            Associated: associated,
        };
    }

    private _getExtensionCommands(): Promise<chrome.commands.Command[]>
    {
        return chrome.commands.getAll();
    }

    /**
     * Set the icon next to the address bar to the error icon
     * @param clear If true, te default icon is shown
     */
    private static _setErrorIcon(clear?: boolean)
    {
        if(clear)
            chrome.action.setIcon({path: '../images/icon48.png'});
        else
            chrome.action.setIcon({path: '../images/icon48_red.png'});
    }

}
