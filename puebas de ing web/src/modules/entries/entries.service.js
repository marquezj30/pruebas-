const pool = require('../../config/db');
const withTransaction = require('../../utils/transaction');
const membershipsService = require('../memberships/memberships.service');
const { calculateFee } = require('../../utils/fee');

const SELECT = `SELECT en.*,
    v.license_plate,
    c.first_name || ' ' || c.last_name AS customer_name,
    p.number AS spot_number,
    z.name AS zone_name,
    r.hourly_price,
    r.daily_price,
    em.first_name || ' ' || em.last_name AS employee_name
  FROM entries en
  JOIN vehicles v ON v.id = en.vehicle_id
  JOIN customers c ON c.id = v.customer_id
  JOIN parking_spots p ON p.id = en.parking_spot_id
  JOIN zones z ON z.id = p.zone_id
  JOIN rates r ON r.id = en.rate_id
  JOIN employees em ON em.id = en.employee_id`;

// Filtros opcionales: active=true (siguen dentro), plate y date (AAAA-MM-DD)
const findAll = async ({ active, plate, date } = {}) => {
  const { rows } = await pool.query(
    `${SELECT}
     WHERE en.status = true
       AND ($1::boolean IS NULL OR en.exit_datetime IS NULL)
       AND ($2::text IS NULL OR v.license_plate ILIKE $2)
       AND ($3::date IS NULL OR en.entry_datetime::date = $3)
     ORDER BY en.entry_datetime DESC`,
    [active === 'true' ? true : null, plate ? `%${plate}%` : null, date || null]
  );
  return rows;
};

const findById = async (id) => {
  const { rows } = await pool.query(`${SELECT} WHERE en.id = $1 AND en.status = true`, [id]);
  return rows[0];
};

// Entrada sin salida de un vehículo (si está dentro)
const findActiveByVehicle = async (vehicleId) => {
  const { rows } = await pool.query(
    `${SELECT} WHERE en.vehicle_id = $1 AND en.exit_datetime IS NULL AND en.status = true`,
    [vehicleId]
  );
  return rows[0];
};

// Bloquea el cupo mientras se inserta para que dos registros a la vez no lo tomen
const create = async ({ vehicle_id, parking_spot_id, rate_id, employee_id }, userId) => {
  const id = await withTransaction(async (client) => {
    await client.query('SELECT id FROM parking_spots WHERE id = $1 FOR UPDATE', [parking_spot_id]);
    const { rows } = await client.query(
      `INSERT INTO entries (vehicle_id, parking_spot_id, rate_id, employee_id, entry_datetime, created_id)
       VALUES ($1, $2, $3, $4, now(), $5) RETURNING id`,
      [vehicle_id, parking_spot_id, rate_id, employee_id, userId]
    );
    return rows[0].id;
  });
  return findById(id);
};

// Minutos que estuvo (o lleva) el vehículo; se calcula en la BD para evitar líos de zona horaria
const getMinutes = async (id) => {
  const { rows } = await pool.query(
    `SELECT CEIL(EXTRACT(EPOCH FROM (COALESCE(exit_datetime, LOCALTIMESTAMP) - entry_datetime)) / 60)::int AS minutes
     FROM entries WHERE id = $1`,
    [id]
  );
  return rows[0].minutes;
};

// Detalle del cobro; si el vehículo tiene membresía vigente, el monto es 0
const calculateCharge = async (entry) => {
  const minutes = await getMinutes(entry.id);
  const fee = calculateFee(minutes, entry.hourly_price, entry.daily_price);
  const membership = await membershipsService.findCurrentByVehicle(entry.vehicle_id);
  return {
    entry_id: entry.id,
    license_plate: entry.license_plate,
    entry_datetime: entry.entry_datetime,
    exit_datetime: entry.exit_datetime,
    hourly_price: Number(entry.hourly_price),
    daily_price: Number(entry.daily_price),
    ...fee,
    membership_id: membership ? membership.id : null,
    amount: membership ? 0 : fee.amount,
  };
};

const registerExit = async (id, userId) => {
  const { rowCount } = await pool.query(
    `UPDATE entries SET exit_datetime = now(), modified = now(), modified_id = $1
     WHERE id = $2 AND exit_datetime IS NULL AND status = true`,
    [userId, id]
  );
  return rowCount > 0 ? findById(id) : null;
};

module.exports = { findAll, findById, findActiveByVehicle, create, getMinutes, calculateCharge, registerExit };
