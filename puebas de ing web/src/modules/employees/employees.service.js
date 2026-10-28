const pool = require('../../config/db');

const SELECT = `SELECT e.*, r.name AS role_name
  FROM employees e
  JOIN roles r ON r.id = e.role_id`;

const findAll = async () => {
  const { rows } = await pool.query(`${SELECT} WHERE e.status = true ORDER BY e.id`);
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE e.id = $1 AND e.status = true`, [id]);
  return rows[0];
};

const create = async ({ role_id, first_name, last_name, document_number }, userId) => {
  const { rows } = await pool.query(
    `INSERT INTO employees (role_id, first_name, last_name, document_number, created_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [role_id, first_name, last_name, document_number, userId]
  );
  return rows[0];
};

const update = async (id, { role_id, first_name, last_name, document_number }, userId) => {
  const { rows } = await pool.query(
    `UPDATE employees
     SET role_id = COALESCE($1, role_id),
         first_name = COALESCE($2, first_name),
         last_name = COALESCE($3, last_name),
         document_number = COALESCE($4, document_number),
         modified = now(), modified_id = $5
     WHERE id = $6 AND status = true RETURNING *`,
    [role_id, first_name, last_name, document_number, userId, id]
  );
  return rows[0];
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE employees SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING *`,
    [userId, id]
  );
  return rows[0];
};

module.exports = { findAll, findById, create, update, remove };
