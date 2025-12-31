import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
    products: [],
    product: {},
    filters: {
        categories: [],
        minPrice: 0,
        maxPrice: 10000,
    },
    page: 1,
    pages: 1,
    isLoading: false,
    error: null,
    // Admin ops
    key: 0, // Force refresh
    deleteLoading: false,
    deleteSuccess: false,
    deleteError: null,
    createLoading: false,
    createSuccess: false,
    createProduct: null, // The created product
    createError: null,
    updateLoading: false,
    updateSuccess: false,
    updateError: null,
    reviewLoading: false,
    reviewSuccess: false,
    reviewError: null,
};

// Fetch all products with filter params
export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async ({ keyword = '', pageNumber = 1, category = '', minPrice = '', maxPrice = '', rating = '', pageSize = '', showAll = false } = {}, thunkAPI) => {
        try {
            // Construct query string
            let query = `?keyword=${keyword}&pageNumber=${pageNumber}`;
            if (category) query += `&category=${category}`;
            if (minPrice) query += `&minPrice=${minPrice}`;
            if (maxPrice) query += `&maxPrice=${maxPrice}`;
            if (rating) query += `&rating=${rating}`;
            if (pageSize) query += `&pageSize=${pageSize}`;
            if (showAll) query += `&showAll=true`;

            const { data } = await api.get(`/products${query}`);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Fetch filters (categories, price range)
export const fetchFilters = createAsyncThunk(
    'products/fetchFilters',
    async (category = '', thunkAPI) => {
        try {
            const query = category ? `?category=${category}` : '';
            const { data } = await api.get(`/products/filters${query}`);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Fetch single product details
export const fetchProductDetails = createAsyncThunk(
    'products/fetchProductDetails',
    async (id, thunkAPI) => {
        try {
            const { data } = await api.get(`/products/${id}`);
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Delete Product
export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (arg, thunkAPI) => {
        try {
            const id = typeof arg === 'object' ? arg.id : arg;
            const force = typeof arg === 'object' && arg.force ? true : false;
            let url = `/products/${id}`;
            if (force) url += `?force=true`;

            await api.delete(url, { withCredentials: true });
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Restore Product
export const restoreProduct = createAsyncThunk(
    'products/restoreProduct',
    async (id, thunkAPI) => {
        try {
            await api.put(`/products/${id}/restore`, {}, { withCredentials: true });
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Create Product
export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (productData = {}, thunkAPI) => {
        try {
            const { data } = await api.post(`/products`, productData, { withCredentials: true });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Admin: Update Product
export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async (product, thunkAPI) => {
        try {
            const { data } = await api.put(`/products/${product._id}`, product, { withCredentials: true });
            return data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Create Product Review
export const createReview = createAsyncThunk(
    'products/createReview',
    async ({ productId, review }, thunkAPI) => {
        try {
            await api.post(`/products/${productId}/reviews`, review, { withCredentials: true });
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        resetAdminState: (state) => {
            state.deleteSuccess = false;
            state.deleteError = null;
            state.createSuccess = false;
            state.createProduct = null;
            state.createError = null;
            state.updateSuccess = false;
            state.updateError = null;
        },
        resetReviewState: (state) => {
            state.reviewSuccess = false;
            state.reviewError = null;
            state.reviewLoading = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Products
            .addCase(fetchProducts.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.products = action.payload.products;
                state.page = action.payload.page;
                state.pages = action.payload.pages;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Fetch Filters
            .addCase(fetchFilters.fulfilled, (state, action) => {
                state.filters = action.payload;
            })
            // Fetch Product Details
            .addCase(fetchProductDetails.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProductDetails.fulfilled, (state, action) => {
                state.isLoading = false;
                state.product = action.payload;
            })
            .addCase(fetchProductDetails.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Delete Product
            .addCase(deleteProduct.pending, (state) => {
                state.deleteLoading = true;
            })
            .addCase(deleteProduct.fulfilled, (state) => {
                state.deleteLoading = false;
                state.deleteSuccess = true;
            })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.deleteLoading = false;
                state.deleteError = action.payload;
            })
            // Restore Product
            .addCase(restoreProduct.pending, (state) => {
                state.deleteLoading = true;
            })
            .addCase(restoreProduct.fulfilled, (state) => {
                state.deleteLoading = false;
                state.deleteSuccess = true;
            })
            .addCase(restoreProduct.rejected, (state, action) => {
                state.deleteLoading = false;
                state.deleteError = action.payload;
            })
            // Create Product
            .addCase(createProduct.pending, (state) => {
                state.createLoading = true;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.createLoading = false;
                state.createSuccess = true;
                state.createProduct = action.payload;
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.createLoading = false;
                state.createError = action.payload;
            })
            // Update Product
            .addCase(updateProduct.pending, (state) => {
                state.updateLoading = true;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.updateLoading = false;
                state.updateSuccess = true;
                state.product = action.payload; // Update current details view if open
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.updateLoading = false;
                state.updateError = action.payload;
            })
            // Create Review
            .addCase(createReview.pending, (state) => {
                state.reviewLoading = true;
                state.reviewError = null;
            })
            .addCase(createReview.fulfilled, (state) => {
                state.reviewLoading = false;
                state.reviewSuccess = true;
            })
            .addCase(createReview.rejected, (state, action) => {
                state.reviewLoading = false;
                state.reviewError = action.payload;
            });
    },
});

export const { resetAdminState, resetReviewState } = productSlice.actions;
export default productSlice.reducer;