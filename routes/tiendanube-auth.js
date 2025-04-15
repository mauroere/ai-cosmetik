const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../utils/logger');
require('dotenv').config();

// Configuración de Tiendanube
const tiendanubeConfig = {
    clientId: process.env.TIENDANUBE_CLIENT_ID || "16635",
    clientSecret: process.env.TIENDANUBE_CLIENT_SECRET,
    redirectUri: process.env.TIENDANUBE_REDIRECT_URI || "https://ai-cosmetik-production.up.railway.app/auth-success.html"
};

// Ruta para iniciar el proceso de autenticación
router.get('/auth', (req, res) => {
    const authUrl = `https://www.tiendanube.com/apps/authorize/token?client_id=${tiendanubeConfig.clientId}&response_type=code&redirect_uri=${encodeURIComponent(tiendanubeConfig.redirectUri)}`;
    res.redirect(authUrl);
});

// Ruta para manejar el callback de autenticación
router.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        logger.error('No se recibió código de autorización');
        return res.status(400).json({ error: 'Código de autorización no proporcionado' });
    }

    try {
        // Realizar solicitud para obtener el access_token
        const response = await axios.post('https://www.tiendanube.com/apps/authorize/token', {
            client_id: tiendanubeConfig.clientId,
            client_secret: tiendanubeConfig.clientSecret,
            grant_type: 'authorization_code',
            code: code
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const { access_token, store_id } = response.data;

        // Guardar el token y store_id en tu base de datos
        logger.info('Autenticación exitosa', { store_id });

        // Redirigir a la página de éxito
        res.redirect(`${tiendanubeConfig.redirectUri}?store_id=${store_id}`);

    } catch (error) {
        logger.error('Error en autenticación de Tiendanube', {
            error: error.message,
            response: error.response?.data
        });

        res.status(500).json({
            error: 'Error en autenticación',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Webhook para eliminación de datos de tienda
router.post('/webhooks/store/redact', async (req, res) => {
    try {
        const { store_id } = req.body;
        logger.info('Solicitud de eliminación de datos de tienda recibida', { store_id });
        
        // Aquí implementarías la lógica para eliminar los datos de la tienda
        // Por ejemplo, eliminar tokens, configuraciones, etc.
        
        res.json({ status: 'success', message: 'Datos de tienda programados para eliminación' });
    } catch (error) {
        logger.error('Error en webhook store/redact', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Error al procesar la solicitud' });
    }
});

// Webhook para eliminación de datos de clientes
router.post('/webhooks/customers/redact', async (req, res) => {
    try {
        const { store_id, customer_id } = req.body;
        logger.info('Solicitud de eliminación de datos de cliente recibida', { store_id, customer_id });
        
        // Aquí implementarías la lógica para eliminar los datos del cliente
        // Por ejemplo, eliminar historial de conversaciones, preferencias, etc.
        
        res.json({ status: 'success', message: 'Datos de cliente programados para eliminación' });
    } catch (error) {
        logger.error('Error en webhook customers/redact', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Error al procesar la solicitud' });
    }
});

// Webhook para solicitud de datos de clientes
router.post('/webhooks/customers/data-request', async (req, res) => {
    try {
        const { store_id, customer_id } = req.body;
        logger.info('Solicitud de datos de cliente recibida', { store_id, customer_id });
        
        // Aquí implementarías la lógica para recopilar los datos del cliente
        // Por ejemplo, historial de conversaciones, preferencias, etc.
        
        res.json({ 
            status: 'success', 
            message: 'Solicitud de datos recibida',
            data: {
                customer_id,
                store_id,
                // Aquí irían los datos recopilados
                conversations: [],
                preferences: {},
                created_at: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error en webhook customers/data-request', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Error al procesar la solicitud' });
    }
});

module.exports = router; 