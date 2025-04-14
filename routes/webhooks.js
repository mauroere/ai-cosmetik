const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Middleware para verificar la autenticidad del webhook
const verifyTiendanubeWebhook = (req, res, next) => {
    const userAgent = req.headers['user-agent'];
    if (!userAgent || !userAgent.includes('Nuvemshop')) {
        return res.status(401).json({ error: 'User-Agent inválido' });
    }
    next();
};

// Manejador para la instalación de la app
router.post('/installed', verifyTiendanubeWebhook, async (req, res) => {
    try {
        const { store_id, access_token, user_id } = req.body;
        
        logger.info('Nueva instalación de tienda', {
            store_id,
            user_id
        });

        // Guardar los datos de la tienda en la base de datos
        await storeService.saveStore({
            store_id,
            access_token,
            user_id,
            status: 'active',
            installed_at: new Date()
        });

        res.status(200).json({ message: 'Instalación exitosa' });
    } catch (error) {
        logger.error('Error en instalación de tienda', { error: error.message });
        res.status(500).json({ error: 'Error en la instalación' });
    }
});

// Manejador para la desinstalación de la app
router.post('/uninstalled', verifyTiendanubeWebhook, async (req, res) => {
    try {
        const { store_id } = req.body;
        
        logger.info('Desinstalación de tienda', { store_id });

        // Actualizar el estado de la tienda en la base de datos
        await storeService.updateStore(store_id, {
            status: 'inactive',
            uninstalled_at: new Date()
        });

        res.status(200).json({ message: 'Desinstalación exitosa' });
    } catch (error) {
        logger.error('Error en desinstalación de tienda', { error: error.message });
        res.status(500).json({ error: 'Error en la desinstalación' });
    }
});

module.exports = router; 