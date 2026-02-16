const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyPurchases,
  getMySales,
  getOrderById,
  updateOrderStatus
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes are protected
router.use(authMiddleware);

// Create order
router.post('/', createOrder);

// Get my purchases (as buyer)
router.get('/purchases', getMyPurchases);

// Get my sales (as seller)
router.get('/sales', getMySales);

// Get single order
router.get('/:id', getOrderById);

// Update order status (seller only)
router.put('/:id/status', updateOrderStatus);

module.exports = router;
