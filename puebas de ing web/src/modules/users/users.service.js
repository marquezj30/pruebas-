const bcrypt = require('bcryptjs');
const pool = require('../../config/db');

// Columnas públicas: nunca se devuelve password_hash
const SELECT = `SELECT u.id, u.username, u.role_id, r.name AS role_name, u.status,
    u.created, u.modified, u.created_id, u.modified_id
  FROM users u
  JOIN roles r ON r.id = u.role_id`;

const findAll = async () => {
  const { rows } = await pool.query(`${SELECT} WHERE u.status = true ORDER BY u.id`);
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE u.id = $1`, [id]);
  return rows[0];
};

// Para el login: incluye password_hash y el nombre del rol
const findByUsername = async (username) => {
  const { rows } = await pool.query(
    `SELECT u.*, r.name AS role_name
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.username = $1 AND u.status = true`,
    [username]
  );
  return rows[0];
};

// true si el rol existe y está activo
const roleExists = async (roleId) => {
  const { rowCount } = await pool.query('SELECT 1 FROM roles WHERE id = $1 AND status = true', [roleId]);
  return rowCount > 0;
};

const create = async ({ username, password, role_id }, userId) => {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, role_id, created_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [username, hash, role_id, userId]
  );
  return findById(rows[0].id);
};

const update = async (id, { username, password, role_id }, userId) => {
  const hash = password ? await bcrypt.hash(password, 10) : null;
  const { rows } = await pool.query(
    `UPDATE users
     SET username = COALESCE($1, username),
         password_hash = COALESCE($2, password_hash),
         role_id = COALESCE($3, role_id),
         modified = now(), modified_id = $4
     WHERE id = $5 AND status = true
     RETURNING id`,
    [username, hash, role_id, userId, id]
  );
  return rows[0] && findById(rows[0].id);
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE users SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING id`,
    [userId, id]
  );
  return rows[0] && findById(rows[0].id);
};

module.exports = { findAll, findById, findByUsername, roleExists, create, update, remove };
