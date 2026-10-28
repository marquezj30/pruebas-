const service = require('./users.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

// Si llega role_id, el rol debe existir y estar activo
const validarRol = async (roleId) => {
  if (roleId !== undefined && !(await service.roleExists(roleId))) {
    throw new AppError('El rol no existe o está inactivo', 400);
  }
};

const getAll = async (req, res) => {
  res.json(await service.findAll());
};

const getById = async (req, res) => {
  const user = await service.findById(req.params.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  res.json(user);
};

const create = async (req, res) => {
  requireFields(req.body, ['username', 'password', 'role_id']);
  if (String(req.body.password).length < 6) {
    throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
  }
  await validarRol(req.body.role_id);
  const user = await service.create(req.body, req.user.id);
  res.status(201).json(user);
};

const update = async (req, res) => {
  await validarRol(req.body.role_id);
  const user = await service.update(req.params.id, req.body, req.user.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  res.json(user);
};

const remove = async (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    throw new AppError('No puedes desactivar tu propio usuario', 400);
  }
  const user = await service.remove(req.params.id, req.user.id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  res.json({ message: 'Usuario desactivado', user });
};

module.exports = { getAll, getById, create, update, remove };
