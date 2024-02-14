import PageControl from "./PageControl";
import * as IMessage from '../IMessage';
import { elementIsEnabledInput, enterCredential, log } from "./Constants";
import { open as openPicker } from "../components/EmbeddedPicker/EmbeddedPicker";

/** This class is responsible for handling fields that are not detected and handled by PageControl */
export default class UncontrolledFields
{
    /** The HTML-element that was clicked to open the contextmenu */
    private _contextMenuElement?: HTMLElement;

    constructor(private _pageControl: PageControl)
    {
        document.addEventListener('contextmenu', (ev)=>{ // This is to remember the element that was clicked when opening the contextmenu
            this._contextMenuElement = ev.target as HTMLElement;
        });

        const msgHandler = (message: IMessage.Request) =>
        {
            if(message.type === IMessage.RequestType.contextMenuFillUserPass)
                this._fillUserPass();
            else if(message.type === IMessage.RequestType.contextMenuFillUser)
                this._fillUser();
            else if(message.type === IMessage.RequestType.contextMenuFillPass)
                this._fillPass();
        };

        // Listen for events from the contextmenu
        chrome.runtime.onMessage.addListener(msgHandler);

        // Listen for messages when in automated testing
        if(navigator.webdriver)
        {
            window.addEventListener('message', ev=>{
                if(ev.data?.constructor === Object) // We got a dict?
                    msgHandler(ev.data);
            });
        }
    }

    private _fillUser()
    {
        const textInput = this._contextMenuTextInput;
        if(textInput)
        {
            log('debug', '"Fill user" was triggered on input:', textInput);
            this._openPicker(textInput, null);
        }
        else
        {
            log('debug', '"Fill user" was triggered outside of an enabled input');
            this._openPicker(undefined, null);
        }
    }

    private _fillPass()
    {
        const textInput = this._contextMenuTextInput;
        if(textInput)
        {
            log('debug', '"Fill password" was triggered on input:', textInput);
            this._openPicker(null, textInput);
        }
        else
        {
            log('debug', '"Fill password" was triggered outside of an enabled input');
            this._openPicker(null, undefined);
        }
    }

    private _fillUserPass()
    {
        const textInput = this._contextMenuTextInput;
        if(textInput)
        {
            log('debug', '"Fill user + password" was triggered on input:', textInput);

            // Check if the clicked input is controlled by PageControl
            const fieldSet = this._pageControl.findFieldSet(textInput);
            if(fieldSet)
                this._pageControl.dropdown.open(fieldSet);
            else // An uncontrolled field was clicked
            {
                if(textInput.getAttribute('type')?.toLowerCase() === 'password') // The clicked field is a password field?
                {
                    log('debug', '"Fill user + password" was triggered on a password input');
                    const newFieldSet = this._pageControl.createFieldSet(textInput);
                    if(newFieldSet)
                        this._pageControl.dropdown.open(newFieldSet);
                    else
                        log('warn', 'Failed to create FieldSet for field:', textInput);
                }
                else
                {
                    log('debug', '"Fill user + password" was triggered on a text input (no password input)');
                    this._openPicker(textInput);
                }
            }
        }
        else
        {
            log('debug', '"Fill user + password" was triggered outside of an enabled input');
            this._openPicker();
        }
    }

    private _openPicker(usernameField?: HTMLInputElement|null, passwordField?: HTMLInputElement|null)
    {
        const closePicker = openPicker({
            credentials: this._pageControl.credentials,
            usernameField,
            passwordField,
            onClose: ()=>closePicker(),
            onSelect: (cred, user, pass)=>{
                enterCredential(cred, user, pass);
                closePicker();
            },
        });
    }

    /** Return the element clicked when opening the contextmenu, if this element is an enabled text/password input */
    get _contextMenuTextInput(): HTMLInputElement | undefined
    {
        if(this._contextMenuElement)
            return elementIsEnabledInput(this._contextMenuElement);
    }

}
