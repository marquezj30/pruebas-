require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

pool
  .query('SELECT 1')
  .then(() => {
    console.log('Conectado a la base de datos');
    app.listen(PORT, () => console.log(`CatPark API escuchando en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo conectar a la base de datos:', err.message);
    process.exit(1);
  });
