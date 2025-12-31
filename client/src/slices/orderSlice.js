import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
    loading: false,
    success: false,
    order: null,
    orders: [], // My Orders
    orderDetails: { loading: true, order: null, error: null },
    // Admin States
    orderList: { orders: [], loading: false, error: null },
    orderDeliver: { loading: false, success: false },
    orderSummary: { data: null, loading: false, error: null },
    error: null,
};

export const createOrder = createAsyncThunk(
    'order/createOrder',
    async (orderData, thunkAPI) => {
        try {
            const { data } = await api.post('/orders', orderData, {
                withCredentials: true,
            });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const getMyOrders = createAsyncThunk(
    'order/getMyOrders',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/orders/myorders', {
                withCredentials: true,
            });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const getOrderDetails = createAsyncThunk(
    'order/getOrderDetails',
    async (id, thunkAPI) => {
        try {
            const { data } = await api.get(`/orders/${id}`, {
                withCredentials: true,
            });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Get All Orders
export const listOrders = createAsyncThunk(
    'order/listOrders',
    async (_, thunkAPI) => {
        try {
            const { data } = await api.get('/orders', {
                withCredentials: true,
            });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Get Orders by User
export const listOrdersByUser = createAsyncThunk(
    'order/listOrdersByUser',
    async (userId, thunkAPI) => {
        try {
            const { data } = await api.get(`/orders/user/${userId}`, {
                withCredentials: true,
            });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Deliver Order
export const deliverOrder = createAsyncThunk(
    'order/deliverOrder',
    async (orderId, thunkAPI) => {
        try {
            const { data } = await api.put(`/orders/${orderId}/deliver`, {}, {
                withCredentials: true,
            });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Ship Order
export const shipOrder = createAsyncThunk(
    'order/shipOrder',
    async (orderId, thunkAPI) => {
        try {
            const { data } = await api.put(`/orders/${orderId}/ship`, {}, {
                withCredentials: true,
            });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Cancel Order
export const cancelOrder = createAsyncThunk(
    'order/cancelOrder',
    async ({ id, reason }, thunkAPI) => {
        try {
            const { data } = await api.put(`/orders/${id}/cancel`, { reason }, {
                withCredentials: true,
            });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Get Dashboard Summary
export const getOrderSummary = createAsyncThunk(
    'order/getOrderSummary',
    async (params, thunkAPI) => {
        try {
            const { data } = await api.get('/orders/summary', {
                params,
                withCredentials: true,
            });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        resetOrder: (state) => {
            state.loading = false;
            state.success = false;
            state.order = null;
            state.error = null;
        },
        resetOrderDeliver: (state) => {
            state.orderDeliver = { loading: false, success: false };
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Order
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.order = action.payload;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get My Orders
            .addCase(getMyOrders.pending, (state) => {
                state.loading = true;
            })
            .addCase(getMyOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload;
            })
            .addCase(getMyOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Get Order Details
            .addCase(getOrderDetails.pending, (state) => {
                state.orderDetails.loading = true;
            })
            .addCase(getOrderDetails.fulfilled, (state, action) => {
                state.orderDetails.loading = false;
                state.orderDetails.order = action.payload;
            })
            .addCase(getOrderDetails.rejected, (state, action) => {
                state.orderDetails.loading = false;
                state.orderDetails.error = action.payload;
            })

            // Admin: List Orders
            .addCase(listOrders.pending, (state) => {
                state.orderList.loading = true;
            })
            .addCase(listOrders.fulfilled, (state, action) => {
                state.orderList.loading = false;
                state.orderList.orders = action.payload;
            })
            .addCase(listOrders.rejected, (state, action) => {
                state.orderList.loading = false;
                state.orderList.error = action.payload;
            })

            // Admin: List Orders By User
            .addCase(listOrdersByUser.pending, (state) => {
                state.orderList.loading = true;
            })
            .addCase(listOrdersByUser.fulfilled, (state, action) => {
                state.orderList.loading = false;
                state.orderList.orders = action.payload;
            })
            .addCase(listOrdersByUser.rejected, (state, action) => {
                state.orderList.loading = false;
                state.orderList.error = action.payload;
            })

            // Admin: Deliver Order
            .addCase(deliverOrder.pending, (state) => {
                state.orderDeliver.loading = true;
            })
            .addCase(deliverOrder.fulfilled, (state) => {
                state.orderDeliver.loading = false;
                state.orderDeliver.success = true;
            })
            .addCase(deliverOrder.rejected, (state) => {
                state.orderDeliver.loading = false;
            })
            // Admin: Ship Order
            .addCase(shipOrder.pending, (state) => {
                state.orderDeliver.loading = true;
            })
            .addCase(shipOrder.fulfilled, (state) => {
                state.orderDeliver.loading = false;
                state.orderDeliver.success = true;
            })
            .addCase(shipOrder.rejected, (state) => {
                state.orderDeliver.loading = false;
            })
            // Admin: Cancel Order
            .addCase(cancelOrder.pending, (state) => {
                state.orderDeliver.loading = true;
            })
            .addCase(cancelOrder.fulfilled, (state) => {
                state.orderDeliver.loading = false;
                state.orderDeliver.success = true;
            })
            .addCase(cancelOrder.rejected, (state) => {
                state.orderDeliver.loading = false;
            })
            // Admin: Get Order Summary
            .addCase(getOrderSummary.pending, (state) => {
                state.orderSummary.loading = true;
            })
            .addCase(getOrderSummary.fulfilled, (state, action) => {
                state.orderSummary.loading = false;
                state.orderSummary.data = action.payload;
            })
            .addCase(getOrderSummary.rejected, (state, action) => {
                state.orderSummary.loading = false;
                state.orderSummary.error = action.payload;
            });
    },
});

export const { resetOrder, resetOrderDeliver } = orderSlice.actions;
export default orderSlice.reducer;
