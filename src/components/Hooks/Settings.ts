import { create } from 'zustand';
import { log } from '../../classes/Constants';
import { ISettings, loadSettings, saveSettings } from '../../Settings';

interface SettingsState
{
    settings?: ISettings;
    isLoading: boolean;
    isSaving: boolean;
    errorMsg?: string;
    loadSettings: ()=>void;
    saveSettings: (settings: Partial<ISettings>)=>void;
}

export const useSettings = create<SettingsState>()((set, get, store) => ({
    isLoading: false,
    isSaving: false,
    loadSettings: async ()=>{
        if(!get().isLoading)
        {
            log('debug', 'Load settings');
            try {
                set({isLoading: true, errorMsg: undefined});
                set({settings: await loadSettings()});
            } catch(error) {
                console.error('Failed to load settings.', error);
                set({errorMsg: `Failed to load settings. ${String(error)}`});
            } finally {
                set({isLoading: false});
            }
        }
    },
    saveSettings: async (settings)=>{
        log('debug', 'Saving settings', settings);
        try {
            set({isSaving: true, errorMsg: undefined});
            await saveSettings(settings);

            if(get().settings) // We already have settings loaded?
                set(state => ({settings: {...state.settings!, ...settings}})); // Merge new settings with the original
            else
                get().loadSettings(); // Load all settings
        } catch(error) {
            console.error('Failed to save settings.', error);
            set({errorMsg: `Failed to save settings. ${String(error)}`});
        } finally {
            set({isSaving: false});
        }
    },
}));

export default useSettings;
