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
        .skip(pageSize * (page - 1))
        .lean();

    // Append delivered order count to each product
    const productsWithStats = await Promise.all(products.map(async (product) => {
        const deliveredOrderCount = await Order.countDocuments({
            'orderItems.product': product._id,
            status: 'Delivered'
        });
        return { ...product, deliveredOrderCount };
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

// @desc    Export products report as Excel
// @route   GET /api/products/export
// @access  Private/Admin
const exportProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({})
        .sort({ createdAt: -1 });

    let html = `
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
                table { border-collapse: collapse; width: 100%; border: 1px solid #000; }
                
                /* Title Header */
                .company-header {
                    background-color: #1e293b; 
                    color: #fbbf24; 
                    font-size: 20pt; 
                    font-weight: bold; 
                    text-align: center; 
                    padding: 15px;
                }
                .report-date {
                    background-color: #334155;
                    color: #ffffff;
                    text-align: right;
                    font-size: 9pt;
                    padding: 5px;
                    font-style: italic;
                }

                th { 
                    padding: 10px; 
                    text-align: center; 
                    font-weight: bold;
                    white-space: nowrap;
                    color: #ffffff;
                    border: 1px solid #000;
                }
                
                td { 
                    border: 1px solid #000; 
                    padding: 6px; 
                    vertical-align: middle; 
                    color: #000;
                }

                .text-center { text-align: center; }
                .text-left { text-align: left; }
                .text-right { text-align: right; }
                
                .amount { font-family: 'Consolas', monospace; }
                
                .status-active { color: #166534; background-color: #dcfce7; font-weight: bold; }
                .status-deleted { color: #991b1b; background-color: #fee2e2; font-weight: bold; }
                .status-low { color: #854d0e; background-color: #fef9c3; font-weight: bold; }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <tr>
                        <th colspan="12" class="company-header">
                            AadhavMadhav - Product Inventory Report
                        </th>
                    </tr>
                    <tr>
                        <th colspan="12" class="report-date">
                            Generated on: ${new Date().toLocaleString()}
                        </th>
                    </tr>
                    <tr>
                        <!-- Basic Info: Deep Blue -->
                        <th style="background-color: #1e3a8a;">Product ID</th>
                        <th style="background-color: #1e3a8a;">Name</th>
                        <th style="background-color: #1e3a8a;">Category</th>
                        <th style="background-color: #1e3a8a;">Type</th>

                        <!-- Financials: Emerald -->
                        <th style="background-color: #064e3b;">Price</th>
                        <th style="background-color: #064e3b;">Discount</th>
                        <th style="background-color: #064e3b;">Old Price</th>

                        <!-- Inventory & Stats: Teal -->
                        <th style="background-color: #0f766e;">Stock</th>
                        <th style="background-color: #0f766e;">Rating</th>
                        <th style="background-color: #0f766e;">Reviews</th>
                        
                        <!-- Meta: Slate -->
                        <th style="background-color: #334155;">Status</th>
                        <th style="background-color: #334155;">Created At</th>
                    </tr>
                </thead>
                <tbody>
    `;

    products.forEach(product => {
        const formatMoney = (amount) => (amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        const isDeleted = product.isDeleted;
        const statusClass = isDeleted ? 'status-deleted' : (product.countInStock < 5 ? 'status-low' : 'status-active');
        const statusText = isDeleted ? 'Deleted' : (product.countInStock === 0 ? 'Out of Stock' : (product.countInStock < 5 ? 'Low Stock' : 'Active'));

        html += `
            <tr>
                <td class="text-center" style="background-color: #f8fafc;">${product._id}</td>
                <td class="text-left font-bold">${product.name}</td>
                <td class="text-center">${product.category}</td>
                <td class="text-center">${product.type || '-'}</td>
                
                <td class="text-right amount">${formatMoney(product.price)}</td>
                <td class="text-center amount">${product.discountPercentage > 0 ? product.discountPercentage + '%' : '-'}</td>
                <td class="text-right amount" style="color: #64748b; text-decoration: ${product.oldPrice > 0 ? 'line-through' : 'none'};">${product.oldPrice > 0 ? formatMoney(product.oldPrice) : '-'}</td>
                
                <td class="text-center font-bold ${product.countInStock === 0 ? 'status-deleted' : ''}">${product.countInStock}</td>
                <td class="text-center">${product.rating} ★</td>
                <td class="text-center">${product.numReviews}</td>
                
                <td class="text-center ${statusClass}">${statusText}</td>
                <td class="text-center">${new Date(product.createdAt).toLocaleDateString()}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </body>
        </html>
    `;

    res.header('Content-Type', 'application/vnd.ms-excel');
    res.attachment(`products_report_${new Date().toISOString().split('T')[0]}.xls`);
    res.send(html);
});

// @desc    Get all reviews (Admin)
// @route   GET /api/products/reviews/all
// @access  Private/Admin
const getAllReviews = asyncHandler(async (req, res) => {
    const { search, user, pageNumber, pageSize } = req.query;

    const page = Number(pageNumber) || 1;
    const limit = Number(pageSize) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [];

    // 1. Match Product Name if provided (Optimization: filter before unwind)
    if (search) {
        pipeline.push({ $match: { name: { $regex: search, $options: 'i' } } });
    }

    // 2. Unwind reviews
    pipeline.push({ $unwind: '$reviews' });

    // 3. Lookup User Details (Email)
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'reviews.user',
            foreignField: '_id',
            as: 'userDetails'
        }
    });
    pipeline.push({ $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } });

    // 4. Project
    pipeline.push({
        $project: {
            _id: 1,
            productName: '$name',
            productImage: '$image',
            reviewId: '$reviews._id',
            rating: '$reviews.rating',
            comment: '$reviews.comment',
            userName: '$reviews.name', // Reviewer name stored in review
            userEmail: '$userDetails.email',
            user: '$reviews.user',
            createdAt: '$reviews.createdAt'
        }
    });

    // 5. Match User Name if provided
    if (user) {
        pipeline.push({
            $match: { userName: { $regex: user, $options: 'i' } }
        });
    }

    // 6. Sort
    pipeline.push({ $sort: { createdAt: -1 } });

    // 7. Pagination Facet
    pipeline.push({
        $facet: {
            metadata: [{ $count: "total" }],
            data: [{ $skip: skip }, { $limit: limit }]
        }
    });

    const result = await Product.aggregate(pipeline);

    // Extract data
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;
    const reviews = result[0].data;

    res.json({
        reviews,
        page,
        pages: Math.ceil(total / limit),
        total
    });
});

// @desc    Delete a review (Admin)
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
const deleteReview = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        const review = product.reviews.find(
            (r) => r._id.toString() === req.params.reviewId.toString()
        );

        if (review) {
            // Remove review
            product.reviews = product.reviews.filter(
                (r) => r._id.toString() !== req.params.reviewId.toString()
            );

            // Recalculate Rating
            product.numReviews = product.reviews.length;

            if (product.reviews.length > 0) {
                product.rating =
                    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                    product.reviews.length;
            } else {
                product.rating = 0;
            }

            await product.save();
            res.json({ message: 'Review deleted' });
        } else {
            res.status(404);
            throw new Error('Review not found');
        }
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
    exportProducts,
    getAllReviews,
    deleteReview
};