const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');
const sendSystemMessage = require('../utils/sendSystemMessage');

const pendingOfflineMessages = new Map();

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { text, recipientId } = req.body;

    let conversationUser;

    // If admin is sending, they must provide recipientId (the user they are talking to)
    if (req.user.isAdmin && recipientId) {
        conversationUser = recipientId;
    } else {
        // If regular user is sending, the conversation is theirs
        conversationUser = req.user._id;
    }

    const message = await Message.create({
        user: conversationUser,
        sender: req.user._id,
        text,
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name isAdmin');

    const io = req.app.get('io');
    if (io) {
        io.emit('newMessage', populatedMessage);
    }

    res.status(201).json(populatedMessage);

    // Bot Logic
    if (req.user.isAdmin) {
        // If admin replies, cancel any pending bot message for this user
        if (recipientId && pendingOfflineMessages.has(recipientId.toString())) {
            clearTimeout(pendingOfflineMessages.get(recipientId.toString()));
            pendingOfflineMessages.delete(recipientId.toString());
        }
    } else {
        const userIdStr = req.user._id.toString();

        // 1. Clear previous pending message to debounce (if user types multiple msgs)
        if (pendingOfflineMessages.has(userIdStr)) {
            clearTimeout(pendingOfflineMessages.get(userIdStr));
            pendingOfflineMessages.delete(userIdStr);
        }

        const anyAdminOnline = await User.findOne({
            isAdmin: true,
            isOnline: true,
            name: { $not: /admin\s*bot/i } // Exclude bot from "real admin" check
        });

        if (!anyAdminOnline) {
            // Wait 30 seconds
            const timerId = setTimeout(async () => {
                // Remove from map as it's firing
                pendingOfflineMessages.delete(userIdStr);

                // FINAL CHECK: Is admin online now?
                const adminNow = await User.findOne({
                    isAdmin: true,
                    isOnline: true,
                    name: { $not: /admin\s*bot/i }
                });
                if (!adminNow) {
                    const msg = "Currently admins are offline 🌙\n\nYou can continue shopping 🛍️\n\nAdmins will see your message and reply soon! ⏳";
                    try {
                        await sendSystemMessage(req, userIdStr, msg);
                    } catch (err) {
                        console.error("Bot particular message error:", err);
                    }
                }
            }, 15000);

            pendingOfflineMessages.set(userIdStr, timerId);
        }
    }
});

// @desc    Get messages for a user conversation
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    // If admin, can see any user's messages.
    // If user, can only see their own.

    let targetUserId = req.params.userId;

    if (!req.user.isAdmin && targetUserId !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to view these messages');
    }

    const limit = parseInt(req.query.limit) || 25;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await Message.find({ user: targetUserId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('sender', 'name isAdmin');

    res.json(messages.reverse());
});

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:userId
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const targetUserId = req.params.userId;

    // If I am admin reading user's messages, I mark messages sent by User as read.
    // If I am user reading my messages, I mark messages sent by Admin as read.

    let filter = { user: targetUserId, isRead: false };

    if (req.user.isAdmin) {
        // Mark messages where sender is the user (not me)
        filter.sender = targetUserId;
    } else {
        // Mark messages where sender is NOT me (so, admin)
        filter.sender = { $ne: req.user._id };
    }

    await Message.updateMany(filter, { isRead: true });

    const io = req.app.get('io');
    if (io) {
        io.emit('messagesRead', { userId: targetUserId });
    }

    res.json({ message: 'Messages marked as read' });
});

// @desc    Get unread count for current user (or Admin summary)
// @route   GET /api/messages/unread
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
    if (req.user.isAdmin) {
        // Count unread messages from Customers (where sender === user)
        // Check if message is unread AND sender is the conversation owner (customer)
        const result = await Message.aggregate([
            { $match: { isRead: false } },
            {
                $project: {
                    sender: 1,
                    user: 1,
                    isCustomerMsg: { $eq: ["$sender", "$user"] }
                }
            },
            { $match: { isCustomerMsg: true } },
            { $count: "count" }
        ]);

        const count = result.length > 0 ? result[0].count : 0;
        res.json({ count });
    } else {
        // Customer: Count unread messages belonging to this conversation where sender is NOT me.
        const count = await Message.countDocuments({
            user: req.user._id,
            isRead: false,
            sender: { $ne: req.user._id }
        });
        res.json({ count });
    }
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    // Allow deletion if user is sender OR admin
    if (message.sender.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(401);
        throw new Error('Not authorized to delete this message');
    }

    await message.deleteOne();

    const io = req.app.get('io');
    if (io) {
        io.emit('messageDeleted', {
            id: req.params.id,
            isUnread: !message.isRead,
            sender: message.sender,
            user: message.user
        });
    }

    res.json({ message: 'Message removed' });
});

module.exports = { sendMessage, getMessages, markAsRead, getUnreadCount, deleteMessage };
