import { Mutex } from 'async-mutex';
import { isElementVisible, log } from './Constants';
import FieldSet from './FieldSet';
import * as IMessage from '../IMessage';
import { ISettings, defaultSettings } from '../Settings';
import Client from '../classes/BackgroundClient';
import CredentialsDropdown from "./CredentialsDropdown";
import UncontrolledFields from './UncontrolledFields';

export default class PageControl
{
    private _installedEscapeHandler = false;
    private _fieldSets = new Map<HTMLElement, FieldSet>();
    private _foundCredentials?: IMessage.Credential[];
    private _settings: ISettings = defaultSettings;
    private _loadingSettings = new Mutex();
    /** The dropdown that allows the user to choose credentials */
    private readonly _dropdown: CredentialsDropdown;

    constructor()
    {
        chrome.runtime.onMessage.addListener((message: IMessage.Request, _sender, _sendResponse)=>{
            if(message.type === IMessage.RequestType.redetectFields)
                this.detectFields();
        });
        this._dropdown = new CredentialsDropdown();
        new UncontrolledFields(this);
    }

    private async _loadSettings()
    {
        await this._loadingSettings.runExclusive(async ()=>{
            if(this._settings !== defaultSettings) return; // Cancel if we already loaded the settings
            this._settings = (await chrome.storage.sync.get(defaultSettings)) as ISettings;
        });
    }

    /** Try to detect credentials fields */
    public async detectFields()
    {
        await this._loadSettings(); // Make sure we loaded the settings
        let passwordFields = document.querySelectorAll<HTMLInputElement>('input[type="password"]');

        if(passwordFields.length) // Found some password fields?
        {
            passwordFields.forEach((passwordField, passwordIndex)=>{ // Loop through password fields
                this.createFieldSet(passwordField);
            });
        }

        this._findCredentials();
        this._attachEscapeEvent();
    }

    /**
     * Try to detect new credentials fields
     * @param passwordFields A list of changed or added password fields.
     */
    public detectNewFields(passwordFields: NodeListOf<Element>)
    {
        log('debug', 'detectNewFields', passwordFields);

        for(const passwordField of passwordFields)
        {
            if(passwordField instanceof HTMLInputElement)
                this.createFieldSet(passwordField);
        }

        this._findCredentials();
        this._attachEscapeEvent();
    }

    /** Find a FieldSet based on an input element */
    public findFieldSet(field: HTMLInputElement): FieldSet | undefined
    {
        for(const [,fieldSet] of this._fieldSets)
        {
            if(fieldSet.usernameField === field || fieldSet.passwordField === field)
                return fieldSet;
        }
    }

    /**
     * Create a fieldset for the `passwordField`. This method will also look for an username field
     * @param passwordField The password field we're going to use
     */
    public createFieldSet(passwordField: HTMLInputElement): FieldSet | undefined
    {
        let prevField: HTMLInputElement | undefined;

        for(const input of document.querySelectorAll<HTMLInputElement>('input')) // Loop through input fields to find the field before our password field
        {
            const inputType = input.getAttribute('type') || 'text'; // Get input type, if none default to "text"
            if (inputType === 'text' || inputType === 'email' || inputType === 'tel')  // We didn't reach our password field?
            {
                prevField = input; // Remember this possible username field?
            }
            else if (inputType === 'password' && input === passwordField) // Found our password field?
            {
                let controlField: HTMLInputElement | undefined;
                if(prevField && isElementVisible(prevField)) // We have a visible username field?
                    controlField = prevField;
                else if(prevField && !isElementVisible(prevField) && !isElementVisible(passwordField)) // There's a username field, but both are invisible?
                    controlField = prevField;
                else // There's no visible username field?
                    controlField = passwordField;

                if(!this._fieldSets.has(controlField)) // Only create a FieldSet once for every field
                {
                    log('debug', 'Created FieldSet\nControlField:', controlField, '\nPasswordField:', passwordField);
                    this._fieldSets.set(controlField, new FieldSet(this, passwordField, controlField));
                }
                
                return this._fieldSets.get(controlField);
            }
        }
    }

    private _attachEscapeEvent()
    {
        if(this._installedEscapeHandler || !this._fieldSets || this._fieldSets.size === 0) {
            return; // We're not going to listen to key presses if we don't need them
        }

        this._installedEscapeHandler = true;
        document.addEventListener('keyup', ev=>{
            if(ev.key === 'Escape')
                this._dropdown.close();
        });
    }

    private _findCredentials()
    {
        if(this._fieldSets.size) // We should only look for credentials if we found input fields for it
        {
            Client.findCredentials().then((credentials)=>{
                this._foundCredentials = credentials;
                this._fieldSets.forEach((fieldSet) => fieldSet.receivedCredentials());
            });
        }
    }

    get credentials(): IMessage.Credential[] | undefined
    {
        return this._foundCredentials;
    }

    get settings(): ISettings
    {
        return this._settings;
    }

    get dropdown(): CredentialsDropdown {
        return this._dropdown;
    }
}
