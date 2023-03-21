import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import * as IMessage from "../../IMessage";
import PickerFooter from './Footer';
import PickerIFrameInfo from './IFrameInfo';
import Item from './Item';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';

export interface IProps
{
    /** This can be either a credential array or a promise function that returns a credential array */
    credentials: IMessage.Credential[]|(()=>Promise<IMessage.Credential[]>);
    /** Called when the used selected a credential entry */
    onSelect: (cred: IMessage.Credential)=>void;
    /** We filter the credentials list based on this input */
    filterInput?: HTMLInputElement;
    /** Do not filter results based on `filterInput` */
    disableAutoComplete?: boolean;
    hideFooter?: boolean;
    /** Called when the options icon is clicked */
    onOpenOptions?: ()=>void;
}

export interface IPickerRef
{
    selectedCredential?: IMessage.Credential;
}

const PickerContent = styled(Box)(({ theme })=>({
    minHeight: 30,
    maxHeight: 200,
    overflowY: 'auto',
    '::-webkit-scrollbar': {
        height: '6px',
        width: '6px',
    },
    '::-webkit-scrollbar-track': {
        background: theme.palette.primary.contrastText,
        borderRadius: '3px',
    },
    '::-webkit-scrollbar-thumb': {
        background: theme.palette.primary.dark,
        borderRadius: '3px',
    },
}));

const PickerNoResult = styled(Box)(({ theme })=>({
    color: theme.palette.grey[500],
    textAlign: 'center',
    lineHeight: '50px',
}));

/**
 * Listen for input changes (there's a 250ms delay after each keypress to prevent rapid updates)
 * @param input The input element to attach to
 * @returns The current input string
 */
const useFilterInput = (input?: HTMLInputElement): string =>
{
    const [filterValue, setFilterValue] = React.useState('');
    const delayedSetFilterValue = React.useMemo(()=>{
        let timeout: number | undefined;

        return (filter: string)=>{
            clearTimeout(timeout); // Clear our previous timeout
            timeout = window.setTimeout(()=>setFilterValue(filter), 250); // We wait 250ms before passing the filter to the dropdown
        };
    }, []);

    // Attach and detach input events
    React.useEffect(()=>{
        if(input)
        {
            const onKeyUp = (ev: KeyboardEvent)=>
            {
                const newValue = (ev.target as HTMLInputElement).value ?? (ev.target as HTMLInputElement).defaultValue;
                delayedSetFilterValue(newValue);
            };

            input.addEventListener('keyup', onKeyUp);

            return ()=>{ // Dismount function
                input.removeEventListener('keyup', onKeyUp);
            };
        }
    }, [input]);

    return filterValue;
};

/**
 * Use arrow keys and enter to change and confirm selection
 * @param props Picker props
 * @returns current selected index
 */
const useInputControls = (onSelect: IProps['onSelect'], filterInput?: HTMLInputElement, credentials?: IMessage.Credential[]): number =>
{
    const [selectedCredIndex, setSelectedCredIndex] = React.useState(-1); // The default -1 means no selection

    // Attach and detach input events
    React.useEffect(()=>{
        if(filterInput && credentials)
        {
            let currentIndex = selectedCredIndex % credentials.length;

            const onKeyDown = (ev: KeyboardEvent)=>
            {
                switch(ev.key)
                {
                    case 'ArrowUp':
                    case 'ArrowDown':
                        ev.preventDefault(); // Prevent the keypress from moving the cursor
                        
                        if(ev.key === 'ArrowUp')
                            currentIndex = (currentIndex===0?credentials.length-1:(currentIndex-1) % credentials.length);
                        else
                            currentIndex = (currentIndex+1) % credentials.length;
                        
                        setSelectedCredIndex(currentIndex); // Set the new index state
                        break;
                    case 'Enter':
                        if(selectedCredIndex >= 0 && credentials[currentIndex]) // There's a selection?
                            onSelect(credentials[currentIndex]);
                        break;
                }
            };

            filterInput.addEventListener('keydown', onKeyDown);

            return ()=>{ // Dismount function
                filterInput.removeEventListener('keydown', onKeyDown);
            };
        }
    }, [filterInput, credentials, selectedCredIndex]);

    return selectedCredIndex;
};

/**
 * Fetch credentials based on "credentials" property
 * @param credentialsProp The Picker's credentials property
 * @returns [credentials array, fetch error]
 */
const useCredentials = (credentialsProp: IProps['credentials']): [IMessage.Credential[]|undefined, string|undefined] =>
{
    const [credentials, setCredentials] = React.useState<IMessage.Credential[]>();
    const [errorMessage, setErrorMessage] = React.useState<string>();

    React.useEffect(()=>{
        setErrorMessage(undefined); // Clear the errormessage if there is any

        if(credentialsProp instanceof Array) // The property already contains a credentials array?
            setCredentials(credentialsProp);
        else // The property is a Promise function, so it's going to be an async action
        {
            setCredentials(undefined); // Clear any potential previous items

            (async ()=>{
                try {
                    setCredentials(await credentialsProp());
                } catch(error) {
                    setErrorMessage(String(error));
                }
            })();
        }        
    }, [credentialsProp]);

    return [credentials, errorMessage];
};

const Picker = React.forwardRef<IPickerRef, IProps>((props, ref)=>
{
    const [credentials, credentialsErrorMessage] = useCredentials(props.credentials);

    // Filter credentials
    const filterValue = useFilterInput(props.filterInput);
    const [filteredCreds, setFilteredCreds] = React.useState<IMessage.Credential[]>([]);
    const selectedCredIndex = useInputControls(props.onSelect, props.filterInput, filteredCreds);
    React.useEffect(()=>{
        if(props.disableAutoComplete)
            setFilteredCreds(credentials || []);
        else
        {
            const filter = filterValue.toLowerCase();
            setFilteredCreds(credentials?.filter(f=>f.title.toLowerCase().indexOf(filter) >= 0 || f.username.toLowerCase().indexOf(filter) >= 0) || []);
        }
    }, [credentials, filterValue]);

    // Ref properties
    React.useImperativeHandle(ref, ()=>({
        selectedCredential: credentials?.[selectedCredIndex],
    }));

    // Render our dropdown
    return (<Grid container flexDirection='column' flex={1}>
        <Grid item flex={1}>
            <PickerContent>
                {filteredCreds.length ?
                    filteredCreds.map((cred, i)=>(
                        <Item
                            key={`cred${i}`}
                            isSelected={selectedCredIndex === i}
                            credential={cred}
                            onSelect={()=>props.onSelect(filteredCreds[i])}
                        />
                    ))
                : credentialsErrorMessage ?
                        <PickerNoResult>
                            <Alert severity='error'>{credentialsErrorMessage}</Alert>
                        </PickerNoResult>
                :(<>
                    <PickerNoResult>No credentials found</PickerNoResult>
                    <PickerIFrameInfo />
                </>)}
            </PickerContent>
        </Grid>

        {!props.hideFooter ?(
            <Grid item>
                <PickerFooter onOpenOptions={props.onOpenOptions} />
            </Grid>
        ): null}
    </Grid>);
});

export default Picker;
