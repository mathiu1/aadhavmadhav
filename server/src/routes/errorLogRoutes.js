const express = require('express');
const router = express.Router();
const {
    logClientError,
    updateErrorFeedback,
    getErrorLogs,
    deleteErrorLog,
    clearErrorLogs,
    getUnreadErrorCount,
    markErrorsAsRead,
    testError
} = require('../controllers/errorLogController');
const { protect, admin, identify } = require('../middleware/authMiddleware');

router.get('/unread', protect, admin, getUnreadErrorCount);
router.put('/read', protect, admin, markErrorsAsRead);

router.route('/')
    .get(protect, admin, getErrorLogs)
    .delete(protect, admin, clearErrorLogs);

router.post('/client', identify, logClientError);
router.post('/feedback', identify, updateErrorFeedback);

router.route('/:id')
    .delete(protect, admin, deleteErrorLog);

module.exports = router;
