const asyncHandler = require('express-async-handler');
const DailyStat = require('../models/DailyStat');

// @desc    Log a daily visit
// @route   POST /api/analytics/visit
// @access  Public
const logVisit = asyncHandler(async (req, res) => {
    const { type } = req.body; // 'login' or 'guest'

    // Get current date in YYYY-MM-DD format (UTC or consistent timezone)
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];

    // Prepare update object
    const update = {};
    if (type === 'login') {
        update.$inc = { loginVisits: 1 };
    } else {
        update.$inc = { guestVisits: 1 };
    }

    await DailyStat.findOneAndUpdate(
        { date: dateString },
        update,
        { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Visit logged' });
});

module.exports = {
    logVisit
};
