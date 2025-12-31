const express = require('express');
const router = express.Router();
const {
    getUserCart,
    addToCart,
    removeFromCart,
    clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getUserCart)
    .post(protect, addToCart)
    .delete(protect, clearCart);

router.route('/:id')
    .delete(protect, removeFromCart);

module.exports = router;