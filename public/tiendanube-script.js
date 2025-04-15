// Arbell Chatbot Integration Script
(function() {
    // Configuración inicial
    const config = {
        apiUrl: 'https://ai-cosmetik-production.up.railway.app',
        chatbotContainer: 'asistente-ia-container',
        version: 'v1.1'
    };

    // Create chatbot container with full interface
    function createChatbotUI() {
        const container = document.createElement('div');
        container.id = config.chatbotContainer;
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            height: 500px;
            z-index: 9999;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: Arial, sans-serif;
        `;

        // Chat header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 15px;
            background: #6B4E71;
            color: white;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 10px 10px 0 0;
        `;
        header.innerHTML = `
            <span>Asistente Virtual Arbell</span>
            <button style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">_</button>
        `;

        // Chat messages container
        const messagesContainer = document.createElement('div');
        messagesContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            background: #f8f9fa;
        `;

        // Chat input area
        const inputArea = document.createElement('div');
        inputArea.style.cssText = `
            padding: 15px;
            border-top: 1px solid #eee;
            display: flex;
            background: white;
        `;
        inputArea.innerHTML = `
            <input type="text" placeholder="Escribe tu mensaje..." style="
                flex: 1;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-right: 8px;
                font-size: 14px;
            ">
            <button style="
                padding: 8px 15px;
                background: #6B4E71;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: background 0.3s;
            ">Enviar</button>
        `;

        // Append all elements
        container.appendChild(header);
        container.appendChild(messagesContainer);
        container.appendChild(inputArea);
        
        // Chat button
        const chatButton = document.createElement('button');
        chatButton.innerHTML = '💬';
        chatButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: #6B4E71;
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            transition: transform 0.3s;
        `;
        
        document.body.appendChild(container);
        document.body.appendChild(chatButton);

        // Event listeners
        chatButton.onclick = () => {
            const isVisible = container.style.display === 'flex';
            container.style.display = isVisible ? 'none' : 'flex';
            chatButton.style.transform = isVisible ? 'scale(1)' : 'scale(0)';
            if (!isVisible) {
                inputArea.querySelector('input').focus();
                // Mostrar mensaje de bienvenida si es la primera vez
                if (!container.dataset.initialized) {
                    addMessage('¡Hola! Soy el asistente virtual de Arbell. ¿En qué puedo ayudarte?', false);
                    container.dataset.initialized = 'true';
                }
            }
        };

        const minimizeBtn = header.querySelector('button');
        let isMinimized = false;
        minimizeBtn.onclick = () => {
            isMinimized = !isMinimized;
            if (isMinimized) {
                container.style.height = '60px';
                messagesContainer.style.display = 'none';
                inputArea.style.display = 'none';
                minimizeBtn.textContent = '+';
            } else {
                container.style.height = '500px';
                messagesContainer.style.display = 'block';
                inputArea.style.display = 'flex';
                minimizeBtn.textContent = '_';
            }
        };

        const sendButton = inputArea.querySelector('button');
        const input = inputArea.querySelector('input');
        
        const handleSendMessage = () => {
            const message = input.value.trim();
            if (message) {
                addMessage(message, true);
                input.value = '';
                input.focus();
                sendMessage(message);
            }
        };

        sendButton.onclick = handleSendMessage;

        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        };

        return {
            container,
            messagesContainer,
            input: inputArea.querySelector('input')
        };
    }

    // Add message to chat
    function addMessage(message, isUser = false) {
        const messagesContainer = document.querySelector(`#${config.chatbotContainer} > div:nth-child(2)`);
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin: 10px 0;
            padding: 12px;
            border-radius: 10px;
            max-width: 80%;
            word-wrap: break-word;
            ${isUser ? 
                'margin-left: auto; background: #6B4E71; color: white;' : 
                'background: white; border: 1px solid #eee; box-shadow: 0 1px 2px rgba(0,0,0,0.1);'}
        `;
        messageDiv.textContent = message;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Función para obtener el store_id
    function getStoreId() {
        return window.Tiendanube?.store?.id || 
               new URLSearchParams(window.location.search).get('store_id');
    }

    // Función para enviar mensaje
    async function sendMessage(message) {
        if (!message.trim()) return;
        
        const storeId = getStoreId();
        if (!storeId) {
            addMessage('Error: No se pudo identificar la tienda. Por favor, contacta al soporte.', false);
            return;
        }

        try {
            const loadingMessage = 'Procesando tu mensaje...';
            addMessage(loadingMessage, false);
            
            const response = await fetch(`${config.apiUrl}/api/assistant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-App-Version': config.version
                },
                body: JSON.stringify({ 
                    message,
                    store_id: storeId
                })
            });

            const data = await response.json();
            
            // Remove loading message
            const messagesContainer = document.querySelector(`#${config.chatbotContainer} > div:nth-child(2)`);
            if (messagesContainer && messagesContainer.lastChild.textContent === loadingMessage) {
                messagesContainer.removeChild(messagesContainer.lastChild);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Error en la comunicación con el servidor');
            }

            addMessage(data.message || data.response || 'Lo siento, ocurrió un error inesperado.', false);
            
        } catch (error) {
            console.error('Error:', error);
            addMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.', false);
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }

    // Función para inicializar el chatbot
    function initChatbot() {
        const storeId = getStoreId();
        
        if (!storeId) {
            console.error('Error: ID de tienda no proporcionado');
            return;
        }

        createChatbotUI();
        
        // Initialize connection with backend
        fetch(`${config.apiUrl}/api/store/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-App-Version': config.version
            },
            body: JSON.stringify({
                id: storeId,
                name: window.LS?.store?.name || 'Tienda',
                language: document.documentElement.lang || 'es'
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Arbell: Chatbot inicializado correctamente');
        })
        .catch(error => {
            console.error('Error al inicializar el chatbot:', error);
        });
    }
})(); 