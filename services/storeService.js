const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Esquema de la tienda
const storeSchema = new mongoose.Schema({
    store_id: {
        type: String,
        required: true,
        unique: true
    },
    access_token: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    installed_at: {
        type: Date,
        default: Date.now
    },
    uninstalled_at: {
        type: Date
    },
    settings: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        position: {
            type: String,
            enum: ['bottom-right', 'bottom-left'],
            default: 'bottom-right'
        }
    }
});

const Store = mongoose.model('Store', storeSchema);

class StoreService {
    async saveStore(storeData) {
        try {
            const store = new Store(storeData);
            await store.save();
            logger.info('Tienda guardada exitosamente', { store_id: storeData.store_id });
            return store;
        } catch (error) {
            logger.error('Error al guardar tienda', { error: error.message });
            throw error;
        }
    }

    async updateStore(storeId, updateData) {
        try {
            const store = await Store.findOneAndUpdate(
                { store_id: storeId },
                updateData,
                { new: true }
            );
            logger.info('Tienda actualizada exitosamente', { store_id: storeId });
            return store;
        } catch (error) {
            logger.error('Error al actualizar tienda', { error: error.message });
            throw error;
        }
    }

    async getStore(storeId) {
        try {
            const store = await Store.findOne({ store_id: storeId });
            return store;
        } catch (error) {
            logger.error('Error al obtener tienda', { error: error.message });
            throw error;
        }
    }

    async getActiveStores() {
        try {
            const stores = await Store.find({ status: 'active' });
            return stores;
        } catch (error) {
            logger.error('Error al obtener tiendas activas', { error: error.message });
            throw error;
        }
    }
}

module.exports = new StoreService(); 