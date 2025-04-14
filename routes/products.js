const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Obtener todos los productos
router.get('/', (req, res) => {
    try {
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        
        if (!fs.existsSync(productsPath)) {
            logger.warn('Archivo de productos no encontrado');
            return res.json({ products: [] });
        }
        
        const productsData = fs.readFileSync(productsPath, 'utf8');
        const products = JSON.parse(productsData);
        
        res.json({ products });
    } catch (error) {
        logger.error('Error al obtener productos', { error: error.message });
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// Obtener un producto por ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const productsPath = path.join(__dirname, '..', 'data', 'products.json');
        
        if (!fs.existsSync(productsPath)) {
            logger.warn('Archivo de productos no encontrado');
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        const productsData = fs.readFileSync(productsPath, 'utf8');
        const products = JSON.parse(productsData);
        
        const product = products.find(p => p.id === parseInt(id));
        
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json({ product });
    } catch (error) {
        logger.error('Error al obtener producto', { error: error.message, id: req.params.id });
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

module.exports = router; 