const pool = require('../../config/db');

// Cupos activos, ocupados y libres por zona
const occupancy = async () => {
  const { rows } = await pool.query(
    `SELECT z.id AS zone_id, z.name AS zone_name,
            COUNT(p.id)::int AS total_spots,
            COUNT(en.id)::int AS occupied,
            (COUNT(p.id) - COUNT(en.id))::int AS free,
            COALESCE(ROUND(COUNT(en.id) * 100.0 / NULLIF(COUNT(p.id), 0), 2), 0)::float AS occupancy_percent
     FROM zones z
     LEFT JOIN parking_spots p ON p.zone_id = z.id AND p.status = true
     LEFT JOIN entries en ON en.parking_spot_id = p.id AND en.exit_datetime IS NULL AND en.status = true
     WHERE z.status = true
     GROUP BY z.id, z.name
     ORDER BY z.id`
  );
  return rows;
};

// Ingresos entre dos fechas (incluidas): total, por método de pago y por día
const income = async (from, to) => {
  const filtro = 'pa.status = true AND pa.payment_datetime::date BETWEEN $1 AND $2';
  const [total, porMetodo, porDia] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(pa.amount), 0)::float AS total_amount, COUNT(*)::int AS total_payments
       FROM payments pa WHERE ${filtro}`,
      [from, to]
    ),
    pool.query(
      `SELECT pm.name AS payment_method, COUNT(*)::int AS payments, SUM(pa.amount)::float AS amount
       FROM payments pa JOIN payment_methods pm ON pm.id = pa.payment_method_id
       WHERE ${filtro} GROUP BY pm.name ORDER BY amount DESC`,
      [from, to]
    ),
    pool.query(
      `SELECT to_char(pa.payment_datetime::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS payments, SUM(pa.amount)::float AS amount
       FROM payments pa WHERE ${filtro} GROUP BY pa.payment_datetime::date ORDER BY day`,
      [from, to]
    ),
  ]);
  return { from, to, ...total.rows[0], by_payment_method: porMetodo.rows, by_day: porDia.rows };
};

// Resumen del día
const dashboard = async () => {
  const { rows } = await pool.query(
    `SELECT
       CURRENT_DATE::text AS date,
       (SELECT COUNT(*) FROM entries WHERE exit_datetime IS NULL AND status = true)::int AS vehicles_inside,
       (SELECT COUNT(*) FROM entries WHERE entry_datetime::date = CURRENT_DATE AND status = true)::int AS entries_today,
       (SELECT COUNT(*) FROM entries WHERE exit_datetime::date = CURRENT_DATE AND status = true)::int AS exits_today,
       (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_datetime::date = CURRENT_DATE AND status = true)::float AS income_today,
       (SELECT COUNT(*) FROM memberships WHERE status = true AND now() BETWEEN start_date AND end_date)::int AS current_memberships`
  );
  return rows[0];
};

module.exports = { occupancy, income, dashboard };
