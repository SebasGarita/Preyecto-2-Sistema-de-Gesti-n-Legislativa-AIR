-- ── Seeds: catálogos del Issue #10 ────────────────────────────────────────

INSERT INTO catalogo_tipo_sesion (nombre) VALUES
  ('Ordinaria'),
  ('Extraordinaria');

INSERT INTO catalogo_tipo_modalidad (nombre) VALUES
  ('Presencial'),
  ('Virtual'),
  ('Mixta');

INSERT INTO catalogo_etapas_propuestas (nombre) VALUES
  ('Procedencia'),
  ('Dictamen Técnico'),
  ('Comisión AIR'),
  ('Aprobación');

INSERT INTO catalogo_estado_propuestas (nombre) VALUES
  ('BORRADOR'),
  ('PENDIENTE_REVISION'),
  ('AGENDADA'),
  ('EN_DISCUSION'),
  ('APROBADA'),
  ('RECHAZADA');

INSERT INTO catalogo_nivel_reglamento (nombre) VALUES
  ('Título'),
  ('Capítulo'),
  ('Artículo'),
  ('Inciso'),
  ('Sub-inciso');

INSERT INTO catalogo_estado_vigencia (nombre) VALUES
  ('Vigente'),
  ('Histórico'),
  ('Derogado');

INSERT INTO catalogo_tipo_mayoria_requerida (nombre_rol) VALUES
  ('Simple'),
  ('Calificada');
