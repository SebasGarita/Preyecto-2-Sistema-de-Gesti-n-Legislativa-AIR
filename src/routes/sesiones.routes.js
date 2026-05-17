const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/SesionController');
const { verificarToken, requierePermiso } = require('../middlewares/auth');

router.use(verificarToken);

router.get('/catalogos', ctrl.catalogos);
router.get('/',          ctrl.listar);
router.get('/:id',       ctrl.obtener);

router.post('/',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.crear
);
router.post('/:id/agenda',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.agregarPunto
);
router.post('/:id/resoluciones',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.registrarResolucion
);

module.exports = router;