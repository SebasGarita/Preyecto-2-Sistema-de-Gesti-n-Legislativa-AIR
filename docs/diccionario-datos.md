# DICCIONARIO DE DATOS

**Sistema de Gestión Legislativa AIR — TEC**  
*Motor: CockroachDB (compatible con PostgreSQL)*

---

## 1. Módulo de Seguridad y Roles

### `sys_usuario` — Usuarios del sistema

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_usuario | UUID | NO | PK, gen_random_uuid() | Identificador único del usuario |
| username | STRING(100) | NO | UNIQUE | Nombre de usuario para login |
| password_hash | STRING(255) | NO | - | Contraseña cifrada con BCrypt |
| email | STRING(150) | SÍ | - | Correo electrónico del usuario |
| activo | BOOL | NO | DEFAULT TRUE | Indica si el usuario está habilitado |

### `sys_rol` — Roles del sistema

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_rol | UUID | NO | PK | Identificador único del rol |
| nombre_rol | STRING(50) | NO | UNIQUE | Nombre del rol (Administrador, Secretaria, Asambleista) |

### `sys_permiso` — Permisos disponibles

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_permiso | UUID | NO | PK | Identificador único del permiso |
| nombre_permiso | STRING(100) | NO | UNIQUE | Nombre del permiso (ej: insertar_normativa) |
| descripcion | STRING | SÍ | - | Descripción del permiso |

### `sys_usuario_rol` — Relación usuario-rol (N:M)

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_usuario | UUID | NO | PK, FK → sys_usuario | Usuario asignado |
| id_rol | UUID | NO | PK, FK → sys_rol | Rol asignado al usuario |

### `sys_rol_permiso` — Relación rol-permiso (N:M)

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_rol | UUID | NO | PK, FK → sys_rol | Rol con el permiso |
| id_permiso | UUID | NO | PK, FK → sys_permiso | Permiso asignado al rol |

### `sys_log_auditoria` — Bitácora de auditoría

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_log | UUID | NO | PK | Identificador único del registro |
| id_usuario | UUID | SÍ | FK → sys_usuario | Usuario que realizó la acción |
| accion | STRING(50) | NO | - | Tipo de operación: INSERT, UPDATE, DELETE |
| tabla_afectada | STRING(100) | SÍ | - | Nombre de la tabla modificada |
| detalle | STRING | SÍ | - | Descripción del cambio realizado |
| registro_id | STRING | SÍ | - | ID del registro afectado |
| fecha_hora | TIMESTAMPTZ | NO | DEFAULT now() | Fecha y hora exacta del evento |

---

## 2. Catálogos Maestros

Todos los catálogos siguen la misma estructura: un identificador UUID como PK y un campo `nombre` con restricción `UNIQUE`. Se utiliza un patrón de catálogo maestro (LookUp Table) para simplificar el mantenimiento.

### Estructura común de catálogos

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_* | UUID | NO | PK, gen_random_uuid() | Identificador único del elemento del catálogo |
| nombre | STRING(150) | NO | UNIQUE | Valor descriptivo visible para el usuario |

### Catálogos implementados

- `catalogo_tipo_sesion`
- `catalogo_tipo_modalidad`
- `catalogo_puestos`
- `catalogo_sector`
- `catalogo_nivel_reglamento`
- `catalogo_etapas_propuestas`
- `catalogo_estado_propuestas`
- `catalogo_tipo_comision`
- `catalogo_rol_comision`
- `catalogo_tipo_mayoria_requerida`
- `catalogo_tipo_reforma`
- `catalogo_estado_vigencia`
- `catalogo_tipo_tramite`
- `catalogo_asistencia_sesion_comision`

---

## 3. Módulo de Identidad y Actores

### `asambleista` — Identidad permanente del asambleísta

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| asambleista_id | UUID | NO | PK | Identificador único del asambleísta |
| cedula | STRING(20) | NO | UNIQUE | Cédula de identidad — no puede repetirse |
| nombre | STRING(200) | NO | - | Nombre completo del asambleísta |
| correo_institucional | STRING(150) | SÍ | - | Correo del TEC asignado al asambleísta |

