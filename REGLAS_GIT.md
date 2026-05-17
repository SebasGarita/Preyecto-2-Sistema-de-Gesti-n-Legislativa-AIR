# REGLAS_GIT.md — Normativa de Control de Versiones

> **Proyecto:** Sistema de Gestión Legislativa AIR — TEC  
> **Vigencia:** Sprint 2 en adelante  
>  El profesor revisará el historial de Git como evidencia de participación. Commits ausentes = nota en cero para el integrante.

---

## 1. Estructura de Ramas

```
main
└── develop          ← integración del sprint (rama base de trabajo)
    ├── feature/<nombre>   ← nuevas funcionalidades
    ├── fix/<nombre>       ← corrección de errores
    └── db/<nombre>        ← cambios exclusivos de base de datos
```

| Rama | Propósito | ¿Quién hace push directo? |
|------|-----------|--------------------------|
| `main` | Entregable final revisado | Nadie — solo merge desde `develop` al cerrar sprint |
| `develop` | Integración continua del equipo | Nadie — solo merge desde ramas de trabajo |
| `feature/*` | Desarrollo de módulos nuevos | El integrante asignado |
| `fix/*` | Corrección de bugs | El integrante asignado |
| `db/*` | Scripts SQL, triggers, migraciones | El integrante de BD asignado |

**Regla de oro:** nunca se hace `push` directo a `main` ni a `develop`. Todo cambio entra mediante Pull Request.

---

## 2. Convención de Nombres de Rama

```
<tipo>/<descripcion-en-kebab-case>
```

**Ejemplos válidos:**
```
feature/registro-asambleistas
feature/interfaz-carga-normativa
db/triggers-foliado-automatico
db/esquema-fisico-inicial
fix/error-calculo-quorum
```

**Ejemplos inválidos:**
```
mi-rama          ← sin tipo
Feature/Algo     ← mayúsculas
fix_quorum       ← guion bajo en vez de guion
prueba           ← no descriptivo
```

---

## 3. Estructura de Commits

### Formato obligatorio

```
<tipo>(<alcance>): <descripción corta en imperativo>

[cuerpo opcional: qué se hizo y por qué, no el cómo]

[pie opcional: referencias a issues o notas]
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
|------|--------------|
| `feat` | Nueva funcionalidad o módulo |
| `fix` | Corrección de bug |
| `db` | Script SQL, trigger, migración o cambio de esquema |
| `docs` | Documentación, READMEs, comentarios |
| `refactor` | Mejora de código sin cambiar funcionalidad |
| `test` | Pruebas |
| `chore` | Configuración, dependencias, `.gitignore` |

### Ejemplos válidos

```
feat(asambleistas): agregar formulario de registro con validación de cédula

db(triggers): implementar trigger de foliado automático DAIR-000-AÑO

fix(quorum): corregir cálculo de mayoría calificada del 66%

docs(reglas-git): agregar normativa de commits y ramas

db(esquema): crear tablas de normativa con relación recursiva Reglamento-Artículo-Inciso
```

### Ejemplos inválidos

```
arreglé cosas          ← sin tipo, sin imperativo
WIP                    ← no informativo
commit final           ← no describe nada
feat: cambios          ← demasiado vago
```

---

## 4. Flujo de Trabajo (Pull Request)

```
1. Crear rama desde develop:
   git checkout develop
   git pull origin develop
   git checkout -b feature/mi-modulo

2. Desarrollar y commitear con la convención.

3. Subir rama al repositorio:
   git push origin feature/mi-modulo

4. Abrir Pull Request hacia develop en GitHub/GitLab.
   - Título: igual al formato de commit principal
   - Descripción: qué se implementó, cómo probarlo
   - Asignar al menos un revisor del equipo

5. El revisor aprueba o solicita cambios.

6. Merge solo cuando esté aprobado.
   Eliminar la rama después del merge.
```

---

## 5. Frecuencia Mínima de Commits

Cada integrante debe tener **al menos 2 commits por semana de sprint activo** en su rama de trabajo. Commits de relleno (e.g., añadir un espacio en blanco) serán ignorados en la evaluación.

El historial de Git es evidencia directa ante el profesor. Un integrante sin commits en el período de un sprint se considera **no participante** en ese entregable.

---

## 6. Archivos que NO se suben al repositorio

El `.gitignore` debe incluir como mínimo:

```
# Credenciales y configuración local
.env
*.env
config/db_config.php
config/db_config.py

# Dependencias
node_modules/
vendor/
__pycache__/

# Sistema operativo
.DS_Store
Thumbs.db

# IDEs
.idea/
.vscode/
*.iml
```

**Nunca** subir contraseñas de base de datos, cadenas de conexión con credenciales ni claves SSL. Si esto ocurre, el commit debe ser revertido inmediatamente con `git revert` y notificar al equipo.

---

## 7. Commits de Base de Datos

Los scripts SQL siguen su propia convención adicional:

- Cada script debe ser **idempotente** cuando sea posible (`CREATE TABLE IF NOT EXISTS`, `DROP TABLE IF EXISTS` antes de crear).
- Nombrar los archivos como: `V<número>__<descripcion>.sql`  
  Ejemplo: `V01__esquema_inicial.sql`, `V02__triggers_foliado.sql`
- Un commit de tipo `db` no debe mezclar cambios de interfaz o lógica de negocio.

---

## 8. Penalizaciones

| Infracción | Consecuencia |
|------------|-------------|
| Push directo a `main` o `develop` | Revertir el push + llamada de atención al equipo |
| Commit sin seguir la convención de formato | El PR no se aprueba hasta corregirlo (`git commit --amend` o nuevo commit de fix) |
| Subir credenciales o `.env` al repositorio | Revertir inmediato + revisar historial completo |
| Merge sin Pull Request aprobado | Se revierte el merge |
| Integrante sin commits en el sprint | Se reporta al profesor como evidencia de no participación |
| Commits de relleno masivo al final del sprint | Se consideran inválidos para efectos de evaluación |

---

## 9. Referencia Rápida

```bash
# Iniciar trabajo
git checkout develop && git pull origin develop
git checkout -b feature/nombre-descriptivo

# Guardar avance
git add .
git commit -m "feat(modulo): descripción clara en imperativo"

# Subir
git push origin feature/nombre-descriptivo

# Mantener rama actualizada con develop
git fetch origin
git rebase origin/develop
```

---
