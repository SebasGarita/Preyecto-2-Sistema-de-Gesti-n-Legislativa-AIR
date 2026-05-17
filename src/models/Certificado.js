const pool          = require('../config/db.js');
const CryptoService = require('../services/CryptoService.js');

class CertificadoModel {

    // ----------------------------------------------------------
    // EMISIÓN — Issue #1 / Issue #17
    // ----------------------------------------------------------

    /**
     * Emite una certificación oficial.
     * Genera folio DAIR-XXX-YYYY de forma atómica y calcula el hash SHA-256.
     *
     * @param {number} asambleistaId
     * @param {string|object} contenidoCertificado — texto plano u objeto con datos
     * @param {string} usuarioId
     * @returns {{ id, folio, hash, fecha }}
     */
    async emitir(asambleistaId, contenidoCertificado, usuarioId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const anio = new Date().getFullYear();

            // 1. Bloquear el control de folio para el año actual
            const lockRes = await client.query(
                `SELECT id_control, ultimo_numero
                 FROM public.control_folio
                 WHERE anio = $1
                 FOR UPDATE`,
                [anio]
            );

            let ultimoNumero = 0;
            let idControl;

            if (lockRes.rows.length === 0) {
                // Primera emisión del año: crear registro de control
                const insCtrl = await client.query(
                    `INSERT INTO public.control_folio (anio, ultimo_numero, fecha_actualizacion)
                     VALUES ($1, 0, now())
                     RETURNING id_control, ultimo_numero`,
                    [anio]
                );
                idControl    = insCtrl.rows[0].id_control;
                ultimoNumero = 0;
            } else {
                idControl    = lockRes.rows[0].id_control;
                ultimoNumero = lockRes.rows[0].ultimo_numero;
            }

            // 2. Calcular nuevo número y folio DAIR
            const nuevoNumero = ultimoNumero + 1;
            const folio = `DAIR-${String(nuevoNumero).padStart(3, '0')}-${anio}`;

            // 3. Generar hash SHA-256 — compatible con objeto o texto plano
            const datosHash = typeof contenidoCertificado === 'object'
                ? { asambleistaId, ...contenidoCertificado, folio, timestamp: new Date().toISOString() }
                : { folio, asambleistaId, contenido: contenidoCertificado, usuarioSecretaria: usuarioId };

            const hashSeguridad = CryptoService.generarHash(datosHash);

            // 4. Insertar la certificación
            const insRes = await client.query(
                `INSERT INTO public.certificacion_emitida
                    (id_asambleista, folio_unico, hash_seguridad, fecha_emision, usuario_secretaria, estado)
                 VALUES ($1, $2, $3, now(), $4, 'Activo')
                 RETURNING id_certificacion, fecha_emision`,
                [asambleistaId, folio, hashSeguridad, usuarioId]
            );

            // 5. Actualizar el control de folio
            await client.query(
                `UPDATE public.control_folio
                 SET ultimo_numero = $1, fecha_actualizacion = now()
                 WHERE id_control = $2`,
                [nuevoNumero, idControl]
            );

            await client.query('COMMIT');

            return {
                id   : insRes.rows[0].id_certificacion,
                folio,
                hash : hashSeguridad,
                fecha: insRes.rows[0].fecha_emision
            };

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    // ----------------------------------------------------------
    // CONSULTA — Issue #1 / Issue #17
    // ----------------------------------------------------------

    /**
     * Obtiene una certificación por su folio único.
     * Usado para reimpresión sin generar nuevo folio.
     * Incluye datos del asambleísta y, si está anulada, el motivo.
     */
    async obtenerPorFolio(folioUnico) {
        const res = await pool.query(
            `SELECT
                ce.id_certificacion,
                ce.id_asambleista,
                ce.folio_unico,
                ce.hash_seguridad,
                ce.fecha_emision,
                ce.usuario_secretaria,
                ce.estado,
                ce.folio_sustituido_por,
                a.nombre          AS nombre_asambleista,
                a.cedula          AS cedula_asambleista,
                ac.motivo         AS motivo_anulacion,
                ac.fecha          AS fecha_anulacion,
                ac.folio_sustitucion
             FROM public.certificacion_emitida ce
             JOIN public.asambleista a
               ON a.asambleista_id = ce.id_asambleista
             LEFT JOIN public.anulacion_certificacion ac
               ON ac.certificacion_id = ce.id_certificacion
             WHERE ce.folio_unico = $1`,
            [folioUnico]
        );
        return res.rows[0] ?? null;
    }

    /**
     * Obtiene una certificación por su id numérico.
     * Usado internamente por sustituir().
     */
    async obtenerPorId(id) {
        const res = await pool.query(
            `SELECT
                ce.id_certificacion,
                ce.id_asambleista,
                ce.folio_unico,
                ce.estado
             FROM public.certificacion_emitida ce
             WHERE ce.id_certificacion = $1`,
            [id]
        );
        return res.rows[0] ?? null;
    }

    /**
     * Historial de todas las certificaciones emitidas.
     * Soporta filtros opcionales y paginación.
     *
     * @param {{ estado?, desde?, hasta?, pagina?, porPagina? }} filtros
     */
    async historial(filtros = {}) {
        const condiciones = [];
        const params      = [];
        let   idx         = 1;

        if (filtros.estado) {
            condiciones.push(`ce.estado = $${idx++}`);
            params.push(filtros.estado);
        }
        if (filtros.desde) {
            condiciones.push(`ce.fecha_emision >= $${idx++}`);
            params.push(filtros.desde);
        }
        if (filtros.hasta) {
            condiciones.push(`ce.fecha_emision <= $${idx++}`);
            params.push(filtros.hasta);
        }

        const where     = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        const pagina    = Math.max(1, filtros.pagina    ?? 1);
        const porPagina = Math.min(100, filtros.porPagina ?? 20);
        const offset    = (pagina - 1) * porPagina;

        const res = await pool.query(
            `SELECT
                ce.id_certificacion,
                ce.id_asambleista,
                ce.folio_unico,
                ce.fecha_emision,
                ce.hash_seguridad,
                ce.estado,
                ce.folio_sustituido_por,
                a.nombre       AS nombre_asambleista,
                a.cedula       AS cedula_asambleista,
                u.username     AS secretaria
             FROM public.certificacion_emitida ce
             JOIN public.asambleista a
               ON a.asambleista_id = ce.id_asambleista
             LEFT JOIN public.sys_usuario u
  ON ce.usuario_secretaria = u.id_usuario::text
             ${where}
             ORDER BY ce.fecha_emision DESC
             LIMIT $${idx} OFFSET $${idx + 1}`,
            [...params, porPagina, offset]
        );

        const totalRes = await pool.query(
            `SELECT COUNT(*) AS total
             FROM public.certificacion_emitida ce
             ${where}`,
            params
        );

        return {
            datos    : res.rows,
            total    : parseInt(totalRes.rows[0].total),
            pagina,
            porPagina
        };
    }

    // ----------------------------------------------------------
    // ANULACIÓN — Issue #15
    // ----------------------------------------------------------

    /**
     * Anula una certificación emitida.
     * Delega toda la lógica de integridad a la función almacenada
     * anular_certificacion() definida en la BD.
     *
     * @param {number} certificacionId
     * @param {string} motivo              — obligatorio
     * @param {string|null} folioSustitucion
     */
    async anular(certificacionId, motivo, folioSustitucion = null) {
        if (!motivo || motivo.trim() === '') {
            throw new Error('El motivo de anulación es obligatorio.');
        }

        await pool.query(
            `SELECT anular_certificacion($1, $2, $3)`,
            [certificacionId, motivo.trim(), folioSustitucion]
        );
    }

    // ----------------------------------------------------------
    // SUSTITUCIÓN — Issue #15
    // ----------------------------------------------------------

    /**
     * Anula el folio original y emite uno nuevo que lo referencia.
     *
     * @param {number} certificacionOriginalId
     * @param {string} motivoAnulacion
     * @param {number} asambleistaId
     * @param {string} contenidoNuevo
     * @param {string} usuarioSecretaria
     * @returns {{ folioAnulado, folioNuevo, hash, fecha }}
     */
    async sustituir(
        certificacionOriginalId,
        motivoAnulacion,
        asambleistaId,
        contenidoNuevo,
        usuarioSecretaria
    ) {
        if (!motivoAnulacion || motivoAnulacion.trim() === '') {
            throw new Error('El motivo de sustitución es obligatorio.');
        }

        const original = await this.obtenerPorId(certificacionOriginalId);

        if (!original) {
            throw new Error('No se encontró la certificación original.');
        }
        if (original.estado === 'Anulado') {
            throw new Error('La certificación original ya está anulada.');
        }

        const folioAnulado = original.folio_unico;

        // Emitir la certificación nueva (genera su propio folio y hash)
        const nueva = await this.emitir(asambleistaId, contenidoNuevo, usuarioSecretaria);

        // Anular la original referenciando el folio nuevo
        await this.anular(
            certificacionOriginalId,
            `${motivoAnulacion.trim()} — Sustituida por: ${nueva.folio}`,
            nueva.folio
        );

        return {
            folioAnulado,
            folioNuevo : nueva.folio,
            hash       : nueva.hash,
            fecha      : nueva.fecha
        };
    }

    // ----------------------------------------------------------
    // VERIFICACIÓN PÚBLICA — Issue #15
    // ----------------------------------------------------------

    /**
     * Verifica si un folio es válido.
     * Usado por la ruta pública GET /verificar/:folio
     */
    async verificarFolio(folio) {
        const cert = await this.obtenerPorFolio(folio);

        if (!cert) {
            return {
                esValido: false,
                estado  : null,
                mensaje : 'Folio no encontrado.'
            };
        }

        if (cert.estado === 'Anulado') {
            return {
                esValido        : false,
                estado          : 'Anulado',
                motivoAnulacion : cert.motivo_anulacion,
                fechaAnulacion  : cert.fecha_anulacion,
                folioSustitucion: cert.folio_sustitucion,
                mensaje         : 'DOCUMENTO INVÁLIDO — Este folio fue anulado.'
            };
        }

        return {
            esValido         : true,
            estado           : 'Activo',
            nombreAsambleista: cert.nombre_asambleista,
            fechaEmision     : cert.fecha_emision,
            mensaje          : 'Documento auténtico y vigente.'
        };
    }
}

module.exports = CertificadoModel;