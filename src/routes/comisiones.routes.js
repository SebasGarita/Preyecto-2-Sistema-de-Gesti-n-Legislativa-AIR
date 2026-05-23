const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ComisionController');
const { verificarToken, requierePermiso, auditarEscritura } = require('../middlewares/auth');

// Todas las rutas requieren token válido
router.use(verificarToken);

// ── Catálogos ─────────────────────────────────────────────────
// IMPORTANTE: rutas literales ANTES que /:id para evitar conflictos
router.get('/catalogos',          ctrl.catalogos);
router.get('/sesiones/:sesionId', ctrl.obtenerSesion);

// ── Listado y detalle ─────────────────────────────────────────
router.get('/',    ctrl.listar);
router.get('/:id', ctrl.obtener);

// ── Crear / editar comisión ───────────────────────────────────
router.post('/',
  requierePermiso('GESTIONAR_COMISIONES'),
  auditarEscritura,
  ctrl.crear
);
router.put('/:id',
  requierePermiso('GESTIONAR_COMISIONES'),
  auditarEscritura,
  ctrl.actualizar
);

// ── Integrantes ───────────────────────────────────────────────
// Individual
router.post('/:id/integrantes',
  requierePermiso('GESTIONAR_COMISIONES'),
  auditarEscritura,
  ctrl.agregarIntegrante
);
// Bulk (debe ir ANTES de /:id/integrantes/:integranteId)
router.post('/:id/integrantes/bulk',
  requierePermiso('GESTIONAR_COMISIONES'),
  auditarEscritura,
  ctrl.agregarIntegrantesMasivo
);
router.delete('/:id/integrantes/:integranteId',
  requierePermiso('GESTIONAR_COMISIONES'),
  auditarEscritura,
  ctrl.removerIntegrante
);

// ── Sesiones de comisión ──────────────────────────────────────
router.post('/:id/sesiones',
  requierePermiso('GESTIONAR_COMISIONES'),
  auditarEscritura,
  ctrl.crearSesion
);
router.post('/sesiones/:sesionId/asistencia',
  requierePermiso('GESTIONAR_COMISIONES'),
  auditarEscritura,
  ctrl.registrarAsistencia
);

// ── Informes del Directorio ───────────────────────────────────
router.post('/:id/informes',
  requierePermiso('GESTIONAR_COMISIONES'),
  auditarEscritura,
  ctrl.crearInforme
);
router.put('/informes/:informeId',
  requierePermiso('GESTIONAR_COMISIONES'),
  auditarEscritura,
  ctrl.actualizarInforme
);

module.exports = router;