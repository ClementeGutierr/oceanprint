const jwt = require('jsonwebtoken');
const { db } = require('../database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso de administrador requerido' });
    }
    next();
  });
}

module.exports = { authenticateToken, requireAdmin };
