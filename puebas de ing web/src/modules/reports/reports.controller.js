const service = require('./reports.service');
const AppError = require('../../utils/AppError');

const esFecha = (texto) => /^\d{4}-\d{2}-\d{2}$/.test(texto) && !Number.isNaN(Date.parse(texto));

const occupancy = async (req, res) => {
  const zones = await service.occupancy();
  const total = zones.reduce((acc, z) => acc + z.total_spots, 0);
  const occupied = zones.reduce((acc, z) => acc + z.occupied, 0);
  res.json({
    zones,
    totals: {
      total_spots: total,
      occupied,
      free: total - occupied,
      occupancy_percent: total ? Math.round((occupied * 10000) / total) / 100 : 0,
    },
  });
};

// ?from=AAAA-MM-DD&to=AAAA-MM-DD (si no llegan, se usa el día de hoy en Perú)
const income = async (req, res) => {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const { from = hoy, to = hoy } = req.query;
  if (!esFecha(from) || !esFecha(to)) throw new AppError('from y to deben tener el formato AAAA-MM-DD', 400);
  if (from > to) throw new AppError('from no puede ser mayor que to', 400);
  res.json(await service.income(from, to));
};

const dashboard = async (req, res) => {
  res.json(await service.dashboard());
};

module.exports = { occupancy, income, dashboard };
