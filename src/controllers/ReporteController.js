// Issue #16 - Exportación de Datos y Reportería Administrativa
// Issue #15 - Gestión de Anulaciones y Sustituciones
// Issue #14
const CertificadoModel = require('../models/Certificado.js');
const CryptoService    = require('../services/CryptoService.js');
const PDFService = require('../services/PDFService.js');

const certificadoModel = new CertificadoModel();

class ReporteController {

    async siguienteFolio(req, res) {
    try {
        const anio = new Date().getFullYear();
        const result = await require('../config/db.js').query(
            `SELECT ultimo_numero, prefijo
             FROM public.control_folio
             WHERE anio = $1`,
            [anio]
        );

        const ultimo  = result.rows[0]?.ultimo_numero ?? 0;
        const prefijo = result.rows[0]?.prefijo       ?? 'DAIR';
        const siguiente = `${prefijo}-${String(ultimo + 1).padStart(3, '0')}-${anio}`;

        return res.json({ ok: true, siguienteFolio: siguiente });

    } catch (error) {
        return res.status(500).json({ ok: false, error: error.message });
    }
};
    // ----------------------------------------------------------
    // EMISIÓN
    // ----------------------------------------------------------

    async emitirCertificacion(req, res) {
        try {
            const { asambleistaId, contenido } = req.body;

            // 👇 DEBUG TEMPORAL
            console.log("📩 asambleistaId recibido:", asambleistaId);
            console.log("📩 tipo:", typeof asambleistaId);

            const usuarioId = req.usuario?.id ?? 'sistema';

            if (!asambleistaId || !contenido) {
                return res.status(400).json({
                    ok: false,
                    error: 'Faltan datos obligatorios: asambleistaId y contenido.'
                });
            }

            const resultado = await certificadoModel.emitir(
                asambleistaId,
                contenido,
                usuarioId
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

    // ----------------------------------------------------------
    // CONSULTA
    // ----------------------------------------------------------

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

            return res.json({ ok: true, datos: certificacion });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    async historialCertificaciones(req, res) {
        try {
            const filtros = {
                estado   : req.query.estado    ?? null,
                desde    : req.query.desde     ?? null,
                hasta    : req.query.hasta     ?? null,
                pagina   : parseInt(req.query.pagina    ?? '1'),
                porPagina: parseInt(req.query.porPagina ?? '20')
            };

            const data = await certificadoModel.historial(filtros);
            return res.json({ ok: true, ...data });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // ----------------------------------------------------------
    // VERIFICACIÓN
    // ----------------------------------------------------------

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

            const esValido = CryptoService.verificarHash(datos, certificacion.hash_seguridad);

            return res.json({
                ok: true,
                esValido,
                estado: certificacion.estado,
                msg: esValido
                    ? 'El documento es auténtico y no ha sido alterado.'
                    : 'ADVERTENCIA: El documento ha sido alterado o es inválido.'
            });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    async verificarFolioPublico(req, res) {
        try {
            const { folio } = req.params;
            const resultado = await certificadoModel.verificarFolio(folio);
            return res.json({ ok: true, ...resultado });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // ----------------------------------------------------------
    // ANULACIÓN — Issue #15
    // ----------------------------------------------------------

    async anularCertificacion(req, res) {
        try {
            const { id }     = req.params;
            const { motivo } = req.body;

            if (!motivo || motivo.trim() === '') {
                return res.status(400).json({
                    ok: false,
                    error: 'El motivo de anulación es obligatorio.'
                });
            }

            await certificadoModel.anular(parseInt(id), motivo.trim());

            return res.json({
                ok : true,
                msg: `La certificación #${id} fue anulada correctamente.`
            });

        } catch (error) {
            const esError400 =
                error.message.includes('obligatorio')    ||
                error.message.includes('No se encontró') ||
                error.message.includes('ya está anulada');

            return res.status(esError400 ? 400 : 500).json({
                ok: false,
                error: error.message
            });
        }
    }

    // ----------------------------------------------------------
    // SUSTITUCIÓN — Issue #15
    // ----------------------------------------------------------

    async sustituirCertificacion(req, res) {
        try {
            const { id }                             = req.params;
            const { motivo, contenidoNuevo, asambleistaId } = req.body;
            const usuarioId = req.usuario?.id || 'sistema';

            if (!motivo || motivo.trim() === '') {
                return res.status(400).json({
                    ok: false,
                    error: 'El motivo de sustitución es obligatorio.'
                });
            }
            if (!contenidoNuevo || contenidoNuevo.trim() === '') {
                return res.status(400).json({
                    ok: false,
                    error: 'El contenido del nuevo documento es obligatorio.'
                });
            }
            if (!asambleistaId) {
                return res.status(400).json({
                    ok: false,
                    error: 'Se requiere asambleistaId.'
                });
            }

            const resultado = await certificadoModel.sustituir(
                parseInt(id),
                motivo.trim(),
                asambleistaId,
                contenidoNuevo.trim(),
                usuarioId
            );

            return res.json({
                ok         : true,
                folioAnulado: resultado.folioAnulado,
                folioNuevo : resultado.folioNuevo,
                hash       : resultado.hash,
                fecha      : resultado.fecha,
                msg        : `Folio ${resultado.folioAnulado} anulado y sustituido por ${resultado.folioNuevo}`
            });

        } catch (error) {
            const esError400 =
                error.message.includes('obligatorio')    ||
                error.message.includes('No se encontró') ||
                error.message.includes('ya está anulada');

            return res.status(esError400 ? 400 : 500).json({
                ok: false,
                error: error.message
            });
        }
    }

    // ----------------------------------------------------------
    // GENERACIÓN DE PDF CON QR — Issue #14
    // ----------------------------------------------------------

    /**
     * GET /certificaciones/:folio/pdf
     * Descarga el PDF oficial de una certificación con QR incluido.
     */
    async descargarPDF(req, res) {
        try {
            const { folio } = req.params;
            const cert = await certificadoModel.obtenerPorFolio(folio);

            if (!cert) {
                return res.status(404).json({
                    ok   : false,
                    error: `No se encontró ninguna certificación con el folio ${folio}.`
                });
            }

            // Si está anulada, generar PDF con marca de agua
            let pdfBuffer;
            if (cert.estado === 'Anulado') {
                pdfBuffer = await PDFService.generarCertificacionAnulada({
                    folio               : cert.folio_unico,
                    nombreAsambleista   : cert.nombre_asambleista,
                    cedulaAsambleista   : cert.cedula_asambleista,
                    contenido           : cert.contenido ?? '(contenido no disponible)',
                    fechaEmision        : cert.fecha_emision,
                    motivoAnulacion     : cert.motivo_anulacion,
                    fechaAnulacion      : cert.fecha_anulacion
                });
            } else {
                const urlBase = `${req.protocol}://${req.get('host')}`;
                pdfBuffer = await PDFService.generarCertificacion({
                    folio              : cert.folio_unico,
                    hash               : cert.hash_seguridad,
                    nombreAsambleista  : cert.nombre_asambleista,
                    cedulaAsambleista  : cert.cedula_asambleista,
                    contenido          : cert.contenido ?? '(contenido no disponible)',
                    usuarioSecretaria  : cert.usuario_secretaria,
                    fechaEmision       : cert.fecha_emision,
                    urlBase
                });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="${folio}.pdf"`
            );
            return res.send(pdfBuffer);

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    /**
     * GET /verificar/:folio/pdf
     * Ruta pública — descarga el PDF para verificación externa.
     * No requiere autenticación.
     */
    async descargarPDFPublico(req, res) {
        try {
            const { folio } = req.params;
            const resultado = await certificadoModel.verificarFolio(folio);

            if (!resultado.esValido && resultado.estado === null) {
                return res.status(404).json({
                    ok   : false,
                    error: 'Folio no encontrado.'
                });
            }

            const cert = await certificadoModel.obtenerPorFolio(folio);
            const urlBase = `${req.protocol}://${req.get('host')}`;

            let pdfBuffer;
            if (cert.estado === 'Anulado') {
                pdfBuffer = await PDFService.generarCertificacionAnulada({
                    folio              : cert.folio_unico,
                    nombreAsambleista  : cert.nombre_asambleista,
                    cedulaAsambleista  : cert.cedula_asambleista,
                    contenido          : cert.contenido ?? '(contenido no disponible)',
                    fechaEmision       : cert.fecha_emision,
                    motivoAnulacion    : cert.motivo_anulacion,
                    fechaAnulacion     : cert.fecha_anulacion
                });
            } else {
                pdfBuffer = await PDFService.generarCertificacion({
                    folio              : cert.folio_unico,
                    hash               : cert.hash_seguridad,
                    nombreAsambleista  : cert.nombre_asambleista,
                    cedulaAsambleista  : cert.cedula_asambleista,
                    contenido          : cert.contenido ?? '(contenido no disponible)',
                    usuarioSecretaria  : cert.usuario_secretaria,
                    fechaEmision       : cert.fecha_emision,
                    urlBase
                });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `inline; filename="${folio}.pdf"`
            );
            return res.send(pdfBuffer);

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // ----------------------------------------------------------
    // NOTAS CONDICIONALES — Issue #6
    // ----------------------------------------------------------

    async obtenerNotaCondicional(req, res) {
        try {
            const { id } = req.params;
            const Propuesta = require('../models/Propuesta.js');

            const leyenda = await Propuesta.obtenerLeyendaPorPropuesta(parseInt(id));

            return res.json({
                ok: true,
                nota: leyenda?.leyenda_legal ?? null,
                origen: leyenda?.descripcion_origen ?? null
            });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }
}

module.exports = new ReporteController();
