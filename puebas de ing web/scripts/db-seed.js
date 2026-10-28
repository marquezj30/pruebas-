// Inserta el usuario admin y datos base para poder probar la API.
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Usuario admin: la tabla users se referencia a sí misma, por eso se fuerza
    //    id = 1 y created_id = 1. Su role_id = 1 (Administrador) se crea en el paso 2;
    //    la FK es DEFERRABLE, así que se revisa recién al hacer COMMIT.
    const hash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (id, role_id, username, password_hash, created_id)
       OVERRIDING SYSTEM VALUE VALUES (1, 1, 'admin', $1, 1)`,
      [hash]
    );
    // Ajusta el contador del IDENTITY para que el próximo usuario sea id = 2
    await client.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), 1)`);

    // 2. Catálogos simples (todos creados por el admin)
    const catalogos = {
      roles: ['Administrador', 'Cajero', 'Vigilante'],
      vehicle_types: ['Auto', 'Moto', 'Camioneta'],
      brands: ['Toyota', 'Hyundai', 'Honda'],
      zones: ['Zona A', 'Zona B'],
      payment_methods: ['Efectivo', 'Tarjeta', 'Yape'],
      receipt_types: ['Boleta', 'Factura'],
    };
    for (const [tabla, nombres] of Object.entries(catalogos)) {
      for (const name of nombres) {
        await client.query(`INSERT INTO ${tabla} (name, created_id) VALUES ($1, 1)`, [name]);
      }
    }

    // 3. Modelos por marca (brand_id según el orden de inserción)
    const modelos = [
      [1, 'Yaris'], [1, 'Hilux'], [2, 'Accent'], [2, 'Tucson'], [3, 'Civic'], [3, 'CB190R'],
    ];
    for (const [brandId, name] of modelos) {
      await client.query('INSERT INTO models (brand_id, name, created_id) VALUES ($1, $2, 1)', [brandId, name]);
    }

    // 4. Tarifas en soles: [vehicle_type_id, precio por hora, precio por día]
    const tarifas = [[1, 5, 30], [2, 2, 12], [3, 7, 40]];
    for (const [typeId, hora, dia] of tarifas) {
      await client.query(
        'INSERT INTO rates (vehicle_type_id, hourly_price, daily_price, created_id) VALUES ($1, $2, $3, 1)',
        [typeId, hora, dia]
      );
    }

    // 5. Cupos: 5 en la Zona A (piso 1) y 5 en la Zona B (piso 2)
    for (let i = 1; i <= 5; i++) {
      await client.query('INSERT INTO parking_spots (zone_id, number, floor, created_id) VALUES (1, $1, 1, 1)', [`A-${i}`]);
      await client.query('INSERT INTO parking_spots (zone_id, number, floor, created_id) VALUES (2, $1, 2, 1)', [`B-${i}`]);
    }

    await client.query('COMMIT');
    console.log('Datos de prueba insertados. Usuario: admin / Contraseña: admin123');
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      console.error('Los datos de prueba ya existen. Usa "npm run db:reset" y luego "npm run db:seed".');
    } else {
      console.error('Error al insertar datos:', err.message);
    }
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
