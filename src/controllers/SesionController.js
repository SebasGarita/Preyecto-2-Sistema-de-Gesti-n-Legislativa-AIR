const Sesion  = require('../models/Sesion');
const Usuario = require('../models/Usuario');

const SesionController = {

  async listar(req, res) {
    try {
      const lista = await Sesion.findAll();
      return res.json(lista);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async obtener(req, res) {
    try {
      const data = await Sesion.findById(req.params.id);
      if (!data) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async crear(req, res) {
    try {
      const usuarioId = req.usuario?.id;
      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const {
        id_tipo_modalidad,
        id_tipo_sesion,
        numero_sesion,
        fecha,
        link_acta,
        quorum_requerido
      } = req.body;

      if (!id_tipo_modalidad || !id_tipo_sesion || !numero_sesion || !fecha) {
        return res.status(400).json({
          error: 'Tipo de modalidad, tipo de sesión, número y fecha son requeridos'
        });
      }

      const nueva = await Sesion.create({
        id_tipo_modalidad,
        id_tipo_sesion,
        numero_sesion,
        fecha,
        link_acta,
        quorum_requerido: quorum_requerido || 0
      });

      await Usuario.registrarLog({
        id_usuario: usuarioId,
        accion: 'INSERT',
        tabla_afectada: 'sesiones',
        detalle: `Sesión creada: ${numero_sesion}`,
        registro_id: nueva.id_sesion
      });

      return res.status(201).json(nueva);

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async agregarPunto(req, res) {
    try {
      const { id } = req.params;
      const { id_propuesta, orden, descripcion } = req.body;

      if (!orden) {
        return res.status(400).json({ error: 'El orden del punto es requerido' });
      }

      const punto = await Sesion.addPuntoAgenda({
        id_sesion: id,
        id_propuesta,
        orden,
        descripcion
      });

      return res.status(201).json(punto);

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async getResolucionPorPunto(req, res) {
    try {
      const db = require('../config/db');
      const { idPunto } = req.params;

      const result = await db.query(`
        SELECT r.*, pa.id_propuesta
        FROM resolucion r
        JOIN punto_agenda pa ON pa.id_punto_agenda = r.id_punto_agenda
        WHERE r.id_punto_agenda = $1
      `, [String(idPunto)]);

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Este punto no tiene resolución asignada' });
      }
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  async registrarResolucion(req, res) {
    try {
      const usuarioId = req.usuario?.id;
      if (!usuarioId) return res.status(401).json({ error: 'Usuario no autenticado' });

      const { id } = req.params;
      const { id_punto_agenda, numero_resolucion, fecha_emision } = req.body;

      if (!id_punto_agenda || !numero_resolucion || !fecha_emision) {
        return res.status(400).json({
          error: 'Punto de agenda, número de resolución y fecha son requeridos'
        });
      }

      const resolucion = await Sesion.crearResolucion({
        id_sesion: id,
        id_punto_agenda,
        numero_resolucion,
        fecha_emision
      });

      await Usuario.registrarLog({
        id_usuario:     usuarioId,
        accion:         'INSERT',
        tabla_afectada: 'resolucion',
        detalle:        `Resolución registrada: ${numero_resolucion}`,
        registro_id:    resolucion.id_resolucion
      });

      return res.status(201).json(resolucion);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async catalogos(req, res) {
    try {
      const data = await Sesion.getCatalogos();
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
async asistencia(req, res) {
    try {
      const data = await Sesion.getAsistencia(req.params.id);
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async registrarAsistencia(req, res) {
    try {
      const { id_asambleista, id_estado_asistencia } = req.body;
      if (!id_asambleista || !id_estado_asistencia) {
        return res.status(400).json({ error: 'Asambleista y estado son requeridos' });
      }
      const data = await Sesion.registrarAsistencia({
        id_sesion: req.params.id,
        id_asambleista,
        id_estado_asistencia
      });
      await Usuario.registrarLog({
        id_usuario:     req.usuario?.id,
        accion:         'INSERT',
        tabla_afectada: 'asistencia_sesion_plenaria',
        detalle:        `Asistencia registrada sesion ${req.params.id}`,
        registro_id:    req.params.id
      });
      return res.status(201).json(data);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
};

module.exports = SesionController;
