const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Obtener links de administrador
router.get('/links', async (req, res) => {
    try {
        const storeId = req.query.store_id;
        if (!storeId) {
            return res.status(400).json({ error: 'Se requiere store_id' });
        }

        // Cargar configuración de links
        const adminLinks = require('../public/admin-links.json');
        
        // Construir URLs completas
        const baseUrl = `https://super-broccoli-x5wq9r55vhv6wv-3000.app.github.dev`;
        const links = adminLinks.links.map(link => ({
            ...link,
            url: `${baseUrl}${link.url}?store_id=${storeId}`
        }));

        res.json({ links });
    } catch (error) {
        logger.error('Error al obtener links de administrador', { error: error.message });
        res.status(500).json({ error: 'Error al obtener links de administrador' });
    }
});

module.exports = router; 