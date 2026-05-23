const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ComisionController');
const { verificarToken, requierePermiso, auditarEscritura } = require('../middlewares/auth');

// Todas las rutas requieren token válido
router.use(verificarToken);
router.use(auditarEscritura);

// ── Catálogos (selectores del formulario) ─────────────────────
router.get('/catalogos', ctrl.catalogos);

// ── Listado y detalle ─────────────────────────────────────────
// Secretaría y Consulta pueden ver
router.get('/',    ctrl.listar);
router.get('/:id', ctrl.obtener);

// ── Crear / editar comisión ───────────────────────────────────
router.post('/',
  requierePermiso('GESTIONAR_COMISIONES'),
  ctrl.crear
);
router.put('/:id',
  requierePermiso('GESTIONAR_COMISIONES'),
  ctrl.actualizar
);

// ── Integrantes (N:M asambleista <-> comision) ────────────────
router.post('/:id/integrantes',
  requierePermiso('GESTIONAR_COMISIONES'),
  ctrl.agregarIntegrante
);
router.delete('/:id/integrantes/:integranteId',
  requierePermiso('GESTIONAR_COMISIONES'),
  ctrl.removerIntegrante
);

// ── Sesiones de comisión ──────────────────────────────────────
router.post('/:id/sesiones',
  requierePermiso('GESTIONAR_COMISIONES'),
  ctrl.crearSesion
);

// Detalle de sesión y registro de asistencia viven bajo /sesiones/:id
// (sin prefijo de comisión, el sesionId ya identifica todo)
router.get('/sesiones/:sesionId',           ctrl.obtenerSesion);
router.post('/sesiones/:sesionId/asistencia',
  requierePermiso('GESTIONAR_COMISIONES'),
  ctrl.registrarAsistencia
);

// ── Informes del Directorio ───────────────────────────────────
router.post('/:id/informes',
  requierePermiso('GESTIONAR_COMISIONES'),
  ctrl.crearInforme
);
router.put('/informes/:informeId',
  requierePermiso('GESTIONAR_COMISIONES'),
  ctrl.actualizarInforme
);

module.exports = router;