### `bitacora_asambleistas` — Cambios registrales (TSE)

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_bitacora_asambleista | UUID | NO | PK | Identificador del registro de cambio |
| asambleista_id | UUID | NO | FK → asambleista | Asambleísta que sufrió el cambio |
| cedula_anterior | STRING(20) | SÍ | - | Cédula antes del cambio registral |
| nombre_anterior | STRING(200) | SÍ | - | Nombre antes del cambio registral |
| razon_cambio | STRING | SÍ | - | Motivo del cambio (ej: cambio de género TSE) |
| fecha_actualizacion | TIMESTAMPTZ | NO | DEFAULT now() | Fecha en que se registró el cambio |

### `nombramiento` — Período de representación de un asambleísta

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_nombramiento | UUID | NO | PK | Identificador único del nombramiento |
| asambleista_id | UUID | NO | FK → asambleista, RESTRICT | Asambleísta nombrado |
| sector_id | UUID | NO | FK → catalogo_sector, RESTRICT | Sector que representa |
| resolucion_id | UUID | SÍ | FK → resolucion | Resolución que aprueba el nombramiento |
| fecha_inicio | DATE | NO | - | Inicio del período de representación |
| fecha_fin | DATE | SÍ | CHECK: fecha_fin > fecha_inicio | Fin del período (NULL si está activo) |
| estado | STRING(20) | NO | DEFAULT 'activo' | Estado del nombramiento: activo / finalizado |
| id_puesto | UUID | SÍ | FK → catalogo_puestos | Puesto que ocupa dentro de la AIR |
| id_usuario_registro | UUID | SÍ | FK → sys_usuario | Usuario que registró el nombramiento |
| fecha_registro | TIMESTAMPTZ | NO | DEFAULT now() | Fecha en que se creó el registro |

---

## 4. Módulo de Jerarquía Normativa

### `reglamento` — Entidad raíz de la normativa

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_reglamento | UUID | NO | PK | Identificador único del reglamento |
| nombre_normativa | STRING(200) | NO | - | Nombre oficial del reglamento |
| sigla | STRING(20) | SÍ | UNIQUE | Sigla del reglamento (ej: EO, PCAI) |

### `elemento_normativo` — Estructura recursiva Título > Capítulo > Artículo > Inciso

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_elemento | UUID | NO | PK | Identificador único del elemento |
| id_reglamento | UUID | NO | FK → reglamento, RESTRICT | Reglamento al que pertenece |
| id_elemento_padre | UUID | SÍ | FK → elemento_normativo (RECURSIVO) | Elemento padre en la jerarquía. NULL = Título raíz |
| id_nivel_reglamento | UUID | NO | FK → catalogo_nivel_reglamento | Nivel: Título, Capítulo, Artículo, Inciso |
| numer_etiqueta | STRING(50) | SÍ | - | Etiqueta legal (ej: '18', 'a)', 'i.') |
| contenido_texto | STRING | NO | - | Texto completo del artículo o inciso |
| orden | INT | NO | DEFAULT 1 | Posición dentro de su padre para ordenamiento legal |
| fecha_inicio_vigencia | DATE | NO | DEFAULT current_date() | Fecha desde la que rige esta versión |
| fecha_fin_vigencia | DATE | SÍ | - | NULL = vigente actualmente. El trigger asigna este valor al reformar |
| id_estado_vigencia | UUID | SÍ | FK → catalogo_estado_vigencia | Estado: Vigente, Histórico, Derogado |

> **Nota técnica:** Se implementa un Partial Unique Index sobre `(id_elemento_padre, numer_etiqueta, id_reglamento) WHERE fecha_fin_vigencia IS NULL` para garantizar que solo exista una versión vigente por elemento.

---

## 5. Módulo de Sesiones y Trámite Legislativo

### `sesiones` — Sesiones plenarias de la AIR

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_sesion | UUID | NO | PK | Identificador único de la sesión |
| id_tipo_modalidad | UUID | SÍ | FK → catalogo_tipo_modalidad | Modalidad: presencial, virtual, híbrida |
| id_tipo_sesion | UUID | SÍ | FK → catalogo_tipo_sesion | Tipo: ordinaria o extraordinaria |
| numero_sesion | STRING(20) | NO | - | Número oficial de la sesión (ej: SO-15-2025) |
| fecha | DATE | NO | - | Fecha de realización de la sesión |
| link_acta | STRING | SÍ | - | URL al documento del acta oficial |
| quorum_requerido | INT | NO | - | Número mínimo de asambleístas para sesión válida |

