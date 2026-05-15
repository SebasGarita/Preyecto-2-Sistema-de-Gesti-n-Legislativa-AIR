const express = require('express');

const app = express();

app.use(express.json());

const { verificarToken, auditarEscritura } = require('./middlewares/auth');

app.use('/auth', require('./routes/auth.routes'));

app.use(verificarToken);
app.use(auditarEscritura);

app.get('/', (req, res) => {
  res.json({ mensaje: 'API AIR funcionando' });
});

module.exports = app;