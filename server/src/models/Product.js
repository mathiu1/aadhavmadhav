const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

const productSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        images: [{
            type: String,
        }],
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['Crackers', 'Custom T-Shirts', 'Nuts', 'General'], // Added General for fallback
            default: 'General'
        },
        type: {
            type: String, // E.g., 'Bomb', 'Flower Pot' for Crackers; 'Cashew', 'Almond' for Nuts
        },
        price: {
            type: Number,
            required: true,
            default: 0,
        },
        oldPrice: {
            type: Number,
            default: 0
        },
        discountPercentage: {
            type: Number,
            default: 0
        },
        countInStock: {
            type: Number,
            required: true,
            default: 0,
        },
        rating: {
            type: Number,
            required: true,
            default: 0,
        },
        numReviews: {
            type: Number,
            required: true,
            default: 0,
        },
        isDeleted: {
            type: Boolean,
            required: true,
            default: false,
        },
        reviews: [reviewSchema],
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to calculate discount or old price if one is missing but needed? 
// For now, allow manual entry.

// Product Indexes for fast search & filtering
productSchema.index({ name: 'text', description: 'text' }); // Text index for keyword search
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isDeleted: 1 });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
