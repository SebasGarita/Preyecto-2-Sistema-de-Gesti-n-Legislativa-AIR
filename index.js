const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Rutas de Legislativo (Issue #2 - Quórum y Votaciones)
const legislativoController = require('./scr/controllers/LegislativoController.ext');
app.get('/api/sesiones', (req, res) => legislativoController.obtenerSesiones(req, res));
app.get('/api/quorum/:idSesion', (req, res) => legislativoController.verificarQuorum(req, res));
app.post('/api/votacion', (req, res) => legislativoController.registrarVotacion(req, res));
app.post('/api/asistencia', (req, res) => legislativoController.registrarAsistencia(req, res));
app.get('/api/participacion', (req, res) => legislativoController.obtenerParticipacion(req, res));

// Rutas de Reportes (Issue #1 y #16 - Certificaciones)
const reporteController = require('./scr/controllers/ReporteController.ext');
app.post('/api/certificaciones/emitir', (req, res) => reporteController.emitirCertificacion(req, res));
app.get('/api/certificaciones/:folio', (req, res) => reporteController.obtenerCertificacion(req, res));
app.get('/api/certificaciones', (req, res) => reporteController.historialCertificaciones(req, res));
app.post('/api/certificaciones/verificar', (req, res) => reporteController.verificarAutenticidad(req, res));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ msg: 'Servidor AIR funcionando correctamente.' });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});