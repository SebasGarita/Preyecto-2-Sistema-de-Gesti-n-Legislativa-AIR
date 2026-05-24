// Configuración central de JWT y BCrypt
module.exports = {
  jwt: {
    secret: (() => {
      if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET no definido en .env');
      return process.env.JWT_SECRET;
    })(),
    expiresIn: '8h'
  },
  bcrypt: {
    saltRounds: 12
  }
};