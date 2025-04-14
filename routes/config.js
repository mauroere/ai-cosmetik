const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const Store = require('../models/store');

// Obtener configuración
router.get('/', async (req, res) => {
    try {
        const storeId = req.query.store_id;
        if (!storeId) {
            return res.status(400).json({ error: 'Se requiere store_id' });
        }

        const store = await Store.findOne({ store_id: storeId });
        if (!store) {
            return res.status(404).json({ error: 'Tienda no encontrada' });
        }

        // Devolver la configuración
        res.json({
            apiKey: store.settings?.apiKey || '',
            theme: store.settings?.theme || 'light',
            position: store.settings?.position || 'bottom-right',
            welcomeMessage: store.settings?.welcomeMessage || '¡Hola! Soy el Asistente IA. ¿En qué puedo ayudarte hoy?',
            offlineMessage: store.settings?.offlineMessage || 'En este momento estamos fuera de horario. Volveremos pronto.',
            is24Hours: store.settings?.is24Hours || false,
            startTime: store.settings?.startTime || '09:00',
            endTime: store.settings?.endTime || '18:00',
            showPrices: store.settings?.showPrices !== false,
            showStock: store.settings?.showStock !== false,
            maxProducts: store.settings?.maxProducts || 5
        });
    } catch (error) {
        logger.error('Error al obtener configuración', { error: error.message });
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// Guardar configuración
router.post('/', async (req, res) => {
    try {
        const storeId = req.query.store_id;
        if (!storeId) {
            return res.status(400).json({ error: 'Se requiere store_id' });
        }

        const store = await Store.findOne({ store_id: storeId });
        if (!store) {
            return res.status(404).json({ error: 'Tienda no encontrada' });
        }

        // Validar configuración
        const config = {
            apiKey: req.body.apiKey,
            theme: ['light', 'dark'].includes(req.body.theme) ? req.body.theme : 'light',
            position: ['bottom-right', 'bottom-left'].includes(req.body.position) ? req.body.position : 'bottom-right',
            welcomeMessage: req.body.welcomeMessage || '¡Hola! Soy el Asistente IA. ¿En qué puedo ayudarte hoy?',
            offlineMessage: req.body.offlineMessage || 'En este momento estamos fuera de horario. Volveremos pronto.',
            is24Hours: Boolean(req.body.is24Hours),
            startTime: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.startTime) ? req.body.startTime : '09:00',
            endTime: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.endTime) ? req.body.endTime : '18:00',
            showPrices: Boolean(req.body.showPrices),
            showStock: Boolean(req.body.showStock),
            maxProducts: Math.min(Math.max(parseInt(req.body.maxProducts) || 5, 1), 10)
        };

        // Actualizar configuración
        store.settings = config;
        await store.save();

        logger.info('Configuración actualizada', { store_id: storeId });
        res.json({ message: 'Configuración guardada exitosamente' });
    } catch (error) {
        logger.error('Error al guardar configuración', { error: error.message });
        res.status(500).json({ error: 'Error al guardar configuración' });
    }
});

module.exports = router; 