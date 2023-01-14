import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { ExtensionName } from '../../classes/Constants';
import Typography from '@mui/material/Typography';

export interface IProps
{
    onOpenOptions?: ()=>void;
}

/** Footer styling */
export const FooterContainer = styled(Box)(({ theme })=>({
    display: 'flex',
    justifyContent: 'space-between',
    height: '30px',
    lineHeight: '23px',
    fontSize: '14px',
    backgroundImage: `linear-gradient(to right, ${theme.palette.secondary.main}, ${theme.palette.primary.dark})`,
    borderTop: `1px solid ${theme.palette.grey[500]}`,
    padding: '3px',
    color: theme.palette.secondary.main,
    textShadow: '0 0 2px black',
    boxSizing: 'border-box',
}));

/** The dropdown footer */
const Footer: React.FC<IProps> = (props)=>
{
    return (<FooterContainer>
        <img src={chrome.extension.getURL('images/icon48.png')} />
        <Typography component='div' variant='body1' sx={{fontWeight:'bold'}}>{ExtensionName}</Typography>
        {props.onOpenOptions ?
            <Link component='img' title='Open options' tabIndex={0} src={chrome.extension.getURL('images/gear.png')} sx={{cursor: 'pointer'}} onClick={props.onOpenOptions} />
        : <Box />}
    </FooterContainer>);
};

export default Footer;
