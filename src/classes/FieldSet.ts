import * as $ from 'jquery-slim';
import * as styles from '../scss/content.scss';

import PageControl from './PageControl';
import * as IMessage from '../IMessage';


/**
 * Class for handling a set (username+password) fields
 */
export default class FieldSet
{
    /** The selected credential. */
    private _selectedCredential?: IMessage.Credential;
    /** Holds the old value for the username field, so we only react when the value changes */
    private _oldUsernameValue: string = '';
    /** The KeePass icon in the control field. */
    private _usernameIcon?: JQuery;
    /**
     * This is the field where gonna use ChromeKeePass's controls.
     * Might me undefined, if neither the username nor the password field is visible.
     */
    private _controlField?: JQuery;
    /** A list of listener functions that are attached to the control field. So we can detach and re-attach them */
    private readonly _LISTENER_FUNCTIONS: Record<
        keyof JQuery.TypeToTriggeredEventMap<HTMLElement, undefined, FieldSet, HTMLElement>,
        JQuery.TypeEventHandler<any, any, any, any, any>> = {};

    /**
     * Append ChromeKeePass to the fields
     * @param _pageControl A pointer back to the PageControl class
     * @param passwordField Pointer to the password field
     * @param usernameField Pointer to the username field
     */
    constructor(private _pageControl: PageControl, public readonly passwordField: JQuery, public readonly usernameField?: JQuery) {
        this._addListenerFunction('focusin', this._onFocus.bind(this));
        this._addListenerFunction('focusout', this._onFocusLost.bind(this));
        this._addListenerFunction('click', this._onClick.bind(this));
        this._addListenerFunction('keydown', this._onKeyPress.bind(this));
        this._addListenerFunction('keyup', this._onKeyUp.bind(this));

        const observer = new IntersectionObserver((_entries, _observer) => {
            this._chooseControlField();
        }, {root: document.documentElement});
        if (this.usernameField) {
            observer.observe(this.usernameField.get(0));
        }
        observer.observe(this.passwordField.get(0));
        this._chooseControlField();

        // Do we already have credentials?
        if(this._pageControl.credentials)
            this.receivedCredentials();
    }

    /** This method is called by the PageControl class when it receives credentials */
    public receivedCredentials() {
        if (this._pageControl.credentials) {
            if (this._usernameIcon) { // Do we have to change the icon?
                this._updateUsernameIconStyle();
            }
            if (this._pageControl.dropdown.isOpen) { // Is the dropdown open?
                this._changeCredentials();
            }
            // Do we already have to fill the fields?
            if (this._pageControl.settings.autoFillSingleCredential && this._pageControl.credentials.length === 1) {
                this._inputCredential(this._pageControl.credentials[0]);
            }

        } else if (this._usernameIcon) {
            this._updateUsernameIconStyle();
        }
    }

    /**
     * Select the specified credential.
     * @param credential The credential to select.
     */
    public selectCredential(credential?: IMessage.Credential) {
        this._selectedCredential = credential;
    }

    /**
     * @param filter An optional filter.
     * @return The filtered credentials list.
     */
    public getCredentials(filter?: string): IMessage.Credential[] {
        if(!(this._pageControl.credentials instanceof Array)) { // Do we have credentials available for this page?
            return [];
        }
        if(filter) { // Do we need to filter?
            filter = filter.toLowerCase();
            return this._pageControl.credentials.filter(credential=>
                credential.title.toLowerCase().indexOf(filter as string) !== -1
                || credential.username.toLowerCase().indexOf(filter as string) !== -1
            );
        }
        return this._pageControl.credentials; // No filter
    }

    /**
     * @return The field that has the ChromeKeePass icon and should display the dropdown.
     */
    public get controlField(): JQuery | undefined {
        return this._controlField;
    }

    /** Enter the selected credentials into the fields */
    public enterSelection() {
        if (!this._selectedCredential || !this._pageControl.dropdown.isOpen) {
            return; // We don't want to do this if we have no selection or the dropdown isn't open
        }
        this._inputCredential(this._selectedCredential);
        this._selectedCredential = undefined;
        this._pageControl.dropdown.close();
    }

    /** Event when the username field gets focussed */
    private _onFocus(_event: JQuery.FocusInEvent) {
        // Show the dropdown on focus when enabled and we either have more than one credential or no credentials.
        if (this._pageControl.settings.showDropdownOnFocus && this._pageControl.credentials
            && this._pageControl.credentials.length === 1) {
            this._pageControl.dropdown.open(this);
        }
    }

    /**
     * Event when the username field loses focus.
     *
     * @param event The focus lost event.
     */
    private _onFocusLost(event: JQuery.FocusOutEvent) {
        if (!this._pageControl.dropdown.hasGainedFocus(event)
            && (this._usernameIcon === undefined || this._usernameIcon.get(0) !== event.relatedTarget)) {
            this._pageControl.dropdown.close();
        }
    }

    /** Event when the username field is clicked */
    private _onClick(_event: JQuery.ClickEvent) {
        if (this._pageControl.settings.showDropdownOnClick) {
            this._pageControl.dropdown.open(this);
        }
    }

    /** Event when the icon in the username field is clicked */
    private _onIconClick(_event: JQuery.ClickEvent) {
        const dropdownHasFocus = this._pageControl.dropdown.isOpen;
        this._controlField?.focus();
        if (dropdownHasFocus) {
            this._pageControl.dropdown.close();
        } else {
            this._pageControl.dropdown.open(this);
        }
    }

