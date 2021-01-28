import * as $ from 'jquery-slim';

import FieldSet from './FieldSet';
import * as IMessage from '../IMessage';
import { ISettings, defaultSettings } from '../Settings';
import Client from '../classes/BackgroundClient';
import CredentialsDropdown from "./CredentialsDropdown";

export default class PageControl
{
    private _installedEscapeHandler = false;
    private _fieldSets: FieldSet[] = [];
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
            if(message.type === IMessage.RequestType.redetectFields)
                this.detectFields();
        });
        this._dropdown = new CredentialsDropdown(this);
    }

    /** Try to detect credentials fields */
    public detectFields()
    {
        const fieldSets: FieldSet[] = [];
        let passwordFields: JQuery = $('input[type="password"]');

        if(passwordFields.length) // Found some password fields?
        {
            passwordFields.each((passwordIndex, passwordField)=>{ // Loop through password fields
                let fieldSet = this._createFieldSet(passwordField);
                if (fieldSet !== undefined) {
                    fieldSets.push(fieldSet);
                }
            });
        }

        // Remember the fields we've found
        this._fieldSets = fieldSets;
        this._findCredentials();
        this._attachEscapeEvent();
    }

    /**
     * Try to detect new credentials fields
     * @param passwordFields A list of changed or added password fields.
     */
    public detectNewFields(passwordFields: JQuery) {
        passwordFields.each((passwordIndex, passwordField) => { // Loop through password fields
            if (!this._fieldSets.some((fieldSet) => fieldSet.passwordField.index() !== passwordIndex)) {
                let fieldSet = this._createFieldSet(passwordField);
                if (fieldSet !== undefined) {
                    this._fieldSets.push(fieldSet);
                }
            }
        });
        this._findCredentials();
        this._attachEscapeEvent();
    }

    private _createFieldSet(passwordField: HTMLElement): FieldSet | undefined {
        let prevField: JQuery;
        let fieldSet: FieldSet | undefined = undefined;
        $('input').each((inputIndex, input) => { // Loop through input fields to find the field before our password field
            const inputType = $(input).attr('type') || 'text'; // Get input type, if none default to "text"
            if (inputType != 'password') { // We didn't reach our password field?
                if ($(input).is(':visible') &&
                    (inputType === 'text' || inputType === 'email' || inputType === 'tel')) {
                    prevField = $(input); // Is this a possible username field?
                }
            } else if ($(input).is($(passwordField))) { // Found our password field?
                if (prevField) { // Is there a previous field? Than this should be our username field
                    fieldSet = new FieldSet(this, $(passwordField), prevField);
                } else if ($(input).is(':visible')) {
                    // We didn't find the username field. Check if it's actually visible
                    fieldSet = new FieldSet(this, $(passwordField));
                } // Else we didn't find a visible username of password field
                return false; // Break the each() loop
            }
        });
        return fieldSet;
    }

    private _attachEscapeEvent()
    {
        if(this._installedEscapeHandler || !this._fieldSets || this._fieldSets.length === 0) {
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
        if(this._fieldSets.length) // We should only look for credentials if we found input fields for it
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
