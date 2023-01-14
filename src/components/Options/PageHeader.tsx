import React from 'react';
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import { ExtensionName } from '../../classes/Constants';

const StyledAppBar = styled(AppBar)(({ theme })=>({
    backgroundImage: `linear-gradient(to right, ${theme.palette.secondary.main}, ${theme.palette.primary.dark})`,
    color: theme.palette.secondary.main,
    textShadow: '0 0 2px black',
    fontWeight: 'bold',
    fontSize: '22px',
}));

const PageHeader: React.FC = ()=>
{
    return (<StyledAppBar position='sticky'>
        <Toolbar variant='dense' sx={{gap: 2}}>
            <Avatar src={chrome.extension.getURL('images/icon48.png')} alt='CKP logo' />
            <Box>
                {ExtensionName}: Options
            </Box>
        </Toolbar>
    </StyledAppBar>);
};

export default PageHeader;
