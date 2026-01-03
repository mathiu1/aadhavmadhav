const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Message = require('../models/Message');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('express-async-handler');
const sendSystemMessage = require('../utils/sendSystemMessage');

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Send automated welcome back message
        // Don't await this to keep login fast
        sendSystemMessage(
            req,
            user._id,
            `Welcome back ${user.name}! 🛍️ Ready to shop? Check out our latest products!`
        );

        generateToken(res, user._id);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            favorites: user.favorites,
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        // Send automated welcome message
        sendSystemMessage(
            req,
            user._id,
            `Welcome to AadhavMadhav, ${user.name}! 🎉 Thanks for joining us. Happy shopping!`
        );

        generateToken(res, user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            favorites: user.favorites,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            favorites: user.favorites,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 12;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
        ? {
            $or: [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { email: { $regex: req.query.keyword, $options: 'i' } },
            ],
        }
        : {};

    const count = await User.countDocuments({ ...keyword });

    // Use aggregation to get users and their delivered order count
    const users = await User.aggregate([
        { $match: { ...keyword } },
        {
            $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'user',
                as: 'orders'
            }
        },
        {
            $lookup: {
                from: 'messages',
                localField: '_id',
                foreignField: 'user',
                as: 'messages'
            }
        },
        {
            $addFields: {
                totalDeliveredOrders: {
                    $size: {
                        $filter: {
                            input: '$orders',
                            as: 'order',
                            cond: { $eq: ['$$order.isDelivered', true] }
                        }
                    }
                },
                favoriteCount: { $size: { $ifNull: ["$favorites", []] } },
                cartItemCount: { $size: { $ifNull: ["$cartItems", []] } },
                unreadMessageCount: {
                    $size: {
                        $filter: {
                            input: '$messages',
                            as: 'msg',
                            cond: {
                                $and: [
                                    { $eq: ['$$msg.isRead', false] },
                                    { $eq: ['$$msg.sender', '$_id'] }
                                ]
                            }
                        }
                    }
                }
            }
        },
        { $project: { password: 0, orders: 0, cartItems: 0, messages: 0 } },
        { $skip: pageSize * (page - 1) },
        { $limit: pageSize }
    ]);

    res.json({ users, page, pages: Math.ceil(count / pageSize), count });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.isAdmin) {
            res.status(400);
            throw new Error('Cannot delete admin user');
        }

        // Remove user's reviews from products and recalculate rating
        const productsWithReviews = await Product.find({ 'reviews.user': user._id });

        for (const product of productsWithReviews) {
            product.reviews = product.reviews.filter(
                (review) => review.user.toString() !== user._id.toString()
            );

            product.numReviews = product.reviews.length;

            product.rating =
                product.reviews.length > 0
                    ? product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                    product.reviews.length
                    : 0;

            await product.save();
        }

        // Remove user's messages
        await Message.deleteMany({ user: user._id });

        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-password')
        .populate('favorites')
        .populate({ path: 'cartItems.product', model: 'Product' });

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.isAdmin = Boolean(req.body.isAdmin);

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Toggle favorite product
// @route   PUT /api/users/profile/favorites
// @access  Private
const toggleFavorite = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        // user.favorites stores ObjectIds, need to compare string
        const isFavorite = user.favorites.some((id) => id.toString() === productId);

        if (isFavorite) {
            user.favorites = user.favorites.filter((id) => id.toString() !== productId);
            await user.save();
            res.json({ message: 'Removed from favorites', favorites: user.favorites, action: 'remove' });
        } else {
            user.favorites.push(productId);
            await user.save();
            res.json({ message: 'Added to favorites', favorites: user.favorites, action: 'add' });
        }
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get user favorites
// @route   GET /api/users/profile/favorites
// @access  Private
// @desc    Get user favorites
// @route   GET /api/users/profile/favorites
// @access  Private
// @desc    Get user favorites
// @route   GET /api/users/profile/favorites
// @access  Private
const getFavorites = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('favorites');
    if (user) {
        // Remove hard-deleted items (null) but KEEP soft-deleted items so UI can show them as unavailable
        const favorites = user.favorites.filter(product => product);
        res.json(favorites);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get a support agent (Admin)
// @route   GET /api/users/support-agent
// @access  Private
const getSupportAgent = asyncHandler(async (req, res) => {
    // 1. Try to find an ONLINE admin first
    let admin = await User.findOne({ isAdmin: true, isOnline: true }).select('_id name email isAdmin isOnline');

    // 2. If no online admin, return any admin
    if (!admin) {
        admin = await User.findOne({ isAdmin: true }).select('_id name email isAdmin isOnline');
    }

    if (admin) {
        res.json(admin);
    } else {
        res.status(404);
        throw new Error('No support agents available');
    }
});

module.exports = {
    authUser,
    registerUser,
    getUserProfile,
    logoutUser,
    getSupportAgent,
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
    toggleFavorite,
    getFavorites,
};
