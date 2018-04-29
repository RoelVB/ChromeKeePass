
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
}

export const defaultSettings: ISettings = 
{
    showUsernameIcon: true,
    showDropdownOnFocus: true,
    autoFillSingleCredential: true,
    autoComplete: true,
}
