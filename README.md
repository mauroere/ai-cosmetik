# Asistente Virtual para Tiendanube

Este proyecto implementa un asistente virtual inteligente para tiendas Tiendanube utilizando Redpill.ai para el procesamiento de lenguaje natural y recomendaciones de productos.

## Características

- Integración con Tiendanube API
- Procesamiento de lenguaje natural con Redpill.ai
- Interfaz de chat interactiva
- Recomendaciones de productos
- Soporte al cliente
- Información de productos
- Consultas de precios

## Requisitos

- Node.js (v14 o superior)
- Cuenta en Tiendanube con API habilitada
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
     - TIENDANUBE_API_KEY
     - TIENDANUBE_API_SECRET
     - TIENDANUBE_STORE_ID
     - REDPILL_API_KEY

4. Iniciar el servidor:
```bash
npm start
```

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

## Uso

El asistente virtual aparecerá como un widget flotante en la esquina inferior derecha de tu tienda. Los usuarios pueden:

- Hacer preguntas sobre productos
- Solicitar recomendaciones
- Consultar precios
- Obtener información de productos
- Recibir soporte al cliente

## Personalización

Puedes personalizar la apariencia del asistente modificando los archivos:
- `public/styles.css` para el diseño
- `public/index.html` para la estructura
- `public/app.js` para la funcionalidad

## Soporte

Para soporte técnico o consultas, por favor contacta a [tu-email@dominio.com]

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 