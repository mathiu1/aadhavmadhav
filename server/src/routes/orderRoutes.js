const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, addOrderItems)
    .get(protect, admin, getOrders);

router.route('/summary').get(protect, admin, getOrderSummary);
router.route('/myorders').get(protect, getMyOrders);
router.route('/user/:id').get(protect, admin, getOrdersByUser);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/ship').put(protect, admin, updateOrderToShipped);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/cancel').put(protect, admin, updateOrderToCancelled);

module.exports = router;
