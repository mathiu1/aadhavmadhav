const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const DailyStat = require('../models/DailyStat');
const sendSystemMessage = require('../utils/sendSystemMessage');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items');
    } else {
        // Validate product availability before creating order
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                res.status(404);
                throw new Error(`Product not found: ${item.name}`);
            }
            if (product.isDeleted) {
                res.status(400);
                throw new Error(`Product '${product.name}' is currently unavailable. Please remove it from your cart.`);
            }
            if (product.countInStock < item.qty) {
                res.status(400);
                throw new Error(`Insufficient stock for '${product.name}'.`);
            }
        }

        const order = new Order({
            user: req.user._id,
            orderItems: orderItems.map((x) => ({
                ...x,
                product: x.product,
                _id: undefined
            })),
            shippingAddress,
            paymentMethod,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
        });

        const createdOrder = await order.save();

        // Send automated confirmation message
        const itemNames = createdOrder.orderItems.map((x, i) => `${i + 1}. ${x.name} (x${x.qty})`).join('\n');
        const msg = `Order Placed! 📦\n\n ID: ${createdOrder._id}\n\n🛒 Items:\n${itemNames}\n\n💰 Total: ₹${createdOrder.totalPrice}\n\n⚙️ Status: Processing.`;
        sendSystemMessage(req, req.user._id, msg);

        // Clear user's cart
        const user = await User.findById(req.user._id);
        if (user) {
            user.cartItems = [];
            await user.save();
        }

        res.status(201).json(createdOrder);
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name email')
        .populate('orderItems.product', 'isDeleted');

    if (order) {
        res.json(order);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
            id: req.body.id || 'Manual',
            status: req.body.status || 'Completed',
            update_time: req.body.update_time || Date.now(),
            email_address: req.body.email_address || 'manual@example.com',
        };

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to shipped
// @route   PUT /api/orders/:id/ship
// @access  Private/Admin
const updateOrderToShipped = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = 'Shipped';
        const updatedOrder = await order.save();

        // Send automated shipped message
        const adminName = req.user.name;
        const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const msg = `Your order has been SHIPPED! 🚚\n\n Order ID: ${updatedOrder._id}\n\n💰 Price: ₹${updatedOrder.totalPrice}\n\n👤 Updated by Admin: ${adminName}\n🕒 Time: ${time}`;
        sendSystemMessage(req, order.user, msg, req.user._id);

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        order.status = 'Delivered';

        // Automatically mark as paid when delivered
        order.isPaid = true;
        order.paidAt = Date.now();

        // Decrease product stock
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.countInStock = product.countInStock - item.qty;
                await product.save();
            }
        }

        const updatedOrder = await order.save();

        // Send automated delivered message
        const adminName = req.user.name;
        const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const msg = `Your order successfully DELIVERED! 🎉\n\n Order ID: ${updatedOrder._id}\n\n Thanks for buying!\n\n👤 Updated by Admin: ${adminName}\n🕒 Time: ${time}`;
        sendSystemMessage(req, order.user, msg, req.user._id);

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Update order to cancelled
// @route   PUT /api/orders/:id/cancel
// @access  Private/Admin
const updateOrderToCancelled = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
        order.status = 'Cancelled';
        order.cancelledAt = Date.now();
        order.cancellationReason = req.body.reason || 'No reason provided';

        const updatedOrder = await order.save();

        // Send automated cancellation message
        const adminName = req.user.name;
        const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const reason = req.body.reason || 'No specific reason provided.';
        const msg = `Your order has been CANCELLED! ❌\n\nOrder ID: ${updatedOrder._id}\n\n⚠️ Reason: ${reason}\n\n👤 Updated by Admin: ${adminName}\n🕒 Time: ${time}`;
        sendSystemMessage(req, order.user, msg, req.user._id);

        res.json(updatedOrder);
    } else {
        res.status(404);
        throw new Error('Order not found');
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
    res.json(orders);
});

