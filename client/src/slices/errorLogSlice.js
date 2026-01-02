import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const listErrorLogs = createAsyncThunk(
    'errorLogs/list',
    async ({ pageNumber = 1 }, { rejectWithValue }) => {
        try {
            const { data } = await api.get(`/errors?pageNumber=${pageNumber}`);
            return data;
        } catch (error) {
            return rejectWithValue(error.response && error.response.data.message ? error.response.data.message : error.message);
        }
    }
);

export const deleteErrorLog = createAsyncThunk(
    'errorLogs/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/errors/${id}`);
            return id;
        } catch (error) {
            return rejectWithValue(error.response && error.response.data.message ? error.response.data.message : error.message);
        }
    }
);

export const clearErrorLogs = createAsyncThunk(
    'errorLogs/clearAll',
    async (_, { rejectWithValue }) => {
        try {
            await api.delete('/errors');
        } catch (error) {
            return rejectWithValue(error.response && error.response.data.message ? error.response.data.message : error.message);
        }
    }
);

export const getUnreadCount = createAsyncThunk(
    'errorLogs/getUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/errors/unread');
            return data.count;
        } catch (error) {
            return rejectWithValue(error.response && error.response.data.message ? error.response.data.message : error.message);
        }
    }
);

export const markErrorsRead = createAsyncThunk(
    'errorLogs/markRead',
    async (_, { rejectWithValue }) => {
        try {
            await api.put('/errors/read');
        } catch (error) {
            return rejectWithValue(error.response && error.response.data.message ? error.response.data.message : error.message);
        }
    }
);

const errorLogSlice = createSlice({
    name: 'errorLogs',
    initialState: {
        logs: [],
        page: 1,
        pages: 1,
        loading: false,
        error: null,
        unreadCount: 0,
    },
    reducers: {
        incrementUnread: (state) => {
            state.unreadCount += 1;
        },
        resetUnread: (state) => {
            state.unreadCount = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(listErrorLogs.pending, (state) => {
                state.loading = true;
            })
            .addCase(listErrorLogs.fulfilled, (state, action) => {
                state.loading = false;
                state.logs = action.payload.logs;
                state.page = action.payload.page;
                state.pages = action.payload.pages;
            })
            .addCase(listErrorLogs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteErrorLog.fulfilled, (state, action) => {
                state.logs = state.logs.filter((log) => log._id !== action.payload);
            })
            .addCase(clearErrorLogs.fulfilled, (state) => {
                state.logs = [];
                state.unreadCount = 0;
            })
            .addCase(getUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })
            .addCase(markErrorsRead.fulfilled, (state) => {
                state.unreadCount = 0;
            });
    },
});

export const { incrementUnread, resetUnread } = errorLogSlice.actions;
export default errorLogSlice.reducer;
