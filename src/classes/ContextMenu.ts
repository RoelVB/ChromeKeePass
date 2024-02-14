import * as IMessage from '../IMessage';

export enum MenuItems
{
    REDETECT_FIELDS = 'redetect_fields',
    FILL_USER = 'fill_user',
    FILL_PASS = 'fill_pass',
    FILL_USER_PASS = 'fill_user_pass',
}

export default class ContextMenu
{
    public static init()
    {
        new ContextMenu();
    }

    constructor()
    {
        chrome.contextMenus.onClicked.addListener(this._onClick.bind(this));
        chrome.runtime.onInstalled.addListener(this._onInstall.bind(this));
    }

    private _onInstall(details: chrome.runtime.InstalledDetails)
    {
        chrome.contextMenus.create({
            id: 'ChromeKeePassRoot',
            title: 'ChromeKeePass',
            contexts: ['all'],
        }, ()=>{
            chrome.contextMenus.create({
                id: MenuItems.FILL_USER,
                title: 'Fill user',
                parentId: 'ChromeKeePassRoot',
                contexts: ['all'],
            });
            chrome.contextMenus.create({
                id: MenuItems.FILL_PASS,
                title: 'Fill password',
                parentId: 'ChromeKeePassRoot',
                contexts: ['all'],
            });
            chrome.contextMenus.create({
                id: MenuItems.FILL_USER_PASS,
                title: 'Fill user + password',
                parentId: 'ChromeKeePassRoot',
                contexts: ['all'],
            });
            chrome.contextMenus.create({
                id: 'fill_separator',
                parentId:'ChromeKeePassRoot',
                type: 'separator',
                contexts: ['all'],
            });
            chrome.contextMenus.create({
                id: MenuItems.REDETECT_FIELDS,
                title: 'Re-detect fields',
                parentId: 'ChromeKeePassRoot',
                contexts: ['all'],
            });
        });
    }

    private _onClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab)
    {
        switch(info.menuItemId)
        {
            case MenuItems.FILL_USER:
                if(tab?.id)
                    chrome.tabs.sendMessage(tab.id, {type: IMessage.RequestType.contextMenuFillUser} as IMessage.Request, {frameId: info.frameId});
                break;
            case MenuItems.FILL_PASS:
                if(tab?.id)
                    chrome.tabs.sendMessage(tab.id, {type: IMessage.RequestType.contextMenuFillPass} as IMessage.Request, {frameId: info.frameId});
                break;
            case MenuItems.FILL_USER_PASS:
                if(tab?.id)
                    chrome.tabs.sendMessage(tab.id, {type: IMessage.RequestType.contextMenuFillUserPass} as IMessage.Request, {frameId: info.frameId});
                break;
            case MenuItems.REDETECT_FIELDS:
                if(tab) this._sendRedetect(info, tab);
                break;
        }
    }

    private _sendRedetect(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab)
    {
        // Send re-detect command to active tab
        chrome.tabs.sendMessage(tab.id as number, {
            type: IMessage.RequestType.redetectFields,
        } as IMessage.Request);
    }

}