    /** Event when a key is pressed while in the username field */
    private _onKeyPress(event: JQuery.KeyDownEvent) {
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
                event.preventDefault(); // Else this action will move the cursor
                this._pageControl.dropdown.open(this)
                this._pageControl.dropdown.selectNextCredential(event.key === 'ArrowUp');
                break;
            case 'Enter':
                this.enterSelection();
                break;
            case 'Escape':
            case 'Tab':
                this._pageControl.dropdown.close();
                break;
        }
    }

    /** Event when a key was pressed in the username field */
    private _onKeyUp(e: JQuery.KeyUpEvent)
    {
        const newValue: string = $(e.target).val() as string;

        if(this._oldUsernameValue !== newValue) // The entered value changed?
        {
            this._oldUsernameValue = newValue;

            if(this._pageControl.settings.autoComplete) // Is autocomplete enabled?
            {
                this._pageControl.dropdown.open(this); // Try opening the dropdown
                if (this._pageControl.dropdown.isOpen) { // The dropdown is open?
                    this._changeCredentials(newValue)
                }
            }
        }
    }

    /**
     * Choose a control field from the username and password field.
     */
    private _chooseControlField() {
        if (this.usernameField?.is(':visible')) {
            this._setControlField(this.usernameField);
        } else if (this.passwordField.is(':visible')) {
            this._setControlField(this.passwordField);
        } else {
            this._setControlField(); // We don't have a control field right now
        }
    }

    /**
     * Add a listener function to be added to the control field.
     *
     * @param event The event name.
     * @param handler The event handler.
     */
    private _addListenerFunction<TType extends string>(
        event: TType, handler: JQuery.TypeEventHandler<HTMLElement, undefined, HTMLElement, HTMLElement, TType>) {
        this._LISTENER_FUNCTIONS[event] = handler;
    }

    /**
     * Update the current control field.
     * @param newControlField The new control field.
     */
    private _setControlField(newControlField?: JQuery) {
        if (newControlField === this._controlField) { // The controlField didn't change?
            return;
        }

        // If we already have a controlField, detach listeners and remove the dropdown
        if (this._controlField) {
            for (let callbackName in this._LISTENER_FUNCTIONS) {
                // noinspection JSUnfilteredForInLoop
                this._controlField.off(callbackName, this._LISTENER_FUNCTIONS[callbackName]);
            }
            this._pageControl.dropdown.close();
            this._usernameIcon?.remove()
            this._usernameIcon = undefined;
        }

        // Setup the controlField
        this._controlField = newControlField;
        if (this._controlField) {
            const inputType = this._controlField.attr('type');
            // Disable Autofill on controlField. See https://stackoverflow.com/questions/15738259/disabling-chrome-autofill
            const isAutofillField = inputType === 'email' || inputType === 'tel' || inputType === 'password'
                || this._controlField.attr('name')?.toLowerCase()?.includes('email')
                || this._controlField.attr('id')?.toLowerCase()?.includes('email');
            this._controlField.attr('autocomplete', isAutofillField ? 'chrome-off' : 'off');
            // Attach listeners
            for (let callbackName in this._LISTENER_FUNCTIONS) {
                // noinspection JSUnfilteredForInLoop
                this._controlField.on(callbackName, this._LISTENER_FUNCTIONS[callbackName]);
            }
            // Maybe we need to open the dropdown?
            if (this._pageControl.settings.showDropdownOnDetectionFocus && this._controlField.is(':focus')
                && this._pageControl.credentials && this._pageControl.credentials.length === 1) {
                this._pageControl.dropdown.open(this);
            }
            // Should we show the icon in the username field?
            if (this._pageControl.settings.showUsernameIcon) {
                const targetOffset = this._controlField.offset();
                const fieldWidth = this._controlField.outerWidth() || 48
                const size = Math.min(fieldWidth, this._controlField.outerHeight() || 48);
                // Create the username icon
                // noinspection HtmlRequiredAltAttribute,RequiredAttributes
                this._usernameIcon = $('<img>').attr('alt', 'Open the credentials dropdown')
                    .attr('title', 'Open the credentials dropdown').attr('tabindex', '0')
                    .addClass(styles.textBoxIcon).css({
                        left: `${(targetOffset ? targetOffset.left : size) + fieldWidth - size}px`,
                        top: `${targetOffset && targetOffset.top || 0}px`,
                        height: `${size}px`,
                        width: `${size}px`,
                        'border-radius': `${size / 2.0}px`,
                        // 'box-shadow': `0 ${theme.dropdownShadowWidth}px ${theme.dropdownShadowWidth}px 0 rgba(0,0,0,0.2)`,
                    }).on('click', this._onIconClick.bind(this));
                this._updateUsernameIconStyle();
                $(document.body).append(this._usernameIcon);
            }
        }
    }

    /**
     * Change the available credentials based on the filter.
     * @param filter Optional text to filter credentials on.
     */
    private _changeCredentials(filter?: string) {
        const credentials = this.getCredentials(filter);
        this._pageControl.dropdown.setCredentials(credentials);
    }

    /** Input a credential into the fields */
    private _inputCredential(credential: IMessage.Credential)
    {
        if(this.usernameField)
        {
            this.usernameField.val(credential.username);
            this.usernameField[0].dispatchEvent(new Event('input', {bubbles: true}));
            this.usernameField[0].dispatchEvent(new Event('change', {bubbles: true}));
        }
        this.passwordField.val(credential.password);
        this.passwordField[0].dispatchEvent(new Event('input', {bubbles: true}));
        this.passwordField[0].dispatchEvent(new Event('change', {bubbles: true}));
    }

    /** Update the style of the username icon to reflect the current availability of credentials. */
    private _updateUsernameIconStyle() {
        let iconStyle = 'red';
        if (this._pageControl.credentials) {
            iconStyle = this._pageControl.credentials.length ? 'green' : 'orange';
        }
        this._usernameIcon?.attr('src', chrome.extension.getURL(`images/icon48_${iconStyle}.png`));
    }
}
