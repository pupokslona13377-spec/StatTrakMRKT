const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Временные базы данных в памяти
let marketItems = [
    { 
        id: 1, 
        name: 'AK-47 | Redline', 
        price: 5, 
        hash: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-UdvZG_0LYGddlQ7Mg7S_1C8xue9h5Pu75iY1zI97bhKshWi',
        rarity: 'rarity-ancient',
        sellerSid: '76561198000000000' // Пример ID продавца
    },
];

// База пользователей (id из Telegram: баланс)
let users = {}; 

app.get('/', (req, res) => res.send('Сервер StatTrakMRKT онлайн!'));

// --- РАБОТА С БАЛАНСОМ ---

// Получить баланс пользователя
app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params;
    if (!users[userId]) {
        users[userId] = { balance: 0 }; // Регистрация нового пользователя
    }
    res.json(users[userId]);
});

// Пополнение баланса (админская ручка или для тестов)
app.post('/api/user/deposit', (req, res) => {
    const { userId, amount } = req.body;
    if (!users[userId]) users[userId] = { balance: 0 };
    
    users[userId].balance += parseFloat(amount);
    res.json({ success: true, newBalance: users[userId].balance });
});

// --- МАРКЕТ ---

app.get('/api/market', (req, res) => {
    res.json(marketItems);
});

app.post('/api/market/add', (req, res) => {
    const { name, price, hash, sellerSid, rarity } = req.body;
    const newItem = {
        id: Date.now(),
        name,
        price: parseFloat(price),
        hash,
        sellerSid,
        rarity: rarity || ''
    };
    marketItems.push(newItem);
    res.json({ success: true, item: newItem });
});

// --- ЛОГИКА ПОКУПКИ (НОВОЕ!) ---
app.post('/api/market/buy', (req, res) => {
    const { userId, itemId } = req.body; // itemId передаем с фронта
    
    const itemIndex = marketItems.findIndex(i => i.id.toString() === itemId.toString());
    const item = marketItems[itemIndex];

    if (!item) {
        return res.status(404).json({ message: 'Товар уже продан или не найден' });
    }

    if (!users[userId] || users[userId].balance < item.price) {
        return res.status(400).json({ message: 'Недостаточно средств на балансе' });
    }

    // Совершаем сделку
    users[userId].balance -= item.price; // Списываем у покупателя

    // Если у продавца есть запись в нашей базе, начисляем ему
    if (item.sellerSid && users[item.sellerSid]) {
        users[item.sellerSid].balance += item.price;
    }

    // Удаляем товар из маркета
    marketItems.splice(itemIndex, 1);

    res.json({ 
        success: true, 
        message: 'Покупка успешно завершена',
        newBalance: users[userId].balance 
    });
});

// Получение инвентаря
app.get('/api/inventory/:steamId', async (req, res) => {
    try {
        const url = `https://steamcommunity.com/inventory/${req.params.steamId}/730/2?l=russian&count=100`;
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Steam Error' });
    }
});

app.delete('/api/market/:id', (req, res) => {
    const { id } = req.params;
    marketItems = marketItems.filter(item => item.id.toString() !== id.toString());
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
