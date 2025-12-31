const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    getProductFilters,
    deleteProduct,
    createProduct,
    updateProduct,
    createProductReview,
    restoreProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.route('/:id/reviews').post(protect, createProductReview);
router.route('/:id/restore').put(protect, admin, restoreProduct);
router.route('/filters').get(getProductFilters);
router
    .route('/:id')
    .get(getProductById)
    .delete(protect, admin, deleteProduct)
    .put(protect, admin, updateProduct);

module.exports = router;
