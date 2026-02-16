const pool = require('../config/db');

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { product_id, product_type, quantity } = req.body;
    const buyer_id = req.user.id;

    // Validate required fields
    if (!product_id || !product_type || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product_id, product_type, and quantity'
      });
    }

    // Validate product type
    if (!['farmer_product', 'trader_product'].includes(product_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product_type. Must be farmer_product or trader_product'
      });
    }

    let productQuery, priceField, quantityField, sellerIdField;
    
    if (product_type === 'farmer_product') {
      productQuery = 'SELECT * FROM farmer_products WHERE id = $1';
      priceField = 'price';
      quantityField = 'quantity';
      sellerIdField = 'farmer_id';
    } else {
      productQuery = 'SELECT * FROM trader_products WHERE id = $1';
      priceField = 'price_per_kg';
      quantityField = 'available_quantity';
      sellerIdField = 'trader_id';
    }

    // Get product details
    const productResult = await pool.query(productQuery, [product_id]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];

    // Check if enough quantity is available
    if (product[quantityField] < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity available. Only ${product[quantityField]} units available`
      });
    }

    // Prevent buying own product
    if (product[sellerIdField] === buyer_id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot buy your own product'
      });
    }

    const seller_id = product[sellerIdField];
    const total_price = product[priceField] * quantity;

    // Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (buyer_id, seller_id, product_id, product_type, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [buyer_id, seller_id, product_id, product_type, quantity, total_price]
    );

    // Update product quantity
    const updateTable = product_type === 'farmer_product' ? 'farmer_products' : 'trader_products';
    await pool.query(
      `UPDATE ${updateTable} SET ${quantityField} = ${quantityField} - $1 WHERE id = $2`,
      [quantity, product_id]
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: orderResult.rows[0]
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
};

// Get orders for buyer (my purchases)
const getMyPurchases = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              u.name as seller_name, u.phone as seller_phone,
              CASE 
                WHEN o.product_type = 'farmer_product' THEN fp.product_name
                ELSE tp.product_name
              END as product_name,
              CASE 
                WHEN o.product_type = 'farmer_product' THEN fp.image_url
                ELSE tp.image_url
              END as product_image
       FROM orders o
       JOIN users u ON o.seller_id = u.id
       LEFT JOIN farmer_products fp ON o.product_id = fp.id AND o.product_type = 'farmer_product'
       LEFT JOIN trader_products tp ON o.product_id = tp.id AND o.product_type = 'trader_product'
       WHERE o.buyer_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching purchases'
    });
  }
};

// Get orders for seller (my sales)
const getMySales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, 
              u.name as buyer_name, u.phone as buyer_phone,
              CASE 
                WHEN o.product_type = 'farmer_product' THEN fp.product_name
                ELSE tp.product_name
              END as product_name,
              CASE 
                WHEN o.product_type = 'farmer_product' THEN fp.image_url
                ELSE tp.image_url
              END as product_image
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       LEFT JOIN farmer_products fp ON o.product_id = fp.id AND o.product_type = 'farmer_product'
       LEFT JOIN trader_products tp ON o.product_id = tp.id AND o.product_type = 'trader_product'
       WHERE o.seller_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sales'
    });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*, 
              seller.name as seller_name, seller.phone as seller_phone,
              buyer.name as buyer_name, buyer.phone as buyer_phone,
              CASE 
                WHEN o.product_type = 'farmer_product' THEN fp.product_name
                ELSE tp.product_name
              END as product_name,
              CASE 
                WHEN o.product_type = 'farmer_product' THEN fp.image_url
                ELSE tp.image_url
              END as product_image
       FROM orders o
       JOIN users seller ON o.seller_id = seller.id
       JOIN users buyer ON o.buyer_id = buyer.id
       LEFT JOIN farmer_products fp ON o.product_id = fp.id AND o.product_type = 'farmer_product'
       LEFT JOIN trader_products tp ON o.product_id = tp.id AND o.product_type = 'trader_product'
       WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1 
       WHERE id = $2 AND seller_id = $3
       RETURNING *`,
      [status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order'
    });
  }
};

module.exports = {
  createOrder,
  getMyPurchases,
  getMySales,
  getOrderById,
  updateOrderStatus
};
