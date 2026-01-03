const mongoose = require('mongoose');

const callLogSchema = mongoose.Schema({
    caller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: { // Usually Admin, but could be specific user if needed
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true, // Optional if broadcast
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
    duration: {
        type: Number, // In seconds
        default: 0,
    },
    status: {
        type: String,
        enum: ['missed', 'rejected', 'completed', 'busy', 'failed', 'ongoing'],
        default: 'ongoing',
    },
    type: {
        type: String, // 'audio', 'video'
        default: 'audio',
    },
    answeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isViewed: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const CallLog = mongoose.model('CallLog', callLogSchema);

module.exports = CallLog;
