import * as IMessage from './IMessage';
import { mount as mountPicker } from './components/PickerPopup';

const nonce = Number(new URLSearchParams(location.search).get('nonce'));

const fetchCredentials = (): Promise<IMessage.Credential[]> =>
{
    return new Promise<IMessage.Credential[]>((resolve, reject)=>{
        chrome.runtime.sendMessage({
            nonce: nonce,
            command: 'getCredentials',
        } as IMessage.BasicAuth,
        (response: IMessage.BasicAuthResponse)=>{
            resolve(response.credentials || []);
        });
    });
};

const onSelect = (cred: IMessage.Credential) =>
{
    chrome.runtime.sendMessage({
        nonce: nonce,
        command: 'selectCredential',
        credential: cred,
    } as IMessage.BasicAuth);
};

// Mount React picker component
mountPicker(document.getElementById('root')!, {
    credentials: fetchCredentials,
    onSelect: onSelect,
});
