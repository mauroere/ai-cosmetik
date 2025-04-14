require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const storeContext = require('./data/assistant-context');
const tiendanubeService = require('./services/tiendanubeService');
const logger = require('./utils/logger');
const { initializeDirectories } = require('./utils/init');

const app = express();

// Initialize required directories
initializeDirectories();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Comentamos temporalmente el rate limiter hasta resolver el problema de instalación
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: false,
//   legacyHeaders: false,
//   skip: (req) => false
// });
// app.use('/api/', limiter);

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Token inválido o expirado', { error: err.message });
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    
    req.user = user;
    next();
  });
};

// Configuración de Redpill.ai
const redpillConfig = {
    apiKey: process.env.REDPILL_API_KEY,
    baseURL: 'https://api.redpill.ai/v1',  // URL base correcta de Redpill.ai
    timeout: 30000 // 30 segundos de timeout
};

// Configuración de axios
const axiosInstance = axios.create({
    baseURL: redpillConfig.baseURL,
    timeout: redpillConfig.timeout,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para manejar errores de red
axiosInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            logger.error('Timeout en la solicitud a la API', { error: error.message });
            throw new Error('La solicitud tardó demasiado tiempo en completarse');
        }
        if (error.code === 'ERR_CONNECTION_RESET' || error.message.includes('Failed to fetch') || error.code === 'ERR_CONNECTION_ABORTED') {
            logger.error('Conexión reseteada con la API', { error: error.message });
            throw new Error('Error de conexión con el servicio');
        }
        logger.error('Error en la solicitud a la API', { 
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
);

// Esquema de validación para productos
const productSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().required(),
  image: Joi.string().required(),
  category: Joi.string().required(),
  stock: Joi.number().required()
});

// Sistema de caché para productos
let products = [];
let productsCache = {
  data: [],
  lastUpdated: null,
  ttl: 5 * 60 * 1000 // 5 minutos
};

// Función para cargar productos desde archivo
function loadProducts() {
  try {
    const productsPath = path.join(__dirname, 'data', 'products.json');
    if (fs.existsSync(productsPath)) {
      const fileContent = fs.readFileSync(productsPath, 'utf8');
      const loadedProducts = JSON.parse(fileContent);
      
      // Validar cada producto
      const validProducts = loadedProducts.filter(product => {
        const { error } = productSchema.validate(product);
        if (error) {
          logger.error(`Producto inválido: ${JSON.stringify(product)}`, { error: error.details });
          return false;
        }
        return true;
      });
      
      products = validProducts;
      productsCache.data = validProducts;
      productsCache.lastUpdated = Date.now();
      
      logger.info(`Cargados ${products.length} productos desde archivo local`);
    } else {
      logger.warn('No se encontró archivo de productos, usando lista vacía');
    }
  } catch (error) {
    logger.error('Error al cargar productos:', { error: error.message });
  }
}

// Cargar productos al inicio
loadProducts();

// Función para obtener productos (con caché)
function getProducts() {
  const now = Date.now();
  if (productsCache.lastUpdated && (now - productsCache.lastUpdated < productsCache.ttl)) {
    return productsCache.data;
  }
  
  // Recargar productos si el caché expiró
  loadProducts();
  return products;
}

