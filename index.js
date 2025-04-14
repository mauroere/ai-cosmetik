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

const app = express();

// Configuración del logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Configuración de trust proxy
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 solicitudes por ventana
  keyGenerator: (req) => {
    return req.ip; // Usar IP directamente en lugar de X-Forwarded-For
  }
});
app.use('/api/', limiter);

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
    baseURL: 'https://api.redpill.ai'  // URL base
};

// Esquema de validación para productos
const productSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().required().min(10).max(500),
  price: Joi.number().required().min(0),
  image: Joi.string().uri().required(),
  category: Joi.string().required(),
  stock: Joi.number().integer().min(0).required()
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

// Ruta para procesar mensajes del asistente
app.post('/api/assistant', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string') {
          return res.status(400).json({ error: 'Mensaje inválido' });
        }
        
        logger.info('Procesando mensaje del asistente', { message });
        
        // Procesar el mensaje con Redpill.ai
        const redpillResponse = await axios.post(`${redpillConfig.baseURL}/v1/chat/completions`, {
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

        // Procesar la respuesta y generar una respuesta adecuada
        const response = {
            message: redpillResponse.data.choices[0].message.content,
            products: getProducts() // Usar función con caché
        };

        logger.info('Respuesta del asistente generada', { 
          userMessage: message,
          assistantResponse: response.message
        });

        res.json(response);
    } catch (error) {
        logger.error('Error al procesar mensaje del asistente', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        res.status(500).json({ 
            error: 'Error al procesar la solicitud',
            details: error.response?.data || error.message
        });
    }
});

// Ruta para obtener información de productos
app.get('/api/products', (req, res) => {
    try {
        const products = getProducts();
        res.json({ products });
    } catch (error) {
        logger.error('Error al obtener productos', { error: error.message });
        res.status(500).json({ error: 'Error al obtener productos' });
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