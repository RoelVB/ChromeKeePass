import BackgroundListener from './classes/BackgroundListener';
import * as IMessage from './IMessage';

// Start the background listener
new BackgroundListener();

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

function sendRedetect(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab)
{
    // Send redetect command to active tab
    chrome.tabs.sendMessage(tab.id as number, {
        type: IMessage.RequestType.redetectFields,
    } as IMessage.Request);
}
