# Asistente Virtual para Tiendanube

Este proyecto implementa un asistente virtual inteligente para tiendas Tiendanube utilizando OpenAI para el procesamiento de lenguaje natural y recomendaciones de productos.

## Características

- Integración con OpenAI para procesamiento de lenguaje natural
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
- Cuenta en OpenAI con API key

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
     - REDPILL_API_KEY (tu API key de OpenAI)
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

## Solución de Problemas

### Error de conexión con OpenAI

Si experimentas errores de conexión con OpenAI, verifica:

1. Que tu API key sea válida y esté correctamente configurada en el archivo `.env`
2. Que tengas acceso a internet y que no haya restricciones de firewall
3. Que la URL de la API sea correcta (https://api.openai.com)

### Error 500 en el servidor

Si el servidor devuelve un error 500:

1. Revisa los logs en la carpeta `logs/` para obtener más información
2. Verifica que todas las dependencias estén instaladas correctamente
3. Asegúrate de que el archivo `products.json` exista y tenga un formato válido

## Soporte

Para soporte técnico o consultas, por favor contacta a [tu-email@dominio.com]

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 