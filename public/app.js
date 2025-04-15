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
            
            // Usar una imagen de placeholder si la imagen del producto no se puede cargar
            const imgElement = document.createElement('img');
            imgElement.alt = product.name;
            imgElement.onerror = function() {
                this.src = '/images/placeholder.jpg';
                this.onerror = null; // Evitar bucle infinito
            };
            imgElement.src = product.image;
            
            // Crear el enlace al producto en Tiendanube
            const productUrl = product.url || `https://www.arbellonline.com.ar/productos/${product.id}`;
            
            productCard.innerHTML = `
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <p class="description">${product.description}</p>
                <a href="${productUrl}" target="_blank" class="product-link">Ver producto en Arbell Online</a>
            `;
            
            // Insertar la imagen al principio del productCard
            productCard.insertBefore(imgElement, productCard.firstChild);
            
            productsDiv.appendChild(productCard);
        });

        chatMessages.appendChild(productsDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Función para obtener el store_id de la URL
    function getStoreIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('store_id');
    }

    // Función para enviar mensaje
    async function sendMessage(message, retryCount = 0) {
        if (!message.trim()) return;
        
        // Obtener store_id de la URL o del contexto de Tiendanube
        const storeId = getStoreIdFromUrl() || window.Tiendanube?.store?.id;
        if (!storeId) {
            console.error('Error: ID de tienda no proporcionado');
            return;
        }

        try {
            // Mostrar indicador de carga
            const loadingMessage = document.createElement('div');
            loadingMessage.className = 'message assistant';
            loadingMessage.textContent = 'Procesando tu mensaje...';
            chatMessages.appendChild(loadingMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Obtener la URL base del servidor y el store_id
            const baseUrl = window.location.origin;
            const apiUrl = `${baseUrl}/api/assistant`;

            console.log('Enviando solicitud a:', apiUrl);

            // Configurar un timeout para la solicitud
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message,
                    store_id: storeId
                }),
                signal: controller.signal
            });

            // Limpiar el timeout
            clearTimeout(timeoutId);

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
                 error.message.includes('connection') ||
                 error.name === 'AbortError') && 
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
            const message = userInput.value;
            sendMessage(message);
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