// @desc    Get dashboard summary with filters
// @route   GET /api/orders/summary
// @access  Private/Admin
const getOrderSummary = asyncHandler(async (req, res) => {
    const { range, startDate, endDate } = req.query;

    let baseDateQuery = {};
    let prevBaseDateQuery = {}; // For comparison
    const now = new Date();

    if (range === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        baseDateQuery = { createdAt: { $gte: weekAgo } };
        prevBaseDateQuery = { createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } };
    } else if (range === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        baseDateQuery = { createdAt: { $gte: monthAgo } };
        prevBaseDateQuery = { createdAt: { $gte: twoMonthsAgo, $lt: monthAgo } };
    } else if (range === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        baseDateQuery = { createdAt: { $gte: yearAgo } };
        prevBaseDateQuery = { createdAt: { $gte: twoYearsAgo, $lt: yearAgo } };
    } else if (range === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - diff); // Approximate previous period of same duration

        baseDateQuery = {
            createdAt: {
                $gte: start,
                $lte: end
            }
        };
        prevBaseDateQuery = {
            createdAt: {
                $gte: prevStart,
                $lt: start
            }
        };
    }

    // Filter for Orders: MUST BE DELIVERED
    const orderQuery = { ...baseDateQuery, isDelivered: true };
    const prevOrderQuery = { ...prevBaseDateQuery, isDelivered: true };

    // --- Current Period Stats ---
    const ordersCount = await Order.countDocuments(orderQuery);
    const usersCount = await User.countDocuments(baseDateQuery);
    const productsCount = await Product.countDocuments();
    const outOfStockProducts = await Product.countDocuments({ countInStock: 0 });

    const ordersAll = await Order.find(orderQuery);
    const totalRevenue = ordersAll.reduce((acc, order) => acc + order.totalPrice, 0);

    // --- Previous Period Stats (for Growth Calc) ---
    const prevOrdersCount = await Order.countDocuments(prevOrderQuery);
    const prevUsersCount = await User.countDocuments(prevBaseDateQuery);
    const prevOrdersAll = await Order.find(prevOrderQuery);
    const prevTotalRevenue = prevOrdersAll.reduce((acc, order) => acc + order.totalPrice, 0);

    // Helper for percentage change
    const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const ordersGrowth = calculateGrowth(ordersCount, prevOrdersCount);
    const usersGrowth = calculateGrowth(usersCount, prevUsersCount);
    const revenueGrowth = calculateGrowth(totalRevenue, prevTotalRevenue);

    // Chart aggregation format depends on range
    let dateFormat = "%Y-%m"; // Default: Monthly
    if (range === 'week' || range === 'month') {
        dateFormat = "%Y-%m-%d"; // Granular: Daily
    }

    const salesDataRaw = await Order.aggregate([
        { $match: baseDateQuery },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                totalSales: { $sum: "$totalPrice" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const userDataRaw = await User.aggregate([
        { $match: baseDateQuery },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const formatLabel = (id) => {
        if (dateFormat === "%Y-%m-%d") {
            const [y, m, d] = id.split("-");
            return `${monthNames[parseInt(m) - 1]} ${d}`;
        } else {
            const [year, month] = id.split("-");
            return monthNames[parseInt(month) - 1] + " " + year;
        }
    };

    // --- Advanced Analytics Aggregations ---

    // 1. Top Selling Categories
    const topCategories = await Order.aggregate([
        { $match: orderQuery },
        { $unwind: "$orderItems" },
        {
            $lookup: {
                from: "products",
                localField: "orderItems.product",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        { $unwind: "$productDetails" },
        {
            $group: {
                _id: "$productDetails.category",
                revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } },
                qty: { $sum: "$orderItems.qty" }
            }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
    ]);

    // 2. Top Selling Products
    const topProducts = await Order.aggregate([
        { $match: orderQuery },
        { $unwind: "$orderItems" },
        {
            $group: {
                _id: "$orderItems.product",
                name: { $first: "$orderItems.name" },
                image: { $first: "$orderItems.image" },
                price: { $first: "$orderItems.price" },
                qty: { $sum: "$orderItems.qty" },
                revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } }
            }
        },
        { $sort: { qty: -1 } },
        { $limit: 10 }
    ]);

    // 3. Top Spending Users
    const topUsers = await Order.aggregate([
        { $match: { ...orderQuery, user: { $ne: null } } },
        {
            $group: {
                _id: "$user",
                totalSpent: { $sum: "$totalPrice" },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: "$userDetails" },
        {
            $project: {
                _id: 1,
                totalSpent: 1,
                orderCount: 1,
                name: "$userDetails.name",
                email: "$userDetails.email"
            }
        }
    ]);

    const salesData = salesDataRaw.map(item => ({
        name: formatLabel(item._id),
        revenue: Math.round(item.totalSales),
        orders: item.count
    }));

    // --- Merge Daily Stats for User Growth Chart ---
    let statsQuery = {};
    if (baseDateQuery.createdAt) {
        statsQuery.date = {};
        if (baseDateQuery.createdAt.$gte) {
            statsQuery.date.$gte = baseDateQuery.createdAt.$gte.toISOString().split('T')[0];
        }
        if (baseDateQuery.createdAt.$lte) {
            statsQuery.date.$lte = baseDateQuery.createdAt.$lte.toISOString().split('T')[0];
        }
    }

    const dailyStats = await DailyStat.find(statsQuery);

    const mergedMap = {};

    // 1. Add Registrations
    userDataRaw.forEach(item => {
        mergedMap[item._id] = {
            dateKey: item._id,
            users: item.count,
            loginVisits: 0,
            guestVisits: 0
        };
    });

    // 2. Add Visits
    dailyStats.forEach(stat => {
        let key = stat.date; // YYYY-MM-DD
        if (range === 'year' && key.length >= 7) {
            key = key.substring(0, 7); // YYYY-MM
        }

        if (!mergedMap[key]) {
            mergedMap[key] = {
                dateKey: key,
                users: 0,
                loginVisits: 0,
                guestVisits: 0
            };
        }

        mergedMap[key].loginVisits += stat.loginVisits;
        mergedMap[key].guestVisits += stat.guestVisits;
    });

    const userData = Object.values(mergedMap)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .map(item => ({
            name: formatLabel(item.dateKey),
            users: item.users,
            loginVisits: item.loginVisits,
            guestVisits: item.guestVisits
        }));

    res.json({
        ordersCount,
        usersCount,
        productsCount,
        outOfStockProducts,
        totalRevenue: Math.round(totalRevenue),
        ordersGrowth,
        usersGrowth,
        revenueGrowth,
        salesData,
        userData,
        topCategories,
        topProducts,
        topUsers
    });
});

// @desc    Get orders by User ID
// @route   GET /api/orders/user/:id
// @access  Private/Admin
const getOrdersByUser = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.params.id }).populate('user', 'id name').sort({ createdAt: -1 });
    res.json(orders);
});

module.exports = {
    addOrderItems,
    getMyOrders,
    getOrderById,
    updateOrderToPaid,
    updateOrderToShipped,
    updateOrderToDelivered,
    updateOrderToCancelled,
    getOrders,
    getOrderSummary,
    getOrdersByUser,
};
