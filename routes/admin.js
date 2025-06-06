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
        return res.redirect(`/admin/login/${req.params.store_id}`);
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Token inválido o expirado', { error: err.message });
            return res.redirect(`/admin/login/${req.params.store_id}`);
        }
        
        req.user = user;
        next();
    });
};

// Ruta de login
router.get('/login/:store_id', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'login.html'));
});

// Servir páginas de administración (protegidas)
router.get('/config/:store_id', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'config.html'));
});

router.get('/metrics/:store_id', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'metrics.html'));
});

router.get('/conversations/:store_id', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'conversations.html'));
});

// Servir la página principal del admin
router.get('/:store_id', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'admin', 'index.html'));
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
            url: `${baseUrl}${link.url}/${storeId}`
        }));

        res.json({ links });
    } catch (error) {
        logger.error('Error al obtener links de administrador', { error: error.message });
        res.status(500).json({ error: 'Error al obtener links de administrador' });
    }
});

// Ruta para obtener la configuración
router.get('/api/config/:store_id', async (req, res) => {
    try {
        const { store_id } = req.params;
        if (!store_id) {
            return res.status(400).json({ error: 'Se requiere store_id' });
        }

        // Aquí deberías obtener la configuración de tu base de datos
        // Por ahora retornamos valores por defecto
        res.json({
            welcomeMessage: '¡Hola! Soy el asistente virtual de Arbell. ¿En qué puedo ayudarte?',
            primaryColor: '#6B4E71',
            position: 'bottom-right'
        });
    } catch (error) {
        logger.error('Error al obtener configuración', { error: error.message });
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para guardar la configuración
router.post('/api/config/:store_id', async (req, res) => {
    try {
        const { store_id } = req.params;
        const { welcomeMessage, primaryColor, position } = req.body;
        
        if (!store_id) {
            return res.status(400).json({ error: 'Se requiere store_id' });
        }

        // Aquí deberías guardar la configuración en tu base de datos
        logger.info('Configuración guardada', { store_id, config: req.body });
        
        res.json({ success: true, message: 'Configuración guardada exitosamente' });
    } catch (error) {
        logger.error('Error al guardar configuración', { error: error.message });
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para obtener estadísticas
router.get('/api/stats/:store_id', async (req, res) => {
    try {
        const { store_id } = req.params;
        
        if (!store_id) {
            return res.status(400).json({ error: 'Se requiere store_id' });
        }

        // Aquí deberías obtener las estadísticas reales de tu base de datos
        res.json({
            totalConversations: 0,
            responseRate: 0,
            satisfactionRate: 0
        });
    } catch (error) {
        logger.error('Error al obtener estadísticas', { error: error.message });
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router; 