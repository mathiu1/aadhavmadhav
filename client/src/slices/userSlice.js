import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
    users: [],
    loading: false,
    error: null,
    user: null, // For edit/details
    updateSuccess: false,
    page: 1,
    pages: 1,
    count: 0
};

// Admin: Get all users
export const listUsers = createAsyncThunk(
    'user/listUsers',
    async ({ keyword = '', pageNumber = 1, pageSize = '' } = {}, thunkAPI) => {
        try {
            let query = `?keyword=${keyword}&pageNumber=${pageNumber}`;
            if (pageSize) query += `&pageSize=${pageSize}`;

            const { data } = await api.get(`/users${query}`, { withCredentials: true });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Delete user
export const deleteUser = createAsyncThunk(
    'user/deleteUser',
    async (id, thunkAPI) => {
        try {
            await api.delete(`/users/${id}`, { withCredentials: true });
            return id;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Get user details
export const getUserDetails = createAsyncThunk(
    'user/getUserDetails',
    async (id, thunkAPI) => {
        try {
            const { data } = await api.get(`/users/${id}`, { withCredentials: true });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Update user
export const updateUser = createAsyncThunk(
    'user/updateUser',
    async (user, thunkAPI) => {
        try {
            const { data } = await api.put(`/users/${user._id}`, user, { withCredentials: true });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        resetUserUpdate: (state) => {
            state.updateSuccess = false;
        },
        incrementMessageCount: (state, action) => {
            const userId = action.payload;
            const user = state.users.find((u) => u._id === userId);
            if (user) {
                user.unreadMessageCount = (user.unreadMessageCount || 0) + 1;
            }
        },
        decrementMessageCount: (state, action) => {
            const userId = action.payload;
            const user = state.users.find((u) => u._id === userId);
            if (user && user.unreadMessageCount > 0) {
                user.unreadMessageCount -= 1;
            }
        },
        resetMessageCount: (state, action) => {
            const userId = action.payload;
            const user = state.users.find((u) => u._id === userId);
            if (user) {
                user.unreadMessageCount = 0;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // List Users
            .addCase(listUsers.pending, (state) => {
                state.loading = true;
            })
            .addCase(listUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload.users;
                state.page = action.payload.page;
                state.pages = action.payload.pages;
                state.count = action.payload.count;
            })
            .addCase(listUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Delete User
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter((user) => user._id !== action.payload);
            })
            // Get User Details
            .addCase(getUserDetails.pending, (state) => {
                state.loading = true;
            })
            .addCase(getUserDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(getUserDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update User
            .addCase(updateUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.loading = false;
                state.updateSuccess = true;
                state.user = action.payload;
            })
            .addCase(updateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { resetUserUpdate, incrementMessageCount, decrementMessageCount, resetMessageCount } = userSlice.actions;
export default userSlice.reducer;
