-- Función: validar quórum (requiere al menos 38 de 57 asambleístas)
CREATE OR REPLACE FUNCTION validar_quorum_legal(p_id_sesion INT)
RETURNS BOOLEAN AS $$
DECLARE v_presentes INT; v_quorum_req INT;
BEGIN
  SELECT COUNT(*) INTO v_presentes
  FROM asistencia_sesion_plenaria WHERE id_sesion = p_id_sesion;
  SELECT quorum_requerido INTO v_quorum_req
  FROM sesiones WHERE id_sesion = p_id_sesion;
  RETURN v_presentes >= COALESCE(v_quorum_req, 29);
END; $$ LANGUAGE plpgsql;

-- Función: calcular resultado de votación
CREATE OR REPLACE FUNCTION calcular_resultado_votacion(
  p_favor INT, p_contra INT, p_tipo VARCHAR)
RETURNS VARCHAR AS $$
DECLARE v_total INT; v_umbral FLOAT;
BEGIN
  v_total := p_favor + p_contra;
  v_umbral := CASE p_tipo WHEN 'Calificada' THEN 0.66 ELSE 0.50 END;
  RETURN CASE WHEN v_total = 0 THEN 'SIN_VOTOS'
    WHEN (p_favor::FLOAT / v_total::FLOAT) > v_umbral THEN 'APROBADA'
    ELSE 'RECHAZADA' END;
END; $$ LANGUAGE plpgsql;

-- Vista: participación activa
CREATE VIEW v_participacion_activa AS
SELECT a.asambleista_id, a.nombre,
  COUNT(asp.id_sesion) AS sesiones_asistidas,
  (SELECT COUNT(*) FROM sesiones) AS total_sesiones,
  ROUND(COUNT(asp.id_sesion)::DECIMAL /
    NULLIF((SELECT COUNT(*) FROM sesiones),0) * 100, 2)
    AS indice_participacion_pct
FROM asambleista a
LEFT JOIN asistencia_sesion_plenaria asp ON a.asambleista_id = asp.id_asambleista
GROUP BY a.asambleista_id, a.nombre;

ALTER TABLE asistencia_sesion_plenaria
ADD CONSTRAINT uq_asistencia UNIQUE (id_asambleista, id_sesion);

-- Insertar estado 'Presente' como default en el catálogo:
INSERT INTO catalogo_asistencia_sesion_comision (nombre) VALUES ('Presente') ON CONFLICT DO NOTHING;


