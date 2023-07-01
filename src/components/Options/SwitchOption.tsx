import React from 'react';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import { ISettings } from '../../Settings';
import { useAppDispatch, useAppSelector } from '../redux/Store';
import { saveSettings } from '../redux/Settings';
import { SxProps, Theme } from '@mui/material/styles';

export interface IProps
{
    sx?: SxProps<Theme>;
    option: keyof ISettings|`theme.${keyof ISettings['theme']}`;
    description: string;
}

const SwitchOption: React.FC<IProps> = (props)=>
{
    const isSaving = useAppSelector(state=>state.settings.isSaving);
    const optionEnabled = useAppSelector(state=>{
        const [ option, subOption ] = props.option.split('.') as [keyof ISettings, keyof ISettings['theme']];
        if(subOption)
            return (state.settings.settings as any)?.[option]?.[subOption] as boolean;
        else
            return state.settings.settings?.[option] as boolean;
    });
    const dispatch = useAppDispatch();

    const setOption = React.useCallback((checked: boolean)=>{
        const [ option, subOption ] = props.option.split('.') as [keyof ISettings, keyof ISettings['theme']];

        if(subOption)
        {
            dispatch(saveSettings({
                [option]: {[subOption]: checked},
            }));
        }
        else
        {
            dispatch(saveSettings({
                [option]: checked,
            }));
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
