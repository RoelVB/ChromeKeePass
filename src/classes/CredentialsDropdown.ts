import * as styles from "../scss/content.scss";
import * as IMessage from "../IMessage";
import Client from "./BackgroundClient";
import FieldSet from "./FieldSet";
import PageControl from "./PageControl";

const copyIcon = require('../assets/copy_to_clipboard.svg')


/** A dropdown that displays the available credentials and allows to choose between them. */
export default class CredentialsDropdown {
    /** The actual dropdown. */
    private _dropdown?: HTMLDivElement;
    /** The credential items shown in the dropdown .*/
    private _credentialItems?: HTMLElement[];
    /** The field set that the drawer is opened for. */
    private _fieldSet?: FieldSet;
    /** Window resize handler. */
    private readonly _RESIZE_HANDLER = (ev: UIEvent) => this._reposition();
    /** A map for credentials linked to dropdown items */
    private _dropdownCredentials = new Map<HTMLElement, IMessage.Credential>();

    /**
     * @param _pageControl The current page controller.
     */
    constructor(private readonly _pageControl: PageControl) {
    }

    /**
     * @return Whether or not the dropdown is currently opened.
     */
    public get isOpen(): boolean {
        return this._dropdown !== undefined;
    }

    /**
     * @return Whether or not the event caused an element in the dropdown to gain focus.
     */
    public hasGainedFocus(ev: FocusEvent): boolean
    {
        return Boolean(ev.relatedTarget instanceof HTMLElement && this._dropdown?.contains(ev.relatedTarget));
    }

    /**
     * Open the credentials dropdown.
     * @param fieldSet The field set to open the credential drawer for.
     */
    public open(fieldSet: FieldSet) {
        if (this.isOpen) {
            if (fieldSet === this._fieldSet) {
                return; // Dropdown is already open
            }
            this.close();
        }
        const theme = this._pageControl.settings.theme;

        // Create the dropdown
        this._dropdown = document.createElement('div');
        this._dropdown.classList.add(styles.dropdown);
        this._dropdown.style.left = '0px';
        this._dropdown.style.top = '0px';
        this._dropdown.style.marginBottom = `${Math.max(theme.dropdownShadowWidth, 2)}px`;
        this._dropdown.style.marginRight = `${Math.max(theme.dropdownShadowWidth, 2)}px`;
        this._dropdown.style.marginLeft = `${Math.max(theme.dropdownShadowWidth, 2)}px`;
        this._dropdown.style.borderWidth = `${theme.dropdownBorderWidth}px`;
        this._dropdown.style.boxShadow = `0 ${theme.dropdownShadowWidth}px ${theme.dropdownShadowWidth}px 0 rgba(0,0,0,0.2)`;
        this._dropdown.style.setProperty('--dropdown-select-background-start', theme.dropdownSelectedItemColorStart);
        this._dropdown.style.setProperty('--dropdown-select-background-end', theme.dropdownSelectedItemColorEnd);
        this._dropdown.style.setProperty('--scrollbar-color', theme.dropdownScrollbarColor);

        this._fieldSet = fieldSet;

        // Generate the content
        const content = document.createElement('div');
        content.classList.add(styles.content);
        this._generateDropdownContent(content, fieldSet.getCredentials());
        this._dropdown.append(content);

        if (theme.enableDropdownFooter)
        {
            const footerLogo = document.createElement('img');
            footerLogo.classList.add(styles.logo);
            footerLogo.setAttribute('src', chrome.extension.getURL('images/icon48.png'));
            footerLogo.setAttribute('alt', '');

            const footerSettings = document.createElement('img');
            footerSettings.setAttribute('src', chrome.extension.getURL('images/gear.png'));
            footerSettings.setAttribute('tabindex', '0');
            footerSettings.setAttribute('alt', 'Open settings');
            footerSettings.setAttribute('title', 'Open settings');
            footerSettings.style.cursor = 'pointer';
            footerSettings.addEventListener('click', this._openOptionsWindow.bind(this));

            const footer = document.createElement('div');
            footer.classList.add(styles.footer);
            footer.append(footerLogo, 'ChromeKeePass', footerSettings);
            this._dropdown.append(footer);
        }
        // Show the dropdown
        document.body.append(this._dropdown);
        this._reposition();
        window.addEventListener('resize', this._RESIZE_HANDLER);
    }

