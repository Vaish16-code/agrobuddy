const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// bcrypt hash of "password123" using bcryptjs
const HASH = '$2a$10$JMMdPhrpgOPFGqkg6q3PPetCfQ2vrpsIlvabc2SItF2ckVPggjd7.e';

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Farmers ──────────────────────────────────────────────
    await client.query({
      text: `INSERT INTO users (id, name, email, password, phone, role) VALUES
        ('11111111-1111-1111-1111-111111111001', 'Ramu Kisan',   'ramu@farm.com',   $1, '+91 98001 00001', 'farmer'),
        ('11111111-1111-1111-1111-111111111002', 'Sita Devi',    'sita@farm.com',   $1, '+91 98001 00002', 'farmer'),
        ('11111111-1111-1111-1111-111111111003', 'Gopal Sharma', 'gopal@farm.com',  $1, '+91 98001 00003', 'farmer'),
        ('11111111-1111-1111-1111-111111111004', 'Lakshmi Bai',  'lakshmi@farm.com',$1, '+91 98001 00004', 'farmer')
        ON CONFLICT (email) DO NOTHING`,
      values: [HASH],
    });

    // ── Buyers (role = 'user') ────────────────────────────────
    await client.query({
      text: `INSERT INTO users (id, name, email, password, phone, role) VALUES
        ('22222222-2222-2222-2222-222222222001', 'Priya Sharma', 'priya@buy.com',  $1, '+91 99001 00001', 'user'),
        ('22222222-2222-2222-2222-222222222002', 'Amit Kumar',   'amit@buy.com',   $1, '+91 99001 00002', 'user'),
        ('22222222-2222-2222-2222-222222222003', 'Sunita Mehta', 'sunita@buy.com', $1, '+91 99001 00003', 'user'),
        ('22222222-2222-2222-2222-222222222004', 'Rahul Verma',  'rahul@buy.com',  $1, '+91 99001 00004', 'user'),
        ('22222222-2222-2222-2222-222222222005', 'Kavita Singh', 'kavita@buy.com', $1, '+91 99001 00005', 'user')
        ON CONFLICT (email) DO NOTHING`,
      values: [HASH],
    });

    // ── Traders ───────────────────────────────────────────────
    await client.query({
      text: `INSERT INTO users (id, name, email, password, phone, role) VALUES
        ('33333333-3333-3333-3333-333333333001', 'Rajesh Traders',    'rajesh@trade.com', $1, '+91 97001 00001', 'trader'),
        ('33333333-3333-3333-3333-333333333002', 'Kisan Agro Inputs', 'kisan@trade.com',  $1, '+91 97001 00002', 'trader')
        ON CONFLICT (email) DO NOTHING`,
      values: [HASH],
    });

    // ── Vegetables ────────────────────────────────────────────
    await client.query(`INSERT INTO farmer_products (farmer_id, product_name, description, price, quantity, created_at) VALUES
      ('11111111-1111-1111-1111-111111111001', 'Fresh Tomato',     'Red ripe tomatoes from open farm.',     30,  500,  NOW() - INTERVAL '1 day'),
      ('11111111-1111-1111-1111-111111111001', 'Onion',            'Fresh white onions, dry and clean.',    25,  800,  NOW() - INTERVAL '2 days'),
      ('11111111-1111-1111-1111-111111111002', 'Potato',           'Local variety potatoes, freshly harvested.', 20, 1000, NOW() - INTERVAL '1 day'),
      ('11111111-1111-1111-1111-111111111002', 'Spinach (Palak)',  'Fresh green spinach leaves.',           15,  200,  NOW() - INTERVAL '3 hours'),
      ('11111111-1111-1111-1111-111111111003', 'Carrot',           'Orange carrots, sweet and crunchy.',    35,  300,  NOW() - INTERVAL '5 hours'),
      ('11111111-1111-1111-1111-111111111003', 'Cauliflower',      'White cauliflower heads, farm fresh.',  40,  150,  NOW() - INTERVAL '4 hours'),
      ('11111111-1111-1111-1111-111111111004', 'Brinjal',          'Purple brinjal, good for curries.',     25,  400,  NOW() - INTERVAL '2 days'),
      ('11111111-1111-1111-1111-111111111001', 'Cucumber',         'Fresh cucumbers, direct from farm.',    22,  250,  NOW() - INTERVAL '6 hours'),
      ('11111111-1111-1111-1111-111111111002', 'Capsicum',         'Green bell peppers, fresh.',            60,  180,  NOW() - INTERVAL '8 hours'),
      ('11111111-1111-1111-1111-111111111004', 'Green Chilli',     'Fresh spicy green chillies.',           50,  100,  NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING`);

    // ── Fruits ────────────────────────────────────────────────
    await client.query(`INSERT INTO farmer_products (farmer_id, product_name, description, price, quantity, created_at) VALUES
      ('11111111-1111-1111-1111-111111111001', 'Alphonso Mango',  'Premium Alphonso mangoes, season special.', 120, 200, NOW() - INTERVAL '1 day'),
      ('11111111-1111-1111-1111-111111111002', 'Banana',          'Sweet elaichi bananas from local garden.',   40, 300, NOW() - INTERVAL '2 hours'),
      ('11111111-1111-1111-1111-111111111003', 'Papaya',          'Fresh ripe papaya, rich in vitamins.',       35, 150, NOW() - INTERVAL '3 days'),
      ('11111111-1111-1111-1111-111111111004', 'Guava',           'White guavas, sweet with seeds.',            30, 200, NOW() - INTERVAL '1 day'),
      ('11111111-1111-1111-1111-111111111001', 'Pomegranate',     'Red pomegranates, juicy seeds.',             80, 120, NOW() - INTERVAL '2 days'),
      ('11111111-1111-1111-1111-111111111003', 'Watermelon',      'Large sweet watermelons, summer harvest.',   15, 500, NOW() - INTERVAL '4 hours')
    ON CONFLICT DO NOTHING`);

    // ── Grains ────────────────────────────────────────────────
    await client.query(`INSERT INTO farmer_products (farmer_id, product_name, description, price, quantity, created_at) VALUES
      ('11111111-1111-1111-1111-111111111001', 'Basmati Rice', 'Premium long grain aromatic rice.',        80,  2000, NOW() - INTERVAL '5 days'),
      ('11111111-1111-1111-1111-111111111002', 'Wheat Grain',  'Clean dry wheat grains from MP.',          28,  5000, NOW() - INTERVAL '3 days'),
      ('11111111-1111-1111-1111-111111111003', 'Toor Dal',     'Golden toor dal, unpolished, high protein.',120, 500, NOW() - INTERVAL '4 days'),
      ('11111111-1111-1111-1111-111111111004', 'Moong Dal',    'Yellow moong dal, fresh lot.',             100, 400,  NOW() - INTERVAL '6 days'),
      ('11111111-1111-1111-1111-111111111001', 'Chana Dal',    'Split chickpea dal, natural yellow.',       90,  600, NOW() - INTERVAL '5 days'),
      ('11111111-1111-1111-1111-111111111002', 'Jowar',        'Good quality sorghum grains.',              25,  1000, NOW() - INTERVAL '7 days')
    ON CONFLICT DO NOTHING`);

    // ── Dairy ─────────────────────────────────────────────────
    await client.query(`INSERT INTO farmer_products (farmer_id, product_name, description, price, quantity, created_at) VALUES
      ('11111111-1111-1111-1111-111111111003', 'Fresh Cow Milk',  'Pure A2 cow milk, delivered fresh daily.',     60,  50, NOW() - INTERVAL '2 hours'),
      ('11111111-1111-1111-1111-111111111004', 'Desi Ghee',       'Pure desi cow ghee, 500g, traditionally made.',500, 30, NOW() - INTERVAL '1 day'),
      ('11111111-1111-1111-1111-111111111003', 'Homemade Paneer', 'Fresh paneer from pure cow milk, 250g.',        80, 40, NOW() - INTERVAL '5 hours'),
      ('11111111-1111-1111-1111-111111111004', 'Dahi (Curd)',     'Thick creamy curd, set fresh daily.',           30, 60, NOW() - INTERVAL '3 hours')
    ON CONFLICT DO NOTHING`);

    // ── Trader Products (seeds/inputs for farmers) ────────────
    await client.query(`INSERT INTO trader_products (trader_id, product_name, description, price_per_kg, available_quantity) VALUES
      ('33333333-3333-3333-3333-333333333001', 'Tomato Seeds (Hybrid)', 'High yield hybrid tomato seeds, 95% germination.', 1200, 50),
      ('33333333-3333-3333-3333-333333333001', 'Onion Seeds',           'Early maturing onion seeds, disease resistant.', 800, 80),
      ('33333333-3333-3333-3333-333333333001', 'Vermi Compost',         'Organic vermicompost fertilizer, 10kg bags.', 15, 500),
      ('33333333-3333-3333-3333-333333333002', 'NPK Fertilizer',        'Balanced NPK 19-19-19 granules, 50kg bag.', 45, 200),
      ('33333333-3333-3333-3333-333333333002', 'Paddy Seeds (Basmati)', 'Certified basmati paddy seeds from ICAR.', 90, 300),
      ('33333333-3333-3333-3333-333333333002', 'Groundnut Seeds',       'HYV groundnut seeds, oil-rich variety.', 60, 400)
    ON CONFLICT DO NOTHING`);

    // ── Orders (buyers purchasing farmer products) ────────────
    const p = async (name) => {
      const r = await client.query(`SELECT id FROM farmer_products WHERE product_name=$1 LIMIT 1`, [name]);
      return r.rows[0]?.id;
    };

    const tomato = await p('Fresh Tomato');
    const potato = await p('Potato');
    const rice   = await p('Basmati Rice');
    const ghee   = await p('Desi Ghee');
    const milk   = await p('Fresh Cow Milk');
    const mango  = await p('Alphonso Mango');

    const orders = [
      [tomato, '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111001', 10,  300,  'delivered', "5 days"],
      [potato, '22222222-2222-2222-2222-222222222002', '11111111-1111-1111-1111-111111111002', 5,   100,  'delivered', "3 days"],
      [rice,   '22222222-2222-2222-2222-222222222001', '11111111-1111-1111-1111-111111111001', 20,  1600, 'delivered', "2 days"],
      [ghee,   '22222222-2222-2222-2222-222222222004', '11111111-1111-1111-1111-111111111004', 2,   1000, 'pending',   "1 day"],
      [milk,   '22222222-2222-2222-2222-222222222005', '11111111-1111-1111-1111-111111111003', 4,   240,  'delivered', "10 days"],
      [mango,  '22222222-2222-2222-2222-222222222003', '11111111-1111-1111-1111-111111111001', 3,   360,  'delivered', "4 days"],
    ];

    for (const [pid, buyer, seller, qty, total, status, ago] of orders) {
      if (!pid) continue;
      await client.query(
        `INSERT INTO orders (buyer_id, seller_id, product_id, product_type, quantity, total_price, status, created_at)
         VALUES ($1, $2, $3, 'farmer_product', $4, $5, $6, NOW() - INTERVAL '${ago}')`,
        [buyer, seller, pid, qty, total, status]
      );
    }

    await client.query('COMMIT');
    console.log('SUCCESS! Sample data inserted:');
    console.log('  Farmers: 4');
    console.log('  Buyers (user role): 5');
    console.log('  Traders: 2');
    console.log('  Farmer Products: 26 (Vegetables/Fruits/Grains/Dairy)');
    console.log('  Trader Products: 6');
    console.log('  Orders: 6');
    console.log('');
    console.log('Test logins (password: password123):');
    console.log('  Farmer:  ramu@farm.com');
    console.log('  Buyer:   priya@buy.com');
    console.log('  Trader:  rajesh@trade.com');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ERROR inserting data:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
