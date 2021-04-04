import * as $ from 'jquery-slim';

import FieldSet from './FieldSet';
import * as IMessage from '../IMessage';
import { ISettings, defaultSettings } from '../Settings';
import Client from '../classes/BackgroundClient';

export default class PageControl
{
    private _fieldSets: FieldSet[] = [];
    private _foundCredentials?: IMessage.Credential[];
    private _settings: ISettings = defaultSettings;
    private _redetectionTimeout?: number;

    constructor()
    {
        chrome.storage.sync.get(defaultSettings, (items)=>{
            this._settings = items as ISettings;
        });

        chrome.runtime.onMessage.addListener((message: IMessage.Request, _sender, _sendResponse)=>{
            if(message.type === IMessage.RequestType.redetectFields)
                this.detectFields();
        });
    }

    /**
     * Try to detect credentials fields
     * @param retryLimit How many times are we going to retry to find fields (0 meaning only 1 try)
     * @param retryDelay Delay between retries (in milliseconds)
     */
    public detectFields(retryLimit: number = 0, retryDelay: number = 1000)
    {
        // Clear the re-detection time-out if there's one
        if(this._redetectionTimeout)
        {
            window.clearTimeout(this._redetectionTimeout);
            this._redetectionTimeout = undefined;
        }

        const fieldSets: FieldSet[] = [];
        let passwordFields: JQuery = $('input[type="password"]');

        if(passwordFields.length) // Found some password fields?
        {
            passwordFields.each((passwordIndex, passwordField)=>{ // Loop through password fields
                let prevField: JQuery;

                $('input').each((inputIndex, input)=>{ // Loop through input fields to find the field before our password field
                    const inputType = $(input).attr('type') || 'text'; // Get input type, if none default to "text"
                    if(inputType != 'password') // We didn't reach our password field?
                    {
                        if($(input).is(':visible') && (inputType === 'text' || inputType === 'email' || inputType === 'tel')) // Is this a possible username field?
                            prevField = $(input);
                    }
                    else if($(input).is($(passwordField))) // Found our password field?
                    {
                        if(prevField) // Is there a previous field? Than this should be our username field
                        {
                            fieldSets.push(new FieldSet(this, $(passwordField), prevField));
                            return; // Break the each() loop
                        }
                        else if($(input).is(':visible')) // We didn't find the username field. Check if it's actually visible
                        {
                            fieldSets.push(new FieldSet(this, $(passwordField)));
                            return; // Break the each() loop
                        }
                        else // We didn't find a visible username of password field
                            return;
                    }
                });
            });
        }

        if(fieldSets.length)
        {
            // Remember the fields we've found
            this._fieldSets = fieldSets;
            this._findCredentials();
            this._attachEscapeEvent();
        }
        else if(retryLimit > 0) // We didn't find any fields, but have retries left?
        {
            // Schedule a retry
            this._redetectionTimeout = window.setTimeout(()=>this.detectFields(--retryLimit), retryDelay);
        }
    }

    private _attachEscapeEvent()
    {
        if(!this._fieldSets || this._fieldSets.length === 0) return; // We're not going to listen to key presses if we don't need them

        $(document).on('keyup', (e: JQuery.KeyUpEvent<Document>)=>{
            if(e.key == 'Escape')
            {
                this._fieldSets.forEach((fieldSet)=>{ // Close dropdown for all fieldSets
                    fieldSet.closeDropdown();
                });
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
}
