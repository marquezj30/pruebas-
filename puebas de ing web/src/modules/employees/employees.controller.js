const service = require('./employees.service');
const rolesService = require('../roles/roles.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

// Valida DNI (8 dígitos) y que el rol exista, solo si llegan en el body
const validar = async ({ role_id, document_number }) => {
  if (document_number !== undefined && !/^\d{8}$/.test(document_number)) {
    throw new AppError('El DNI debe tener 8 dígitos', 400);
  }
  if (role_id !== undefined && !(await rolesService.findById(role_id))) {
    throw new AppError('El rol no existe o está inactivo', 400);
  }
};

const getAll = async (req, res) => {
  res.json(await service.findAll());
};

const getById = async (req, res) => {
  const employee = await service.findById(req.params.id);
  if (!employee) throw new AppError('Empleado no encontrado', 404);
  res.json(employee);
};

const create = async (req, res) => {
  requireFields(req.body, ['role_id', 'first_name', 'last_name', 'document_number']);
  await validar(req.body);
  const employee = await service.create(req.body, req.user.id);
  res.status(201).json(employee);
};

const update = async (req, res) => {
  await validar(req.body);
  const employee = await service.update(req.params.id, req.body, req.user.id);
  if (!employee) throw new AppError('Empleado no encontrado', 404);
  res.json(employee);
};

const remove = async (req, res) => {
  const employee = await service.remove(req.params.id, req.user.id);
  if (!employee) throw new AppError('Empleado no encontrado', 404);
  res.json({ message: 'Empleado desactivado', employee });
};

module.exports = { getAll, getById, create, update, remove };
