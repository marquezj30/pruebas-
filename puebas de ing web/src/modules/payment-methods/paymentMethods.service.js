const pool = require('../../config/db');

const findAll = async () => {
  const { rows } = await pool.query('SELECT * FROM payment_methods WHERE status = true ORDER BY id');
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM payment_methods WHERE id = $1 AND status = true', [id]);
  return rows[0];
};

const create = async ({ name }, userId) => {
  const { rows } = await pool.query(
    'INSERT INTO payment_methods (name, created_id) VALUES ($1, $2) RETURNING *',
    [name, userId]
  );
  return rows[0];
};

const update = async (id, { name }, userId) => {
  const { rows } = await pool.query(
    `UPDATE payment_methods SET name = COALESCE($1, name), modified = now(), modified_id = $2
     WHERE id = $3 AND status = true RETURNING *`,
    [name, userId, id]
  );
  return rows[0];
};

// Indica si hay pagos activos que dependen de este registro
const isInUse = async (id) => {
  const { rowCount } = await pool.query('SELECT 1 FROM payments WHERE payment_method_id = $1 AND status = true LIMIT 1', [id]);
  return rowCount > 0;
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE payment_methods SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING *`,
    [userId, id]
  );
  return rows[0];
};

module.exports = { findAll, findById, create, update, isInUse, remove };
