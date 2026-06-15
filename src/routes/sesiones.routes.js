const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/SesionController');
const { verificarToken, requierePermiso, auditarEscritura } = require('../middlewares/auth');

router.use(verificarToken);
router.use(auditarEscritura); 

router.get('/catalogos', ctrl.catalogos);
router.get('/',          ctrl.listar);
router.get('/:id',       ctrl.obtener);

// Asistencia
router.get('/:id/asistencia',  ctrl.asistencia);
router.post('/:id/asistencia',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.registrarAsistencia
);

// Puntos de agenda
router.post('/:id/puntos',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.agregarPunto
);

// Resoluciones
router.post('/:id/resoluciones',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.registrarResolucion
);

module.exports = router;