const db = require('../config/db');

const Propuesta = require('../models/Propuesta');
const Usuario   = require('../models/Usuario');

const PropuestaController = {

  async listar(req, res) {
    const { busqueda, id_estado, id_etapa } = req.query;
    const lista = await Propuesta.findAll({ busqueda, id_estado, id_etapa });
    return res.json(lista);
  },

  async obtener(req, res) {
    const data = await Propuesta.findById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Propuesta no encontrada' });
    return res.json(data);
  },

  async crear(req, res) {
    const {
      id_reglamento_base, id_etapa_propuesta, id_propuesta_padre,
      titulo, texto_sustitutivo, id_tipo_mayoria_requerida,
      proponentes  // array de id_asambleista
    } = req.body;

    if (!titulo || !id_etapa_propuesta || !id_tipo_mayoria_requerida) {
      return res.status(400).json({
        error: 'Título, etapa y tipo de mayoría son requeridos'
      });
    }

    if (!proponentes || proponentes.length === 0) {
      return res.status(400).json({
        error: 'Debe indicar al menos un proponente'
      });
    }

    // Estado inicial: BORRADOR
   const estadoResult = await db.query(
  'SELECT id_estado_propuesta FROM catalogo_estado_propuestas WHERE nombre = $1',
  ['BORRADOR']
);

const estadoBorrador = estadoResult.rows[0]?.id_estado_propuesta;
    
if (!estadoBorrador) {
  return res.status(500).json({ 
    error: 'Estado BORRADOR no existe en BD' });
}

    const nueva = await Propuesta.create({
      id_reglamento_base, id_etapa_propuesta,
      id_estado_propuesta: estadoBorrador,
      id_propuesta_padre,  titulo, texto_sustitutivo,
      codigo_air: null,    id_tipo_mayoria_requerida
    });

    // Agrega los proponentes (relación N:M)
    for (const id_asambleista of proponentes) {
      await Propuesta.addProponente({
        id_propuesta: nueva.id_propuesta,
        id_asambleista
      });
    }

    await Usuario.registrarLog({
      id_usuario: req.usuario.id, accion: 'INSERT',
      tabla_afectada: 'propuesta',
      detalle: `Propuesta creada: ${titulo}`, registro_id: nueva.id_propuesta
    });

    return res.status(201).json(nueva);
  },

  async agregarProponente(req, res) {
    const { id } = req.params;
    const { id_asambleista } = req.body;

    if (!id_asambleista) {
      return res.status(400).json({ error: 'id_asambleista es requerido' });
    }

    const resultado = await Propuesta.addProponente({
      id_propuesta: id, id_asambleista
    });

    return res.status(201).json(resultado);
  },

  async cambiarEstado(req, res) {
    const { id } = req.params;
    const { id_estado_propuesta } = req.body;

    if (!id_estado_propuesta) {
      return res.status(400).json({ error: 'id_estado_propuesta es requerido' });
    }

    const resultado = await Propuesta.cambiarEstado(
      id, id_estado_propuesta, req.usuario.username
    );

    if (!resultado) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    return res.json(resultado);
  },

  async catalogos(req, res) {
    const data = await Propuesta.getCatalogos();
    return res.json(data);
  }
};

module.exports = PropuestaController;
