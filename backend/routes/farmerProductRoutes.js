const express = require('express');
const router = express.Router();
const {
  addProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/farmerProductController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes (farmer only)
router.post('/', authMiddleware, roleMiddleware('farmer'), upload.single('image'), addProduct);
router.get('/my/products', authMiddleware, roleMiddleware('farmer'), getMyProducts);
router.put('/:id', authMiddleware, roleMiddleware('farmer'), upload.single('image'), updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('farmer'), deleteProduct);

module.exports = router;
