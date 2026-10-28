const pool = require('../../config/db');

const findAll = async () => {
  const { rows } = await pool.query('SELECT * FROM roles WHERE status = true ORDER BY id');
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM roles WHERE id = $1 AND status = true', [id]);
  return rows[0];
};

const create = async ({ name }, userId) => {
  const { rows } = await pool.query(
    'INSERT INTO roles (name, created_id) VALUES ($1, $2) RETURNING *',
    [name, userId]
  );
  return rows[0];
};

const update = async (id, { name }, userId) => {
  const { rows } = await pool.query(
    `UPDATE roles SET name = COALESCE($1, name), modified = now(), modified_id = $2
     WHERE id = $3 AND status = true RETURNING *`,
    [name, userId, id]
  );
  return rows[0];
};

// Indica si hay empleados o usuarios activos que tienen este rol
const isInUse = async (id) => {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM employees WHERE role_id = $1 AND status = true
     UNION ALL
     SELECT 1 FROM users WHERE role_id = $1 AND status = true
     LIMIT 1`,
    [id]
  );
  return rowCount > 0;
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE roles SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING *`,
    [userId, id]
  );
  return rows[0];
};

module.exports = { findAll, findById, create, update, isInUse, remove };
