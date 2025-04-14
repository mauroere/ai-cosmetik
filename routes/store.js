const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Store initialization endpoint
router.post('/init', async (req, res) => {
    try {
        const { id, name, language } = req.body;

        if (!id || !name) {
            return res.status(400).json({
                error: 'Se requiere ID y nombre de la tienda'
            });
        }

        // Log store initialization
        logger.info('Store initialization', {
            store_id: id,
            store_name: name,
            language
        });

        // Here you would typically:
        // 1. Store or update store information in database
        // 2. Initialize store-specific configurations
        // 3. Set up webhooks if needed

        res.json({
            success: true,
            message: 'Tienda inicializada correctamente'
        });
    } catch (error) {
        logger.error('Error initializing store', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            error: 'Error al inicializar la tienda'
        });
    }
});

module.exports = router; 