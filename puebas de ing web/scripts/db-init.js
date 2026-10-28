// Crea las tablas en la base de datos. Con --reset borra todo antes de crear.
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const leer = (archivo) => fs.readFileSync(path.join(__dirname, '..', 'database', archivo), 'utf8');

async function main() {
  try {
    if (process.argv.includes('--reset')) {
      await pool.query(leer('drop.sql'));
      console.log('Tablas eliminadas');
    }
    await pool.query(leer('estacionamiento.sql'));
    console.log('Tablas creadas correctamente');
  } catch (err) {
    console.error('Error al crear las tablas:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
