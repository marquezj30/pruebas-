// Permite el acceso solo a los roles indicados, por ejemplo: authorize('Administrador')
// Se usa después del middleware auth, que ya dejó el rol en req.user.role
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Acceso denegado: se requiere el rol ${roles.join(' o ')}` });
  }
  next();
};

module.exports = authorize;
