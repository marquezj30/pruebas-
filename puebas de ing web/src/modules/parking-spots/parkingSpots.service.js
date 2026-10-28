const pool = require('../../config/db');

// occupied = true si el cupo tiene una entrada sin salida
const SELECT = `SELECT p.*, z.name AS zone_name,
    EXISTS (
      SELECT 1 FROM entries e
      WHERE e.parking_spot_id = p.id AND e.exit_datetime IS NULL AND e.status = true
    ) AS occupied
  FROM parking_spots p
  JOIN zones z ON z.id = p.zone_id`;

const findAll = async ({ zone_id, floor } = {}) => {
  const { rows } = await pool.query(
    `${SELECT}
     WHERE p.status = true
       AND ($1::int IS NULL OR p.zone_id = $1)
       AND ($2::int IS NULL OR p.floor = $2)
     ORDER BY p.zone_id, p.id`,
    [zone_id || null, floor || null]
  );
  return rows;
};

// Cupos activos y libres
const findAvailable = async (zoneId) => {
  const { rows } = await pool.query(
    `SELECT * FROM (${SELECT}) AS spots
     WHERE status = true AND occupied = false AND ($1::int IS NULL OR zone_id = $1)
     ORDER BY zone_id, id`,
    [zoneId || null]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE p.id = $1 AND p.status = true`, [id]);
  return rows[0];
};

// Busca otro cupo activo con el mismo número en la misma zona
const existsNumberInZone = async (zoneId, number, excludeId = null) => {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM parking_spots
     WHERE zone_id = $1 AND number = $2 AND status = true AND ($3::int IS NULL OR id <> $3)`,
    [zoneId, number, excludeId]
  );
  return rowCount > 0;
};

const create = async ({ zone_id, number, floor }, userId) => {
  const { rows } = await pool.query(
    'INSERT INTO parking_spots (zone_id, number, floor, created_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [zone_id, number, floor, userId]
  );
  return rows[0];
};

const update = async (id, { zone_id, number, floor }, userId) => {
  const { rows } = await pool.query(
    `UPDATE parking_spots
     SET zone_id = COALESCE($1, zone_id), number = COALESCE($2, number), floor = COALESCE($3, floor),
         modified = now(), modified_id = $4
     WHERE id = $5 AND status = true RETURNING *`,
    [zone_id, number, floor, userId, id]
  );
  return rows[0];
};

const remove = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE parking_spots SET status = false, modified = now(), modified_id = $1
     WHERE id = $2 AND status = true RETURNING *`,
    [userId, id]
  );
  return rows[0];
};

module.exports = { findAll, findAvailable, findById, existsNumberInZone, create, update, remove };
