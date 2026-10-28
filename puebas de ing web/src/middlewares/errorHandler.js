// Responde 404 cuando ninguna ruta coincide
const notFound = (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

// Traduce los errores (propios y de PostgreSQL) a respuestas JSON
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  switch (err.code) {
    case '23505':
      return res.status(409).json({ error: 'Registro duplicado', detalle: err.detail });
    case '23503':
      return res.status(400).json({ error: 'Referencia a un registro que no existe', detalle: err.detail });
    case '23502':
      return res.status(400).json({ error: `Falta el campo obligatorio: ${err.column}` });
    case '22P02':
      return res.status(400).json({ error: 'Dato con formato inválido' });
    default:
      console.error(err);
      return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { notFound, errorHandler };
