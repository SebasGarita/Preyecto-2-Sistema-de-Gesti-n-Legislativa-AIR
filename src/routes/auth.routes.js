const express        = require('express');
const router         = express.Router();
const AuthController = require('../controllers/AuthController');
const { verificarToken, requierePermiso } = require('../middlewares/auth');

// Pública
router.post('/login', AuthController.login);

// Protegidas
router.post('/logout',
  verificarToken,
  AuthController.logout
);

router.post('/usuarios',
  verificarToken,
  requierePermiso('GESTIONAR_USUARIOS'),
  AuthController.crearUsuario
);

module.exports = router;