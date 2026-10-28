const service = require('./rates.service');
const vehicleTypesService = require('../vehicle-types/vehicleTypes.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

// Precios mayores que 0 y el precio por día no puede ser menor que el de una hora
const validarPrecios = (hourly, daily) => {
  for (const [campo, valor] of [['hourly_price', hourly], ['daily_price', daily]]) {
    if (valor !== undefined && !(Number(valor) > 0)) {
      throw new AppError(`${campo} debe ser un número mayor que 0`, 400);
    }
  }
  if (hourly !== undefined && daily !== undefined && Number(daily) < Number(hourly)) {
    throw new AppError('daily_price no puede ser menor que hourly_price', 400);
  }
};

const getAll = async (req, res) => {
  res.json(await service.findAll(req.query.vehicle_type_id));
};

const getById = async (req, res) => {
  const rate = await service.findById(req.params.id);
  if (!rate) throw new AppError('Tarifa no encontrada', 404);
  res.json(rate);
};

const create = async (req, res) => {
  requireFields(req.body, ['vehicle_type_id', 'hourly_price', 'daily_price']);
  const { vehicle_type_id, hourly_price, daily_price } = req.body;
  validarPrecios(hourly_price, daily_price);
  if (!(await vehicleTypesService.findById(vehicle_type_id))) {
    throw new AppError('El tipo de vehículo no existe o está inactivo', 400);
  }
  const rate = await service.create(req.body, req.user.id);
  res.status(201).json(rate);
};

const update = async (req, res) => {
  const actual = await service.findById(req.params.id);
  if (!actual) throw new AppError('Tarifa no encontrada', 404);
  // Se valida con los valores finales (los nuevos o los que ya tenía)
  validarPrecios(req.body.hourly_price ?? actual.hourly_price, req.body.daily_price ?? actual.daily_price);
  const rate = await service.update(req.params.id, req.body, req.user.id);
  res.json(rate);
};

const remove = async (req, res) => {
  const rate = await service.remove(req.params.id, req.user.id);
  if (!rate) throw new AppError('Tarifa no encontrada', 404);
  res.json({ message: 'Tarifa desactivada', rate });
};

module.exports = { getAll, getById, create, update, remove };
