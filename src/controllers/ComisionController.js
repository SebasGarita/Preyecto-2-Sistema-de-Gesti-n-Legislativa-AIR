const Comision = require('../models/Comision');
const Usuario  = require('../models/Usuario');

const ComisionController = {

  // ──────────────────────────────────────────────────────────
  // COMISIONES
  // ──────────────────────────────────────────────────────────

  // GET /comisiones
  async listar(req, res) {
    const { busqueda } = req.query;
    const lista = await Comision.findAll({ busqueda });
    return res.json(lista);
  },

  // GET /comisiones/catalogos
  async catalogos(req, res) {
    const data = await Comision.getCatalogos();
    return res.json(data);
  },

  // GET /comisiones/:id
  async obtener(req, res) {
    const { id } = req.params;
    const data = await Comision.findById(id);
    if (!data) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }
    return res.json(data);
  },

  // POST /comisiones
  async crear(req, res) {
    const { id_tipo_comision, nombre_comision } = req.body;

    if (!id_tipo_comision || !nombre_comision?.trim()) {
      return res.status(400).json({
        error: 'Tipo de comisión y nombre son requeridos'
      });
    }

    const nueva = await Comision.create({ id_tipo_comision, nombre_comision: nombre_comision.trim() });

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'INSERT',
      tabla_afectada: 'comision',
      detalle:        `Nueva comisión creada: ${nombre_comision}`,
      registro_id:    nueva.id_comision
    });

    return res.status(201).json(nueva);
  },

  // PUT /comisiones/:id
  async actualizar(req, res) {
    const { id } = req.params;
    const { id_tipo_comision, nombre_comision } = req.body;

    if (!id_tipo_comision || !nombre_comision?.trim()) {
      return res.status(400).json({
        error: 'Tipo de comisión y nombre son requeridos'
      });
    }

    const actualizada = await Comision.update(id, {
      id_tipo_comision,
      nombre_comision: nombre_comision.trim()
    });

    if (!actualizada) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'UPDATE',
      tabla_afectada: 'comision',
      detalle:        `Comisión actualizada: ${nombre_comision}`,
      registro_id:    id
    });

    return res.json(actualizada);
  },


  // ──────────────────────────────────────────────────────────
  // INTEGRANTES
  // ──────────────────────────────────────────────────────────

  // POST /comisiones/:id/integrantes
  async agregarIntegrante(req, res) {
    const { id } = req.params;
    const { id_asambleista, id_rol_comision,
            fecha_ingreso_nombramiento, fecha_fin_nombramiento } = req.body;

    if (!id_asambleista || !id_rol_comision) {
      return res.status(400).json({
        error: 'Asambleísta y rol son requeridos'
      });
    }

    // Verificar que la comisión exista
    const comision = await Comision.findById(id);
    if (!comision) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }

    try {
      const integrante = await Comision.addIntegrante({
        id_comision: id,
        id_asambleista,
        id_rol_comision,
        fecha_ingreso_nombramiento: fecha_ingreso_nombramiento || null,
        fecha_fin_nombramiento:     fecha_fin_nombramiento     || null
      });

      await Usuario.registrarLog({
        id_usuario:     req.usuario.id,
        accion:         'INSERT',
        tabla_afectada: 'integrante_comision',
        detalle:        `Asambleísta ID ${id_asambleista} agregado a comisión ID ${id}`,
        registro_id:    integrante.id_integrante_comision
      });

      return res.status(201).json(integrante);

    } catch (err) {
      // La constraint uq_integrante_comision_activo lanza un error de duplicado
      if (err.code === '23505') {
        return res.status(409).json({
          error: 'Este asambleísta ya es integrante activo de esta comisión'
        });
      }
      throw err;
    }
  },

  // DELETE /comisiones/:id/integrantes/:integranteId
  async removerIntegrante(req, res) {
    const { id, integranteId } = req.params;
    const { fecha_fin } = req.body;

    const resultado = await Comision.removeIntegrante(integranteId, fecha_fin);

    if (!resultado) {
      return res.status(404).json({ error: 'Integrante no encontrado' });
    }

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'UPDATE',
      tabla_afectada: 'integrante_comision',
      detalle:        `Integrante ID ${integranteId} dado de baja de comisión ID ${id}`,
      registro_id:    integranteId
    });

    return res.json(resultado);
  },


  // ──────────────────────────────────────────────────────────
  // SESIONES DE COMISIÓN
  // ──────────────────────────────────────────────────────────

  // POST /comisiones/:id/sesiones
  async crearSesion(req, res) {
    const { id } = req.params;
    const { fecha_hora, numero_sesion, descripcion, link_acta } = req.body;

    if (!fecha_hora) {
      return res.status(400).json({ error: 'La fecha/hora de la sesión es requerida' });
    }

    const comision = await Comision.findById(id);
    if (!comision) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }

    const sesion = await Comision.crearSesion({
      id_comision: id,
      fecha_hora,
      numero_sesion:  numero_sesion  || null,
      descripcion:    descripcion    || null,
      link_acta:      link_acta      || null
    });

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'INSERT',
      tabla_afectada: 'sesion_comision',
      detalle:        `Sesión creada para comisión ID ${id}: ${numero_sesion || fecha_hora}`,
      registro_id:    sesion.id_sesion_comision
    });

    return res.status(201).json(sesion);
  },

  // GET /comisiones/sesiones/:sesionId
  async obtenerSesion(req, res) {
    const { sesionId } = req.params;
    const data = await Comision.findSesion(sesionId);
    if (!data) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    return res.json(data);
  },

  // POST /comisiones/sesiones/:sesionId/asistencia
  // Body: { registros: [{ asambleista_id, id_estado_asistencia }] }
  async registrarAsistencia(req, res) {
    const { sesionId } = req.params;
    const { registros } = req.body;

    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({
        error: 'Se requiere un arreglo "registros" con al menos un elemento'
      });
    }

    // Validar que la sesión exista
    const sesion = await Comision.findSesion(sesionId);
    if (!sesion) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Validar estructura mínima de cada registro
    for (const r of registros) {
      if (!r.asambleista_id || !r.id_estado_asistencia) {
        return res.status(400).json({
          error: 'Cada registro debe tener asambleista_id e id_estado_asistencia'
        });
      }
    }

    const resultado = await Comision.registrarAsistenciaMasiva(sesionId, registros);

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'UPSERT',
      tabla_afectada: 'asistencia_sesion_comision',
      detalle:        `Asistencia registrada para sesión ID ${sesionId}: ${registros.length} registros`,
      registro_id:    Number(sesionId)
    });

    return res.json({ registrados: resultado.length, detalle: resultado });
  },


  // ──────────────────────────────────────────────────────────
  // INFORMES DEL DIRECTORIO
  // ──────────────────────────────────────────────────────────

  // POST /comisiones/:id/informes
  async crearInforme(req, res) {
    const { id } = req.params;
    const { id_propuesta, id_sesion, titulo, recomendacion, fecha_presentacion } = req.body;

    if (!titulo?.trim()) {
      return res.status(400).json({ error: 'El título oficial del informe es requerido' });
    }

    const comision = await Comision.findById(id);
    if (!comision) {
      return res.status(404).json({ error: 'Comisión no encontrada' });
    }

    const informe = await Comision.crearInforme({
      id_comision:        id,
      id_propuesta:       id_propuesta       || null,
      id_sesion:          id_sesion          || null,
      titulo:             titulo.trim(),
      recomendacion:      recomendacion      || null,
      fecha_presentacion: fecha_presentacion || null
    });

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'INSERT',
      tabla_afectada: 'informe_directorio',
      detalle:        `Informe "${titulo}" creado para comisión ID ${id}`,
      registro_id:    informe.id_informe
    });

    return res.status(201).json(informe);
  },

  // PUT /comisiones/informes/:informeId
  async actualizarInforme(req, res) {
    const { informeId } = req.params;
    const { id_propuesta, id_sesion, titulo, recomendacion, fecha_presentacion } = req.body;

    if (!titulo?.trim()) {
      return res.status(400).json({ error: 'El título oficial del informe es requerido' });
    }

    const actualizado = await Comision.actualizarInforme(informeId, {
      id_propuesta:       id_propuesta       || null,
      id_sesion:          id_sesion          || null,
      titulo:             titulo.trim(),
      recomendacion:      recomendacion      || null,
      fecha_presentacion: fecha_presentacion || null
    });

    if (!actualizado) {
      return res.status(404).json({ error: 'Informe no encontrado' });
    }

    await Usuario.registrarLog({
      id_usuario:     req.usuario.id,
      accion:         'UPDATE',
      tabla_afectada: 'informe_directorio',
      detalle:        `Informe ID ${informeId} actualizado: "${titulo}"`,
      registro_id:    Number(informeId)
    });

    return res.json(actualizado);
  }
};

module.exports = ComisionController;