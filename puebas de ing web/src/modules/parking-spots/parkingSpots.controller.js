const service = require('./parkingSpots.service');
const zonesService = require('../zones/zones.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

// Valida zona, piso y que el número no se repita en la zona
const validar = async ({ zone_id, number, floor }, actual = null) => {
  if (floor !== undefined && !Number.isInteger(Number(floor))) {
    throw new AppError('floor debe ser un número entero', 400);
  }
  if (zone_id !== undefined && !(await zonesService.findById(zone_id))) {
    throw new AppError('La zona no existe o está inactiva', 400);
  }
  const zona = zone_id ?? actual?.zone_id;
  const numero = number ?? actual?.number;
  if (await service.existsNumberInZone(zona, numero, actual?.id)) {
    throw new AppError(`Ya existe el cupo ${numero} en esa zona`, 409);
  }
};

const getAll = async (req, res) => {
  res.json(await service.findAll(req.query));
};

const getAvailable = async (req, res) => {
  res.json(await service.findAvailable(req.query.zone_id));
};

const getById = async (req, res) => {
  const spot = await service.findById(req.params.id);
  if (!spot) throw new AppError('Cupo no encontrado', 404);
  res.json(spot);
};

const create = async (req, res) => {
  requireFields(req.body, ['zone_id', 'number', 'floor']);
  await validar(req.body);
  const spot = await service.create(req.body, req.user.id);
  res.status(201).json(spot);
};

const update = async (req, res) => {
  const actual = await service.findById(req.params.id);
  if (!actual) throw new AppError('Cupo no encontrado', 404);
  await validar(req.body, actual);
  const spot = await service.update(req.params.id, req.body, req.user.id);
  res.json(spot);
};

const remove = async (req, res) => {
  const actual = await service.findById(req.params.id);
  if (!actual) throw new AppError('Cupo no encontrado', 404);
  if (actual.occupied) throw new AppError('No se puede desactivar: el cupo está ocupado', 400);
  const spot = await service.remove(req.params.id, req.user.id);
  res.json({ message: 'Cupo desactivado', spot });
};

module.exports = { getAll, getAvailable, getById, create, update, remove };
