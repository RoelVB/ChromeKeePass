import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { ExtensionName } from '../../classes/Constants';
import { PaperGrid } from './Options';
import SwitchOption from './SwitchOption';
import { useShortcuts } from '../Hooks/Shortcuts';

/** Open shortcuts management page */
const openShortcuts = ()=>
{
    chrome.tabs.create({
        url: 'chrome://extensions/shortcuts',
    });
};

const Behaviour: React.FC = ()=>
{
    const [ shortcuts, shortcutsErrorMsg ] = useShortcuts();

    return (<Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
        <Typography>Input</Typography>
        <PaperGrid gridProps={{flexDirection: 'column'}}>
            <SwitchOption
                option='showUsernameIcon'
                description={`Show ${ExtensionName} icon in username/password fields`}
            />
            <Divider />
            <SwitchOption
                option='autoFillSingleCredential'
                description='Automatically fill credentials if only a single entry is found'
            />
            <Divider />
            <SwitchOption
                option='autoComplete'
                description='Show matching credentials while typing in the username/password field'
            />
        </PaperGrid>

        <Typography>Dropdown</Typography>
        <PaperGrid gridProps={{flexDirection: 'column'}}>
            <SwitchOption
                option='showDropdownOnFocus'
                description='Open when username/password field gains focus'
            />
            <Divider />
            <SwitchOption
                option='showDropdownOnDetectionFocus'
                description='Open when username/password field is focussed on detection'
            />
            <Divider />
            <SwitchOption
                option='showDropdownOnClick'
                description='Open when clicking username/password field'
            />
        </PaperGrid>

        <Typography>Shortcuts</Typography>
        <PaperGrid gridProps={{flexDirection: 'column'}}>
            {shortcutsErrorMsg ? <Alert severity='error'>{shortcutsErrorMsg}</Alert> : null}

            {shortcuts?.map((shortcut)=>(<Box key={shortcut.name}>
                <Grid item sx={{p: 2}}>
                    {shortcut.description}: {shortcut.shortcut || '<Unassigned>'}
                </Grid>
                <Divider />
            </Box>))}
            <Grid item sx={{pl: 2}}>
                <Typography variant='caption'>
                    You can change shortcuts using the Extensions &gt; Keyboard Shortcuts options
                    <IconButton onClick={openShortcuts} title='Open the shortcuts manager'>
                        <OpenInNewIcon />
                    </IconButton>
                </Typography>
            </Grid>
        </PaperGrid>
    </Box>);
};

export default Behaviour;
