import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ISettings, loadSettings as settingsLoadSettings, saveSettings as settingsSaveSettings } from '../../Settings';

export interface SettingsState
{
    isLoading: boolean;
    isSaving: boolean;
    errorMessage?: string;
    settings?: ISettings;
}

const initialState: SettingsState = {
    isLoading: false,
    isSaving: false,
};

export const loadSettings = createAsyncThunk(
    'settings/loadSettings',
    settingsLoadSettings,
);

export const saveSettings = createAsyncThunk(
    'settings/saveSettings',
    settingsSaveSettings,
);

export const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {

    },
    extraReducers: (builder) => {
        // Load settings
        builder.addCase(loadSettings.pending, (state, action)=>{
            state.isLoading = true;
            state.errorMessage = undefined;
        })
        .addCase(loadSettings.rejected, (state, action)=>{
            state.errorMessage = String(action.error);
        })
        .addCase(loadSettings.fulfilled, (state, action)=>{
            state.isLoading = false;
            state.settings = action.payload;
        });

        // Save settings
        builder.addCase(saveSettings.pending, (state, action)=>{
            state.isSaving = true;
            state.errorMessage = undefined;
        })
        .addCase(saveSettings.rejected, (state, action)=>{
            state.errorMessage = String(action.error);
        })
        .addCase(saveSettings.fulfilled, (state, action)=>{
            state.isSaving = false;
            state.settings = {...state.settings, ...action.meta.arg as ISettings};
        });
    },
});

export const settingsActions = settingsSlice.actions;

export default settingsSlice.reducer;
