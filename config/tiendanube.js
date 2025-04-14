/**
 * Configuración para la API de Tiendanube
 */
const tiendanubeConfig = {
    // Credenciales de la API de Tiendanube
    clientId: process.env.TIENDANUBE_CLIENT_ID,
    clientSecret: process.env.TIENDANUBE_CLIENT_SECRET,
    redirectUri: process.env.TIENDANUBE_REDIRECT_URI,
    
    // URL base de la API
    baseURL: 'https://api.tiendanube.com/v1',
    authURL: 'https://www.tiendanube.com/apps/authorize/token',
    
    // Configuración de caché
    cache: {
        enabled: true,
        ttl: 30 * 60 * 1000, // 30 minutos en milisegundos
        lastUpdated: null,
        data: null
    },
    
    // Almacenamiento de tokens por tienda
    storeTokens: {},

    // Configuración de la aplicación
    app: {
        name: "Asistente IA",
        version: "1.0.0",
        scopes: ["products", "orders", "customers"],
        mainLocale: "es",
        locales: ["es", "pt"],
        regions: ["AR", "BR", "CL", "CO", "MX", "PE", "UY"]
    }
};

module.exports = tiendanubeConfig; 