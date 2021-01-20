import * as IMessage from '../IMessage';
import KeePassHTTP from './KeePassHTTP';

export default class BackgroundListener
{

    constructor()
    {
        chrome.runtime.onMessage.addListener(this._onMessage.bind(this));

        // noinspection JSIgnoredPromiseFromCall
        this._testAssociate();
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
    private _findCredentials(url: string): Promise<IMessage.Credential[]>
    {
        return new Promise<IMessage.Credential[]>((resolve, reject)=>{
            console.log('get credentials for ', url);
            if(url)
            {
                KeePassHTTP.getLogins(url).then((result)=>{
                    BackgroundListener._setErrorIcon(true);
                    resolve(result);
                }).catch((error)=>{
                    BackgroundListener._setErrorIcon();
                    reject(error);
                });
            }
            else
                resolve([]); // We didn't get a URL
        });
    }

    /** Associate with KeePassHttp */
    private _associate(): Promise<IMessage.Association>
    {
        return new Promise<IMessage.Association>((resolve)=>{
            KeePassHTTP.associate().then((associated)=>{
                BackgroundListener._setErrorIcon(true);
                resolve({
                    Id: KeePassHTTP.id,
                    Associated: associated,
                });

            }).catch((error)=>{
                console.error(error);
                BackgroundListener._setErrorIcon();
                resolve({
                    Id: KeePassHTTP.id,
                    Associated: false,
                    Error: 'Something went wrong... did you accept the connection within KeePass?',
                });
            });
        });
    }

    /** Test the association with KeePassHttp */
    private _testAssociate(): Promise<IMessage.Association>
    {
        return new Promise<IMessage.Association>((resolve)=>{
            KeePassHTTP.testAssociate().then((associated)=>{
                BackgroundListener._setErrorIcon(associated);
                resolve({
                    Id: KeePassHTTP.id,
                    Associated: associated,
                });

            }).catch((error)=>{
                console.error(error);
                BackgroundListener._setErrorIcon();
                resolve({
                    Id: KeePassHTTP.id,
                    Associated: false,
                    Error: 'Something went wrong... is KeePass running and is the KeePassHttp plugin installed?',
                });
            });
        });
    }

    private _getExtensionCommands(): Promise<chrome.commands.Command[]>
    {
        return new Promise<chrome.commands.Command[]>((resolve, _reject)=>{
            chrome.commands.getAll((commands)=>{
                resolve(commands);
            });
        });
    }

    /**
     * Set the icon next to the address bar to the error icon
     * @param clear If true, te default icon is shown
     */
    private static _setErrorIcon(clear?: boolean)
    {
        if(clear)
            chrome.browserAction.setIcon({path: 'images/icon48.png'});
        else
            chrome.browserAction.setIcon({path: 'images/icon48_red.png'});
    }

}
