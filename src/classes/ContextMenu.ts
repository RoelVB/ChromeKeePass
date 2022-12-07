import CommandHandler from "./CommandHandler";


export default class ContextMenu {
    private static readonly RE_DETECT_FIELDS_ID = 'ChromeKeePassReDetectFields';

    /**
     * Create the context menu.
     */
    public static register() {
        chrome.contextMenus.create({
            id: 'ChromeKeePassRoot',
            title: 'ChromeKeePass',
            contexts: ['all'],
        }, () => {
            chrome.contextMenus.create({
                id: ContextMenu.RE_DETECT_FIELDS_ID,
                title: 'Re-detect fields',
                parentId: 'ChromeKeePassRoot',
                contexts: ['all'],
            });
        });
    }

    static handleClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
        if (tab && info.menuItemId == ContextMenu.RE_DETECT_FIELDS_ID) {
            CommandHandler.sendReDetect(tab);
        }
    }
}
