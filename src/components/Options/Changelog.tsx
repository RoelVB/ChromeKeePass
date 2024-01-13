import React from 'react';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import AlertTitle from '@mui/material/AlertTitle';
import ScienceIcon from '@mui/icons-material/Science';
import changelog from '../../changelog/changelog';
import { PaperGrid } from './Options';
import SwitchOption from './SwitchOption';
import { ExtensionName, isBeta } from '../../classes/Constants';
import { useAppDispatch, useAppSelector } from '../redux/Store';
import { saveSettings } from '../redux/Settings';

export interface IProps
{
    /** Previous version number */
    showUpdate: string | null;
}

const Changelog: React.FC<IProps> = (props)=>
{
    const dispatch = useAppDispatch();
    const hideTryBetaMsg = useAppSelector(state=>state.settings.settings?.hideTryBetaMsg);

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

    const disabledBetaMsg = React.useCallback(()=>{
        dispatch(saveSettings({hideTryBetaMsg: true}));
    }, []);

    return (<Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
        <SwitchOption
            sx={{width: 'auto', alignSelf: 'flex-end'}}
            option='showChangelogAfterUpdate'
            description={`Automtically open this changelog after ${ExtensionName} got updated`}
        />

        {!isBeta && hideTryBetaMsg === false ?(
            <Alert
                severity='info'
                icon={<ScienceIcon />}
                onClose={disabledBetaMsg}
            >
                <AlertTitle><strong>Try {ExtensionName} Bèta?</strong></AlertTitle>
                If you want to be the first to try the latest {ExtensionName} features, you could install the bèta version from <Link href={/^edge/i.test(ExtensionName)?'https://microsoftedge.microsoft.com/addons/detail/niekjejailhcgickepdfkhlblegbgecd':'https://chromewebstore.google.com/detail/ameocahhjkljlabpiajepcipkbcpjpep'} target='_blank'>the store</Link>.
            </Alert>
        ): null}

        {props.showUpdate ?(
            <Alert severity='success'>{ExtensionName} just updated from <strong>{props.showUpdate}</strong> to <strong>{VERSION}</strong></Alert>
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
