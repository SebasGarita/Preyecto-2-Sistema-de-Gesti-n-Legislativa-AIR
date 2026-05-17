const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/ReporteController');
const { verificarToken, requierePermiso } = require('../middlewares/auth');

// ── Ruta pública — verificación de folio sin token ──
router.get('/verificar/:folio',     ctrl.verificarFolioPublico);
router.get('/verificar/:folio/pdf', ctrl.descargarPDFPublico);

// ── Todas las demás rutas requieren token ──
router.use(verificarToken);

// Historial y consulta
router.get('/',           ctrl.historialCertificaciones);
router.get('/:folio',     ctrl.obtenerCertificacion);
router.get('/:folio/pdf', ctrl.descargarPDF);

// Emisión (solo Secretaría y Admin)
router.post('/',
    requierePermiso('EMITIR_CERTIFICACION'),
    ctrl.emitirCertificacion
);

// Verificación de autenticidad
router.post('/verificar', ctrl.verificarAutenticidad);

// Anulación y sustitución (solo Secretaría y Admin)
router.post('/:id/anular',
    requierePermiso('EMITIR_CERTIFICACION'),
    ctrl.anularCertificacion
);

router.post('/:id/sustituir',
    requierePermiso('EMITIR_CERTIFICACION'),
    ctrl.sustituirCertificacion
);

module.exports = router;