### `acta` — Documento oficial de la sesión

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_acta | UUID | NO | PK | Identificador único del acta |
| id_sesion | UUID | NO | FK → sesiones, RESTRICT | Sesión a la que corresponde |
| fecha_aprobacion | DATE | SÍ | - | Fecha en que fue aprobada formalmente |
| url_documento | STRING | SÍ | - | URL al PDF del acta aprobada |
| observaciones | STRING | SÍ | - | Notas adicionales de la Secretaría |

### `asistencia_sesion_plenaria` — Registro de asistencia

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_asistencia | UUID | NO | PK | Identificador del registro de asistencia |
| id_asambleista | UUID | NO | FK → asambleista, RESTRICT | Asambleísta registrado |
| id_sesion | UUID | NO | FK → sesiones, RESTRICT | Sesión a la que asistió |
| id_estado_asistencia | UUID | SÍ | FK → catalogo_asistencia | Estado: Presente, Ausente, Justificado |

> **Restricción:** `UNIQUE (id_asambleista, id_sesion)` — un asambleísta solo puede tener un registro por sesión.

### `propuesta` — Mociones y reformas presentadas

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_propuesta | UUID | NO | PK | Identificador único de la propuesta |
| id_reglamento_base | UUID | SÍ | FK → reglamento | Reglamento que se propone reformar |
| id_etapa_propuesta | UUID | SÍ | FK → catalogo_etapas_propuestas | Etapa: Procedencia, Aprobación |
| id_estado_propuesta | UUID | SÍ | FK → catalogo_estado_propuestas | Estado: Pendiente, Aprobada, Rechazada, etc. |
| id_propuesta_padre | UUID | SÍ | FK → propuesta (RECURSIVO) | Para propuestas conciliadas que derivan de otras |
| titulo | STRING(300) | NO | - | Título descriptivo de la propuesta |
| texto_sustitutivo | STRING | SÍ | - | Nuevo texto propuesto para el artículo |
| codigo_air | STRING(30) | SÍ | - | Código oficial (ej: AIR-99-2021) |
| id_tipo_mayoria_requerida | UUID | SÍ | FK → catalogo_tipo_mayoria_requerida | Simple (50%+1) o Calificada (66%) |

### `punto_agenda` — Puntos del orden del día

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_punto_agenda | UUID | NO | PK | Identificador del punto en la agenda |
| id_sesion | UUID | NO | FK → sesiones | Sesión donde se discute |
| id_propuesta | UUID | NO | FK → propuesta | Propuesta agendada |
| orden | INT | NO | - | Posición en el orden del día |
| descripcion | STRING | SÍ | - | Descripción adicional del punto |

### `resolucion` — Resolución oficial de un acuerdo

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_resolucion | UUID | NO | PK | Identificador único de la resolución |
| id_agenda | UUID | SÍ | FK → punto_agenda | Punto de agenda que generó la resolución |
| id_punto_agenda | UUID | SÍ | FK → punto_agenda | Referencia directa al punto |
| numero_resolucion | STRING(30) | NO | - | Número oficial (ej: AIR-RES-005-2025) |
| fecha_emision | DATE | NO | - | Fecha en que se emitió la resolución |

---

## 6. Módulo de Comisiones

### `comision` — Grupos de trabajo legislativo

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_comision | UUID | NO | PK | Identificador único de la comisión |
| id_tipo_comision | UUID | SÍ | FK → catalogo_tipo_comision | Tipo de comisión (permanente, especial, etc.) |
| nombre_comision | STRING(200) | NO | - | Nombre oficial de la comisión |

### `integrante_comision` — Miembros de una comisión

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_integrante_comision | UUID | NO | PK | Identificador del integrante |
| id_comision | UUID | NO | FK → comision, RESTRICT | Comisión a la que pertenece |
| id_asambleista | UUID | NO | FK → asambleista, RESTRICT | Asambleísta miembro |
| id_rol_comision | UUID | SÍ | FK → catalogo_rol_comision | Rol en la comisión (presidente, relator, etc.) |
| fecha_ingreso_nombramiento | DATE | NO | - | Fecha de ingreso a la comisión |
| fecha_fin_nombramiento | DATE | SÍ | - | Fecha de salida (NULL si sigue activo) |
| estado | STRING(20) | NO | - | Estado: activo o inactivo |

