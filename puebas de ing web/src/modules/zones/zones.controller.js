const service = require('./zones.service');
const parkingSpotsService = require('../parking-spots/parkingSpots.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

const getAll = async (req, res) => {
  res.json(await service.findAll());
};

const getById = async (req, res) => {
  const item = await service.findById(req.params.id);
  if (!item) throw new AppError('Zona no encontrada', 404);
  res.json(item);
};

// Cupos activos de una zona (con su estado occupied)
const getParkingSpots = async (req, res) => {
  const zone = await service.findById(req.params.id);
  if (!zone) throw new AppError('Zona no encontrada', 404);
  res.json(await parkingSpotsService.findAll({ zone_id: zone.id }));
};

const create = async (req, res) => {
  requireFields(req.body, ['name']);
  const item = await service.create(req.body, req.user.id);
  res.status(201).json(item);
};

const update = async (req, res) => {
  const item = await service.update(req.params.id, req.body, req.user.id);
  if (!item) throw new AppError('Zona no encontrada', 404);
  res.json(item);
};

const remove = async (req, res) => {
  if (await service.isInUse(req.params.id)) {
    throw new AppError('No se puede desactivar: tiene cupos activos', 400);
  }
  const item = await service.remove(req.params.id, req.user.id);
  if (!item) throw new AppError('Zona no encontrada', 404);
  res.json({ message: 'Zona desactivada', item });
};

module.exports = { getAll, getById, getParkingSpots, create, update, remove };
