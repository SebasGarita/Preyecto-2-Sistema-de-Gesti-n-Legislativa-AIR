// Issue #16 - Exportación de Datos y Reportería Administrativa
const CertificadoModel = require('../models/Certificado.ext');

const certificadoModel = new CertificadoModel();

class ReporteController {

    // Emitir una certificación oficial con folio DAIR
    async emitirCertificacion(req, res) {
        try {
            const { asambleistaId, contenido } = req.body;
            const usuarioId = req.session?.usuarioId;

            if (!asambleistaId || !contenido) {
                return res.status(400).json({
                    ok: false,
                    error: 'Faltan datos obligatorios: asambleistaId y contenido.'
                });
            }

            const resultado = await certificadoModel.emitir(
                asambleistaId, contenido, usuarioId
            );

            return res.json({
                ok: true,
                folio: resultado.folio,
                hash: resultado.hash,
                fecha: resultado.fecha,
                msg: `Certificación emitida exitosamente. Folio: ${resultado.folio}`
            });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // Obtener detalle de una certificación por folio (reimpresión)
    async obtenerCertificacion(req, res) {
        try {
            const { folio } = req.params;
            const certificacion = await certificadoModel.obtenerPorFolio(folio);

            if (!certificacion) {
                return res.status(404).json({
                    ok: false,
                    error: `No se encontró ninguna certificación con el folio ${folio}.`
                });
            }

            return res.json(certificacion);

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // Historial de todas las certificaciones emitidas
    async historialCertificaciones(req, res) {
        try {
            const data = await certificadoModel.historial();
            return res.json(data);

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // Verificar autenticidad de un certificado por su hash
    async verificarAutenticidad(req, res) {
        try {
            const { folio, datos } = req.body;
            const certificacion = await certificadoModel.obtenerPorFolio(folio);

            if (!certificacion) {
                return res.status(404).json({
                    ok: false,
                    error: 'Certificación no encontrada.'
                });
            }

            const CryptoService = require('../services/CryptoService.ext');
            const esValido = CryptoService.verificarHash(datos, certificacion.hash_seguridad);

            return res.json({
                ok: true,
                esValido,
                msg: esValido
                    ? 'El documento es auténtico y no ha sido alterado.'
                    : 'ADVERTENCIA: El documento ha sido alterado o es inválido.'
            });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }
}

module.exports = new ReporteController();
