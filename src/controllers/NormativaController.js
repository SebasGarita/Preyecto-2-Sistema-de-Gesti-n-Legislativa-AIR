const Normativa = require('../models/Normativa');
const Usuario   = require('../models/Usuario');

const NormativaController = {

  async catalogos(req, res) {
    try {
      const data = await Normativa.getCatalogos();
      return res.json(data);
    } catch (err) {
      console.error('Error catalogos normativa:', err);
      return res.status(500).json({ error: 'Error al obtener catálogos' });
    }
  },

  async listarReglamentos(req, res) {
    try {
      const lista = await Normativa.getReglamentos();
      return res.json(lista);
    } catch (err) {
      console.error('Error listar reglamentos:', err);
      return res.status(500).json({ error: 'Error al obtener reglamentos' });
    }
  },

  async getArbol(req, res) {
    try {
      const arbol = await Normativa.getArbol(req.params.id);
      return res.json(arbol);
    } catch (err) {
      console.error('Error getArbol:', err);
      return res.status(500).json({ error: 'Error al obtener árbol normativo' });
    }
  },

  async getHistorial(req, res) {
    try {
      const historial = await Normativa.getHistorialElemento(req.params.id_elemento);
      return res.json(historial);
    } catch (err) {
      console.error('Error getHistorial:', err);
      return res.status(500).json({ error: 'Error al obtener historial' });
    }
  },

  async crearReglamento(req, res) {
    try {
      const { nombre_normativa, sigla } = req.body;
      if (!nombre_normativa || !sigla) {
        return res.status(400).json({ error: 'nombre_normativa y sigla son requeridos' });
      }

      const nuevo = await Normativa.crearReglamento({ nombre_normativa, sigla });

      await Usuario.registrarLog({
        id_usuario:     req.usuario.id,
        accion:         'INSERT',
        tabla_afectada: 'reglamento',
        detalle:        `Reglamento creado: "${nombre_normativa}" (${sigla})`,
        registro_id:    nuevo.id_reglamento
      });

      return res.status(201).json(nuevo);
    } catch (err) {
      console.error('Error crearReglamento:', err);
      return res.status(500).json({ error: 'Error al crear reglamento' });
    }
  },

  async crearElemento(req, res) {
    try {
      const {
        id_reglamento, id_elemento_padre, id_nivel_reglamento,
        numer_etiqueta, contenido_texto, orden, id_estado_vigencia
      } = req.body;

      if (!id_reglamento || !id_nivel_reglamento || !numer_etiqueta || !contenido_texto || !orden || !id_estado_vigencia) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const nuevo = await Normativa.crearElemento({
        id_reglamento, id_elemento_padre, id_nivel_reglamento,
        numer_etiqueta, contenido_texto, orden, id_estado_vigencia
      });

      await Usuario.registrarLog({
        id_usuario:     req.usuario.id,
        accion:         'INSERT',
        tabla_afectada: 'elemento_normativo',
        detalle:        `Elemento creado: "${numer_etiqueta}" en reglamento #${id_reglamento}`,
        registro_id:    nuevo.id_elemento
      });

      return res.status(201).json(nuevo);
    } catch (err) {
      console.error('Error crearElemento:', err);
      return res.status(500).json({ error: 'Error al crear elemento normativo' });
    }
  }
};

module.exports = NormativaController;