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
let activeVoiceCalls = []; // Global Active Calls State

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

    // Sync active calls immediately to the new user
    socket.emit('activeVoiceCalls', activeVoiceCalls);

    const sendSystemMessage = require('./src/utils/sendSystemMessage');

    // ... (keep existing imports)

    // ... inside io.on('connection') ...

    // --- Voice Call Signaling ---
    socket.on("callUser", async (data) => {
        const { userToCall, signalData, from, name, isAdmin } = data; // 'from' here is likely Socket ID from Client? Or User ID? Client sends 'me' (Socket ID) usually.

        let callLogId = null;
        try {
            // Create Call Log (Missed status initially)
            const newCall = new CallLog({
                caller: userId, // The authenticated User ID
                receiver: userToCall, // This might be 'ADMINS' or specific ID
                status: 'missed',
                startTime: new Date()
            });
            await newCall.save();
            callLogId = newCall._id;
        } catch (err) { console.error(err); }

        // Check if target is 'ADMINS' or specific user
        let targetIsAdmin = false;
        try {
            if (userToCall === 'ADMIN' || userToCall === 'ADMINS') {
                targetIsAdmin = true;
            } else {
                const targetUser = await User.findById(userToCall);
                if (targetUser && targetUser.isAdmin) {
                    targetIsAdmin = true;
                }
            }
        } catch (e) { console.error(e); }

        if (targetIsAdmin) {
            // BROADCAST TO ALL ONLINE ADMINS
            const onlineAdmins = await User.find({ isAdmin: true, isOnline: true });

            let sentCount = 0;
            onlineAdmins.forEach(admin => {
                const adminSocketId = userSocketMap[admin._id.toString()];
                if (adminSocketId) {
                    io.to(adminSocketId).emit("callUser", {
                        signal: signalData,
                        from, // Socket ID (for WebRTC reply)
                        callerId: userId, // Mongo ID (for Logic/Cancel)
                        name,
                        callLogId,
                        isAdmin // passed from caller (e.g. is caller admin?)
                    });
                    sentCount++;
                }
            });

            if (sentCount === 0) {
                // No admins online
                io.to(socket.id).emit("callFailed", { reason: "No support agents online" });
                // Send offline msg
                try {
                    const sendSystemMessage = require('./src/utils/sendSystemMessage');
                    await sendSystemMessage({ app }, userId, `Missed voice call attempt from ${name} (Customer). Admins were offline. 📞`, null);
                } catch (e) { }
            }

        } else {
            // Normal 1-to-1 Call (Admin calling Customer)
            const socketId = userSocketMap[userToCall];
            if (socketId) {
                io.to(socketId).emit("callUser", {
                    signal: signalData,
                    from,
                    callerId: userId, // Mongo ID
                    name,
                    callLogId
                });
            } else {
                io.to(socket.id).emit("callFailed", { reason: "User offline" });
                try {
                    const sendSystemMessage = require('./src/utils/sendSystemMessage');
                    if (isAdmin) {
                        await sendSystemMessage({ app }, userToCall, `You missed a call from support (${name}). 📞`, null);
                    }
                } catch (msgErr) { }
            }
        }
    });

    // Voice Call Signaling Handlers Below


    // ...

    socket.on("answerCall", async (data) => {
        const socketId = userSocketMap[data.to]; // data.to is Caller ID (Customer)

        // NOTIFY OTHER ADMINS THAT CALL IS TAKEN
        io.emit('callTaken', { callLogId: data.callLogId, answeredBy: userId });

        try {
            if (data.callLogId) {
                // UPDATE RECEIVER TO THE ACTUAL ADMIN WHO ANSWERED
                await CallLog.findByIdAndUpdate(data.callLogId, {
                    status: 'ongoing',
                    startTime: new Date(),
                    receiver: userId // <--- CRITICAL FIX: Assign the call to this specific Admin
                });
            } else {
                // Fallback
                const recentCall = await CallLog.findOne({
                    caller: data.to,
                    // receiver: userId, // Don't restrict to me, it might be assigned to 'ADMINS'
                    status: 'missed'
                }).sort({ createdAt: -1 });

                if (recentCall) {
                    recentCall.status = 'ongoing';
                    recentCall.startTime = new Date();
                    recentCall.receiver = userId; // Assign to me
                    await recentCall.save();
                    data.callLogId = recentCall._id; // Ensure we have ID for next steps
                }
            }
        } catch (err) {
            console.error(err);
        }

        // Update Global Active Calls
        // Fetch fresh data with populated names
        let callDetails = null;
        if (data.callLogId) {
            try {
                const call = await CallLog.findById(data.callLogId).populate('caller', 'name').populate('receiver', 'name');
                if (call) {
                    // Prevent Duplicates
                    const existingIndex = activeVoiceCalls.findIndex(c => c.callLogId === data.callLogId);

                    const callObj = {
                        callLogId: data.callLogId,
                        caller: { id: call.caller._id, name: call.caller.name },
                        receiver: { id: call.receiver._id, name: call.receiver.name }, // Now this will be the specific Admin
                        startTime: existingIndex !== -1 ? activeVoiceCalls[existingIndex].startTime : new Date()
                    };

                    if (existingIndex !== -1) {
                        activeVoiceCalls[existingIndex] = callObj;
                    } else {
                        activeVoiceCalls.push(callObj);
                    }

                    io.emit('activeVoiceCalls', activeVoiceCalls);
                    callDetails = call;
                }
            } catch (e) { console.error("Error populating active call:", e); }
        }

        if (socketId) {
            io.to(socketId).emit("callAccepted", data.signal);
        }
    });

    socket.on("rejectCall", async (data) => {
        const socketId = userSocketMap[data.to]; // data.to is Customer
        console.log(`[Socket] Call Rejected by ${userId} for ${data.to}`);

        try {
            // Update status to rejected
            // We find the specific call log if possible, otherwise most recent ringing
            const recentCall = await CallLog.findOne({
                caller: data.to,
                // receiver: userId, // Don't restrict receiver if it was a broadcast
                status: 'missed'
            }).sort({ createdAt: -1 });

            if (recentCall) {
                recentCall.status = 'rejected';
                await recentCall.save();
            }

            // ROBUST CANCEL: Broadcast by Caller ID to ensure clients remove the item
            // This covers cases where Call Log ID might be desynced or not needed
            const onlineAdmins = await User.find({ isAdmin: true, isOnline: true });
            onlineAdmins.forEach(admin => {
                const adminSock = userSocketMap[admin._id.toString()];
                if (adminSock) {
                    io.to(adminSock).emit("callCancelled", {
                        callLogId: recentCall?._id,
                        callerId: data.to // The customer ID to remove from queue
                    });
                }
            });

        } catch (err) {
            console.error("Error in rejectCall:", err);
        }

        if (socketId) {
            io.to(socketId).emit("callRejected");
        }
    });

    socket.on("endCall", async (data) => {
        const userIdStr = userId.toString();
        // console.log(`[Socket] EndCall received from ${userIdStr} target ${data.to}`);

        let broadcastedCancel = false;

        // 1. SURGICAL CANCELLATION (DB Based)
        try {
            const ringingCall = await CallLog.findOne({
                $or: [
                    { caller: userId },
                    { caller: data.to }
                ],
                status: 'missed'
            }).sort({ createdAt: -1 });

            if (ringingCall && (new Date() - ringingCall.createdAt < 120000)) {
                // Found the specific call!
                ringingCall.status = 'cancelled';
                await ringingCall.save();

                // Broadcast specific CallLogID and the specific Caller
                io.emit("callCancelled", {
                    callLogId: ringingCall._id,
                    callerId: ringingCall.caller
                });
                broadcastedCancel = true;
                console.log(`[Socket] Surgically cancelled call ${ringingCall._id}`);
            }
        } catch (e) { console.error(e); }

        // 2. LOGIC-BASED FALLBACK (If DB missing or slow)
        if (!broadcastedCancel) {
            console.log(`[Socket] No specific ringing call found. Exploring fallback.`);

            try {
                // Determine if 'userId' is Admin or Customer to know who to cancel
                const user = await User.findById(userId);

                if (user && user.isAdmin) {
                    // Start of Rejection Logic: Admin rejected someone
                    if (data.to) {
                        io.emit("callCancelled", { callerId: data.to }); // Cancel the Customer
                    }
                } else {
                    // Customer hanging up: Cancel Self
                    io.emit("callCancelled", { callerId: userIdStr });
                }
            } catch (e) {
                // Absolute safest fallback: valid ID wipe
                io.emit("callCancelled", { callerId: userIdStr });
            }
        }

        // 3. Find/Kill Active Call (Real-time state)
        const activeCallIndex = activeVoiceCalls.findIndex(c =>
            c.caller.id.toString() === userIdStr || c.receiver.id.toString() === userIdStr
        );

        if (activeCallIndex !== -1) {
            const call = activeVoiceCalls[activeCallIndex];
            const callerSock = userSocketMap[call.caller.id.toString()];
            const receiverSock = userSocketMap[call.receiver.id.toString()];

            console.log(`[Socket] Found active call to kill: ${call.caller.name} <-> ${call.receiver.name}`);

            // KILL BOTH SIDES
            if (callerSock) io.to(callerSock).emit("callEnded");
            if (receiverSock) io.to(receiverSock).emit("callEnded");

            // Remove from memory
            activeVoiceCalls.splice(activeCallIndex, 1);

            // Broadcast new list
            io.emit('activeVoiceCalls', activeVoiceCalls);
        } else {
            console.log("[Socket] No active voice call found in memory for this user. Trying DB cleanup.");
        }

        // 3. DB Cleanup / Fallback
        // Even if not in activeVoiceCalls (maybe sinking), ensure DB is updated
        try {
            // Find ONGOING or RINGING logic in DB
            let activeCall = await CallLog.findOne({
                $or: [
                    { caller: userId },
                    { receiver: userId },
                    { caller: data.to },
                    { receiver: data.to }
                ],
                status: { $in: ['ongoing', 'missed'] } // update missed too if found?
            }).sort({ createdAt: -1 });

            // If we found a relevant call that is 'active' (time threshold?)
            if (activeCall) {
                const isRecent = (new Date() - activeCall.createdAt) < 3600000; // 1 hour
                if (activeCall.status === 'ongoing' && isRecent) {
                    activeCall.status = 'completed';
                    activeCall.endTime = new Date();
                    activeCall.duration = (activeCall.endTime - activeCall.startTime) / 1000;
                    await activeCall.save();
                } else if (activeCall.status === 'missed' && isRecent) {
                    activeCall.status = 'cancelled';
                    await activeCall.save();
                }
            }
        } catch (err) {
            console.error("Error in endCall DB cleanup:", err);
        }

        // Just in case, broadcast active list again to be sure
        io.emit('activeVoiceCalls', activeVoiceCalls);
    });

    // Clean up on disconnect
    socket.on('disconnect', async () => {
        // Cleanup ringing calls from this user
        if (userId) {
            try {
                // AGGRESSIVE CANCEL on Disconnect
                io.emit("callCancelled", { callerId: userId });

                const ringingCall = await CallLog.findOne({ caller: userId, status: 'missed' }).sort({ createdAt: -1 });
                if (ringingCall && (new Date() - ringingCall.createdAt < 60000)) {
                    ringingCall.status = 'cancelled';
                    await ringingCall.save();
                }
            } catch (e) { }
        }

        // Cleanup active calls involving this user
        const initialLength = activeVoiceCalls.length;
        activeVoiceCalls = activeVoiceCalls.filter(c => c.caller.id.toString() !== userId && c.receiver.id.toString() !== userId);
        if (activeVoiceCalls.length !== initialLength) {
            io.emit('activeVoiceCalls', activeVoiceCalls);
        }

        // Online status update
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