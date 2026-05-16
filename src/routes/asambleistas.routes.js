const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/AsambleistaController');
const { verificarToken, requierePermiso } = require('../middlewares/auth');

// Todas las rutas requieren token
router.use(verificarToken);

// Catálogos (sectores y puestos para los selects del formulario)
router.get('/catalogos', ctrl.catalogos);

// Listado y detalle (Secretaría y Consulta pueden ver)
router.get('/',    ctrl.listar);
router.get('/:id', ctrl.obtener);

// Crear y editar (solo Secretaría y Admin)
router.post('/',
  requierePermiso('GESTIONAR_ASAMBLEISTAS'),
  ctrl.crear
);

router.put('/:id',
  requierePermiso('GESTIONAR_ASAMBLEISTAS'),
  ctrl.actualizar
);

// Nombramientos (solo Secretaría y Admin)
router.post('/:id/nombramientos',
  requierePermiso('GESTIONAR_ASAMBLEISTAS'),
  ctrl.asignarNombramiento
);

router.put('/:id/nombramientos/:nomId/finalizar',
  requierePermiso('GESTIONAR_ASAMBLEISTAS'),
  ctrl.finalizarNombramiento
);

module.exports = router;