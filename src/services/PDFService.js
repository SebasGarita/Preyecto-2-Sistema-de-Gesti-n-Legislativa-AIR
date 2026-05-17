
// src/services/PDFService.js
// Issue #14 — Módulo de Validación de Firmas y Verificación Externa
'use strict';

const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');

class PDFService {

    /**
     * Genera un PDF oficial de certificación con QR de verificación.
     *
     * @param {object} datos
     * @param {string} datos.folio              — Ej: DAIR-001-2026
     * @param {string} datos.hash               — Hash SHA-256 del documento
     * @param {string} datos.nombreAsambleista  — Nombre completo
     * @param {string} datos.cedulaAsambleista  — Cédula
     * @param {string} datos.contenido          — Cuerpo del texto de la certificación
     * @param {string} datos.usuarioSecretaria  — Quien emitió
     * @param {Date}   datos.fechaEmision       — Fecha de emisión
     * @param {string} datos.urlBase            — URL base del sistema, ej: https://mi-sistema.com
     *
     * @returns {Promise<Buffer>} Buffer del PDF listo para enviar o guardar
     */
    static async generarCertificacion(datos) {
        const {
            folio,
            hash,
            nombreAsambleista,
            cedulaAsambleista,
            contenido,
            usuarioSecretaria,
            fechaEmision,
            urlBase = 'http://localhost:3000'
        } = datos;

        // URL que el QR va a codificar — apunta a la ruta pública del Issue #15
        const urlVerificacion = `${urlBase}/verificar/${folio}`;

        // Generar el QR como imagen en base64
        const qrDataUrl = await QRCode.toDataURL(urlVerificacion, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 120
        });

        // Convertir el base64 a Buffer para insertarlo en el PDF
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

        // Formatear fecha
        const fecha = new Date(fechaEmision).toLocaleDateString('es-CR', {
            day  : '2-digit',
            month: 'long',
            year : 'numeric'
        });

