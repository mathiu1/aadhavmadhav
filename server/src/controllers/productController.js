const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
    if (!filePath) return;
    // Only delete files in the uploads directory
    if (!filePath.startsWith('/uploads/')) return;

    const absolutePath = path.join(__dirname, '../../', filePath);
    fs.unlink(absolutePath, (err) => {
        if (err) {
            console.error(`Failed to delete file: ${absolutePath}`, err);
        }
    });
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 12;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
        ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i',
            },
        }
        : {};

    const category = req.query.category
        ? { category: req.query.category }
        : {};

    const priceFilter = {};
    if (req.query.minPrice || req.query.maxPrice) {
        priceFilter.price = {};
        if (req.query.minPrice) priceFilter.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) priceFilter.price.$lte = Number(req.query.maxPrice);
    }

    const ratingFilter = {};
    if (req.query.rating) {
        ratingFilter.rating = { $gte: Number(req.query.rating) };
    }

    // Filter deleted products unless 'showAll' is requested (Admin)
    const isDeletedFilter = req.query.showAll === 'true' ? {} : { isDeleted: { $ne: true } };

    const count = await Product.countDocuments({ ...keyword, ...category, ...priceFilter, ...ratingFilter, ...isDeletedFilter });
    const products = await Product.find({ ...keyword, ...category, ...priceFilter, ...ratingFilter, ...isDeletedFilter })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    // Append delivered order count to each product
    const productsWithStats = await Promise.all(products.map(async (product) => {
        const deliveredOrderCount = await Order.countDocuments({
            'orderItems.product': product._id,
            status: 'Delivered'
        });
        return { ...product.toObject(), deliveredOrderCount };
    }));

    res.json({ products: productsWithStats, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Fetch product filters (categories, price range)
// @route   GET /api/products/filters
// @access  Public
const getProductFilters = asyncHandler(async (req, res) => {
    // Only fetch filters for active products
    const categories = await Product.find({ isDeleted: { $ne: true } }).distinct('category');

    let filter = { isDeleted: { $ne: true } };
    if (req.query.category) {
        filter.category = req.query.category;
    }

    // Find min and max price based on filter (category)
    const minPriceProduct = await Product.findOne(filter).sort({ price: 1 }).select('price');
    const maxPriceProduct = await Product.findOne(filter).sort({ price: -1 }).select('price');

    const minPrice = minPriceProduct ? minPriceProduct.price : 0;
    const maxPrice = maxPriceProduct ? maxPriceProduct.price : 0;

    res.json({
        categories,
        minPrice,
        maxPrice
    });
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('user', 'name email')
        .populate('lastUpdatedBy', 'name email');

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        if (req.query.force === 'true') {
            // HARD DELETE
            // Delete associated images
            const imagesToDelete = [...(product.images || [])];
            if (product.image) imagesToDelete.push(product.image);

            // Unique images to avoid duplicate deletion attempts
            const uniqueImages = [...new Set(imagesToDelete)];

            uniqueImages.forEach(imagePath => {
                deleteFile(imagePath);
            });

            // Cascade delete related Orders
            await Order.deleteMany({ 'orderItems.product': product._id });

            // Remove from all Users' carts & favorites
            await User.updateMany(
                { 'cartItems.product': product._id },
                { $pull: { cartItems: { product: product._id } } }
            );
            await User.updateMany(
                { favorites: product._id },
                { $pull: { favorites: product._id } }
            );

            // Delete Product (Reviews are embedded)
            await Product.deleteOne({ _id: product._id });
            res.json({ message: 'Product and related data permanently deleted' });
        } else {
            // Check for active orders before Soft Delete
            const activeOrders = await Order.find({
                'orderItems.product': product._id,
                status: { $nin: ['Delivered', 'Cancelled', 'Shipped'] }
            }).select('_id status');

            if (activeOrders.length > 0) {
                const orderDetails = activeOrders.map(order => ({
                    id: order._id.toString(),
                    status: order.status
                }));

                res.status(400);
                throw new Error(JSON.stringify({
                    message: `Cannot deactivate. ${activeOrders.length} active order(s) pending. Process or cancel them first.`,
                    orders: orderDetails
                }));
            }

            // SOFT DELETE
            product.isDeleted = true;
            await product.save();
            res.json({ message: 'Product deactivated (Safe Delete)' });
        }
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Restore a product
// @route   PUT /api/products/:id/restore
// @access  Private/Admin
const restoreProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        product.isDeleted = false;
        await product.save();
        res.json({ message: 'Product restored' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
    const { name, price, oldPrice, description, images, category, countInStock, discountPercentage } = req.body;

    const mainImage = (images && images.length > 0) ? images[0] : '/images/sample.jpg';

    const product = new Product({
        name: name || 'Sample name',
        price: price || 0,
        oldPrice: oldPrice || 0,
        user: req.user._id,
        lastUpdatedBy: req.user._id,
        image: mainImage,
        images: images || [],
        category: category || 'General',
        countInStock: countInStock || 0,
        numReviews: 0,
        description: description || 'Sample description',
        discountPercentage: discountPercentage || 0
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
    const { name, price, oldPrice, description, images, category, countInStock, discountPercentage } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = name || product.name;
        product.price = price || product.price;
        product.oldPrice = oldPrice || product.oldPrice;
        product.description = description || product.description;

        // Handle image updates and deletion
        if (images) {
            // Find images that were removed
            const imagesToRemove = product.images.filter(img => !images.includes(img));
            imagesToRemove.forEach(img => deleteFile(img));

            product.images = images;

            // Update main image logic
            if (images.length > 0) {
                product.image = images[0];
            }
        }

        product.category = category || product.category;
        product.countInStock = countInStock; // Can be 0
        product.discountPercentage = discountPercentage || 0;
        product.lastUpdatedBy = req.user._id;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
        const alreadyReviewed = product.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            // Update existing review
            alreadyReviewed.rating = Number(rating);
            alreadyReviewed.comment = comment;
        } else {
            // Create new review
            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };
            product.reviews.push(review);
        }

        product.numReviews = product.reviews.length;

        product.rating =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;

        await product.save();
        res.status(201).json({ message: 'Review added' }); // Always return success
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

module.exports = {
    getProducts,
    getProductById,
    getProductFilters,
    deleteProduct,
    createProduct,
    updateProduct,
    createProductReview,
    restoreProduct,
};