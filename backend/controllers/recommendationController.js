const pool = require('../config/db');

/**
 * Recommendation Controller — AgroBuddy
 * Provides 4 endpoints powering the recommendation system:
 *   1. GET /api/recommendations/fresh-picks
 *   2. GET /api/recommendations/buyers
 *   3. GET /api/recommendations/buyer-stats/:farmerId
 *   4. GET /api/recommendations/seasonal
 */

// ──────────────────────────────────────────────────────────────────────────────
// 1. FRESH PICKS — for Buyers
// Returns farmer products sorted by freshness + farmer reliability
// ──────────────────────────────────────────────────────────────────────────────
const getFreshPicks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category || null;

    let whereClause = 'WHERE fp.quantity > 0';
    const params = [];

    if (category) {
      params.push(`%${category.toLowerCase()}%`);
      whereClause += ` AND LOWER(fp.product_name) LIKE $${params.length}`;
    }

    params.push(limit);
    const limitParam = `$${params.length}`;

    const result = await pool.query(`
      SELECT
        fp.*,
        u.name   AS farmer_name,
        u.phone  AS farmer_phone,
        u.email  AS farmer_email,
        ROUND(
          EXTRACT(EPOCH FROM (NOW() - fp.created_at)) / 86400.0, 1
        ) AS days_old,
        ROUND(
          (100.0 * EXP( -EXTRACT(EPOCH FROM (NOW() - fp.created_at)) / 86400.0 / 5.0 ))::numeric, 1
        ) AS freshness_score,
        COALESCE(
          (SELECT ROUND(
             (COUNT(*) FILTER (WHERE o.status = 'delivered') * 100.0 / NULLIF(COUNT(*), 0))::numeric, 1
           )
           FROM orders o WHERE o.seller_id = fp.farmer_id),
          50
        ) AS farmer_reliability_pct,
        COALESCE(
          (SELECT COUNT(*) FROM orders o WHERE o.seller_id = fp.farmer_id),
          0
        ) AS farmer_total_sales
      FROM farmer_products fp
      JOIN users u ON fp.farmer_id = u.id
      ${whereClause}
      ORDER BY
        (
          (100.0 * EXP(-EXTRACT(EPOCH FROM (NOW() - fp.created_at)) / 86400.0 / 5.0)) * 0.60 +
          COALESCE(
            (SELECT COUNT(*) FILTER (WHERE o.status = 'delivered') * 100.0 / NULLIF(COUNT(*), 0)
             FROM orders o WHERE o.seller_id = fp.farmer_id), 50
          ) * 0.40
        ) DESC
      LIMIT ${limitParam}
    `, params);

    const products = result.rows.map(p => {
      const daysOld = parseFloat(p.days_old || 0);
      const freshness = parseFloat(p.freshness_score || 0);
      const reliability = parseFloat(p.farmer_reliability_pct || 50);

      return {
        ...p,
        days_old: daysOld,
        freshness_score: freshness,
        farmer_reliability_pct: reliability,
        overall_score: parseFloat(((freshness * 0.60) + (reliability * 0.40)).toFixed(1)),
        freshness_label: getFreshnessLabel(daysOld),
      };
    });

    return res.status(200).json({
      success: true,
      data: products,
      meta: { total: products.length, generated_at: new Date().toISOString() },
    });
  } catch (error) {
    console.error('getFreshPicks error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching fresh picks' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. BUYERS LIST — for Supply Chain Matcher
// Returns real registered buyers with computed profile for matching
// ──────────────────────────────────────────────────────────────────────────────
const getBuyers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        COUNT(o.id)                                                    AS total_orders,
        COUNT(o.id) FILTER (WHERE o.status = 'delivered')             AS completed_orders,
        COALESCE(AVG(o.total_price), 0)                               AS avg_spend,
        COALESCE(MAX(o.total_price), 0)                               AS max_spend,
        COALESCE(MIN(NULLIF(o.total_price, 0)), 20)                   AS min_spend,
        (
          SELECT COALESCE(fp2.product_name, tp2.product_name)
          FROM orders o2
          LEFT JOIN farmer_products fp2 ON o2.product_id = fp2.id AND o2.product_type = 'farmer_product'
          LEFT JOIN trader_products tp2 ON o2.product_id = tp2.id AND o2.product_type = 'trader_product'
          WHERE o2.buyer_id = u.id
          ORDER BY o2.created_at DESC
          LIMIT 1
        ) AS last_purchased_product,
        MAX(o.created_at) AS last_purchase_date
      FROM users u
      LEFT JOIN orders o ON o.buyer_id = u.id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY total_orders DESC
    `);

    const buyers = result.rows.map(b => {
      const total = parseInt(b.total_orders) || 0;
      const completed = parseInt(b.completed_orders) || 0;
      const reliability = total > 0 ? completed / total : 0.7;
      const rating = Math.min(5.0, Math.max(2.0, 2.0 + reliability * 3.0));

      return {
        id: b.id,
        name: b.name,
        email: b.email,
        phone: b.phone,
        role: b.role,
        businessType: b.role === 'trader' ? 'Trader / Wholesaler' : 'Direct Buyer',
        buyerCategory: b.role === 'trader' ? 'B2B' : 'B2C',
        rating: parseFloat(rating.toFixed(1)),
        completedTransactions: completed,
        totalTransactions: total,
        paymentReliability: parseFloat(reliability.toFixed(2)),
        isVerified: total >= 3,
        avgSpend: parseFloat(parseFloat(b.avg_spend || 0).toFixed(2)),
        budgetRange: {
          min: Math.max(10, parseFloat(b.min_spend || 20) * 0.8),
          max: Math.max(100, parseFloat(b.max_spend || 200) * 1.2),
        },
        requirements: {
          categories: inferCategories(b.last_purchased_product),
          wantedProducts: b.last_purchased_product
            ? [b.last_purchased_product.toLowerCase()]
            : ['vegetables', 'fresh produce'],
        },
        requiredQuantity: b.role === 'trader' ? 200 : 10,
        location: null, // location fields to be added later
        lastPurchaseDate: b.last_purchase_date,
        preferences: b.role === 'user' ? {
          organic: false,
          freshness: 'medium',
          delivery: 'next-day',
        } : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: buyers,
      meta: { total: buyers.length },
    });
  } catch (error) {
    console.error('getBuyers error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching buyers' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. BUYER STATS PER FARMER — for Smart Buyer Matching
// Historical transaction stats with a specific farmer
// ──────────────────────────────────────────────────────────────────────────────
const getBuyerStatsForFarmer = async (req, res) => {
  try {
    const { farmerId } = req.params;

    const result = await pool.query(`
      SELECT
        o.buyer_id,
        u.name  AS buyer_name,
        u.phone AS buyer_phone,
        u.role  AS buyer_role,
        COUNT(o.id)                                               AS total_purchases,
        COUNT(o.id) FILTER (WHERE o.status = 'delivered')       AS successful_purchases,
        COUNT(o.id) FILTER (WHERE o.status = 'cancelled')       AS cancelled_purchases,
        COALESCE(AVG(o.total_price), 0)                          AS avg_order_value,
        COALESCE(SUM(o.quantity), 0)                             AS total_qty_purchased,
        COALESCE(SUM(o.total_price), 0)                          AS total_spent,
        MAX(o.created_at)                                        AS last_purchase_date,
        MIN(o.created_at)                                        AS first_purchase_date,
        ARRAY_AGG(DISTINCT COALESCE(fp.product_name, tp.product_name, 'Unknown')) AS products_bought
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      LEFT JOIN farmer_products fp ON o.product_id = fp.id AND o.product_type = 'farmer_product'
      LEFT JOIN trader_products tp ON o.product_id = tp.id AND o.product_type = 'trader_product'
      WHERE o.seller_id = $1
      GROUP BY o.buyer_id, u.name, u.phone, u.role
      ORDER BY total_purchases DESC
    `, [farmerId]);

    const stats = result.rows.map(row => {
      const total = parseInt(row.total_purchases) || 0;
      const successful = parseInt(row.successful_purchases) || 0;
      const successRate = total > 0 ? successful / total : 0;
      const loyaltyScore = Math.min(total / 10, 1.0);

      return {
        buyerId: row.buyer_id,
        buyerName: row.buyer_name,
        buyerPhone: row.buyer_phone,
        buyerRole: row.buyer_role,
        repeatPurchases: total,
        successfulPurchases: successful,
        cancelledPurchases: parseInt(row.cancelled_purchases) || 0,
        successRate: parseFloat(successRate.toFixed(2)),
        paymentReliability: parseFloat(Math.min(1.0, successRate + 0.1).toFixed(2)),
        avgOrderValue: parseFloat(parseFloat(row.avg_order_value || 0).toFixed(2)),
        totalQtyPurchased: parseInt(row.total_qty_purchased) || 0,
        totalSpent: parseFloat(parseFloat(row.total_spent || 0).toFixed(2)),
        lastPurchaseDate: row.last_purchase_date,
        firstPurchaseDate: row.first_purchase_date,
        productsBought: (row.products_bought || []).filter(p => p !== 'Unknown'),
        // Composite historical score (0–1): 50% loyalty + 50% reliability
        historicalScore: parseFloat(((loyaltyScore * 0.50) + (successRate * 0.50)).toFixed(2)),
      };
    });

    return res.status(200).json({
      success: true,
      data: stats,
      meta: { farmerId, totalBuyers: stats.length },
    });
  } catch (error) {
    console.error('getBuyerStatsForFarmer error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching buyer stats' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 4. SEASONAL PRODUCTS — for Buyers
// Products matching current seasonal demand in India
// ──────────────────────────────────────────────────────────────────────────────
const getSeasonalProducts = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
    const limit = parseInt(req.query.limit) || 20;

    const SEASONAL_MAP = {
      spinach:     [1, 2, 3, 11, 12],
      broccoli:    [1, 2, 3, 11, 12],
      peas:        [1, 2, 3, 12],
      cauliflower: [1, 2, 3, 11, 12],
      tomato:      [3, 4, 5, 9, 10],
      chilli:      [3, 4, 5, 10, 11],
      cucumber:    [4, 5, 6, 7, 8],
      watermelon:  [5, 6, 7],
      mango:       [5, 6, 7],
      rice:        [9, 10, 11],
      wheat:       [3, 4, 5],
      potato:      [1, 2, 3, 10, 11],
      onion:       [2, 3, 11, 12],
      garlic:      [2, 3, 4],
      ginger:      [10, 11, 12, 1],
      carrot:      [1, 2, 3, 11, 12],
      brinjal:     [3, 4, 5, 9, 10],
      capsicum:    [3, 4, 5, 10, 11],
      beans:       [3, 4, 5, 11, 12],
      corn:        [6, 7, 8],
      turmeric:    [11, 12, 1, 2],
    };

    const seasonalProducts = Object.entries(SEASONAL_MAP)
      .filter(([, months]) => months.includes(month))
      .map(([name]) => name);

    if (seasonalProducts.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        meta: { month, seasonalProducts: [] },
      });
    }

    const likeConditions = seasonalProducts
      .map((_, i) => `LOWER(fp.product_name) LIKE $${i + 1}`)
      .join(' OR ');

    const queryParams = seasonalProducts.map(p => `%${p}%`);
    queryParams.push(limit);

    const result = await pool.query(`
      SELECT
        fp.*,
        u.name  AS farmer_name,
        u.phone AS farmer_phone,
        ROUND(EXTRACT(EPOCH FROM (NOW() - fp.created_at)) / 86400.0, 1) AS days_old,
        ROUND(
          (100.0 * EXP(-EXTRACT(EPOCH FROM (NOW() - fp.created_at)) / 86400.0 / 5.0))::numeric, 1
        ) AS freshness_score
      FROM farmer_products fp
      JOIN users u ON fp.farmer_id = u.id
      WHERE fp.quantity > 0 AND (${likeConditions})
      ORDER BY fp.created_at DESC
      LIMIT $${queryParams.length}
    `, queryParams);

    const products = result.rows.map(p => ({
      ...p,
      days_old: parseFloat(p.days_old || 0),
      freshness_score: parseFloat(p.freshness_score || 0),
      is_seasonal: true,
      seasonal_month: month,
      freshness_label: getFreshnessLabel(parseFloat(p.days_old || 0)),
    }));

    return res.status(200).json({
      success: true,
      data: products,
      meta: { month, seasonalProducts, total: products.length },
    });
  } catch (error) {
    console.error('getSeasonalProducts error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching seasonal products' });
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFreshnessLabel(daysOld) {
  if (daysOld <= 1)  return 'Just Harvested 🌱';
  if (daysOld <= 3)  return 'Very Fresh ✅';
  if (daysOld <= 7)  return 'Fresh 🟡';
  if (daysOld <= 14) return 'Moderate 🟠';
  return 'Older Stock 🔴';
}

function inferCategories(productName) {
  if (!productName) return ['fresh produce', 'general'];
  const n = productName.toLowerCase();

  const MAP = {
    tomato:      ['vegetables', 'fresh produce', 'perishables'],
    potato:      ['vegetables', 'fresh produce', 'staples'],
    onion:       ['vegetables', 'fresh produce', 'staples'],
    spinach:     ['vegetables', 'leafy', 'perishables'],
    carrot:      ['vegetables', 'fresh produce'],
    apple:       ['fruits', 'fresh produce'],
    mango:       ['fruits', 'tropical', 'seasonal'],
    banana:      ['fruits', 'tropical'],
    rice:        ['grains', 'cereals', 'staples'],
    wheat:       ['grains', 'cereals', 'staples'],
    dal:         ['pulses', 'legumes', 'protein'],
    milk:        ['dairy', 'perishables'],
    ginger:      ['spices', 'medicinal'],
    turmeric:    ['spices', 'medicinal'],
  };

  for (const [key, cats] of Object.entries(MAP)) {
    if (n.includes(key)) return ['fresh produce', ...cats];
  }

  return ['fresh produce', 'agricultural products'];
}

module.exports = {
  getFreshPicks,
  getBuyers,
  getBuyerStatsForFarmer,
  getSeasonalProducts,
};
