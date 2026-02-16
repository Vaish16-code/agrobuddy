const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const initializeDatabase = async () => {
  try {
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pool.query(schema);
    
    console.log('Database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
};

initializeDatabase();
