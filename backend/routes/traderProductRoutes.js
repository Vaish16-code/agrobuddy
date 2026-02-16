const express = require('express');
const router = express.Router();
const {
  addProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyOrders
} = require('../controllers/traderProductController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes (trader only)
router.post('/', authMiddleware, roleMiddleware('trader'), upload.single('image'), addProduct);
router.get('/my/products', authMiddleware, roleMiddleware('trader'), getMyProducts);
router.get('/my/orders', authMiddleware, roleMiddleware('trader'), getMyOrders);
router.put('/:id', authMiddleware, roleMiddleware('trader'), upload.single('image'), updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('trader'), deleteProduct);

module.exports = router;
