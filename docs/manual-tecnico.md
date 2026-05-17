# MANUAL TÉCNICO

**Sistema de Gestión Legislativa AIR — TEC**  
*Sprint 2 · Motor: CockroachDB · Framework: Node.js + Express*

---

## 1. Descripción del Sistema

El Sistema de Gestión Legislativa AIR es una aplicación web desarrollada para digitalizar y automatizar los procesos de la Asamblea Institucional Representativa del Instituto Tecnológico de Costa Rica. Resuelve el problema de fragmentación de información y certificación manual que actualmente depende de archivos aislados.

El sistema permite gestionar asambleístas y nombramientos, la jerarquía normativa del TEC (Estatuto Orgánico y reglamentos), sesiones plenarias con control de quórum, votaciones con cálculo automático de mayorías, y la emisión de certificaciones oficiales con folio DAIR y hash de seguridad SHA-256.

---

## 2. Arquitectura del Sistema

### 2.1 Patrón MVC

El sistema implementa el patrón Modelo-Vista-Controlador con separación estricta de responsabilidades:

| Capa | Carpeta | Responsabilidad |
|---|---|---|
| **Modelo** | `/src/models/` | Consultas SQL, lógica de datos, integridad. Nunca contiene lógica de negocio ni HTML. |
| **Vista** | `/src/views/` | Interfaces HTML funcionales. Nunca hace cálculos ni consultas directas a la BD. |
| **Controlador** | `/src/controllers/` | Lógica legal del sistema: cálculo de quórum, mayorías, validaciones, llamadas al modelo. |
| **Rutas** | `/src/routes/` | Definición de endpoints HTTP y asignación a controladores. Ver sección 2.3. |
| **Servicios** | `/src/services/` | Utilidades transversales: generación de hash SHA-256, conversión a PDF. |
| **Configuración** | `/src/config/` | Conexión a la BD (`db.js`) y configuración de seguridad/JWT (`security.js`). |

### 2.2 Stack Tecnológico

| Componente | Tecnología | Versión / Justificación |
|---|---|---|
| Runtime | **Node.js** | v24 LTS — entorno de ejecución JavaScript del servidor |
| Framework web | **Express.js** | v4 — manejo de rutas HTTP y middleware |
| Base de datos | **CockroachDB** | v25.4 — compatible con PostgreSQL, distribuido en la nube |
| Herramienta BD | **DBeaver** | v24 — cliente SQL para administración y pruebas |
| Conector BD | **pg (node-postgres)** | v8 — driver oficial PostgreSQL para Node.js |
| Seguridad hash | **crypto (Node built-in)** | SHA-256 — módulo nativo de Node, sin dependencias externas |
| Variables entorno | **dotenv** | v16 — gestión segura de credenciales fuera del código |
| Control versiones | **Git + GitHub** | Flujo `develop` → `feature/issue-N` → Pull Request |

### 2.3 Capa de Rutas (`/src/routes/`)

La capa de rutas es un componente central de la arquitectura que el patrón MVC no documenta directamente. Cada archivo define los endpoints de un módulo y los asocia al controlador correspondiente:

| Archivo | Prefijo base | Módulo |
|---|---|---|
| `auth.routes.js` | `/api/auth` | Autenticación y sesión de usuario |
| `asambleistas.routes.js` | `/api/asambleistas` | Gestión de asambleístas y nombramientos |
| `normativa.routes.js` | `/api/normativa` | Jerarquía normativa del TEC |
| `propuestas.routes.js` | `/api/propuestas` | Propuestas legislativas |
| `sesiones.routes.js` | `/api/sesiones` | Sesiones plenarias, quórum y votaciones |

---

## 3. Configuración e Instalación

### 3.1 Requisitos previos

- Node.js v20 LTS o superior
- Git v2.x
- DBeaver v24
- Cuenta en CockroachDB Cloud
- Acceso al repositorio en GitHub

### 3.2 Pasos de instalación

**1.** Clonar el repositorio:
```bash
git clone https://github.com/SebasGarita/Preyecto-2-Sistema-de-Gesti-n-Legislativa-AIR.git
```

**2.** Entrar a la carpeta del proyecto:
```bash
cd Preyecto-2-Sistema-de-Gesti-n-Legislativa-AIR
```

**3.** Instalar dependencias:
```bash
npm install
```

**4.** Crear el archivo `.env` en la raíz del proyecto con las credenciales de CockroachDB:
```
DATABASE_URL=postgresql://usuario:contraseña@cluster.cockroachlabs.cloud:26257/sistema_de_Gestion_Legislativa_AIR?sslmode=verify-full
```

**5.** Ejecutar el script de base de datos en DBeaver:  
Abrir `proyecto-air.sql` → ejecutar con `Ctrl+Shift+Enter` en esquema limpio.

**6.** Iniciar el servidor:
```bash
node src/index.js
```