    /** Close the dropdown. */
    public close() {
        if (this._dropdown)
        {
            window.removeEventListener('resize', this._RESIZE_HANDLER);
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
        const target = this._dropdown.querySelector<HTMLElement>(`.${styles.content}`);
        if(target) this._generateDropdownContent(target, credentials);
    }

    /**
     * Select the next credential in the list.
     * @param reverse Whether to select the previous or next.
     */
    public selectNextCredential(reverse?: boolean) {
        if (!(this._credentialItems && this._credentialItems.length)) { // There is something available?
            return;
        }
        let selectedIndex = this._credentialItems.findIndex((item) => item.classList.contains(styles.selected));
        if (selectedIndex == -1) {
            selectedIndex = 0;
        } else {
            this._credentialItems[selectedIndex].classList.remove(styles.selected);
            if (!reverse) {
                selectedIndex = ++selectedIndex % this._credentialItems.length;
            } else if (--selectedIndex < 0) { // Jump back to the last item if we get past the first item
                selectedIndex = this._credentialItems.length - 1;
            }
        }
        this._credentialItems[selectedIndex].classList.add(styles.selected);
        this._credentialItems[selectedIndex].scrollIntoView({
            behavior: "auto",
            block: "nearest"
        });
        this._fieldSet?.selectCredential(this._dropdownCredentials.get(this._credentialItems[selectedIndex]));
    }

    /** Recalculate the position of the dropdown. */
    private _reposition() {
        if (this._dropdown === undefined || this._fieldSet === undefined) {
            return;
        }
        const target = this._fieldSet.controlField;
        if (target === undefined) {
            return;
        }

        const bodyIsOffsetParent = this._dropdown.offsetParent === document.body;
        const bodyWidth = Math.max(document.body.offsetWidth || 0, window.innerWidth);
        const bodyHeight = Math.max(document.body.offsetHeight || 0, window.innerHeight);
        const targetOffset = target.getBoundingClientRect();
        const theme = this._pageControl.settings.theme;
        const minWidth = 225;
        const targetWidth = target.clientWidth || minWidth;
        let left = (targetOffset.left || 0) - Math.max(theme.dropdownShadowWidth, 2);
        if (targetWidth < minWidth) {
            left -= (minWidth - targetWidth) / 2.0;
        }
        if (left < scrollX) {
            left = scrollX - Math.max(theme.dropdownShadowWidth, 2);
        } else if (left + scrollX + minWidth > bodyWidth) {
            left = bodyWidth - minWidth - Math.max(theme.dropdownShadowWidth, 2);
        }
        let top = (targetOffset.top || 0) + (target.clientHeight || 10);
        const dropdownHeight = this._dropdown.offsetHeight || 0;
        if (top - scrollY + dropdownHeight > bodyHeight) {
            const offset = dropdownHeight + (target.clientHeight || 0);
            if (bodyHeight - top >= top || top - offset < scrollY) {
                top = scrollY + bodyHeight - dropdownHeight;
            } else {
                top -= offset;
            }
        }
        if (bodyIsOffsetParent) {
            top -= parseFloat(window.getComputedStyle(document.body).marginTop) + parseFloat(window.getComputedStyle(document.body).borderTopWidth);
            left -= parseFloat(window.getComputedStyle(document.body).marginLeft) + parseFloat(window.getComputedStyle(document.body).borderLeftWidth);
        }

        this._dropdown.style.left = `${left}px`;
        this._dropdown.style.top = `${top}px`;
        this._dropdown.style.width = `${targetWidth}px`;
    }

    /**
     * Generate the html for the dropdown content.
     *
     * @param container The container for the credential items.
     * @param credentials The credentials to show in the dropdown.
     */
    private _generateDropdownContent(container: HTMLElement, credentials: IMessage.Credential[]) {
        if (credentials.length)
        {
            this._dropdownCredentials.clear();

            const items: HTMLElement[] = [];
            credentials.forEach((credential) => {
                const item = document.createElement('div');
                this._dropdownCredentials.set(item, credential);
                item.classList.add(styles.item);
                item.setAttribute('tabindex', '0');
                item.style.padding = `${this._pageControl.settings.theme.dropdownItemPadding}px`;

                const primaryText = document.createElement('div');
                primaryText.classList.add(styles.primaryText);
                primaryText.textContent = credential.title;
                item.append(primaryText);

                const username = document.createElement('div');
                username.textContent = credential.username;
                item.append(username);
                item.addEventListener('click', this._onClickCredential.bind(this));

                items.push(item);
            });
            this._credentialItems = items;
            container.innerHTML = '';
            container.append(...items);

            if(items.length === 1) // Is there only one item?
                this.selectNextCredential(); // Select it

        } else { // No credentials available
            this._credentialItems = undefined;
            this._fieldSet?.selectCredential(undefined);

            const noResults = document.createElement('div');
            noResults.classList.add(styles.noResults);
            noResults.textContent = 'No credentials found';
            container.innerHTML = '';
            container.append(noResults);

            if (self != top) // We are in an iframe?
            {
                const iframeInfo = document.createElement('div');
                iframeInfo.classList.add(styles.iframeInfo);
                
                const infoText = document.createElement('div');
                infoText.textContent = 'This input is part of a website that is embedded into the current website. Your passwords should be registered with the following URL:';
                iframeInfo.append(infoText);

                const urlInput = document.createElement('input');
                urlInput.setAttribute('readonly', 'readonly');
                urlInput.setAttribute('type', 'url');
                urlInput.value = self.location.origin;
                
                const copyToClipboardIcon = document.createElement('div');
                copyToClipboardIcon.classList.add(styles.copyIcon);
                copyToClipboardIcon.innerHTML = copyIcon;
                copyToClipboardIcon.setAttribute('tabindex', '0');
                copyToClipboardIcon.setAttribute('title', 'Copy to clipboard');
                copyToClipboardIcon.addEventListener('click', ev=>{
                    ev.preventDefault();
                    this._copyIframeUrl(copyToClipboardIcon, urlInput);
                });
                
                const inputWrapper = document.createElement('div');
                inputWrapper.classList.add(styles.inputWrapper);
                inputWrapper.append(urlInput, copyToClipboardIcon);

                container.append(iframeInfo);
            }
        }
    }

    /** Open the extension's option window. */
    private _openOptionsWindow() {
        Client.openOptions();
        this.close();
    }

    /**
     * Copy the url of the current iframe into the clipboard.
     * @param icon The icon that was clicked.
     * @param urlInput The input element that contains the url of the current iframe.
     */
    private _copyIframeUrl(icon: HTMLElement, urlInput: HTMLInputElement)
    {
        urlInput.select();
        const success = document.execCommand('copy');
        if (success) {
            icon.classList.add(styles.success);
            setTimeout(() => icon.classList.remove(styles.success), 3000);
        }
        this._fieldSet?.controlField?.focus();
    }

    /** Handle a click on a credential field. */
    private _onClickCredential(ev: MouseEvent)
    {
        const item: HTMLElement | null = (ev.target as HTMLElement).closest(`.${styles.item}`);
        if(!item) return;

        this._fieldSet?.selectCredential(this._dropdownCredentials.get(item));
        this._fieldSet?.enterSelection();
    }

}
