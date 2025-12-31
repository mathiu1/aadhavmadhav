import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const getMessages = createAsyncThunk(
    'messages/getMessages',
    async (args, { rejectWithValue }) => {
        try {
            let userId, offset = 0, limit = 10;
            if (typeof args === 'object' && args !== null) {
                userId = args.userId;
                offset = args.offset || 0;
                limit = args.limit || 10;
            } else {
                userId = args;
            }

            const { data } = await api.get(`/messages/${userId}?limit=${limit}&offset=${offset}`, { withCredentials: true });
            return { data, offset, limit };
        } catch (error) {
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
        }
    }
);

export const sendMessage = createAsyncThunk(
    'messages/sendMessage',
    async ({ text, recipientId }, { rejectWithValue }) => {
        try {
            const { data } = await api.post(
                '/messages',
                { text, recipientId },
                { withCredentials: true }
            );
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
        }
    }
);

export const markAsRead = createAsyncThunk(
    'messages/markAsRead',
    async (userId, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/messages/read/${userId}`, {}, { withCredentials: true });
            return data;
        } catch (error) {
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
        }
    }
);

// Get global unread count (for navbar)
export const getUnreadCount = createAsyncThunk(
    'messages/getUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/messages/unread', { withCredentials: true });
            return data.count;
        } catch (error) {
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
        }
    }
);

export const deleteMessage = createAsyncThunk(
    'messages/deleteMessage',
    async (messageId, { rejectWithValue }) => {
        try {
            await api.delete(`/messages/${messageId}`, { withCredentials: true });
            return messageId;
        } catch (error) {
            return rejectWithValue(
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message
            );
        }
    }
);

const messageSlice = createSlice({
    name: 'messages',
    initialState: {
        messages: [],
        unreadCount: 0,
        isChatOpen: false,
        loading: false,
        error: null,
        hasMore: true,
    },
    reducers: {
        addMessage: (state, action) => {
            const exists = state.messages.find((m) => m._id === action.payload._id);
            if (!exists) {
                state.messages.push(action.payload);
            }
        },
        removeMessage: (state, action) => {
            state.messages = state.messages.filter((m) => m._id !== action.payload);
        },
        incrementUnreadCount: (state) => {
            state.unreadCount += 1;
        },
        resetUnreadCount: (state) => {
            state.unreadCount = 0;
        },
        toggleChat: (state, action) => {
            state.isChatOpen = action.payload !== undefined ? action.payload : !state.isChatOpen;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMessages.pending, (state) => {
                state.loading = true;
            })
            .addCase(getMessages.fulfilled, (state, action) => {
                state.loading = false;
                const { data, offset, limit } = action.payload;
                if (offset === 0) {
                    state.messages = data;
                } else {
                    state.messages = [...data, ...state.messages];
                }
                state.hasMore = data.length === limit;
            })
            .addCase(getMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                const exists = state.messages.find((m) => m._id === action.payload._id);
                if (!exists) {
                    state.messages.push(action.payload);
                }
            })
            .addCase(deleteMessage.fulfilled, (state, action) => {
                state.messages = state.messages.filter((m) => m._id !== action.payload);
            })
            .addCase(getUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })
            .addCase(markAsRead.fulfilled, (state) => {
                state.unreadCount = 0;
            });
    },
});

export const { addMessage, removeMessage, incrementUnreadCount, resetUnreadCount, toggleChat } = messageSlice.actions;

export default messageSlice.reducer;
