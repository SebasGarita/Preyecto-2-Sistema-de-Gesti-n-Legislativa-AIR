const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/PropuestaController');
const { verificarToken, requierePermiso, auditarEscritura } = require('../middlewares/auth');

router.use(verificarToken);
router.use(auditarEscritura); 

router.get('/catalogos', ctrl.catalogos);
router.get('/',          ctrl.listar);
router.get('/:id',       ctrl.obtener);
router.get('/elementos-normativo', ctrl.buscarElementos);

router.post('/',
  requierePermiso('GESTIONAR_PROPUESTAS'),
  ctrl.crear
);
router.post('/:id/proponentes',
  requierePermiso('GESTIONAR_PROPUESTAS'),
  ctrl.agregarProponente
);
router.patch('/:id/estado',
  requierePermiso('GESTIONAR_PROPUESTAS'),
  ctrl.cambiarEstado
);

module.exports = router;