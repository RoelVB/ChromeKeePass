/*
 * This file contains some globally used variables
 */

/** The host for KeePassHttp  */
export const KeePassHost: string = 'localhost';
/** The port for KeePassHttp */
export const KeePassPort: number = 19455;

/** Get the currently active tab */
export function getActiveTab(): Promise<chrome.tabs.Tab | undefined>
{
    return new Promise<chrome.tabs.Tab>((resolve, reject)=>{
        chrome.tabs.query({currentWindow: true, active: true}, (tabs)=>{
            if(tabs.length)
                resolve(tabs[0]);
            else
                resolve();
        });
    });
}