// Ruta para autenticación
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Verificar credenciales (en producción usar hash y comparación segura)
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const user = { username, role: 'admin' };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    logger.info('Usuario autenticado', { username });
    
    res.json({ token });
  } else {
    logger.warn('Intento de autenticación fallido', { username });
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

// Ruta para documentación de API
app.get('/api/docs', (req, res) => {
  res.json({
    endpoints: [
      {
        path: '/api/auth/login',
        method: 'POST',
        description: 'Autenticación de usuario',
        requestBody: {
          username: 'string',
          password: 'string'
        }
      },
      {
        path: '/api/assistant',
        method: 'POST',
        description: 'Procesa un mensaje del usuario y devuelve una respuesta del asistente',
        requestBody: {
          message: 'string (mensaje del usuario)'
        }
      },
      {
        path: '/api/products',
        method: 'GET',
        description: 'Obtiene la lista de productos disponibles'
      },
      {
        path: '/api/products/update',
        method: 'POST',
        description: 'Actualiza la lista de productos (requiere autenticación)',
        requestBody: {
          products: 'array (lista de productos)'
        }
      }
    ]
  });
});

// Rutas para la autenticación de Tiendanube
app.get('/api/tiendanube/auth', (req, res) => {
    // URL para iniciar el proceso de autenticación de Tiendanube
    const authUrl = `https://www.tiendanube.com/apps/authorize?client_id=${tiendanubeConfig.clientId}&redirect_uri=${encodeURIComponent(tiendanubeConfig.redirectUri)}`;
    res.json({ authUrl });
});

app.get('/api/tiendanube/callback', async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({ 
                error: 'Código de autorización no proporcionado',
                message: 'No se recibió el código de autorización de Tiendanube.'
            });
        }
        
        // Procesar el código de autorización
        const authResult = await tiendanubeService.processAuthCode(code);
        
        // Redirigir a una página de éxito
        res.redirect(`/auth-success.html?store_id=${authResult.storeId}`);
    } catch (error) {
        logger.error('Error en el callback de Tiendanube', {
            message: error.message,
            query: req.query
        });
        
        // Redirigir a una página de error
        res.redirect('/auth-error.html');
    }
});

// Ruta para obtener productos de Tiendanube
app.get('/api/products', async (req, res) => {
    try {
        const { store_id } = req.query;
        
        if (!store_id) {
            return res.status(400).json({ 
                error: 'ID de tienda no proporcionado',
                message: 'Debes proporcionar el ID de la tienda.'
            });
        }
        
        const products = await tiendanubeService.getProducts(store_id);
        res.json({ products });
    } catch (error) {
        logger.error('Error al obtener productos de Tiendanube', {
            message: error.message,
            store_id: req.query.store_id
        });
        
        if (error.message.includes('Se requiere autenticación')) {
            return res.status(401).json({ 
                error: 'Autenticación requerida',
                message: 'Esta tienda no está autenticada. Por favor, instala la aplicación primero.',
                authUrl: `/api/tiendanube/auth?store_id=${req.query.store_id}`
            });
        }
        
        res.status(500).json({ 
            error: 'Error al obtener productos',
            message: 'No se pudieron obtener los productos de la tienda. Por favor, intenta nuevamente más tarde.'
        });
    }
});

// Ruta para buscar productos
app.get('/api/products/search', async (req, res) => {
    try {
        const { query, store_id } = req.query;
        
        if (!query || typeof query !== 'string') {
            return res.status(400).json({ 
                error: 'Parámetro de búsqueda inválido',
                message: 'Debes proporcionar un término de búsqueda válido.'
            });
        }
        
        if (!store_id) {
            return res.status(400).json({ 
                error: 'ID de tienda no proporcionado',
                message: 'Debes proporcionar el ID de la tienda.'
            });
        }
        
        const products = await tiendanubeService.searchProducts(store_id, query);
        res.json({ products });
    } catch (error) {
        logger.error('Error al buscar productos', {
            message: error.message,
            query: req.query.query,
            store_id: req.query.store_id
        });
        
        if (error.message.includes('Se requiere autenticación')) {
            return res.status(401).json({ 
                error: 'Autenticación requerida',
                message: 'Esta tienda no está autenticada. Por favor, instala la aplicación primero.',
                authUrl: `/api/tiendanube/auth?store_id=${req.query.store_id}`
            });
        }
        
        res.status(500).json({ 
            error: 'Error al buscar productos',
            message: 'No se pudieron buscar los productos. Por favor, intenta nuevamente más tarde.'
        });
    }
});

