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
    exportProducts,
    getAllReviews,
    deleteReview
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.route('/export').get(protect, admin, exportProducts);
router.route('/reviews/all').get(protect, admin, getAllReviews);
router.route('/:id/reviews').post(protect, createProductReview);
router.route('/:id/reviews/:reviewId').delete(protect, admin, deleteReview);
router.route('/:id/restore').put(protect, admin, restoreProduct);
router.route('/filters').get(getProductFilters);
router
    .route('/:id')
    .get(getProductById)
    .delete(protect, admin, deleteProduct)
    .put(protect, admin, updateProduct);

module.exports = router;
