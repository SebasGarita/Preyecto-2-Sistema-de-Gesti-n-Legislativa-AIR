// Configuración central de JWT y BCrypt
module.exports = {
  jwt: {
    secret:     process.env.JWT_SECRET || 'cambiar_en_produccion',
    expiresIn:  '8h'   // sesión de trabajo estándar
  },
  bcrypt: {
    saltRounds: 12     // costo de hashing
  }
};