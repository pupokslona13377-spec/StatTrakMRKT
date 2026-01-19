const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://yourusername.github.io', 'http://localhost:8000', 'https://web.telegram.org'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/statTrakMRKT', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Ошибка подключения к MongoDB:'));
db.once('open', () => {
    console.log('Успешное подключение к MongoDB');
});

// Схема и модель предмета
const itemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 1
    },
    image: {
        type: String,
        required: true
    },
    rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'mythical', 'legendary', 'ancient'],
        default: 'common'
    },
    sellerId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Item = mongoose.model('Item', itemSchema);

// Роуты API

// GET все предметы
app.get('/api/market', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Ошибка получения предметов:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении предметов' });
    }
});

// POST добавление нового предмета
app.post('/api/add-item', async (req, res) => {
    try {
        const { title, price, image, rarity, sellerId } = req.body;
        
        // Валидация
        if (!title || !price || !image || !sellerId) {
            return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
        }
        
        const newItem = new Item({
            title,
            price,
            image,
            rarity: rarity || 'common',
            sellerId
        });
        
        await newItem.save();
        
        res.status(201).json({
            message: 'Предмет успешно добавлен',
            item: newItem
        });
    } catch (error) {
        console.error('Ошибка добавления предмета:', error);
        res.status(500).json({ error: 'Ошибка сервера при добавлении предмета' });
    }
});

// GET предмет по ID
app.get('/api/item/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Предмет не найден' });
        }
        
        res.json(item);
    } catch (error) {
        console.error('Ошибка получения предмета:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении предмета' });
    }
});

// DELETE удаление предмета
app.delete('/api/item/:id', async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Предмет не найден' });
        }
        
        res.json({ message: 'Предмет успешно удален' });
    } catch (error) {
        console.error('Ошибка удаления предмета:', error);
        res.status(500).json({ error: 'Ошибка сервера при удалении предмета' });
    }
});

// Статус сервера
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        message: 'StatTrakMRKT API работает',
        timestamp: new Date().toISOString()
    });
});

// Обслуживание фронтенда
app.get('*', (req, res) => {
    res.json({
        message: 'StatTrakMRKT API',
        endpoints: {
            market: 'GET /api/market',
            addItem: 'POST /api/add-item',
            item: 'GET /api/item/:id',
            deleteItem: 'DELETE /api/item/:id',
            status: 'GET /api/status'
        }
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`API доступно по адресу: http://localhost:${PORT}/api/market`);
});
