const db       = require('../config/db');
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
      const data = await Propuesta.findById(req.params.id);
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
        id_tipo_mayoria_requerida, id_elemento_origen, proponentes
      } = req.body;

      if (!titulo || !id_etapa_propuesta || !id_tipo_mayoria_requerida) {
        return res.status(400).json({ error: 'Título, etapa y tipo de mayoría son requeridos' });
      }

      if (!proponentes || proponentes.length === 0) {
        return res.status(400).json({ error: 'Debe indicar al menos un proponente' });
      }

      // Buscar estado BORRADOR si no se provee
      let estadoFinal = id_estado_propuesta;
      if (!estadoFinal) {
        const estadoResult = await db.query(
          `SELECT id_estado_propuesta FROM catalogo_estado_propuestas
           WHERE nombre = 'BORRADOR' LIMIT 1`
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
        codigo_air:               null,
        id_tipo_mayoria_requerida,
        id_elemento_origen:       id_elemento_origen || null
      });

      // Generar código AIR automáticamente
      const codigoAir = `AIR-${new Date().getFullYear()}-${String(nueva.id_propuesta).padStart(4, '0')}`;
      await db.query(
        'UPDATE propuesta SET codigo_air = $1 WHERE id_propuesta = $2',
        [codigoAir, nueva.id_propuesta]
      );
      nueva.codigo_air = codigoAir;

      // Agregar proponentes
      for (const id_asambleista of proponentes) {
        await Propuesta.addProponente({ id_propuesta: nueva.id_propuesta, id_asambleista });
      }

      await Usuario.registrarLog({
        id_usuario:     req.usuario.id,
        accion:         'INSERT',
        tabla_afectada: 'propuesta',
        detalle:        `Propuesta creada: "${titulo}"${id_elemento_origen ? ` (reforma elemento #${id_elemento_origen})` : ''}`,
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
      const resultado = await Propuesta.addProponente({
        id_propuesta:  req.params.id,
        id_asambleista
      });
      return res.status(201).json(resultado);
    } catch (err) {
      console.error('Error agregarProponente:', err);
      return res.status(500).json({ error: 'Error al agregar proponente' });
    }
  },

  async buscarElementos(req, res) {
    try {
      const { busqueda, id_reglamento } = req.query;
      const condiciones = ['id_estado_vigencia = 1'];
      const params = [];
      let idx = 1;

      if (id_reglamento) {
        condiciones.push(`id_reglamento = $${idx}`);
        params.push(id_reglamento);
        idx++;
      }
      if (busqueda) {
        condiciones.push(`(numer_etiqueta ILIKE $${idx} OR contenido_texto ILIKE $${idx})`);
        params.push(`%${busqueda}%`);
        idx++;
      }

      const result = await db.query(`
        SELECT
          id_elemento::text AS id_elemento,
          id_reglamento,
          numer_etiqueta,
          LEFT(contenido_texto, 120) AS contenido_texto
        FROM elemento_normativo
        WHERE ${condiciones.join(' AND ')}
        ORDER BY numer_etiqueta
        LIMIT 30
      `, params);

      return res.json(result.rows);
    } catch (err) {
      console.error('Error buscarElementos:', err);
      return res.status(500).json({ error: 'Error al buscar elementos' });
    }
  },

  // ── CORREGIDO: carga propuesta completa antes de actualizar estado ──
  async cambiarEstado(req, res) {
    try {
      const { id_estado_propuesta } = req.body;
      if (!id_estado_propuesta) {
        return res.status(400).json({ error: 'id_estado_propuesta es requerido' });
      }

      const id = req.params.id;

      // 1. Cargar propuesta COMPLETA antes de cambiar estado
      //    (necesitamos id_elemento_origen y texto_sustitutivo)
      const propuestaRes = await db.query(`
        SELECT * FROM propuesta WHERE id_propuesta = $1
      `, [id]);

      if (!propuestaRes.rows[0]) {
        return res.status(404).json({ error: 'Propuesta no encontrada' });
      }

      const propuesta = propuestaRes.rows[0];

      // 2. Actualizar estado
      await db.query(`
        UPDATE propuesta SET id_estado_propuesta = $1 WHERE id_propuesta = $2
      `, [id_estado_propuesta, id]);

      // 3. Bitácora
      await db.query(`
        INSERT INTO bitacora_propuesta (
          id_propuesta, id_estado_propuesta,
          fecha_modificacion, usuario_modificacion
        ) VALUES ($1, $2, NOW(), $3)
      `, [id, id_estado_propuesta, req.usuario.username]);

      // 4. Verificar si el nuevo estado es APROBADA
      const estadoRes = await db.query(`
        SELECT nombre FROM catalogo_estado_propuestas
        WHERE id_estado_propuesta = $1
      `, [id_estado_propuesta]);

      const nombreEstado = estadoRes.rows[0]?.nombre;

      if (nombreEstado === 'APROBADA') {

        if (!propuesta.texto_sustitutivo || !propuesta.id_elemento_origen) {
          // Aprobada pero sin datos para actualizar el compilador
          console.warn(`Propuesta ${id} aprobada sin texto_sustitutivo o id_elemento_origen`);
          const resultado = await Propuesta.findById(id);
          return res.json({
            ...resultado,
            advertencia: 'Propuesta aprobada, pero no tiene texto sustitutivo o elemento de origen definido. El compilador normativo no fue actualizado.'
          });
        }

        // 5. Insertar nueva versión — el trigger marca la anterior como Histórica
        await db.query(`
          INSERT INTO elemento_normativo (
            id_reglamento,
            id_elemento_padre,
            id_nivel_reglamento,
            numer_etiqueta,
            contenido_texto,
            fecha_inicio_vigencia,
            id_estado_vigencia
          )
          SELECT
            id_reglamento,
            id_elemento_padre,
            id_nivel_reglamento,
            numer_etiqueta,
            $1,
            CURRENT_DATE,
            1
          FROM elemento_normativo
          WHERE id_elemento = $2
        `, [propuesta.texto_sustitutivo, propuesta.id_elemento_origen]);

        await Usuario.registrarLog({
          id_usuario:     req.usuario.id,
          accion:         'UPDATE',
          tabla_afectada: 'elemento_normativo',
          detalle:        `Texto actualizado por aprobación de propuesta ${propuesta.codigo_air ?? id}`,
          registro_id:    propuesta.id_elemento_origen
        });
      }

      const propuestaActualizada = await Propuesta.findById(id);
      return res.json(propuestaActualizada);

    } catch (err) {
      console.error('Error cambiarEstado:', err);
      return res.status(500).json({ error: 'Error al cambiar estado: ' + err.message });
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