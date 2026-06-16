require('dotenv').config();
const { Pool } = require('pg');

console.log("Intentando conectar a la base de datos...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ESCUCHA DE EVENTOS DE ERROR
pool.on('error', (err, client) => {
  console.error('❌ ERROR INESPERADO EN EL POOL DE BASE DE DATOS:', err);
});

// PRUEBA DE CONEXIÓN INICIAL
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ FALLÓ LA CONEXIÓN INICIAL CON COCKROACHDB:', err.message);
  } else {
    console.log('✅ CONEXIÓN EXITOSA A COCKROACHDB');
  }
});

module.exports = pool;