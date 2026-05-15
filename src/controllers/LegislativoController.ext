const VotacionModel = require('../models/Votacion.ext');

const votacionModel = new VotacionModel();

class LegislativoController {

    // Verificar quórum antes de permitir una votación
    async verificarQuorum(req, res) {
        try {
            const { idSesion } = req.params;
            const hayQuorum = await votacionModel.verificarQuorum(idSesion);

            if (!hayQuorum) {
                return res.status(400).json({
                    ok: false,
                    error: 'No hay quórum legal. No se puede registrar la votación.'
                });
            }

            return res.json({
                ok: true,
                msg: 'Quórum confirmado. Puede proceder con la votación.'
            });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // Registrar resultado de una votación
    async registrarVotacion(req, res) {
        try {
            const { idSesion, votosFavor, votosContra, tipoMayoria } = req.body;

            // Primero verificar quórum
            const hayQuorum = await votacionModel.verificarQuorum(idSesion);
            if (!hayQuorum) {
                return res.status(400).json({
                    ok: false,
                    error: 'Sin quórum legal. No se puede registrar la votación.'
                });
            }

            // Calcular resultado con lógica de mayoría
            const resultado = await votacionModel.calcularResultado(
                votosFavor, votosContra, tipoMayoria
            );

            return res.json({
                ok: true,
                resultado,
                msg: `Propuesta ${resultado}. Votos a favor: ${votosFavor}, en contra: ${votosContra}.`
            });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // Registrar asistencia a una sesión
    async registrarAsistencia(req, res) {
        try {
            const { idSesion, listaPresentes } = req.body;
            await votacionModel.registrarAsistencia(idSesion, listaPresentes);

            return res.json({
                ok: true,
                msg: `Asistencia registrada para ${listaPresentes.length} asambleístas.`
            });

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // Obtener índice de participación activa
    async obtenerParticipacion(req, res) {
        try {
            const data = await votacionModel.obtenerParticipacion();
            return res.json(data);

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }

    // Obtener sesiones registradas
    async obtenerSesiones(req, res) {
        try {
            const data = await votacionModel.obtenerSesiones();
            return res.json(data);

        } catch (error) {
            return res.status(500).json({ ok: false, error: error.message });
        }
    }
}

module.exports = new LegislativoController();
