document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const chatContainer = document.querySelector('.chat-container');

    let isMinimized = false;

    // Función para agregar mensajes al chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Función para mostrar productos
    function displayProducts(products) {
        const productsDiv = document.createElement('div');
        productsDiv.className = 'message assistant';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">$${product.price}</p>
                <p class="description">${product.description}</p>
                <a href="#" target="_blank">Ver producto</a>
            `;
            productsDiv.appendChild(productCard);
        });

        chatMessages.appendChild(productsDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Función para enviar mensaje al servidor
    async function sendMessage(message, retryCount = 0) {
        try {
            // Mostrar indicador de carga
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'message assistant';
            loadingMessage.textContent = 'Procesando tu mensaje...';
            chatMessages.appendChild(loadingMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            const response = await fetch('/api/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            // Eliminar el indicador de carga
            chatMessages.removeChild(loadingMessage);

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.details || 'Error en la comunicación con el servidor');
            }
            
            // Mostrar respuesta del asistente
            if (data.message) {
                addMessage(data.message);
            } else {
                throw new Error('No se recibió una respuesta válida del asistente');
            }
            
            // Si hay productos, mostrarlos
            if (data.products && data.products.length > 0) {
                displayProducts(data.products);
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Si es un error de red y no hemos excedido los reintentos, intentar nuevamente
            if ((error.message.includes('Failed to fetch') || 
                 error.message.includes('Network Error') || 
                 error.message.includes('connection')) && 
                retryCount < 3) {
                
                addMessage('Reintentando conexión...');
                setTimeout(() => {
                    sendMessage(message, retryCount + 1);
                }, 2000); // Esperar 2 segundos antes de reintentar
                return;
            }
            
            // Si hemos excedido los reintentos o es otro tipo de error
            addMessage(`Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta nuevamente en unos momentos.`);
        }
    }

    // Event listener para el botón de enviar
    sendBtn.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';
            sendMessage(message);
        }
    });

    // Event listener para la tecla Enter
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

    // Event listener para minimizar/maximizar
    minimizeBtn.addEventListener('click', () => {
        isMinimized = !isMinimized;
        if (isMinimized) {
            chatContainer.style.height = '50px';
            chatMessages.style.display = 'none';
            document.querySelector('.chat-input').style.display = 'none';
            minimizeBtn.textContent = '+';
        } else {
            chatContainer.style.height = '500px';
            chatMessages.style.display = 'block';
            document.querySelector('.chat-input').style.display = 'flex';
            minimizeBtn.textContent = '_';
        }
    });
}); 