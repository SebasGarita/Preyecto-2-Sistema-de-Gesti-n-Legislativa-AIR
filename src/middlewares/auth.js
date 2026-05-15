const jwt     = require('jsonwebtoken');
const config  = require('../config/security');
const Usuario = require('../models/Usuario');

// ── 1. Verifica que el token sea válido ───────────────────────────────────────
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token      = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado: token requerido' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.usuario   = payload;   // disponible en controladores como req.usuario
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// ── 2. Verifica que el usuario tenga el permiso requerido ────────────────────
const requierePermiso = (permiso) => {
  return (req, res, next) => {
    const permisos = req.usuario?.permisos || [];
    if (!permisos.includes(permiso)) {
      return res.status(403).json({
        error: `Sin autorización: se requiere permiso "${permiso}"`
      });
    }
    next();
  };
};

// ── 3. Registra automáticamente escrituras en el log de auditoría ────────────
const auditarEscritura = async (req, res, next) => {
  const metodos = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!metodos.includes(req.method)) return next();

  // Captura la respuesta para saber el ID afectado
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    try {
      await Usuario.registrarLog({
        id_usuario:     req.usuario?.id || null,
        accion:         req.method,
        tabla_afectada: req.path,
        detalle:        `IP: ${req.ip} | Body: ${JSON.stringify(req.body).slice(0, 200)}`,
        registro_id:    data?.id || null
      });
    } catch (e) {
      console.error('Error en auditoría:', e.message);
    }
    return originalJson(data);
  };

  next();
};

module.exports = { verificarToken, requierePermiso, auditarEscritura };