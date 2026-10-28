const pool = require('../../config/db');

const SELECT = `SELECT v.*,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.document_number AS customer_document,
    m.name AS model_name,
    b.name AS brand_name,
    vt.name AS vehicle_type_name
  FROM vehicles v
  JOIN customers c ON c.id = v.customer_id
  JOIN models m ON m.id = v.model_id
  JOIN brands b ON b.id = m.brand_id
  JOIN vehicle_types vt ON vt.id = v.vehicle_type_id`;

// Filtros opcionales: customer_id y parte de la placa
const findAll = async ({ customer_id, plate } = {}) => {
  const { rows } = await pool.query(
    `${SELECT}
     WHERE v.status = true
       AND ($1::int IS NULL OR v.customer_id = $1)
       AND ($2::text IS NULL OR v.license_plate ILIKE $2)
     ORDER BY v.id`,
    [customer_id || null, plate ? `%${plate}%` : null]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE v.id = $1 AND v.status = true`, [id]);
  return rows[0];
};

const findByPlate = async (plate) => {
  const { rows } = await pool.query(`${SELECT} WHERE v.license_plate = $1 AND v.status = true`, [plate]);
  return rows[0];
};

const create = async ({ customer_id, model_id, vehicle_type_id, license_plate, color }, userId) => {
  const { rows } = await pool.query(
    `INSERT INTO vehicles (customer_id, model_id, vehicle_type_id, license_plate, color, created_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [customer_id, model_id, vehicle_type_id, license_plate, color || null, userId]
  );
  return rows[0];
};

const update = async (id, { customer_id, model_id, vehicle_type_id, license_plate, color }, userId) => {
  const { rows } = await pool.query(
    `UPDATE vehicles
     SET customer_id = COALESCE($1, customer_id),
         model_id = COALESCE($2, model_id),
         vehicle_type_id = COALESCE($3, vehicle_type_id),
         license_plate = COALESCE($4, license_plate),
         color = COALESCE($5, color),
         modified = now(), modified_id = $6
     WHERE id = $7 AND status = true RETURNING *`,
    [customer_id, model_id, vehicle_type_id, license_plate, color, userId, id]
  );
  return rows[0];
};

// true si el vehículo tiene una entrada sin salida
const isInside = async (id) => {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM entries WHERE vehicle_id = $1 AND exit_datetime IS NULL AND status = true LIMIT 1',
    [id]
  );
  return rowCount > 0;
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE vehicles SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING *`,
    [userId, id]
  );
  return rows[0];
};

module.exports = { findAll, findById, findByPlate, create, update, isInside, remove };
