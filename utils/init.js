const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Función para inicializar directorios necesarios
function initializeDirectories() {
    try {
        // Directorios necesarios
        const directories = [
            path.join(__dirname, '..', 'data'),
            path.join(__dirname, '..', 'logs'),
            path.join(__dirname, '..', 'public', 'images')
        ];

        // Crear directorios si no existen
        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                logger.info(`Directorio creado: ${dir}`);
            }
        });

        // Verificar archivo de productos
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        if (!fs.existsSync(productsPath)) {
            // Crear archivo de productos vacío si no existe
            fs.writeFileSync(productsPath, JSON.stringify([], null, 2));
            logger.info('Archivo de productos creado');
        }

        logger.info('Inicialización de directorios completada');
    } catch (error) {
        logger.error('Error al inicializar directorios', { error: error.message });
        throw error;
    }
}

module.exports = { initializeDirectories }; 