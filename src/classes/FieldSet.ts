import * as $ from 'jquery-slim';
import * as styles from '../scss/content.scss';

import PageControl from './PageControl';
import * as IMessage from '../IMessage';
import Client from '../classes/BackgroundClient';

/**
 * Class for handling a set (username+password) fields
 */
export default class FieldSet
{
    /** Pointer to the dropdown */
    private _dropdown?: JQuery;
    /** Timestamp from when the dropdown is closed, to prevent is from opening again directly after closing */
    private _dropdownCloseTime?: number;
    /** Timestamp from when the dropdown is opened, to prevent is from closing directly after opening */
    private _dropdownOpenTime?: number;
    /** Pointers to the credentials shown in the dropdown */
    private _credentialItems?: JQuery[];
    /** Index of the credentials selected from `_credentialItems` */
    private _selectedCredentialIndex?: number;
    /** The selected credentials from `_credentialItems` */
    private _selectedCredential?: IMessage.Credential;
    /** Holds the old value for the username field, so we only react when the value changes */
    private _oldUsernameValue: string = '';
    /** Is the cursor currently on the KeePass icon? */
    private _onIcon: boolean = false;
    /** Variable holding all icon styles (to easily remove all the styles at once) */
    private static allIconStyles = `${styles.green} ${styles.orange} ${styles.red}`;
    /** This is the field where gonna use ChromeKeePass's controls */
    private readonly _controlField: JQuery = $('<input>'); // Input a dummy `<div>`, because TypeScript will complain the variable could be undefined
    /** Used to remember the original title attribute from the username field (because it changes when the cursor hovers the ChromeKeePass icon) */
    private readonly _controlFieldTitle: string = '';

    /**
     * Append ChromeKeePass to the fields
     * @param _pageControl A pointer back to the PageControl class
     * @param passwordField Pointer tot the password field
     * @param usernameField Pointer to the username field
     */
    constructor(private _pageControl: PageControl, public readonly passwordField: JQuery, public readonly usernameField?: JQuery)
    {
        this._controlField = this.usernameField || this.passwordField;

        this._controlFieldTitle = this._controlField.attr('title') || '';
        this._controlField.attr('autocomplete', 'off');

        this._controlField.on('mousemove', this._onMouseMove.bind(this)).on('mouseleave', this._activateIcon.bind(this, true)).on('focus', this._onFocus.bind(this));
        this._controlField.on('click', this._onClick.bind(this)).on('keydown', this._onKeyPress.bind(this)).on('keyup', this._onKeyUp.bind(this));

        // Maybe we need to open the dropdown?
        if(this._pageControl.settings.showDropdownOnFocus && this._controlField.is(':focus'))
            this._openDropdown(this._controlField);

        // Should we show the icon in the username field?
        if(this._pageControl.settings.showUsernameIcon)
            this._controlField.addClass(styles.textboxIcon).addClass(styles.orange);

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
                if(this._pageControl.credentials.length)
                    this._controlField.removeClass(FieldSet.allIconStyles).addClass(styles.green);
                else
                    this._controlField.removeClass(FieldSet.allIconStyles).addClass(styles.orange);
            }
            
            if(this._dropdown) // Is the dropdown open?
                this._generateDropdownContent(this._dropdown.find(`.${styles.content}`));

