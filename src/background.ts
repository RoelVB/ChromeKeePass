import BackgroundListener from './classes/BackgroundListener';
import BasicAuth from './classes/BasicAuth';
import * as IMessage from './IMessage';
import * as C from './classes/Constants';

/**
 * Create the contextMenu
 */
chrome.contextMenus.create({
    id: 'ChromeKeePassRoot',
    title: 'ChromeKeePass',
    contexts: ['all'],
}, ()=>{
    chrome.contextMenus.create({
        title: 'Redetect fields',
        onclick: sendRedetect,
        parentId: 'ChromeKeePassRoot',
        contexts: ['all'],
    });
});

/**
 * This is because Chrome doesn't send the right `Origin`-header in `Fetch` requests. Because of this, KeeWebHttp denies the request.
 * The implementation below corrects the `Origin`-header.
 */
chrome.webRequest.onBeforeSendHeaders.addListener((details)=>{
    if(details.requestHeaders)
    {
        for(const key in details.requestHeaders)
        {
            if(details.requestHeaders[key].name === 'Origin') // Found the `Origin`-header
            {
                details.requestHeaders[key].value = `chrome-extension://${chrome.runtime.id}`;
                break;
            }
        }

        return {requestHeaders: details.requestHeaders};
    }
},
{urls: [`http://${C.KeePassHost}:${C.KeePassPort}/*`]},
['blocking', 'requestHeaders']);

/** Catch basic authentication requests */
chrome.webRequest.onAuthRequired.addListener(async (details, callback)=>{
    callback!(await BasicAuth.handleAuth(details));
}, {urls: ["<all_urls>"]}, ['asyncBlocking']);

function sendRedetect(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab)
{
    // Send redetect command to active tab
    chrome.tabs.sendMessage(tab.id as number, {
        type: IMessage.RequestType.redetectFields,
    } as IMessage.Request);
}



// Start the background listener
new BackgroundListener();
