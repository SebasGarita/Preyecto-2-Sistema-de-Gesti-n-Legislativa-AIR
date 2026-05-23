const express = require('express');
const path    = require('path');
const app     = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

const { verificarToken, auditarEscritura } = require('./middlewares/auth');

app.use('/auth', require('./routes/auth.routes'));

app.use('/normativa',    require('./routes/normativa.routes'));
app.use('/sesiones',     require('./routes/sesiones.routes'));
app.use('/propuestas',   require('./routes/propuestas.routes'));
app.use('/asambleistas', require('./routes/asambleistas.routes'));
app.use('/certificaciones', require('./routes/certificaciones.routes'));
app.use('/comisiones', require('./routes/comisiones.routes'));

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

module.exports = app;