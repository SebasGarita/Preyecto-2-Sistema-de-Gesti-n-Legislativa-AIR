-- ============================================================
-- ISSUE #11 — Gestión de Comisiones de Análisis e Informes
-- Script ADITIVO: no recrea tablas existentes
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. COLUMNA: objeto_acta en comision
--    Almacena el objeto de la comisión según el acta de creación
-- ──────────────────────────────────────────────────────────────
ALTER TABLE comision
  ADD COLUMN IF NOT EXISTS objeto_acta TEXT;

-- ──────────────────────────────────────────────────────────────
-- 2. PERMISO: asignar GESTIONAR_COMISIONES a SECRETARIA_AIR
--    (ya existe para ADMINISTRADOR desde issue_7)
-- ──────────────────────────────────────────────────────────────
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r, sys_permiso p
WHERE r.nombre_rol = 'SECRETARIA_AIR'
  AND p.nombre_permiso = 'GESTIONAR_COMISIONES'
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- FIN ISSUE #11 SQL
-- ──────────────────────────────────────────────────────────────