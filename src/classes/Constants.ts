/*
 * This file contains some globally used variables
 */

/** Extension name (without possible "bèta" suffix) ("EdgeKeePass" in Edge or "ChromeKeePass" in any other browser) */
export const [ExtensionName] = EXTENSIONNAME.split(' ');

/** We are currently running a bèta version of the extension */
export const isBeta = EXTENSIONNAME.toLowerCase().includes('bèta');

/** Get the currently active tab */
export function getActiveTab(): Promise<chrome.tabs.Tab | undefined>
{
    return new Promise<chrome.tabs.Tab | undefined>((resolve, _reject)=>{
        chrome.tabs.query({currentWindow: true, active: true}, (tabs)=>{
            if(tabs.length)
                resolve(tabs[0]);
            else
                resolve(undefined);
        });
    });
}

/** Check if an element is visible on the page */
export function isElementVisible(el: HTMLElement): boolean
{
    return window.getComputedStyle(el).display !== 'none' // Not CSS hidden
            && el.offsetHeight > 0 && el.offsetWidth > 0; // More than 0 pixels in height and width
}

/** Callback when a page is loaded. Also fires if this event is attached after the page is loaded */
export function onDocumentReady(cb: ()=>void)
{
    if(document.readyState !== 'loading')
        cb();
    else
        document.addEventListener('DOMContentLoaded', cb);
}

export function log(type: 'debug'|'warn'|'error', msg: string, ...optionalParams: any[])
{
    switch(type)
    {
        case 'error':
            console.error(`[CKP]: ${msg}`, ...optionalParams);
            break;
        case 'warn':
            console.warn(`[CKP]: ${msg}`, ...optionalParams);
            break;
        default:
            if(DEBUG)
                console.log(`[CKP]: ${msg}`, ...optionalParams);
            break;
    }
}
