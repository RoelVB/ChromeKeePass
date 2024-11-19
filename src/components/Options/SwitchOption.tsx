import React from 'react';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import { SxProps, Theme } from '@mui/material/styles';
import { ISettings } from '../../Settings';
import useSettings from '../Hooks/Settings';

export interface IProps
{
    sx?: SxProps<Theme>;
    option: keyof ISettings|`theme.${keyof ISettings['theme']}`;
    description: string;
}

const SwitchOption: React.FC<IProps> = (props)=>
{
    const isSaving = useSettings(state=>state.isSaving);
    const optionEnabled = useSettings(state=>{
        const [ option, subOption ] = props.option.split('.') as [keyof ISettings, keyof ISettings['theme']];
        if(subOption)
            return (state.settings as any)?.[option]?.[subOption] as boolean;
        else
            return state.settings?.[option] as boolean;
    });
    const saveSettings = useSettings(state=>state.saveSettings);

    const setOption = React.useCallback((checked: boolean)=>{
        const [ option, subOption ] = props.option.split('.') as [keyof ISettings, keyof ISettings['theme']];

        if(subOption)
        {
            saveSettings({
                [option]: {[subOption]: checked},
            });
        }
        else
        {
            saveSettings({
                [option]: checked,
            });
        }
    }, [props.option])

    return (<Grid id={`switchOption-${props.option}`} sx={props.sx} item container alignItems='center'>
        <Grid item>
            <Switch
                disabled={isSaving}
                checked={optionEnabled}
                onChange={(ev)=>setOption(ev.target.checked)}
            />
        </Grid>
        <Grid item>
            {props.description}
        </Grid>
    </Grid>);
};

export default SwitchOption;
