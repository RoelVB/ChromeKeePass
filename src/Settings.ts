
export interface ISettings
{
    /** Show the ChromeKeePass icon in the username field? */
    showUsernameIcon: boolean;
    /** Show the dropdown when username field gets focus */
    showDropdownOnFocus: boolean;
    /** Automatically fill credential field when there is only one credential found */
    autoFillSingleCredential: boolean;
    /** Show suggestions while typing in the username field */
    autoComplete: boolean;
    /** The host for KeePassHttp  */
    keePassHost: string;
    /** The port for KeePassHttp */
    keePassPort: number;
}

export const defaultSettings: ISettings = 
{
    showUsernameIcon: true,
    showDropdownOnFocus: true,
    autoFillSingleCredential: true,
    autoComplete: true,
    keePassHost: 'localhost',
    keePassPort: 19455,
}

/** Async method for loading settings */
export function loadSettings(): Promise<ISettings> {
    return new Promise<ISettings>((resolve, reject) => {
        chrome.storage.sync.get(defaultSettings, (items) => {
            if (chrome.runtime.lastError !== undefined) {
                reject();
            } else {
                resolve(items as ISettings);
            }
        });
    });
}

/** Async method for saving settings */
export function saveSettings(settings: Partial<ISettings>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        chrome.storage.sync.set(settings, () => {
            if (chrome.runtime.lastError !== undefined) {
                reject();
            } else {
                resolve();
            }
        });
    });
}
