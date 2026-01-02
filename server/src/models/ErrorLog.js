const mongoose = require('mongoose');

const errorLogSchema = mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    stack: {
        type: String,
    },
    path: {
        type: String,
    },
    method: {
        type: String,
    },
    statusCode: {
        type: Number,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    source: {
        type: String, // 'server' or 'client'
        required: true,
        default: 'server',
    },
    ip: {
        type: String,
    },
    userAgent: {
        type: String,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    feedback: {
        type: String,
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('ErrorLog', errorLogSchema);
