const pool = require('../config/db');

// Add a new farmer product
const addProduct = async (req, res) => {
  try {
    const { product_name, description, price, quantity } = req.body;
    const farmer_id = req.user.id;
    const image_url = req.file ? req.file.path : null;

    // Validate required fields
    if (!product_name || !price || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product_name, price, and quantity'
      });
    }

    const result = await pool.query(
      `INSERT INTO farmer_products (farmer_id, product_name, description, price, quantity, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [farmer_id, product_name, description || null, price, quantity, image_url]
    );

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Add farmer product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding product'
    });
  }
};

// Get all farmer products (public)
const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fp.*, u.name as farmer_name, u.phone as farmer_phone
       FROM farmer_products fp
       JOIN users u ON fp.farmer_id = u.id
       ORDER BY fp.created_at DESC`
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get farmer products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching products'
    });
  }
};

// Get products by farmer (own products)
const getMyProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM farmer_products WHERE farmer_id = $1 ORDER BY created_at DESC`,
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
      `SELECT fp.*, u.name as farmer_name, u.phone as farmer_phone
       FROM farmer_products fp
       JOIN users u ON fp.farmer_id = u.id
       WHERE fp.id = $1`,
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

// Update farmer product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, description, price, quantity } = req.body;
    const farmer_id = req.user.id;

    // Check if product belongs to this farmer
    const checkProduct = await pool.query(
      'SELECT * FROM farmer_products WHERE id = $1 AND farmer_id = $2',
      [id, farmer_id]
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
    if (price !== undefined) {
      updateFields.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (quantity !== undefined) {
      updateFields.push(`quantity = $${paramCount++}`);
      values.push(quantity);
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
    const query = `UPDATE farmer_products SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

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

// Delete farmer product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const farmer_id = req.user.id;

    const result = await pool.query(
      'DELETE FROM farmer_products WHERE id = $1 AND farmer_id = $2 RETURNING *',
      [id, farmer_id]
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

module.exports = {
  addProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
