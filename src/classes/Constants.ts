/*
 * This file contains some globally used variables
 */

/** Get the currently active tab */
export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
    const tabs = await chrome.tabs.query({currentWindow: true, active: true});
    if (tabs.length) {
        return tabs[0];
    }
    return undefined;
}
