const asyncHandler = require('express-async-handler');
const ErrorLog = require('../models/ErrorLog');

// @desc    Log error from client
// @route   POST /api/errors/client
// @access  Public
const logClientError = asyncHandler(async (req, res) => {
    const { message, stack, path, componentStack } = req.body;

    const log = await ErrorLog.create({
        message: message || 'Unknown Client Error',
        stack: stack ? (componentStack ? `${stack}\n\nComponent Stack:\n${componentStack}` : stack) : null,
        path: path || 'client',
        source: 'client',
        user: req.user ? req.user._id : null,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });

    const io = req.app.get('io');
    if (io) {
        io.emit('errorLogCreated', log);
    }

    res.status(201).json({
        success: true,
        errorLogId: log._id
    });
});

// @desc    Update feedback for an error log
// @route   POST /api/errors/feedback
// @access  Public
const updateErrorFeedback = asyncHandler(async (req, res) => {
    const { errorLogId, feedback } = req.body;

    const log = await ErrorLog.findById(errorLogId);

    if (log) {
        log.feedback = feedback;
        await log.save();
        res.json({ success: true });
    } else {
        res.status(404);
        throw new Error('Error log not found');
    }
});

// @desc    Get all error logs
// @route   GET /api/errors
// @access  Private/Admin
const getErrorLogs = asyncHandler(async (req, res) => {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;

    const filter = {
        message: { $ne: 'Not authorized, no token' }
    };

    const count = await ErrorLog.countDocuments(filter);

    const logs = await ErrorLog.find(filter)
        .populate('user', 'id name email')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({ logs, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Get unread error count
// @route   GET /api/errors/unread
// @access  Private/Admin
const getUnreadErrorCount = asyncHandler(async (req, res) => {
    const count = await ErrorLog.countDocuments({
        isRead: false,
        message: { $ne: 'Not authorized, no token' }
    });
    res.json({ count });
});

// @desc    Mark all errors as read
// @route   PUT /api/errors/read
// @access  Private/Admin
const markErrorsAsRead = asyncHandler(async (req, res) => {
    await ErrorLog.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true });
});

// @desc    Delete error log
// @route   DELETE /api/errors/:id
// @access  Private/Admin
const deleteErrorLog = asyncHandler(async (req, res) => {
    const log = await ErrorLog.findById(req.params.id);

    if (log) {
        await log.deleteOne();
        res.json({ message: 'Error log removed' });
    } else {
        res.status(404);
        throw new Error('Error log not found');
    }
});

// @desc    Clear all error logs
// @route   DELETE /api/errors
// @access  Private/Admin
const clearErrorLogs = asyncHandler(async (req, res) => {
    await ErrorLog.deleteMany({});
    res.json({ message: 'All error logs cleared' });
});

module.exports = {
    logClientError,
    updateErrorFeedback,
    getErrorLogs,
    deleteErrorLog,
    clearErrorLogs,
    getUnreadErrorCount,
    markErrorsAsRead
};
