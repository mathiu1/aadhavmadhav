const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getUserCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('cartItems.product', 'countInStock price oldPrice discountPercentage name image isDeleted');

    if (user) {
        // Auto-remove inactive or hard-deleted items
        const originalLength = user.cartItems.length;
        user.cartItems = user.cartItems.filter(item => item.product && !item.product.isDeleted);

        if (user.cartItems.length !== originalLength) {
            await user.save();
        }

        // Map cart items to include live stock data
        const cartData = user.cartItems.map(item => {
            const product = item.product;
            // Product is guaranteed to exist and be active here due to filter above

            return {
                ...item.toObject(),
                // Use fresh data from product
                countInStock: product.countInStock,
                isOutOfStock: product.countInStock === 0,
                price: product.price,
                oldPrice: product.oldPrice,
                discountPercentage: product.discountPercentage,
                image: product.image || item.image,
                name: product.name || item.name
            };
        });

        res.json(cartData);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
    const { product, _id, name, image, price, qty, rating, mode } = req.body;

    // Robust Product ID Extraction
    let productId = product || _id;
    if (productId && typeof productId === 'object' && productId._id) {
        productId = productId._id;
    }
    productId = productId.toString();

    const updateMode = mode || 'set';

    console.log('Add to cart:', { productId, name, qty, updateMode });

    const dbProduct = await Product.findById(productId);
    if (!dbProduct || dbProduct.isDeleted) {
        res.status(404);
        throw new Error('Product not found or unavailable');
    }

    const user = await User.findById(req.user._id);

    if (user) {
        // Find ALL indexes of this product in the cart (to detect duplicates)
        const existingIndices = user.cartItems.reduce((indices, item, index) => {
            if (item.product && item.product.toString() === productId) {
                indices.push(index);
            }
            return indices;
        }, []);

        if (existingIndices.length > 0) {
            // Product exists - Update the FIRST instance
            const firstIndex = existingIndices[0];
            const currentItem = user.cartItems[firstIndex];

            if (updateMode === 'increase') {
                // Add to existing quantity
                currentItem.qty = Number(currentItem.qty) + Number(qty);
            } else {
                // Set logic
                currentItem.qty = Number(qty);
            }

            // Max Stock Validation
            if (currentItem.qty > dbProduct.countInStock) {
                currentItem.qty = dbProduct.countInStock;
            }

            // Remove any EXTRA duplicate instances (Self-healing)
            if (existingIndices.length > 1) {
                // Iterate backwards to splice without shifting issues
                for (let i = existingIndices.length - 1; i > 0; i--) {
                    const duplicateIndex = existingIndices[i];
                    user.cartItems.splice(duplicateIndex, 1);
                }
            }
        } else {
            // New Item
            if (!productId) {
                res.status(400);
                throw new Error('Product ID is required');
            }
            const finalQty = Number(qty) > dbProduct.countInStock ? dbProduct.countInStock : Number(qty);
            user.cartItems.push({ product: productId, name, image, price, qty: finalQty, rating: rating || 0 });
        }

        await user.save();

        // Populate and return fresh data
        const populatedUser = await User.findById(req.user._id).populate('cartItems.product', 'countInStock price oldPrice discountPercentage name image isDeleted');

        const cartData = populatedUser.cartItems.map(item => {
            const product = item.product;
            if (!product || product.isDeleted) {
                return { ...item.toObject(), isAvailable: false, stockProblem: true, isInactive: true };
            }
            return {
                ...item.toObject(),
                countInStock: product.countInStock,
                isOutOfStock: product.countInStock === 0,
                price: product.price,
                oldPrice: product.oldPrice,
                discountPercentage: product.discountPercentage,
                image: product.image || item.image,
                name: product.name || item.name
            };
        });

        res.json(cartData);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.cartItems = user.cartItems.filter(
            (x) => x.product.toString() !== req.params.id
        );

        await user.save();

        // Populate and return fresh data
        const populatedUser = await User.findById(req.user._id).populate('cartItems.product', 'countInStock price oldPrice discountPercentage name image isDeleted');

        const cartData = populatedUser.cartItems.map(item => {
            const product = item.product;
            if (!product || product.isDeleted) {
                return { ...item.toObject(), isAvailable: false, stockProblem: true, isInactive: true };
            }
            return {
                ...item.toObject(),
                countInStock: product.countInStock,
                isOutOfStock: product.countInStock === 0,
                price: product.price,
                oldPrice: product.oldPrice,
                discountPercentage: product.discountPercentage,
                image: product.image || item.image,
                name: product.name || item.name
            };
        });

        res.json(cartData);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.cartItems = [];
        await user.save();
        res.json([]);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getUserCart,
    addToCart,
    removeFromCart,
    clearCart
};
