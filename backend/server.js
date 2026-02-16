const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const farmerProductRoutes = require('./routes/farmerProductRoutes');
const traderProductRoutes = require('./routes/traderProductRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer-products', farmerProductRoutes);
app.use('/api/trader-products', traderProductRoutes);
app.use('/api/orders', orderRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AgroBuddy API is running',
    timestamp: new Date().toISOString()
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to AgroBuddy API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      farmerProducts: '/api/farmer-products',
      traderProducts: '/api/trader-products',
      orders: '/api/orders',
      health: '/api/health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║       AgroBuddy Backend Server            ║
  ╠═══════════════════════════════════════════╣
  ║  Server running on port: ${PORT}              ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}              ║
  ║  Time: ${new Date().toLocaleTimeString()}                        ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
