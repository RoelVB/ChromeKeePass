import React from 'react';
import { createRoot } from 'react-dom/client';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Client from '../classes/BackgroundClient';
import Wrapper from './Wrapper';
import { FooterContainer } from './Picker/Footer';
import { useAssociation } from './Hooks/Association';

export interface IProps
{
    
}

const PopupContainer = styled(Box)(({ theme })=>({
    minWidth: 225,
    height: 30,
}));

const Popup: React.FC<IProps> = (props)=>
{
    const [status] = useAssociation();

    return (<Wrapper>
        <PopupContainer>
            <FooterContainer>
                <img src={chrome.extension.getURL('images/icon48.png')} />
                <Typography component='div' variant='body1' sx={{fontWeight:'bold'}}>
                    {status === 'checking' ?
                        'Getting status...'
                    : status === 'associating' ?
                        'Connecting...'
                    : status === 'associated' ?
                        'Connected'
                    : 
                        'Not connected'
                    }
                </Typography>
                <Link component='img' title='Open options' tabIndex={0} src={chrome.extension.getURL('images/gear.png')} sx={{cursor: 'pointer'}} onClick={Client.openOptions} />
            </FooterContainer>
        </PopupContainer>
    </Wrapper>);
};

/**
 * Mount component into HTMLElement
 * @param container Element to mount in
 * @param props Popup props
 * @returns Function to unmount the component
 */
export const mount = (container: HTMLElement, props: IProps): ()=>void =>
{
    const reactContainer = createRoot(container);
    reactContainer.render(<Popup {...props} />);

    return reactContainer.unmount;
};

export default Popup;
