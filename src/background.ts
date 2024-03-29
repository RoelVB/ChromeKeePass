import BackgroundListener from './classes/BackgroundListener';
import BasicAuth from './classes/BasicAuth';
import ContextMenu from './classes/ContextMenu';
import * as IMessage from './IMessage';
import * as C from './classes/Constants';
import { loadSettings } from './Settings';

/**
 * Create the contextMenu
 */
ContextMenu.init();

/** Catch basic authentication requests */
chrome.webRequest.onAuthRequired.addListener(async (details, callback)=>{
    callback!(await BasicAuth.handleAuth(details));
}, {urls: ["<all_urls>"]}, ['asyncBlocking']);


/** Listen for commands */
chrome.commands.onCommand.addListener(async (command)=>{
    if(command === 'redetect_fields')
    {
        const activeTab = await C.getActiveTab();
        chrome.tabs.sendMessage(activeTab?.id as number, {
            type: IMessage.RequestType.redetectFields,
        } as IMessage.Request);
    }
});

// Determine if we have to show the changelog
chrome.runtime.onInstalled.addListener(async (details)=>{
    if(details.reason === chrome.runtime.OnInstalledReason.UPDATE) // Extenstion got updated?
    {
        const settings = await loadSettings();
        if(settings.showChangelogAfterUpdate)
        {
            // Open changelog
            chrome.tabs.create({
                url: `${chrome.runtime.getURL('html/options.html')}?update=${details.previousVersion || 'Unknown'}`,
            });
        }
    }
});


// Start the background listener
new BackgroundListener();
