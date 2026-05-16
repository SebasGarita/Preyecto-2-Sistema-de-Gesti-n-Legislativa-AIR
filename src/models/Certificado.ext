// Issue #1 - Implementación de Lógica de Foliado y Asignación de Consecutivo Legal
const pool = require('../config/db.js');
const CryptoService = require('../services/CryptoService.ext');

class CertificadoModel {

    // Emite una certificación oficial con folio DAIR y hash SHA-256
    async emitir(asambleistaId, contenidoCertificado, usuarioId) {
        const hashSeguridad = CryptoService.generarHash({
            asambleistaId,
            ...contenidoCertificado,
            timestamp: new Date().toISOString()
        });

        const result = await pool.query(
            `INSERT INTO certificacion_emitida
             (id_asambleista, hash_seguridad, usuario_secretaria)
             VALUES ($1, $2, $3)
             RETURNING folio_unico, fecha_emision`,
            [asambleistaId, hashSeguridad, usuarioId]
        );

        return {
            folio: result.rows[0].folio_unico,
            hash: hashSeguridad,
            fecha: result.rows[0].fecha_emision
        };
    }

    // Recuperar certificado por folio (para reimpresión sin generar nuevo folio)
    async obtenerPorFolio(folioUnico) {
        const result = await pool.query(
            `SELECT c.*, a.cedula, a.nombre
             FROM certificacion_emitida c
             JOIN asambleista a ON c.id_asambleista = a.asambleista_id
             WHERE c.folio_unico = $1`,
            [folioUnico]
        );
        return result.rows[0];
    }

    // Historial de todas las certificaciones emitidas
    async historial() {
        const result = await pool.query(
            `SELECT c.folio_unico, c.fecha_emision, c.hash_seguridad,
                    a.nombre, a.cedula,
                    u.username AS secretaria
             FROM certificacion_emitida c
             JOIN asambleista a ON c.id_asambleista = a.asambleista_id
             LEFT JOIN sys_usuario u ON c.usuario_secretaria = u.id_usuario
             ORDER BY c.fecha_emision DESC`
        );
        return result.rows;
    }
}

module.exports = CertificadoModel;