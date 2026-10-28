const pool = require('../../config/db');

// search es opcional: filtra por nombre, apellido o documento
const findAll = async (search) => {
  const filtro = search ? `%${search}%` : null;
  const { rows } = await pool.query(
    `SELECT * FROM customers
     WHERE status = true
       AND ($1::text IS NULL OR first_name ILIKE $1 OR last_name ILIKE $1 OR document_number ILIKE $1)
     ORDER BY id`,
    [filtro]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1 AND status = true', [id]);
  return rows[0];
};

const findByDocument = async (document) => {
  const { rows } = await pool.query('SELECT * FROM customers WHERE document_number = $1 AND status = true', [document]);
  return rows[0];
};

const create = async ({ document_number, first_name, last_name, phone }, userId) => {
  const { rows } = await pool.query(
    `INSERT INTO customers (document_number, first_name, last_name, phone, created_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [document_number, first_name, last_name, phone || null, userId]
  );
  return rows[0];
};

const update = async (id, { document_number, first_name, last_name, phone }, userId) => {
  const { rows } = await pool.query(
    `UPDATE customers
     SET document_number = COALESCE($1, document_number),
         first_name = COALESCE($2, first_name),
         last_name = COALESCE($3, last_name),
         phone = COALESCE($4, phone),
         modified = now(), modified_id = $5
     WHERE id = $6 AND status = true RETURNING *`,
    [document_number, first_name, last_name, phone, userId, id]
  );
  return rows[0];
};

const hasActiveVehicles = async (id) => {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM vehicles WHERE customer_id = $1 AND status = true LIMIT 1',
    [id]
  );
  return rowCount > 0;
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE customers SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING *`,
    [userId, id]
  );
  return rows[0];
};

module.exports = { findAll, findById, findByDocument, create, update, hasActiveVehicles, remove };
