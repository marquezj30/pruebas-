const { Pool, types } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en el archivo .env');
  process.exit(1);
}

types.setTypeParser(1114, (valor) => valor);

// Neon exige SSL; el parámetro sslmode=require de la URL ya lo activa
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
