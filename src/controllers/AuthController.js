const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const config  = require('../config/security');

const AuthController = {

  // POST /auth/login
  async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const usuario = await Usuario.findByUsername(username);

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // El token incluye roles y permisos para validación sin ir a BD en cada request
    const payload = {
      id:       usuario.id_usuario,
      username: usuario.username,
      roles:    usuario.roles,
      permisos: usuario.permisos
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    // Log de entrada
    await Usuario.registrarLog({
      id_usuario:     usuario.id_usuario,
      accion:         'LOGIN',
      tabla_afectada: 'sys_usuario',
      detalle:        `Inicio de sesión exitoso desde IP: ${req.ip}`,
      registro_id:    usuario.id_usuario
    });

    return res.json({
      token,
      usuario: {
        id:       usuario.id_usuario,
        username: usuario.username,
        roles:    usuario.roles
      }
    });
  },

  // POST /auth/logout  (el token se destruye en el cliente; aquí dejamos el log)
  async logout(req, res) {
    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'LOGOUT',
      tabla_afectada: 'sys_usuario',
      detalle:        'Cierre de sesión',
      registro_id:    req.usuario.id
    });
    return res.json({ mensaje: 'Sesión cerrada' });
  },

  // POST /auth/usuarios  (solo Admin)
  async crearUsuario(req, res) {
    const { username, password, email, id_rol } = req.body;

    if (!username || !password || !email || !id_rol) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const hash = await bcrypt.hash(password, config.bcrypt.saltRounds);
    const nuevo = await Usuario.create({ username, password_hash: hash, email });

    // Asignar rol
    await db.query(
      'INSERT INTO sys_usuario_rol (id_usuario, id_rol) VALUES ($1, $2)',
      [nuevo.id_usuario, id_rol]
    );

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'INSERT',
      tabla_afectada: 'sys_usuario',
      detalle:        `Usuario creado: ${username}`,
      registro_id:    nuevo.id_usuario
    });

    return res.status(201).json(nuevo);
  }
};

module.exports = AuthController;
