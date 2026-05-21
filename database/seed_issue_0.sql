-- Roles base del sistema
INSERT INTO sys_rol (nombre_rol) VALUES
  ('ADMINISTRADOR'),
  ('SECRETARIA_AIR'),
  ('CONSULTA');

-- Permisos base
INSERT INTO sys_permiso (nombre_permiso, descripcion) VALUES
  ('EMITIR_CERTIFICACION',    'Puede generar y firmar certificaciones'),
  ('GESTIONAR_ASAMBLEISTAS',  'Puede crear y editar asambleístas'),
  ('GESTIONAR_SESIONES',      'Puede registrar sesiones y votaciones'),
  ('EDITAR_REGLAMENTOS',      'Puede cargar y modificar reglamentos'),
  ('VER_COMPILADOR',          'Puede consultar reglamentos vigentes'),
  ('GESTIONAR_USUARIOS',      'Puede crear y desactivar usuarios');

-- Permisos por rol
-- Admin tiene todo
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r, sys_permiso p
WHERE r.nombre_rol = 'ADMINISTRADOR';

-- Secretaría tiene todo menos gestionar usuarios
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM sys_rol r
JOIN sys_permiso p ON p.nombre_permiso IN (
  'EMITIR_CERTIFICACION','GESTIONAR_ASAMBLEISTAS',
  'GESTIONAR_SESIONES','EDITAR_REGLAMENTOS','VER_COMPILADOR'
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

INSERT INTO sys_permiso (nombre_permiso, descripcion)
VALUES ('GESTIONAR_PROPUESTAS', 'Puede crear y gestionar propuestas normativas');

-- Asignar a roles correspondientes:
INSERT INTO sys_rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso FROM sys_rol r, sys_permiso p
WHERE r.nombre_rol IN ('ADMINISTRADOR','SECRETARIA_AIR')
  AND p.nombre_permiso = 'GESTIONAR_PROPUESTAS';
