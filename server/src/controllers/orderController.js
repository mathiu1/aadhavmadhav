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

    // Filter for Users: Exclude 'adminBot' (case insensitive)
    const userQuery = { ...baseDateQuery, name: { $not: /admin\s*bot/i } };
    const prevUserQuery = { ...prevBaseDateQuery, name: { $not: /admin\s*bot/i } };

    // --- Current Period Stats ---
    const ordersCount = await Order.countDocuments(orderQuery);
    const usersCount = await User.countDocuments(userQuery);
    const productsCount = await Product.countDocuments();
    const outOfStockProducts = await Product.countDocuments({ countInStock: 0 });

    const ordersAll = await Order.find(orderQuery);
    const totalRevenue = ordersAll.reduce((acc, order) => acc + order.totalPrice, 0);

    // --- Previous Period Stats (for Growth Calc) ---
    const prevOrdersCount = await Order.countDocuments(prevOrderQuery);
    const prevUsersCount = await User.countDocuments(prevUserQuery);
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
        { $match: userQuery },
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

// @desc    Export orders report as CSV
// @route   GET /api/orders/export
// @access  Private/Admin
const exportReport = asyncHandler(async (req, res) => {
    const { period, startDate, endDate, status, category, user } = req.query;

    let query = {};

    // 1. Date Filtering
    if (period) {
        if (period !== 'all') { // Only filter if NOT 'all'
            const now = new Date();
            let start = new Date();
            if (period === 'week') {
                start.setDate(now.getDate() - 7);
            } else if (period === 'month') {
                start.setMonth(now.getMonth() - 1);
            } else if (period === 'year') {
                start.setFullYear(now.getFullYear() - 1);
            }
            query.createdAt = { $gte: start, $lte: now };
        }
    } else if (startDate && endDate) {
        // Adjust endDate to include the full day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: end
        };
    }

    // 2. Status Filtering
    if (status && status !== 'All') {
        query.status = status;
    }

    // 3. Category Filtering
    if (category && category !== 'All') {
        // Find products in this category
        const products = await Product.find({ category: category }).select('_id');
        const productIds = products.map(p => p._id);

        // Filter orders that contain these products
        query['orderItems.product'] = { $in: productIds };
    }

    // 4. User Filtering (Name or Email)
    if (user) {
        // Find users matching name or email (case-insensitive regex)
        const userRegex = new RegExp(user, 'i');
        const users = await User.find({
            $or: [{ name: userRegex }, { email: userRegex }]
        }).select('_id');

        const userIds = users.map(u => u._id);
        query.user = { $in: userIds };
    }

    const orders = await Order.find(query)
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

    let html = `
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; }
                table { border-collapse: collapse; width: 100%; border: 1px solid #000; }
                
                /* Title Header */
                .company-header {
                    background-color: #0f172a; 
                    color: #fbbf24; /* Amber text */
                    font-size: 24pt; 
                    font-weight: bold; 
                    text-align: center; 
                    padding: 20px;
                    border: 1px solid #000;
                }
                .report-date {
                    background-color: #1e293b;
                    color: #ffffff;
                    text-align: right;
                    font-size: 10pt;
                    padding: 5px;
                    font-style: italic;
                }

                th { 
                    padding: 12px; 
                    text-align: center; 
                    font-weight: bold;
                    white-space: nowrap;
                    color: #ffffff;
                    border: 1px solid #000;
                }
                
                td { 
                    border: 1px solid #000; 
                    padding: 8px; 
                    vertical-align: middle; 
                    color: #000;
                }

                .text-center { text-align: center; }
                .text-left { text-align: left; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                
                /* Status Colors */
                .status-paid { color: #166534; background-color: #dcfce7; font-weight: bold; }
                .status-unpaid { color: #991b1b; background-color: #fee2e2; font-weight: bold; }
                .status-delivered { color: #15803d; background-color: #dcfce7; font-weight: bold; }
                .status-pending { color: #854d0e; background-color: #fef9c3; font-weight: bold; }
                .status-cancelled { color: #b91c1c; background-color: #fee2e2; font-weight: bold; }
                
                .amount { font-family: 'Consolas', monospace; }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <!-- Company & Report Title -->
                    <tr>
                        <th colspan="25" class="company-header">
                            AadhavMadhav - Orders & Sales Report
                        </th>
                    </tr>
                    <tr>
                        <th colspan="25" class="report-date">
                            Generated on: ${new Date().toLocaleString()}
                        </th>
                    </tr>

                    <tr>
                        <!-- Order Details: Professional Blue -->
                        <th style="background-color: #366092;">Order ID</th>
                        <th style="background-color: #366092;">Order Date</th>
                        
                        <!-- Customer: Professional Purple -->
                        <th style="background-color: #5f497a;">User Name</th>
                        <th style="background-color: #5f497a;">User Email</th>
                        
                        <!-- Shipping: Professional Teal -->
                        <th style="background-color: #31869b;">Shipping Name</th>
                        <th style="background-color: #31869b;">Shipping Phone</th>
                        <th style="background-color: #31869b;">Address</th>
                        <th style="background-color: #31869b;">City</th>
                        <th style="background-color: #31869b;">State</th>
                        <th style="background-color: #31869b;">Postal Code</th>
                        <th style="background-color: #31869b;">Country</th>
                        
                        <!-- Product: Professional Dark Gray -->
                        <th style="background-color: #4a4a4a;">Product Name</th>
                        <th style="background-color: #4a4a4a;">Quantity</th>
                        <th style="background-color: #4a4a4a;">Item Price</th>
                        
                        <!-- Financials: Professional Olive Green -->
                        <th style="background-color: #76933c;">Tax Price</th>
                        <th style="background-color: #76933c;">Shipping Price</th>
                        <th style="background-color: #76933c;">Order Total</th>
                        
                        <!-- Status: Professional Burnt Orange & Red -->
                        <th style="background-color: #e26b0a;">Payment Method</th>
                        <th style="background-color: #e26b0a;">Payment Status</th>
                        <th style="background-color: #e26b0a;">Paid At</th>
                        <th style="background-color: #e26b0a;">Delivery Status</th>
                        <th style="background-color: #e26b0a;">Delivered At</th>
                        <th style="background-color: #e26b0a;">Order Status</th>
                        <th style="background-color: #963634;">Cancelled At</th>
                        <th style="background-color: #963634;">Cancellation Reason</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (orders.length === 0) {
        html += `
            <tr>
                <td colspan="25" style="text-align: center; padding: 20px; font-weight: bold; color: #dc2626; background-color: #fef2f2;">
                    No Orders Found match your criteria.
                </td>
            </tr>
        `;
    } else {
        orders.forEach(order => {
            const orderId = order._id;
            const date = new Date(order.createdAt).toISOString().split('T')[0];
            const userName = order.user ? order.user.name : 'Guest/Deleted';
            const userEmail = order.user ? order.user.email : 'N/A';

            // Shipping Details
            const shipName = order.shippingAddress?.name || 'N/A';
            const shipPhone = order.shippingAddress?.phone || 'N/A';
            const address = order.shippingAddress?.address || 'N/A';
            const city = order.shippingAddress?.city || 'N/A';
            const state = order.shippingAddress?.state || 'N/A';
            const postalCode = order.shippingAddress?.postalCode || 'N/A';
            const country = order.shippingAddress?.country || 'N/A';

            // Financials
            // Format as Currency: 1,234.00
            const formatMoney = (amount) => (amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const taxPrice = formatMoney(order.taxPrice);
            const shippingPrice = formatMoney(order.shippingPrice);
            const totalPrice = formatMoney(order.totalPrice);

            // Statuses
            const paymentMethod = order.paymentMethod;
            const isPaid = order.isPaid ? 'Paid' : 'Unpaid';
            const paidClass = order.isPaid ? 'status-paid' : 'status-unpaid';

            const paidAt = order.isPaid && order.paidAt ? new Date(order.paidAt).toISOString().split('T')[0] : '';

            const isDelivered = order.isDelivered ? 'Delivered' : 'Pending';
            const deliveredClass = order.isDelivered ? 'status-delivered' : 'status-pending';

            const deliveredAt = order.isDelivered && order.deliveredAt ? new Date(order.deliveredAt).toISOString().split('T')[0] : '';

            const status = order.status;
            let statusClass = '';
            if (status === 'Delivered') statusClass = 'status-delivered';
            else if (status === 'Cancelled') statusClass = 'status-cancelled';
            else statusClass = 'status-pending';

            const cancelledAt = order.cancelledAt ? new Date(order.cancelledAt).toISOString().split('T')[0] : '';
            const cancellationReason = order.cancellationReason || '';

            const items = order.orderItems;
            const rowSpan = items.length;

            items.forEach((item, index) => {
                html += '<tr>';

                // Common Columns (Render only on first row with rowspan)
                if (index === 0) {
                    // Formatting Helpers
                    const center = 'text-center';
                    const left = 'text-left';

                    html += `<td rowspan="${rowSpan}" class="${center} font-bold" style="background-color: #f8fafc;">${orderId}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${center}">${date}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${left}">${userName}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${left}">${userEmail}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${left}">${shipName}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${center}">${shipPhone}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${left}">${address}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${center}">${city}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${center}">${state}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${center}">${postalCode}</td>`;
                    html += `<td rowspan="${rowSpan}" class="${center}">${country}</td>`;
                }

                // Product Columns (Render every row)
                html += `<td class="text-left font-bold">${item.name}</td>`;
                html += `<td class="text-center">${item.qty}</td>`;
                html += `<td class="text-right amount">${formatMoney(item.price)}</td>`;

                // Common Columns Checksum (Render only on first row with rowspan)
                if (index === 0) {
                    html += `<td rowspan="${rowSpan}" class="text-right amount">${taxPrice}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-right amount">${shippingPrice}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-right amount font-bold" style="background-color: #f1f5f9;">${totalPrice}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-center">${paymentMethod}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-center ${paidClass}">${isPaid}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-center">${paidAt}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-center ${deliveredClass}">${isDelivered}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-center">${deliveredAt}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-center ${statusClass}">${status}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-center">${cancelledAt}</td>`;
                    html += `<td rowspan="${rowSpan}" class="text-left" style="color: #ef4444;">${cancellationReason}</td>`;
                }

                html += '</tr>';
            });
        });
    }

    html += `
                </tbody>
            </table>
        </body>
    `;

    res.header('Content-Type', 'application/vnd.ms-excel');
    res.attachment(`detailed_orders_report_${new Date().toISOString().split('T')[0]}.xls`);
    res.send(html);
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
    exportReport,
};
