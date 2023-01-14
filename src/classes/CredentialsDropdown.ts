import Client from "./BackgroundClient";
import FieldSet from "./FieldSet";
import { open as dropdownOpen, isOpen as dropdownIsOpen, hasGainedFocus as dropdownHasGainedFocus } from '../components/Dropdown';

/** A dropdown that displays the available credentials and allows to choose between them. */
export default class CredentialsDropdown
{
    /** The dropdown's ID */
    private _dropdownId?: string;
    /** Method to close the dropdown */
    private _dropdownClose?: ()=>void;
    /** The field set that the dropdown is opened for */
    private _fieldSet?: FieldSet;

    /**
     * @return Whether or not the dropdown is currently opened.
     */
    public get isOpen(): boolean
    {
        return this._dropdownId?dropdownIsOpen(this._dropdownId):false;
    }

    /**
     * @return Whether or not the event caused an element in the dropdown to gain focus.
     */
    public hasGainedFocus(ev: FocusEvent): boolean
    {
        if(this._dropdownId)
            return dropdownHasGainedFocus(this._dropdownId, ev);
        else
            return false;
    }

    /**
     * Open the credentials dropdown.
     * @param fieldSet The field set to open the dropdown for
     */
    public open(fieldSet: FieldSet)
    {
        if(!this.isOpen || fieldSet !== this._fieldSet) // The dropdown is not showing or for another fieldset?
        {
            // Close any other dropdown
            this.close();

            // Remember the fieldset we've opened a dropdown for
            this._fieldSet = fieldSet;

            // Open the dropdown
            [this._dropdownId, this._dropdownClose] = dropdownOpen({
                anchorEl: fieldSet.controlField!,
                credentials: fieldSet.credentials,
                onOpenOptions: this._openOptionsWindow.bind(this),
                onSelect: (cred)=>this._fieldSet?.enterCredentials(cred),
            });
        }
    }

    /** Close the dropdown. */
    public close()
    {
        if(this._dropdownClose)
        {
            this._dropdownClose();
            this._fieldSet = undefined;
            this._dropdownId = undefined;
            this._dropdownClose = undefined;
        }
    }

    /** Open the extension's option window. */
    private _openOptionsWindow()
    {
        Client.openOptions();
        this.close();
    }

}
