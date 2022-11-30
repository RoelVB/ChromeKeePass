import BackgroundListener from './classes/BackgroundListener';
import BasicAuth from './classes/BasicAuth';
import * as IMessage from './IMessage';
import * as C from './classes/Constants';
import {loadSettings} from './Settings';
import RequestHeaderModifier from "./classes/RequestHeaderModifier";


/**
 * Create the context menu.
 */
function registerContextMenu() {
    chrome.contextMenus.create({
        id: 'ChromeKeePassRoot',
        title: 'ChromeKeePass',
        contexts: ['all'],
    }, () => {
        chrome.contextMenus.create({
            title: 'Re-detect fields',
            onclick: (info, tab) => sendReDetect(tab),
            parentId: 'ChromeKeePassRoot',
            contexts: ['all'],
        });
    });
}

chrome.runtime.onInstalled.addListener(() => {
    registerContextMenu();
    loadSettings().then(RequestHeaderModifier.register);
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
