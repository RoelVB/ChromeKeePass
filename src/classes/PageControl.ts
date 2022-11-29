import $ from 'jquery-slim';

import FieldSet from './FieldSet';
import * as IMessage from '../IMessage';
import { ISettings, defaultSettings } from '../Settings';
import Client from '../classes/BackgroundClient';
import CredentialsDropdown from "./CredentialsDropdown";

export default class PageControl
{
    private _installedEscapeHandler = false;
    private _fieldSets = new Map<HTMLElement, FieldSet>();
    private _foundCredentials?: IMessage.Credential[];
    private _settings: ISettings = defaultSettings;
    /** The dropdown that allows the user to choose credentials */
    private readonly _dropdown: CredentialsDropdown;

    constructor()
    {
        chrome.storage.sync.get(defaultSettings, (items)=>{
            this._settings = items as ISettings;
        });

        chrome.runtime.onMessage.addListener((message: IMessage.Request, _sender, _sendResponse)=>{
            if(message.type === IMessage.RequestType.reDetectFields)
                this.detectFields();
        });
        this._dropdown = new CredentialsDropdown(this);
    }

    /** Try to detect credentials fields */
    public detectFields()
    {
        let passwordFields: JQuery = $('input[type="password"]');

        if(passwordFields.length) // Found some password fields?
        {
            passwordFields.each((passwordIndex, passwordField)=>{ // Loop through password fields
                this._createFieldSet(passwordField);
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
        for(const passwordField of passwordFields)
        {
            if(passwordField instanceof HTMLElement)
                this._createFieldSet(passwordField);
        }

        this._findCredentials();
        this._attachEscapeEvent();
    }

    /**
     * Create a fieldset for the `passwordField`. This method will also look for a username field
     * @param passwordField The password field we're going to use
     */
    private _createFieldSet(passwordField: HTMLElement)
    {
        let prevField: JQuery<HTMLElement> | undefined;
        let prevVisibleField: JQuery<HTMLElement> | undefined;
        let $passwordField = $(passwordField);
        $('input').each((inputIndex, input) => { // Loop through input fields to find the field before our password field
            const $input = $(input);
            const inputType = $input.attr('type') || 'text'; // Get input type, if none default to "text"
            if (inputType === 'text' || inputType === 'email' || inputType === 'tel') { // We didn't reach our password field?
                prevField = $input; // Is this a possible username field?
                if ($input.is(':visible')) {
                    prevVisibleField = $input;
                }
            } else if (inputType === 'password' && $input.is($(passwordField))) { // Found our password field?
                let controlField = $input.is(':visible') ? prevField : prevVisibleField; // When the password field is visible, we don't care if the username field is visible, otherwise we need a visible username field
                if (!controlField && $input.is(':visible')) {
                    // We didn't find the username field. Check if password field is actually visible
                    controlField = $passwordField;
                } // Else we didn't find a visible username of password field

                if(controlField)
                {
                    if(this._fieldSets.has(controlField[0])) // We already have a fieldset for this control field?
                        this._fieldSets.get(controlField[0])!.passwordField = $passwordField; // Set the password field again, it might have changed (This happens for Dropbox, see issue #86)
                    else
                        this._fieldSets.set(controlField[0], new FieldSet(this, $passwordField, controlField));
                }

                return false; // Break the `each()` loop
            }
        });
    }

    private _attachEscapeEvent()
    {
        if(this._installedEscapeHandler || !this._fieldSets || this._fieldSets.size === 0) {
            return; // We're not going to listen to key presses if we don't need them
        }
        this._installedEscapeHandler = true;
        $(document).on('keyup', (e: JQuery.KeyUpEvent<Document>)=>{
            if(e.key == 'Escape') {
                this._dropdown.close();
            }
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