            // Do we already have to fill the fields?
            if(this._pageControl.settings.autoFillSingleCredential && this._pageControl.credentials.length === 1)
                this._inputCredential(this._pageControl.credentials[0]);

        }
        else if(this._pageControl.settings.showUsernameIcon)
            this._controlField.removeClass(FieldSet.allIconStyles).addClass(styles.red);
    }

    /** Event when the username field gets focussed */
    private _onFocus(_event: JQuery.FocusEvent)
    {
        if(this._pageControl.settings.showDropdownOnFocus) // Show the dropdown when this happens?
            this._openDropdown(this._controlField);
    }

    /** Event when the username field is clicked */
    private _onClick(e: JQuery.ClickEvent)
    {
        if(this._onIcon) // Only continue if the cursor is on the icon
        {
            e.preventDefault();

            if(this._dropdown)
                this.closeDropdown();
            else
                this._openDropdown(this._controlField);
        }
    }

    /** Event when a key is pressed while in the username field */
    private _onKeyPress(e: JQuery.KeyDownEvent)
    {
        switch(e.key)
        {
            case 'ArrowUp':
                e.preventDefault(); // Else this action will move the cursor
                this._selectNextCredential(true);
                break;
            case 'ArrowDown':
                e.preventDefault(); // Else this action will move the cursor
                this._selectNextCredential();
                break;
            case 'Enter':
                this._enterSelection();
                break;
            case 'Escape':
            case 'Tab':
                this.closeDropdown();
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
                if(this._dropdown === undefined) // The dropdown is not there
                    this._openDropdown(this._controlField); // Try opening the dropdown

                if(this._dropdown) // The dropdown is open?
                    this._generateDropdownContent(this._dropdown.find(`.${styles.content}`), newValue);
            }
        }
    }

    /** Event when te mouse is moving over the username field */
    private _onMouseMove(e: JQuery.MouseMoveEvent)
    {
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
     * Method to change the icon style
     * @param deactivate Remove the 'active' style
     */
    private _activateIcon(deactivate?: boolean)
    {
        if(deactivate && !this._onIcon) return; // We don't have to deactivate when the cursor isn't on the icon

        this._onIcon = !deactivate;
        if(deactivate)
            this._controlField.css({cursor: ''}).attr('title', this._controlFieldTitle);
        else
            this._controlField.css({cursor: 'pointer'}).attr('title', 'Open ChromeKeePass options');
    }

    /**
     * Open the credentials dropdown under the `target`
     * @param target 
     */
    private _openDropdown(target: JQuery)
    {
        if(this._dropdown !== undefined) return; // Dropdown is already open
        if((new Date()).getTime() - (this._dropdownCloseTime || 0) < 1000) return; // The dropdown was closed less than a second ago, it doesn't make sense to open it again so quickly
        this._dropdownOpenTime = (new Date()).getTime();

        const targetOffset = target.offset();

        // Create the dropdown
        this._dropdown = $('<div>').addClass(styles.dropdown).css({
            left: `${targetOffset && targetOffset.left}px`, 
            top: `${targetOffset && targetOffset.top + (target.outerHeight() || 10)}px`, 
            width: `${target.outerWidth()}px`
        });

        const footerItems: (JQuery<HTMLElement>|string)[] = [
            $('<img>').addClass(styles.logo).attr('src', chrome.extension.getURL('images/icon48.png')),
            'ChromeKeePass',
            $('<img>').attr('src', chrome.extension.getURL('images/gear.png')).attr('title', 'Open settings').css({cursor: 'pointer'}).click(this._openOptionsWindow.bind(this)),
            // $('<img>').attr('src', chrome.extension.getURL('images/key.png')).attr('title', 'Generate password').css({cursor: 'pointer'}),
        ];
        const footer = $('<div>').addClass(styles.footer).append(...footerItems);

        // Generate the content
        const content = $('<div>').addClass(styles.content);
        this._generateDropdownContent(content);
        
        // Add the content en footer to the dropdown and show it
        this._dropdown.append(content).append(footer);
        $(document.body).append(this._dropdown);
    }

    /** Close the dropdown */
    public closeDropdown()
    {
        if(this._dropdown)
        {
            if((new Date()).getTime() - (this._dropdownOpenTime || 0) < 500) return; // The dropdown was opened less than 0.5 seconds ago, it doesn't make sense to close it again so quickly

            this._dropdown.remove();
            this._credentialItems = undefined;
            this._selectedCredential = undefined;
            this._selectedCredentialIndex = undefined;
            this._dropdown = undefined;
            this._dropdownCloseTime = (new Date()).getTime();
        }
    }

    /**
     * Generate the HTML for the credential items to display
     * @param target The generated content will be inserted into this element
     * @param filter Optional text to filter credentials on
     */
    private _generateDropdownContent(target: JQuery, filter?: string)
    {
        let credentials: IMessage.Credential[] = [];
        if(this._pageControl.credentials instanceof Array) // Do we have credentials available for this page?
        {
            if(filter) // Do we need to filter?
            {
                filter = filter.toLowerCase();
                credentials = this._pageControl.credentials.filter(credential=>
                    credential.title.toLowerCase().indexOf(filter as string) !== -1
                    || credential.username.toLowerCase().indexOf(filter as string) !== -1
                );
            }
            else // No filter
                credentials = this._pageControl.credentials;
        }
        
        if(credentials.length)
        {
            const items: JQuery[] = [];

            credentials.forEach((credential)=>{
                items.push(
                    $('<div>').data('credential', credential).addClass(styles.item).append(
                        $('<div>').addClass(styles.primaryText).text(credential.title)
                    ).append(
                        $('<div>').text(credential.username)
                    ).on('click', this._onClickCredential.bind(this))
                );
            });

            this._credentialItems = items;
            target.empty().append(items);

            if(items.length === 1) // Is there only one item?
                this._selectNextCredential(); // Select it

        }
        else // No credentials available
        {
            this._credentialItems = undefined;
            this._selectedCredential = undefined;
            this._selectedCredentialIndex = undefined;
            target.empty().append($('<div>').addClass(styles.noResults).text('There are no credentials found'));
        }
    }

    /** Event when a credential item is clicked */
    private _onClickCredential(e: JQuery.ClickEvent)
    {
        this._selectedCredential = $(e.target).closest(`.${styles.item}`).data('credential');
        this._enterSelection();
    }

    /**
     * Select the next credential in `_credentialItems`
     * @param reverse Select previous
     */
    private _selectNextCredential(reverse?: boolean)
    {
        if(this._dropdown === undefined) // The dropdown is not there
            this._openDropdown(this._controlField); // Try opening the dropdown
        
        if(this._credentialItems && this._credentialItems.length) // There is something available?
        {
            if(this._selectedCredentialIndex !== undefined) // There's something selected?
            {
                if(this._credentialItems[this._selectedCredentialIndex]) this._credentialItems[this._selectedCredentialIndex].removeClass(styles.selected); // Unselect current credential
                if(reverse)
                {
                    if(--this._selectedCredentialIndex < 0) this._selectedCredentialIndex = this._credentialItems.length-1; // Jump back to the last item if we get past the first item
                }
                else
                {
                    if(++this._selectedCredentialIndex >= this._credentialItems.length) this._selectedCredentialIndex = 0; // Jump back to the first item if we get past the last item
                }
            }
            else // There was no selection yet
                this._selectedCredentialIndex = 0;

            this._credentialItems[this._selectedCredentialIndex].addClass(styles.selected);
            this._selectedCredential = this._credentialItems[this._selectedCredentialIndex].data('credential');
        }
    }

    /** Enter the selected credentials into the fields */
    private _enterSelection()
    {
        if(!this._dropdown) return; // We don't want to do this when the dropdown isn't open
        
        if(this._selectedCredential)
        {
            this._inputCredential(this._selectedCredential);

            this._selectedCredential = undefined;
            this._selectedCredentialIndex = undefined;

            this.closeDropdown();
        }
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

    /** Open the extension's option window */
    private static _openOptionsWindow()
    {
        Client.openOptions();
    }
}
