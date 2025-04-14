const axios = require('axios');
const tiendanubeConfig = require('../config/tiendanube');
const logger = require('../utils/logger');

/**
 * Servicio para interactuar con la API de Tiendanube
 */
class TiendanubeService {
    constructor() {
        this.baseURL = 'https://api.tiendanube.com/v1';
        this.userAgent = 'Asesor ARBELL (maurorer@gmail.com)';
    }

    async getClient(storeId, accessToken) {
        return axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authentication': `bearer ${accessToken}`,
                'User-Agent': this.userAgent,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Obtiene el token de acceso para una tienda específica
     * @param {string} storeId ID de la tienda
     * @returns {Promise<string>} Token de acceso
     */
    async getAccessToken(storeId) {
        // Verificar si ya tenemos un token válido para esta tienda
        if (tiendanubeConfig.storeTokens[storeId] && 
            tiendanubeConfig.storeTokens[storeId].expiresAt && 
            tiendanubeConfig.storeTokens[storeId].expiresAt > Date.now()) {
            
            logger.info(`Usando token en caché para la tienda ${storeId}`);
            return tiendanubeConfig.storeTokens[storeId].accessToken;
        }

        // Si no hay token o está expirado, necesitamos obtener uno nuevo
        logger.info(`No hay token válido para la tienda ${storeId}, se requiere autenticación`);
        throw new Error('Se requiere autenticación de la tienda');
    }

    /**
     * Procesa el código de autorización recibido después de la instalación de la app
     * @param {string} authCode Código de autorización
     * @returns {Promise<Object>} Información de la tienda y token de acceso
     */
    async processAuthCode(authCode) {
        try {
            logger.info('Procesando código de autorización de Tiendanube');
            
            const response = await axios.post(tiendanubeConfig.authURL, {
                client_id: tiendanubeConfig.clientId,
                client_secret: tiendanubeConfig.clientSecret,
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: tiendanubeConfig.redirectUri
            });

            if (!response.data || !response.data.access_token || !response.data.user_id) {
                throw new Error('Respuesta inválida de Tiendanube');
            }

            const storeId = response.data.user_id;
            const accessToken = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600; // Por defecto 1 hora
            
            // Almacenar el token
            tiendanubeConfig.storeTokens[storeId] = {
                accessToken,
                expiresAt: Date.now() + (expiresIn * 1000)
            };

            logger.info(`Token de acceso obtenido para la tienda ${storeId}`);
            
            return {
                storeId,
                accessToken,
                expiresIn
            };
        } catch (error) {
            logger.error('Error al procesar código de autorización', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            throw new Error('No se pudo autenticar con Tiendanube');
        }
    }

    /**
     * Obtiene todos los productos de una tienda específica
     * @param {string} storeId ID de la tienda
     * @returns {Promise<Array>} Lista de productos
     */
    async getProducts(storeId) {
        // Verificar si hay datos en caché válidos para esta tienda
        if (tiendanubeConfig.cache.enabled && 
            tiendanubeConfig.cache.data && 
            tiendanubeConfig.cache.lastUpdated && 
            (Date.now() - tiendanubeConfig.cache.lastUpdated < tiendanubeConfig.cache.ttl)) {
            
            logger.info(`Usando productos en caché para la tienda ${storeId}`);
            return tiendanubeConfig.cache.data;
        }

        try {
            const accessToken = await this.getAccessToken(storeId);
            
            const response = await this.getClient(storeId, accessToken).get(`/${storeId}/products`);

            // Transformar los productos al formato que espera nuestra aplicación
            const products = response.data.products.map(product => ({
                id: product.id,
                name: product.name.es || product.name,
                description: product.description.es || product.description || '',
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0].src : '/images/placeholder.jpg',
                category: product.categories && product.categories.length > 0 ? product.categories[0].name : 'Sin categoría',
                stock: product.stock || 0,
                url: product.permalink || `https://${storeId}.tiendanube.com/productos/${product.handle}`
            }));

            // Actualizar caché
            if (tiendanubeConfig.cache.enabled) {
                tiendanubeConfig.cache.data = products;
                tiendanubeConfig.cache.lastUpdated = Date.now();
            }

            logger.info(`Obtenidos ${products.length} productos de la tienda ${storeId}`);
            return products;
        } catch (error) {
            logger.error(`Error al obtener productos de la tienda ${storeId}`, {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            // Si hay datos en caché, devolverlos en caso de error
            if (tiendanubeConfig.cache.data) {
                logger.info('Devolviendo productos en caché debido a error');
                return tiendanubeConfig.cache.data;
            }
            
            throw new Error(`No se pudieron obtener los productos de la tienda ${storeId}`);
        }
    }

    /**
     * Busca productos por término de búsqueda en una tienda específica
     * @param {string} storeId ID de la tienda
     * @param {string} query Término de búsqueda
     * @returns {Promise<Array>} Lista de productos que coinciden con la búsqueda
     */
    async searchProducts(storeId, query) {
        try {
            const products = await this.getProducts(storeId);
            
            // Filtrar productos que coincidan con la búsqueda
            const searchResults = products.filter(product => {
                const searchTerm = query.toLowerCase();
                return (
                    product.name.toLowerCase().includes(searchTerm) ||
                    product.description.toLowerCase().includes(searchTerm) ||
                    product.category.toLowerCase().includes(searchTerm)
                );
            });
            
            logger.info(`Búsqueda de productos en tienda ${storeId}: "${query}" - ${searchResults.length} resultados`);
            return searchResults;
        } catch (error) {
            logger.error(`Error al buscar productos en la tienda ${storeId}`, {
                query,
                message: error.message
            });
            throw error;
        }
    }

    async getOrders(storeId, accessToken) {
        try {
            const client = await this.getClient(storeId, accessToken);
            const response = await client.get(`/${storeId}/orders`);
            return response.data;
        } catch (error) {
            logger.error('Error al obtener órdenes', {
                error: error.message,
                store_id: storeId
            });
            throw error;
        }
    }

    async getCustomers(storeId, accessToken) {
        try {
            const client = await this.getClient(storeId, accessToken);
            const response = await client.get(`/${storeId}/customers`);
            return response.data;
        } catch (error) {
            logger.error('Error al obtener clientes', {
                error: error.message,
                store_id: storeId
            });
            throw error;
        }
    }

    async getStoreInfo(storeId, accessToken) {
        try {
            const client = await this.getClient(storeId, accessToken);
            const response = await client.get(`/${storeId}/store`);
            return response.data;
        } catch (error) {
            logger.error('Error al obtener información de la tienda', {
                error: error.message,
                store_id: storeId
            });
            throw error;
        }
    }
}

module.exports = new TiendanubeService(); 