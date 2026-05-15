const db = require('../config/db');

const Usuario = {

  // Busca usuario con sus roles y permisos en una sola consulta
  async findByUsername(username) {
    const result = await db.query(`
      SELECT
        u.id_usuario,
        u.username,
        u.password_hash,
        u.email,
        u.activo,
        ARRAY_AGG(DISTINCT r.nombre_rol)   AS roles,
        ARRAY_AGG(DISTINCT p.nombre_permiso) AS permisos
      FROM sys_usuario u
      LEFT JOIN sys_usuario_rol  ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN sys_rol          r  ON ur.id_rol     = r.id_rol
      LEFT JOIN sys_rol_permiso  rp ON r.id_rol      = rp.id_rol
      LEFT JOIN sys_permiso      p  ON rp.id_permiso = p.id_permiso
      WHERE u.username = $1 AND u.activo = TRUE
      GROUP BY u.id_usuario
    `, [username]);

    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await db.query(
      'SELECT id_usuario, username, email, activo FROM sys_usuario WHERE id_usuario = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async create({ username, password_hash, email }) {
    const result = await db.query(`
      INSERT INTO sys_usuario (username, password_hash, email, activo)
      VALUES ($1, $2, $3, TRUE)
      RETURNING id_usuario, username, email
    `, [username, password_hash, email]);
    return result.rows[0];
  },

  async registrarLog({ id_usuario, accion, tabla_afectada, detalle, registro_id }) {
    await db.query(`
      INSERT INTO sys_log_auditoria
        (id_usuario, accion, tabla_afectada, detalle, registro_id, fecha_hora)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [id_usuario, accion, tabla_afectada, detalle, registro_id]);
  }
};

module.exports = Usuario;