// Ruta para procesar mensajes del asistente
app.post('/api/assistant', async (req, res) => {
    try {
        const { message, store_id } = req.body;
        
        if (!message || typeof message !== 'string') {
            logger.error('Mensaje inválido recibido', { message });
            return res.status(400).json({ error: 'Mensaje inválido' });
        }
        
        if (!store_id) {
            logger.error('ID de tienda no proporcionado', { store_id });
            return res.status(400).json({ 
                error: 'ID de tienda no proporcionado',
                message: 'Debes proporcionar el ID de la tienda.'
            });
        }
        
        logger.info('Procesando mensaje del asistente', { message, store_id });
        
        // Verificar que tenemos la API key
        if (!redpillConfig.apiKey) {
            logger.error('API key no configurada');
            return res.status(500).json({ 
                error: 'Error de configuración del servidor',
                message: 'Por favor, contacta al administrador del sistema.'
            });
        }

        // Obtener productos de Tiendanube
        let products = [];
        try {
            products = await tiendanubeService.getProducts(store_id);
        } catch (error) {
            logger.error('Error al obtener productos de Tiendanube para el asistente', {
                message: error.message,
                store_id
            });
            
            if (error.message.includes('Se requiere autenticación')) {
                return res.status(401).json({ 
                    error: 'Autenticación requerida',
                    message: 'Esta tienda no está autenticada. Por favor, instala la aplicación primero.',
                    authUrl: `/api/tiendanube/auth?store_id=${store_id}`
                });
            }
            
            // Continuar con productos vacíos
        }

        // Procesar el mensaje con la API
        try {
            const apiResponse = await axiosInstance.post('/chat/completions', {
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente virtual de ${storeContext.storeName} (${storeContext.storeUrl}). 
                        Tu función es ayudar a los clientes con información sobre nuestros productos y servicios.
                        Solo debes hablar sobre los productos que tenemos en nuestra tienda.
                        Si te preguntan por productos que no tenemos, indícales amablemente que no los tenemos disponibles.
                        Siempre menciona que somos ${storeContext.storeName} y que pueden visitarnos en ${storeContext.storeUrl}.
                        
                        Información de productos disponibles:
                        ${products.map(p => `- ${p.name}: ${p.description} (Precio: $${p.price})`).join('\n')}`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                model: "anthropic/claude-3.7-sonnet",
                temperature: 0.7,
                max_tokens: 150
            }, {
                headers: {
                    'Authorization': `Bearer ${redpillConfig.apiKey}`
                }
            });

            logger.info('Respuesta recibida de la API', { 
                status: apiResponse.status,
                data: apiResponse.data
            });

            // Verificar que la respuesta tiene la estructura esperada
            if (!apiResponse.data || !apiResponse.data.choices || !apiResponse.data.choices[0] || !apiResponse.data.choices[0].message) {
                logger.error('Respuesta inválida de la API', { response: apiResponse.data });
                return res.status(500).json({ 
                    error: 'Error en el servicio de IA',
                    message: 'Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta nuevamente.'
                });
            }

            // Analizar si la respuesta requiere productos
            const responseContent = apiResponse.data.choices[0].message.content.toLowerCase();
            const shouldIncludeProducts = responseContent.includes('producto') || 
                                       responseContent.includes('productos') || 
                                       responseContent.includes('precio') || 
                                       responseContent.includes('catalogo') ||
                                       responseContent.includes('catálogo') ||
                                       responseContent.includes('disponible') ||
                                       responseContent.includes('stock');

            // Procesar la respuesta y generar una respuesta adecuada
            const response = {
                message: apiResponse.data.choices[0].message.content || "Lo siento, no pude procesar tu mensaje correctamente.",
                products: shouldIncludeProducts ? products : [] // Usar productos de Tiendanube
            };

            logger.info('Respuesta del asistente generada', { 
                userMessage: message,
                assistantResponse: response.message,
                includesProducts: shouldIncludeProducts
            });

            res.json(response);
        } catch (apiError) {
            logger.error('Error al comunicarse con la API de OpenAI', {
                message: apiError.message,
                response: apiError.response?.data,
                status: apiError.response?.status,
                stack: apiError.stack
            });
            
            // Manejar específicamente el error de API key inválida
            if (apiError.response?.status === 401) {
                return res.status(500).json({ 
                    error: 'Error de autenticación',
                    message: 'Lo siento, hay un problema con la configuración del sistema. Por favor, contacta al administrador.'
                });
            }
            
            // Si hay un error con la API, devolver una respuesta genérica
            const response = {
                message: "Lo siento, estoy teniendo problemas para conectarme con el servicio de IA. Por favor, intenta nuevamente en unos momentos.",
                products: [] // No incluir productos en caso de error
            };
            
            res.json(response);
        }
    } catch (error) {
        logger.error('Error al procesar mensaje del asistente', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            stack: error.stack
        });
        
        // Enviar una respuesta más específica al cliente
        res.status(500).json({ 
            error: 'Error al procesar la solicitud',
            message: 'Lo siento, ocurrió un error inesperado. Por favor, intenta nuevamente.',
            products: [] // No incluir productos en caso de error
        });
    }
});

// Ruta para actualizar productos (protegida con autenticación)
app.post('/api/products/update', authenticateToken, (req, res) => {
    try {
        const newProducts = req.body.products;
        if (!Array.isArray(newProducts)) {
            return res.status(400).json({ error: 'Formato de productos inválido' });
        }
        
        // Validar cada producto
        const validProducts = [];
        const invalidProducts = [];
        
        newProducts.forEach(product => {
            const { error } = productSchema.validate(product);
            if (error) {
                invalidProducts.push({ product, error: error.details });
            } else {
                validProducts.push(product);
            }
        });
        
        if (invalidProducts.length > 0) {
            logger.warn('Productos inválidos detectados', { invalidProducts });
            return res.status(400).json({ 
                error: 'Algunos productos son inválidos',
                invalidProducts
            });
        }
        
        // Actualizar productos
        products = validProducts;
        productsCache.data = validProducts;
        productsCache.lastUpdated = Date.now();
        
        // Guardar en archivo
        const productsPath = path.join(__dirname, 'data', 'products.json');
        const dataDir = path.dirname(productsPath);
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
        
        logger.info(`Actualizados ${products.length} productos por ${req.user.username}`);
        
        res.json({ 
            success: true, 
            message: `Actualizados ${products.length} productos` 
        });
    } catch (error) {
        logger.error('Error al actualizar productos', { error: error.message });
        res.status(500).json({ error: 'Error al actualizar productos' });
    }
});

// Ruta para estadísticas de uso (protegida con autenticación)
app.get('/api/stats', authenticateToken, (req, res) => {
    try {
        // Leer logs para generar estadísticas
        const logPath = path.join(__dirname, 'logs', 'combined.log');
        let logContent = '';
        
        if (fs.existsSync(logPath)) {
            logContent = fs.readFileSync(logPath, 'utf8');
        }
        
        // Análisis básico de logs
        const assistantMessages = (logContent.match(/Procesando mensaje del asistente/g) || []).length;
        const assistantResponses = (logContent.match(/Respuesta del asistente generada/g) || []).length;
        const errors = (logContent.match(/Error al procesar mensaje del asistente/g) || []).length;
        
        res.json({
            totalMessages: assistantMessages,
            successfulResponses: assistantResponses,
            errors: errors,
            successRate: assistantMessages > 0 ? (assistantResponses / assistantMessages * 100).toFixed(2) + '%' : '0%',
            productsCount: products.length,
            cacheLastUpdated: productsCache.lastUpdated ? new Date(productsCache.lastUpdated).toISOString() : null
        });
    } catch (error) {
        logger.error('Error al generar estadísticas', { error: error.message });
        res.status(500).json({ error: 'Error al generar estadísticas' });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    logger.error('Error no manejado', { 
        error: err.message,
        stack: err.stack
    });
    
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Servidor corriendo en puerto ${PORT}`);
}); 