const pool = require('../../config/db');

// is_current = membresía activa y la fecha de hoy está dentro de su rango
const SELECT = `SELECT ms.*,
    c.first_name || ' ' || c.last_name AS customer_name,
    v.license_plate,
    (ms.status = true AND now() BETWEEN ms.start_date AND ms.end_date) AS is_current
  FROM memberships ms
  JOIN customers c ON c.id = ms.customer_id
  JOIN vehicles v ON v.id = ms.vehicle_id`;

const findAll = async ({ customer_id, current } = {}) => {
  const { rows } = await pool.query(
    `${SELECT}
     WHERE ms.status = true
       AND ($1::int IS NULL OR ms.customer_id = $1)
       AND ($2::boolean IS NULL OR now() BETWEEN ms.start_date AND ms.end_date)
     ORDER BY ms.id`,
    [customer_id || null, current === 'true' ? true : null]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE ms.id = $1 AND ms.status = true`, [id]);
  return rows[0];
};

// Membresía vigente de un vehículo (se usa al calcular el cobro de salida)
const findCurrentByVehicle = async (vehicleId) => {
  const { rows } = await pool.query(
    `${SELECT} WHERE ms.vehicle_id = $1 AND ms.status = true AND now() BETWEEN ms.start_date AND ms.end_date`,
    [vehicleId]
  );
  return rows[0];
};

// ¿El vehículo ya tiene otra membresía activa que se cruza con esas fechas?
const hasOverlap = async (vehicleId, startDate, endDate, excludeId = null) => {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM memberships
     WHERE vehicle_id = $1 AND status = true
       AND start_date <= $3 AND end_date >= $2
       AND ($4::int IS NULL OR id <> $4)`,
    [vehicleId, startDate, endDate, excludeId]
  );
  return rowCount > 0;
};

const create = async ({ customer_id, vehicle_id, start_date, end_date, total_price }, userId) => {
  const { rows } = await pool.query(
    `INSERT INTO memberships (customer_id, vehicle_id, start_date, end_date, total_price, created_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [customer_id, vehicle_id, start_date, end_date, total_price, userId]
  );
  return findById(rows[0].id);
};

const update = async (id, { start_date, end_date, total_price }, userId) => {
  const { rows } = await pool.query(
    `UPDATE memberships
     SET start_date = COALESCE($1, start_date), end_date = COALESCE($2, end_date),
         total_price = COALESCE($3, total_price), modified = now(), modified_id = $4
     WHERE id = $5 AND status = true RETURNING id`,
    [start_date, end_date, total_price, userId, id]
  );
  return rows[0] && findById(rows[0].id);
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE memberships SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING *`,
    [userId, id]
  );
  return rows[0];
};

module.exports = { findAll, findById, findCurrentByVehicle, hasOverlap, create, update, remove };
