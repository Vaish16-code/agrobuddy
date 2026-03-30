-- ============================================================
-- AgroBuddy Sample Data
-- Run this in your Neon DB console (or via psql)
-- ============================================================

-- ── 1. Sample Users ──────────────────────────────────────────
-- Password for ALL test users: "password123"
-- bcrypt hash of "password123" with 10 rounds:
-- $2b$10$YmFzZWxpbmVoYXNoZm9y

-- Farmers
INSERT INTO users (id, name, email, password, phone, role) VALUES
  ('11111111-1111-1111-1111-111111111001', 'Ramu Kisan',    'ramu@farm.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 98001 00001', 'farmer'),
  ('11111111-1111-1111-1111-111111111002', 'Sita Devi',     'sita@farm.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 98001 00002', 'farmer'),
  ('11111111-1111-1111-1111-111111111003', 'Gopal Sharma',  'gopal@farm.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 98001 00003', 'farmer'),
  ('11111111-1111-1111-1111-111111111004', 'Lakshmi Bai',   'lakshmi@farm.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 98001 00004', 'farmer')
ON CONFLICT (email) DO NOTHING;

-- Buyers (role = 'user')
INSERT INTO users (id, name, email, password, phone, role) VALUES
  ('22222222-2222-2222-2222-222222222001', 'Priya Sharma',     'priya@buy.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 99001 00001', 'user'),
  ('22222222-2222-2222-2222-222222222002', 'Amit Kumar',       'amit@buy.com',    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 99001 00002', 'user'),
  ('22222222-2222-2222-2222-222222222003', 'Sunita Mehta',     'sunita@buy.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 99001 00003', 'user'),
  ('22222222-2222-2222-2222-222222222004', 'Rahul Verma',      'rahul@buy.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 99001 00004', 'user'),
  ('22222222-2222-2222-2222-222222222005', 'Kavita Singh',     'kavita@buy.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 99001 00005', 'user')
ON CONFLICT (email) DO NOTHING;

-- Traders (role = 'trader') — they SELL seeds/inputs to farmers
INSERT INTO users (id, name, email, password, phone, role) VALUES
  ('33333333-3333-3333-3333-333333333001', 'Rajesh Traders',   'rajesh@trade.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 97001 00001', 'trader'),
  ('33333333-3333-3333-3333-333333333002', 'Kisan Agro Inputs','kisan@trade.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+91 97001 00002', 'trader')
ON CONFLICT (email) DO NOTHING;

-- ── 2. Farmer Products ────────────────────────────────────────
-- VEGETABLES
INSERT INTO farmer_products (farmer_id, product_name, description, price, quantity, created_at) VALUES
  ('11111111-1111-1111-1111-111111111001', 'Fresh Tomato',      'Red, ripe tomatoes from open farm. Ideal for cooking and salads.', 30,  500, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111001', 'Onion',             'Fresh white onions, dry and clean. Available in bulk.', 25,  800, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111002', 'Potato',            'Local variety potatoes, freshly harvested.', 20,  1000, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111002', 'Spinach (Palak)',   'Fresh green spinach leaves. Washed and bundled.', 15,  200, NOW() - INTERVAL '3 hours'),
  ('11111111-1111-1111-1111-111111111003', 'Carrot',            'Orange carrots, sweet and crunchy.', 35, 300, NOW() - INTERVAL '5 hours'),
  ('11111111-1111-1111-1111-111111111003', 'Cauliflower',       'White cauliflower heads, medium size, farm fresh.', 40, 150, NOW() - INTERVAL '4 hours'),
  ('11111111-1111-1111-1111-111111111004', 'Brinjal (Eggplant)','Purple brinjal, medium size. Good for curries.', 25, 400, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111004', 'Green Chilli',      'Fresh spicy green chillies.', 50,  100, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111001', 'Cucumber',          'Long cucumbers, fresh and cool. Direct farm.', 22, 250, NOW() - INTERVAL '6 hours'),
  ('11111111-1111-1111-1111-111111111002', 'Capsicum',          'Green bell peppers, fresh from farm.', 60, 180, NOW() - INTERVAL '8 hours')
ON CONFLICT DO NOTHING;

-- FRUITS
INSERT INTO farmer_products (farmer_id, product_name, description, price, quantity, created_at) VALUES
  ('11111111-1111-1111-1111-111111111001', 'Alphonso Mango',   'Premium Alphonso mangoes from Ratnagiri. Season special.', 120, 200, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111002', 'Banana (Elaichi)', 'Small sweet elaichi bananas from local garden.', 40,  300, NOW() - INTERVAL '2 hours'),
  ('11111111-1111-1111-1111-111111111003', 'Papaya',           'Fresh ripe papaya. Rich in vitamins.', 35,  150, NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111004', 'Guava',            'White guavas, sweet with seeds. Fresh pick.', 30,  200, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111001', 'Pomegranate',      'Red pomegranates, juicy seeds. Farm direct.', 80,  120, NOW() - INTERVAL '2 days'),
  ('11111111-1111-1111-1111-111111111003', 'Watermelon',       'Large sweet watermelons, summer harvest.', 15,  500, NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

-- GRAINS
INSERT INTO farmer_products (farmer_id, product_name, description, price, quantity, created_at) VALUES
  ('11111111-1111-1111-1111-111111111001', 'Basmati Rice',     'Premium basmati rice. Long grain, aromatic.', 80,  2000, NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111002', 'Wheat Grain',      'Whole wheat grains from MP. Clean and dry.', 28,  5000, NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111003', 'Toor Dal',         'Golden toor dal, unpolished. High protein.', 120, 500,  NOW() - INTERVAL '4 days'),
  ('11111111-1111-1111-1111-111111111004', 'Moong Dal',        'Yellow moong dal, fresh lot. Easy to cook.', 100, 400,  NOW() - INTERVAL '6 days'),
  ('11111111-1111-1111-1111-111111111001', 'Chana Dal',        'Split chickpea dal, natural yellow.', 90,  600,  NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111002', 'Jowar',            'Sorghum grains, good quality.', 25,  1000, NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

-- DAIRY (from farmers who have dairy animals)
INSERT INTO farmer_products (farmer_id, product_name, description, price, quantity, created_at) VALUES
  ('11111111-1111-1111-1111-111111111003', 'Fresh Cow Milk',   'Pure A2 cow milk. Delivered fresh daily.', 60,  50, NOW() - INTERVAL '2 hours'),
  ('11111111-1111-1111-1111-111111111004', 'Desi Ghee',        'Pure desi cow ghee, traditionally made. 500g.', 500, 30, NOW() - INTERVAL '1 day'),
  ('11111111-1111-1111-1111-111111111003', 'Homemade Paneer',  'Fresh paneer from pure cow milk. 250g blocks.', 80,  40, NOW() - INTERVAL '5 hours'),
  ('11111111-1111-1111-1111-111111111004', 'Dahi (Curd)',      'Thick creamy curd, set fresh daily.', 30,  60, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- ── 3. Trader Products (seeds/inputs traders sell to farmers) ──
INSERT INTO trader_products (trader_id, product_name, description, price_per_kg, available_quantity, created_at) VALUES
  ('33333333-3333-3333-3333-333333333001', 'Tomato Seeds (Hybrid)',    'High yield hybrid tomato seeds. 95% germination.', 1200, 50,  NOW() - INTERVAL '2 days'),
  ('33333333-3333-3333-3333-333333333001', 'Onion Seeds',              'Early maturing onion seeds. Resistant to disease.',  800, 80,  NOW() - INTERVAL '3 days'),
  ('33333333-3333-3333-3333-333333333001', 'Vermi Compost',            'Organic vermicompost fertilizer. 10kg bags.',          15, 500, NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333002', 'NPK Fertilizer',           'Balanced NPK 19-19-19 granules. 50kg bag.',            45, 200, NOW() - INTERVAL '4 days'),
  ('33333333-3333-3333-3333-333333333002', 'Paddy Seeds (Basmati)',    'Certified basmati paddy seeds from ICAR.',             90, 300, NOW() - INTERVAL '2 days'),
  ('33333333-3333-3333-3333-333333333002', 'Groundnut Seeds',          'HYV groundnut seeds, oil-rich variety.',               60, 400, NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- ── 4. Sample Orders ──────────────────────────────────────────
-- Use the IDs of products we just inserted
-- We reference by subquery to avoid hardcoding UUIDs
INSERT INTO orders (buyer_id, seller_id, product_id, product_type, quantity, total_price, status, created_at)
SELECT
  '22222222-2222-2222-2222-222222222001',
  '11111111-1111-1111-1111-111111111001',
  fp.id, 'farmer_product', 10, 300.00, 'delivered',
  NOW() - INTERVAL '5 days'
FROM farmer_products fp WHERE fp.product_name = 'Fresh Tomato' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO orders (buyer_id, seller_id, product_id, product_type, quantity, total_price, status, created_at)
SELECT
  '22222222-2222-2222-2222-222222222002',
  '11111111-1111-1111-1111-111111111002',
  fp.id, 'farmer_product', 5, 100.00, 'delivered',
  NOW() - INTERVAL '3 days'
FROM farmer_products fp WHERE fp.product_name = 'Potato' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO orders (buyer_id, seller_id, product_id, product_type, quantity, total_price, status, created_at)
SELECT
  '22222222-2222-2222-2222-222222222003',
  '11111111-1111-1111-1111-111111111003',
  fp.id, 'farmer_product', 3, 105.00, 'delivered',
  NOW() - INTERVAL '7 days'
FROM farmer_products fp WHERE fp.product_name = 'Carrot' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO orders (buyer_id, seller_id, product_id, product_type, quantity, total_price, status, created_at)
SELECT
  '22222222-2222-2222-2222-222222222001',
  '11111111-1111-1111-1111-111111111001',
  fp.id, 'farmer_product', 20, 1600.00, 'delivered',
  NOW() - INTERVAL '2 days'
FROM farmer_products fp WHERE fp.product_name = 'Basmati Rice' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO orders (buyer_id, seller_id, product_id, product_type, quantity, total_price, status, created_at)
SELECT
  '22222222-2222-2222-2222-222222222004',
  '11111111-1111-1111-1111-111111111004',
  fp.id, 'farmer_product', 2, 160.00, 'pending',
  NOW() - INTERVAL '1 day'
FROM farmer_products fp WHERE fp.product_name = 'Desi Ghee' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO orders (buyer_id, seller_id, product_id, product_type, quantity, total_price, status, created_at)
SELECT
  '22222222-2222-2222-2222-222222222005',
  '11111111-1111-1111-1111-111111111003',
  fp.id, 'farmer_product', 4, 320.00, 'delivered',
  NOW() - INTERVAL '10 days'
FROM farmer_products fp WHERE fp.product_name = 'Fresh Cow Milk' LIMIT 1
ON CONFLICT DO NOTHING;

-- Farmers buying seeds from traders
INSERT INTO orders (buyer_id, seller_id, product_id, product_type, quantity, total_price, status, created_at)
SELECT
  '11111111-1111-1111-1111-111111111001',
  '33333333-3333-3333-3333-333333333001',
  tp.id, 'trader_product', 2, 2400.00, 'delivered',
  NOW() - INTERVAL '15 days'
FROM trader_products tp WHERE tp.product_name = 'Tomato Seeds (Hybrid)' LIMIT 1
ON CONFLICT DO NOTHING;

-- ── Done ─────────────────────────────────────────────────────
-- Test login credentials (all use password: "password123"):
--   Farmer:  ramu@farm.com
--   Buyer:   priya@buy.com
--   Trader:  rajesh@trade.com
