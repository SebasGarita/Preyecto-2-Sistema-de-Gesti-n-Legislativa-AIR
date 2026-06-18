const Asambleista = require('../models/Asambleista');
const Usuario     = require('../models/Usuario');

// Valida formato de cédula costarricense: X-XXXX-XXXX
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

    const existente = await Asambleista.findByCedula(cedula);
    if (existente) {
      return res.status(409).json({
        error: `Ya existe un asambleísta con esa cédula: ${existente.nombre}`
      });
    }

    const nuevo = await Asambleista.create({ cedula, nombre, correo_institucional });

    try {
      const nombramiento = await Asambleista.addNombramiento({
        asambleista_id:      nuevo.asambleista_id,
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
        tabla_afectada: 'asambleista',
        detalle:        `Nuevo asambleísta registrado: ${nombre} (${cedula})`,
        registro_id:    nuevo.asambleista_id
      });

      return res.status(201).json({ ...nuevo, nombramiento });

    } catch (err) {
      if (err.message.includes('TRASLAPE_NOMBRAMIENTO')) {
        return res.status(409).json({ error: err.message });
      }
      throw err;
    }
  },

  // PUT /asambleistas/:id
  // Actualiza identidad + nombramiento vigente si vienen sector/puesto/fechas
  async actualizar(req, res) {
  console.log('BODY RECIBIDO:', req.body);

  const { id } = req.params;

  const {
    cedula,
    nombre,
    correo_institucional,
    razon_cambio,
    id_nombramiento,
    sector_id,
    id_puesto,
    fecha_inicio,
    fecha_fin
  } = req.body;

  console.log({
    id_nombramiento,
    sector_id,
    id_puesto,
    fecha_inicio,
    fecha_fin
  });

    // ── 1. Actualizar identidad permanente ───────────────────────────────────
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

    // ── 2. Actualizar nombramiento vigente si vienen los campos ──────────────
    let nominamientoActualizado = null;

    if (id_nombramiento && sector_id && id_puesto && fecha_inicio) {
      try {
        nominamientoActualizado = await Asambleista.updateNombramiento(
          id_nombramiento,
          { sector_id, id_puesto, fecha_inicio, fecha_fin: fecha_fin || null }
        );

        if (nominamientoActualizado) {
          await Usuario.registrarLog({
            id_usuario:     req.usuario.id,
            accion:         'UPDATE',
            tabla_afectada: 'nombramiento',
            detalle:        `Nombramiento vigente actualizado para asambleísta ID: ${id}`,
            registro_id:    id_nombramiento
          });
        }

      } catch (err) {
        if (err.message.includes('TRASLAPE_NOMBRAMIENTO')) {
          return res.status(409).json({
            error: 'Los datos de identidad se guardaron, pero el nombramiento no se pudo actualizar: ' +
                   'existe traslape con otro nombramiento vigente en ese período.'
          });
        }
        throw err;
      }
    }

    return res.json({ ...actualizado, nombramiento: nominamientoActualizado });
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