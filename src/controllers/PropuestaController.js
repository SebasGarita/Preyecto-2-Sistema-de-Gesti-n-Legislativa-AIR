const db = require('../config/db');
const Propuesta = require('../models/Propuesta');
const Usuario   = require('../models/Usuario');

const PropuestaController = {

  async listar(req, res) {
    try {
      const { busqueda, id_estado, id_etapa } = req.query;
      const lista = await Propuesta.findAll({ busqueda, id_estado, id_etapa });
      return res.json(lista);
    } catch (err) {
      console.error('Error listar:', err);
      return res.status(500).json({ error: 'Error al obtener propuestas' });
    }
  },

 async obtener(req, res) {
  try {
    const id = req.params.id;  // ← sin parseInt, queda como string
    console.log('>> obtener propuesta, id recibido:', id);

    const data = await Propuesta.findById(id);
    if (!data) return res.status(404).json({ error: 'Propuesta no encontrada' });
    return res.json(data);

  } catch (err) {
    console.error('Error obtener propuesta:', err);
    return res.status(500).json({ error: 'Error al obtener propuesta' });
  }
},

  async crear(req, res) {
  try {
    const {
      id_reglamento_base, id_etapa_propuesta, id_estado_propuesta,
      id_propuesta_padre, titulo, texto_sustitutivo,
      id_tipo_mayoria_requerida, proponentes
    } = req.body;

    // Validaciones
    if (!titulo || !id_etapa_propuesta || !id_tipo_mayoria_requerida) {
      return res.status(400).json({ error: 'Título, etapa y tipo de mayoría son requeridos' });
    }

    if (!proponentes || proponentes.length === 0) {
      return res.status(400).json({ error: 'Debe indicar al menos un proponente' });
    }

    // Buscar estado BORRADOR si no viene en el body
    let estadoFinal = id_estado_propuesta;
    if (!estadoFinal) {
      const estadoResult = await db.query(
        'SELECT id_estado_propuesta FROM catalogo_estado_propuestas WHERE nombre = $1',
        ['BORRADOR']
      );
      estadoFinal = estadoResult.rows[0]?.id_estado_propuesta;
      if (!estadoFinal) {
        return res.status(500).json({ error: 'Estado BORRADOR no existe en BD' });
      }
    }

    const nueva = await Propuesta.create({
      id_reglamento_base,
      id_etapa_propuesta,
      id_estado_propuesta: estadoFinal,
      id_propuesta_padre,
      titulo,
      texto_sustitutivo,
      codigo_air: null,   // se genera abajo
      id_tipo_mayoria_requerida
    });

    // Generar y asignar código AIR
    const codigoAir = `AIR-${new Date().getFullYear()}-${String(nueva.id_propuesta).padStart(4, '0')}`;
    await db.query(
      'UPDATE propuesta SET codigo_air = $1 WHERE id_propuesta = $2',
      [codigoAir, nueva.id_propuesta]
    );
    nueva.codigo_air = codigoAir;

    // Agregar proponentes
    for (const id_asambleista of proponentes) {
      await Propuesta.addProponente({
        id_propuesta:  nueva.id_propuesta,
        id_asambleista
      });
    }

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'INSERT',
      tabla_afectada: 'propuesta',
      detalle:        `Propuesta creada: "${titulo}"`,
      registro_id:    nueva.id_propuesta
    });

    return res.status(201).json(nueva);

  } catch (err) {
    console.error('Error crear propuesta:', err);
    return res.status(500).json({ error: 'Error al crear propuesta' });
  }
},

  async agregarProponente(req, res) {
    try {
      const { id_asambleista } = req.body;
      if (!id_asambleista) return res.status(400).json({ error: 'id_asambleista es requerido' });
      const resultado = await Propuesta.addProponente({ id_propuesta: req.params.id, id_asambleista });
      return res.status(201).json(resultado);
    } catch (err) {
      console.error('Error agregarProponente:', err);
      return res.status(500).json({ error: 'Error al agregar proponente' });
    }
  },

  async cambiarEstado(req, res) {
    try {
      const { id_estado_propuesta } = req.body;
      if (!id_estado_propuesta) return res.status(400).json({ error: 'id_estado_propuesta es requerido' });
      const resultado = await Propuesta.cambiarEstado(req.params.id, id_estado_propuesta, req.usuario.username);
      if (!resultado) return res.status(404).json({ error: 'Propuesta no encontrada' });
      return res.json(resultado);
    } catch (err) {
      console.error('Error cambiarEstado:', err);
      return res.status(500).json({ error: 'Error al cambiar estado' });
    }
  },

  async catalogos(req, res) {
    try {
      const data = await Propuesta.getCatalogos();
      return res.json(data);
    } catch (err) {
      console.error('Error catalogos:', err);
      return res.status(500).json({ error: 'Error al obtener catálogos' });
    }
  }
};

module.exports = PropuestaController;