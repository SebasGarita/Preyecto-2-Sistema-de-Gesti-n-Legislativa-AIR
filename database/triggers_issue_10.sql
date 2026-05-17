-- ============================================================================
-- TRIGGER: tg_vigencia_normativa
-- Versionamiento automático
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_vigencia_normativa()
RETURNS TRIGGER AS $$
BEGIN

    IF (NEW).id_estado_vigencia = 1 THEN

        UPDATE elemento_normativo
        SET
            id_estado_vigencia = 2,
            fecha_fin_vigencia = CURRENT_DATE
        WHERE id_reglamento = (NEW).id_reglamento
          AND numer_etiqueta = (NEW).numer_etiqueta
          AND id_estado_vigencia = 1
          AND id_elemento != (NEW).id_elemento
          AND (
                (id_elemento_padre IS NULL
                 AND (NEW).id_elemento_padre IS NULL)
                OR
                id_elemento_padre = (NEW).id_elemento_padre
              );

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_vigencia_normativa
ON elemento_normativo;

CREATE TRIGGER tg_vigencia_normativa
AFTER INSERT ON elemento_normativo
FOR EACH ROW
EXECUTE FUNCTION fn_vigencia_normativa();

-- ============================================================================
-- TRIGGER: tg_aprobar_propuesta
-- Aprueba automáticamente propuesta al crear resolución
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_aprobar_propuesta_en_resolucion()
RETURNS TRIGGER AS $$
DECLARE
    v_id_propuesta INT;
BEGIN

    -- Obtener propuesta asociada
    SELECT id_propuesta
    INTO v_id_propuesta
    FROM punto_agenda
    WHERE id_punto_agenda = (NEW).id_punto_agenda;

    -- Si existe propuesta, aprobarla
    IF v_id_propuesta IS NOT NULL THEN

        UPDATE propuesta
        SET id_estado_propuesta = 5 -- APROBADA
        WHERE id_propuesta = v_id_propuesta;

        -- Registrar en bitácora
        INSERT INTO bitacora_propuesta (
            id_propuesta,
            id_estado_propuesta,
            fecha_modificacion,
            usuario_modificacion
        )
        VALUES (
            v_id_propuesta,
            5,
            NOW(),
            'SISTEMA_TRIGGER'
        );

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_aprobar_propuesta
ON resolucion;

CREATE TRIGGER tg_aprobar_propuesta
AFTER INSERT ON resolucion
FOR EACH ROW
EXECUTE FUNCTION fn_aprobar_propuesta_en_resolucion();