        return new Promise((resolve, reject) => {
            const doc    = new PDFDocument({ margin: 60, size: 'LETTER' });
            const chunks = [];

            doc.on('data',  chunk => chunks.push(chunk));
            doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
            doc.on('error', err   => reject(err));

            // ── ENCABEZADO INSTITUCIONAL ──────────────────────────
            doc
                .fontSize(13)
                .font('Helvetica-Bold')
                .text('ASAMBLEA INSTITUCIONAL REPRESENTATIVA', { align: 'center' })
                .fontSize(11)
                .font('Helvetica')
                .text('Instituto Tecnológico de Costa Rica', { align: 'center' })
                .moveDown(0.5)
                .moveTo(60, doc.y)
                .lineTo(550, doc.y)
                .stroke()
                .moveDown(1);

            // ── TÍTULO DEL DOCUMENTO ──────────────────────────────
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('CERTIFICACIÓN OFICIAL', { align: 'center' })
                .moveDown(0.3)
                .fontSize(10)
                .font('Helvetica')
                .text(`Folio: ${folio}`, { align: 'center' })
                .moveDown(1.5);

            // ── CUERPO DE LA CERTIFICACIÓN ────────────────────────
            doc
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('Datos del Asambleísta:')
                .moveDown(0.3)
                .font('Helvetica')
                .text(`Nombre: ${nombreAsambleista}`)
                .text(`Cédula: ${cedulaAsambleista}`)
                .moveDown(1);

            doc
                .font('Helvetica-Bold')
                .text('Contenido de la Certificación:')
                .moveDown(0.3)
                .font('Helvetica')
                .text(contenido, { align: 'justify', lineGap: 4 })
                .moveDown(1.5);

            // ── CIERRE LEGAL ──────────────────────────────────────
            doc
                .font('Helvetica')
                .text(`Emitido el ${fecha} por: ${usuarioSecretaria}`, { align: 'right' })
                .moveDown(3)
                .text('_______________________________', { align: 'right' })
                .text('Secretaría de la AIR', { align: 'right' })
                .moveDown(2);

            // ── PIE DE PÁGINA CON QR Y HASH ───────────────────────
            const pieY = doc.page.height - 160;

            doc
                .moveTo(60, pieY)
                .lineTo(550, pieY)
                .stroke();

            // QR a la izquierda del pie
            doc.image(qrBuffer, 60, pieY + 10, { width: 90, height: 90 });

            // Texto de verificación a la derecha del QR
            doc
                .fontSize(8)
                .font('Helvetica-Bold')
                .text('Verificación de autenticidad:', 165, pieY + 12)
                .font('Helvetica')
                .text(
                    'Escanee el código QR o ingrese el folio en:',
                    165, pieY + 24
                )
                .font('Helvetica-Bold')
                .text(urlVerificacion, 165, pieY + 36)
                .moveDown(0.4)
                .font('Helvetica')
                .fontSize(7)
                .text(`Hash SHA-256: ${hash}`, 165, pieY + 52, {
                    width: 370,
                    lineBreak: true
                })
                .moveDown(0.3)
                .fontSize(8)
                .fillColor('#888888')
                .text(
                    'Este documento fue generado digitalmente. Cualquier alteración invalida su autenticidad.',
                    165, pieY + 72,
                    { width: 370 }
                )
                .fillColor('#000000');

            doc.end();
        });
    }

    /**
     * Genera un PDF de certificación ANULADA.
     * Muestra una marca de agua "ANULADO" y el motivo.
     *
     * @param {object} datos  — mismos campos que generarCertificacion
     * @param {string} datos.motivoAnulacion
     * @param {Date}   datos.fechaAnulacion
     * @returns {Promise<Buffer>}
     */
    static async generarCertificacionAnulada(datos) {
        const {
            folio,
            nombreAsambleista,
            cedulaAsambleista,
            contenido,
            fechaEmision,
            motivoAnulacion,
            fechaAnulacion
        } = datos;

        const fecha         = new Date(fechaEmision).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });
        const fechaAnulada  = new Date(fechaAnulacion).toLocaleDateString('es-CR', { day: '2-digit', month: 'long', year: 'numeric' });

        return new Promise((resolve, reject) => {
            const doc    = new PDFDocument({ margin: 60, size: 'LETTER' });
            const chunks = [];

            doc.on('data',  chunk => chunks.push(chunk));
            doc.on('end',   ()    => resolve(Buffer.concat(chunks)));
            doc.on('error', err   => reject(err));

            // ── MARCA DE AGUA "ANULADO" ───────────────────────────
            doc
                .save()
                .rotate(-45, { origin: [300, 400] })
                .fontSize(90)
                .fillOpacity(0.08)
                .fillColor('red')
                .text('ANULADO', 80, 300)
                .restore()
                .fillOpacity(1)
                .fillColor('#000000');

            // ── ENCABEZADO ────────────────────────────────────────
            doc
                .fontSize(13)
                .font('Helvetica-Bold')
                .text('ASAMBLEA INSTITUCIONAL REPRESENTATIVA', { align: 'center' })
                .fontSize(11)
                .font('Helvetica')
                .text('Instituto Tecnológico de Costa Rica', { align: 'center' })
                .moveDown(0.5)
                .moveTo(60, doc.y).lineTo(550, doc.y).stroke()
                .moveDown(1);

            // ── TÍTULO ────────────────────────────────────────────
            doc
                .fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('red')
                .text('DOCUMENTO INVÁLIDO — CERTIFICACIÓN ANULADA', { align: 'center' })
                .fillColor('#000000')
                .moveDown(0.3)
                .fontSize(10)
                .font('Helvetica')
                .text(`Folio: ${folio}`, { align: 'center' })
                .moveDown(1.5);

            // ── DATOS ─────────────────────────────────────────────
            doc
                .fontSize(11)
                .font('Helvetica-Bold').text('Datos del Asambleísta:')
                .moveDown(0.3)
                .font('Helvetica')
                .text(`Nombre: ${nombreAsambleista}`)
                .text(`Cédula: ${cedulaAsambleista}`)
                .moveDown(1)
                .font('Helvetica-Bold').text('Contenido original:')
                .moveDown(0.3)
                .font('Helvetica')
                .text(contenido, { align: 'justify', lineGap: 4 })
                .moveDown(1.5);

            // ── INFORMACIÓN DE ANULACIÓN ──────────────────────────
            doc
                .moveTo(60, doc.y).lineTo(550, doc.y).strokeColor('red').stroke()
                .strokeColor('#000000')
                .moveDown(0.5)
                .font('Helvetica-Bold').fillColor('red')
                .text('Información de Anulación:')
                .fillColor('#000000')
                .moveDown(0.3)
                .font('Helvetica')
                .text(`Fecha de anulación: ${fechaAnulada}`)
                .text(`Motivo: ${motivoAnulacion}`)
                .moveDown(0.5)
                .fontSize(9)
                .fillColor('#555555')
                .text(`Fecha de emisión original: ${fecha}`)
                .fillColor('#000000');

            doc.end();
        });
    }
}

module.exports = PDFService;