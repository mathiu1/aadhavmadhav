const express = require('express');
const router = express.Router();
const {
    authUser,
    registerUser,
    getUserProfile,
    logoutUser,
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
    toggleFavorite,
    getFavorites,
    getSupportAgent
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/support-agent', protect, getSupportAgent);
router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/login', authUser);
router.post('/logout', logoutUser);

router
    .route('/profile/favorites')
    .put(protect, toggleFavorite)
    .get(protect, getFavorites);

router
    .route('/profile')
    .get(protect, getUserProfile);
router
    .route('/:id')
    .delete(protect, admin, deleteUser)
    .get(protect, admin, getUserById)
    .put(protect, admin, updateUser);

module.exports = router;
