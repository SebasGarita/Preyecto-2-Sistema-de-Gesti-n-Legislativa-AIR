# DOCUMENTACIÓN GENERAL Y MANUAL DE USUARIO

**Sistema de Gestión Legislativa AIR — TEC**  
*Sprint 2 · Instituto Tecnológico de Costa Rica*

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Propósito del Sistema](#2-propósito-del-sistema)
3. [Módulos del Sistema](#3-módulos-del-sistema)
4. [Roles y Permisos](#4-roles-y-permisos)
5. [Glosario](#5-glosario)
6. [Manual de Usuario — Secretaría AIR](#6-manual-de-usuario--secretaría-air)
7. [Manual de Usuario — Directorio](#7-manual-de-usuario--directorio)
8. [Manual de Usuario — Asambleísta](#8-manual-de-usuario--asambleísta)
9. [Flujos Principales del Sistema](#9-flujos-principales-del-sistema)
10. [Preguntas Frecuentes](#10-preguntas-frecuentes)
11. [Video de defensa Sprint 2](#11-video-de-defensa---sprint-2)

---

## 1. Introducción

El **Sistema de Gestión Legislativa AIR** es una aplicación web institucional desarrollada para digitalizar y automatizar los procesos de la Asamblea Institucional Representativa del Instituto Tecnológico de Costa Rica.

Antes de este sistema, la memoria histórica del TEC dependía de archivos aislados y procesos manuales: folios escritos a mano, búsquedas en PDFs desconectados y cálculos de quórum propensos al error humano. Esto ponía en riesgo la fe pública de cada certificación emitida.

El sistema resuelve esto centralizando toda la información legislativa en una base de datos estructurada, automatizando los cálculos legales y garantizando que cada documento emitido sea veraz, inalterable y trazable.

---

## 2. Propósito del Sistema

| Usuario | Beneficio principal |
|---|---|
| **Secretaría AIR** | Eliminación del foliado manual y del riesgo de certificar artículos derogados. |
| **Directorio** | Visibilidad total sobre quórum y resultados de votaciones sin cálculos manuales. |
| **Asambleístas** | Acceso inmediato a historial de participación, asistencia y atestados para carrera profesional. |
| **Comunidad Universitaria** | Consulta del estado real de cualquier reglamento del TEC en cualquier punto de su historia. |

---

## 3. Módulos del Sistema

### Módulo 1 — Gestión de Actores (Padrón)

Administra el registro y la trayectoria de todos los asambleístas. Permite registrar datos personales, validar que el nombramiento esté activo al momento de emitir constancias y mantener un historial completo de los sectores y periodos donde ha servido cada persona.

### Módulo 2 — Gestión Normativa y Propuestas

Cubre el ciclo de vida completo de la normativa institucional: desde que una propuesta nace hasta que se convierte en reglamento vigente. Registra propuestas con sus estados (Procedencia, Aprobación), vincula autores y permite reconstruir las comisiones de trabajo.

### Módulo 3 — Registro de Sesiones y Memoria de Votación

Constituye el registro de auditoría legal de cada sesión plenaria. Permite crear sesiones (ordinarias y extraordinarias), registrar asistencia en tiempo real, validar el quórum y capturar el resultado de cada votación.

### Módulo 4 — Compilador de Reglamentos Vigentes

Es el visor de la "verdad actual" del TEC. Muestra la versión más reciente de cualquier reglamento con su estructura jerárquica completa (Título → Capítulo → Artículo → Inciso) y permite consultar el estado de la normativa en cualquier fecha histórica.

### Módulo 5 — Certificaciones y Consultas

Motor de salida que alivia la carga de la Secretaría. Genera automáticamente constancias oficiales que consolidan los datos del asambleísta, su porcentaje de asistencia acumulado y el listado de propuestas en las que participó activamente. Cada documento incluye folio único institucional y firma digital SHA-256.

---

## 4. Roles y Permisos

El sistema controla el acceso mediante roles. Cada usuario tiene asignado exactamente un rol que determina qué puede ver y hacer.

| Acción | Secretaría AIR | Directorio | Asambleísta |
|---|:---:|:---:|:---:|
| Registrar y editar asambleístas | ✅ | ❌ | ❌ |
| Consultar padrón completo | ✅ | ✅ | ❌ |
| Insertar y editar normativa | ✅ | ❌ | ❌ |
| Consultar reglamentos vigentes | ✅ | ✅ | ✅ |
| Crear y gestionar sesiones | ✅ | ✅ | ❌ |
| Registrar asistencia | ✅ | ✅ | ❌ |
| Ver asistencia propia | ✅ | ✅ | ✅ |
| Registrar votaciones | ✅ | ✅ | ❌ |
| Emitir certificaciones | ✅ | ❌ | ❌ |
| Verificar autenticidad de documentos | ✅ | ✅ | ✅ |
| Gestionar usuarios del sistema | ✅ | ❌ | ❌ |

> ⚠️ Un usuario sin rol asignado no puede acceder a ninguna sección del sistema. Si al iniciar sesión aparece un mensaje de acceso denegado, contactar a la Secretaría AIR para verificar el rol.

---

## 5. Glosario

**Asambleísta:** Miembro con derecho a voz y voto en la Asamblea Institucional Representativa del TEC. Representa a un sector específico durante un periodo determinado.

**Atestado / Constancia:** Documento oficial emitido por la Secretaría AIR que certifica la participación, asistencia o historial legislativo de un asambleísta. Tiene valor legal para procesos de carrera profesional.

**Código AIR:** Identificador único asignado a cada propuesta legislativa dentro del sistema (formato interno de la Asamblea).

**Compilador Normativo:** Herramienta del sistema que permite visualizar el texto vigente de cualquier reglamento del TEC en una fecha determinada, mostrando automáticamente las reformas aplicadas y ocultando los artículos derogados.

**Folio DAIR:** Número de identificación único e irrepetible asignado automáticamente a cada certificación emitida. Formato: `DAIR-000-AÑO`. Una vez asignado, no puede modificarse ni reutilizarse.

**Hash SHA-256:** Firma digital generada a partir del contenido del documento. Funciona como huella dactilar: cualquier alteración mínima al documento produce un hash completamente distinto, lo que permite detectar falsificaciones.

**Issue:** Unidad de trabajo registrada en el tablero del proyecto (GitHub Project). Cada funcionalidad del sistema corresponde a un issue numerado.

**Mayoría calificada:** Tipo de votación que requiere al menos el 66% de los votos a favor para aprobar una propuesta. Se aplica a reformas de alta jerarquía normativa.

**Mayoría simple:** Tipo de votación que requiere más del 50% de los votos a favor para aprobar una propuesta.

**Nombramiento:** Registro formal que vincula a un asambleísta con un sector y un periodo de vigencia específico. Determina si la persona tiene nombramiento activo al momento de emitir una certificación.

**No repudio:** Principio legal que garantiza que una certificación emitida no puede ser negada, alterada ni eliminada. Se implementa mediante el hash SHA-256 y el trigger de inalterabilidad en base de datos.

**Propuesta:** Iniciativa legislativa que sigue un ciclo de estados (Procedencia → Aprobación) y puede derivar en una reforma normativa.

**Quórum:** Número mínimo de asambleístas que deben estar presentes para que una sesión sea legalmente válida y sus votaciones tengan efecto.

**Reforma:** Modificación aprobada a un artículo o inciso de un reglamento vigente. El sistema versiona automáticamente el texto anterior como "Histórico" al aplicar una reforma.

**Sesión ordinaria:** Sesión convocada dentro del calendario regular de la Asamblea.

**Sesión extraordinaria:** Sesión convocada fuera del calendario regular para atender asuntos urgentes o específicos.

**Sector:** División organizativa del TEC que agrupa a ciertos miembros de la comunidad universitaria con derecho a representación en la AIR.

**Trigger:** Mecanismo automático de la base de datos que ejecuta una acción en respuesta a un evento (inserción, modificación o eliminación de datos). El usuario no lo ve directamente; actúa como guardián interno de las reglas legales.

---

## 6. Manual de Usuario — Secretaría AIR

La Secretaría AIR es el rol con mayor nivel de acceso. Desde aquí se administran los asambleístas, la normativa, las sesiones y las certificaciones.

---

### 6.1 Iniciar sesión

1. Abrir el navegador y acceder a `http://localhost:3000` (o la URL del servidor institucional).
2. Ingresar el nombre de usuario y contraseña asignados por el Administrador.
3. Hacer clic en **Iniciar sesión**.
4. Si las credenciales son correctas, el sistema redirige al panel principal de la Secretaría.

> Si aparece el mensaje *"Credenciales incorrectas"*, verificar mayúsculas y espacios. Si el problema persiste, solicitar restablecimiento de contraseña al Administrador.

---

### 6.2 Gestión de Asambleístas

#### Registrar un nuevo asambleísta

1. En el menú lateral, seleccionar **Asambleístas → Nuevo registro**.
2. Completar los campos obligatorios: nombre completo, cédula y correo institucional.
3. Hacer clic en **Guardar**.
4. El sistema valida que la cédula no esté duplicada. Si ya existe un registro con esa cédula, muestra un aviso y no permite duplicar.

#### Registrar un nombramiento

1. Buscar al asambleísta en el listado (**Asambleístas → Ver todos**).
2. Hacer clic en su nombre para abrir el perfil.
3. Seleccionar **Agregar nombramiento**.
4. Indicar: sector, puesto, fecha de inicio y fecha de fin.
5. Hacer clic en **Confirmar nombramiento**.

> ⚠️ El sistema impide que un asambleísta tenga dos sectores activos en el mismo periodo de tiempo. Si las fechas se superponen con un nombramiento existente, el registro será rechazado automáticamente.

#### Consultar historial de atestados

1. Abrir el perfil del asambleísta.
2. Seleccionar la pestaña **Historial de nombramientos**.
3. El sistema muestra todos los periodos y sectores, con fechas de inicio y fin.

---

### 6.3 Gestión de Normativa

#### Registrar un reglamento nuevo

1. Ir a **Normativa → Nuevo reglamento**.
2. Ingresar nombre completo del instrumento normativo y su sigla institucional.
3. Hacer clic en **Crear**.

#### Agregar un artículo o inciso

1. Abrir el reglamento desde **Normativa → Ver reglamentos**.
2. Navegar hasta el nivel deseado en el árbol jerárquico (Título → Capítulo → Artículo).
3. Hacer clic en **Agregar elemento** en el nivel correspondiente.
4. Seleccionar el nivel (Título, Capítulo, Artículo, Inciso), ingresar la etiqueta numérica y el texto.
5. Hacer clic en **Guardar**.

#### Aplicar una reforma a un artículo

1. Navegar hasta el artículo o inciso que será reformado.
2. Hacer clic en **Registrar reforma**.
3. Ingresar el texto nuevo y la resolución que respalda el cambio.
4. Confirmar.

> El sistema guarda automáticamente el texto anterior como versión **Histórico** y activa el texto nuevo como versión vigente. No se puede tener dos versiones vigentes del mismo artículo al mismo tiempo.

---

### 6.4 Gestión de Sesiones

#### Crear una sesión

1. Ir a **Sesiones → Nueva sesión**.
2. Seleccionar el tipo (Ordinaria / Extraordinaria) y la modalidad.
3. Ingresar la fecha, el número de sesión y el quórum requerido.
4. Hacer clic en **Crear sesión**.

#### Registrar asistencia

1. Abrir la sesión creada desde **Sesiones → Ver sesiones**.
2. Seleccionar **Registrar asistencia**.
3. Marcar a cada asambleísta como Presente, Ausente o Justificado.
4. Guardar. El sistema calcula automáticamente si se alcanza el quórum legal.

> Si el número de presentes es menor al quórum requerido, el sistema bloquea el inicio de votaciones y muestra un aviso.

#### Registrar el resultado de una votación

1. Desde la sesión activa, seleccionar la propuesta en agenda.
2. Hacer clic en **Registrar votación**.
3. Ingresar: votos a favor, votos en contra y el tipo de mayoría requerida (Simple o Calificada 66%).
4. El sistema calcula el resultado automáticamente y muestra **Aprobado** o **Rechazado**.
5. Confirmar para guardar.

---

### 6.5 Certificaciones

#### Emitir una certificación

1. Ir a **Certificaciones → Emitir nueva**.
2. Buscar al asambleísta por nombre o cédula.
3. Verificar que los datos mostrados (asistencia, propuestas, nombramientos) sean correctos.
4. Hacer clic en **Emitir certificación**.
5. El sistema genera automáticamente:
   - El **folio único** en formato `DAIR-000-AÑO`.
   - El **hash SHA-256** del documento.
   - El PDF oficial listo para descarga o impresión.

> ⚠️ Una vez emitida, la certificación **no puede modificarse ni eliminarse**. Si contiene un error, debe emitirse una anulación formal (ver siguiente punto).

#### Anular una certificación

1. Ir a **Certificaciones → Historial**.
2. Buscar la certificación por folio.
3. Seleccionar **Registrar anulación**.
4. Ingresar el motivo de la anulación.
5. Confirmar. La certificación queda marcada como anulada; el folio original se preserva en el historial.

#### Verificar la autenticidad de un documento

1. Ir a **Certificaciones → Verificar documento**.
2. Ingresar el folio o subir el archivo del documento.
3. El sistema compara el hash del archivo con el hash registrado en la base de datos.
4. Si coinciden: el documento es **auténtico y no ha sido alterado**.
5. Si no coinciden: el documento fue **modificado después de su emisión**.

---

## 7. Manual de Usuario — Directorio

El Directorio tiene acceso de consulta y operación sobre sesiones y votaciones, pero no puede emitir certificaciones ni modificar el padrón de asambleístas.

---

### 7.1 Iniciar sesión

El proceso es idéntico al descrito en la sección 6.1. Al ingresar, el panel principal mostrará únicamente las opciones disponibles para el rol Directorio.

---

### 7.2 Consultar el estado de una sesión

1. Ir a **Sesiones → Ver sesiones**.
2. Seleccionar la sesión de interés.
3. El sistema muestra: lista de asistentes, estado del quórum y las propuestas en agenda.

---

### 7.3 Consultar resultados de votaciones

1. Abrir la sesión desde **Sesiones → Ver sesiones**.
2. Seleccionar la propuesta de interés en el listado de agenda.
3. El sistema muestra el resultado (Aprobado / Rechazado), los votos a favor, en contra y el tipo de mayoría aplicado.

---

### 7.4 Consultar la normativa vigente

1. Ir a **Normativa → Compilador**.
2. Buscar el reglamento por nombre o sigla.
3. Navegar por el árbol jerárquico para leer artículos e incisos vigentes.
4. Para consultar el estado de la normativa en una fecha pasada, usar el selector de fecha histórica y hacer clic en **Consultar**.

---

### 7.5 Verificar la autenticidad de un documento

El proceso es idéntico al descrito en la sección 6.5 (Verificar la autenticidad de un documento). El Directorio tiene acceso a esta función para validar certificaciones presentadas por asambleístas.

---

## 8. Manual de Usuario — Asambleísta

El rol Asambleísta tiene acceso de solo lectura. Puede consultar su propia información y la normativa institucional, pero no puede modificar datos ni emitir documentos.

---

### 8.1 Iniciar sesión

El proceso es idéntico al descrito en la sección 6.1. Al ingresar, el panel mostrará únicamente las opciones disponibles para el rol Asambleísta.

---

### 8.2 Consultar mi historial de asistencia

1. En el menú, seleccionar **Mi perfil → Asistencia**.
2. El sistema muestra el listado de sesiones con el estado de asistencia registrado (Presente, Ausente, Justificado).
3. Se puede filtrar por rango de fechas.

---

### 8.3 Consultar mis nombramientos

1. Ir a **Mi perfil → Nombramientos**.
2. El sistema muestra el historial completo de sectores y periodos en los que ha servido, con fechas de inicio y fin.

---

### 8.4 Consultar la normativa vigente

1. Ir a **Normativa → Compilador**.
2. Buscar el reglamento por nombre o sigla.
3. Navegar por la estructura jerárquica (Título → Capítulo → Artículo → Inciso).

> El Compilador solo muestra artículos vigentes. Los artículos derogados no aparecen en la vista estándar.

---

### 8.5 Verificar la autenticidad de una certificación

Si recibió una certificación y desea verificar que no ha sido alterada:

1. Ir a **Certificaciones → Verificar documento**.
2. Ingresar el folio del documento (formato `DAIR-000-AÑO`) o subir el archivo PDF.
3. El sistema indica si el documento es auténtico.

---

## 9. Flujos Principales del Sistema

### Flujo A — Ciclo completo de una sesión plenaria

```
1. Secretaría crea la sesión (tipo, fecha, quórum requerido)
         ↓
2. Secretaría registra asistencia de cada asambleísta
         ↓
3. Sistema valida automáticamente si se alcanza el quórum
         ↓
   ┌─ SÍ hay quórum ──────────────────────────────────┐
   │  4. Secretaría / Directorio registra votaciones   │
   │  5. Sistema calcula resultado (Simple o 66%)      │
   │  6. Resultado queda registrado en el acta digital │
   └───────────────────────────────────────────────────┘
   ┌─ NO hay quórum ───────────────────────────────────┐
   │  Sistema bloquea votaciones y muestra aviso legal │
   └───────────────────────────────────────────────────┘
```

### Flujo B — Emisión de una certificación

```
1. Secretaría busca al asambleísta (nombre o cédula)
         ↓
2. Sistema consolida: asistencia + propuestas + nombramientos
         ↓
3. Secretaría revisa los datos y confirma la emisión
         ↓
4. Sistema genera folio DAIR automáticamente (atómico, sin duplicados)
         ↓
5. Sistema calcula hash SHA-256 del documento
         ↓
6. Certificación queda registrada como inalterable en la BD
         ↓
7. PDF oficial disponible para descarga o impresión
```

### Flujo C — Verificación de autenticidad de un documento

```
1. Usuario sube el documento o ingresa el folio
         ↓
2. Sistema recalcula el hash SHA-256 del archivo recibido
         ↓
3. Sistema compara con el hash almacenado en la BD
         ↓
   ┌─ Coinciden ──────────────────────────────────────┐
   │  Documento AUTÉNTICO — no ha sido alterado       │
   └───────────────────────────────────────────────────┘
   ┌─ No coinciden ───────────────────────────────────┐
   │  Documento ALTERADO — no tiene validez legal     │
   └───────────────────────────────────────────────────┘
```

### Flujo D — Aplicar una reforma normativa

```
1. Secretaría navega al artículo que será reformado
         ↓
2. Ingresa el texto nuevo y la resolución de respaldo
         ↓
3. Sistema marca el texto anterior como "Histórico" (fecha_fin = hoy)
         ↓
4. Sistema activa el texto nuevo como vigente (fecha_inicio = hoy)
         ↓
5. El Compilador Normativo refleja el cambio en tiempo real
```

---

## 10. Preguntas Frecuentes

**¿Qué pasa si registro asistencia y no se alcanza el quórum?**  
El sistema permite guardar el registro de asistencia, pero bloquea automáticamente cualquier intento de registrar votaciones. Se muestra un aviso indicando cuántos asambleístas faltan para completar el quórum legal.

**¿Puedo modificar una certificación ya emitida?**  
No. Por diseño legal, una certificación emitida es inalterable. La base de datos rechaza cualquier modificación o eliminación sobre registros de certificaciones. Si hay un error, debe emitirse una anulación formal y generar una nueva certificación corregida.

**¿Qué significa que el hash no coincide al verificar un documento?**  
Significa que el archivo fue modificado después de ser emitido por el sistema. El documento no tiene validez legal. Se recomienda solicitar una reimpresión oficial desde el sistema usando el folio original.

**¿Puedo consultar cómo estaba un reglamento hace cinco años?**  
Sí. El Compilador Normativo permite seleccionar una fecha histórica y consultar el estado exacto de la normativa en ese momento. El sistema muestra los artículos que estaban vigentes en esa fecha, aunque hayan sido reformados o derogados posteriormente.

**¿Qué pasa si un asambleísta tiene dos nombramientos que se solapan en fechas?**  
El sistema lo impide automáticamente. Al intentar guardar un nombramiento cuyas fechas se superponen con uno ya activo del mismo asambleísta, el registro es rechazado y se muestra un mensaje de error.

**¿Quién puede emitir certificaciones?**  
Únicamente el rol **Secretaría AIR**. El Directorio y los Asambleístas pueden verificar la autenticidad de documentos, pero no emitirlos.

**¿Cómo sé si mi sesión expiró?**  
Si al intentar realizar una acción el sistema redirige a la pantalla de inicio de sesión, la sesión ha expirado. Ingresar nuevamente con las credenciales.

**¿Se puede recuperar un asambleísta eliminado?**  
El sistema no elimina registros de asambleístas; en su lugar, los marca como inactivos. Toda la información histórica se conserva. Contactar al Administrador para reactivar un registro.

## 11. Video de defensa - Sprint 2

Enlace: https://estudianteccr-my.sharepoint.com/:v:/g/personal/s_garita_1_estudiantec_cr/IQDghC6cUeEER5TbngVOadWgAfx3XNaHu3u91wWUuu8QhEo?e=Vi8xsz
---

*Sprint 2 — Semanas 1-2 | Curso: Bases de Datos | Instituto Tecnológico de Costa Rica*
