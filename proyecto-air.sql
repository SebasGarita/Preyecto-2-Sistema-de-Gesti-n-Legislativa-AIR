-- ============================================================================
-- SCHEMA PROYECTO AIR — Ejecución única, ordenado por dependencias
-- Orden: Tablas → ALTER/CONSTRAINTS → Funciones → Triggers → Vistas → Seeds
-- ============================================================================

-- ============================================================================
-- SECCIÓN 1: TABLAS BASE (sin dependencias externas)
-- ============================================================================

CREATE TABLE sys_usuario (
    id_usuario      SERIAL          PRIMARY KEY,
    username        VARCHAR(100)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    activo          BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE TABLE sys_rol (
    id_rol      SERIAL          PRIMARY KEY,
    nombre_rol  VARCHAR(100)    NOT NULL UNIQUE
);

CREATE TABLE sys_permiso (
    id_permiso      SERIAL          PRIMARY KEY,
    nombre_permiso  VARCHAR(100)    NOT NULL UNIQUE,
    descripcion     TEXT
);

CREATE TABLE catalogo_tipo_sesion (
    id_tipo_sesion  SERIAL          PRIMARY KEY,
    nombre          VARCHAR(100)    NOT NULL
);

CREATE TABLE catalogo_tipo_modalidad (
    id_tipo_modalidad   SERIAL          PRIMARY KEY,
    nombre              VARCHAR(100)    NOT NULL
);

CREATE TABLE catalogo_puestos (
    id_puesto       SERIAL          PRIMARY KEY,
    nombre_puesto   VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_sector (
    id_sector   SERIAL          PRIMARY KEY,
    nombre      VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_nivel_reglamento (
    id_nivel_reglamento SERIAL          PRIMARY KEY,
    nombre              VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_etapas_propuestas (
    id_etapa_propuesta  SERIAL          PRIMARY KEY,
    nombre              VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_estado_propuestas (
    id_estado_propuesta SERIAL          PRIMARY KEY,
    nombre              VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_tipo_comision (
    id_tipo_comision    SERIAL          PRIMARY KEY,
    nombre              VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_rol_comision (
    id_rol_comision SERIAL          PRIMARY KEY,
    nombre_rol      VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_tipo_mayoria_requerida (
    id_tipo_mayoria_requerida   SERIAL          PRIMARY KEY,
    nombre_rol                  VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_tipo_reforma (
    id_tipo_reforma SERIAL          PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_estado_vigencia (
    id_estado_vigencia  SERIAL          PRIMARY KEY,
    nombre              VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_tipo_tramite (
    id_tipo_tramite SERIAL          PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL UNIQUE
);

CREATE TABLE catalogo_asistencia_sesion_comision (
    id_estado_asistencia    SERIAL          PRIMARY KEY,
    nombre                  VARCHAR(100)    NOT NULL UNIQUE
);

CREATE TABLE tipo_propuesta_leyenda (
    id_leyenda          SERIAL          PRIMARY KEY,
    codigo_origen       VARCHAR(50)     UNIQUE NOT NULL,
    descripcion_origen  VARCHAR(200)    NOT NULL,
    leyenda_legal       TEXT,
    activo              BOOLEAN         DEFAULT TRUE
);

CREATE TABLE asambleista (
    asambleista_id          SERIAL          PRIMARY KEY,
    cedula                  VARCHAR(20)     NOT NULL,
    nombre                  VARCHAR(255)    NOT NULL,
    correo_institucional    VARCHAR(255)
);

CREATE TABLE reglamento (
    id_reglamento    SERIAL          PRIMARY KEY,
    nombre_normativa VARCHAR(255)    NOT NULL,
    sigla            VARCHAR(50)     NOT NULL UNIQUE
);

CREATE TABLE control_folio (
    id_control          SERIAL          PRIMARY KEY,
    anio                INT             NOT NULL,
    ultimo_numero       INT             NOT NULL DEFAULT 0,
    prefijo             VARCHAR(20)     NOT NULL DEFAULT 'DAIR',
    fecha_actualizacion TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECCIÓN 2: TABLAS CON DEPENDENCIAS DE NIVEL 1
-- ============================================================================

CREATE TABLE sys_usuario_rol (
    id_usuario  INT NOT NULL REFERENCES sys_usuario(id_usuario),
    id_rol      INT NOT NULL REFERENCES sys_rol(id_rol),
    CONSTRAINT pk_sys_usuario_rol PRIMARY KEY (id_usuario, id_rol)
);

CREATE TABLE sys_rol_permiso (
    id_rol      INT NOT NULL REFERENCES sys_rol(id_rol),
    id_permiso  INT NOT NULL REFERENCES sys_permiso(id_permiso),
    CONSTRAINT pk_sys_rol_permiso PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE sys_log_auditoria (
    id_log          SERIAL          PRIMARY KEY,
    id_usuario      INT             REFERENCES sys_usuario(id_usuario),
    accion          VARCHAR(100)    NOT NULL,
    tabla_afectada  VARCHAR(100),
    detalle         TEXT,
    registro_id     INT,
    fecha_hora      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bitacora_asambleistas (
    id_bitacora_asambleista SERIAL          PRIMARY KEY,
    asambleista_id          INT             NOT NULL REFERENCES asambleista(asambleista_id),
    cedula_anterior         VARCHAR(20),
    nombre_anterior         VARCHAR(255),
    razon_cambio            TEXT,
    fecha_actualizacion     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE elemento_normativo (
    id_elemento             SERIAL          PRIMARY KEY,
    id_reglamento           INT             NOT NULL REFERENCES reglamento(id_reglamento),
    id_elemento_padre       INT             REFERENCES elemento_normativo(id_elemento),
    id_nivel_reglamento     INT             NOT NULL REFERENCES catalogo_nivel_reglamento(id_nivel_reglamento),
    numer_etiqueta          VARCHAR(50),
    contenido_texto         TEXT,
    orden                   INT,
    fecha_inicio_vigencia   DATE,
    fecha_fin_vigencia      DATE,
    id_estado_vigencia      INT             REFERENCES catalogo_estado_vigencia(id_estado_vigencia)
);

CREATE TABLE sesiones (
    id_sesion           SERIAL          PRIMARY KEY,
    id_tipo_modalidad   INT             NOT NULL REFERENCES catalogo_tipo_modalidad(id_tipo_modalidad),
    id_tipo_sesion      INT             NOT NULL REFERENCES catalogo_tipo_sesion(id_tipo_sesion),
    numero_sesion       VARCHAR(50)     NOT NULL,
    fecha               DATE            NOT NULL,
    link_acta           VARCHAR(500),
    quorum_requerido    INT
);

CREATE TABLE acta (
    id_acta             SERIAL          PRIMARY KEY,
    id_sesion           INT             NOT NULL REFERENCES sesiones(id_sesion),
    fecha_aprobacion    DATE,
    url_documento       VARCHAR(500),
    observaciones       TEXT
);

CREATE TABLE propuesta (
    id_propuesta                SERIAL          PRIMARY KEY,
    id_reglamento_base          INT             REFERENCES reglamento(id_reglamento),
    id_etapa_propuesta          INT             REFERENCES catalogo_etapas_propuestas(id_etapa_propuesta),
    id_estado_propuesta         INT             REFERENCES catalogo_estado_propuestas(id_estado_propuesta),
    id_propuesta_padre          INT             REFERENCES propuesta(id_propuesta),
    titulo                      VARCHAR(500)    NOT NULL,
    texto_sustitutivo           TEXT,
    codigo_air                  VARCHAR(100),
    id_tipo_mayoria_requerida   INT             REFERENCES catalogo_tipo_mayoria_requerida(id_tipo_mayoria_requerida),
    id_leyenda                  INT             REFERENCES tipo_propuesta_leyenda(id_leyenda)
);
ALTER TABLE propuesta
  ADD COLUMN id_elemento_origen BIGINT REFERENCES elemento_normativo(id_elemento);

CREATE TABLE bitacora_propuesta (
    id_registro_bitacora    SERIAL          PRIMARY KEY,
    id_propuesta            INT             NOT NULL REFERENCES propuesta(id_propuesta),
    id_reglamento_base      INT             REFERENCES reglamento(id_reglamento),
    id_etapa_propuesta      INT             REFERENCES catalogo_etapas_propuestas(id_etapa_propuesta),
    id_estado_propuesta     INT             REFERENCES catalogo_estado_propuestas(id_estado_propuesta),
    titulo                  VARCHAR(500),
    codigo_air              VARCHAR(100),
    fecha_modificacion      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_modificacion    VARCHAR(100)
);

CREATE TABLE proponente_propuesta (
    id_proponente_propuesta SERIAL  PRIMARY KEY,
    id_propuesta            INT     NOT NULL REFERENCES propuesta(id_propuesta),
    id_asambleista          INT     NOT NULL REFERENCES asambleista(asambleista_id),
    fecha_registro          DATE    NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE asistencia_sesion_plenaria (
    id_asistencia        SERIAL  PRIMARY KEY,
    id_asambleista       INT     NOT NULL REFERENCES asambleista(asambleista_id),
    id_sesion            INT     NOT NULL REFERENCES sesiones(id_sesion),
    id_estado_asistencia INT     NOT NULL REFERENCES catalogo_asistencia_sesion_comision(id_estado_asistencia),
    CONSTRAINT uq_asistencia UNIQUE (id_asambleista, id_sesion)
);

CREATE TABLE punto_agenda (
    id_punto_agenda SERIAL          PRIMARY KEY,
    id_sesion       INT             NOT NULL REFERENCES sesiones(id_sesion),
    id_propuesta    INT             REFERENCES propuesta(id_propuesta),
    orden           INT             NOT NULL,
    descripcion     TEXT
);

CREATE TABLE resolucion (
    id_resolucion       SERIAL          PRIMARY KEY,
    id_agenda           INT             REFERENCES sesiones(id_sesion),
    id_punto_agenda     INT             REFERENCES punto_agenda(id_punto_agenda),
    numero_resolucion   VARCHAR(100)    NOT NULL,
    fecha_emision       DATE            NOT NULL
);

CREATE TABLE nombramiento (
    id_nombramiento     SERIAL      PRIMARY KEY,
    asambleista_id      INT         NOT NULL REFERENCES asambleista(asambleista_id),
    sector_id           INT         REFERENCES catalogo_sector(id_sector),
    resolucion_id       INT         REFERENCES resolucion(id_resolucion),
    fecha_inicio        DATE,
    fecha_fin           DATE,
    estado              VARCHAR(50),
    id_puesto           INT         REFERENCES catalogo_puestos(id_puesto),
    id_usuario_registro INT         REFERENCES sys_usuario(id_usuario),
    fecha_registro      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comision (
    id_comision         SERIAL          PRIMARY KEY,
    id_tipo_comision    INT             NOT NULL REFERENCES catalogo_tipo_comision(id_tipo_comision),
    nombre_comision     VARCHAR(255)    NOT NULL,
    objeto_acta         TEXT
);

CREATE TABLE propositos_comision (
    id_proposito_comision   SERIAL  PRIMARY KEY,
    id_comision             INT     NOT NULL REFERENCES comision(id_comision),
    id_propuesta            INT     NOT NULL REFERENCES propuesta(id_propuesta),
    texto                   TEXT,
    fecha_registro          DATE    NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE integrante_comision (
    id_integrante_comision      SERIAL          PRIMARY KEY,
    id_comision                 INT             NOT NULL REFERENCES comision(id_comision),
    id_asambleista              INT             NOT NULL REFERENCES asambleista(asambleista_id),
    id_rol_comision             INT             NOT NULL REFERENCES catalogo_rol_comision(id_rol_comision),
    fecha_ingreso_nombramiento  DATE,
    fecha_fin_nombramiento      DATE,
    estado                      VARCHAR(50)   
);

CREATE TABLE bitacora_integrante_comision (
    id_bitacora_integrante_comision SERIAL  PRIMARY KEY,
    id_integrante_comision          INT     NOT NULL REFERENCES integrante_comision(id_integrante_comision),
    id_comision                     INT     REFERENCES comision(id_comision),
    id_asambleista                  INT     REFERENCES asambleista(asambleista_id),
    id_rol_comision                 INT     REFERENCES catalogo_rol_comision(id_rol_comision),
    fecha_ingreso_nombramiento      DATE,
    fecha_fin_nombramiento          DATE,
    estado                          VARCHAR(50)
);

CREATE TABLE sesion_comision (
    id_sesion_comision  SERIAL          PRIMARY KEY,
    id_comision         INT             NOT NULL REFERENCES comision(id_comision),
    fecha_hora          TIMESTAMP       NOT NULL,
    numero_sesion       VARCHAR(50),
    descripcion         TEXT,
    link_acta           VARCHAR(500)
);

CREATE TABLE punto_agenda_sesion_comision (
    id_punto_agenda_sesion_comision SERIAL          PRIMARY KEY,
    id_sesion_comision              INT             NOT NULL REFERENCES sesion_comision(id_sesion_comision),
    id_proposito                    INT             NOT NULL REFERENCES propositos_comision(id_proposito_comision),
    id_tipo_tramite                 INT             REFERENCES catalogo_tipo_tramite(id_tipo_tramite),
    orden                           INT,
    titulo                          VARCHAR(500),
    descripcion                     TEXT
);

CREATE TABLE asistencia_sesion_comision (
    id_asistencia_comision  SERIAL  PRIMARY KEY,
    asambleista_id          INT     NOT NULL REFERENCES asambleista(asambleista_id),
    id_sesion_comision      INT     NOT NULL REFERENCES sesion_comision(id_sesion_comision),
    comision_id             INT     REFERENCES comision(id_comision),
    id_estado_asistencia    INT     NOT NULL REFERENCES catalogo_asistencia_sesion_comision(id_estado_asistencia),
    CONSTRAINT uq_asistencia_sesion_comision UNIQUE (id_sesion_comision, asambleista_id)
);

CREATE TABLE justificacion_legal (
    id_argumento        SERIAL      PRIMARY KEY,
    es_considerando_p   BOOLEAN     NOT NULL DEFAULT FALSE,
    contenido           TEXT        NOT NULL
);

CREATE TABLE informe_directorio (
    id_informe          SERIAL          PRIMARY KEY,
    id_comision         INT             NOT NULL REFERENCES comision(id_comision),
    id_propuesta        INT             REFERENCES propuesta(id_propuesta),
    id_sesion           INT             REFERENCES sesiones(id_sesion),
    titulo              VARCHAR(500),
    recomendacion       TEXT,
    fecha_presentacion  DATE
);

CREATE TABLE justificaciones_por_informe (
    id_informe      INT     NOT NULL REFERENCES informe_directorio(id_informe),
    id_argumento    INT     NOT NULL REFERENCES justificacion_legal(id_argumento),
    orden_aparicion INT,
    CONSTRAINT pk_justificaciones_por_informe PRIMARY KEY (id_informe, id_argumento)
);

CREATE TABLE reforma_aplicada (
    id_reforma              SERIAL          PRIMARY KEY,
    id_resolucion           INT             NOT NULL REFERENCES resolucion(id_resolucion),
    id_elemento_normativo   INT             NOT NULL REFERENCES elemento_normativo(id_elemento),
    id_tipo_texto_anterior  VARCHAR(255),
    texto_nuevo             TEXT,
    fecha_inicio_vigencia   DATE,
    id_tipo_reforma         INT             REFERENCES catalogo_tipo_reforma(id_tipo_reforma)
);

CREATE TABLE certificacion_emitida (
    id_certificacion      SERIAL          PRIMARY KEY,
    id_asambleista        INT             NOT NULL REFERENCES asambleista(asambleista_id),
    folio_unico           VARCHAR(50)     NOT NULL,
    hash_seguridad        VARCHAR(255)    NOT NULL,
    fecha_emision         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_secretaria INT             REFERENCES sys_usuario(id_usuario),
    estado                VARCHAR(20)     NOT NULL DEFAULT 'Activo',
    folio_sustituido_por  VARCHAR(50)     NULL,
    contenido             TEXT
);

CREATE TABLE anulacion_certificacion (
    id_anulacion        SERIAL  PRIMARY KEY,
    certificacion_id    INT     NOT NULL REFERENCES certificacion_emitida(id_certificacion),
    motivo              TEXT,
    fecha               DATE    NOT NULL DEFAULT CURRENT_DATE,
    folio_sustitucion   VARCHAR(50)     NULL
);

CREATE TABLE votacion (
    id_votacion         SERIAL          PRIMARY KEY,
    id_sesion           INT             NOT NULL REFERENCES sesiones(id_sesion),
    id_punto_agenda     INT             REFERENCES punto_agenda(id_punto_agenda),
    id_propuesta        INT             REFERENCES propuesta(id_propuesta),
    votos_favor         INT             NOT NULL DEFAULT 0,
    votos_contra        INT             NOT NULL DEFAULT 0,
    votos_abstencion    INT             NOT NULL DEFAULT 0,
    tipo_mayoria        VARCHAR(50)     NOT NULL,
    resultado           VARCHAR(50),
    quorum_valido       BOOLEAN         NOT NULL DEFAULT FALSE,
    id_usuario_registro INT             REFERENCES sys_usuario(id_usuario),
    fecha_registro      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_votacion_punto UNIQUE (id_punto_agenda)
);

-- ============================================================================
-- SECCIÓN 3: ÍNDICES
-- ============================================================================

CREATE UNIQUE INDEX uq_anulacion_por_cert
    ON anulacion_certificacion (certificacion_id);

CREATE UNIQUE INDEX uq_integrante_comision_activo
    ON integrante_comision (id_comision, id_asambleista)
    WHERE estado = 'ACTIVO';

-- ============================================================================
-- SECCIÓN 4: FUNCIONES
-- ============================================================================

-- ── Validar quórum legal ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_quorum_legal(p_id_sesion INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_presentes  INT;
    v_quorum_req INT;
BEGIN
    SELECT COUNT(*) INTO v_presentes
    FROM asistencia_sesion_plenaria
    WHERE id_sesion = p_id_sesion;

    SELECT quorum_requerido INTO v_quorum_req
    FROM sesiones
    WHERE id_sesion = p_id_sesion;

    RETURN v_presentes >= COALESCE(v_quorum_req, 29);
END;
$$ LANGUAGE plpgsql;

-- ── Calcular resultado de votación ───────────────────────────────────────
CREATE OR REPLACE FUNCTION calcular_resultado_votacion(
    p_favor  INT,
    p_contra INT,
    p_tipo   VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    v_total  FLOAT;
    v_umbral FLOAT;
BEGIN
    v_total  := (p_favor + p_contra)::FLOAT;
    v_umbral := CASE p_tipo
                    WHEN 'Calificada' THEN 0.66
                    ELSE 0.50
                END;

    RETURN CASE
        WHEN v_total = 0 THEN 'SIN_VOTOS'
        WHEN (p_favor::FLOAT / v_total) > v_umbral THEN 'APROBADA'
        ELSE 'RECHAZADA'
    END;
END;
$$ LANGUAGE plpgsql;

-- ── Porcentaje de asistencia plenaria por rango de fechas ────────────────
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
    SELECT COUNT(*) INTO v_convocadas
    FROM sesiones
    WHERE fecha BETWEEN p_fecha_inicio AND p_fecha_fin;

    SELECT COUNT(*) INTO v_asistidas
    FROM asistencia_sesion_plenaria asp
    JOIN sesiones s ON s.id_sesion = asp.id_sesion
    JOIN catalogo_asistencia_sesion_comision cas
      ON cas.id_estado_asistencia = asp.id_estado_asistencia
    WHERE asp.id_asambleista = p_asambleista_id
      AND cas.nombre         = 'Presente'
      AND s.fecha            BETWEEN p_fecha_inicio AND p_fecha_fin;

    IF v_convocadas = 0 THEN RETURN 0; END IF;
    RETURN ROUND(v_asistidas::DECIMAL / v_convocadas * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ── Porcentaje de asistencia a comisiones por rango de fechas ────────────
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
    SELECT COUNT(DISTINCT sc.id_sesion_comision) INTO v_convocadas
    FROM sesion_comision sc
    JOIN integrante_comision ic
      ON ic.id_comision    = sc.id_comision
      AND ic.id_asambleista = p_asambleista_id
    WHERE sc.fecha_hora::DATE BETWEEN p_fecha_inicio AND p_fecha_fin;

    SELECT COUNT(*) INTO v_asistidas
    FROM asistencia_sesion_comision asc2
    JOIN sesion_comision sc ON sc.id_sesion_comision = asc2.id_sesion_comision
    JOIN catalogo_asistencia_sesion_comision cas
      ON cas.id_estado_asistencia = asc2.id_estado_asistencia
    WHERE asc2.asambleista_id = p_asambleista_id
      AND cas.nombre          = 'Presente'
      AND sc.fecha_hora::DATE BETWEEN p_fecha_inicio AND p_fecha_fin;

    IF v_convocadas = 0 THEN RETURN 0; END IF;
    RETURN ROUND(v_asistidas::DECIMAL / v_convocadas * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- ── Validar traslape de nombramientos ─────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_validar_traslape_nombramiento()
RETURNS TRIGGER AS $$
DECLARE
    v_asambleista_id  INT;
    v_id_nombramiento INT;
    v_fecha_inicio    DATE;
    v_fecha_fin       DATE;
BEGIN
    v_asambleista_id  := (NEW).asambleista_id;
    v_id_nombramiento := (NEW).id_nombramiento;
    v_fecha_inicio    := (NEW).fecha_inicio;
    v_fecha_fin       := (NEW).fecha_fin;

    IF EXISTS (
        SELECT 1 FROM nombramiento
        WHERE asambleista_id = v_asambleista_id
          AND estado = 'VIGENTE'
          AND id_nombramiento IS DISTINCT FROM v_id_nombramiento
          AND (
            v_fecha_inicio <= COALESCE(fecha_fin, '9999-12-31'::DATE)
            AND COALESCE(v_fecha_fin, '9999-12-31'::DATE) >= fecha_inicio
          )
    ) THEN
        RAISE EXCEPTION 'TRASLAPE_NOMBRAMIENTO: El asambleísta ya tiene un nombramiento vigente en ese período';
    END IF;

    RETURN (NEW);
END;
$$ LANGUAGE plpgsql;

-- ── Versionamiento automático de elementos normativos ────────────────────
CREATE OR REPLACE FUNCTION fn_vigencia_normativa()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW).id_estado_vigencia = 1 THEN
        UPDATE elemento_normativo
        SET
            id_estado_vigencia = 2,
            fecha_fin_vigencia = CURRENT_DATE
        WHERE id_reglamento   = (NEW).id_reglamento
          AND numer_etiqueta  = (NEW).numer_etiqueta
          AND id_estado_vigencia = 1
          AND id_elemento     != (NEW).id_elemento
          AND (
                (id_elemento_padre IS NULL AND (NEW).id_elemento_padre IS NULL)
                OR id_elemento_padre = (NEW).id_elemento_padre
              );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Aprobar propuesta automáticamente al crear resolución ────────────────
CREATE OR REPLACE FUNCTION fn_aprobar_propuesta_en_resolucion()
RETURNS TRIGGER AS $$
DECLARE
    v_id_propuesta INT;
BEGIN
    SELECT id_propuesta INTO v_id_propuesta
    FROM punto_agenda
    WHERE id_punto_agenda = (NEW).id_punto_agenda;

    IF v_id_propuesta IS NOT NULL THEN
        UPDATE propuesta
        SET id_estado_propuesta = 5  -- APROBADA
        WHERE id_propuesta = v_id_propuesta;

        INSERT INTO bitacora_propuesta (
            id_propuesta, id_estado_propuesta, fecha_modificacion, usuario_modificacion
        ) VALUES (
            v_id_propuesta, 5, NOW(), 'SISTEMA_TRIGGER'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Auditoría general de tablas sensibles ────────────────────────────────
CREATE OR REPLACE FUNCTION fn_auditoria_total()
RETURNS TRIGGER AS $$
DECLARE
    v_registro_id INT;
    v_detalle     TEXT;
    v_row         JSONB;
BEGIN
    v_row := CASE WHEN TG_OP = 'DELETE'
                  THEN row_to_json(OLD)::JSONB
                  ELSE row_to_json(NEW)::JSONB
             END;

    BEGIN
        v_registro_id := CASE TG_TABLE_NAME
            WHEN 'asambleista'        THEN (v_row ->> 'asambleista_id')::INT
            WHEN 'elemento_normativo' THEN (v_row ->> 'id_elemento')::INT
            ELSE (v_row ->> ('id_' || TG_TABLE_NAME))::INT
        END;
    EXCEPTION WHEN OTHERS THEN
        v_registro_id := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
        v_detalle := 'Registro eliminado: ' || row_to_json(OLD)::TEXT;
    ELSE
        v_detalle := 'Datos: ' || row_to_json(NEW)::TEXT;
    END IF;

    INSERT INTO sys_log_auditoria (
        id_usuario, accion, tabla_afectada, detalle, registro_id, fecha_hora
    ) VALUES (
        NULL, TG_OP, TG_TABLE_NAME, v_detalle, v_registro_id, NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ── Auditoría específica de certificaciones ───────────────────────────────
CREATE OR REPLACE FUNCTION fn_auditoria_certificacion()
RETURNS TRIGGER AS $$
DECLARE
    v_registro_id INT8;
BEGIN
    v_registro_id := CASE
        WHEN TG_OP = 'DELETE' THEN (OLD).id_certificacion
        ELSE                       (NEW).id_certificacion
    END;

    INSERT INTO sys_log_auditoria (
        accion, tabla_afectada, detalle, registro_id
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        'Cambio en certificación, folio: ' || COALESCE(
            CASE WHEN TG_OP = 'DELETE' THEN (OLD).folio_unico
                 ELSE (NEW).folio_unico
            END, 'N/A'
        ),
        v_registro_id
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ── Protección de fe pública (certificaciones) ───────────────────────────
CREATE OR REPLACE FUNCTION fn_proteger_certificacion()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION
            'No se puede eliminar la certificación con folio %. Registre una anulación en su lugar.',
            (OLD).folio_unico;
    END IF;

    IF (OLD).folio_unico            <> (NEW).folio_unico            OR
       (OLD).hash_seguridad         <> (NEW).hash_seguridad         OR
       (OLD).id_asambleista         <> (NEW).id_asambleista         OR
       (OLD).id_usuario_secretaria  IS DISTINCT FROM (NEW).id_usuario_secretaria THEN
        RAISE EXCEPTION
            'La certificación con folio % es un documento de fe pública y sus campos de identidad no pueden modificarse.',
            (OLD).folio_unico;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generar_hash_verificacion(p_contenido TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Forzamos que el resultado de sha256 sea tratado estrictamente como BYTES
    RETURN encode(sha256(p_contenido::BYTES)::BYTES, 'hex');
END;
$$ LANGUAGE plpgsql;

-- ── Verificar permiso de usuario ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION verificar_permiso_usuario(
    p_id_usuario INT8,
    p_accion     TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tiene_permiso BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM sys_usuario        u
        JOIN sys_usuario_rol    ur ON ur.id_usuario = u.id_usuario
        JOIN sys_rol_permiso    rp ON rp.id_rol     = ur.id_rol
        JOIN sys_permiso        sp ON sp.id_permiso = rp.id_permiso
        WHERE u.id_usuario       = p_id_usuario
          AND u.activo           = TRUE
          AND sp.nombre_permiso  = p_accion
    ) INTO v_tiene_permiso;

    RETURN v_tiene_permiso;
END;
$$ LANGUAGE plpgsql;

-- ── Anular certificación (CORRECCIÓN: current_date() → current_date) ──────
CREATE OR REPLACE FUNCTION anular_certificacion(
    p_certificacion_id  INT8,
    p_motivo            TEXT,
    p_folio_sustitucion VARCHAR(50) DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_estado_actual VARCHAR(20);
BEGIN
    IF p_motivo IS NULL OR btrim(p_motivo) = '' THEN
        RAISE EXCEPTION 'El motivo de anulación es obligatorio.';
    END IF;

    SELECT estado INTO v_estado_actual
    FROM certificacion_emitida
    WHERE id_certificacion = p_certificacion_id;

    IF v_estado_actual IS NULL THEN
        RAISE EXCEPTION 'No se encontró la certificación con id %', p_certificacion_id;
    END IF;

    IF v_estado_actual = 'Anulado' THEN
        RAISE EXCEPTION 'La certificación ya se encuentra anulada.';
    END IF;

    INSERT INTO anulacion_certificacion
        (certificacion_id, motivo, fecha, folio_sustitucion)
    VALUES
        (p_certificacion_id, btrim(p_motivo), current_date, p_folio_sustitucion);

    UPDATE certificacion_emitida
    SET estado               = 'Anulado',
        folio_sustituido_por = p_folio_sustitucion
    WHERE id_certificacion = p_certificacion_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECCIÓN 5: TRIGGERS
-- ============================================================================

CREATE TRIGGER tg_vigencia_normativa
AFTER INSERT ON elemento_normativo
FOR EACH ROW EXECUTE FUNCTION fn_vigencia_normativa();

CREATE TRIGGER tg_aprobar_propuesta
AFTER INSERT ON resolucion
FOR EACH ROW EXECUTE FUNCTION fn_aprobar_propuesta_en_resolucion();

CREATE TRIGGER tg_traslape_sector
BEFORE INSERT ON nombramiento
FOR EACH ROW EXECUTE FUNCTION fn_validar_traslape_nombramiento();

CREATE TRIGGER tg_auditoria_asambleista
AFTER INSERT OR UPDATE OR DELETE ON asambleista
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_total();

CREATE TRIGGER tg_auditoria_nombramiento
AFTER INSERT OR UPDATE OR DELETE ON nombramiento
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_total();

CREATE TRIGGER tg_auditoria_resolucion
AFTER INSERT OR UPDATE OR DELETE ON resolucion
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_total();

CREATE TRIGGER tg_auditoria_elemento_normativo
AFTER INSERT OR UPDATE ON elemento_normativo
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_total();

CREATE TRIGGER tg_no_repudio_cert_upd
BEFORE UPDATE ON certificacion_emitida
FOR EACH ROW EXECUTE FUNCTION fn_proteger_certificacion();

CREATE TRIGGER tg_no_repudio_cert_del
BEFORE DELETE ON certificacion_emitida
FOR EACH ROW EXECUTE FUNCTION fn_proteger_certificacion();

CREATE TRIGGER tg_auditoria_certificacion
AFTER INSERT OR UPDATE OR DELETE ON certificacion_emitida
FOR EACH ROW EXECUTE FUNCTION fn_auditoria_certificacion();

-- ============================================================================
-- SECCIÓN 6: VISTAS
-- ============================================================================

CREATE VIEW v_participacion_activa AS
SELECT
    a.asambleista_id,
    a.nombre,
    COUNT(
        CASE WHEN cas.nombre = 'Presente' THEN asp.id_sesion END
    )                                                               AS sesiones_asistidas,
    (SELECT COUNT(*) FROM sesiones)                                 AS total_sesiones,
    ROUND(
        COUNT(
            CASE WHEN cas.nombre = 'Presente' THEN asp.id_sesion END
        )::DECIMAL /
        NULLIF((SELECT COUNT(*) FROM sesiones), 0) * 100
    , 2)                                                            AS indice_participacion_pct
FROM asambleista a
LEFT JOIN asistencia_sesion_plenaria asp
    ON asp.id_asambleista = a.asambleista_id
LEFT JOIN catalogo_asistencia_sesion_comision cas
    ON cas.id_estado_asistencia = asp.id_estado_asistencia
GROUP BY a.asambleista_id, a.nombre;

CREATE VIEW v_participacion_comision AS
SELECT
    c.id_comision,
    c.nombre_comision,
    tc.nombre                                           AS tipo_comision,
    a.asambleista_id,
    a.nombre                                            AS nombre_asambleista,
    a.cedula,
    rc.nombre_rol                                       AS rol_en_comision,
    ic.fecha_ingreso_nombramiento,
    ic.fecha_fin_nombramiento,
    ic.estado                                           AS estado_membresia,
    (SELECT COUNT(*)
     FROM sesion_comision sc
     WHERE sc.id_comision = c.id_comision)              AS total_sesiones_comision,
    (SELECT COUNT(*)
     FROM asistencia_sesion_comision asc2
     JOIN sesion_comision sc ON sc.id_sesion_comision = asc2.id_sesion_comision
     JOIN catalogo_asistencia_sesion_comision cas
       ON cas.id_estado_asistencia = asc2.id_estado_asistencia
     WHERE sc.id_comision      = c.id_comision
       AND asc2.asambleista_id = a.asambleista_id
       AND cas.nombre          = 'Presente')             AS sesiones_asistidas,
    (SELECT COUNT(*)
     FROM informe_directorio id2
     WHERE id2.id_comision = c.id_comision)              AS total_informes
FROM integrante_comision ic
JOIN comision               c  ON c.id_comision      = ic.id_comision
JOIN catalogo_tipo_comision tc ON tc.id_tipo_comision = c.id_tipo_comision
JOIN asambleista            a  ON a.asambleista_id    = ic.id_asambleista
JOIN catalogo_rol_comision  rc ON rc.id_rol_comision  = ic.id_rol_comision;

CREATE VIEW v_reporte_asistencia_global AS
SELECT
    a.asambleista_id,
    a.nombre,
    a.cedula,
    COUNT(DISTINCT s.id_sesion)                                     AS plenarias_totales,
    COUNT(
        CASE WHEN cas.nombre = 'Presente' THEN asp.id_sesion END
    )                                                               AS plenarias_asistidas,
    (SELECT COUNT(DISTINCT sc2.id_sesion_comision)
     FROM sesion_comision sc2
     JOIN integrante_comision ic2
       ON ic2.id_comision    = sc2.id_comision
       AND ic2.id_asambleista = a.asambleista_id)                   AS comision_convocadas,
    (SELECT COUNT(*)
     FROM asistencia_sesion_comision asc3
     JOIN catalogo_asistencia_sesion_comision cas3
       ON cas3.id_estado_asistencia = asc3.id_estado_asistencia
     WHERE asc3.asambleista_id = a.asambleista_id
       AND cas3.nombre         = 'Presente')                        AS comision_asistidas
FROM asambleista a
LEFT JOIN asistencia_sesion_plenaria asp
    ON asp.id_asambleista = a.asambleista_id
LEFT JOIN sesiones s
    ON s.id_sesion = asp.id_sesion
LEFT JOIN catalogo_asistencia_sesion_comision cas
    ON cas.id_estado_asistencia = asp.id_estado_asistencia
GROUP BY a.asambleista_id, a.nombre, a.cedula;

-- ============================================================================
-- SECCIÓN 7: SEEDS — Catálogos
-- ============================================================================

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

INSERT INTO catalogo_nivel_reglamento (id_nivel_reglamento, nombre) VALUES
    (1, 'Título'),
    (2, 'Capítulo'),
    (3, 'Artículo'),
    (4, 'Inciso/Párrafo')
ON CONFLICT (nombre) DO UPDATE SET id_nivel_reglamento = EXCLUDED.id_nivel_reglamento;

INSERT INTO catalogo_estado_vigencia (id_estado_vigencia, nombre) VALUES
    (1, 'Vigente'),
    (2, 'Histórico'),
    (3, 'Derogado')
ON CONFLICT (nombre) DO UPDATE SET id_estado_vigencia = EXCLUDED.id_estado_vigencia;

INSERT INTO catalogo_tipo_mayoria_requerida (nombre_rol) VALUES
    ('Simple'),
    ('Calificada');

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

-- ============================================================================
-- SECCIÓN 8: SEEDS — Roles, permisos y usuario admin
-- ============================================================================

INSERT INTO sys_rol (nombre_rol) VALUES
    ('ADMINISTRADOR'),
    ('SECRETARIA_AIR'),
    ('CONSULTA');

INSERT INTO sys_permiso (nombre_permiso, descripcion) VALUES
    ('EMITIR_CERTIFICACION',    'Puede generar y firmar certificaciones'),
    ('GESTIONAR_ASAMBLEISTAS',  'Puede crear y editar asambleístas'),
    ('GESTIONAR_SESIONES',      'Puede registrar sesiones y votaciones'),
    ('EDITAR_REGLAMENTOS',      'Puede cargar y modificar reglamentos'),
    ('VER_COMPILADOR',          'Puede consultar reglamentos vigentes'),
    ('GESTIONAR_USUARIOS',      'Puede crear y desactivar usuarios'),
    ('GESTIONAR_PROPUESTAS',    'Puede crear y gestionar propuestas normativas'),
    ('GESTIONAR_COMISIONES',    'Puede crear y gestionar comisiones de trabajo');

-- Admin tiene todos los permisos
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r, sys_permiso p
WHERE r.nombre_rol = 'ADMINISTRADOR';

-- Secretaría tiene todo menos gestionar usuarios
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r
JOIN sys_permiso p ON p.nombre_permiso IN (
    'EMITIR_CERTIFICACION', 'GESTIONAR_ASAMBLEISTAS', 'GESTIONAR_SESIONES',
    'EDITAR_REGLAMENTOS', 'VER_COMPILADOR', 'GESTIONAR_PROPUESTAS', 'GESTIONAR_COMISIONES'
)
WHERE r.nombre_rol = 'SECRETARIA_AIR';

-- Consulta solo puede ver
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r
JOIN sys_permiso p ON p.nombre_permiso = 'VER_COMPILADOR'
WHERE r.nombre_rol = 'CONSULTA';

-- Usuario admin inicial (contraseña: 'admin123' hasheada con BCrypt)
INSERT INTO sys_usuario (username, password_hash, email, activo)
VALUES ('admin', '$2b$12$HASH_GENERADO_CON_BCRYPT', 'admin@itcr.ac.cr', TRUE);

INSERT INTO sys_usuario_rol (id_usuario, id_rol)
SELECT u.id_usuario, r.id_rol
FROM sys_usuario u, sys_rol r
WHERE u.username = 'admin' AND r.nombre_rol = 'ADMINISTRADOR';

-- ============================================================================
-- SECCIÓN 9: SEEDS — Leyendas legales
-- ============================================================================

INSERT INTO tipo_propuesta_leyenda (codigo_origen, descripcion_origen, leyenda_legal) VALUES
(
    'CI',
    'Propuesta presentada por el Consejo Institucional',
    'La Secretaría de la AIR no dispone de registros de asistencia para las propuestas presentadas directamente por el Consejo Institucional, dado que su origen no involucra el proceso de procedencia con participación de asambleístas.'
),
(
    'DIEZ_PORCIENTO',
    'Propuesta por el 10% de la Asamblea (etapa de procedencia)',
    'La Secretaría de la AIR no dispone de registros de asistencia para la etapa de procedencia del 10% de asambleístas, ya que dicha etapa no genera convocatorias formales registradas en el sistema.'
),
(
    'COMISION',
    'Propuesta dictaminada por comisión',
    NULL
);

-- ============================================================================
-- SECCIÓN 10: SEEDS — Reglamento base y elementos normativos
-- ============================================================================

INSERT INTO reglamento (id_reglamento, nombre_normativa, sigla)
VALUES (1, 'Estatuto Orgánico del Instituto Tecnológico de Costa Rica', 'EOITCR')
ON CONFLICT (id_reglamento) DO UPDATE
    SET nombre_normativa = EXCLUDED.nombre_normativa,
        sigla            = EXCLUDED.sigla;

INSERT INTO elemento_normativo (
    id_elemento, id_reglamento, id_elemento_padre, id_nivel_reglamento,
    numer_etiqueta, contenido_texto, orden, fecha_inicio_vigencia, id_estado_vigencia
) VALUES
-- TITULO I
(1,  1, NULL, 1, 'TITULO I',    'FINES Y PRINCIPIOS', 1, '2002-05-01', 1),
(2,  1, 1,    3, 'ARTICULO 1',  'El Instituto Tecnológico de Costa Rica es una institución nacional autónoma de educación superior universitaria, dedicada a la docencia, la investigación y la extensión de la tecnología y ciencias conexas necesarias para el desarrollo de Costa Rica.', 2, '2002-05-01', 1),
(3,  1, 1,    3, 'ARTICULO 2',  'La acción integrada de la docencia, la investigación y la extensión del Instituto, está orientada al cumplimiento de los siguientes fines:', 3, '2002-05-01', 1),
(4,  1, 3,    4, 'a.',          'Formar profesionales en el campo tecnológico que aúnen al dominio de su disciplina una clara conciencia del contexto socioeconómico, cultural y ambiental en que la tecnología se genera, transfiere y aplica, lo cual les permita participar en forma crítica y creativa en las actividades productivas nacionales.', 4, '2002-05-01', 1),
(5,  1, 3,    4, 'b.',          'Generar, adaptar e incorporar, en forma sistemática y continua, la tecnología necesaria para utilizar y transformar provechosamente para el país sus recursos y fuerzas productivas.', 5, '2002-05-01', 1),
(6,  1, 3,    4, 'c.',          'Contribuir al mejoramiento de la calidad de vida del pueblo costarricense mediante la proyección de sus actividades a la atención y solución de los problemas prioritarios del país, a fin de edificar una sociedad más justa.', 6, '2002-05-01', 1),
(7,  1, 3,    4, 'd.',          'Estimular la superación de la comunidad costarricense mediante el patrocinio y el desarrollo de programas culturales.', 7, '2002-05-01', 1),
(8,  1, 1,    3, 'ARTICULO 3',  'Para el cumplimiento de sus fines, el Instituto Tecnológico de Costa Rica se rige por los siguientes principios:', 8, '2002-05-01', 1),
(9,  1, 8,    4, 'a.',          'La búsqueda de la excelencia en el desarrollo de todas sus actividades.', 9, '2002-05-01', 1),
(10, 1, 8,    4, 'b.',          'La vinculación permanente con la realidad costarricense como medio de orientar sus políticas y acciones a las necesidades del país.', 10, '2002-05-01', 1),
(11, 1, 8,    4, 'c.',          'El derecho exclusivo de la comunidad institucional, constituida por profesores, estudiantes y funcionarios administrativos, de darse su propio gobierno y de ejercerlo democráticamente...', 11, '2002-05-01', 1),
(12, 1, 8,    4, 'd.',          'La plena capacidad jurídica del Instituto para adquirir derechos y contraer obligaciones, de conformidad con la Constitución Política y las leyes de Costa Rica.', 12, '2002-05-01', 1),
(13, 1, 8,    4, 'e.',          'La libertad de cátedra, entendida como el derecho de los profesores de proponer los programas académicos y desarrollar los ya establecidos...', 13, '2002-05-01', 1),
(14, 1, 8,    4, 'f.',          'La libertad de expresión de las ideas filosóficas, científicas, políticas y religiosas de los miembros de la Comunidad del Instituto; dentro de un marco de respeto por las personas.', 14, '2002-05-01', 1),
(15, 1, 8,    4, 'g.',          'La igualdad de oportunidades para el ingreso y permanencia de los estudiantes en la Institución.', 15, '2002-05-01', 1),
(16, 1, 8,    4, 'h.',          'La evaluación permanente de los resultados de las labores de la Institución y de cada uno de sus integrantes.', 16, '2002-05-01', 1),
(17, 1, 8,    4, 'i.',          'La responsabilidad de los individuos y órganos del Instituto por las consecuencias de sus acciones y decisiones.', 17, '2002-05-01', 1),
-- TITULO II
(18, 1, NULL, 1, 'TITULO II',   'DOMICILIO', 18, '2002-05-01', 1),
(19, 1, 18,   3, 'ARTICULO 4',  'El Instituto Tecnológico de Costa Rica tiene su domicilio legal y su Sede Central en la Ciudad de Cartago. Además, podrá tener instalaciones y actividades en otros lugares del territorio nacional.', 19, '2002-05-01', 1),
-- TITULO III
(20, 1, NULL, 1, 'TITULO III',  'ESTRUCTURA ORGANIZATIVA', 20, '2002-05-01', 1),
(21, 1, 20,   2, 'CAPITULO I',  'LA ASAMBLEA INSTITUCIONAL', 21, '2002-05-01', 1),
(22, 1, 21,   3, 'ARTICULO 5',  'La máxima autoridad del Instituto Tecnológico de Costa Rica es la Asamblea Institucional, la cual funciona en dos instancias: la Asamblea Institucional Plebiscitaria y la Asamblea Institucional Representativa.', 22, '2002-05-01', 1),
(23, 1, 21,   3, 'ARTICULO 6',  'La Asamblea Institucional Plebiscitaria está integrada de la siguiente manera:', 23, '2002-05-01', 1),
(24, 1, 23,   4, 'a.',          'Los miembros del Consejo Institucional.', 24, '2002-05-01', 1),
(25, 1, 23,   4, 'b.',          'El Auditor.', 25, '1995-03-11', 1),
(26, 1, 23,   4, 'c.',          'Los Vicerrectores, Directores de Sedes Regionales y Centros Académicos.', 26, '2002-05-01', 1),
(27, 1, 23,   4, 'd.',          'Los miembros titulares del Tribunal Institucional Electoral', 27, '2002-05-01', 1),
(28, 1, 23,   4, 'e.',          'Los Directores de Departamento y los Directores de Centros de Investigación consolidados.', 28, '2002-05-01', 1),
(29, 1, 23,   4, 'f.',          'Todos los profesores del Instituto, nombrados por tiempo indefinido y con una jornada no menor a medio tiempo completo...', 29, '2000-05-03', 1),
(30, 1, 23,   4, 'g.',          'Todos los estudiantes matriculados en algún programa de diplomado, bachillerato, licenciatura, maestría o doctorado...', 30, '2002-05-01', 1),
(31, 1, 23,   4, 'h.',          'Cuando la población estudiantil inscrita en el padrón de la Asamblea Institucional Plebiscitaria represente menos del 25%...', 31, '1996-09-11', 1),
(32, 1, 23,   4, 'i.',          'Todos los funcionarios administrativos del Instituto, nombrados por tiempo indefinido y con una jornada no menor a medio tiempo completo...', 32, '2000-05-03', 1),
(33, 1, 21,   3, 'ARTICULO 7',  'La participación de los sectores estudiantil y administrativo se hará de la siguiente manera:', 33, '2002-05-01', 1),
(34, 1, 33,   4, 'a.',          'Los representantes estudiantiles a que hace referencia el inciso g del Artículo anterior, deberán ser estudiantes regulares del Instituto...', 34, '2002-05-01', 1),
(35, 1, 33,   4, 'b.',          'Para determinar el valor de los votos emitidos por los estudiantes y funcionarios administrativos en la Asamblea Institucional Plebiscitaria...', 35, '1996-09-11', 1),
(36, 1, 21,   3, 'ARTICULO 8',  'Corresponden a la Asamblea Institucional Plebiscitaria las siguientes funciones:', 36, '2002-05-01', 1),
(37, 1, 36,   4, 'a.',          'Elegir a los miembros del Consejo Institucional que le competen.', 37, '2002-05-01', 1),
(38, 1, 36,   4, 'b.',          'Elegir al Rector.', 38, '2002-05-01', 1),
(39, 1, 36,   4, 'c.',          'Revocar, a solicitud de la Asamblea Institucional Representativa o del Consejo Institucional, por causas graves...', 39, '1995-09-20', 1),
(40, 1, 36,   4, 'd.',          'Decidir, mediante votación, sobre la materia que le someta la Asamblea Institucional Representativa o el Consejo Institucional...', 40, '2002-05-01', 1),
(41, 1, 21,   3, 'ARTICULO 9',  'La Asamblea Institucional Representativa está integrada por:', 41, '2002-05-01', 1),
(42, 1, 41,   4, 'a.',          'Los miembros del Consejo Institucional.', 42, '2002-05-01', 1),
(43, 1, 41,   4, 'b.',          'El auditor.', 43, '2002-05-01', 1),
(44, 1, 41,   4, 'c.',          'Los Vicerrectores, directores de Sedes Regionales y Centros Académicos.', 44, '2002-05-01', 1),
(45, 1, 41,   4, 'd.',          'Los miembros titulares del Tribunal Institucional Electoral.', 45, '2002-05-01', 1),
(46, 1, 41,   4, 'e.',          'Los directores de departamento y directores de Centros de Investigación consolidados.', 46, '2002-05-01', 1),
(47, 1, 41,   4, 'f.',          'Un profesor por cada equivalente a cuatro tiempos completos de profesor.', 47, '2002-05-01', 1),
(48, 1, 41,   4, 'g.',          'Una representación estudiantil correspondiente al 25% del total de miembros de la Asamblea Institucional Representativa.', 48, '2002-05-01', 1),
(49, 1, 41,   4, 'h.',          'Una representación de funcionarios administrativos correspondiente al 15% del total de miembros de la Asamblea...', 49, '2002-05-01', 1),
(50, 1, 41,   4, 'i.',          'Cinco egresados del Instituto, quienes no serán considerados como parte del total de la Asamblea...', 50, '2002-05-01', 1),
(51, 1, 21,   3, 'ARTICULO 10', 'Los miembros de la Asamblea Institucional Representativa deberán ser miembros de la Asamblea Institucional Plebiscitaria, excepto los egresados...', 51, '2002-05-01', 1),
(52, 1, 51,   4, 'a.',          'Los representantes de los profesores serán electos por los profesores de cada departamento...', 52, '2002-05-01', 1),
(53, 1, 51,   4, 'b.',          'Los estudiantes serán electos por el mecanismo y para el período que defina el Estatuto de la Federación de Estudiantes...', 53, '2002-05-01', 1),
(54, 1, 51,   4, 'c.',          'Los funcionarios administrativos serán electos mediante el mecanismo que defina el sector...', 54, '1994-09-07', 1),
(55, 1, 51,   4, 'd.',          'Los egresados deberán ser de diferentes carreras y no ser funcionarios ni estudiantes regulares del Instituto...', 55, '2002-05-01', 1),
(56, 1, 21,   3, 'ARTICULO 11', 'Corresponden a la Asamblea Institucional Representativa las siguientes funciones:', 56, '2002-05-01', 1),
(57, 1, 56,   4, 'a.',          'Aprobar, modificar o eliminar, las Políticas Generales del Instituto...', 57, '2001-03-28', 1),
(58, 1, 56,   4, 'b.',          'Velar porque la orientación del Instituto responda a las necesidades del país en los campos de su competencia', 58, '2002-05-01', 1),
(59, 1, 56,   4, 'c.',          'Solicitar al Consejo Institucional las modificaciones al Estatuto Orgánico que considere necesarias...', 59, '2002-05-01', 1),
(60, 1, 56,   4, 'd.',          'Fijar los procedimientos para tramitar las reformas al Estatuto Orgánico referidas a los fines y principios del Instituto...', 60, '1997-09-17', 1),
(61, 1, 56,   4, 'e a l.',      'Ratificar, conocer en apelación, crear sedes, aprobar reglamentos, resolver recomendaciones del Congreso, actuar como Foro...', 61, '2002-05-01', 1),
(62, 1, 21,   3, 'ARTICULO 12', 'La Asamblea Institucional Representativa sesionará ordinariamente entre la quinta y la sétima semana de cada semestre lectivo...', 62, '1994-01-01', 1),
(63, 1, 21,   3, 'ARTICULO 13', 'La Asamblea Institucional Representativa, de su seno elegirá un directorio constituido por tres profesores, dos estudiantes y dos funcionarios...', 63, '1998-03-25', 1),
-- CAPITULO II
(64, 1, 20,   2, 'CAPITULO II', 'EL CONSEJO INSTITUCIONAL', 64, '2002-05-01', 1),
(65, 1, 64,   3, 'ARTICULO 14', 'El Consejo Institucional es el órgano directivo superior del Instituto Tecnológico de Costa Rica y está conformado de la siguiente manera:', 65, '2002-05-01', 1),
(66, 1, 65,   4, 'a.',          'El Rector, quien lo preside', 66, '2002-05-01', 1),
(67, 1, 65,   4, 'b.',          'Dos miembros de la comunidad nacional', 67, '1994-03-23', 1),
(68, 1, 65,   4, 'c.',          'Cuatro profesores del Instituto Tecnológico de Costa Rica', 68, '2002-05-01', 1),
(69, 1, 65,   4, 'd.',          'Un funcionario administrativo del Instituto Tecnológico de Costa Rica', 69, '2002-05-01', 1),
(70, 1, 65,   4, 'e.',          'Dos estudiantes del Instituto Tecnológico de Costa Rica', 70, '2002-05-01', 1),
(71, 1, 65,   4, 'f.',          'Un egresado del Instituto Tecnológico de Costa Rica.', 71, '2002-05-01', 1),
(72, 1, 64,   3, 'ARTICULO 15', 'Los miembros del Consejo Institucional deberán cumplir las siguientes condiciones: a. Ser costarricenses...', 72, '1998-09-30', 1);

-- ============================================================================
-- SECCIÓN 11: RESET DE SECUENCIAS (siempre al final de los inserts con IDs fijos)
-- ============================================================================

SELECT setval(
    pg_get_serial_sequence('catalogo_nivel_reglamento', 'id_nivel_reglamento'),
    (SELECT MAX(id_nivel_reglamento) FROM catalogo_nivel_reglamento)
);

SELECT setval(
    pg_get_serial_sequence('catalogo_estado_vigencia', 'id_estado_vigencia'),
    (SELECT MAX(id_estado_vigencia) FROM catalogo_estado_vigencia)
);

SELECT setval(
    pg_get_serial_sequence('reglamento', 'id_reglamento'),
    (SELECT MAX(id_reglamento) FROM reglamento)
);

SELECT setval(
    pg_get_serial_sequence('elemento_normativo', 'id_elemento'),
    (SELECT MAX(id_elemento) FROM elemento_normativo)
);

-- ============================================================================
-- SECCIÓN 12: SEED — Control de folios
-- (CORRECCIÓN: current_date() → current_date)
-- ============================================================================

INSERT INTO control_folio (anio, ultimo_numero, prefijo, fecha_actualizacion)
VALUES (EXTRACT(YEAR FROM current_date)::INT8, 0, 'DAIR', current_timestamp)
ON CONFLICT DO NOTHING;

-- ADMIN
DELETE FROM sys_usuario_rol
WHERE id_usuario = (
    SELECT id_usuario
    FROM sys_usuario
    WHERE username = 'admin_air'
);

INSERT INTO sys_usuario_rol (id_usuario, id_rol)
SELECT
    id_usuario,
    '1184545331516243969'
FROM sys_usuario
WHERE username = 'admin_air';


-- SECRETARIA
DELETE FROM sys_usuario_rol
WHERE id_usuario = (
    SELECT id_usuario
    FROM sys_usuario
    WHERE username = 'secretaria_air'
);

INSERT INTO sys_usuario_rol (id_usuario, id_rol)
SELECT
    id_usuario,
    '1184545331516309505'
FROM sys_usuario
WHERE username = 'secretaria_air';


-- CONSULTA (registrador_air)
DELETE FROM sys_usuario_rol
WHERE id_usuario = (
    SELECT id_usuario
    FROM sys_usuario
    WHERE username = 'registrador_air'
);

INSERT INTO sys_usuario_rol (id_usuario, id_rol)
SELECT
    id_usuario,
    '1184545331516342273'
FROM sys_usuario
WHERE username = 'registrador_air';