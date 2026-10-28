const service = require('./memberships.service');
const customersService = require('../customers/customers.service');
const vehiclesService = require('../vehicles/vehicles.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

// Si end_date llega solo como fecha (2026-10-31), la membresía dura hasta el final de ese día
const finDelDia = (fecha) => (/^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha} 23:59:59` : fecha);

// Valida fechas, precio y que no se cruce con otra membresía del vehículo
const validarFechasYPrecio = async (vehicleId, { start_date, end_date, total_price }, excludeId) => {
  if (Number.isNaN(Date.parse(start_date)) || Number.isNaN(Date.parse(end_date))) {
    throw new AppError('start_date y end_date deben ser fechas válidas (AAAA-MM-DD)', 400);
  }
  if (new Date(end_date) <= new Date(start_date)) {
    throw new AppError('end_date debe ser mayor que start_date', 400);
  }
  if (!(Number(total_price) > 0)) {
    throw new AppError('total_price debe ser un número mayor que 0', 400);
  }
  if (await service.hasOverlap(vehicleId, start_date, end_date, excludeId)) {
    throw new AppError('El vehículo ya tiene una membresía en esas fechas', 409);
  }
};

const getAll = async (req, res) => {
  res.json(await service.findAll(req.query));
};

const getById = async (req, res) => {
  const membership = await service.findById(req.params.id);
  if (!membership) throw new AppError('Membresía no encontrada', 404);
  res.json(membership);
};

const create = async (req, res) => {
  requireFields(req.body, ['customer_id', 'vehicle_id', 'start_date', 'end_date', 'total_price']);
  const body = { ...req.body, end_date: finDelDia(req.body.end_date) };

  if (!(await customersService.findById(body.customer_id))) {
    throw new AppError('El cliente no existe o está inactivo', 400);
  }
  const vehicle = await vehiclesService.findById(body.vehicle_id);
  if (!vehicle) throw new AppError('El vehículo no existe o está inactivo', 400);
  if (vehicle.customer_id !== Number(body.customer_id)) {
    throw new AppError('El vehículo no pertenece a ese cliente', 400);
  }
  await validarFechasYPrecio(vehicle.id, body);

  const membership = await service.create(body, req.user.id);
  res.status(201).json(membership);
};

const update = async (req, res) => {
  const actual = await service.findById(req.params.id);
  if (!actual) throw new AppError('Membresía no encontrada', 404);
  const body = { ...req.body };
  if (body.end_date) body.end_date = finDelDia(body.end_date);
  // Se valida con los valores finales (los nuevos o los que ya tenía)
  await validarFechasYPrecio(
    actual.vehicle_id,
    {
      start_date: body.start_date ?? actual.start_date,
      end_date: body.end_date ?? actual.end_date,
      total_price: body.total_price ?? actual.total_price,
    },
    actual.id
  );
  const membership = await service.update(req.params.id, body, req.user.id);
  res.json(membership);
};

const remove = async (req, res) => {
  const membership = await service.remove(req.params.id, req.user.id);
  if (!membership) throw new AppError('Membresía no encontrada', 404);
  res.json({ message: 'Membresía cancelada', membership });
};

module.exports = { getAll, getById, create, update, remove };
