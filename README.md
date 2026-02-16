# AgroBuddy - Direct Marketplace App

A complete React Native mobile app for direct farm-to-table marketplace with no middleman. Connects Farmers, Traders, and Customers directly.

## Tech Stack

### Frontend
- React Native (Expo)
- React Navigation
- Axios
- Context API for state management
- Expo SecureStore for token storage
- Expo ImagePicker for image uploads

### Backend
- Node.js
- Express.js
- PostgreSQL (Neon DB)
- Cloudinary (for image uploads)
- JWT Authentication
- bcrypt for password hashing

## Project Structure

```
agrobuddy/
├── backend/
│   ├── config/
│   │   ├── db.js           # PostgreSQL connection
│   │   └── cloudinary.js   # Cloudinary configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── farmerProductController.js
│   │   ├── traderProductController.js
│   │   └── orderController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   ├── schema.sql
│   │   └── initDb.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── farmerProductRoutes.js
│   │   ├── traderProductRoutes.js
│   │   └── orderRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── navigation/
    │   │   └── AppNavigator.js
    │   ├── screens/
    │   │   ├── Auth/
    │   │   │   ├── LoginScreen.js
    │   │   │   └── RegisterScreen.js
    │   │   ├── Farmer/
    │   │   │   ├── FarmerDashboard.js
    │   │   │   ├── AddFarmerProduct.js
    │   │   │   ├── ViewTraderProducts.js
    │   │   │   └── FarmerProductDetails.js
    │   │   ├── Trader/
    │   │   │   ├── TraderDashboard.js
    │   │   │   ├── AddTraderProduct.js
    │   │   │   ├── ViewFarmerProducts.js
    │   │   │   └── TraderProductDetails.js
    │   │   ├── User/
    │   │   │   ├── UserDashboard.js
    │   │   │   ├── ProductList.js
    │   │   │   └── ProductDetails.js
    │   │   └── Shared/
    │   │       └── OrderHistory.js
    │   └── services/
    │       └── api.js
    ├── App.js
    ├── package.json
    └── app.json
```

## Setup Instructions

### 1. Database Setup (Neon PostgreSQL)

1. Create an account at [Neon](https://neon.tech/)
2. Create a new project
3. Go to your project dashboard and copy the connection string
4. Run the SQL schema in your Neon SQL Editor:
   - Open `backend/models/schema.sql`
   - Copy and paste all the SQL into Neon's SQL Editor
   - Run the query

### 2. Cloudinary Setup

1. Create an account at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard
3. Copy your:
   - Cloud Name
   - API Key
   - API Secret

### 3. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your credentials
```

**Configure your `.env` file:**

```env
PORT=5000
NODE_ENV=development

# Your Neon PostgreSQL connection string
DATABASE_URL=postgresql://username:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# JWT Secret (use a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

```bash
# Initialize database tables (optional - if you didn't run SQL manually)
node models/initDb.js

# Start the server
npm run dev
```

The server will start at `http://localhost:5000`

### 4. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Update the API URL in src/services/api.js
# Replace YOUR_IP_ADDRESS with your machine's IP address
# For example: 'http://192.168.1.100:5000/api'
```

**Important:** To find your IP address:
- Windows: Run `ipconfig` in command prompt
- Mac/Linux: Run `ifconfig` in terminal
- Look for your local IP (usually starts with 192.168.x.x)

```bash
# Start Expo
npx expo start
```

Scan the QR code with Expo Go app on your phone.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/profile | Get user profile |

### Farmer Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/farmer-products | Get all farmer products |
| GET | /api/farmer-products/:id | Get single product |
| GET | /api/farmer-products/my/products | Get my products (farmer only) |
| POST | /api/farmer-products | Add product (farmer only) |
| PUT | /api/farmer-products/:id | Update product (farmer only) |
| DELETE | /api/farmer-products/:id | Delete product (farmer only) |

### Trader Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/trader-products | Get all trader products |
| GET | /api/trader-products/:id | Get single product |
| GET | /api/trader-products/my/products | Get my products (trader only) |
| POST | /api/trader-products | Add product (trader only) |
| PUT | /api/trader-products/:id | Update product (trader only) |
| DELETE | /api/trader-products/:id | Delete product (trader only) |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orders | Create order |
| GET | /api/orders/purchases | Get my purchases |
| GET | /api/orders/sales | Get my sales |
| GET | /api/orders/:id | Get single order |
| PUT | /api/orders/:id/status | Update order status |

## User Roles & Features

### Farmer
- Add/Edit/Delete products
- View trader products (seeds)
- Buy seeds from traders
- View order history

### Trader
- Add/Edit/Delete products (seeds/supplies)
- View farmer products
- View who purchased from them
- View order history

### Customer (User)
- Browse all farmer products
- View product details
- Buy products
- View order history

## Testing the App

1. Register as different user types (farmer, trader, user)
2. Login and test role-specific features
3. Add products with images
4. Place orders between different users
5. Check order history

## Environment Variables

| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5000) |
| NODE_ENV | Environment (development/production) |
| DATABASE_URL | Neon PostgreSQL connection string |
| JWT_SECRET | Secret key for JWT tokens |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |

## Troubleshooting

### "Network Error" on mobile
- Make sure backend is running
- Check that you're using your machine's IP address, not `localhost`
- Ensure your phone and computer are on the same WiFi network

### Database connection failed
- Verify your Neon connection string
- Check that SSL mode is enabled (`?sslmode=require`)

### Image upload not working
- Verify Cloudinary credentials
- Check that image picker permissions are granted

## License

MIT
