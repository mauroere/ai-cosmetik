const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Asegurarse de que el directorio de logs existe
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Configuración del logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'), 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: path.join(logDir, 'combined.log') 
        })
    ]
});

// Agregar consola en desarrollo
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger; 