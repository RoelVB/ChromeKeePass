import React from 'react';
import { styled } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Client from '../../classes/BackgroundClient';
import * as IMessage from "../../IMessage";
import { open as openDropdown, hasGainedFocus } from '../Dropdown';
import { useSettings } from '../Hooks/Settings';

export interface IProps
{
    onSelect: (cred: IMessage.Credential)=>void;
    credentails: IMessage.Credential[] | undefined;
}

const SmallAlert = styled(Alert)(()=>({
    paddingTop: 0,
    paddingBottom: 0,
}));

export const CredentialPicker: React.FC<IProps> = (props)=>
{
    const dropdown = React.useRef<ReturnType<typeof openDropdown>>();
    const [credentails, setCredentials] = React.useState(props.credentails);
    const [errorMsg, setErrorMsg] = React.useState<string>();
    const settings = useSettings();

    // Close the dropdown when this element unmounts
    React.useEffect(()=>{
        return ()=>dropdown.current?.[1]();
    }, []);

    // Load credentials
    React.useEffect(()=>{
        Client.findCredentials().then(setCredentials).catch(error=>setErrorMsg(`An error occurred fetching credentials. ${String(error)}`));
    }, []);

    const onBlur = React.useCallback((ev: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement, Element>)=>{
        if(dropdown.current && !hasGainedFocus(dropdown.current[0], ev as unknown as FocusEvent))
            dropdown.current[1]();
    }, []);

    // Auto select single credential if that's enabled in the settings
    React.useEffect(()=>{
        if(credentails?.length === 1 && settings?.autoFillSingleCredential)
            props.onSelect(credentails[0]);
    }, [credentails, settings]);

    return (<>
        {errorMsg ?(
            <SmallAlert severity='error'>{errorMsg}</SmallAlert>
        ): !credentails ?(<>
            <CircularProgress />
            <Typography variant='caption'>Loading...</Typography>
        </>):(
            <TextField
                variant='standard'
                placeholder='Filter'
                autoFocus
                onFocus={ev=>{
                    dropdown.current = openDropdown({
                        anchorEl: ev.target,
                        credentials: credentails,
                        onSelect: props.onSelect,
                    });
                }}
                onBlur={onBlur}
            />
        )}
    </>);
};
