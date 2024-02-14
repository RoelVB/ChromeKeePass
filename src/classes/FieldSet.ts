import { ExtensionName, isElementVisible, enterCredential } from './Constants';

import PageControl from './PageControl';
import * as IMessage from '../IMessage';

const styles = {textboxIcon: 'CKP-textboxIcon', green: 'CKP-green', orange: 'CKP-orange', red: 'CKP-red'};

/**
 * Class for handling a set (username+password) fields
 */
export default class FieldSet
{
    /** Is the cursor currently on the KeePass icon? */
    private _onIcon: boolean = false;
    /** Did the click start on the KeePass icon? */
    private _iconOwnsClick: boolean = false;
    /** Variable holding all icon styles (to easily remove all the styles at once) */
    private static allIconStyles = [styles.green, styles.orange, styles.red];
    /**
     * This is the field where gonna use ChromeKeePass's controls.
     * Might me undefined, if neither the username nor the password field is visible.
     */
    private _controlField?: HTMLInputElement;
    /**
     * Used to remember the original title attribute from the username field
     * (because it changes when the cursor hovers the ChromeKeePass icon)
     */
    private _controlFieldTitle: string = '';
    /** A list of listener functions that are attached to the control field. So we can detach and re-attach them */
    private readonly _LISTENER_FUNCTIONS: Partial<Record<keyof HTMLElementEventMap, (this: HTMLInputElement, ev: any) => any>> = {};

    /**
     * Append ChromeKeePass to the fields
     * @param _pageControl A pointer back to the PageControl class
     * @param passwordField Pointer to the password field
     * @param usernameField Pointer to the username field
     */
    constructor(private _pageControl: PageControl, public readonly passwordField: HTMLInputElement, public readonly usernameField?: HTMLInputElement)
    {
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
        // Attach observer to the input fields
        if(this.usernameField) observer.observe(this.usernameField);
        observer.observe(this.passwordField);

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
                if (this._pageControl.credentials.length)
                {
                    this._controlField?.classList.remove(...FieldSet.allIconStyles);
                    this._controlField?.classList.add(styles.green);
                }
                else
                {
                    this._controlField?.classList.remove(...FieldSet.allIconStyles);
                    this._controlField?.classList.add(styles.orange);
                }
            }

