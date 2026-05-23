// Asistencia.js
// Issue #12 — Motor de Control de Asistencias y Cálculo de Participación
//
// REEMPLAZA la lógica de Votacion.js (que tenía id_estado_asistencia = 1
// hardcodeado, valor inexistente en CockroachDB).
// LegislativoController.js sigue funcionando con Votacion.js para
// verificarQuorum y calcularResultado; este modelo toma todo lo demás.

const db = require('../config/db');

const Asistencia = {

  // ────────────────────────────────────────────────────────────
  // HOJA DE PLENARIA
  // ────────────────────────────────────────────────────────────

  /**
   * Devuelve la sesión + todos los asambleístas con nombramiento VIGENTE
   * y su estado de asistencia actual para esa sesión.
   * Es el "documento" que renderiza la hoja digital.
   */
  async getHojaPlenaria(idSesion) {
    const sesion = await db.query(`
      SELECT
        s.id_sesion,
        s.numero_sesion,
        s.fecha,
        s.quorum_requerido,
        s.link_acta,
        tm.nombre AS tipo_modalidad,
        ts.nombre AS tipo_sesion
      FROM sesiones s
      JOIN catalogo_tipo_modalidad tm ON tm.id_tipo_modalidad = s.id_tipo_modalidad
      JOIN catalogo_tipo_sesion    ts ON ts.id_tipo_sesion    = s.id_tipo_sesion
      WHERE s.id_sesion = $1
    `, [idSesion]);

    if (!sesion.rows[0]) return null;

    // Todos los asambleístas con nombramiento VIGENTE, con su estado actual
    const asambleistas = await db.query(`
      SELECT
        a.asambleista_id,
        a.nombre,
        a.cedula,
        sec.nombre       AS sector,
        pue.nombre_puesto AS puesto,
        asp.id_estado_asistencia,
        cas.nombre       AS estado_asistencia
      FROM asambleista a
      JOIN nombramiento n
        ON  n.asambleista_id = a.asambleista_id
        AND n.estado         = 'VIGENTE'
      JOIN catalogo_sector  sec ON sec.id_sector = n.sector_id
      JOIN catalogo_puestos pue ON pue.id_puesto = n.id_puesto
      LEFT JOIN asistencia_sesion_plenaria asp
        ON  asp.id_asambleista = a.asambleista_id
        AND asp.id_sesion      = $1
      LEFT JOIN catalogo_asistencia_sesion_comision cas
        ON  cas.id_estado_asistencia = asp.id_estado_asistencia
      ORDER BY a.nombre ASC
    `, [idSesion]);

    const quorumReq  = sesion.rows[0].quorum_requerido || 29;
    const presentes  = asambleistas.rows.filter(
      a => a.estado_asistencia === 'Presente'
    ).length;

    return {
      sesion:           sesion.rows[0],
      asambleistas:     asambleistas.rows,
      presentes,
      quorum_requerido: quorumReq,
      hay_quorum:       presentes >= quorumReq
    };
  },

  /**
   * Registra (o actualiza) la asistencia de toda la hoja de una plenaria.
   * registros: [{ asambleista_id, id_estado_asistencia }]
   * Usa ON CONFLICT para que sea idempotente (re-guardar es seguro).
   */
  async registrarHojaPlenaria(idSesion, registros) {
    const resultados = [];
    for (const r of registros) {
      const res = await db.query(`
        INSERT INTO asistencia_sesion_plenaria
          (id_asambleista, id_sesion, id_estado_asistencia)
        VALUES ($1, $2, $3)
        ON CONFLICT (id_asambleista, id_sesion)
        DO UPDATE SET id_estado_asistencia = EXCLUDED.id_estado_asistencia
        RETURNING *
      `, [r.asambleista_id, idSesion, r.id_estado_asistencia]);
      resultados.push(res.rows[0]);
    }
    return resultados;
  },

  /**
   * Resumen de asistencia de UNA sesión ya guardada.
   * Útil para el panel de detalle posterior al registro.
   */
  async getResumenSesion(idSesion) {
    const result = await db.query(`
      SELECT
        cas.nombre          AS estado,
        COUNT(*)            AS cantidad
      FROM asistencia_sesion_plenaria asp
      JOIN catalogo_asistencia_sesion_comision cas
        ON cas.id_estado_asistencia = asp.id_estado_asistencia
      WHERE asp.id_sesion = $1
      GROUP BY cas.nombre
    `, [idSesion]);
    return result.rows;  // [{estado: 'Presente', cantidad: 42}, ...]
  },


  // ────────────────────────────────────────────────────────────
  // CÁLCULO DE PARTICIPACIÓN POR PERÍODO
  // ────────────────────────────────────────────────────────────

  /**
   * Calcula el porcentaje de asistencia de UN asambleísta
   * en un período definido por fechaInicio / fechaFin.
   * Retorna desglose por tipo: plenaria y comisión.
   *
   * Llama a las funciones SQL para aprovechar la lógica BD
   * sin duplicar reglas de negocio en JS.
   */
  async calcularPorcentajeAsistencia(asambleista_id, fechaInicio, fechaFin) {
    // ── Plenarias ──
    const plRes = await db.query(`
      SELECT
        COUNT(DISTINCT s.id_sesion) AS convocadas,
        COUNT(
          CASE WHEN cas.nombre = 'Presente' THEN asp.id_sesion END
        )                           AS asistidas
      FROM sesiones s
      LEFT JOIN asistencia_sesion_plenaria asp
        ON  asp.id_sesion      = s.id_sesion
        AND asp.id_asambleista = $1
      LEFT JOIN catalogo_asistencia_sesion_comision cas
        ON  cas.id_estado_asistencia = asp.id_estado_asistencia
      WHERE s.fecha BETWEEN $2 AND $3
    `, [asambleista_id, fechaInicio, fechaFin]);

    // ── Sesiones de comisión donde es integrante ──
    const comRes = await db.query(`
      SELECT
        COUNT(DISTINCT sc.id_sesion_comision)    AS convocadas,
        COUNT(
          CASE WHEN cas.nombre = 'Presente' THEN asc2.id_asistencia_comision END
        )                                        AS asistidas
      FROM sesion_comision sc
      JOIN integrante_comision ic
        ON  ic.id_comision    = sc.id_comision
        AND ic.id_asambleista = $1
      LEFT JOIN asistencia_sesion_comision asc2
        ON  asc2.id_sesion_comision = sc.id_sesion_comision
        AND asc2.asambleista_id     = $1
      LEFT JOIN catalogo_asistencia_sesion_comision cas
        ON  cas.id_estado_asistencia = asc2.id_estado_asistencia
      WHERE sc.fecha_hora::DATE BETWEEN $2 AND $3
    `, [asambleista_id, fechaInicio, fechaFin]);

    const pct = (asistidas, convocadas) => {
      const a = parseInt(asistidas)  || 0;
      const c = parseInt(convocadas) || 0;
      return c === 0 ? 0 : Math.round((a / c) * 10000) / 100;
    };

    const pl  = plRes.rows[0];
    const com = comRes.rows[0];

    return {
      periodo: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      plenaria: {
        convocadas: parseInt(pl.convocadas)  || 0,
        asistidas:  parseInt(pl.asistidas)   || 0,
        porcentaje: pct(pl.asistidas, pl.convocadas)
      },
      comision: {
        convocadas: parseInt(com.convocadas) || 0,
        asistidas:  parseInt(com.asistidas)  || 0,
        porcentaje: pct(com.asistidas, com.convocadas)
      }
    };
  },

  /**
   * Reporte de participación de TODOS los asambleístas en un período.
   * Usado para la vista de resumen y para alimentar certificaciones.
   */
  async getReportePeriodo(fechaInicio, fechaFin) {
    const result = await db.query(`
      SELECT
        a.asambleista_id,
        a.nombre,
        a.cedula,
        -- ── Plenarias ──
        COUNT(DISTINCT s.id_sesion)   AS plenarias_convocadas,
        COUNT(
          CASE WHEN cas.nombre = 'Presente' THEN asp.id_sesion END
        )                             AS plenarias_asistidas,
        ROUND(
          COUNT(
            CASE WHEN cas.nombre = 'Presente' THEN asp.id_sesion END
          )::DECIMAL /
          NULLIF(COUNT(DISTINCT s.id_sesion), 0) * 100
        , 2)                          AS pct_plenaria,
        -- ── Comisiones (subconsultas para no distorsionar el GROUP BY) ──
        (
          SELECT COUNT(DISTINCT sc2.id_sesion_comision)
          FROM   sesion_comision sc2
          JOIN   integrante_comision ic2
            ON   ic2.id_comision    = sc2.id_comision
            AND  ic2.id_asambleista = a.asambleista_id
          WHERE  sc2.fecha_hora::DATE BETWEEN $1 AND $2
        )                             AS comision_convocadas,
        (
          SELECT COUNT(*)
          FROM   asistencia_sesion_comision asc3
          JOIN   sesion_comision sc3
            ON   sc3.id_sesion_comision = asc3.id_sesion_comision
          JOIN   catalogo_asistencia_sesion_comision cas3
            ON   cas3.id_estado_asistencia = asc3.id_estado_asistencia
          WHERE  asc3.asambleista_id = a.asambleista_id
            AND  cas3.nombre         = 'Presente'
            AND  sc3.fecha_hora::DATE BETWEEN $1 AND $2
        )                             AS comision_asistidas
      FROM asambleista a
      -- CROSS JOIN para incluir asambleístas sin registros de asistencia
      LEFT JOIN sesiones s
        ON  s.fecha BETWEEN $1 AND $2
      LEFT JOIN asistencia_sesion_plenaria asp
        ON  asp.id_asambleista = a.asambleista_id
        AND asp.id_sesion      = s.id_sesion
      LEFT JOIN catalogo_asistencia_sesion_comision cas
        ON  cas.id_estado_asistencia = asp.id_estado_asistencia
      GROUP BY a.asambleista_id, a.nombre, a.cedula
      ORDER BY pct_plenaria DESC NULLS LAST, a.nombre ASC
    `, [fechaInicio, fechaFin]);

    // Calcular pct_comision en JS (evita subconsulta de ROUND + NULLIF repetida)
    return result.rows.map(r => ({
      ...r,
      plenarias_convocadas: parseInt(r.plenarias_convocadas) || 0,
      plenarias_asistidas:  parseInt(r.plenarias_asistidas)  || 0,
      pct_plenaria:         parseFloat(r.pct_plenaria)       || 0,
      comision_convocadas:  parseInt(r.comision_convocadas)  || 0,
      comision_asistidas:   parseInt(r.comision_asistidas)   || 0,
      pct_comision:
        parseInt(r.comision_convocadas) === 0 ? 0 :
        Math.round(
          (parseInt(r.comision_asistidas) / parseInt(r.comision_convocadas)) * 10000
        ) / 100
    }));
  },


  // ────────────────────────────────────────────────────────────
  // VOTACIÓN — registro persistente
  // ────────────────────────────────────────────────────────────

  /**
   * Verifica quórum, calcula resultado y persiste la votación.
   * Aprovecha las funciones SQL ya existentes del Issue #2.
   * tipo_sesion distingue 'Ordinaria' vs 'Extraordinaria' — ambas
   * requieren quórum pero se registra para trazabilidad en la constancia.
   */
  async registrarVotacion({
    id_sesion, id_punto_agenda, id_propuesta,
    votos_favor, votos_contra, votos_abstencion,
    tipo_mayoria, id_usuario_registro
  }) {
    // 1. Verificar quórum usando la función existente
    const quorumRes = await db.query(
      'SELECT validar_quorum_legal($1) AS hay_quorum',
      [id_sesion]
    );
    const quorum_valido = quorumRes.rows[0].hay_quorum;

    // 2. Calcular resultado usando la función existente
    const resultadoRes = await db.query(
      'SELECT calcular_resultado_votacion($1, $2, $3) AS resultado',
      [votos_favor, votos_contra, tipo_mayoria]
    );
    const resultado = resultadoRes.rows[0].resultado;

    // 3. Obtener tipo de sesión para incluirlo en la respuesta (trazabilidad)
    const sesionInfo = await db.query(`
      SELECT ts.nombre AS tipo_sesion
      FROM   sesiones s
      JOIN   catalogo_tipo_sesion ts ON ts.id_tipo_sesion = s.id_tipo_sesion
      WHERE  s.id_sesion = $1
    `, [id_sesion]);

    // 4. Persistir
    const res = await db.query(`
      INSERT INTO votacion
        (id_sesion, id_punto_agenda, id_propuesta,
         votos_favor, votos_contra, votos_abstencion,
         tipo_mayoria, resultado, quorum_valido, id_usuario_registro)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id_punto_agenda)
      DO UPDATE SET
        votos_favor      = EXCLUDED.votos_favor,
        votos_contra     = EXCLUDED.votos_contra,
        votos_abstencion = EXCLUDED.votos_abstencion,
        tipo_mayoria     = EXCLUDED.tipo_mayoria,
        resultado        = EXCLUDED.resultado,
        quorum_valido    = EXCLUDED.quorum_valido,
        fecha_registro   = NOW()
      RETURNING *
    `, [
      id_sesion, id_punto_agenda || null, id_propuesta || null,
      votos_favor, votos_contra, votos_abstencion || 0,
      tipo_mayoria, resultado, quorum_valido, id_usuario_registro || null
    ]);

    return {
      ...res.rows[0],
      tipo_sesion:  sesionInfo.rows[0]?.tipo_sesion,
      quorum_valido,
      resultado
    };
  },

  async getVotacion(idSesion) {
    const result = await db.query(`
      SELECT
        v.*,
        p.titulo        AS titulo_propuesta,
        p.codigo_air,
        pa.descripcion  AS descripcion_punto,
        ts.nombre       AS tipo_sesion
      FROM votacion v
      LEFT JOIN propuesta               p  ON p.id_propuesta   = v.id_propuesta
      LEFT JOIN punto_agenda            pa ON pa.id_punto_agenda = v.id_punto_agenda
      LEFT JOIN sesiones                s  ON s.id_sesion       = v.id_sesion
      LEFT JOIN catalogo_tipo_sesion    ts ON ts.id_tipo_sesion  = s.id_tipo_sesion
      WHERE v.id_sesion = $1
      ORDER BY v.fecha_registro ASC
    `, [idSesion]);
    return result.rows;
  },


  // ────────────────────────────────────────────────────────────
  // CATÁLOGOS
  // ────────────────────────────────────────────────────────────

  async getCatalogos() {
    const [sesiones, estados, tiposMayoria] = await Promise.all([
      db.query(`
        SELECT
          s.id_sesion,
          s.numero_sesion,
          s.fecha,
          s.quorum_requerido,
          ts.nombre AS tipo_sesion,
          tm.nombre AS tipo_modalidad
        FROM sesiones s
        JOIN catalogo_tipo_sesion    ts ON ts.id_tipo_sesion    = s.id_tipo_sesion
        JOIN catalogo_tipo_modalidad tm ON tm.id_tipo_modalidad = s.id_tipo_modalidad
        ORDER BY s.fecha DESC
        LIMIT 60
      `),
      db.query(
        'SELECT id_estado_asistencia, nombre FROM catalogo_asistencia_sesion_comision ORDER BY nombre'
      ),
      db.query(
        'SELECT DISTINCT tipo_mayoria_requerida FROM catalogo_tipo_mayoria_requerida ORDER BY 1'
      )
    ]);
    return {
      sesiones:           sesiones.rows,
      estados_asistencia: estados.rows,
      tipos_mayoria:      ['Simple', 'Calificada']
    };
  }
};

module.exports = Asistencia;