const express = require('express');
const router = express.Router();
const { logVisit } = require('../controllers/analyticsController');

router.post('/visit', logVisit);

module.exports = router;
