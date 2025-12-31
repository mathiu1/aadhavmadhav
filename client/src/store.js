import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import userReducer from './slices/userSlice';
import messageReducer from './slices/messageSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        cart: cartReducer,
        product: productReducer,

        order: orderReducer,
        user: userReducer,
        messages: messageReducer,
    },
    devTools: process.env.NODE_ENV !== 'production',
});

export default store;
