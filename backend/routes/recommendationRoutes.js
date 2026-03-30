const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getFreshPicks,
  getBuyers,
  getBuyerStatsForFarmer,
  getSeasonalProducts,
} = require('../controllers/recommendationController');

/**
 * Recommendation Routes — AgroBuddy
 * Base path: /api/recommendations
 */

// GET /api/recommendations/fresh-picks?limit=20&category=vegetables
// Public — buyers browse freshest produce
router.get('/fresh-picks', getFreshPicks);

// GET /api/recommendations/buyers
// Auth — farmer fetches all real buyers for matching
router.get('/buyers', authenticate, getBuyers);

// GET /api/recommendations/buyer-stats/:farmerId
// Auth — farmer fetches their own buyer transaction history
router.get('/buyer-stats/:farmerId', authenticate, getBuyerStatsForFarmer);

// GET /api/recommendations/seasonal?month=3&limit=20
// Public — buyers see in-season products
router.get('/seasonal', getSeasonalProducts);

module.exports = router;
