const express = require('express');
const router = express.Router();
const CallLog = require('../models/CallLog');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Log a new call (Initially or update status)
// @route   POST /api/calls
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { receiverId, status, type } = req.body;
        const call = await CallLog.create({
            caller: req.user._id,
            receiver: receiverId, // Can be null if broadcasting
            status: status || 'ongoing',
            type: type || 'audio'
        });
        res.status(201).json(call);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update call log (End call, Answered, etc)
// @route   PUT /api/calls/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const call = await CallLog.findById(req.params.id);
        if (call) {
            call.status = req.body.status || call.status;
            call.endTime = req.body.endTime || new Date();
            call.duration = req.body.duration || 0;
            if (req.body.answeredBy) {
                call.answeredBy = req.body.answeredBy;
            }
            const updatedCall = await call.save();
            res.json(updatedCall);
        } else {
            res.status(404).json({ message: 'Call log not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get all calls (Admin)
// @route   GET /api/calls
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const pageSize = 20;
        const page = Number(req.query.pageNumber) || 1;

        const count = await CallLog.countDocuments({});
        const calls = await CallLog.find({})
            .populate('caller', 'name email isAdmin')
            .populate('receiver', 'name email isAdmin') // Added receiver population
            .populate('answeredBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.json({ calls, page, pages: Math.ceil(count / pageSize), count });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Get missed calls count grouping by user (Only Unviewed)
// @route   GET /api/calls/missed
// @access  Private/Admin
router.get('/missed', protect, admin, async (req, res) => {
    try {
        // Aggregate to find users with 'missed' calls status AND isViewed: false
        const missedCalls = await CallLog.aggregate([
            { $match: { status: 'missed', isViewed: false } },
            { $group: { _id: "$caller", count: { $sum: 1 } } }
        ]);
        res.json(missedCalls);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Mark all missed calls as viewed
// @route   PUT /api/calls/missed/mark-read
// @access  Private/Admin
router.put('/missed/mark-read', protect, admin, async (req, res) => {
    try {
        await CallLog.updateMany(
            { status: 'missed', isViewed: false },
            { $set: { isViewed: true } }
        );
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
