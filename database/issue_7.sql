-- ============================================================
-- ISSUE #7 — Gestión de Comisiones y Proponentes
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. DATOS SEMILLA
-- ──────────────────────────────────────────────────────────────

INSERT INTO catalogo_tipo_comision (nombre) VALUES
  ('Comisión de Análisis'),
  ('Comisión Especial'),
  ('Comisión Permanente')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO catalogo_rol_comision (nombre_rol) VALUES
  ('Coordinador'),
  ('Secretario'),
  ('Integrante'),
  ('Asesor')
ON CONFLICT (nombre_rol) DO NOTHING;

INSERT INTO catalogo_asistencia_sesion_comision (nombre) VALUES
  ('Presente'),
  ('Ausente justificado'),
  ('Ausente sin justificación')
ON CONFLICT (nombre) DO NOTHING;


-- ──────────────────────────────────────────────────────────────
-- 2. COLUMNAS FALTANTES
-- ──────────────────────────────────────────────────────────────

ALTER TABLE informe_directorio
  ADD COLUMN IF NOT EXISTS titulo VARCHAR(500);

ALTER TABLE sesion_comision
  ADD COLUMN IF NOT EXISTS numero_sesion  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS descripcion    TEXT,
  ADD COLUMN IF NOT EXISTS link_acta      VARCHAR(500);


-- ──────────────────────────────────────────────────────────────
-- 3. CONSTRAINTS DE INTEGRIDAD
-- ──────────────────────────────────────────────────────────────

ALTER TABLE integrante_comision
  ADD CONSTRAINT IF NOT EXISTS uq_integrante_comision_activo
  UNIQUE (id_comision, id_asambleista);

ALTER TABLE asistencia_sesion_comision
  ADD CONSTRAINT IF NOT EXISTS uq_asistencia_sesion_comision
  UNIQUE (id_sesion_comision, asambleista_id);


-- ──────────────────────────────────────────────────────────────
-- 4. VISTA DE APOYO PARA CERTIFICACIÓN
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_participacion_comision AS
SELECT
  c.id_comision,
  c.nombre_comision,
  tc.nombre                                       AS tipo_comision,
  a.asambleista_id,
  a.nombre                                        AS nombre_asambleista,
  a.cedula,
  rc.nombre_rol                                   AS rol_en_comision,
  ic.fecha_ingreso_nombramiento,
  ic.fecha_fin_nombramiento,
  ic.estado                                       AS estado_membresia,
  (SELECT COUNT(*)
   FROM sesion_comision sc
   WHERE sc.id_comision = c.id_comision)          AS total_sesiones_comision,
  (SELECT COUNT(*)
   FROM asistencia_sesion_comision asc2
   JOIN sesion_comision sc ON sc.id_sesion_comision = asc2.id_sesion_comision
   JOIN catalogo_asistencia_sesion_comision cas
     ON cas.id_estado_asistencia = asc2.id_estado_asistencia
   WHERE sc.id_comision = c.id_comision
     AND asc2.asambleista_id = a.asambleista_id
     AND cas.nombre = 'Presente')                 AS sesiones_asistidas,
  (SELECT COUNT(*)
   FROM informe_directorio id2
   WHERE id2.id_comision = c.id_comision)         AS total_informes
FROM integrante_comision ic
JOIN comision               c  ON c.id_comision       = ic.id_comision
JOIN catalogo_tipo_comision tc ON tc.id_tipo_comision  = c.id_tipo_comision
JOIN asambleista            a  ON a.asambleista_id     = ic.id_asambleista
JOIN catalogo_rol_comision  rc ON rc.id_rol_comision   = ic.id_rol_comision;

-- ──────────────────────────────────────────────────────────────
-- FIN ISSUE #7 SQL
-- ──────────────────────────────────────────────────────────────