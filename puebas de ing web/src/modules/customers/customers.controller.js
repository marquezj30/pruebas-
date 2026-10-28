const service = require('./customers.service');
const vehiclesService = require('../vehicles/vehicles.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

// DNI (8 dígitos) o RUC (11) y celular peruano (9 dígitos que empiezan con 9)
const validar = ({ document_number, phone }) => {
  if (document_number !== undefined && !/^(\d{8}|\d{11})$/.test(document_number)) {
    throw new AppError('El documento debe ser un DNI (8 dígitos) o RUC (11 dígitos)', 400);
  }
  if (phone !== undefined && phone !== null && phone !== '' && !/^9\d{8}$/.test(phone)) {
    throw new AppError('El celular debe tener 9 dígitos y empezar con 9', 400);
  }
};

const getAll = async (req, res) => {
  res.json(await service.findAll(req.query.search));
};

const getById = async (req, res) => {
  const customer = await service.findById(req.params.id);
  if (!customer) throw new AppError('Cliente no encontrado', 404);
  res.json(customer);
};

const getByDocument = async (req, res) => {
  const customer = await service.findByDocument(req.params.document);
  if (!customer) throw new AppError('Cliente no encontrado', 404);
  res.json(customer);
};

// Vehículos activos del cliente
const getVehicles = async (req, res) => {
  const customer = await service.findById(req.params.id);
  if (!customer) throw new AppError('Cliente no encontrado', 404);
  res.json(await vehiclesService.findAll({ customer_id: customer.id }));
};

const create = async (req, res) => {
  requireFields(req.body, ['document_number', 'first_name', 'last_name']);
  validar(req.body);
  const customer = await service.create(req.body, req.user.id);
  res.status(201).json(customer);
};

const update = async (req, res) => {
  validar(req.body);
  const customer = await service.update(req.params.id, req.body, req.user.id);
  if (!customer) throw new AppError('Cliente no encontrado', 404);
  res.json(customer);
};

const remove = async (req, res) => {
  if (await service.hasActiveVehicles(req.params.id)) {
    throw new AppError('No se puede desactivar: el cliente tiene vehículos activos', 400);
  }
  const customer = await service.remove(req.params.id, req.user.id);
  if (!customer) throw new AppError('Cliente no encontrado', 404);
  res.json({ message: 'Cliente desactivado', customer });
};

module.exports = { getAll, getById, getByDocument, getVehicles, create, update, remove };
