const db = require('../config/db');

const Asambleista = {

  // Lista todos con su nombramiento activo actual (si tiene)
  async findAll({ busqueda } = {}) {
    const filtro  = busqueda ? `WHERE a.nombre ILIKE $1 OR a.cedula ILIKE $1` : '';
    const params  = busqueda ? [`%${busqueda}%`] : [];

    const result = await db.query(`
      SELECT
        a.asambleista_id,
        a.cedula,
        a.nombre,
        a.correo_institucional,
        -- Nombramiento vigente actual (puede ser NULL si no tiene)
        n.id_nombramiento,
        s.nombre       AS sector_actual,
        p.nombre_puesto AS puesto_actual,
        n.fecha_inicio,
        n.fecha_fin,
        n.estado
      FROM asambleista a
      LEFT JOIN nombramiento n
        ON n.asambleista_id = a.asambleista_id
        AND n.estado = 'VIGENTE'
      LEFT JOIN catalogo_sector  s ON n.sector_id   = s.id_sector
      LEFT JOIN catalogo_puestos p ON n.id_puesto   = p.id_puesto
      ${filtro}
      ORDER BY a.nombre ASC
    `, params);

    return result.rows;
  },

  // Asambleísta completo con todo su historial de nombramientos
  async findById(id) {
    const persona = await db.query(`
      SELECT asambleista_id, cedula, nombre, correo_institucional
      FROM asambleista
      WHERE asambleista_id = $1
    `, [id]);

    if (!persona.rows[0]) return null;

    const nombramientos = await db.query(`
      SELECT
        n.id_nombramiento,
        s.nombre        AS sector,
        p.nombre_puesto AS puesto,
        n.fecha_inicio,
        n.fecha_fin,
        n.estado,
        r.numero_resolucion AS resolucion_acreditacion,
        n.fecha_registro
      FROM nombramiento n
      LEFT JOIN catalogo_sector  s ON n.sector_id   = s.id_sector
      LEFT JOIN catalogo_puestos p ON n.id_puesto   = p.id_puesto
      LEFT JOIN resolucion        r ON n.resolucion_id = r.id_resolucion
      WHERE n.asambleista_id = $1
      ORDER BY n.fecha_inicio DESC
    `, [id]);

    const bitacora = await db.query(`
      SELECT cedula_anterior, nombre_anterior, razon_cambio, fecha_actualizacion
      FROM bitacora_asambleistas
      WHERE asambleista_id = $1
      ORDER BY fecha_actualizacion DESC
    `, [id]);

    return {
      ...persona.rows[0],
      nombramientos: nombramientos.rows,
      bitacora_cambios: bitacora.rows
    };
  },

  // Busca por cédula para validar duplicados
  async findByCedula(cedula) {
    const result = await db.query(
      'SELECT asambleista_id, nombre FROM asambleista WHERE cedula = $1',
      [cedula]
    );
    return result.rows[0] || null;
  },

  // Crea la identidad permanente del asambleísta
  async create({ cedula, nombre, correo_institucional }) {
    const result = await db.query(`
      INSERT INTO asambleista (cedula, nombre, correo_institucional)
      VALUES ($1, $2, $3)
      RETURNING asambleista_id, cedula, nombre, correo_institucional
    `, [cedula, nombre, correo_institucional]);
    return result.rows[0];
  },

  // Actualiza datos de identidad y guarda en bitácora
  async update(id, { cedula, nombre, correo_institucional, razon_cambio }, usuarioId) {
    // Primero guarda el estado anterior en bitácora
    const anterior = await db.query(
      'SELECT cedula, nombre FROM asambleista WHERE asambleista_id = $1',
      [id]
    );

    if (anterior.rows[0]) {
      await db.query(`
        INSERT INTO bitacora_asambleistas
          (asambleista_id, cedula_anterior, nombre_anterior, razon_cambio, fecha_actualizacion)
        VALUES ($1, $2, $3, $4, NOW())
      `, [
        id,
        anterior.rows[0].cedula,
        anterior.rows[0].nombre,
        razon_cambio || 'Actualización de datos'
      ]);
    }

    const result = await db.query(`
      UPDATE asambleista
      SET cedula = $1, nombre = $2, correo_institucional = $3
      WHERE asambleista_id = $4
      RETURNING asambleista_id, cedula, nombre, correo_institucional
    `, [cedula, nombre, correo_institucional, id]);

    return result.rows[0];
  },

  // Agrega un nuevo nombramiento (el trigger valida traslape)
  async addNombramiento({ asambleista_id, sector_id, id_puesto, fecha_inicio,
                          fecha_fin, id_usuario_registro, resolucion_id }) {
    const result = await db.query(`
      INSERT INTO nombramiento
        (asambleista_id, sector_id, id_puesto, fecha_inicio, fecha_fin,
         estado, id_usuario_registro, fecha_registro, resolucion_id)
      VALUES ($1, $2, $3, $4, $5, 'VIGENTE', $6, NOW(), $7)
      RETURNING *
    `, [asambleista_id, sector_id, id_puesto, fecha_inicio,
        fecha_fin || null, id_usuario_registro, resolucion_id || null]);

    return result.rows[0];
  },

  // Finaliza un nombramiento activo
  async finalizarNombramiento(id_nombramiento, fecha_fin) {
    const result = await db.query(`
      UPDATE nombramiento
      SET estado = 'FINALIZADO', fecha_fin = $1
      WHERE id_nombramiento = $2 AND estado = 'VIGENTE'
      RETURNING *
    `, [fecha_fin, id_nombramiento]);
    return result.rows[0] || null;
  },

  // Catálogos para los selectores del formulario
  async getCatalogos() {
    const sectores = await db.query('SELECT id_sector, nombre FROM catalogo_sector ORDER BY nombre');
    const puestos  = await db.query('SELECT id_puesto, nombre_puesto FROM catalogo_puestos ORDER BY nombre_puesto');
    return {
      sectores: sectores.rows,
      puestos:  puestos.rows
    };
  },

    // Reporte de asistencia histórico para certificación
  // Cumple: COUNT/SUM por período, desglose exacto de sesiones
  async getReporteAsistencia(asambleistaId) {
    // ── Totales globales ──────────────────────────────────────────────────────
    const totales = await db.query(`
      SELECT
        COUNT(*)                                                        AS total_sesiones,
        COUNT(*) FILTER (WHERE ea.nombre ILIKE 'Presente')             AS total_presentes,
        COUNT(*) FILTER (WHERE ea.nombre ILIKE 'Ausente')              AS total_ausentes,
        COUNT(*) FILTER (WHERE ea.nombre ILIKE 'Justificado')          AS total_justificados,
        ROUND(
          COUNT(*) FILTER (WHERE ea.nombre ILIKE 'Presente') * 100.0
          / NULLIF(COUNT(*), 0), 2
        )                                                              AS porcentaje_asistencia,
        MIN(s.fecha)                                                   AS primera_sesion,
        MAX(s.fecha)                                                   AS ultima_sesion
      FROM asistencia_sesion_plenaria asp
      JOIN sesiones s
        ON asp.id_sesion = s.id_sesion
      JOIN catalogo_asistencia_sesion_comision ea
        ON asp.id_estado_asistencia = ea.id_estado_asistencia
      WHERE asp.id_asambleista = $1
    `, [asambleistaId]);
 
    // ── Desglose por tipo de sesión ───────────────────────────────────────────
    const desglose = await db.query(`
      SELECT
        ts.nombre                                                       AS tipo_sesion,
        COUNT(*)                                                        AS total,
        COUNT(*) FILTER (WHERE ea.nombre ILIKE 'Presente')             AS presentes,
        COUNT(*) FILTER (WHERE ea.nombre ILIKE 'Ausente')              AS ausentes,
        COUNT(*) FILTER (WHERE ea.nombre ILIKE 'Justificado')          AS justificados
      FROM asistencia_sesion_plenaria asp
      JOIN sesiones s
        ON asp.id_sesion = s.id_sesion
      JOIN catalogo_tipo_sesion ts
        ON s.id_tipo_sesion = ts.id_tipo_sesion
      JOIN catalogo_asistencia_sesion_comision ea
        ON asp.id_estado_asistencia = ea.id_estado_asistencia
      WHERE asp.id_asambleista = $1
      GROUP BY ts.nombre
      ORDER BY ts.nombre
    `, [asambleistaId]);
 
    // ── Sesiones individuales (para validación BD vs. impreso) ───────────────
    const sesiones = await db.query(`
      SELECT
        s.id_sesion,
        s.numero_sesion,
        s.fecha,
        ts.nombre  AS tipo_sesion,
        ea.nombre  AS estado_asistencia
      FROM asistencia_sesion_plenaria asp
      JOIN sesiones s
        ON asp.id_sesion = s.id_sesion
      JOIN catalogo_tipo_sesion ts
        ON s.id_tipo_sesion = ts.id_tipo_sesion
      JOIN catalogo_asistencia_sesion_comision ea
        ON asp.id_estado_asistencia = ea.id_estado_asistencia
      WHERE asp.id_asambleista = $1
      ORDER BY s.fecha ASC
    `, [asambleistaId]);
 
    return {
      totales:  totales.rows[0],
      desglose: desglose.rows,
      sesiones: sesiones.rows
    };
  },
 
};

module.exports = Asambleista;