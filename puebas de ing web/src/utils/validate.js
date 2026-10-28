const AppError = require('./AppError');

// Lanza un error 400 si falta alguno de los campos obligatorios
const requireFields = (body, campos) => {
  const faltantes = campos.filter((c) => body[c] === undefined || body[c] === null || body[c] === '');
  if (faltantes.length > 0) {
    throw new AppError(`Faltan campos obligatorios: ${faltantes.join(', ')}`, 400);
  }
};

module.exports = { requireFields };
