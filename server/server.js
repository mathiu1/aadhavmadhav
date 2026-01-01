const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const path = require('path');
const cookieParser = require('cookie-parser');
const User = require('./src/models/User');

// Load env vars
dotenv.config();

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

require("./ping.js");

app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/upload', require('./src/routes/uploadRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/analytics', require('./src/routes/analyticsRoutes'));


if(process.env.NODE_ENV==="production"){
  app.use(express.static(path.join(__dirname,"../client/dist")));


app.get(/.*/, (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/dist/index.html"));
});

}

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});