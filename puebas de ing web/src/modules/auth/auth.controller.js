const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usersService = require('../users/users.service');
const AppError = require('../../utils/AppError');
const { requireFields } = require('../../utils/validate');

const login = async (req, res) => {
  requireFields(req.body, ['username', 'password']);
  const { username, password } = req.body;

  const user = await usersService.findByUsername(username);
  const valido = user && (await bcrypt.compare(password, user.password_hash));
  if (!valido) throw new AppError('Usuario o contraseña incorrectos', 401);

  // El token guarda el id, el usuario y el rol; se firma con JWT_SECRET
  const datos = { id: user.id, username: user.username, role: user.role_name };
  const token = jwt.sign(datos, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
  res.json({ token, user: datos });
};

const me = async (req, res) => {
  res.json(req.user);
};

module.exports = { login, me };
