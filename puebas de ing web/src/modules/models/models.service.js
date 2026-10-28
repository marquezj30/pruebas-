const pool = require('../../config/db');

const SELECT = `SELECT m.*, b.name AS brand_name
  FROM models m
  JOIN brands b ON b.id = m.brand_id`;

// brandId es opcional: filtra los modelos de una marca
const findAll = async (brandId) => {
  const { rows } = await pool.query(
    `${SELECT} WHERE m.status = true AND ($1::int IS NULL OR m.brand_id = $1) ORDER BY m.id`,
    [brandId || null]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE m.id = $1 AND m.status = true`, [id]);
  return rows[0];
};

const create = async ({ brand_id, name }, userId) => {
  const { rows } = await pool.query(
    'INSERT INTO models (brand_id, name, created_id) VALUES ($1, $2, $3) RETURNING *',
    [brand_id, name, userId]
  );
  return rows[0];
};

const update = async (id, { brand_id, name }, userId) => {
  const { rows } = await pool.query(
    `UPDATE models
     SET brand_id = COALESCE($1, brand_id), name = COALESCE($2, name),
         modified = now(), modified_id = $3
     WHERE id = $4 AND status = true RETURNING *`,
    [brand_id, name, userId, id]
  );
  return rows[0];
};

const isInUse = async (id) => {
  const { rowCount } = await pool.query('SELECT 1 FROM vehicles WHERE model_id = $1 AND status = true LIMIT 1', [id]);
  return rowCount > 0;
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE models SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING *`,
    [userId, id]
  );
  return rows[0];
};

module.exports = { findAll, findById, create, update, isInUse, remove };
