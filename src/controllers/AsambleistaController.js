const Asambleista = require('../models/Asambleista');
const Usuario     = require('../models/Usuario');

// Valida formato de cédula costarricense: 0-0000-0000
const validarFormatoCedula = (cedula) => {
  return /^\d{1}-\d{4}-\d{4}$/.test(cedula);
};

const AsambleistaController = {

  // GET /asambleistas
  async listar(req, res) {
    const { busqueda } = req.query;
    const lista = await Asambleista.findAll({ busqueda });
    return res.json(lista);
  },

  // GET /asambleistas/:id
  async obtener(req, res) {
    const { id } = req.params;
    const data = await Asambleista.findById(id);

    if (!data) {
      return res.status(404).json({ error: 'Asambleísta no encontrado' });
    }
    return res.json(data);
  },

  // GET /asambleistas/catalogos
  async catalogos(req, res) {
    const data = await Asambleista.getCatalogos();
    return res.json(data);
  },

  // POST /asambleistas
  async crear(req, res) {
    const { cedula, nombre, correo_institucional,
            sector_id, id_puesto, fecha_inicio, fecha_fin, resolucion_id } = req.body;

    // ── Validaciones ────────────────────────────────────────────────────────
    if (!cedula || !nombre || !sector_id || !id_puesto || !fecha_inicio) {
      return res.status(400).json({
        error: 'Campos requeridos: cédula, nombre, sector, puesto, fecha de inicio'
      });
    }

    if (!validarFormatoCedula(cedula)) {
      return res.status(400).json({
        error: 'Formato de cédula inválido. Use el formato: X-XXXX-XXXX (ej: 3-0248-0440)'
      });
    }

    // Verificar que no exista ya esa cédula
    const existente = await Asambleista.findByCedula(cedula);
    if (existente) {
      return res.status(409).json({
        error: `Ya existe un asambleísta con esa cédula: ${existente.nombre}`
      });
    }

    // ── Crear identidad permanente ──────────────────────────────────────────
    const nuevo = await Asambleista.create({ cedula, nombre, correo_institucional });

    // ── Crear primer nombramiento ───────────────────────────────────────────
    // El trigger tg_traslape_sector en BD valida que no haya traslape
    try {
      const nombramiento = await Asambleista.addNombramiento({
        asambleista_id:     nuevo.asambleista_id,
        sector_id,
        id_puesto,
        fecha_inicio,
        fecha_fin:          fecha_fin || null,
        id_usuario_registro: req.usuario.id,
        resolucion_id:      resolucion_id || null
      });

      await Usuario.registrarLog({
        id_usuario:     req.usuario.id,
        accion:         'INSERT',
        tabla_afectada: 'asambleista',
        detalle:        `Nuevo asambleísta registrado: ${nombre} (${cedula})`,
        registro_id:    nuevo.asambleista_id
      });

      return res.status(201).json({ ...nuevo, nombramiento });

    } catch (err) {
      // Si el trigger lanza excepción de traslape, la devolvemos limpia
      if (err.message.includes('TRASLAPE_NOMBRAMIENTO')) {
        return res.status(409).json({ error: err.message });
      }
      throw err;
    }
  },

  // PUT /asambleistas/:id
  async actualizar(req, res) {
    const { id } = req.params;
    const { cedula, nombre, correo_institucional, razon_cambio } = req.body;

    if (!cedula || !nombre) {
      return res.status(400).json({ error: 'Cédula y nombre son requeridos' });
    }

    if (!validarFormatoCedula(cedula)) {
      return res.status(400).json({
        error: 'Formato de cédula inválido. Use el formato: X-XXXX-XXXX'
      });
    }

    // Verificar que la cédula no esté en uso por OTRO asambleísta
    const existente = await Asambleista.findByCedula(cedula);
    if (existente && existente.asambleista_id != id) {
      return res.status(409).json({
        error: `Esa cédula pertenece a otro asambleísta: ${existente.nombre}`
      });
    }

    const actualizado = await Asambleista.update(
      id,
      { cedula, nombre, correo_institucional, razon_cambio },
      req.usuario.id
    );

    if (!actualizado) {
      return res.status(404).json({ error: 'Asambleísta no encontrado' });
    }

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'UPDATE',
      tabla_afectada: 'asambleista',
      detalle:        `Datos actualizados. Razón: ${razon_cambio || 'No especificada'}`,
      registro_id:    id
    });

    return res.json(actualizado);
  },

  // POST /asambleistas/:id/nombramientos
  async asignarNombramiento(req, res) {
    const { id } = req.params;
    const { sector_id, id_puesto, fecha_inicio, fecha_fin, resolucion_id } = req.body;

    if (!sector_id || !id_puesto || !fecha_inicio) {
      return res.status(400).json({
        error: 'Sector, puesto y fecha de inicio son requeridos'
      });
    }

    // Validar que el asambleísta exista
    const persona = await Asambleista.findById(id);
    if (!persona) {
      return res.status(404).json({ error: 'Asambleísta no encontrado' });
    }

    try {
      const nombramiento = await Asambleista.addNombramiento({
        asambleista_id:      id,
        sector_id,
        id_puesto,
        fecha_inicio,
        fecha_fin:           fecha_fin || null,
        id_usuario_registro: req.usuario.id,
        resolucion_id:       resolucion_id || null
      });

      await Usuario.registrarLog({
        id_usuario:     req.usuario.id,
        accion:         'INSERT',
        tabla_afectada: 'nombramiento',
        detalle:        `Nuevo nombramiento asignado a asambleísta ID: ${id}`,
        registro_id:    nombramiento.id_nombramiento
      });

      return res.status(201).json(nombramiento);

    } catch (err) {
      if (err.message.includes('TRASLAPE_NOMBRAMIENTO')) {
        return res.status(409).json({
          error: 'Ya existe un nombramiento vigente en ese período. ' +
                 'Finalice el actual antes de asignar uno nuevo.'
        });
      }
      throw err;
    }
  },

  // PUT /asambleistas/:id/nombramientos/:nomId/finalizar
  async finalizarNombramiento(req, res) {
    const { nomId } = req.params;
    const { fecha_fin } = req.body;

    if (!fecha_fin) {
      return res.status(400).json({ error: 'La fecha de finalización es requerida' });
    }

    const resultado = await Asambleista.finalizarNombramiento(nomId, fecha_fin);

    if (!resultado) {
      return res.status(404).json({
        error: 'Nombramiento no encontrado o ya finalizado'
      });
    }

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'UPDATE',
      tabla_afectada: 'nombramiento',
      detalle:        `Nombramiento finalizado. Fecha fin: ${fecha_fin}`,
      registro_id:    nomId
    });

    return res.json(resultado);
  }
};

module.exports = AsambleistaController;