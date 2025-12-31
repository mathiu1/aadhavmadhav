const mongoose = require('mongoose');

const dailyStatSchema = mongoose.Schema({
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
        unique: true
    },
    loginVisits: {
        type: Number,
        required: true,
        default: 0
    },
    guestVisits: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});

const DailyStat = mongoose.model('DailyStat', dailyStatSchema);

module.exports = DailyStat;
