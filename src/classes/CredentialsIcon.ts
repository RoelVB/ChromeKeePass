import * as $ from 'jquery-slim';
import * as styles from "../scss/content.scss";
import PageControl from "./PageControl";


/** An icon that is displayed on the control field and can open and close the credentials dropdown. */
export default class CredentialsIcon {
    /** The KeePass icon in the control field. */
    private readonly _credentialsIcon: JQuery;
    /** Control field resize observer. */
    private readonly _resizeObserver: undefined | ResizeObserver = undefined;
    /** Whether or not the control field was wrapped in an element. */
    private readonly _isWrapped: boolean = false;

    /**
     * Create and attach a new credentials icon to the control field.
     * @param _pageControl The current page controller.
     * @param _controlField The input field in which to display the icon.
     * @param onClickCallback A callback to invoke when the icon was clicked.
     */
    constructor(private readonly _pageControl: PageControl,
                private _controlField: JQuery, onClickCallback: () => void) {
        // Create the username icon
        // noinspection HtmlRequiredAltAttribute,RequiredAttributes
        this._credentialsIcon = $('<img>')
            .attr('alt', 'Open the credentials dropdown').attr('title', 'Open the credentials dropdown')
            .attr('tabindex', '0').addClass(styles.textBoxIcon).on('click', (event) => {
                event.preventDefault();
                onClickCallback()
            });
        this._reposition();
        this.updateStyle();
        _controlField.offsetParent().append(this._credentialsIcon);
        const icon = this._credentialsIcon.get(0);
        if (icon.offsetParent === null && icon.parentElement !== document.documentElement) {
            // Some html elements don't display an additional child. Create our own offset parent in this case.
            this._credentialsIcon.remove();
            _controlField.wrap($('<div>').addClass(styles.textBoxIconContainer).css({
                width: '100%',
                height: '100%',
            }));
            this._isWrapped = true;
            this._reposition();
            _controlField.offsetParent().append(this._credentialsIcon);
        }
        if (window.ResizeObserver) {
            this._resizeObserver = new ResizeObserver(_ => this._reposition());
            this._resizeObserver.observe(_controlField.get(0))
        }
    }

    /**
     * @return Whether or not the event caused the icon to gain focus.
     */
    public hasGainedFocus(event: JQuery.FocusOutEvent): boolean {
        return event.relatedTarget instanceof HTMLElement && this._credentialsIcon.get(0) === event.relatedTarget;
    }

    /** Update the style of the username icon to reflect the current availability of credentials. */
    public updateStyle() {
        let iconStyle = 'red';
        if (this._pageControl.credentials) {
            iconStyle = this._pageControl.credentials.length ? 'green' : 'orange';
        }
        this._credentialsIcon.attr('src', chrome.extension.getURL(`images/icon48_${iconStyle}.png`));
    }

    /** Remove the icon from it's control field. */
    public remove() {
        this._resizeObserver?.disconnect();
        this._credentialsIcon.remove();
        if (this._isWrapped) {
            this._controlField.unwrap();
        }
    }

    /** Update the position and size of the icon. */
    private _reposition() {
        const fieldWidth = this._controlField.outerWidth() || 48
        const size = Math.min(fieldWidth, this._controlField.outerHeight() || 48);
        const position = this._controlField.position();
        this._credentialsIcon.css({
            height: `${size}px`,
            width: `${size}px`,
            left: `${position.left + parseFloat(this._controlField.css('margin-left')) + fieldWidth - size}px`,
            top: `${position.top + parseFloat(this._controlField.css('margin-top'))}px`,
            'min-height': `${size}px`,
            'min-width': `${size}px`,
            'border-radius': `${size / 2.0}px`,
        })
    }
}
