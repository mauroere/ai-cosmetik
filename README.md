# AI Cosmetik

Asistente virtual inteligente para tienda de cosméticos.

## Requisitos

- Node.js >= 16.0.0
- NPM >= 8.0.0

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/ai-cosmetik.git
cd ai-cosmetik
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo `.env` con las variables de entorno necesarias:
```
REDPILL_API_KEY=tu-api-key
```

4. Iniciar en modo desarrollo:
```bash
npm run dev
```

## Despliegue en Railway

1. Crear una cuenta en [Railway](https://railway.app)
2. Conectar tu repositorio de GitHub
3. Crear un nuevo proyecto seleccionando el repositorio
4. Configurar las variables de entorno en Railway
5. ¡Listo! Railway desplegará automáticamente tu aplicación

## Estructura del Proyecto

```
.
├── data/               # Datos de productos
├── public/            # Archivos estáticos
├── index.js           # Punto de entrada
├── package.json       # Dependencias y scripts
└── README.md          # Este archivo
```

## Licencia

MIT 