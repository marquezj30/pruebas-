const pool = require('../../config/db');
const withTransaction = require('../../utils/transaction');

const SELECT = `SELECT r.*, vt.name AS vehicle_type_name
  FROM rates r
  JOIN vehicle_types vt ON vt.id = r.vehicle_type_id`;

const findAll = async (vehicleTypeId) => {
  const { rows } = await pool.query(
    `${SELECT} WHERE r.status = true AND ($1::int IS NULL OR r.vehicle_type_id = $1) ORDER BY r.id`,
    [vehicleTypeId || null]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE r.id = $1 AND r.status = true`, [id]);
  return rows[0];
};

// Tarifa vigente de un tipo de vehículo (se usa al registrar entradas)
const findActiveByVehicleType = async (vehicleTypeId) => {
  const { rows } = await pool.query(`${SELECT} WHERE r.vehicle_type_id = $1 AND r.status = true`, [vehicleTypeId]);
  return rows[0];
};

// Desactiva la tarifa anterior del tipo y crea la nueva en una sola transacción
const create = async ({ vehicle_type_id, hourly_price, daily_price }, userId) =>
  withTransaction(async (client) => {
    await client.query(
      `UPDATE rates SET status = false, modified = now(), modified_id = $1
       WHERE vehicle_type_id = $2 AND status = true`,
      [userId, vehicle_type_id]
    );
    const { rows } = await client.query(
      `INSERT INTO rates (vehicle_type_id, hourly_price, daily_price, created_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [vehicle_type_id, hourly_price, daily_price, userId]
    );
    return rows[0];
  });

const update = async (id, { hourly_price, daily_price }, userId) => {
  const { rows } = await pool.query(
    `UPDATE rates
     SET hourly_price = COALESCE($1, hourly_price), daily_price = COALESCE($2, daily_price),
         modified = now(), modified_id = $3
     WHERE id = $4 AND status = true RETURNING *`,
    [hourly_price, daily_price, userId, id]
  );
  return rows[0];
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE rates SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING *`,
    [userId, id]
  );
  return rows[0];
};

module.exports = { findAll, findById, findActiveByVehicleType, create, update, remove };
