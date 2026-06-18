const db = require('../config/db');

const Sesion = {

  async findAll() {
    const result = await db.query(`
      SELECT
        s.id_sesion,
        s.numero_sesion,
        s.fecha,
        s.quorum_requerido,
        s.link_acta,
        tm.nombre AS tipo_modalidad,
        ts.nombre AS tipo_sesion,
        -- Cuenta los puntos de agenda
        COUNT(pa.id_punto_agenda) AS total_puntos
      FROM sesiones s
      JOIN catalogo_tipo_modalidad tm ON s.id_tipo_modalidad = tm.id_tipo_modalidad
      JOIN catalogo_tipo_sesion    ts ON s.id_tipo_sesion    = ts.id_tipo_sesion
      LEFT JOIN punto_agenda pa ON pa.id_sesion = s.id_sesion
      GROUP BY s.id_sesion, tm.nombre, ts.nombre
      ORDER BY s.fecha DESC
    `);
    return result.rows;
  },

  async findById(id) {
    const sesion = await db.query(`
      SELECT
        s.*,
        s.id_sesion::text AS id_sesion,   -- ← cast
        tm.nombre AS tipo_modalidad,
        ts.nombre AS tipo_sesion
      FROM sesiones s
      JOIN catalogo_tipo_modalidad tm ON s.id_tipo_modalidad = tm.id_tipo_modalidad
      JOIN catalogo_tipo_sesion    ts ON s.id_tipo_sesion    = ts.id_tipo_sesion
      WHERE s.id_sesion = $1
    `, [String(id)]);   // ← String()

    if (!sesion.rows[0]) return null;

    const agenda = await db.query(`
      SELECT
        pa.id_punto_agenda,
        pa.orden,
        pa.descripcion,
        p.titulo        AS titulo_propuesta,
        p.codigo_air,
        ep.nombre       AS etapa,
        ep2.nombre      AS estado,
        r.numero_resolucion
      FROM punto_agenda pa
      LEFT JOIN propuesta               p   ON pa.id_propuesta        = p.id_propuesta
      LEFT JOIN catalogo_etapas_propuestas ep  ON p.id_etapa_propuesta   = ep.id_etapa_propuesta
      LEFT JOIN catalogo_estado_propuestas ep2 ON p.id_estado_propuesta  = ep2.id_estado_propuesta
      LEFT JOIN resolucion               r   ON r.id_punto_agenda      = pa.id_punto_agenda
      WHERE pa.id_sesion = $1
      ORDER BY pa.orden ASC
    `, [id]);

    return { ...sesion.rows[0], agenda: agenda.rows };
  },

  async create({ id_tipo_modalidad, id_tipo_sesion, numero_sesion,
                 fecha, link_acta, quorum_requerido }) {
    const result = await db.query(`
      INSERT INTO sesiones (
        id_tipo_modalidad, id_tipo_sesion, numero_sesion,
        fecha, link_acta, quorum_requerido
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id_tipo_modalidad, id_tipo_sesion, numero_sesion,
        fecha, link_acta || null, quorum_requerido]);
    return result.rows[0];
  },

  async addPuntoAgenda({ id_sesion, id_propuesta, orden, descripcion }) {
    const result = await db.query(`
      INSERT INTO punto_agenda (id_sesion, id_propuesta, orden, descripcion)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id_sesion, id_propuesta || null, orden, descripcion]);
    return result.rows[0];
  },

  async crearResolucion({ id_sesion, id_punto_agenda, numero_resolucion, fecha_emision }) {
    const result = await db.query(`
      INSERT INTO resolucion (id_agenda, id_punto_agenda, numero_resolucion, fecha_emision)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      String(id_sesion),
      String(id_punto_agenda),   // ← este es el que probablemente llega corrupto
      numero_resolucion,
      fecha_emision
    ]);
    return result.rows[0];
  },

  async getCatalogos() {
    const tipos      = await db.query('SELECT * FROM catalogo_tipo_sesion ORDER BY nombre');
    const modalidades = await db.query('SELECT * FROM catalogo_tipo_modalidad ORDER BY nombre');
    return { tipos: tipos.rows, modalidades: modalidades.rows };
  }
async getAsistencia(idSesion) {
    const result = await db.query(`
      SELECT
        a.asambleista_id,
        a.nombre,
        a.cedula,
        ca.nombre AS estado_asistencia
      FROM asistencia_sesion_plenaria asp
      JOIN asambleista a ON asp.id_asambleista = a.asambleista_id
      JOIN catalogo_asistencia_sesion_comision ca ON asp.id_estado_asistencia = ca.id_estado_asistencia
      WHERE asp.id_sesion = $1
      ORDER BY a.nombre ASC
    `, [idSesion]);
    return result.rows;
  },

  async registrarAsistencia({ id_sesion, id_asambleista, id_estado_asistencia }) {
    const result = await db.query(`
      INSERT INTO asistencia_sesion_plenaria (id_asambleista, id_sesion, id_estado_asistencia)
      VALUES ($1, $2, $3)
      ON CONFLICT (id_asambleista, id_sesion) DO UPDATE
        SET id_estado_asistencia = EXCLUDED.id_estado_asistencia
      RETURNING *
    `, [id_asambleista, id_sesion, id_estado_asistencia]);
    return result.rows[0];
  }
};

module.exports = Sesion;