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
                <img src="${product.images[0]?.src || 'placeholder.jpg'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">$${product.price}</p>
                <a href="${product.permalink}" target="_blank">Ver producto</a>
            `;
            productsDiv.appendChild(productCard);
        });

        chatMessages.appendChild(productsDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Función para enviar mensaje al servidor
    async function sendMessage(message) {
        try {
            const response = await fetch('/api/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en la comunicación con el servidor');
            }
            
            // Mostrar respuesta del asistente
            addMessage(data.message);
            
            // Si hay productos, mostrarlos
            if (data.products && data.products.length > 0) {
                displayProducts(data.products);
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage(`Lo siento, hubo un error: ${error.message}. Por favor, intenta nuevamente.`);
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