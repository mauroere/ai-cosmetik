(function() {
    // Configuración inicial
    const config = {
        baseUrl: 'https://super-broccoli-x5wq9r55vhv6wv-3000.app.github.dev',
        version: '1.0.0'
    };

    // Función para cargar el CSS
    function loadStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${config.baseUrl}/css/asistente-ia.css`;
        document.head.appendChild(link);
    }

    // Función para cargar el script principal
    function loadMainScript() {
        const script = document.createElement('script');
        script.src = `${config.baseUrl}/js/asistente-ia.js`;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    }

    // Función para inicializar el widget
    function initWidget() {
        window.AsistenteIA = {
            storeId: window.LS ? window.LS.store.id : null,
            currency: window.LS ? window.LS.cart.currency : 'ARS',
            language: document.documentElement.lang || 'es',
            theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        };
    }

    // Función principal de inicialización
    function init() {
        // Verificar si ya está inicializado
        if (window.AsistenteIALoaded) return;
        window.AsistenteIALoaded = true;

        // Cargar estilos y scripts
        loadStyles();
        loadMainScript();
        initWidget();

        // Notificar al servidor
        fetch(`${config.baseUrl}/api/tracking/install`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                store_id: window.AsistenteIA.storeId,
                url: window.location.href,
                platform: 'tiendanube'
            })
        }).catch(console.error); // Ignorar errores de tracking
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 