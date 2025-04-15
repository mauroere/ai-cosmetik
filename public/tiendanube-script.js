// Arbell Chatbot Integration Script
(function() {
    // Configuración inicial
    const config = {
        apiUrl: 'https://ai-cosmetik-production.up.railway.app',
        chatbotContainer: 'asistente-ia-container'
    };

    // Create chatbot container
    function createChatbotUI() {
        const container = document.createElement('div');
        container.id = config.chatbotContainer;
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: none;
        `;
        
        const chatButton = document.createElement('button');
        chatButton.innerHTML = '💬';
        chatButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: #007bff;
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 1001;
        `;
        
        document.body.appendChild(container);
        document.body.appendChild(chatButton);
        
        chatButton.onclick = () => {
            const isVisible = container.style.display === 'block';
            container.style.display = isVisible ? 'none' : 'block';
        };
    }

    // Función para obtener el store_id de la URL
    function getStoreIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('store_id');
    }

    // Función para inicializar el chatbot
    function initChatbot(container) {
        // Obtener store_id de la URL o del contexto de Tiendanube
        const storeId = getStoreIdFromUrl() || window.Tiendanube?.store?.id;
        
        if (!storeId) {
            console.error('Error: ID de tienda no proporcionado');
            return;
        }

        // Get store information from Tiendanube
        const storeInfo = {
            id: storeId,
            name: window.LS && window.LS.store && window.LS.store.name,
            language: document.documentElement.lang || 'es'
        };

        if (!storeInfo.id) {
            console.error('Arbell: No se pudo obtener la información de la tienda');
            return;
        }

        createChatbotUI();
        
        // Initialize connection with our backend
        fetch(`${config.apiUrl}/api/store/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(storeInfo)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Arbell: Chatbot inicializado correctamente');
        })
        .catch(error => {
            console.error('Arbell: Error al inicializar el chatbot', error);
        });
    }

    // Load script when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initChatbot());
    } else {
        initChatbot();
    }

    // Función para enviar mensaje
    function sendMessage(message) {
        if (!message.trim()) return;
        
        // Obtener store_id actualizado
        const currentStoreId = getStoreIdFromUrl() || window.Tiendanube?.store?.id;
        if (!currentStoreId) {
            console.error('Error: ID de tienda no proporcionado');
            return;
        }

        // ... existing code ...
    }
})(); 