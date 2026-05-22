-- Issue #15: Gestión de Anulaciones y Sustituciones

-- 1. Agregar columna estado a certificacion_emitida   Valores: 'Activo' | 'Anulado'

ALTER TABLE public.certificacion_emitida
    ADD COLUMN IF NOT EXISTS estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    ADD COLUMN IF NOT EXISTS folio_sustituido_por VARCHAR(50) NULL;

ALTER TABLE certificacion_emitida ADD COLUMN contenido TEXT;

--cambiar a FK entera (requiere migración de datos)
ALTER TABLE certificacion_emitida
  ADD COLUMN id_usuario_secretaria INT REFERENCES sys_usuario(id_usuario);

-- Migrar datos existentes:
UPDATE certificacion_emitida ce
SET id_usuario_secretaria = u.id_usuario::INT
FROM sys_usuario u
WHERE ce.usuario_secretaria = u.id_usuario::TEXT;

-- Luego eliminar la columna vieja:
ALTER TABLE certificacion_emitida DROP COLUMN usuario_secretaria;

-- folio_sustituido_por: si esta cert fue reemplazada, apunta al folio nuevo


-- 2. Agregar columna folio_origen a anulacion_certificacion
--    Para que la cert de sustitución sepa a cuál reemplaza
ALTER TABLE public.anulacion_certificacion
    ADD COLUMN IF NOT EXISTS folio_sustitucion VARCHAR(50) NULL;

-- folio_sustitucion: folio del documento nuevo que reemplaza al anulado


-- 3. Índice único: solo puede haber UNA anulación por certificación
CREATE UNIQUE INDEX IF NOT EXISTS uq_anulacion_por_cert
    ON public.anulacion_certificacion (certificacion_id);

-- 4. Trigger: impedir UPDATE o DELETE sobre certificaciones
--    activas ya emitidas (protección de fe pública)
--    NOTA: tg_no_repudio_cert del proyecto-air.sql
--    Solo permite cambiar estado a 'Anulado' mediante la
--    función anular_certificacion(), nunca editar hash/folio.
CREATE OR REPLACE FUNCTION fn_proteger_certificacion()
RETURNS TRIGGER AS $$
BEGIN
    -- Bloquear borrado total
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION
            'No se puede eliminar la certificación con folio %. Registre una anulación en su lugar.',
            (OLD).folio_unico;
    END IF;

    -- En UPDATE: solo se permite cambiar estado y folio_sustituido_por
    IF (OLD).folio_unico        <> (NEW).folio_unico        OR
       (OLD).hash_seguridad     <> (NEW).hash_seguridad     OR
       (OLD).id_asambleista     <> (NEW).id_asambleista     OR
       (OLD).id_usuario_secretaria <> (NEW).id_usuario_secretaria THEN
        RAISE EXCEPTION
            'La certificación con folio % es un documento de fe pública y sus campos de identidad no pueden modificarse.',
            (OLD).folio_unico;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_no_repudio_cert ON public.certificacion_emitida;
CREATE TRIGGER tg_no_repudio_cert
    BEFORE UPDATE OR DELETE ON public.certificacion_emitida
    FOR EACH ROW EXECUTE FUNCTION fn_proteger_certificacion();

-- 5. Función almacenada: anular_certificacion
--    Registra la anulación y marca el folio como inválido.
--    Parámetros:
--      p_certificacion_id  → id de la cert a anular
--      p_motivo            → justificación obligatoria
--      p_folio_sustitucion → folio nuevo (NULL si no hay sustitución aún)
CREATE OR REPLACE FUNCTION anular_certificacion(
    p_certificacion_id  BIGINT,
    p_motivo            TEXT,
    p_folio_sustitucion VARCHAR(50) DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_estado_actual VARCHAR(20);
BEGIN
    -- Validar que el motivo no esté vacío
    IF p_motivo IS NULL OR TRIM(p_motivo) = '' THEN
        RAISE EXCEPTION 'El motivo de anulación es obligatorio.';
    END IF;

    -- Verificar que la certificación existe y obtener su estado
    SELECT estado INTO v_estado_actual
    FROM public.certificacion_emitida
    WHERE id_certificacion = p_certificacion_id;

    IF v_estado_actual IS NULL THEN
        RAISE EXCEPTION 'No se encontró la certificación con id %', p_certificacion_id;
    END IF;

    IF v_estado_actual = 'Anulado' THEN
        RAISE EXCEPTION 'La certificación ya se encuentra anulada.';
    END IF;

    -- Registrar la anulación
    INSERT INTO public.anulacion_certificacion
        (certificacion_id, motivo, fecha, folio_sustitucion)
    VALUES
        (p_certificacion_id, TRIM(p_motivo), current_date(), p_folio_sustitucion);

    -- Marcar la certificación como Anulada
    UPDATE public.certificacion_emitida
    SET estado = 'Anulado',
        folio_sustituido_por = p_folio_sustitucion
    WHERE id_certificacion = p_certificacion_id;

END;
$$ LANGUAGE plpgsql;
-- ------------------------------------------------------------
-- Ejemplo de uso:
SELECT anular_certificacion(123, 'Error en el periodo reportado', 'DAIR-010-2026');
