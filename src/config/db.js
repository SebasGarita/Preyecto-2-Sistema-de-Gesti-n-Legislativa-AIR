require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  // Mantenemos la seguridad de tu dotenv
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Exportamos el pool directo por si tus compañeros lo usan así en el resto del proyecto
module.exports = pool;
