import BackgroundListener from './classes/BackgroundListener';
import BasicAuth from './classes/BasicAuth';
import ContextMenu from "./classes/ContextMenu";
import CommandHandler from "./classes/CommandHandler";


chrome.contextMenus.onClicked.addListener(ContextMenu.handleClick);
chrome.runtime.onInstalled.addListener(() => {
    ContextMenu.register();
});

/** Catch basic authentication requests */
chrome.webRequest.onAuthRequired.addListener(async (details, callback) => {
    callback!(await BasicAuth.handleAuth(details));
}, {urls: ["<all_urls>"]}, ['asyncBlocking']);

/** Listen for commands */
chrome.commands.onCommand.addListener(CommandHandler.handleCommand);

// Start the background listener
new BackgroundListener();
