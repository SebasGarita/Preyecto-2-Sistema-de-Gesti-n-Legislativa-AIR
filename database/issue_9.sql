-- ── Seeds: sectores disponibles ────────────────────────────────────────────
INSERT INTO catalogo_sector (nombre) VALUES
  ('Docente'),
  ('Estudiantil'),
  ('Administrativo'),
  ('Egresado'),
  ('Oficio - Consejo Institucional'),
  ('Oficio - Rectoría');

INSERT INTO catalogo_puestos (nombre_puesto) VALUES
  ('Presidente'),
  ('Vicepresidente'),
  ('Secretario'),
  ('Vocal'),
  ('Asambleísta');

CREATE OR REPLACE FUNCTION fn_validar_traslape_nombramiento()
RETURNS TRIGGER AS $$
DECLARE
    -- Declaramos variables locales para almacenar los datos del registro entrante
    v_asambleista_id INT;
    v_id_nombramiento INT;
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
BEGIN
    -- Asignamos los valores de NEW a nuestras variables de CockroachDB
    v_asambleista_id := NEW.asambleista_id;
    v_id_nombramiento := NEW.id_nombramiento;
    v_fecha_inicio := NEW.fecha_inicio;
    v_fecha_fin := NEW.fecha_fin;

    IF EXISTS (
        SELECT 1 FROM nombramiento
        WHERE asambleista_id = v_asambleista_id
          AND estado = 'VIGENTE'
          -- Usamos IS DISTINCT FROM que es más limpio para los NULLs
          AND id_nombramiento IS DISTINCT FROM v_id_nombramiento
          AND (
            v_fecha_inicio <= COALESCE(fecha_fin, '9999-12-31'::DATE)
            AND
            COALESCE(v_fecha_fin, '9999-12-31'::DATE) >= fecha_inicio
          )
    ) THEN
        RAISE EXCEPTION 'TRASLAPE_NOMBRAMIENTO: El asambleísta ya tiene un nombramiento vigente en ese período';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;