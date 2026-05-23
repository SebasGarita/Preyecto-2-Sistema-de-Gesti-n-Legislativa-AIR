
// Issue #12 — Control de Asistencias y Cálculo de Participación

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/AsistenciaController');
const {
  verificarToken,
  requierePermiso,
  auditarEscritura
} = require('../middlewares/auth');

// Todas las rutas requieren token válido
router.use(verificarToken);
router.use(auditarEscritura);

// ── Catálogos ─────────────────────────────────────────────────
// Carga selects del formulario (sesiones, estados de asistencia)
router.get('/catalogos', ctrl.catalogos);

// ── Reporte de participación por período ─────────────────────
// GET /asistencia/reporte?fechaInicio=2025-01-01&fechaFin=2025-12-31
// Visible para Secretaría y Consulta
router.get('/reporte', ctrl.reportePeriodo);

// ── Participación de un asambleísta ──────────────────────────
// GET /asistencia/participacion/:asambleistaId?fechaInicio=...&fechaFin=...
router.get('/participacion/:asambleistaId', ctrl.calcularParticipacion);

// ── Hoja de asistencia (plenaria) ────────────────────────────
// GET  /asistencia/hoja/:idSesion  — carga la hoja para marcar
// POST /asistencia/hoja/:idSesion  — guarda la hoja completa
router.get('/hoja/:idSesion', ctrl.getHoja);

router.post('/hoja/:idSesion',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.registrarHoja
);

// ── Resumen de una sesión ya cerrada ─────────────────────────
// GET /asistencia/sesion/:idSesion/resumen
router.get('/sesion/:idSesion/resumen', ctrl.resumenSesion);

// ── Votaciones ───────────────────────────────────────────────
// POST /asistencia/votacion       — registrar resultado
// GET  /asistencia/votacion/:idSesion — historial de sesión
router.post('/votacion',
  requierePermiso('GESTIONAR_SESIONES'),
  ctrl.registrarVotacion
);

router.get('/votacion/:idSesion', ctrl.getVotaciones);

module.exports = router;