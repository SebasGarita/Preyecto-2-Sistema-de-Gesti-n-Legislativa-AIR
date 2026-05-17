const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/PropuestaController');
const { verificarToken, requierePermiso } = require('../middlewares/auth');

router.use(verificarToken);

router.get('/catalogos', ctrl.catalogos);
router.get('/',          ctrl.listar);
router.get('/:id',       ctrl.obtener);

router.post('/',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.crear
);
router.post('/:id/proponentes',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.agregarProponente
);
router.patch('/:id/estado',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.cambiarEstado
);

module.exports = router;