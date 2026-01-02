import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const getSiteConfig = createAsyncThunk('content/getConfig', async () => {
    const { data } = await api.get('/config');
    return data;
});

export const updateSiteConfig = createAsyncThunk('content/updateConfig', async (configData) => {
    const { data } = await api.put('/config', configData);
    return data;
});

export const initConfig = createAsyncThunk('content/initConfig', async () => {
    const { data } = await api.post('/config/init');
    return data;
});

const contentSlice = createSlice({
    name: 'content',
    initialState: {
        config: null,
        loading: false,
        error: null,
        updateSuccess: false
    },
    reducers: {
        resetUpdateSuccess: (state) => {
            state.updateSuccess = false;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSiteConfig.pending, (state) => {
                state.loading = true;
            })
            .addCase(getSiteConfig.fulfilled, (state, action) => {
                state.loading = false;
                state.config = action.payload;
            })
            .addCase(getSiteConfig.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(updateSiteConfig.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateSiteConfig.fulfilled, (state, action) => {
                state.loading = false;
                state.updateSuccess = true;
                state.config = action.payload;
            })
            .addCase(updateSiteConfig.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(initConfig.pending, (state) => {
                state.loading = true;
            })
            .addCase(initConfig.fulfilled, (state, action) => {
                state.loading = false;
                state.config = action.payload;
            })
            .addCase(initConfig.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const { resetUpdateSuccess } = contentSlice.actions;
export default contentSlice.reducer;
