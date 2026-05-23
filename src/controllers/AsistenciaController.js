// AsistenciaController.js
// Issue #12 — Control de Asistencias y Cálculo de Participación

const Asistencia = require('../models/Asistencia');
const Usuario    = require('../models/Usuario');

const AsistenciaController = {

  // ────────────────────────────────────────────────────────────
  // CATÁLOGOS
  // GET /asistencia/catalogos
  // ────────────────────────────────────────────────────────────
  async catalogos(req, res) {
    try {
      return res.json(await Asistencia.getCatalogos());
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },


  // ────────────────────────────────────────────────────────────
  // HOJA DE ASISTENCIA — PLENARIA
  // ────────────────────────────────────────────────────────────

  // GET /asistencia/hoja/:idSesion
  // Devuelve la sesión + lista de asambleístas con estado actual.
  async getHoja(req, res) {
    try {
      const data = await Asistencia.getHojaPlenaria(req.params.idSesion);
      if (!data) {
        return res.status(404).json({ error: 'Sesión no encontrada' });
      }
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // POST /asistencia/hoja/:idSesion
  // Body: { registros: [{ asambleista_id, id_estado_asistencia }] }
  // Guarda la hoja completa (Presente + Ausentes).
  async registrarHoja(req, res) {
    try {
      const { idSesion } = req.params;
      const { registros } = req.body;

      if (!Array.isArray(registros) || registros.length === 0) {
        return res.status(400).json({
          error: 'Se requiere un arreglo "registros" con al menos un elemento'
        });
      }

      // Validar estructura mínima
      for (const r of registros) {
        if (!r.asambleista_id || !r.id_estado_asistencia) {
          return res.status(400).json({
            error: 'Cada registro debe tener asambleista_id e id_estado_asistencia'
          });
        }
      }

      const resultado = await Asistencia.registrarHojaPlenaria(idSesion, registros);

      await Usuario.registrarLog({
        id_usuario:     req.usuario.id,
        accion:         'UPSERT',
        tabla_afectada: 'asistencia_sesion_plenaria',
        detalle:        `Hoja registrada para sesión ID ${idSesion}: ${registros.length} asambleístas`,
        registro_id:    Number(idSesion)
      });

      // Devolver hoja actualizada con quórum recalculado
      const hojaActualizada = await Asistencia.getHojaPlenaria(idSesion);

      return res.json({
        registrados:  resultado.length,
        hay_quorum:   hojaActualizada.hay_quorum,
        presentes:    hojaActualizada.presentes,
        quorum_requerido: hojaActualizada.quorum_requerido
      });

    } catch (err) {
        console.error('ERROR registrarHoja:', err); // ← agrega esta línea
      return res.status(500).json({ error: err.message });
    }
  },

  // GET /asistencia/sesion/:idSesion/resumen
  // Resumen de asistencia ya guardada para una sesión.
  async resumenSesion(req, res) {
    try {
      const resumen = await Asistencia.getResumenSesion(req.params.idSesion);
      return res.json(resumen);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },


  // ────────────────────────────────────────────────────────────
  // PARTICIPACIÓN POR PERÍODO
  // ────────────────────────────────────────────────────────────

  // GET /asistencia/participacion/:asambleistaId
  // Query: ?fechaInicio=2025-01-01&fechaFin=2025-12-31
  // Retorna el porcentaje desagregado (plenaria + comisión).
  async calcularParticipacion(req, res) {
    try {
      const { asambleistaId } = req.params;
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          error: 'Se requieren los parámetros fechaInicio y fechaFin (YYYY-MM-DD)'
        });
      }

      if (fechaInicio > fechaFin) {
        return res.status(400).json({
          error: 'fechaInicio no puede ser posterior a fechaFin'
        });
      }

      const resultado = await Asistencia.calcularPorcentajeAsistencia(
        asambleistaId, fechaInicio, fechaFin
      );

      return res.json(resultado);

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // GET /asistencia/reporte
  // Query: ?fechaInicio=2025-01-01&fechaFin=2025-12-31
  // Reporte de participación de TODOS los asambleístas en el período.
  async reportePeriodo(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          error: 'Se requieren los parámetros fechaInicio y fechaFin (YYYY-MM-DD)'
        });
      }

      const reporte = await Asistencia.getReportePeriodo(fechaInicio, fechaFin);
      return res.json(reporte);

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },


  // ────────────────────────────────────────────────────────────
  // VOTACIÓN
  // ────────────────────────────────────────────────────────────

  // POST /asistencia/votacion
  // Verifica quórum, calcula y persiste el resultado de una votación.
  async registrarVotacion(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const {
        id_sesion, id_punto_agenda, id_propuesta,
        votos_favor, votos_contra, votos_abstencion,
        tipo_mayoria
      } = req.body;

      // Validaciones básicas
      if (!id_sesion || votos_favor === undefined || votos_contra === undefined || !tipo_mayoria) {
        return res.status(400).json({
          error: 'id_sesion, votos_favor, votos_contra y tipo_mayoria son requeridos'
        });
      }

      if (!['Simple', 'Calificada'].includes(tipo_mayoria)) {
        return res.status(400).json({
          error: 'tipo_mayoria debe ser "Simple" o "Calificada"'
        });
      }

      if (votos_favor < 0 || votos_contra < 0) {
        return res.status(400).json({ error: 'Los votos no pueden ser negativos' });
      }

      const resultado = await Asistencia.registrarVotacion({
        id_sesion, id_punto_agenda, id_propuesta,
        votos_favor, votos_contra,
        votos_abstencion: votos_abstencion || 0,
        tipo_mayoria,
        id_usuario_registro: usuarioId
      });

      // Si no hay quórum la votación igual se guarda para trazabilidad,
      // pero se advierte al cliente.
      if (!resultado.quorum_valido) {
        return res.status(200).json({
          ...resultado,
          advertencia: 'La sesión no tenía quórum legal al momento de la votación. ' +
                       'El resultado queda registrado pero puede ser impugnado.'
        });
      }

      await Usuario.registrarLog({
        id_usuario:     usuarioId,
        accion:         'INSERT',
        tabla_afectada: 'votacion',
        detalle:        `Votación registrada. Resultado: ${resultado.resultado} | ` +
                        `Sesión: ${id_sesion} | Favor: ${votos_favor} | Contra: ${votos_contra}`,
        registro_id:    resultado.id_votacion
      });

      return res.status(201).json(resultado);

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // GET /asistencia/votacion/:idSesion
  // Historial de votaciones de una sesión.
  async getVotaciones(req, res) {
    try {
      const data = await Asistencia.getVotacion(req.params.idSesion);
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = AsistenciaController;