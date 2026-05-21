const db = require('../config/db');

const Normativa = {

  // Lista todos los reglamentos registrados
  async getReglamentos() {
    const result = await db.query(`
      SELECT id_reglamento, nombre_normativa, sigla
      FROM reglamento
      ORDER BY nombre_normativa ASC
    `);
    return result.rows;
  },

  // Crea un reglamento raíz
  async crearReglamento({ nombre_normativa, sigla }) {
    const result = await db.query(`
      INSERT INTO reglamento (nombre_normativa, sigla)
      VALUES ($1, $2)
      RETURNING *
    `, [nombre_normativa, sigla]);
    return result.rows[0];
  },

  // Árbol recursivo completo de un reglamento, solo elementos Vigentes
  // Devuelve lista plana ordenada con campo 'profundidad' para que
  // el frontend construya el árbol visual
  async getArbol(id_reglamento) {
    const result = await db.query(`
      WITH RECURSIVE arbol AS (

        -- Nodo raíz: elementos sin padre
        SELECT
          e.id_elemento,
          e.id_elemento_padre,
          e.numer_etiqueta,
          e.contenido_texto,
          e.orden,
          e.fecha_inicio_vigencia,
          e.fecha_fin_vigencia,
          n.nombre        AS nivel,
          v.nombre        AS estado_vigencia,
          1               AS profundidad,
          ARRAY[e.orden]  AS path_orden,
          e.id_elemento::TEXT AS path_ids
        FROM elemento_normativo e
        JOIN catalogo_nivel_reglamento n
          ON e.id_nivel_reglamento = n.id_nivel_reglamento
        JOIN catalogo_estado_vigencia v
          ON e.id_estado_vigencia = v.id_estado_vigencia
        WHERE e.id_reglamento    = $1
          AND e.id_elemento_padre IS NULL
          AND v.nombre            = 'Vigente'

        UNION ALL

        -- Nodos hijos
        SELECT
          e.id_elemento,
          e.id_elemento_padre,
          e.numer_etiqueta,
          e.contenido_texto,
          e.orden,
          e.fecha_inicio_vigencia,
          e.fecha_fin_vigencia,
          n.nombre                      AS nivel,
          v.nombre                      AS estado_vigencia,
          arbol.profundidad + 1,
          arbol.path_orden || e.orden,
          arbol.path_ids || '.' || e.id_elemento::TEXT
        FROM elemento_normativo e
        JOIN catalogo_nivel_reglamento n
          ON e.id_nivel_reglamento = n.id_nivel_reglamento
        JOIN catalogo_estado_vigencia v
          ON e.id_estado_vigencia = v.id_estado_vigencia
        JOIN arbol
          ON e.id_elemento_padre = arbol.id_elemento
        WHERE v.nombre = 'Vigente'
      )
      SELECT * FROM arbol
      ORDER BY path_orden
    `, [id_reglamento]);

    return result.rows;
  },

  // Historial completo de un elemento (vigentes e históricos)
  async getHistorialElemento(id_elemento) {
    const result = await db.query(`
      SELECT
        e.id_elemento,
        e.numer_etiqueta,
        e.contenido_texto,
        e.orden,
        e.fecha_inicio_vigencia,
        e.fecha_fin_vigencia,
        v.nombre AS estado_vigencia,
        -- Resolución que originó este elemento
        res.numero_resolucion AS acuerdo_origen
      FROM elemento_normativo e
      JOIN catalogo_estado_vigencia v
        ON e.id_estado_vigencia = v.id_estado_vigencia
      LEFT JOIN reforma_aplicada  ra  ON ra.id_elemento_normativo = e.id_elemento
      LEFT JOIN resolucion        res ON ra.id_resolucion = res.id_resolucion
      WHERE e.id_elemento = $1
         OR (
           -- También trae las versiones anteriores del mismo artículo
           e.id_reglamento = (SELECT id_reglamento FROM elemento_normativo WHERE id_elemento = $1)
           AND e.numer_etiqueta = (SELECT numer_etiqueta FROM elemento_normativo WHERE id_elemento = $1)
           AND e.id_elemento_padre IS NOT DISTINCT FROM
               (SELECT id_elemento_padre FROM elemento_normativo WHERE id_elemento = $1)
         )
      ORDER BY e.fecha_inicio_vigencia DESC
    `, [id_elemento]);

    return result.rows;
  },

  // Inserta un elemento normativo nuevo (el trigger gestiona el historial)
  async crearElemento({
    id_reglamento, id_elemento_padre, id_nivel_reglamento,
    numer_etiqueta, contenido_texto, orden, id_estado_vigencia
  }) {
    const result = await db.query(`
      INSERT INTO elemento_normativo (
        id_reglamento, id_elemento_padre, id_nivel_reglamento,
        numer_etiqueta, contenido_texto, orden,
        fecha_inicio_vigencia, id_estado_vigencia
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
      RETURNING *
    `, [
      id_reglamento, id_elemento_padre || null, id_nivel_reglamento,
      numer_etiqueta, contenido_texto, orden, id_estado_vigencia
    ]);
    return result.rows[0];
  },

  // Catálogos para los selects del formulario
  async getCatalogos() {
    const niveles  = await db.query(
      'SELECT id_nivel_reglamento, nombre FROM catalogo_nivel_reglamento ORDER BY id_nivel_reglamento'
    );
    const vigencia = await db.query(
      'SELECT id_estado_vigencia, nombre FROM catalogo_estado_vigencia ORDER BY nombre'
    );
    return {
      niveles:  niveles.rows,
      vigencia: vigencia.rows
    };
  }
};

module.exports = Normativa;