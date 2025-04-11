require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configuración de Tiendanube
const tiendanubeConfig = {
    apiKey: process.env.TIENDANUBE_API_KEY,
    apiSecret: process.env.TIENDANUBE_API_SECRET,
    storeId: process.env.TIENDANUBE_STORE_ID,
    baseURL: 'https://api.tiendanube.com/v1'
};

// Configuración de Redpill.ai
const redpillConfig = {
    apiKey: process.env.REDPILL_API_KEY,
    baseURL: 'https://api.redpill.ai/v1/chat/completion'  // URL corregida según documentación
};

// Ruta para procesar mensajes del asistente
app.post('/api/assistant', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Procesar el mensaje con Redpill.ai
        const redpillResponse = await axios.post(redpillConfig.baseURL, {
            messages: [{
                role: "user",
                content: message
            }],
            model: "gpt-3.5-turbo",
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${redpillConfig.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Obtener productos relevantes de Tiendanube
        const productsResponse = await axios.get(`${tiendanubeConfig.baseURL}/${tiendanubeConfig.storeId}/products`, {
            headers: {
                'Authentication': `Bearer ${tiendanubeConfig.apiKey}:${tiendanubeConfig.apiSecret}`
            }
        });

        // Procesar la respuesta y generar una respuesta adecuada
        const response = {
            message: redpillResponse.data.choices[0].message.content,
            products: productsResponse.data.products
        };

        res.json(response);
    } catch (error) {
        console.error('Error detallado:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers
        });
        res.status(500).json({ 
            error: 'Error al procesar la solicitud',
            details: error.response?.data || error.message
        });
    }
});

// Ruta para obtener información de productos
app.get('/api/products', async (req, res) => {
    try {
        const response = await axios.get(`${tiendanubeConfig.baseURL}/${tiendanubeConfig.storeId}/products`, {
            headers: {
                'Authentication': `Bearer ${tiendanubeConfig.apiKey}:${tiendanubeConfig.apiSecret}`
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Error al obtener productos',
            details: error.response?.data || error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
}); 