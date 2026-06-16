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
            `SELECT ultimo_numero::text AS ultimo_numero_str, prefijo
            FROM public.control_folio WHERE anio = $1`,
            [anio]
        );

        const ultimo = parseInt(result.rows[0]?.ultimo_numero_str ?? '0', 10);
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

            await certificadoModel.anular(id, motivo.trim());

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
                id,
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

    // ----------------------------------------------------------
    // PREVISUALIZACIÓN HTML — Issue #4
    // ----------------------------------------------------------

    async previewCertificacion(req, res) {
        try {
            const { asambleistaId } = req.params;
            const { contenido }     = req.query;

            if (!asambleistaId) {
                return res.status(400).json({ ok: false, error: 'Falta asambleistaId.' });
            }

            // Datos del asambleísta
            const db = require('../config/db.js');
            const { rows } = await db.query(`
                SELECT
                    ba.nombre         AS nombre_completo,
                    ba.cedula,
                    cs.nombre         AS sector,
                    n.fecha_inicio    AS periodo
                FROM asambleista ba
                JOIN nombramiento n   ON n.asambleista_id = ba.asambleista_id
                                    AND n.estado = 'VIGENTE'
                JOIN catalogo_sector cs ON cs.id_sector = n.sector_id
                WHERE ba.asambleista_id = $1
                LIMIT 1
            `, [asambleistaId]);

            if (!rows.length) {
                return res.status(404).json({ ok: false, error: 'Asambleísta no encontrado.' });
            }

            const asm = rows[0];

            // Siguiente folio (solo para mostrar — no se reserva aquí)
            const folioRes = await db.query(
                `SELECT ultimo_numero, prefijo FROM public.control_folio WHERE anio = $1`,
                [new Date().getFullYear()]
            );
            const ultimo  = folioRes.rows[0]?.ultimo_numero ?? 0;
            const prefijo = folioRes.rows[0]?.prefijo       ?? 'DAIR';
            const folioPreview = `${prefijo}-${String(ultimo + 1).padStart(3, '0')}-${new Date().getFullYear()} (BORRADOR)`;

            // Secretaria activa
            const secretaria = 'Secretaría AIR — ITCR';
            // Fecha en texto
            const hoy    = new Date();
            const meses  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
            const diaNum = hoy.getDate();
            const unidades = ['','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciséis','diecisiete','dieciocho','diecinueve','veinte','veintiún','veintidós','veintitrés','veinticuatro','veinticinco','veintiséis','veintisiete','veintiocho','veintinueve','treinta','treinta y uno'];

            // Generar HTML de previsualización
            const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    :root { --azul:#003865; --dorado:#C8942A; }
    *{ margin:0; padding:0; box-sizing:border-box; }
    body{ font-family:'Times New Roman',serif; font-size:11.5pt; color:#1a1a1a;
          background:#fff; padding:2cm 2.5cm; line-height:1.6; }

    .encabezado{ display:flex; justify-content:space-between; align-items:center;
                 border-bottom:3px solid var(--azul); padding-bottom:10px; margin-bottom:16px; }
    .inst{ font-size:13pt; font-weight:bold; color:var(--azul); text-transform:uppercase; }
    .dep { font-size:10pt; color:var(--dorado); font-weight:bold; margin-top:2px; }
    .folio-num{ font-size:10pt; color:var(--azul); font-weight:bold;
                border:1.5px solid var(--azul); padding:3px 8px; border-radius:3px; }

    .titulo{ text-align:center; margin:18px 0 10px; }
    .titulo h1{ font-size:14pt; text-transform:uppercase; color:var(--azul); }
    .titulo .sub{ font-size:10.5pt; color:#555; margin-top:3px; }
    hr{ border:none; border-top:1px solid #ccc; margin:12px 0; }

    .cuerpo{ margin:16px 0; text-align:justify; }
    .cuerpo p{ margin-bottom:10px; }

    .nota-borrador{
        background:#fff3cd; border-left:4px solid #f0ad4e;
        padding:8px 12px; font-size:9.5pt; color:#856404;
        margin:10px 0; border-radius:3px;
    }

    .contenido-cert{
        background:#f8f9fa; border:1px dashed #ccc;
        padding:14px; border-radius:4px; margin:14px 0;
        font-size:10.5pt; line-height:1.6; white-space:pre-wrap;
    }

    .clausula{
        border:1px solid #ccc; padding:10px 14px; border-radius:3px;
        background:#fbfbfb; font-style:italic; font-size:10.5pt;
        margin:16px 0;
    }

    .firma-bloque{ margin-top:40px; display:flex; justify-content:flex-end; }
    .firma-contenido{ text-align:center; width:260px; }
    .firma-linea{ border-top:1.5px solid #1a1a1a; margin-bottom:6px; }
    .firma-nombre{ font-weight:bold; font-size:11pt; }
    .firma-cargo{ font-size:10pt; color:#555; }

    .pie{ margin-top:30px; border-top:2px solid var(--azul); padding-top:8px;
          display:flex; justify-content:space-between; font-size:8.5pt; color:#888; }
  </style>
</head>
<body>
  <header class="encabezado">
    <div>
      <div class="inst">Instituto Tecnológico de Costa Rica</div>
      <div class="dep">Secretaría de la Asamblea Institucional Representativa</div>
    </div>
    <div style="text-align:right">
      <span class="folio-num">${folioPreview}</span>
      <div style="font-size:9pt;color:#555;margin-top:4px">${hoy.toLocaleDateString('es-CR')}</div>
    </div>
  </header>

  <div class="nota-borrador">
    ⚠️ <strong>Vista previa — BORRADOR.</strong> El folio definitivo se asignará al confirmar la emisión.
  </div>

  <div class="titulo">
    <h1>Certificación de Participación</h1>
    <div class="sub">Asamblea Institucional Representativa &mdash; Período ${asm.periodo ?? '—'}</div>
  </div>
  <hr/>

  <div class="cuerpo">
    <p>
      <strong>${secretaria}</strong>, en su condición de Secretaria(o) de la
      Asamblea Institucional Representativa del Instituto Tecnológico de Costa Rica,
      <strong>CERTIFICA:</strong>
    </p>
    <p>
      Que según consta en los registros oficiales de esta Secretaría,
      el(la) señor(a) <strong>${asm.nombre_completo}</strong>,
      portador(a) de la cédula de identidad número <strong>${asm.cedula}</strong>,
      en su calidad de representante del sector <strong>${asm.sector}</strong>.
    </p>
  </div>

  <div class="contenido-cert">${contenido ? contenido.replace(/</g,'&lt;').replace(/>/g,'&gt;') : '<em style="color:#999">Sin contenido ingresado aún.</em>'}</div>

  <div class="clausula">
    Se extiende la presente certificación a solicitud del(la) interesado(a), a los
    <strong>${unidades[diaNum] || diaNum}</strong> días del mes de
    <strong>${meses[hoy.getMonth()]}</strong> del año <strong>${hoy.getFullYear()}</strong>.
    El suscrito declara, bajo la fe del juramento establecido en el artículo 301
    de la Ley General de la Administración Pública, que la información aquí
    consignada es fiel reflejo de los registros oficiales custodiados por esta Secretaría.
  </div>

  <div class="firma-bloque">
    <div class="firma-contenido">
      <div class="firma-linea"></div>
      <div class="firma-nombre">${secretaria}</div>
      <div class="firma-cargo">Secretaría de la AIR &mdash; ITCR</div>
    </div>
  </div>

  <footer class="pie">
    <span>Documento generado por el Sistema AIR &mdash; ITCR</span>
    <span style="font-family:'Courier New',monospace;font-size:7.5pt;color:#aaa">
      SHA-256: [se asigna al emitir]
    </span>
  </footer>
</body>
</html>`;

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(html);

      } catch (error) {
            console.error('[PREVIEW ERROR]', error.stack);
            return res.status(500).json({ ok: false, error: error.message });
        }
    }
}

module.exports = new ReporteController();
