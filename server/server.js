const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const path = require('path');
const cookieParser = require('cookie-parser');
const User = require('./src/models/User');
const ErrorLog = require('./src/models/ErrorLog');
const CallLog = require('./src/models/CallLog');

// Load env vars
dotenv.config();

// Keep-alive ping
require('./ping');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'https://aadhavmadhav.onrender.com', 
        methods: ['GET', 'POST'],
    },
});

const userSocketMap = {}; // { userId: socketId }

app.set('io', io);

io.on('connection', (socket) => {
    // console.log('A user connected', socket.id);
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
        userSocketMap[userId] = socket.id;

        // Update user status in DB
        User.findByIdAndUpdate(userId, { isOnline: true }).exec();
    }

    // Emit online users
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    const sendSystemMessage = require('./src/utils/sendSystemMessage');

    // ... (keep existing imports)

    // ... inside io.on('connection') ...

    // --- Voice Call Signaling ---
    socket.on("callUser", async ({ userToCall, signalData, from, name, isAdmin }) => {
        // Create Call Log (Default status: missed - assuming no answer until updated)
        let callLogId = null;
        try {
            const newCall = await CallLog.create({
                caller: from,
                receiver: userToCall,
                status: 'missed', // Will be updated to 'ongoing' if answered
                startTime: new Date()
            });
            callLogId = newCall._id;
        } catch (err) {
            console.error("Error creating call log:", err);
        }

        const socketId = userSocketMap[userToCall];
        if (socketId) {
            io.to(socketId).emit("callUser", { signal: signalData, from, name, callLogId, isAdmin });
        } else {
            // User offline
            io.to(socket.id).emit("callFailed", { reason: "User offline" });

            // AUTOMATIC MISSED CALL NOTIFICATION
            try {
                if (isAdmin) {
                    // Admin calling Customer (Offline)
                    // Send to Customer: "You missed a call from support..."
                    await sendSystemMessage({ app }, userToCall, `You missed a call from our support team (${name}). We'll try again shortly! 📞`, null);
                } else {
                    // Customer calling Admin (Offline)
                    // Send to Customer's Thread (so Admin sees it later): "Missed Call from Customer..."
                    // Note: receiverId = from (The Customer), so it goes into THEIR thread.
                    await sendSystemMessage({ app }, from, `Missed voice call attempt from ${name} (Customer). Admins were offline. 📞`, null);
                }
            } catch (msgErr) {
                console.error("Failed to send auto-missed-call message", msgErr);
            }
        }
    });

    // Global Active Calls State (In-Memory)
    let activeVoiceCalls = []; // [{ id, caller, receiver, callerName, receiverName, startTime, admins: [] }]

    // ...

    socket.on("answerCall", async (data) => {
        const socketId = userSocketMap[data.to]; // data.to is Caller ID

        // Update Call Log to Ongoing
        // We look for the most recent 'missed' call between these users
        try {
            // We need to know WHICH call. 
            // Ideally client sends callLogId, but if not, we find recent one
            if (data.callLogId) {
                await CallLog.findByIdAndUpdate(data.callLogId, { status: 'ongoing', startTime: new Date() });
            } else {
                // Fallback: Find recent missed call from 'data.to' (caller) to 'userId' (receiver/me)
                const recentCall = await CallLog.findOne({
                    caller: data.to,
                    receiver: userId,
                    status: 'missed'
                }).sort({ createdAt: -1 });

                if (recentCall) {
                    recentCall.status = 'ongoing';
                    recentCall.startTime = new Date();
                    await recentCall.save();
                }
            }
        } catch (err) {
            console.error(err);
        }

        // Update Global Active Calls
        // We need names. passed in data? No.
        // We can fetch from DB calls if needed, OR just store IDs and let client resolve names if possible.
        // But for speed, let's try to get names.
        // Actually, 'callUser' event had names. 'answerCall' payload usually just has signal.
        // We might need to enhance 'answerCall' to carry metadata or look up in `userSocketMap`/DB.

        let callDetails = null;
        if (data.callLogId) {
            const call = await CallLog.findById(data.callLogId).populate('caller', 'name').populate('receiver', 'name');
            if (call) {
                activeVoiceCalls.push({
                    callLogId: data.callLogId,
                    caller: { id: call.caller._id, name: call.caller.name },
                    receiver: { id: call.receiver._id, name: call.receiver.name },
                    startTime: new Date()
                });
                io.emit('activeVoiceCalls', activeVoiceCalls);
                callDetails = call;
            }
        }

        if (socketId) {
            io.to(socketId).emit("callAccepted", data.signal);
        }
    });

    socket.on("rejectCall", async (data) => {
        const socketId = userSocketMap[data.to];

        try {
            // Update status to rejected
            const recentCall = await CallLog.findOne({
                caller: data.to,
                receiver: userId,
                status: 'missed'
            }).sort({ createdAt: -1 });

            if (recentCall) {
                recentCall.status = 'rejected';
                await recentCall.save();
            }
        } catch (err) {
            console.error(err);
        }

        if (socketId) {
            io.to(socketId).emit("callRejected");
        }
    });

    socket.on("endCall", async (data) => {
        const socketId = userSocketMap[data.to];

        try {
            // Find the active ongoing call involving these two
            // We don't know who is caller/receiver easily without ID, check both directions
            const activeCall = await CallLog.findOne({
                $or: [
                    { caller: userId, receiver: data.to },
                    { caller: data.to, receiver: userId }
                ],
                status: 'ongoing'
            }).sort({ createdAt: -1 });

            if (activeCall) {
                activeCall.status = 'completed';
                activeCall.endTime = new Date();
                activeCall.duration = (activeCall.endTime - activeCall.startTime) / 1000;
                await activeCall.save();
            }
        } catch (err) {
            console.error(err);
        }

        // Remove from activeVoiceCalls
        activeVoiceCalls = activeVoiceCalls.filter(c =>
            !(c.caller.id.toString() === userId || c.caller.id.toString() === data.to) &&
            !(c.receiver.id.toString() === userId || c.receiver.id.toString() === data.to)
        );
        io.emit('activeVoiceCalls', activeVoiceCalls);

        if (socketId) {
            io.to(socketId).emit("callEnded");
        }
    });

    // Clean up on disconnect
    socket.on('disconnect', async () => {
        // ... existing disconnect logic ...

        // Cleanup active calls involving this user
        const initialLength = activeVoiceCalls.length;
        activeVoiceCalls = activeVoiceCalls.filter(c => c.caller.id.toString() !== userId && c.receiver.id.toString() !== userId);
        if (activeVoiceCalls.length !== initialLength) {
            io.emit('activeVoiceCalls', activeVoiceCalls);
        }
    });
    // ----------------------------

    socket.on('disconnect', async () => {
        // console.log('user disconnected', socket.id);

        if (userId && userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId];
            await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
            io.emit('getOnlineUsers', Object.keys(userSocketMap));
        }
    });
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'https://aadhavmadhav.onrender.com', 
    credentials: true,
}));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Routes (Placeholders)
app.get('/api/ping', (req, res) => {
    res.send('API is running...');
});

