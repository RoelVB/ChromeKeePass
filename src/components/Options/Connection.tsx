import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { useAssociation } from '../Hooks/Association';
import { PaperGrid } from './Options';
import { useAppDispatch, useAppSelector } from '../redux/Store';
import { defaultSettings } from '../../Settings';
import Button from '@mui/material/Button';
import { saveSettings } from '../redux/Settings';
import { log } from '../../classes/Constants';
import CircularProgress from '@mui/material/CircularProgress';

const AssociationStatus: React.FC = ()=>
{
    const settings = useAppSelector(state=>state.settings.settings);
    const [status, associationId, associationError, associate] = useAssociation([settings?.keePassHost, settings?.keePassPort]);

    if(status === 'checking')
    {
        return (<>
            Checking...
            <CircularProgress sx={{ml: 1}} size={20} />
        </>);
    }
    else if(status === 'associating')
    {
        return (<>
            Connecting... accept the connection in KeePass
            <CircularProgress sx={{ml: 1}} size={20} />
        </>);
    }
    else if(status === 'associated')
        return <>Connected as '{associationId}'</>;
    else if(associationError)
        return <Alert severity='error'>{associationError}</Alert>;
    else
    {
        return (<>
            Not connected
            <Button
                variant='contained'
                size='small'
                sx={{ml: 1}}
                onClick={associate}
            >
                Connect
            </Button>
        </>);
    }
};

const Connection: React.FC = ()=>
{
    const [ inputHost, setInputHost ] = React.useState<string>();
    const [ inputPort, setInputPort ] = React.useState<number>();
    const [settings, isSaving] = useAppSelector(state=>[state.settings.settings, state.settings.isSaving]);
    const dispatch = useAppDispatch();

    /** Host or port changed? */
    const canApply = React.useMemo(()=>{
        return (
            (inputHost && inputHost !== settings?.keePassHost) // Host changed
            || (inputPort && inputPort !== settings?.keePassPort) // Port changed
        );
    }, [inputHost, inputPort, settings?.keePassHost, settings?.keePassPort]);

    /** Save host and port */
    const onApply = React.useCallback(()=>{
        log('debug', `Apply KeePassHttp settings (${inputHost || defaultSettings.keePassHost}:${inputPort || defaultSettings.keePassPort})`);
        dispatch(saveSettings({
            keePassHost: inputHost || defaultSettings.keePassHost,
            keePassPort: inputPort || defaultSettings.keePassPort,
        }));
    }, [inputHost, inputPort]);

    return (<Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
        <Typography>Status</Typography>
        <PaperGrid gridProps={{alignItems: 'center'}}>
            <AssociationStatus />
        </PaperGrid>

        <Typography>KeePassHttp settings</Typography>
        <PaperGrid gridProps={{flexDirection: 'column', gap: 1}}>
            <Grid item container alignItems='center'>
                <TextField
                    sx={{width: '250px'}}
                    variant='filled'
                    size='small'
                    label='Hostname / IP address'
                    value={inputHost ?? (settings?.keePassHost || defaultSettings.keePassHost)}
                    onChange={ev=>setInputHost(ev.target.value)}
                />
                <Typography>:</Typography>
                <TextField
                    sx={{width: '120px'}}
                    type='number'
                    variant='filled'
                    size='small'
                    label='Port'
                    value={inputPort ?? (settings?.keePassPort || defaultSettings.keePassPort)}
                    onChange={ev=>setInputPort(Number(ev.target.value))}
                />
            </Grid>
            <Grid item>
                <Button
                    variant='contained'
                    disabled={isSaving || !canApply}
                    onClick={onApply}
                >
                    Apply
                </Button>
            </Grid>
        </PaperGrid>
    </Box>);
};

export default Connection;
