const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/AuthController');
const { verificarToken, requierePermiso, auditarEscritura } = require('../middlewares/auth');

// Ruta pública
router.post('/login', AuthController.login);

// Ruta protegida
router.post('/logout',
  verificarToken,
  AuthController.logout
);

// Crear usuarios (solo admin)
router.post('/usuarios',
  verificarToken,
  requierePermiso('GESTIONAR_USUARIOS'),
  AuthController.crearUsuario
);

module.exports = router;