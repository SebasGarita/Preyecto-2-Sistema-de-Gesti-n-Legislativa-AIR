const Sesion  = require('../models/Sesion');
const Usuario = require('../models/Usuario');

const SesionController = {

  async listar(req, res) {
    const lista = await Sesion.findAll();
    return res.json(lista);
  },

  async obtener(req, res) {
    const data = await Sesion.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Sesión no encontrada' });
    return res.json(data);
  },

  async crear(req, res) {
    const { id_tipo_modalidad, id_tipo_sesion, numero_sesion,
            fecha, link_acta, quorum_requerido } = req.body;

    if (!id_tipo_modalidad || !id_tipo_sesion || !numero_sesion || !fecha) {
      return res.status(400).json({
        error: 'Tipo de modalidad, tipo de sesión, número y fecha son requeridos'
      });
    }

    const nueva = await Sesion.create({
      id_tipo_modalidad, id_tipo_sesion, numero_sesion,
      fecha, link_acta, quorum_requerido: quorum_requerido || 0
    });

    await Usuario.registrarLog({
      id_usuario: req.usuario.id, accion: 'INSERT',
      tabla_afectada: 'sesiones',
      detalle: `Sesión creada: ${numero_sesion}`, registro_id: nueva.id_sesion
    });

    return res.status(201).json(nueva);
  },

  async agregarPunto(req, res) {
    const { id } = req.params;
    const { id_propuesta, orden, descripcion } = req.body;

    if (!orden) {
      return res.status(400).json({ error: 'El orden del punto es requerido' });
    }

    const punto = await Sesion.addPuntoAgenda({
      id_sesion: id, id_propuesta, orden, descripcion
    });

    return res.status(201).json(punto);
  },

  async registrarResolucion(req, res) {
    const { id } = req.params;
    const { id_punto_agenda, numero_resolucion, fecha_emision } = req.body;

    if (!id_punto_agenda || !numero_resolucion || !fecha_emision) {
      return res.status(400).json({
        error: 'Punto de agenda, número de resolución y fecha son requeridos'
      });
    }

    const resolucion = await Sesion.crearResolucion({
      id_sesion: id, id_punto_agenda, numero_resolucion, fecha_emision
    });

    await Usuario.registrarLog({
      id_usuario: req.usuario.id, accion: 'INSERT',
      tabla_afectada: 'resolucion',
      detalle: `Resolución registrada: ${numero_resolucion}`,
      registro_id: resolucion.id_resolucion
    });

    return res.status(201).json(resolucion);
  },

  async catalogos(req, res) {
    const data = await Sesion.getCatalogos();
    return res.json(data);
  }
};

module.exports = SesionController;