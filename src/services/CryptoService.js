const crypto = require('crypto');

class CryptoService {
    // Genera un hash SHA-256 del contenido del certificado
    static generarHash(datos) {
        const contenido = JSON.stringify(datos, Object.keys(datos).sort());
        return crypto.createHash('sha256').update(contenido, 'utf8').digest('hex');
    }

    // Verifica que un documento no fue alterado
    static verificarHash(datos, hashEsperado) {
        return this.generarHash(datos) === hashEsperado;
    }
}

module.exports = CryptoService;