> ⚠️ **Corrección:** el punto de entrada real es `src/index.js`, no `index.js` en la raíz. Ver sección 7.2 sobre `old-index.js`.

**7.** Verificar en el navegador:  
`http://localhost:3000` → debe mostrar: *Servidor AIR funcionando correctamente*

### 3.3 Scripts de npm disponibles

| Script | Comando | Descripción |
|---|---|---|
| start | `npm start` | Inicia el servidor en producción (`node src/index.js`) |
| test | `npm test` | Ejecuta las pruebas unitarias en `/test/` |

---

## 4. Endpoints de la API

### 4.1 Autenticación

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Iniciar sesión y obtener token de sesión |
| `POST` | `/api/auth/logout` | Cerrar sesión activa |

### 4.2 Asambleístas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/asambleistas` | Obtener listado completo de asambleístas activos |
| `POST` | `/api/asambleistas` | Registrar nuevo asambleísta o nombramiento |
| `PUT` | `/api/asambleistas/:id` | Actualizar datos de un asambleísta |
| `DELETE` | `/api/asambleistas/:id` | Dar de baja un asambleísta |

### 4.3 Normativa

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/normativa` | Obtener jerarquía normativa vigente (Estatuto + Reglamentos) |
| `POST` | `/api/normativa` | Insertar nuevo instrumento normativo |
| `PUT` | `/api/normativa/:id` | Actualizar o marcar vigencia de un instrumento |

### 4.4 Propuestas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/propuestas` | Listar todas las propuestas legislativas |
| `POST` | `/api/propuestas` | Crear nueva propuesta para agenda de sesión |
| `GET` | `/api/propuestas/:id` | Detalle de una propuesta específica |

### 4.5 Sesiones y Votaciones (Issue #10)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/sesiones` | Obtener todas las sesiones registradas |
| `GET` | `/api/quorum/:idSesion` | Verificar si hay quórum legal en una sesión |
| `POST` | `/api/votacion` | Registrar resultado de una votación con lógica de mayoría |
| `POST` | `/api/asistencia` | Registrar asistencia masiva de asambleístas a una sesión |
| `GET` | `/api/participacion` | Obtener índice de participación activa de todos los asambleístas |

### 4.6 Certificaciones (Issues #9 y #11)

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/certificaciones/emitir` | Emitir certificación oficial con folio DAIR y hash SHA-256 |
| `GET` | `/api/certificaciones/:folio` | Obtener detalle de certificación por folio (reimpresión) |
| `GET` | `/api/certificaciones` | Historial de todas las certificaciones emitidas |
| `POST` | `/api/certificaciones/verificar` | Verificar autenticidad de un documento por su hash |

---

## 5. Flujo de Trabajo Git

El proyecto usa el siguiente flujo de ramas:

- **`main`** → rama de producción final (solo al cierre del sprint 3)
- **`develop`** → rama de integración del sprint 2. Todo el código aprobado se une aquí.
- **`feature/issue-N`** → rama por cada issue. Se crea, desarrolla y se une a `develop` vía Pull Request.

> 📄 El repositorio incluye el archivo `REGLAS_GIT.md` con las convenciones detalladas del flujo. Consultarlo antes de crear ramas o pull requests.

### 5.1 Notación de commits

| Prefijo | Uso | Ejemplo |
|---|---|---|
| `feat(modulo):` | Nueva funcionalidad | `feat(certificado): implementar foliado DAIR closes #9` |
| `fix(modulo):` | Corrección de error | `fix(votacion): corregir calculo de mayoria calificada` |
| `db(modulo):` | Cambios en SQL o BD | `db(normativa): agregar trigger de vigencia` |
| `docs:` | Cambios en documentación | `docs: actualizar diccionario de datos` |

---

## 6. Seguridad

### 6.1 Autenticación y Roles (RBAC)

El sistema implementa control de acceso basado en roles (Role-Based Access Control). Los tres roles definidos son:

- **Administrador:** acceso total al sistema, gestión de usuarios.
- **Secretaria:** puede insertar y editar normativa, registrar asambleístas, emitir certificaciones.
- **Asambleísta:** solo lectura sobre normativa y sus propios datos de asistencia.

La autenticación se maneja mediante sesiones en el servidor. El middleware `requiereRol()` protege cada ruta verificando el rol del usuario antes de procesar la solicitud.

### 6.2 Integridad de Certificaciones

Cada certificación emitida cuenta con dos mecanismos de seguridad:

- **Hash SHA-256:** se calcula sobre el contenido del documento antes de guardarlo. Cualquier alteración posterior al documento invalida el hash.
- **Folio inmutable:** el trigger `tg_no_repudio_cert` bloquea cualquier `UPDATE` o `DELETE` sobre `certificacion_emitida`. El folio DAIR nunca puede ser modificado ni reutilizado.

### 6.3 Variables de entorno

