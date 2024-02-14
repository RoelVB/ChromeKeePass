import React from 'react';
import { createRoot } from 'react-dom/client';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import * as IMessage from "../../IMessage";
import { log } from '../../classes/Constants';
import Wrapper from '../Wrapper';
import { FieldPicker } from './FieldPicker';
import { CredentialPicker } from './CredentialPicker';

export interface IProps
{
    /** The username input we're going to fill. `null` = we don't need this field, `undefined` = we want to pick a field for this */
    usernameField?: HTMLInputElement | null;
    /** The password input we're going to fill. `null` = we don't need this field, `undefined` = we want to pick a field for this */
    passwordField?: HTMLInputElement | null;
    /** Available credentials */
    credentials: IMessage.Credential[] | undefined;
    onSelect: (cred: IMessage.Credential, usernameField: HTMLInputElement | undefined, passwordField: HTMLInputElement | undefined)=>void;
    onClose: ()=>void;
}

const pickerId = 'ckpEmbeddedPicker';
const bodyClass = 'CKP-bodyDown';

const PickerWrapper = styled(Box)(({ theme })=>({
    position: 'fixed',
    left: 0,
    top: 0,
    right: 0,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 3,
    backgroundImage: `linear-gradient(to right, ${theme.palette.secondary.main}, ${theme.palette.primary.dark})`,
    borderBottom: `1px solid ${theme.palette.grey[500]}`,
    boxShadow: `0 0 6px 0 rgba(0,0,0,0.2)`,
    zIndex: 999999999,
}));

const ContentWrapper: React.FC<React.PropsWithChildren<{}>> = (props)=>(<Box sx={{display:'flex', alignItems:'center', gap:1}}>
    <img src={chrome.runtime.getURL('images/icon48.png')} style={{height:32}} />
    {props.children}
</Box>);

const EmbeddedPicker: React.FC<IProps> = (props)=>
{
    const [cred, setCred] = React.useState<IMessage.Credential>();
    const [usernameField, setUsernameField] = React.useState(props.usernameField);
    const [passwordField, setPasswordField] = React.useState(props.passwordField);

    // Check if everything we needed was selected
    React.useEffect(()=>{
        if(cred && usernameField !== undefined && passwordField !== undefined)
            props.onSelect(cred, usernameField || undefined, passwordField || undefined);
    }, [props.onSelect, cred, usernameField, passwordField]);

    // Handle keydown-event
    const onKeyDown = React.useCallback((ev: KeyboardEvent)=>{
        if(ev.key === 'Escape')
        {
            log('debug', 'EmbeddedPicker closed by pressing Escape-key');
            props.onClose();
        }
    }, [props.onClose]);
    React.useEffect(()=>{
        document.addEventListener('keydown', onKeyDown);
        return ()=>document.removeEventListener('keydown', onKeyDown);
    }, [onKeyDown]);

    return (<Wrapper>
        <PickerWrapper>
            <ContentWrapper>
                {cred === undefined?(
                    <CredentialPicker
                        onSelect={setCred}
                        credentails={props.credentials}
                    />
                ): usernameField === undefined ?(
                    <FieldPicker
                        description={<>Select the field where you want to enter the <strong>username</strong></>}
                        onPicked={setUsernameField}
                    />
                ): passwordField === undefined ?(
                    <FieldPicker
                        description={<>Select the field where you want to enter the <strong>password</strong></>}
                        onPicked={setPasswordField}
                        ignoreFields={usernameField?[usernameField]:undefined}
                    />
                ): null}
            </ContentWrapper>
            <IconButton onClick={props.onClose}>
                <CloseIcon sx={{color:'white'}} />
            </IconButton>
        </PickerWrapper>
    </Wrapper>);
};

/**
 * Open the picker
 * @param props Picker props
 * @returns Function to close the picker
 */
export const open = (props: IProps) =>
{
    log('debug', `Opening embedded picker`);
    const container = document.createElement('div');
    container.id = pickerId;
    document.querySelector('html')!.append(container); // Mount in outside of the body, because the body can be pushed down by the EmbeddedPicker

    const reactContainer = createRoot(container);
    reactContainer.render(<EmbeddedPicker {...props} />);
    document.body.classList.add(bodyClass);

    const close = ()=>{
        log('debug', `Closing embedded picker`);

        reactContainer.unmount();
        const container = document.getElementById(pickerId);
        container?.remove();
        document.body.classList.remove(bodyClass);
    };

    return close;
};
