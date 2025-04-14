(function() {
    // Configuración por defecto
    const defaultConfig = {
        theme: 'light',
        position: 'bottom-right',
        apiKey: '',
        storeId: window.Tiendanube?.store_id || ''
    };

    // Función para cargar la configuración
    function loadConfig() {
        return new Promise((resolve) => {
            if (window.Tiendanube?.app?.settings) {
                resolve({
                    ...defaultConfig,
                    ...window.Tiendanube.app.settings
                });
            } else {
                resolve(defaultConfig);
            }
        });
    }

    // Función para crear el widget
    function createWidget(config) {
        // Crear contenedor principal
        const container = document.createElement('div');
        container.id = 'arbell-ai-chat';
        container.className = `arbell-ai-chat ${config.theme} ${config.position}`;
        
        // Crear botón flotante
        const button = document.createElement('button');
        button.className = 'arbell-ai-chat-button';
        button.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
        
        // Crear contenedor del chat
        const chatContainer = document.createElement('div');
        chatContainer.className = 'arbell-ai-chat-container';
        chatContainer.style.display = 'none';
        
        // Crear área de mensajes
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'arbell-ai-messages';
        
        // Crear área de entrada
        const inputContainer = document.createElement('div');
        inputContainer.className = 'arbell-ai-input-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Escribe tu mensaje...';
        input.className = 'arbell-ai-input';
        
        const sendButton = document.createElement('button');
        sendButton.className = 'arbell-ai-send-button';
        sendButton.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
        
        // Ensamblar el widget
        inputContainer.appendChild(input);
        inputContainer.appendChild(sendButton);
        chatContainer.appendChild(messagesContainer);
        chatContainer.appendChild(inputContainer);
        container.appendChild(button);
        container.appendChild(chatContainer);
        
        // Agregar estilos
        const styles = document.createElement('style');
        styles.textContent = `
            .arbell-ai-chat {
                position: fixed;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            }
            
            .arbell-ai-chat.bottom-right {
                bottom: 20px;
                right: 20px;
            }
            
            .arbell-ai-chat.bottom-left {
                bottom: 20px;
                left: 20px;
            }
            
            .arbell-ai-chat-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: #007bff;
                border: none;
                color: white;
                cursor: pointer;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                transition: transform 0.2s;
            }
            
            .arbell-ai-chat-button:hover {
                transform: scale(1.1);
            }
            
            .arbell-ai-chat-container {
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .arbell-ai-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .arbell-ai-message {
                margin-bottom: 10px;
                padding: 10px;
                border-radius: 10px;
                max-width: 80%;
            }
            
            .arbell-ai-message.user {
                background: #007bff;
                color: white;
                margin-left: auto;
            }
            
            .arbell-ai-message.assistant {
                background: #f0f0f0;
                color: #333;
            }
            
            .arbell-ai-input-container {
                display: flex;
                padding: 10px;
                border-top: 1px solid #eee;
            }
            
            .arbell-ai-input {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 20px;
                margin-right: 10px;
                outline: none;
            }
            
            .arbell-ai-send-button {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #007bff;
                border: none;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .arbell-ai-chat.dark {
                background: #333;
                color: white;
            }
            
            .arbell-ai-chat.dark .arbell-ai-chat-container {
                background: #444;
            }
            
            .arbell-ai-chat.dark .arbell-ai-message.assistant {
                background: #555;
                color: white;
            }
            
            .arbell-ai-chat.dark .arbell-ai-input {
                background: #555;
                border-color: #666;
                color: white;
            }
        `;
        
        document.head.appendChild(styles);
        document.body.appendChild(container);
        
        // Funcionalidad del chat
        let isOpen = false;
        
        button.addEventListener('click', () => {
            isOpen = !isOpen;
            chatContainer.style.display = isOpen ? 'flex' : 'none';
            button.style.display = isOpen ? 'none' : 'block';
        });
        
        // Función para enviar mensaje
        async function sendMessage(message) {
            if (!message.trim()) return;
            
            // Agregar mensaje del usuario
            addMessage(message, true);
            input.value = '';
            
            try {
                const response = await fetch('https://super-broccoli-x5wq9r55vhv6wv-3000.app.github.dev/api/assistant', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.apiKey}`
                    },
                    body: JSON.stringify({
                        message,
                        store_id: config.storeId
                    })
                });
                
                const data = await response.json();
                
                if (data.message) {
                    addMessage(data.message);
                }
                
                if (data.products && data.products.length > 0) {
                    displayProducts(data.products);
                }
            } catch (error) {
                console.error('Error:', error);
                addMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.');
            }
        }
        
        // Función para agregar mensaje
        function addMessage(message, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `arbell-ai-message ${isUser ? 'user' : 'assistant'}`;
            messageDiv.textContent = message;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Función para mostrar productos
        function displayProducts(products) {
            const productsDiv = document.createElement('div');
            productsDiv.className = 'arbell-ai-message assistant';
            
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'arbell-ai-product-card';
                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://super-broccoli-x5wq9r55vhv6wv-3000.app.github.dev/images/placeholder.jpg'">
                    <h3>${product.name}</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <a href="${product.url}" target="_blank">Ver producto</a>
                `;
                productsDiv.appendChild(productCard);
            });
            
            messagesContainer.appendChild(productsDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Event listeners
        sendButton.addEventListener('click', () => sendMessage(input.value));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage(input.value);
            }
        });
        
        // Mensaje de bienvenida
        addMessage('¡Hola! Soy el Asistente IA. ¿En qué puedo ayudarte hoy?');
    }

    // Inicializar el widget
    loadConfig().then(config => {
        if (config.apiKey && config.storeId) {
            createWidget(config);
        } else {
            console.error('Asistente IA: API Key o Store ID no configurados');
        }
    });
})(); 