            // Do we already have to fill the fields?
            if(this._pageControl.settings.autoFillSingleCredential && this._pageControl.credentials.length === 1)
                this._inputCredential(this._pageControl.credentials[0]);

        }
        else if (this._pageControl.settings.showUsernameIcon)
        {
            this._controlField?.classList.remove(...FieldSet.allIconStyles);
            this._controlField?.classList.add(styles.red);
        }
    }

    /** Credentials available for this page */
    public get credentials(): IMessage.Credential[]
    {
        return this._pageControl.credentials || [];
    }

    /**
     * @return The field that has the ChromeKeePass icon and should display the dropdown.
     */
    public get controlField(): HTMLInputElement | undefined
    {
        return this._controlField;
    }

    /** Enter the credentials into the fields */
    public enterCredentials(cred: IMessage.Credential)
    {
        this._inputCredential(cred);
        this._pageControl.dropdown.close();
    }

    /** Event when the username field gets focussed */
    private _onFocus(ev: FocusEvent) {
        // Show the dropdown on focus when enabled
        if(this._pageControl.settings.showDropdownOnFocus && !this._iconOwnsClick)
            this._pageControl.dropdown.open(this);
    }

    /**
     * Event when the username field loses focus.
     *
     * @param ev The focus lost event.
     */
    private _onFocusLost(ev: FocusEvent) {
        if (!this._pageControl.dropdown.hasGainedFocus(ev)) {
            this._pageControl.dropdown.close();
        }
    }

    /** Event when the mouse is clicked on the username field */
    private _onMouseDown(ev: MouseEvent) {
        if (this._onIcon) {
            this._iconOwnsClick = true;
        }
    }

    /** Event when the username field is clicked */
    private _onClick(ev: MouseEvent) {
        if (this._onIcon) { // Only continue if the cursor is on the icon
            ev.preventDefault();
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
    private _onKeyPress(ev: KeyboardEvent)
    {
        switch (ev.key)
        {
            case 'ArrowUp':
            case 'ArrowDown':
                ev.preventDefault(); // Else this action will move the cursor
                this._pageControl.dropdown.open(this)
                break;
            case 'Escape':
            case 'Tab':
                this._pageControl.dropdown.close();
                break;
        }
    }

    /** Event when a key was pressed in the username field */
    private _onKeyUp(ev: KeyboardEvent)
    {
        const newValue: string = (ev.target as HTMLInputElement).value ?? (ev.target as HTMLInputElement).defaultValue;

        if(newValue && this._pageControl.settings.autoComplete) // Is autocomplete enabled?
            this._pageControl.dropdown.open(this); // Try opening the dropdown
    }

    /** Event when te mouse is moving over the username field */
    private _onMouseMove(ev: MouseEvent)
    {
        if (this._controlField === undefined) {
            return;
        }
        const target = ev.target as HTMLInputElement;
        const targetOffset = target.getBoundingClientRect();
        const targetWidth = target.clientWidth;
        const cursorPosX: number | undefined = ev.pageX-targetOffset.left - parseInt(window.getComputedStyle(target).paddingLeft) - parseInt(window.getComputedStyle(target).paddingRight);

        if(cursorPosX && targetWidth && cursorPosX >= targetWidth-(this._controlField.offsetHeight || 20))
            this._activateIcon();
        else
            this._activateIcon(true);
    }

    /**
     * Choose a control field from the username and password field.
     */
    private _chooseControlField()
    {
        if (this.usernameField && isElementVisible(this.usernameField))
            this._setControlField(this.usernameField);
        else if (this.passwordField && isElementVisible(this.passwordField))
            this._setControlField(this.passwordField);
        else
            this._setControlField(); // We don't have a control field right now
    }

    /**
     * Add a listener function to be added to the control field.
     *
     * @param event The event name.
     * @param handler The event handler.
     */
    private _addListenerFunction<K extends keyof HTMLElementEventMap>(event: K, handler: (this: HTMLInputElement, ev: HTMLElementEventMap[K]) => any)
    {
        this._LISTENER_FUNCTIONS[event] = handler;
    }

    /**
     * Update the current control field.
     * @param newControlField The new control field.
     */
    private _setControlField(newControlField?: HTMLInputElement)
    {
        if (newControlField === this._controlField) // The controlField didn't change?
            return;

        // If we already have a controlField, detach listeners and remove the dropdown
        if (this._controlField)
        {
            for (const callbackName in this._LISTENER_FUNCTIONS)
                this._controlField.removeEventListener(callbackName, this._LISTENER_FUNCTIONS[callbackName as keyof HTMLElementEventMap]!);

            this._pageControl.dropdown.close();
            this._controlField.classList.remove(...FieldSet.allIconStyles, styles.textboxIcon);
        }

        // Setup the controlField
        this._controlField = newControlField;
        if (this._controlField)
        {
            // Disable Autofill on controlField. See https://stackoverflow.com/questions/15738259/disabling-chrome-autofill
            const inputType = this._controlField.getAttribute('type');
            const isAutofillField = inputType === 'email' || inputType === 'tel' || inputType === 'password' || this._controlField.getAttribute('name')?.toLowerCase()?.includes('email') || this._controlField.getAttribute('id')?.toLowerCase()?.includes('email');
            this._controlField.setAttribute('autocomplete', isAutofillField ? 'chrome-off' : 'off');

            // Attach listeners
            for (let callbackName in this._LISTENER_FUNCTIONS)
                this._controlField.addEventListener(callbackName, this._LISTENER_FUNCTIONS[callbackName as keyof HTMLElementEventMap]!);

            // Maybe we need to open the dropdown?
            if (this._pageControl.settings.showDropdownOnDetectionFocus && document.activeElement === this._controlField && this._pageControl.credentials?.length)
                this._pageControl.dropdown.open(this);

            // Should we show the icon in the username field?
            if (this._pageControl.settings.showUsernameIcon)
                this._controlField.classList.add(styles.textboxIcon, this._pageControl.credentials?.length ? styles.green : styles.orange);
            
        }
    }

    /**
     * Method to change the icon style
     * @param deactivate Remove the 'active' style
     */
    private _activateIcon(deactivate?: boolean)
    {
        if(deactivate && !this._onIcon) return; // We don't have to deactivate when the cursor isn't on the icon
        if(!this._controlField) return; // We have nothing to do here without a controlfield

        this._onIcon = !deactivate;
        if(deactivate)
        {
            this._controlField.style.cursor = '';
            this._controlField.setAttribute('title', this._controlFieldTitle || '');
        }
        else
        {
            const currentTitle = this._controlField.getAttribute('title') || '';
            if(currentTitle !== `Open ${ExtensionName} options`) this._controlFieldTitle = currentTitle;
            this._controlField.style.cursor = 'pointer';
            this._controlField.setAttribute('title', `Open ${ExtensionName} options`);
        }
    }

    /** Input a credential into the fields */
    private _inputCredential(credential: IMessage.Credential)
    {
        enterCredential(credential, this.usernameField, this.passwordField);
    }
}