//require("./ping.js");

app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));
app.use('/api/errors', require('./src/routes/errorLogRoutes'));
app.use('/api/config', require('./src/routes/configRoutes'));

app.use('/api/calls', require('./src/routes/callRoutes'));


if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../client/dist")));


    app.get(/.*/, (req, res) => {
        res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
    });

}

// Error Handling Middleware
// Error Handling Middleware
app.use(async (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log to DB
    let logId = null;
    try {
        const skipTerms = ['Not authorized', 'Invalid email or password', 'jwt', 'token', 'cookie', 'signature'];
        const shouldSkip = skipTerms.some(term => err.message.toLowerCase().includes(term.toLowerCase()));

        if (!shouldSkip) {
            const log = await ErrorLog.create({
                message: err.message,
                stack: err.stack,
                path: req.originalUrl,
                method: req.method,
                statusCode: statusCode,
                user: req.user ? req.user._id : null,
                source: 'server',
                ip: req.ip,
                userAgent: req.headers['user-agent']
            });
            logId = log._id;

            // Emit socket event
            const io = req.app.get('io');
            if (io) {
                io.emit('errorLogCreated', log);
            }
        }
    } catch (loggingError) {
        console.error("Failed to log error to DB:", loggingError);
    }

    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        errorLogId: logId,
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});