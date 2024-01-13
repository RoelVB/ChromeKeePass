
export interface ITheme {
    /** Show a footer in the credential dropdown list? */
    enableDropdownFooter: boolean;
}

export interface ISettings
{
    /** Show the ChromeKeePass icon in the username field? */
    showUsernameIcon: boolean;
    /** Show the dropdown when username field gets focus */
    showDropdownOnFocus: boolean;
    /** Show the dropdown when username field has focus when it is detected */
    showDropdownOnDetectionFocus: boolean;
    /** Show the dropdown when username field is clicked */
    showDropdownOnClick: boolean;
    /** Automatically fill credential field when there is only one credential found */
    autoFillSingleCredential: boolean;
    /** Show suggestions while typing in the username field */
    autoComplete: boolean;
    /** The host for KeePassHttp */
    keePassHost: string;
    /** The port for KeePassHttp */
    keePassPort: number;
    /** Listen for changes in the html document and search for new input fields */
    searchForInputsOnUpdate: boolean;
    /** Settings determining the look of user interface elements */
    theme: ITheme;
    /** Should we show the changelog when CKP got updated? */
    showChangelogAfterUpdate: boolean;
    /** Hide the "Try ChromeKeePass Bèta" message above the changelog */
    hideTryBetaMsg: boolean;
}

export const defaultSettings: ISettings = 
{
    showUsernameIcon: true,
    showDropdownOnFocus: true,
    showDropdownOnDetectionFocus: true,
    showDropdownOnClick: false,
    autoFillSingleCredential: true,
    autoComplete: true,
    keePassHost: 'localhost',
    keePassPort: 19455,
    searchForInputsOnUpdate: true,
    theme: {
        enableDropdownFooter: true,
    },
    showChangelogAfterUpdate: true,
    hideTryBetaMsg: false,
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
