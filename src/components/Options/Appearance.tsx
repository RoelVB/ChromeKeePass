import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { PaperGrid } from './Options';
import SwitchOption from './SwitchOption';

const Appearance: React.FC = ()=>
{
    return (<Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
        <Typography>Dropdown</Typography>
        <PaperGrid gridProps={{flexDirection: 'column'}}>
            <SwitchOption
                option='theme.enableDropdownFooter'
                description='Show footer in credentials dropdown'
            />
        </PaperGrid>
    </Box>);
};

export default Appearance;
