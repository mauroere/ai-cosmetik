const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Configuración de links de administrador
const adminLinks = [
    {
        location: "Listado de páginas",
        url: "https://super-broccoli-x5wq9r55vhv6wv-3000.app.github.dev/admin/config",
        regions: ["AR", "BR", "CL", "CO", "MX", "PE", "UY"]
    },
    {
        location: "Listado de productos",
        url: "https://super-broccoli-x5wq9r55vhv6wv-3000.app.github.dev/admin/metrics",
        regions: ["AR", "BR", "CL", "CO", "MX", "PE", "UY"]
    },
    {
        location: "Listado de órdenes",
        url: "https://super-broccoli-x5wq9r55vhv6wv-3000.app.github.dev/admin/conversations",
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

        // Agregar store_id a las URLs
        const links = adminLinks.map(link => ({
            ...link,
            url: `${link.url}?store_id=${storeId}`
        }));

        res.json({ links });
    } catch (error) {
        logger.error('Error al obtener links de administrador', { error: error.message });
        res.status(500).json({ error: 'Error al obtener links de administrador' });
    }
});

module.exports = router; 