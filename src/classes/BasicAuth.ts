import KeePassHTTP from './KeePassHTTP';
import * as IMessage from '../IMessage';

/**
 * This class is responsible for handling HTTP Basic Authentication
 */
export default class BasicAuth
{
    private static _previousRequestId: string;
    /** Every instance gets a unique ID te be sure it communicates with the correct credentials popup */
    private static _nonce: number = 0;

    private _url?: string;
    private _popupWindowId?: number;
    /** This holds the method to resolve `_waitPopup()` */
    private _popupResolver?: (credential?: IMessage.Credential)=>void;
    /** The instance's nonce */
    private _nonce: number;
    /** Found credentials */
    private _credentials?: IMessage.Credential[];

    /** This static method instantiates this class, and prevents loops */
    public static async handleAuth(request: chrome.webRequest.WebAuthenticationChallengeDetails): Promise<chrome.webRequest.BlockingResponse>
    {
        if(BasicAuth._previousRequestId === request.requestId) // Dit we already try this request?
        {
            console.warn(`We've just tried ${request.url}, canceling`);
            return {cancel: true}; // Prevent a loop!
        }
        else
        {
            BasicAuth._previousRequestId = request.requestId;
            return (new BasicAuth()).handleAuth(request);
        }
    }

    constructor()
    {
        this._nonce = ++BasicAuth._nonce;
    }

    public async handleAuth(request: chrome.webRequest.WebAuthenticationChallengeDetails): Promise<chrome.webRequest.BlockingResponse>
    {
        this._url = request.url;

        try {
            this._credentials = await KeePassHTTP.getLogins(request.url);
            if(this._credentials.length) // Found some credentials?
            {
                this._popupWindowId = await this._createPopup();
                if(!this._popupWindowId)
                    console.error('Failed to create a popup window?!');
                else
                {
                    // Add listeners
                    const windowListener = this._onWindowRemoved.bind(this);
                    const messageListener = this._onMessage.bind(this);
                    chrome.windows.onRemoved.addListener(windowListener);
                    chrome.runtime.onMessage.addListener(messageListener);

                    // Wait for answer
                    const selectedCredential = await this._waitPopup();

                    // Remove listeners
                    chrome.windows.onRemoved.removeListener(windowListener);
                    chrome.runtime.onMessage.removeListener(messageListener);

                    // Close the popup window if it's still open
                    if(this._popupWindowId !== undefined) chrome.windows.remove(this._popupWindowId);

                    if(selectedCredential !== undefined) // Credentials selected?
                    {
                        console.log(`Send credentials for "${selectedCredential.username}" to "${request.url}"`);
                        return {authCredentials: {username: selectedCredential.username, password: selectedCredential.password}};
                    }
                    else
                        console.log(`No credentials where selected for ${request.url}`);
                }
            }
        } catch(error) {
            console.error(`Unable to fetch credentials for ${request.url}`);
        }

        return {};
    }

    /**
     * Create a popup for credential selection
     */
    private _createPopup(): Promise<number | undefined>
    {
        return new Promise<number | undefined>((resolve, reject)=>{
            chrome.windows.create({
                url: `html/credentialSelector.html?nonce=${this._nonce}`,
                focused: true,
                type: 'popup',
                height: 200,
                width: 300,
            }, (window)=>{
                resolve(window?.id);
            });
        });
    }

    /**
     * Create a promise to catch the popup's callback
     */
    private _waitPopup(): Promise<IMessage.Credential | undefined>
    {
        return new Promise<IMessage.Credential | undefined>((resolve, reject)=>{
            this._popupResolver = resolve;
        });
    }

    private _onMessage(message: IMessage.BasicAuth, sender: chrome.runtime.MessageSender, sendResponse: (response: IMessage.BasicAuthResponse)=>void)
    {
        if(message.nonce == this._nonce) // This message is for us?
        {
            if(message.command === 'getCredentials' && this._credentials)
                sendResponse({credentials: this._credentials, url: this._url});
            else if(message.command === 'selectCredential')
                this._popupResolver?.(message.credential);
        }
    }

    /**
     * Listen if our popup window gets closed
     */
    private _onWindowRemoved(windowId: number, filters?: chrome.windows.WindowEventFilter | undefined)
    {
        if(windowId == this._popupWindowId) // This is our window?
        {
            this._popupWindowId = undefined;
            this._popupResolver?.(); // Resolve the popup promise
        }
    }
}
