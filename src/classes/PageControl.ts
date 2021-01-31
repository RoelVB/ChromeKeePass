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
            if(message.type === IMessage.RequestType.redetectFields)
                this.detectFields();
        });
        this._dropdown = new CredentialsDropdown(this);
    }

    /** Try to detect credentials fields */
    public detectFields() {
        this.detectNewFields(document.querySelectorAll('input[type="password"]'));
    }

    /**
     * Try to detect new credentials fields.
     * @param passwordFields A list of changed or added password fields.
     */
    public detectNewFields(passwordFields: NodeListOf<HTMLInputElement>) {
        for (const passwordField of passwordFields) {
            if (this._haveFieldSetForPasswordInput(passwordField)) {
                continue;
            }
            const $passwordField = $(passwordField);
            const isPasswordFieldVisible = $passwordField.is(':visible');
            let input: HTMLInputElement | null = passwordField;
            let foundFieldSet = false;
            while ((input = PageControl._getPreviousInput(input)) != null) {
                const inputType = input.type || 'text'; // Get input type, if none default to "text"
                if ((inputType === 'text' || inputType === 'email' || inputType === 'tel') &&
                    $passwordField.is(':visible') == isPasswordFieldVisible) {
                    this._fieldSets.set(input, new FieldSet(this, $passwordField, $(input)));
                    foundFieldSet = true;
                    break;
                }
            }
            if (!foundFieldSet && isPasswordFieldVisible) {
                this._fieldSets.set(passwordField, new FieldSet(this, $passwordField, $(passwordField)));
            }
        }
        this._findCredentials();
        this._attachEscapeEvent();
    }

    /**
     * Find the closest input element that appears before the given element in the DOM tree.
     *
     * @param element The starting element.
     * @return The closest input element or null, if no input element was found before the starting element.
     */
    private static _getPreviousInput(element: Element): HTMLInputElement | null {
        let currentElement : Element;
        let elementsWithCheckedChildrenStack : Element[][] = [[]];
        let childElement : Element | null;
        let siblingElement : Element | null;
        let parentElement : Element | null;

        if ((siblingElement = element.previousElementSibling) !== null) {
            currentElement = siblingElement;
        } else {
            if ((parentElement = element.parentElement) !== null) {
                currentElement = parentElement;
                elementsWithCheckedChildrenStack[0].push(parentElement);
            } else {
                return null;
            }
        }
        while (true) {
            if (currentElement instanceof HTMLInputElement) {
                return currentElement;
            }
            if (!elementsWithCheckedChildrenStack[elementsWithCheckedChildrenStack.length - 1]
                .includes(currentElement)) {
                if ((childElement = currentElement.lastElementChild) !== null) {
                    elementsWithCheckedChildrenStack[elementsWithCheckedChildrenStack.length - 1].push(currentElement);
                    elementsWithCheckedChildrenStack.push([]);
                    currentElement = childElement;
                    continue;
                }
            }
            if ((siblingElement = currentElement.previousElementSibling) !== null) {
                currentElement = siblingElement;
            } else if ((parentElement = currentElement.parentElement) !== null) {
                currentElement = parentElement;
                elementsWithCheckedChildrenStack.pop();
                if (elementsWithCheckedChildrenStack.length === 0) {
                    elementsWithCheckedChildrenStack.push([parentElement]);
                }
            } else {
                return null;
            }
        }
    }

    /**
     * @param passwordField The password field to search for.
     * @return Whether there is already a fieldset with the given password field.
     */
    private _haveFieldSetForPasswordInput(passwordField: HTMLInputElement): boolean {
        for (const fieldSet of this._fieldSets.values()) {
            if (fieldSet.passwordField.get(0) === passwordField) {
                return true;
            }
        }
        return false;
    }

    private _attachEscapeEvent()
    {
        if (this._installedEscapeHandler || this._fieldSets.size === 0) {
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
        if (this._foundCredentials === undefined && this._fieldSets.size) {
            // We should only look for credentials if we found input fields for it
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
