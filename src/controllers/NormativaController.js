const Normativa = require('../models/Normativa');
const Usuario   = require('../models/Usuario');

const NormativaController = {

  async listarReglamentos(req, res) {
    const lista = await Normativa.getReglamentos();
    return res.json(lista);
  },

  async crearReglamento(req, res) {
    const { nombre_normativa, sigla } = req.body;
    if (!nombre_normativa || !sigla) {
      return res.status(400).json({ error: 'Nombre y sigla son requeridos' });
    }
    const nuevo = await Normativa.crearReglamento({ nombre_normativa, sigla });
    await Usuario.registrarLog({
      id_usuario: req.usuario.id, accion: 'INSERT',
      tabla_afectada: 'reglamento',
      detalle: `Reglamento creado: ${sigla}`, registro_id: nuevo.id_reglamento
    });
    return res.status(201).json(nuevo);
  },

  async getArbol(req, res) {
    const { id } = req.params;
    const arbol = await Normativa.getArbol(id);
    return res.json(arbol);
  },

  async getHistorial(req, res) {
    const { id_elemento } = req.params;
    const historial = await Normativa.getHistorialElemento(id_elemento);
    return res.json(historial);
  },

  async crearElemento(req, res) {
    const {
      id_reglamento, id_elemento_padre, id_nivel_reglamento,
      numer_etiqueta, contenido_texto, orden, id_estado_vigencia
    } = req.body;

    if (!id_reglamento || !id_nivel_reglamento || !numer_etiqueta || !contenido_texto) {
      return res.status(400).json({
        error: 'Reglamento, nivel, etiqueta y contenido son requeridos'
      });
    }

    try {
      const nuevo = await Normativa.crearElemento({
        id_reglamento, id_elemento_padre, id_nivel_reglamento,
        numer_etiqueta, contenido_texto, orden: orden || 1, id_estado_vigencia
      });

      await Usuario.registrarLog({
        id_usuario: req.usuario.id, accion: 'INSERT',
        tabla_afectada: 'elemento_normativo',
        detalle: `Elemento creado: ${numer_etiqueta}`, registro_id: nuevo.id_elemento
      });

      return res.status(201).json(nuevo);

    } catch (err) {
      // El índice único lanzará error si ya existe ese elemento vigente
      if (err.code === '23505') {
        return res.status(409).json({
          error: 'Ya existe una versión Vigente de ese elemento. ' +
                 'El trigger creará el historial automáticamente al insertar la nueva versión.'
        });
      }
      throw err;
    }
  },

  async catalogos(req, res) {
    const data = await Normativa.getCatalogos();
    return res.json(data);
  }
};

module.exports = NormativaController;