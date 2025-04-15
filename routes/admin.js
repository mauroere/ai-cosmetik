const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const path = require('path');
const jwt = require('jsonwebtoken');

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.redirect('/admin/login?store_id=' + req.query.store_id);
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Token inválido o expirado', { error: err.message });
            return res.redirect('/admin/login?store_id=' + req.query.store_id);
        }
        
        req.user = user;
        next();
    });
};

// Ruta de login
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'login.html'));
});

// Servir páginas de administración (protegidas)
router.get('/config', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'config.html'));
});

router.get('/metrics', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'metrics.html'));
});

router.get('/conversations', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'conversations.html'));
});

// Configuración de links de administrador
const adminLinks = [
    {
        location: "Configuración",
        url: "/admin/config",
        regions: ["AR", "BR", "CL", "CO", "MX", "PE", "UY"]
    },
    {
        location: "Métricas",
        url: "/admin/metrics",
        regions: ["AR", "BR", "CL", "CO", "MX", "PE", "UY"]
    },
    {
        location: "Conversaciones",
        url: "/admin/conversations",
        regions: ["AR", "BR", "CL", "CO", "MX", "PE", "UY"]
    }
];

// Obtener links de administrador (protegido)
router.get('/links', authenticateToken, async (req, res) => {
    try {
        const storeId = req.query.store_id;
        if (!storeId) {
            return res.status(400).json({ error: 'Se requiere store_id' });
        }

        // Construir URLs completas con el dominio base
        const baseUrl = 'https://ai-cosmetik-production.up.railway.app';
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