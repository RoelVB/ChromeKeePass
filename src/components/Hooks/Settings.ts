import React from 'react';
import { Mutex } from 'async-mutex';
import { log } from '../../classes/Constants';
import { ISettings, loadSettings } from '../../Settings';

const fetchingSettings = new Mutex();
let fetchedSettings: ISettings|undefined;

/**
 * This hooks fetches settings only once, even if it's used in multiple components
 * @returns settings
 */
export const useSettings = () =>
{
    const [settings, setSettings] = React.useState<ISettings>();

    React.useEffect(()=>{
        (async ()=>{
            if(fetchingSettings.isLocked()) // Some other component is already fetching the settings?
            {
                await fetchingSettings.waitForUnlock();
                setSettings(fetchedSettings);
            }
            else if(!fetchedSettings) // We need to fetch the settings
            {
                await fetchingSettings.runExclusive(async ()=>{
                    try {
                        fetchedSettings = await loadSettings();
                        setSettings(fetchedSettings);
                    } catch(error) {
                        log('error', 'Failed to load settings.', error);
                    }
                });
            }
            else // We already have loaded the settings
                setSettings(fetchedSettings);
        })();
    }, []);

    return settings;
};
