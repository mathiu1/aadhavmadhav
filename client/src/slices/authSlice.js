import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

// Get user from localStorage - REMOVED PER REQUEST
// const userInfoFromStorage = localStorage.getItem('userInfo')
//     ? JSON.parse(localStorage.getItem('userInfo'))
//     : null;

const initialState = {
    userInfo: null,
    isLoading: false,
    appLoading: true, // New: Track initial auth check
    error: null,
};

export const login = createAsyncThunk('auth/login', async ({ email, password, forceLogin = false }, thunkAPI) => {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Important for cookies
        };
        const { data } = await api.post('/users/login', { email, password, forceLogin }, config);
        // localStorage.setItem('userInfo', JSON.stringify(data));
        return data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        // Return structured error if possible for 403 handling
        if (error.response && error.response.status === 403) {
            return thunkAPI.rejectWithValue({
                message,
                status: 403,
                deviceInfo: error.response.data.deviceInfo // <--- Added this
            });
        }
        return thunkAPI.rejectWithValue(message);
    }
});

export const logout = createAsyncThunk('auth/logout', async () => {
    await api.post('/users/logout', {}, { withCredentials: true });
    // localStorage.removeItem('userInfo');
});

export const register = createAsyncThunk('auth/register', async ({ name, email, password }, thunkAPI) => {
    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        };
        const { data } = await api.post('/users', { name, email, password }, config);
        // localStorage.setItem('userInfo', JSON.stringify(data));
        return data;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, thunkAPI) => {
    try {
        const { data } = await api.get('/users/profile', { withCredentials: true });
        return data;
    } catch (error) {
        return thunkAPI.rejectWithValue(null); // Silent fail on check auth
    }
});


export const toggleFavorite = createAsyncThunk('auth/toggleFavorite', async (productId, thunkAPI) => {
    try {
        const { data } = await api.put('/users/profile/favorites', { productId }, { withCredentials: true });
        return data.favorites;
    } catch (error) {
        const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userInfo = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(logout.fulfilled, (state) => {
                state.userInfo = null;
            })
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.userInfo = action.payload;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(checkAuth.pending, (state) => {
                state.appLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.userInfo = action.payload; // Restore session
                state.appLoading = false;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.userInfo = null; // Ensure logged out if check fails
                state.appLoading = false;
            })
            .addCase(toggleFavorite.fulfilled, (state, action) => {
                if (state.userInfo) {
                    state.userInfo.favorites = action.payload;
                }
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
