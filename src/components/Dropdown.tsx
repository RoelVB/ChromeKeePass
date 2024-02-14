import React from 'react';
import { createRoot } from 'react-dom/client';
import { styled } from '@mui/material/styles';
import Popper from '@mui/material/Popper';
import { v4 as uuid } from 'uuid';
import * as IMessage from "../IMessage";
import { log } from '../classes/Constants';
import Wrapper from './Wrapper';
import Picker from './Picker/Picker';
import { useSettings } from './Hooks/Settings';

export interface IProps
{
    anchorEl: Element;
    credentials: IMessage.Credential[];
    onOpenOptions?: ()=>void;
    onSelect: (cred: IMessage.Credential)=>void;
}

const DropdownContainer = styled(Popper)(({ theme })=>({
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.grey[500]}`,
    boxShadow: `0 0 6px 0 rgba(0,0,0,0.2)`,
    borderRadius: '2px',
    minWidth:  '225px',
    zIndex: 999999999,
    overflow: 'hidden',
}));

const Dropdown: React.FC<IProps> = (props)=>
{
    const settings = useSettings();

    // Keep track of the anchor element's width
    const [minWidth, setMinWidth] = React.useState<number|undefined>(props.anchorEl.clientWidth);
    React.useEffect(()=>{
        if(props.anchorEl.clientWidth < 225) // Input is smaller then our minimum width?
            setMinWidth(undefined);
        else
            setMinWidth(props.anchorEl.clientWidth);
    }, [props.anchorEl.clientWidth]);

    // Render our dropdown
    return (<Wrapper>
        <DropdownContainer
            sx={{minWidth: minWidth}}
            open
            disablePortal // Mount this inside the parent element (by default it's mounted directly inside the body)
            anchorEl={props.anchorEl}
            modifiers={[
                {
                    name: 'offset',
                    enabled: true,
                    options: {
                        offset: [0, 2],
                    },
                },
            ]}
        >
            <Picker
                filterInput={props.anchorEl as HTMLInputElement}
                disableAutoComplete={!(settings?.autoComplete ?? true)}
                credentials={props.credentials}
                onSelect={props.onSelect}
                onOpenOptions={props.onOpenOptions}
                hideFooter={!(settings?.theme.enableDropdownFooter ?? true)}
            />
        </DropdownContainer>
    </Wrapper>);
};

/**
 * Open a dropdown
 * @param props Dropdown props
 * @returns [Dropdown ID, function to close the dropdown]
 */
export const open = (props: IProps): [string, ()=>void] =>
{
    const id = `ckpInput-${uuid()}`;

    log('debug', `Opening dropdown (${id})`);
    const container = document.createElement('div');
    container.id = id;
    document.querySelector('html')!.append(container); // Mount in outside of the body, because the body can be pushed down by the EmbeddedPicker

    const reactContainer = createRoot(container);
    reactContainer.render(<Dropdown {...props} />);

    const close = ()=>{
        log('debug', `Closing dropdown (${id})`);

        reactContainer.unmount();
        const container = document.getElementById(id);
        container?.remove();
    };

    return [id, close];
};

/** Check if the dropdown with a certain ID exists */
export const isOpen = (id: string): boolean =>
{
    return Boolean(document.getElementById(id));
};

/**
 * Check if the event caused the dropdown to gain focus.
 * > Only element with `tabindex="0"` will work, all others will be ignored (this is because element without this attribute will not appear in `relatedTarget`)
 * @param id Check if this dropdown ID gained focus
 * @param ev Focus event
 * @return Wether the dropdown gained focus
 */
export const hasGainedFocus = (id: string, ev: FocusEvent): boolean =>
{
    const dropdownEl = document.getElementById(id);
    if(dropdownEl && ev.relatedTarget instanceof HTMLElement)
        return dropdownEl.contains(ev.relatedTarget);
    else
        return false;
};

export default Dropdown;
