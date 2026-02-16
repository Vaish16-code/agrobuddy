const pool = require('../config/db');

// Add a new trader product
const addProduct = async (req, res) => {
  try {
    const { product_name, description, price_per_kg, available_quantity } = req.body;
    const trader_id = req.user.id;
    const image_url = req.file ? req.file.path : null;

    // Validate required fields
    if (!product_name || !price_per_kg || available_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product_name, price_per_kg, and available_quantity'
      });
    }

    const result = await pool.query(
      `INSERT INTO trader_products (trader_id, product_name, description, price_per_kg, available_quantity, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [trader_id, product_name, description || null, price_per_kg, available_quantity, image_url]
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add trader product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding product'
    });
  }
};

// Get all trader products (public)
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tp.*, u.name as trader_name, u.phone as trader_phone
       FROM trader_products tp
       JOIN users u ON tp.trader_id = u.id
       ORDER BY tp.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get trader products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

// Get products by trader (own products)
const getMyProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM trader_products WHERE trader_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT tp.*, u.name as trader_name, u.phone as trader_phone
       FROM trader_products tp
       JOIN users u ON tp.trader_id = u.id
       WHERE tp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching product'
    });
  }
};

// Update trader product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, description, price_per_kg, available_quantity } = req.body;
    const trader_id = req.user.id;

    // Check if product belongs to this trader
    const checkProduct = await pool.query(
      'SELECT * FROM trader_products WHERE id = $1 AND trader_id = $2',
      [id, trader_id]
    );

    if (checkProduct.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unauthorized'
      });
    }

    // Build update query dynamically
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (product_name) {
      updateFields.push(`product_name = $${paramCount++}`);
      values.push(product_name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (price_per_kg !== undefined) {
      updateFields.push(`price_per_kg = $${paramCount++}`);
      values.push(price_per_kg);
    }
    if (available_quantity !== undefined) {
      updateFields.push(`available_quantity = $${paramCount++}`);
      values.push(available_quantity);
    }
    if (req.file) {
      updateFields.push(`image_url = $${paramCount++}`);
      values.push(req.file.path);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    const query = `UPDATE trader_products SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating product'
    });
  }
};

// Delete trader product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const trader_id = req.user.id;

    const result = await pool.query(
      'DELETE FROM trader_products WHERE id = $1 AND trader_id = $2 RETURNING *',
      [id, trader_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting product'
    });
  }
};

// Get orders where trader's products were purchased (for trader to see who bought from them)
const getMyOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name as buyer_name, u.phone as buyer_phone,
              tp.product_name
       FROM orders o
       JOIN users u ON o.buyer_id = u.id
       JOIN trader_products tp ON o.product_id = tp.id
       WHERE o.seller_id = $1 AND o.product_type = 'trader_product'
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get trader orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyOrders
};
