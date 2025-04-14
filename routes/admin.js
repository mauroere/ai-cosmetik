const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const path = require('path');

// Servir páginas de administración
router.get('/config', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'config.html'));
});

router.get('/metrics', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'metrics.html'));
});

router.get('/conversations', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'conversations.html'));
});

// Configuración de links de administrador
const adminLinks = [
    {
        location: "Listado de páginas",
        url: "/admin/config",
        regions: ["AR", "BR", "CL", "CO", "MX", "PE", "UY"]
    },
    {
        location: "Listado de productos",
        url: "/admin/metrics",
        regions: ["AR", "BR", "CL", "CO", "MX", "PE", "UY"]
    },
    {
        location: "Listado de órdenes",
        url: "/admin/conversations",
        regions: ["AR", "BR", "CL", "CO", "MX", "PE", "UY"]
    }
];

// Obtener links de administrador
router.get('/links', async (req, res) => {
    try {
        const storeId = req.query.store_id;
        if (!storeId) {
            return res.status(400).json({ error: 'Se requiere store_id' });
        }

        // Construir URLs completas con el dominio base
        const baseUrl = 'https://super-broccoli-x5wq9r55vhv6wv-3000.app.github.dev';
        const links = adminLinks.map(link => ({
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