import React from 'react';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import changelog from '../../changelog/changelog';
import { PaperGrid } from './Options';
import SwitchOption from './SwitchOption';
import { ExtensionName } from '../../classes/Constants';

export interface IProps
{
    /** Previous version number */
    showUpdate: string | null;
}

const Changelog: React.FC<IProps> = (props)=>
{
    // Order by version number
    const versions = React.useMemo(()=>{
        return changelog.versions.sort((a,b)=>{
            if(a.version > b.version)
                return -1;
            else if(a.version < b.version)
                return 1;
            else
                return 0;
        });
    }, []);

    return (<Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
        <SwitchOption
            sx={{width: 'auto', alignSelf: 'flex-end'}}
            option='showChangelogAfterUpdate'
            description={`Automtically open this changelog after ${ExtensionName} got updated`}
        />

        {props.showUpdate ?(
            <Alert severity='info'>{ExtensionName} just updated from <strong>{props.showUpdate}</strong> to <strong>{VERSION}</strong></Alert>
        ): null}

        {versions.map(update=>(<React.Fragment key={update.version}>
            <Typography>{update.version==='current'?`Current | ${VERSION}`:update.version}</Typography>
            <PaperGrid gridProps={{flexDirection: 'column', gap: 1}}>
                {update.changes.map((change,i)=>(<Box key={`${update.version}-${i}`} sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                    <Chip
                        label={`${change.type.substring(0,1).toUpperCase()}${change.type.substring(1)}`}
                        color={change.type==='new'?'success':change.type==='fix'?'error':'info'}
                    />
                    {change.description}
                </Box>))}
            </PaperGrid>
        </React.Fragment>))}
    </Box>);
};

export default Changelog;
