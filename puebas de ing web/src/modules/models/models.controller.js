const service = require('./models.service');
const brandsService = require('../brands/brands.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

const validarMarca = async (brandId) => {
  if (brandId !== undefined && !(await brandsService.findById(brandId))) {
    throw new AppError('La marca no existe o está inactiva', 400);
  }
};

const getAll = async (req, res) => {
  res.json(await service.findAll(req.query.brand_id));
};

const getById = async (req, res) => {
  const model = await service.findById(req.params.id);
  if (!model) throw new AppError('Modelo no encontrado', 404);
  res.json(model);
};

const create = async (req, res) => {
  requireFields(req.body, ['brand_id', 'name']);
  await validarMarca(req.body.brand_id);
  const model = await service.create(req.body, req.user.id);
  res.status(201).json(model);
};

const update = async (req, res) => {
  await validarMarca(req.body.brand_id);
  const model = await service.update(req.params.id, req.body, req.user.id);
  if (!model) throw new AppError('Modelo no encontrado', 404);
  res.json(model);
};

const remove = async (req, res) => {
  if (await service.isInUse(req.params.id)) {
    throw new AppError('No se puede desactivar: tiene vehículos activos', 400);
  }
  const model = await service.remove(req.params.id, req.user.id);
  if (!model) throw new AppError('Modelo no encontrado', 404);
  res.json({ message: 'Modelo desactivado', model });
};

module.exports = { getAll, getById, create, update, remove };
