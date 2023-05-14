import * as IMessage from '../IMessage';

export enum MenuItems
{
    REDETECT_FIELDS = 'redetect_fields',
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
