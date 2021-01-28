import * as $ from 'jquery-slim';
import * as styles from "../scss/content.scss";
import * as IMessage from "../IMessage";
import Client from "./BackgroundClient";
import FieldSet from "./FieldSet";
import PageControl from "./PageControl";


/** A dropdown that displays the available credentials and allows to choose between them. */
export default class CredentialsDropdown {
    /** The actual dropdown. */
    private _dropdown?: JQuery;
    /** The credential items shown in the dropdown .*/
    private _credentialItems?: JQuery[];
    /** The field set that the drawer is opened for. */
    private _fieldSet?: FieldSet;

    /**
     * @param _pageControl The current page controller.
     */
    constructor(private readonly _pageControl: PageControl) {
    }

    /**
     * @return Whether or not the dropdown is currently opened.
     */
    public isOpen(): boolean {
        return this._dropdown !== undefined;
    }

    /**
     * @return Whether or not the dropdown currently has focus (and is opened).
     */
    public hasFocus(): boolean {
        return this._dropdown !== undefined && this._dropdown.is(':focus');
    }

    /**
     * Open the credentials dropdown.
     * @param fieldSet The field set to open the credential drawer for.
     */
    public open(fieldSet: FieldSet) {
        if (this.isOpen()) {
            if (fieldSet === this._fieldSet) {
                return; // Dropdown is already open
            }
            this.close();
        }
        const target = fieldSet.controlField;
        const targetOffset = target.offset();
        const theme = this._pageControl.settings.theme;
        // Create the dropdown
        this._dropdown = $('<div>').addClass(styles.dropdown).css({
            left: `${(targetOffset ? targetOffset.left : 0) - Math.max(theme.dropdownShadowWidth, 2)}px`,
            top: `${targetOffset && targetOffset.top + (target.outerHeight() || 10)}px`,
            width: `${target.outerWidth()}px`,
            'margin-bottom': `${Math.max(theme.dropdownShadowWidth, 2)}px`,
            'margin-right': `${Math.max(theme.dropdownShadowWidth, 2)}px`,
            'margin-left': `${Math.max(theme.dropdownShadowWidth, 2)}px`,
            'border-width': `${theme.dropdownBorderWidth}px`,
            'box-shadow': `0 ${theme.dropdownShadowWidth}px ${theme.dropdownShadowWidth}px 0 rgba(0,0,0,0.2)`,
        });
        if (this._dropdown === undefined) {
            return;
        }
        this._fieldSet = fieldSet;
        let style = this._dropdown.get(0).style;
        style.setProperty('--dropdown-select-background-start', theme.dropdownSelectedItemColorStart);
        style.setProperty('--dropdown-select-background-end', theme.dropdownSelectedItemColorEnd);

        // Generate the content
        const content = $('<div>').addClass(styles.content);
        this._generateDropdownContent(content, fieldSet.getCredentials());
        this._dropdown.append(content);

        if (theme.enableDropdownFooter) {
            // Create the footer and add it to the dropdown
            // noinspection HtmlRequiredAltAttribute,RequiredAttributes
            const footerItems: (JQuery | string)[] = [
                $('<img>').addClass(styles.logo).attr('src', chrome.extension.getURL('images/icon48.png'))
                    .attr('alt', ''),
                'ChromeKeePass',
                $('<img>').attr('src', chrome.extension.getURL('images/gear.png'))
                    .attr('alt', 'Open Settings').attr('title', 'Open settings').css({cursor: 'pointer'})
                    .on('click', CredentialsDropdown._openOptionsWindow.bind(this)),
                // $('<img>').attr('src', chrome.extension.getURL('images/key.png')).attr('title', 'Generate password').css({cursor: 'pointer'}),
            ];
            const footer = $('<div>').addClass(styles.footer).append(...footerItems);
            this._dropdown.append(footer);
        }

        // Show the dropdown
        $(document.body).append(this._dropdown);
    }

    /** Close the dropdown. */
    public close() {
        if (this._dropdown) {
            this._dropdown.remove();
            this._credentialItems = undefined;
            this._fieldSet?.selectCredential(undefined);
            this._fieldSet = undefined;
            this._dropdown = undefined;
        }
    }

    /**
     * Set the list of credentials that are shown in the dropdown.
     * @param credentials The list of credentials.
     */
    public setCredentials(credentials: IMessage.Credential[]) {
        if (this._dropdown === undefined) {
            return;
        }
        const target = this._dropdown.find(`.${styles.content}`);
        this._generateDropdownContent(target, credentials);
    }

    /**
     * Select the next credential in the list.
     * @param reverse Whether to select the previous or next.
     */
    public selectNextCredential(reverse?: boolean) {
        if (!(this._credentialItems && this._credentialItems.length)) { // There is something available?
            return;
        }
        let selectedIndex = this._credentialItems.findIndex((item) => item.hasClass(styles.selected));
        if (selectedIndex == -1) {
            selectedIndex = 0;
        } else {
            this._credentialItems[selectedIndex].removeClass(styles.selected);
            if (!reverse) {
                selectedIndex = selectedIndex++ % this._credentialItems.length;
            } else if (--selectedIndex < 0) { // Jump back to the last item if we get past the first item
                selectedIndex = this._credentialItems.length - 1;
            }
        }
        this._credentialItems[selectedIndex].addClass(styles.selected);
        this._fieldSet?.selectCredential(this._credentialItems[selectedIndex].data('credential'));
    }

    /**
     * Generate the html for the dropdown content.
     *
     * @param container The container for the credential items.
     * @param credentials The credentials to show in the dropdown.
     */
    private _generateDropdownContent(container: JQuery, credentials: IMessage.Credential[]) {
        if (credentials.length) {
            const items: JQuery[] = [];
            credentials.forEach((credential) => {
                items.push(
                    $('<div>').data('credential', credential).addClass(styles.item).append(
                        $('<div>').addClass(styles.primaryText).text(credential.title)
                    ).append(
                        $('<div>').text(credential.username)
                    ).on('click', this._onClickCredential.bind(this))
                );
            });
            this._credentialItems = items;
            container.empty().append(items);
        } else { // No credentials available
            this._credentialItems = undefined;
            container.empty().append($('<div>').addClass(styles.noResults).text('No credentials found'));
        }
    }

    /** Open the extension's option window. */
    private static _openOptionsWindow() {
        Client.openOptions();
    }

    /** Handle a click on a credential field. */
    private _onClickCredential(event: JQuery.ClickEvent) {
        this._fieldSet?.selectCredential($(event.target).closest(`.${styles.item}`).data('credential'));
        this._fieldSet?.enterSelection();
    }
}