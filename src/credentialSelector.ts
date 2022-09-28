import { onDocumentReady } from './classes/Constants';
import * as IMessage from './IMessage';

onDocumentReady(()=>{
    new CredentialSelector();
});

class CredentialSelector
{
    private readonly _nonce: number;
    private _credentialsList: HTMLDivElement;

    constructor()
    {
        const params = new URLSearchParams(location.search);

        this._nonce = parseInt(params.get('nonce')!);    
        this._credentialsList = document.getElementById('credentialsList') as HTMLDivElement;
        
        this._fetchCredentials();
    }

    /** Fetch the credentials from the background process */
    private _fetchCredentials()
    {
        chrome.runtime.sendMessage({
            nonce: this._nonce,
            command: 'getCredentials',
        } as IMessage.BasicAuth,
        (response: IMessage.BasicAuthResponse)=>{
            if(response.credentials === undefined)
                this._credentialsList.textContent = 'No credentials found';
            else
            {
                if(response.url) document.getElementById('title')!.textContent = `Select credentials for: ${response.url}`;

                this._credentialsList.innerHTML = '';
                response.credentials.forEach((credential)=>{
                    const title = document.createElement('div');
                    title.style.fontWeight = 'bold';
                    title.textContent = credential.title;

                    const username = document.createElement('div');
                    username.textContent = credential.username;

                    const item = document.createElement('div');
                    item.classList.add('credentialItem');
                    item.append(title, username);
                    item.addEventListener('click', this._onClickCredential.bind(this, credential));

                    this._credentialsList.append(item);
                });
            }
        });
    }

    private _onClickCredential(credential: IMessage.Credential)
    {
        chrome.runtime.sendMessage({
            nonce: this._nonce,
            command: 'selectCredential',
            credential,
        } as IMessage.BasicAuth);
    }
}
