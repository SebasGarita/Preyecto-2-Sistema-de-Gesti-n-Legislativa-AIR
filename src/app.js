const express = require('express');

const app = express();

app.use(express.json());

const { verificarToken, auditarEscritura } = require('./middlewares/auth');

app.use('/auth', require('./routes/auth.routes'));

app.use(verificarToken);
app.use(auditarEscritura);
app.use('/normativa',  require('./routes/normativa.routes'));
app.use('/sesiones',   require('./routes/sesiones.routes'));
app.use('/propuestas', require('./routes/propuestas.routes'));
app.use('/asambleistas', require('./routes/asambleistas.routes'));
app.get('/', (req, res) => {

  res.json({ mensaje: 'API AIR funcionando' });
});

module.exports = app;
