import * as $ from 'jquery-slim';
import * as IMessage from './IMessage';

$(document).ready(()=>{
    new CredentialSelector();
});

class CredentialSelector
{
    private _nonce: number;
    private _credentialsList: JQuery<HTMLElement>;

    constructor()
    {
        const params = new URLSearchParams(location.search);

        this._nonce = parseInt(params.get('nonce')!);    
        this._credentialsList = $('#credentialsList');
        
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
                this._credentialsList.text('No credentials found');
            else
            {
                if(response.url) $('#title').text(`Select credentials for: ${response.url}`);

                this._credentialsList.empty();
                response.credentials.forEach((credential)=>{
                    this._credentialsList.append(
                        $('<div>').addClass('credentialItem').append(
                            $('<div>').css({fontWeight: 'bold'}).text(credential.title)
                        ).append(
                            $('<div>').text(credential.username)
                        ).on('click', this._onClickCredential.bind(this, credential))
                    );
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
