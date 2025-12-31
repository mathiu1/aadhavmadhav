import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
    cartItems: [],
    shippingAddress: localStorage.getItem('shippingAddress')
        ? JSON.parse(localStorage.getItem('shippingAddress'))
        : {},
    paymentMethod: 'PayPal',
    isLoading: false,
    error: null,
};

// Async Thunks
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/cart', {
                withCredentials: true // Important for cookies
            });
            return data;
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async (item, thunkAPI) => {
        try {
            const { data } = await api.post('/cart', item, {
                withCredentials: true
            });
            return data;
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const removeFromCart = createAsyncThunk(
    'cart/removeFromCart',
    async (id, thunkAPI) => {
        try {
            const { data } = await api.delete(`/cart/${id}`, {
                withCredentials: true
            });
            return data;
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        clearCartLocal: (state) => {
            state.cartItems = [];
        },
        saveShippingAddress: (state, action) => {
            state.shippingAddress = action.payload;
            localStorage.setItem('shippingAddress', JSON.stringify(action.payload));
        },
        savePaymentMethod: (state, action) => {
            state.paymentMethod = action.payload;
            localStorage.setItem('paymentMethod', JSON.stringify(action.payload));
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.isLoading = false;
                state.cartItems = action.payload;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                state.cartItems = action.payload;
            })
            .addCase(removeFromCart.fulfilled, (state, action) => {
                state.cartItems = action.payload;
            });
    }
});

export const { clearCartLocal, saveShippingAddress, savePaymentMethod } = cartSlice.actions;

export default cartSlice.reducer;
