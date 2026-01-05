const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            // Check if token version matches the user's current version
            if (decoded.v !== undefined && req.user.tokenVersion !== undefined) {
                if (decoded.v !== req.user.tokenVersion) {
                    res.status(401);
                    throw new Error('Session expired, logged in on another device');
                }
            } else if (req.user.tokenVersion > 0 && decoded.v === undefined) {
                // If user has a version > 0 but token has none, it's an old token
                res.status(401);
                throw new Error('Session expired');
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(401);
        throw new Error('Not authorized as an admin');
    }
};

const identify = asyncHandler(async (req, res, next) => {
    let token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            console.error("Identify middleware failed:", error);
            // Don't throw, just continue without user
        }
    }
    next();
});

module.exports = { protect, admin, identify };
