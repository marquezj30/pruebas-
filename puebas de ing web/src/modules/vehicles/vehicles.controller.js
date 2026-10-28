const service = require('./vehicles.service');
const customersService = require('../customers/customers.service');
const modelsService = require('../models/models.service');
const vehicleTypesService = require('../vehicle-types/vehicleTypes.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

// "abc 123" -> "ABC123"
const normalizarPlaca = (placa) => String(placa).replace(/\s+/g, '').toUpperCase();

// Normaliza la placa y valida que las llaves foráneas existan (solo las que llegan)
const validar = async (body) => {
  if (body.license_plate !== undefined) {
    body.license_plate = normalizarPlaca(body.license_plate);
    if (!/^[A-Z0-9]{3}-?[A-Z0-9]{3}$/.test(body.license_plate)) {
      throw new AppError('Placa con formato inválido (ejemplo: ABC-123)', 400);
    }
  }
  if (body.customer_id !== undefined && !(await customersService.findById(body.customer_id))) {
    throw new AppError('El cliente no existe o está inactivo', 400);
  }
  if (body.model_id !== undefined && !(await modelsService.findById(body.model_id))) {
    throw new AppError('El modelo no existe o está inactivo', 400);
  }
  if (body.vehicle_type_id !== undefined && !(await vehicleTypesService.findById(body.vehicle_type_id))) {
    throw new AppError('El tipo de vehículo no existe o está inactivo', 400);
  }
};

const getAll = async (req, res) => {
  res.json(await service.findAll(req.query));
};

const getById = async (req, res) => {
  const vehicle = await service.findById(req.params.id);
  if (!vehicle) throw new AppError('Vehículo no encontrado', 404);
  res.json(vehicle);
};

const getByPlate = async (req, res) => {
  const vehicle = await service.findByPlate(normalizarPlaca(req.params.plate));
  if (!vehicle) throw new AppError('Vehículo no encontrado', 404);
  res.json(vehicle);
};

const create = async (req, res) => {
  requireFields(req.body, ['customer_id', 'model_id', 'vehicle_type_id', 'license_plate']);
  await validar(req.body);
  const vehicle = await service.create(req.body, req.user.id);
  res.status(201).json(vehicle);
};

const update = async (req, res) => {
  await validar(req.body);
  const vehicle = await service.update(req.params.id, req.body, req.user.id);
  if (!vehicle) throw new AppError('Vehículo no encontrado', 404);
  res.json(vehicle);
};

const remove = async (req, res) => {
  if (await service.isInside(req.params.id)) {
    throw new AppError('No se puede desactivar: el vehículo está dentro del estacionamiento', 400);
  }
  const vehicle = await service.remove(req.params.id, req.user.id);
  if (!vehicle) throw new AppError('Vehículo no encontrado', 404);
  res.json({ message: 'Vehículo desactivado', vehicle });
};

module.exports = { getAll, getById, getByPlate, create, update, remove };
