const express = require('express');
const router = express.Router();
const { getSiteConfig, updateSiteConfig, initConfig } = require('../controllers/configController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getSiteConfig);
router.put('/', protect, admin, updateSiteConfig);
router.post('/init', protect, admin, initConfig);

module.exports = router;
