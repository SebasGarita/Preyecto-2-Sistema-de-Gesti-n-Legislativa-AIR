const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/SesionController');
const { verificarToken, requierePermiso, auditarEscritura } = require('../middlewares/auth');

router.use(verificarToken);
router.use(auditarEscritura); 

router.get('/catalogos', ctrl.catalogos);
router.get('/',          ctrl.listar);
router.get('/:id',       ctrl.obtener);
router.get('/:id/agenda/:idPunto/resolucion', ctrl.getResolucionPorPunto);

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