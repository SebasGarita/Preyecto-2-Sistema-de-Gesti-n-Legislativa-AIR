const db = require('../config/db');

const Comision = {

  // ──────────────────────────────────────────────────────────
  // COMISIONES
  // ──────────────────────────────────────────────────────────

  /** Lista todas las comisiones con conteo de integrantes e informes */
  async findAll({ busqueda } = {}) {
    const filtro = busqueda ? `WHERE c.nombre_comision ILIKE $1` : '';
    const params = busqueda ? [`%${busqueda}%`] : [];

    const result = await db.query(`
      SELECT
        c.id_comision,
        c.nombre_comision,
        tc.nombre                                   AS tipo_comision,
        COUNT(DISTINCT ic.id_integrante_comision)   AS total_integrantes,
        COUNT(DISTINCT sc.id_sesion_comision)        AS total_sesiones,
        COUNT(DISTINCT id2.id_informe)               AS total_informes
      FROM comision c
      JOIN catalogo_tipo_comision tc ON tc.id_tipo_comision = c.id_tipo_comision
      LEFT JOIN integrante_comision ic
        ON ic.id_comision = c.id_comision AND ic.estado = 'ACTIVO'
      LEFT JOIN sesion_comision sc
        ON sc.id_comision = c.id_comision
      LEFT JOIN informe_directorio id2
        ON id2.id_comision = c.id_comision
      ${filtro}
      GROUP BY c.id_comision, c.nombre_comision, tc.nombre
      ORDER BY c.nombre_comision ASC
    `, params);

    return result.rows;
  },

  /** Detalle completo de una comisión: integrantes, sesiones e informes */
  async findById(id) {
    const comision = await db.query(`
      SELECT
        c.id_comision,
        c.nombre_comision,
        tc.id_tipo_comision,
        tc.nombre AS tipo_comision
      FROM comision c
      JOIN catalogo_tipo_comision tc ON tc.id_tipo_comision = c.id_tipo_comision
      WHERE c.id_comision = $1
    `, [id]);

    if (!comision.rows[0]) return null;

    const integrantes = await db.query(`
      SELECT
        ic.id_integrante_comision,
        a.asambleista_id,
        a.nombre            AS nombre_asambleista,
        a.cedula,
        rc.id_rol_comision,
        rc.nombre_rol,
        ic.fecha_ingreso_nombramiento,
        ic.fecha_fin_nombramiento,
        ic.estado
      FROM integrante_comision ic
      JOIN asambleista        a  ON a.asambleista_id   = ic.id_asambleista
      JOIN catalogo_rol_comision rc ON rc.id_rol_comision = ic.id_rol_comision
      WHERE ic.id_comision = $1
      ORDER BY ic.estado DESC, a.nombre ASC
    `, [id]);

    const sesiones = await db.query(`
      SELECT
        sc.id_sesion_comision,
        sc.numero_sesion,
        sc.fecha_hora,
        sc.descripcion,
        sc.link_acta,
        COUNT(asc2.id_asistencia_comision) AS total_asistentes
      FROM sesion_comision sc
      LEFT JOIN asistencia_sesion_comision asc2
        ON asc2.id_sesion_comision = sc.id_sesion_comision
      WHERE sc.id_comision = $1
      GROUP BY sc.id_sesion_comision, sc.numero_sesion,
               sc.fecha_hora, sc.descripcion, sc.link_acta
      ORDER BY sc.fecha_hora DESC
    `, [id]);

    const informes = await db.query(`
      SELECT
        id2.id_informe,
        id2.titulo,
        id2.recomendacion,
        id2.fecha_presentacion,
        p.titulo            AS titulo_propuesta,
        p.id_propuesta,
        s.numero_sesion     AS sesion_plenaria
      FROM informe_directorio id2
      LEFT JOIN propuesta  p ON p.id_propuesta = id2.id_propuesta
      LEFT JOIN sesiones   s ON s.id_sesion    = id2.id_sesion
      WHERE id2.id_comision = $1
      ORDER BY id2.fecha_presentacion DESC
    `, [id]);

    return {
      ...comision.rows[0],
      integrantes: integrantes.rows,
      sesiones:    sesiones.rows,
      informes:    informes.rows
    };
  },

  /** Crea una comisión nueva */
  async create({ id_tipo_comision, nombre_comision }) {
    const result = await db.query(`
      INSERT INTO comision (id_tipo_comision, nombre_comision)
      VALUES ($1, $2)
      RETURNING id_comision, id_tipo_comision, nombre_comision
    `, [id_tipo_comision, nombre_comision]);
    return result.rows[0];
  },

  /** Actualiza datos de una comisión */
  async update(id, { id_tipo_comision, nombre_comision }) {
    const result = await db.query(`
      UPDATE comision
      SET id_tipo_comision = $1, nombre_comision = $2
      WHERE id_comision = $3
      RETURNING id_comision, id_tipo_comision, nombre_comision
    `, [id_tipo_comision, nombre_comision, id]);
    return result.rows[0] || null;
  },


  // ──────────────────────────────────────────────────────────
  // INTEGRANTES  (N:M  asambleista <-> comision)
  // ──────────────────────────────────────────────────────────

  /** Agrega un asambleísta como integrante de la comisión */
  async addIntegrante({ id_comision, id_asambleista, id_rol_comision,
                        fecha_ingreso_nombramiento, fecha_fin_nombramiento }) {
    const result = await db.query(`
      INSERT INTO integrante_comision
        (id_comision, id_asambleista, id_rol_comision,
         fecha_ingreso_nombramiento, fecha_fin_nombramiento, estado)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVO')
      RETURNING *
    `, [id_comision, id_asambleista, id_rol_comision,
        fecha_ingreso_nombramiento || null, fecha_fin_nombramiento || null]);
    return result.rows[0];
  },

  /** Finaliza la membresía de un integrante (soft-delete + bitácora) */
  async removeIntegrante(id_integrante_comision, fecha_fin) {
    // Guardar en bitácora antes de cambiar estado
    const actual = await db.query(`
      SELECT * FROM integrante_comision WHERE id_integrante_comision = $1
    `, [id_integrante_comision]);

    if (!actual.rows[0]) return null;
    const r = actual.rows[0];

    await db.query(`
      INSERT INTO bitacora_integrante_comision
        (id_integrante_comision, id_comision, id_asambleista,
         id_rol_comision, fecha_ingreso_nombramiento, fecha_fin_nombramiento, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [r.id_integrante_comision, r.id_comision, r.id_asambleista,
        r.id_rol_comision, r.fecha_ingreso_nombramiento,
        r.fecha_fin_nombramiento, r.estado]);

    const result = await db.query(`
      UPDATE integrante_comision
      SET estado = 'INACTIVO', fecha_fin_nombramiento = $1
      WHERE id_integrante_comision = $2
      RETURNING *
    `, [fecha_fin || new Date().toISOString().slice(0, 10), id_integrante_comision]);

    return result.rows[0];
  },


  // ──────────────────────────────────────────────────────────
  // SESIONES DE COMISIÓN
  // ──────────────────────────────────────────────────────────

  /** Registra una sesión de comisión */
  async crearSesion({ id_comision, fecha_hora, numero_sesion, descripcion, link_acta }) {
    const result = await db.query(`
      INSERT INTO sesion_comision
        (id_comision, fecha_hora, numero_sesion, descripcion, link_acta)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id_comision, fecha_hora, numero_sesion || null,
        descripcion || null, link_acta || null]);
    return result.rows[0];
  },

  /** Devuelve el detalle de una sesión con su lista de asistencia */
  async findSesion(id_sesion_comision) {
    const sesion = await db.query(`
      SELECT sc.*, c.nombre_comision
      FROM sesion_comision sc
      JOIN comision c ON c.id_comision = sc.id_comision
      WHERE sc.id_sesion_comision = $1
    `, [id_sesion_comision]);

    if (!sesion.rows[0]) return null;

    const asistencia = await db.query(`
      SELECT
        asc2.id_asistencia_comision,
        a.asambleista_id,
        a.nombre            AS nombre_asambleista,
        a.cedula,
        cas.id_estado_asistencia,
        cas.nombre          AS estado_asistencia
      FROM asistencia_sesion_comision asc2
      JOIN asambleista a ON a.asambleista_id = asc2.asambleista_id
      JOIN catalogo_asistencia_sesion_comision cas
        ON cas.id_estado_asistencia = asc2.id_estado_asistencia
      WHERE asc2.id_sesion_comision = $1
      ORDER BY a.nombre ASC
    `, [id_sesion_comision]);

    return {
      ...sesion.rows[0],
      asistencia: asistencia.rows
    };
  },

  /** Registra o actualiza la asistencia de un asambleísta a una sesión */
  async registrarAsistencia({ id_sesion_comision, asambleista_id, id_estado_asistencia }) {
    const result = await db.query(`
        INSERT INTO asistencia_sesion_comision
        (id_sesion_comision, asambleista_id, id_estado_asistencia)
        VALUES ($1, $2, $3)
        ON CONFLICT (id_sesion_comision, asambleista_id)
        DO UPDATE SET id_estado_asistencia = EXCLUDED.id_estado_asistencia
        RETURNING *
    `, [id_sesion_comision, asambleista_id, id_estado_asistencia]);
    return result.rows[0];
},

  /** Registra asistencia masiva (array de { asambleista_id, id_estado_asistencia }) */
  async registrarAsistenciaMasiva(id_sesion_comision, registros) {
    const resultados = [];
    for (const r of registros) {
      const fila = await this.registrarAsistencia({
        id_sesion_comision,
        asambleista_id:       r.asambleista_id,
        id_estado_asistencia: r.id_estado_asistencia
      });
      resultados.push(fila);
    }
    return resultados;
  },


  // ──────────────────────────────────────────────────────────
  // INFORMES DEL DIRECTORIO
  // ──────────────────────────────────────────────────────────

  /** Crea un informe del directorio asociado a la comisión */
  async crearInforme({ id_comision, id_propuesta, id_sesion,
                       titulo, recomendacion, fecha_presentacion }) {
    const result = await db.query(`
      INSERT INTO informe_directorio
        (id_comision, id_propuesta, id_sesion,
         titulo, recomendacion, fecha_presentacion)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id_comision, id_propuesta || null, id_sesion || null,
        titulo || null, recomendacion || null, fecha_presentacion || null]);
    return result.rows[0];
  },

  /** Actualiza un informe */
  async actualizarInforme(id_informe, { id_propuesta, id_sesion,
                                        titulo, recomendacion, fecha_presentacion }) {
    const result = await db.query(`
      UPDATE informe_directorio
      SET id_propuesta       = $1,
          id_sesion          = $2,
          titulo             = $3,
          recomendacion      = $4,
          fecha_presentacion = $5
      WHERE id_informe = $6
      RETURNING *
    `, [id_propuesta || null, id_sesion || null, titulo || null,
        recomendacion || null, fecha_presentacion || null, id_informe]);
    return result.rows[0] || null;
  },


  // ──────────────────────────────────────────────────────────
  // CATÁLOGOS
  // ──────────────────────────────────────────────────────────

  async getCatalogos() {
    const [tipos, roles, estadosAsistencia, asambleistas, propuestas, sesionesPlenary] =
      await Promise.all([
        db.query('SELECT id_tipo_comision, nombre FROM catalogo_tipo_comision ORDER BY nombre'),
        db.query('SELECT id_rol_comision, nombre_rol FROM catalogo_rol_comision ORDER BY nombre_rol'),
        db.query('SELECT id_estado_asistencia, nombre FROM catalogo_asistencia_sesion_comision ORDER BY nombre'),
        db.query('SELECT asambleista_id, nombre, cedula FROM asambleista ORDER BY nombre'),
        db.query(`
          SELECT p.id_propuesta, p.titulo, p.codigo_air
          FROM propuesta p
          ORDER BY p.titulo ASC
        `),
        db.query(`
            SELECT s.id_sesion, s.numero_sesion, s.fecha::text AS fecha
            FROM sesiones s
            ORDER BY s.fecha DESC
            LIMIT 50
            `)
      ]);

    return {
      tipos_comision:    tipos.rows,
      roles_comision:    roles.rows,
      estados_asistencia: estadosAsistencia.rows,
      asambleistas:      asambleistas.rows,
      propuestas:        propuestas.rows,
      sesiones_plenarias: sesionesPlenary.rows
    };
  }
};

module.exports = Comision;