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