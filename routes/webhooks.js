const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../utils/logger');

// Middleware para verificar la firma del webhook
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-tiendanube-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'No signature provided' });
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.TIENDANUBE_CLIENT_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

// GDPR Webhooks
router.post('/store/redact', verifyWebhookSignature, async (req, res) => {
  try {
    const { store_id } = req.body;
    logger.info(`Received store redact webhook for store ${store_id}`);

    // Eliminar todos los datos de la tienda
    // TODO: Implementar lógica de eliminación de datos

    res.status(200).json({ message: 'Store data deletion processed successfully' });
  } catch (error) {
    logger.error('Error processing store redact webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/customers/redact', verifyWebhookSignature, async (req, res) => {
  try {
    const { store_id, customer } = req.body;
    logger.info(`Received customer redact webhook for store ${store_id}, customer ${customer.id}`);

    // Eliminar datos del cliente
    // TODO: Implementar lógica de eliminación de datos del cliente

    res.status(200).json({ message: 'Customer data deletion processed successfully' });
  } catch (error) {
    logger.error('Error processing customer redact webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/customers/data-request', verifyWebhookSignature, async (req, res) => {
  try {
    const { store_id, customer } = req.body;
    logger.info(`Received customer data request webhook for store ${store_id}, customer ${customer.id}`);

    // Recopilar datos del cliente
    const customerData = {
      // TODO: Implementar recopilación de datos del cliente
      conversations: [],
      preferences: {},
      // ... otros datos
    };

    res.status(200).json({ 
      message: 'Customer data request processed successfully',
      data: customerData
    });
  } catch (error) {
    logger.error('Error processing customer data request webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ruta para manejar eventos de productos
router.post('/products', verifyWebhookSignature, async (req, res) => {
  try {
    const { event, product } = req.body;
    logger.info(`Received product webhook: ${event}`, { product });

    switch (event) {
      case 'product/created':
        // Manejar creación de producto
        break;
      case 'product/updated':
        // Manejar actualización de producto
        break;
      case 'product/deleted':
        // Manejar eliminación de producto
        break;
      default:
        logger.warn(`Unhandled product event: ${event}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Error processing product webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Ruta para manejar eventos de órdenes
router.post('/orders', verifyWebhookSignature, async (req, res) => {
  try {
    const { event, order } = req.body;
    logger.info(`Received order webhook: ${event}`, { order });

    switch (event) {
      case 'order/created':
        // Manejar nueva orden
        break;
      case 'order/paid':
        // Manejar orden pagada
        break;
      case 'order/fulfilled':
        // Manejar orden completada
        break;
      case 'order/cancelled':
        // Manejar orden cancelada
        break;
      default:
        logger.warn(`Unhandled order event: ${event}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    logger.error('Error processing order webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 