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
    /** Is the cursor currently on the KeePass icon? */
    private _onIcon: boolean = false;
    /** Did the click start on the KeePass icon? */
    private _iconOwnsClick: boolean = false;
    /** Variable holding all icon styles (to easily remove all the styles at once) */
    private static allIconStyles = `${styles.green} ${styles.orange} ${styles.red}`;
    /**
     * This is the field where gonna use ChromeKeePass's controls.
     * Might me undefined, if neither the username nor the password field is visible.
     */
    private _controlField?: JQuery;
    /**
     * Used to remember the original title attribute from the username field
     * (because it changes when the cursor hovers the ChromeKeePass icon)
     */
    private _controlFieldTitle: string = '';
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
        this._addListenerFunction('mousemove', this._onMouseMove.bind(this));
        this._addListenerFunction('mousedown', this._onMouseDown.bind(this));
        this._addListenerFunction('mouseleave', this._activateIcon.bind(this, true));
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
    public receivedCredentials()
    {
        if(this._pageControl.credentials)
        {
            if(this._pageControl.settings.showUsernameIcon) // Do we have to change the icon?
            {
                if (this._pageControl.credentials.length) {
                    this._controlField?.removeClass(FieldSet.allIconStyles).addClass(styles.green);
                } else {
                    this._controlField?.removeClass(FieldSet.allIconStyles).addClass(styles.orange);
                }
            }
            if (this._pageControl.dropdown.isOpen) { // Is the dropdown open?
                this._changeCredentials();
            }
            // Do we already have to fill the fields?
            if(this._pageControl.settings.autoFillSingleCredential && this._pageControl.credentials.length === 1)
                this._inputCredential(this._pageControl.credentials[0]);

        } else if (this._pageControl.settings.showUsernameIcon) {
            this._controlField?.removeClass(FieldSet.allIconStyles).addClass(styles.red);
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
        // Show the dropdown on focus when enabled and whe either have more than one credential or no credentials.
        if (this._pageControl.settings.showDropdownOnFocus && !this._iconOwnsClick
            && this._pageControl.credentials && this._pageControl.credentials.length === 1) {
            this._pageControl.dropdown.open(this);
        }
    }

    /**
     * Event when the username field loses focus.
     *
     * @param event The focus lost event.
     */
    private _onFocusLost(event: JQuery.FocusOutEvent) {
        if (!this._pageControl.dropdown.hasGainedFocus(event)) {
            this._pageControl.dropdown.close();
        }
    }

    /** Event when the mouse is clicked on the username field */
    private _onMouseDown(_event: JQuery.MouseDownEvent) {
        if (this._onIcon) {
            this._iconOwnsClick = true;
        }
    }

    /** Event when the username field is clicked */
    private _onClick(event: JQuery.ClickEvent) {
        if (this._onIcon) { // Only continue if the cursor is on the icon
            event.preventDefault();
            if (this._pageControl.dropdown.isOpen) {
                this._pageControl.dropdown.close();
            } else {
                this._pageControl.dropdown.open(this);
            }
        } else if (this._pageControl.settings.showDropdownOnClick) {
            this._pageControl.dropdown.open(this);
        }
        this._iconOwnsClick = false;
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

    /** Event when te mouse is moving over the username field */
    private _onMouseMove(e: JQuery.MouseMoveEvent)
    {
        if (this._controlField === undefined) {
            return;
        }
        const target = $(e.target);
        const targetOffset = target.offset();
        const targetWidth = target.width();
        const cursorPosX: number | undefined = targetOffset && e.pageX-targetOffset.left - parseInt(target.css('padding-left')) - parseInt(target.css('padding-right'));

        if(cursorPosX && targetWidth && cursorPosX >= targetWidth-(this._controlField.outerHeight() || 20))
            this._activateIcon();
        else
            this._activateIcon(true);
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
            this._controlField.removeClass(FieldSet.allIconStyles).removeClass(styles.textboxIcon)
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
                this._controlField.addClass(styles.textboxIcon).addClass(
                    this._pageControl.credentials?.length ? styles.green : styles.orange);
            }
        }
    }

    /**
     * Method to change the icon style
     * @param deactivate Remove the 'active' style
     */
    private _activateIcon(deactivate?: boolean)
    {
        if(deactivate && !this._onIcon) return; // We don't have to deactivate when the cursor isn't on the icon

        this._onIcon = !deactivate;
        if(deactivate) {
            this._controlField?.css({cursor: ''}).attr('title', this._controlFieldTitle);
        } else {
            this._controlFieldTitle = this._controlField?.attr('title') || '';
            this._controlField?.css({cursor: 'pointer'}).attr('title', 'Open ChromeKeePass options');
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
}