---

## 7. Módulo de Certificaciones y Fe Pública

### `control_folio` — Control atómico del consecutivo DAIR

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_control | UUID | NO | PK | Identificador del registro de control |
| anio | INT | NO | UNIQUE por año | Año fiscal del foliado (ej: 2025) |
| ultimo_numero | INT | NO | DEFAULT 0 | Último número asignado. El trigger lo incrementa con LOCK |
| fecha_actualizacion | TIMESTAMPTZ | NO | DEFAULT now() | Última vez que se generó un folio |

> **Propósito crítico:** Esta tabla es el mecanismo de atomicidad del foliado. El trigger `tg_folio_secuencial` hace LOCK sobre la fila del año actual, incrementa `ultimo_numero` y genera el folio `DAIR-XXX-AAAA` antes de insertar la certificación. Esto garantiza que no existan duplicados aunque dos secretarias generen documentos simultáneamente.

### `certificacion_emitida` — Certificaciones oficiales generadas

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_certificacion | UUID | NO | PK | Identificador único de la certificación |
| id_asambleista | UUID | NO | FK → asambleista, RESTRICT | Asambleísta certificado |
| folio_unico | STRING(30) | NO | UNIQUE. Asignado por trigger | Folio oficial (ej: DAIR-009-2025). Inmutable |
| hash_seguridad | STRING(64) | NO | - | Hash SHA-256 del contenido. Garantiza integridad |
| fecha_emision | TIMESTAMPTZ | NO | DEFAULT now() | Fecha y hora exacta de emisión |
| usuario_secretaria | UUID | SÍ | FK → sys_usuario | Secretaria que autorizó la certificación |

> **Nota:** El trigger `tg_no_repudio_cert` bloquea cualquier `UPDATE` o `DELETE` sobre esta tabla. Una certificación emitida es inmutable por ley.

### `anulacion_certificacion` — Registro de anulaciones

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_anulacion | UUID | NO | PK | Identificador de la anulación |
| certificacion_id | UUID | NO | FK → certificacion_emitida | Certificación anulada (el folio no se reutiliza) |
| motivo | STRING | NO | - | Justificación obligatoria de la anulación |
| fecha | TIMESTAMPTZ | NO | DEFAULT now() | Fecha en que se realizó la anulación |

### `reforma_aplicada` — Historial de reformas a la normativa

| Campo | Tipo | Null | Restricción | Propósito |
|---|---|---|---|---|
| id_reforma | UUID | NO | PK | Identificador único de la reforma |
| id_resolucion | UUID | NO | FK → resolucion | Resolución que aprueba la reforma |
| id_elemento_normativo | UUID | NO | FK → elemento_normativo | Elemento reformado |
| texto_anterior | STRING | SÍ | - | Texto antes de la reforma (para trazabilidad) |
| texto_nuevo | STRING | NO | - | Nuevo texto aprobado |
| fecha_inicio_vigencia | DATE | NO | - | Fecha desde la que rige la reforma |
| id_tipo_reforma | UUID | SÍ | FK → catalogo_tipo_reforma | Tipo: modificación, derogación, adición |

---

## 8. Triggers del Sistema

| Trigger | Tabla | Propósito |
|---|---|---|
| `tg_vigencia_normativa` | elemento_normativo | BEFORE INSERT: al insertar una reforma, marca la versión anterior como Histórica y asigna `fecha_fin_vigencia` |
| `tg_no_repudio_cert` | certificacion_emitida | BEFORE UPDATE/DELETE: bloquea cualquier modificación a una certificación ya emitida |
| `tg_auditoria_total` | asambleista, nombramiento, resolucion | AFTER INSERT/UPDATE/DELETE: registra automáticamente en `sys_log_auditoria` el usuario, fecha y cambio realizado |
| `tg_validar_quorum` | asistencia_sesion_plenaria | BEFORE INSERT: verifica que el número de presentes alcanza el `quorum_requerido` de la sesión |
| `tg_traslape_sector` | nombramiento | BEFORE INSERT: impide que un asambleísta tenga dos nombramientos activos en el mismo sector y período |
| `tg_folio_secuencial` | certificacion_emitida | BEFORE INSERT: genera el folio `DAIR-XXX-AAAA` de forma atómica usando LOCK sobre `control_folio` |
