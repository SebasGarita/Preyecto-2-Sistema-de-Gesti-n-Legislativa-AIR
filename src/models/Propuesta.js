const db = require('../config/db');

const Propuesta = {

  async findAll({ busqueda, id_estado, id_etapa } = {}) {
    const condiciones = ['1=1'];
    const params = [];
    let idx = 1;

    if (busqueda) {
      condiciones.push(`(p.titulo ILIKE $${idx} OR p.codigo_air ILIKE $${idx})`);
      params.push(`%${busqueda}%`);
      idx++;
    }
    if (id_estado) {
      condiciones.push(`p.id_estado_propuesta = $${idx}`);
      params.push(id_estado);
      idx++;
    }
    if (id_etapa) {
      condiciones.push(`p.id_etapa_propuesta = $${idx}`);
      params.push(id_etapa);
      idx++;
    }

    const result = await db.query(`
      SELECT
        p.id_propuesta,
        p.titulo,
        p.codigo_air,
        p.texto_sustitutivo,
        ep.nombre  AS etapa,
        es.nombre  AS estado,
        m.nombre_rol AS mayoria_requerida,
        r.nombre_normativa AS reglamento_base,
        -- Proponentes como array de nombres
        ARRAY_AGG(DISTINCT a.nombre) FILTER (WHERE a.nombre IS NOT NULL) AS proponentes,
        -- Si es conciliada, indica el padre
        pp.titulo  AS propuesta_padre_titulo,
        p.id_propuesta_padre
      FROM propuesta p
      LEFT JOIN catalogo_etapas_propuestas    ep ON p.id_etapa_propuesta         = ep.id_etapa_propuesta
      LEFT JOIN catalogo_estado_propuestas    es ON p.id_estado_propuesta         = es.id_estado_propuesta
      LEFT JOIN catalogo_tipo_mayoria_requerida m ON p.id_tipo_mayoria_requerida  = m.id_tipo_mayoria_requerida
      LEFT JOIN reglamento                    r  ON p.id_reglamento_base          = r.id_reglamento
      LEFT JOIN proponente_propuesta          pp2 ON pp2.id_propuesta             = p.id_propuesta
      LEFT JOIN asambleista                   a   ON pp2.id_asambleista           = a.asambleista_id
      LEFT JOIN propuesta                     pp  ON p.id_propuesta_padre         = pp.id_propuesta
      WHERE ${condiciones.join(' AND ')}
      GROUP BY p.id_propuesta, ep.nombre, es.nombre, m.nombre_rol,
               r.nombre_normativa, pp.titulo
      ORDER BY p.id_propuesta DESC
    `, params);

    return result.rows;
  },

  async findById(id) {
    const propuesta = await db.query(`
      SELECT
        p.*,
        ep.nombre    AS etapa,
        es.nombre    AS estado,
        m.nombre_rol AS mayoria_requerida,
        r.nombre_normativa AS reglamento_base
      FROM propuesta p
      LEFT JOIN catalogo_etapas_propuestas     ep ON p.id_etapa_propuesta        = ep.id_etapa_propuesta
      LEFT JOIN catalogo_estado_propuestas     es ON p.id_estado_propuesta        = es.id_estado_propuesta
      LEFT JOIN catalogo_tipo_mayoria_requerida m ON p.id_tipo_mayoria_requerida  = m.id_tipo_mayoria_requerida
      LEFT JOIN reglamento                     r  ON p.id_reglamento_base         = r.id_reglamento
      WHERE p.id_propuesta = $1
    `, [id]);

    if (!propuesta.rows[0]) return null;

    const proponentes = await db.query(`
      SELECT a.asambleista_id, a.nombre, a.cedula, pp.fecha_registro
      FROM proponente_propuesta pp
      JOIN asambleista a ON pp.id_asambleista = a.asambleista_id
      WHERE pp.id_propuesta = $1
      ORDER BY pp.fecha_registro ASC
    `, [id]);

    // Propuestas base si esta es conciliada
    const propuestasBase = await db.query(`
      SELECT id_propuesta, titulo, codigo_air
      FROM propuesta
      WHERE id_propuesta_padre = $1
    `, [id]);

    return {
      ...propuesta.rows[0],
      proponentes:    proponentes.rows,
      propuestas_base: propuestasBase.rows
    };
  },

  async create({
    id_reglamento_base, id_etapa_propuesta, id_estado_propuesta,
    id_propuesta_padre, titulo, texto_sustitutivo,
    codigo_air, id_tipo_mayoria_requerida
  }) {
    // Estado inicial siempre BORRADOR si no se indica
    const result = await db.query(`
      INSERT INTO propuesta (
        id_reglamento_base, id_etapa_propuesta, id_estado_propuesta,
        id_propuesta_padre, titulo, texto_sustitutivo,
        codigo_air, id_tipo_mayoria_requerida
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      id_reglamento_base || null,
      id_etapa_propuesta,
      id_estado_propuesta,
      id_propuesta_padre || null,
      titulo,
      texto_sustitutivo || null,
      codigo_air || null,
      id_tipo_mayoria_requerida
    ]);
    return result.rows[0];
  },

  async addProponente({ id_propuesta, id_asambleista }) {
    const result = await db.query(`
      INSERT INTO proponente_propuesta (id_propuesta, id_asambleista, fecha_registro)
      VALUES ($1, $2, CURRENT_DATE)
      ON CONFLICT DO NOTHING
      RETURNING *
    `, [id_propuesta, id_asambleista]);
    return result.rows[0];
  },

  async cambiarEstado(id_propuesta, id_estado_propuesta, usuario) {
    const result = await db.query(`
      UPDATE propuesta
      SET id_estado_propuesta = $1
      WHERE id_propuesta = $2
      RETURNING *
    `, [id_estado_propuesta, id_propuesta]);

    // Registra en bitácora
    if (result.rows[0]) {
      await db.query(`
        INSERT INTO bitacora_propuesta (
          id_propuesta, id_estado_propuesta,
          fecha_modificacion, usuario_modificacion
        ) VALUES ($1, $2, NOW(), $3)
      `, [id_propuesta, id_estado_propuesta, usuario]);
    }

    return result.rows[0];
  },

  async getCatalogos() {
    const etapas    = await db.query('SELECT * FROM catalogo_etapas_propuestas   ORDER BY id_etapa_propuesta');
    const estados   = await db.query('SELECT * FROM catalogo_estado_propuestas   ORDER BY id_estado_propuesta');
    const mayorias  = await db.query('SELECT * FROM catalogo_tipo_mayoria_requerida ORDER BY id_tipo_mayoria_requerida');
    const reglamentos = await db.query('SELECT id_reglamento, nombre_normativa, sigla FROM reglamento ORDER BY nombre_normativa');
    return {
      etapas:       etapas.rows,
      estados:      estados.rows,
      mayorias:     mayorias.rows,
      reglamentos:  reglamentos.rows
    };
  }
};

module.exports = Propuesta;