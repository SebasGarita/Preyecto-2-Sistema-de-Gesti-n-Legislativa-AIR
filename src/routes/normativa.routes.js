const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/NormativaController');
const { verificarToken, requierePermiso } = require('../middlewares/auth');

router.use(verificarToken);

router.get('/catalogos',                   ctrl.catalogos);
router.get('/',                            ctrl.listarReglamentos);
router.get('/:id/arbol',                   ctrl.getArbol);
router.get('/elemento/:id_elemento/historial', ctrl.getHistorial);

router.post('/',
  requierePermiso('EDITAR_REGLAMENTOS'),
  ctrl.crearReglamento
);
router.post('/elemento',
  requierePermiso('EDITAR_REGLAMENTOS'),
  ctrl.crearElemento
);

module.exports = router;