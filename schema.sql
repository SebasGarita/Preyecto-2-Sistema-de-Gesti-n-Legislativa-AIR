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


CREATE TABLE asambleista (
    asambleista_id          SERIAL          PRIMARY KEY,
    cedula                  VARCHAR(20)     NOT NULL,
    nombre                  VARCHAR(255)    NOT NULL,
    correo_institucional    VARCHAR(255)
);

CREATE TABLE bitacora_asambleistas (
    id_bitacora_asambleista SERIAL          PRIMARY KEY,
    asambleista_id          INT             NOT NULL REFERENCES asambleista(asambleista_id),
    cedula_anterior         VARCHAR(20),
    nombre_anterior         VARCHAR(255),
    razon_cambio            TEXT,
    fecha_actualizacion     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reglamento (
    id_reglamento   SERIAL          PRIMARY KEY,
    nombre_normativa VARCHAR(255)   NOT NULL,
    sigla           VARCHAR(50)     NOT NULL UNIQUE
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

CREATE TABLE asistencia_sesion_plenaria (
    id_asistencia       SERIAL  PRIMARY KEY,
    id_asambleista      INT     NOT NULL REFERENCES asambleista(asambleista_id),
    id_sesion           INT     NOT NULL REFERENCES sesiones(id_sesion),
    id_estado_asistencia INT    NOT NULL REFERENCES catalogo_asistencia_sesion_comision(id_estado_asistencia)
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
    id_tipo_mayoria_requerida   INT             REFERENCES catalogo_tipo_mayoria_requerida(id_tipo_mayoria_requerida)
);

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
    id_nombramiento     SERIAL  PRIMARY KEY,
    asambleista_id      INT     NOT NULL REFERENCES asambleista(asambleista_id),
    sector_id           INT     REFERENCES catalogo_sector(id_sector),
    resolucion_id       INT     REFERENCES resolucion(id_resolucion),
    fecha_inicio        DATE,
    fecha_fin           DATE,
    estado              VARCHAR(50),
    id_puesto           INT     REFERENCES catalogo_puestos(id_puesto),
    id_usuario_registro INT     REFERENCES sys_usuario(id_usuario),
    fecha_registro      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE comision (
    id_comision         SERIAL          PRIMARY KEY,
    id_tipo_comision    INT             NOT NULL REFERENCES catalogo_tipo_comision(id_tipo_comision),
    nombre_comision     VARCHAR(255)    NOT NULL
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
    id_sesion_comision  SERIAL      PRIMARY KEY,
    id_comision         INT         NOT NULL REFERENCES comision(id_comision),
    fecha_hora          TIMESTAMP   NOT NULL
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
    id_estado_asistencia    INT     NOT NULL REFERENCES catalogo_asistencia_sesion_comision(id_estado_asistencia)
);



CREATE TABLE justificacion_legal (
    id_argumento        SERIAL      PRIMARY KEY,
    es_considerando_p   BOOLEAN     NOT NULL DEFAULT FALSE,
    contenido           TEXT        NOT NULL
);

CREATE TABLE informe_directorio (
    id_informe          SERIAL  PRIMARY KEY,
    id_comision         INT     NOT NULL REFERENCES comision(id_comision),
    id_propuesta        INT     REFERENCES propuesta(id_propuesta),
    id_sesion           INT     REFERENCES sesiones(id_sesion),
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


CREATE TABLE control_folio (
    id_control          SERIAL  PRIMARY KEY,
    anio                INT     NOT NULL,
    ultimo_numero       INT     NOT NULL DEFAULT 0,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificacion_emitida (
    id_certificacion    SERIAL          PRIMARY KEY,
    id_asambleista      INT             NOT NULL REFERENCES asambleista(asambleista_id),
    folio_unico         VARCHAR(50)     NOT NULL,
    hash_seguridad      VARCHAR(255)    NOT NULL,
    fecha_emision       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_secretaria  VARCHAR(100)    NOT NULL
);

CREATE TABLE anulacion_certificacion (
    id_anulacion        SERIAL  PRIMARY KEY,
    certificacion_id    INT     NOT NULL REFERENCES certificacion_emitida(id_certificacion),
    motivo              TEXT,
    fecha               DATE    NOT NULL DEFAULT CURRENT_DATE
);

