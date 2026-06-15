-- ============================================================
-- ISSUE #12 — Control de Asistencias y Cálculo de Participación
-- Script ADITIVO. No toca tablas existentes salvo la vista
-- v_participacion_activa que se recrea correctamente.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. TABLA votacion
--    Persiste el resultado de cada votación por punto de agenda.
--    LegislativoController calculaba pero no guardaba; esto lo corrige.
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votacion (
    id_votacion         SERIAL          PRIMARY KEY,
    id_sesion           INT             NOT NULL REFERENCES sesiones(id_sesion),
    id_punto_agenda     INT             REFERENCES punto_agenda(id_punto_agenda),
    id_propuesta        INT             REFERENCES propuesta(id_propuesta),
    votos_favor         INT             NOT NULL DEFAULT 0,
    votos_contra        INT             NOT NULL DEFAULT 0,
    votos_abstencion    INT             NOT NULL DEFAULT 0,
    tipo_mayoria        VARCHAR(50)     NOT NULL,   -- 'Simple' | 'Calificada'
    resultado           VARCHAR(50),                -- 'APROBADA' | 'RECHAZADA' | 'SIN_VOTOS'
    quorum_valido       BOOLEAN         NOT NULL DEFAULT FALSE,
    id_usuario_registro INT             REFERENCES sys_usuario(id_usuario),
    fecha_registro      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Evitar doble votación por punto de agenda
ALTER TABLE votacion
  ADD CONSTRAINT IF NOT EXISTS uq_votacion_punto
  UNIQUE (id_punto_agenda);


-- ──────────────────────────────────────────────────────────────
-- 2. FIX CRÍTICO: v_participacion_activa
--
--    El modelo Votacion.js insertaba SOLO "Presente" (hardcodeado
--    a id = 1, que NO existe en CockroachDB).  Cuando el nuevo
--    módulo empiece a insertar también "Ausente", la vista anterior
--    contaría mal porque hacía LEFT JOIN sin filtrar por estado.
--
--    Esta versión filtra explícitamente por nombre = 'Presente'
--    para ser robusta sin importar el ID del catálogo.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_participacion_activa AS
SELECT
  a.asambleista_id,
  a.nombre,
  COUNT(
    CASE WHEN cas.nombre = 'Presente' THEN asp.id_sesion END
  )                                                             AS sesiones_asistidas,
  (SELECT COUNT(*) FROM sesiones)                               AS total_sesiones,
  ROUND(
    COUNT(
      CASE WHEN cas.nombre = 'Presente' THEN asp.id_sesion END
    )::DECIMAL /
    NULLIF((SELECT COUNT(*) FROM sesiones), 0) * 100
  , 2)                                                          AS indice_participacion_pct
FROM asambleista a
LEFT JOIN asistencia_sesion_plenaria asp
  ON asp.id_asambleista = a.asambleista_id
LEFT JOIN catalogo_asistencia_sesion_comision cas
  ON cas.id_estado_asistencia = asp.id_estado_asistencia
GROUP BY a.asambleista_id, a.nombre;


-- ──────────────────────────────────────────────────────────────
-- 3. FUNCIÓN: porcentaje de asistencia a plenarias en un período
--    Llamada desde el modelo JS con dos parámetros de fecha.
--    Retorna NUMERIC para poder formatear en JS.
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_pct_plenaria(
    p_asambleista_id    INT,
    p_fecha_inicio      DATE,
    p_fecha_fin         DATE
)
RETURNS NUMERIC AS $$
DECLARE
    v_convocadas BIGINT;
    v_asistidas  BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO   v_convocadas
    FROM   sesiones
    WHERE  fecha BETWEEN p_fecha_inicio AND p_fecha_fin;

    SELECT COUNT(*)
    INTO   v_asistidas
    FROM   asistencia_sesion_plenaria asp
    JOIN   sesiones s
      ON   s.id_sesion = asp.id_sesion
    JOIN   catalogo_asistencia_sesion_comision cas
      ON   cas.id_estado_asistencia = asp.id_estado_asistencia
    WHERE  asp.id_asambleista = p_asambleista_id
      AND  cas.nombre         = 'Presente'
      AND  s.fecha            BETWEEN p_fecha_inicio AND p_fecha_fin;

    IF v_convocadas = 0 THEN RETURN 0; END IF;
    RETURN ROUND(v_asistidas::DECIMAL / v_convocadas * 100, 2);
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────────────────────────
-- 4. FUNCIÓN: porcentaje de asistencia a sesiones de comisión
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_pct_comision(
    p_asambleista_id    INT,
    p_fecha_inicio      DATE,
    p_fecha_fin         DATE
)
RETURNS NUMERIC AS $$
DECLARE
    v_convocadas BIGINT;
    v_asistidas  BIGINT;
BEGIN
    -- Solo sesiones de comisiones donde es o fue integrante
    SELECT COUNT(DISTINCT sc.id_sesion_comision)
    INTO   v_convocadas
    FROM   sesion_comision sc
    JOIN   integrante_comision ic
      ON   ic.id_comision    = sc.id_comision
      AND  ic.id_asambleista = p_asambleista_id
    WHERE  sc.fecha_hora::DATE BETWEEN p_fecha_inicio AND p_fecha_fin;

    SELECT COUNT(*)
    INTO   v_asistidas
    FROM   asistencia_sesion_comision asc2
    JOIN   sesion_comision sc
      ON   sc.id_sesion_comision = asc2.id_sesion_comision
    JOIN   catalogo_asistencia_sesion_comision cas
      ON   cas.id_estado_asistencia = asc2.id_estado_asistencia
    WHERE  asc2.asambleista_id = p_asambleista_id
      AND  cas.nombre          = 'Presente'
      AND  sc.fecha_hora::DATE BETWEEN p_fecha_inicio AND p_fecha_fin;

    IF v_convocadas = 0 THEN RETURN 0; END IF;
    RETURN ROUND(v_asistidas::DECIMAL / v_convocadas * 100, 2);
END;
$$ LANGUAGE plpgsql;


-- ──────────────────────────────────────────────────────────────
-- 5. VISTA DE REPORTE CONSOLIDADO (sin filtro de período —
--    el filtro dinámico lo aplica el model JS por parámetro)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_reporte_asistencia_global AS
SELECT
  a.asambleista_id,
  a.nombre,
  a.cedula,
  -- Plenarias
  COUNT(DISTINCT s.id_sesion)   AS plenarias_totales,
  COUNT(
    CASE WHEN cas.nombre = 'Presente' THEN asp.id_sesion END
  )                             AS plenarias_asistidas,
  -- Comisiones
  (SELECT COUNT(DISTINCT sc2.id_sesion_comision)
   FROM   sesion_comision sc2
   JOIN   integrante_comision ic2
     ON   ic2.id_comision    = sc2.id_comision
     AND  ic2.id_asambleista = a.asambleista_id)  AS comision_convocadas,
  (SELECT COUNT(*)
   FROM   asistencia_sesion_comision asc3
   JOIN   catalogo_asistencia_sesion_comision cas3
     ON   cas3.id_estado_asistencia = asc3.id_estado_asistencia
   WHERE  asc3.asambleista_id = a.asambleista_id
     AND  cas3.nombre         = 'Presente')        AS comision_asistidas
FROM asambleista a
LEFT JOIN asistencia_sesion_plenaria asp
  ON  asp.id_asambleista = a.asambleista_id
LEFT JOIN sesiones s
  ON  s.id_sesion = asp.id_sesion
LEFT JOIN catalogo_asistencia_sesion_comision cas
  ON  cas.id_estado_asistencia = asp.id_estado_asistencia
GROUP BY a.asambleista_id, a.nombre, a.cedula;

-- ──────────────────────────────────────────────────────────────
-- FIN ISSUE #12 SQL
-- ──────────────────────────────────────────────────────────────
