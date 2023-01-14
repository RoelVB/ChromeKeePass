import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import { ISettings } from '../../Settings';
import { AppDispatch, RootState } from '../redux/Store';
import { saveSettings } from '../redux/Settings';

export interface IProps
{
    option: keyof ISettings|`theme.${keyof ISettings['theme']}`;
    description: string;
}

const SwitchOption: React.FC<IProps> = (props)=>
{
    const isSaving = useSelector((state: RootState) => state.settings.isSaving);
    const optionEnabled = useSelector((state: RootState) =>{
        const [ option, subOption ] = props.option.split('.') as [keyof ISettings, keyof ISettings['theme']];
        if(subOption)
            return (state.settings.settings as any)?.[option]?.[subOption] as boolean;
        else
            return state.settings.settings?.[option] as boolean;
    });
    const dispatch = useDispatch<AppDispatch>();

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

    return (<Grid item container alignItems='center'>
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
