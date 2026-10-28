const pool = require('../../config/db');
const withTransaction = require('../../utils/transaction');

const SELECT = `SELECT pa.*,
    v.license_plate,
    pm.name AS payment_method_name,
    rt.name AS receipt_type_name
  FROM payments pa
  JOIN entries en ON en.id = pa.entry_id
  JOIN vehicles v ON v.id = en.vehicle_id
  JOIN payment_methods pm ON pm.id = pa.payment_method_id
  JOIN receipt_types rt ON rt.id = pa.receipt_type_id`;

// Filtros opcionales: date (AAAA-MM-DD) y payment_method_id
const findAll = async ({ date, payment_method_id } = {}) => {
  const { rows } = await pool.query(
    `${SELECT}
     WHERE pa.status = true
       AND ($1::date IS NULL OR pa.payment_datetime::date = $1)
       AND ($2::int IS NULL OR pa.payment_method_id = $2)
     ORDER BY pa.payment_datetime DESC`,
    [date || null, payment_method_id || null]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE pa.id = $1`, [id]);
  return rows[0];
};

const findByEntry = async (entryId) => {
  const { rows } = await pool.query(`${SELECT} WHERE pa.entry_id = $1`, [entryId]);
  return rows[0];
};

// Genera el número de comprobante (B001-00000001) y guarda el pago
const create = async ({ entry_id, payment_method_id, receipt_type_id, receipt_type_name, amount }, userId) => {
  const id = await withTransaction(async (client) => {
    // Bloqueo por tipo de comprobante: dos cobros a la vez no sacan el mismo número
    await client.query('SELECT pg_advisory_xact_lock($1)', [receipt_type_id]);
    const { rows: conteo } = await client.query(
      'SELECT COUNT(*)::int AS total FROM payments WHERE receipt_type_id = $1',
      [receipt_type_id]
    );
    const serie = `${receipt_type_name.charAt(0).toUpperCase()}001`;
    const receiptNumber = `${serie}-${String(conteo[0].total + 1).padStart(8, '0')}`;

    const { rows } = await client.query(
      `INSERT INTO payments (entry_id, payment_method_id, receipt_type_id, receipt_number, payment_datetime, amount, created_id)
       VALUES ($1, $2, $3, $4, now(), $5, $6) RETURNING id`,
      [entry_id, payment_method_id, receipt_type_id, receiptNumber, amount, userId]
    );
    return rows[0].id;
  });
  return findById(id);
};

module.exports = { findAll, findById, findByEntry, create };
