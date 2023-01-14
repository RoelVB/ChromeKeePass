import { configureStore } from '@reduxjs/toolkit';
import settings from './Settings';

export const store = configureStore({
    reducer: {
        settings,
    },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
