// Arbell Chatbot Integration Script
(function() {
    // Configuración inicial
    const config = {
        apiUrl: 'https://ai-cosmetik-production.up.railway.app',
        chatbotContainer: 'asistente-ia-container'
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
            z-index: 1000;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: none;
            flex-direction: column;
            overflow: hidden;
        `;

        // Chat header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 15px;
            background: #007bff;
            color: white;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = `
            <span>Asistente IA Arbell</span>
            <button style="background: none; border: none; color: white; cursor: pointer;">_</button>
        `;

        // Chat messages container
        const messagesContainer = document.createElement('div');
        messagesContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
        `;

        // Chat input area
        const inputArea = document.createElement('div');
        inputArea.style.cssText = `
            padding: 15px;
            border-top: 1px solid #eee;
            display: flex;
        `;
        inputArea.innerHTML = `
            <input type="text" placeholder="Escribe tu mensaje..." style="
                flex: 1;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-right: 8px;
            ">
            <button style="
                padding: 8px 15px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
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

        // Event listeners
        chatButton.onclick = () => {
            const isVisible = container.style.display === 'flex';
            container.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) {
                inputArea.querySelector('input').focus();
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
        
        sendButton.onclick = () => {
            const message = input.value.trim();
            if (message) {
                addMessage(message, true);
                input.value = '';
                sendMessage(message);
            }
        };

        input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
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
            padding: 10px;
            border-radius: 10px;
            max-width: 80%;
            ${isUser ? 'margin-left: auto; background: #007bff; color: white;' : 'background: #f0f0f0;'}
        `;
        messageDiv.textContent = message;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Función para obtener el store_id de la URL
    function getStoreIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('store_id');
    }

    // Función para enviar mensaje
    async function sendMessage(message) {
        if (!message.trim()) return;
        
        const storeId = getStoreIdFromUrl() || window.Tiendanube?.store?.id;
        if (!storeId) {
            addMessage('Error: No se pudo identificar la tienda. Por favor, contacta al soporte.');
            return;
        }

        try {
            addMessage('Procesando tu mensaje...', false);
            
            const response = await fetch(`${config.apiUrl}/api/assistant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message,
                    store_id: storeId
                })
            });

            const data = await response.json();
            
            // Remove loading message
            const messagesContainer = document.querySelector(`#${config.chatbotContainer} > div:nth-child(2)`);
            if (messagesContainer) {
                messagesContainer.removeChild(messagesContainer.lastChild);
            }

            if (!response.ok) {
                throw new Error(data.error || 'Error en la comunicación con el servidor');
            }

            addMessage(data.message || 'Lo siento, ocurrió un error inesperado.', false);
            
        } catch (error) {
            console.error('Error:', error);
            addMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente.', false);
        }
    }

    // Función para inicializar el chatbot
    function initChatbot() {
        const storeId = getStoreIdFromUrl() || window.Tiendanube?.store?.id;
        
        if (!storeId) {
            console.error('Error: ID de tienda no proporcionado');
            return;
        }

        const ui = createChatbotUI();
        
        // Initialize connection with backend
        fetch(`${config.apiUrl}/api/store/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
            addMessage('¡Hola! Soy el asistente virtual de Arbell. ¿En qué puedo ayudarte?', false);
        })
        .catch(error => {
            console.error('Arbell: Error al inicializar el chatbot', error);
            addMessage('Lo siento, hay un problema de conexión. Por favor, intenta más tarde.', false);
        });
    }

    // Load script when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbot);
    } else {
        initChatbot();
    }
})(); 