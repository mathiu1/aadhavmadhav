const express = require('express');
const router = express.Router();
const { sendMessage, getMessages, markAsRead, getUnreadCount, deleteMessage } = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, sendMessage);
router.route('/unread').get(protect, getUnreadCount);
router.route('/:userId').get(protect, getMessages);
router.route('/read/:userId').put(protect, markAsRead);
router.route('/:id').delete(protect, deleteMessage);

module.exports = router;
