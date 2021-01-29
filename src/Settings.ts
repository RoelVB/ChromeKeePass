
export interface ITheme {
    /** Show a footer in the credential dropdown list? */
    enableDropdownFooter: boolean;
    /** The start of the background color gradient of the selected item in the credential dropdown list */
    dropdownSelectedItemColorStart: string;
    /** The end of the background color gradient of the selected item in the credential dropdown list */
    dropdownSelectedItemColorEnd: string;
    /** The width of the border of the credential dropdown list dropdown */
    dropdownBorderWidth: number
    /** The width of the shadow of the credential dropdown list dropdown */
    dropdownShadowWidth: number
    /** The padding of an item in the credential dropdown list dropdown */
    dropdownItemPadding: number
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
        dropdownSelectedItemColorStart: '#f0f3fb',
        dropdownSelectedItemColorEnd: '#bac7ec',
        dropdownBorderWidth: 1,
        dropdownShadowWidth: 0,
        dropdownItemPadding: 3,
    }
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