Las credenciales nunca se almacenan en el código fuente. Se usan variables de entorno mediante el archivo `.env` (incluido en `.gitignore`):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión completa a CockroachDB (incluye host, puerto, usuario, contraseña y SSL) |

---

## 7. Estructura de Carpetas del Repositorio

| Ruta | Contenido |
|---|---|
| `/src/index.js` | ⚠️ Punto de entrada real del servidor Express con todas las rutas. Ver sección 7.2 sobre `old-index.js`. |
| `/src/app.js` | Configuración de la aplicación Express, separada del arranque del servidor. |
| `/proyecto-air.sql` | Script principal de BD: tablas, triggers, datos iniciales |
| `/database/schema.sql` | DDL principal — definición de todas las tablas |
| `/database/triggers_issue_10.sql` | Triggers de sesiones y votaciones (Issue #10) |
| `/database/issue_9.sql` | Scripts de certificaciones (Issue #9) |
| `/database/issue-15-anulaciones.sql` | Módulo de anulaciones |
| `/database/seed_issue_0.sql` | Datos semilla base del sistema |
| `/database/seed_issue_10.sql` | Datos semilla para sesiones y votaciones |
| `/database/seed_reglamento_normativa.sql` | Datos semilla de reglamentos y normativa |
| `/docs/` | Documentación técnica: diccionario, manual, modelo lógico |
| `/src/config/db.js` | Conexión a la base de datos CockroachDB |
| `/src/config/security.js` | Configuración de seguridad y JWT |
| `/src/models/` | 7 modelos: `Asambleista.js`, `Normativa.js`, `Votacion.js`, `Certificado.js`, `Sesion.js`, `Propuesta.js`, `Usuario.js` |
| `/src/controllers/` | 7 controladores: `AsambleistaController`, `AuthController`, `LegislativoController`, `NormativaController`, `PropuestaController`, `ReporteController`, `SesionController` (+ `SecretariaController.ext` pendiente — ver sección 7.1) |
| `/src/routes/` | 5 archivos de rutas: `auth`, `asambleistas`, `normativa`, `propuestas`, `sesiones` |
| `/src/views/` | Vistas HTML por módulo: `asambleistas/`, `normativa/`, `sesiones/`, `certificaciones/`, `propuestas/`, `shared/` — más `index.html` y `login.html` en raíz de views |
| `/src/services/` | `CryptoService` (SHA-256), `PDFService` |
| `/src/middlewares/` | Middleware de autenticación y autorización por rol |
| `/src/logs/auditoria.ext` | ⚠️ Log de auditoría con extensión provisional. Ver sección 7.1. |
| `/test/prueba-piloto.ext` | ⚠️ Pruebas del piloto con extensión provisional. Ver sección 7.1. |
| `/test/resultados.md` | Resultados documentados de las pruebas ejecutadas |
| `/REGLAS_GIT.md` | Convenciones y reglas del flujo Git del proyecto |
| `/package.json` | Dependencias y scripts npm (`npm start`, `npm test`) |
| `/.env` | Variables de entorno (NO se sube a GitHub — en `.gitignore`) |

### 7.1 Nota sobre archivos con extensión `.ext`

> ⚠️ Hay 3 archivos en el repositorio con extensión no estándar `.ext`: `src/controllers/SecretariaController.ext`, `src/logs/auditoria.ext` y `test/prueba-piloto.ext`. Esta extensión indica que los archivos están en desarrollo o son plantillas pendientes de completar y renombrar a `.js`. No deben ejecutarse directamente hasta que se les asigne la extensión correcta.

### 7.2 Deuda técnica identificada

- **`old-index.js` en la raíz:** archivo obsoleto, reemplazado por `src/index.js`. Pendiente eliminar del repositorio.
- **`SecretariaController.ext`:** controlador pendiente de completar y renombrar a `.js`.
- **`src/logs/auditoria.ext`** y **`test/prueba-piloto.ext`:** archivos con extensión provisional.

---

## 8. Pruebas

El directorio `/test/` contiene los siguientes recursos:

| Archivo | Descripción |
|---|---|
| `prueba-piloto.ext` | Casos de prueba del piloto (extensión provisional, ver sección 7.1) |
| `resultados.md` | Documentación de los resultados obtenidos en las pruebas ejecutadas |

Para ejecutar las pruebas unitarias de quórum y mayorías:

```bash
npm test
```

---

## 9. Contacto y Equipo

- **Repositorio:** https://github.com/SebasGarita/Preyecto-2-Sistema-de-Gesti-n-Legislativa-AIR
- **Motor de base de datos:** CockroachDB Cloud — Cluster: `proyecto-2`
- **Reglas Git:** ver `REGLAS_GIT.md` en la raíz del repositorio

*Sprint 2 — Semanas 1-2 | Curso: Bases de Datos | Instituto Tecnológico de Costa Rica*
