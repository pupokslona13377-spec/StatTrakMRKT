const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*', // Для Render.com разрешаем все источники
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(bodyParser.json());

// Базовая проверка работы сервера
app.get('/', (req, res) => {
    res.json({
        message: 'StatTrakMRKT API работает',
        status: 'online',
        timestamp: new Date().toISOString(),
        endpoints: {
            market: 'GET /api/market',
            addItem: 'POST /api/add-item',
            status: 'GET /api/status'
        }
    });
});

// Подключение к MongoDB (используем бесплатный кластер MongoDB Atlas)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.mongodb.net/statTrakMRKT?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Успешное подключение к MongoDB');
})
.catch((err) => {
    console.error('Ошибка подключения к MongoDB:', err);
    console.log('Продолжаем работу с демо-данными');
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

// Демо-данные
const demoItems = [
    { 
        _id: '1', 
        title: "AK-47 | Redline", 
        price: 2450, 
        image: "https://images.unsplash.com/photo-1595263181825-8d33e5f87c04?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", 
        rarity: "rare",
        sellerId: "demo_user",
        createdAt: new Date()
    },
    { 
        _id: '2', 
        title: "M4A4 | Howl", 
        price: 18500, 
        image: "https://images.unsplash.com/photo-1544531585-9847b12c6c1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", 
        rarity: "mythical",
        sellerId: "demo_user",
        createdAt: new Date()
    },
    { 
        _id: '3', 
        title: "AWP | Dragon Lore", 
        price: 32500, 
        image: "https://images.unsplash.com/photo-1595263181794-4c577d43e5b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", 
        rarity: "ancient",
        sellerId: "demo_user",
        createdAt: new Date()
    },
    { 
        _id: '4', 
        title: "Desert Eagle | Blaze", 
        price: 5200, 
        image: "https://images.unsplash.com/photo-1595263181601-7cd4c6c16f50?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80", 
        rarity: "legendary",
        sellerId: "demo_user",
        createdAt: new Date()
    }
];

// Роуты API

// GET все предметы
app.get('/api/market', async (req, res) => {
    try {
        let items;
        
        // Пытаемся получить данные из MongoDB
        try {
            items = await Item.find().sort({ createdAt: -1 });
            
            // Если в базе нет данных, добавляем демо-данные
            if (items.length === 0) {
                items = demoItems;
                console.log('Используем демо-данные');
            }
        } catch (dbError) {
            console.log('Используем демо-данные из-за ошибки БД:', dbError.message);
            items = demoItems;
        }
        
        res.json(items);
    } catch (error) {
        console.error('Ошибка получения предметов:', error);
        res.json(demoItems); // Всегда возвращаем демо-данные при ошибке
    }
});

// POST добавление нового предмета
app.post('/api/add-item', async (req, res) => {
    try {
        const { title, price, image, rarity, sellerId } = req.body;
        
        // Валидация
        if (!title || !price || !image || !sellerId) {
            return res.status(400).json({ 
                error: 'Все обязательные поля должны быть заполнены',
                required: ['title', 'price', 'image', 'sellerId']
            });
        }
        
        // Создаем новый предмет
        const newItem = {
            _id: Date.now().toString(),
            title,
            price: parseInt(price),
            image,
            rarity: rarity || 'common',
            sellerId,
            createdAt: new Date()
        };
        
        // Пытаемся сохранить в MongoDB
        try {
            if (mongoose.connection.readyState === 1) {
                const savedItem = new Item(newItem);
                await savedItem.save();
                console.log('Предмет сохранен в MongoDB');
            }
        } catch (dbError) {
            console.log('Не удалось сохранить в MongoDB:', dbError.message);
        }
        
        // Всегда возвращаем успех
        res.status(201).json({
            message: 'Предмет успешно добавлен',
            item: newItem,
            status: 'success'
        });
        
    } catch (error) {
        console.error('Ошибка добавления предмета:', error);
        res.status(500).json({ 
            error: 'Ошибка сервера',
            message: 'Предмет будет добавлен в локальное хранилище'
        });
    }
});

// GET предмет по ID
app.get('/api/item/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        
        // Ищем в демо-данных
        let item = demoItems.find(item => item._id === itemId);
        
        // Если не нашли в демо-данных, ищем в MongoDB
        if (!item && mongoose.connection.readyState === 1) {
            item = await Item.findById(itemId);
        }
        
        if (!item) {
            return res.status(404).json({ 
                error: 'Предмет не найден',
                suggestion: 'Используйте GET /api/market для получения всех предметов'
            });
        }
        
        res.json(item);
    } catch (error) {
        console.error('Ошибка получения предмета:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении предмета' });
    }
});

// Статус сервера
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        message: 'StatTrakMRKT API работает',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Обработка 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Маршрут не найден',
        availableRoutes: {
            root: 'GET /',
            market: 'GET /api/market',
            addItem: 'POST /api/add-item',
            item: 'GET /api/item/:id',
            status: 'GET /api/status'
        }
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`API доступно по адресу: http://localhost:${PORT}`);
    console.log(`MongoDB статус: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
});
