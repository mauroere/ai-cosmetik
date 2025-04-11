# Asistente Virtual para Tiendanube

Este proyecto implementa un asistente virtual inteligente para tiendas Tiendanube utilizando Redpill.ai para el procesamiento de lenguaje natural y recomendaciones de productos.

## Características

- Integración con Redpill.ai para procesamiento de lenguaje natural
- Interfaz de chat interactiva
- Recomendaciones de productos
- Soporte al cliente
- Información de productos
- Consultas de precios
- Sistema de caché para mejorar el rendimiento
- Validación de datos para garantizar la integridad
- Sistema de logging para monitoreo y depuración
- Rate limiting para proteger contra abusos
- Documentación de API integrada

## Requisitos

- Node.js (v14 o superior)
- Cuenta en Redpill.ai con API key

## Instalación

1. Clonar el repositorio:
```bash
git clone [url-del-repositorio]
cd ai-cosmetik
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
   - Copiar `.env.example` a `.env`
   - Completar las variables con tus credenciales:
     - REDPILL_API_KEY
     - NODE_ENV (opcional, por defecto es 'development')

4. Iniciar el servidor:
```bash
npm start
```

## Estructura del Proyecto

```
ai-cosmetik/
├── data/                  # Datos de productos
│   └── products.json      # Archivo JSON con productos
├── logs/                  # Archivos de log
│   ├── error.log          # Log de errores
│   └── combined.log       # Log general
├── public/                # Archivos estáticos
│   ├── index.html         # Interfaz del chat
│   ├── styles.css         # Estilos
│   └── app.js             # Lógica del cliente
├── .env                   # Variables de entorno
├── .env.example           # Plantilla de variables de entorno
├── index.js               # Servidor principal
├── package.json           # Dependencias y scripts
└── README.md              # Documentación
```

## API Endpoints

### Documentación de API
- `GET /api/docs` - Obtiene documentación de la API

### Asistente Virtual
- `POST /api/assistant` - Procesa un mensaje del usuario y devuelve una respuesta del asistente
  - Request: `{ "message": "texto del mensaje" }`
  - Response: `{ "message": "respuesta del asistente", "products": [...] }`

### Productos
- `GET /api/products` - Obtiene la lista de productos disponibles
- `POST /api/products/update` - Actualiza la lista de productos
  - Request: `{ "products": [...] }`

## Integración en Tiendanube

1. En el panel de administración de Tiendanube, ve a "Configuración" > "Código personalizado"
2. Agrega el siguiente código en el footer de tu tienda:

```html
<script>
    // Cargar el asistente virtual
    const script = document.createElement('script');
    script.src = 'URL_DE_TU_SERVIDOR/public/app.js';
    document.body.appendChild(script);
</script>
```

## Personalización

Puedes personalizar la apariencia del asistente modificando los archivos:
- `public/styles.css` para el diseño
- `public/index.html` para la estructura
- `public/app.js` para la funcionalidad

## Monitoreo y Mantenimiento

El sistema incluye:
- Logs detallados en la carpeta `logs/`
- Rate limiting para proteger contra abusos
- Validación de datos para garantizar la integridad
- Sistema de caché para mejorar el rendimiento

## Soporte

Para soporte técnico o consultas, por favor contacta a [tu-email@dominio.com]

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 