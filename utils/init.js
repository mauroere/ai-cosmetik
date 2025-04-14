const fs = require('fs');
const path = require('path');

function initializeDirectories() {
    // Crear directorio de logs si no existe
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    // Aquí podemos agregar más inicializaciones de directorios si es necesario
}

module.exports = {
    initializeDirectories
}; 