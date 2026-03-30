/**
 * fix_passwords.js
 * Generates a fresh bcryptjs hash of "password123" and updates
 * ALL seeded sample users in the database so login works.
 */
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SAMPLE_EMAILS = [
  // Farmers
  'ramu@farm.com', 'sita@farm.com', 'gopal@farm.com', 'lakshmi@farm.com',
  // Buyers
  'priya@buy.com', 'amit@buy.com', 'sunita@buy.com', 'rahul@buy.com', 'kavita@buy.com',
  // Traders
  'rajesh@trade.com', 'kisan@trade.com',
];

async function run() {
  // Generate a fresh, full-length hash
  const hash = await bcrypt.hash('password123', 10);
  console.log('Generated hash:', hash);
  console.log('Hash length:', hash.length, '(should be 60)');

  // Verify it works before touching DB
  const ok = await bcrypt.compare('password123', hash);
  console.log('Hash self-verify:', ok ? '✅ PASS' : '❌ FAIL');

  if (!ok) {
    console.error('Hash verification failed. Aborting.');
    pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    // Update all sample users with the correct hash
    const res = await client.query(
      `UPDATE users SET password = $1 WHERE email = ANY($2::text[]) RETURNING email, role`,
      [hash, SAMPLE_EMAILS]
    );
    console.log(`\nUpdated ${res.rowCount} users:`);
    res.rows.forEach(r => console.log(`  ✅ ${r.email} (${r.role})`));

    if (res.rowCount === 0) {
      console.log('\n⚠️  No users were updated — seed data may not be in DB yet.');
      console.log('Run: node models/seed.js  first, then re-run this script.');
    } else {
      console.log('\nAll done! Login with:');
      console.log('  Email:    ramu@farm.com  (farmer)');
      console.log('  Email:    priya@buy.com  (buyer)');
      console.log('  Email:    rajesh@trade.com  (trader)');
      console.log('  Password: password123');
    }
  } catch (e) {
    console.error('DB Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
