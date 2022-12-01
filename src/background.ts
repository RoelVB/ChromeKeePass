import BackgroundListener from './classes/BackgroundListener';
import BasicAuth from './classes/BasicAuth';
import * as IMessage from './IMessage';
import * as C from './classes/Constants';
import { loadSettings } from './Settings';

/**
 * Create the contextMenu
 */
chrome.contextMenus.create({
    id: 'ChromeKeePassRoot',
    title: 'ChromeKeePass',
    contexts: ['all'],
}, ()=>{
    chrome.contextMenus.create({
        title: 'Re-detect fields',
        onclick: (info, tab) => sendReDetect(tab),
        parentId: 'ChromeKeePassRoot',
        contexts: ['all'],
    });
});

/**
 * This is because Chrome doesn't send the right `Origin`-header in `Fetch` requests. Because of this, KeeWebHttp denies the request.
 * The implementation below corrects the `Origin`-header.
 */
loadSettings().then((settings)=>{
    // noinspection HttpUrlsUsage
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
    {urls: [`http://${settings.keePassHost}:${settings.keePassPort}/*`]},
    ['blocking', 'requestHeaders']);
});

/** Catch basic authentication requests */
chrome.webRequest.onAuthRequired.addListener(async (details, callback)=>{
    callback!(await BasicAuth.handleAuth(details));
}, {urls: ["<all_urls>"]}, ['asyncBlocking']);


/** Listen for commands */
chrome.commands.onCommand.addListener(async (command)=>{
    if(command === 're_detect_fields')
    {
        const activeTab = await C.getActiveTab();
        if (activeTab) {
            sendReDetect(activeTab);
        }
    }
});


function sendReDetect(tab: chrome.tabs.Tab) {
    // Send re-detect command to active tab
    chrome.tabs.sendMessage(tab.id as number, {
        type: IMessage.RequestType.reDetectFields,
    } as IMessage.Request).catch((reason) => console.error(`Failed to send re-detect to tab ${tab.id}: ${reason}`));
}


// Start the background listener
new BackgroundListener();
