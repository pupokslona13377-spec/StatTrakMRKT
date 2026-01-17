const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Базы данных в памяти
let marketItems = [
    { 
        id: 1, 
        name: 'AK-47 | Redline', 
        price: 5, 
        hash: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-UdvZG_0LYGddlQ7Mg7S_1C8xue9h5Pu75iY1zI97bhKshWi',
        rarity: 'rarity-ancient',
        sellerSid: '76561198000000000'
    },
];
let users = {}; 

app.get('/', (req, res) => res.send('Сервер StatTrakMRKT онлайн!'));

// --- БАЛАНС ---
app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params;
    if (!users[userId]) users[userId] = { balance: 0 };
    res.json(users[userId]);
});

app.post('/api/user/deposit', (req, res) => {
    const { userId, amount } = req.body;
    if (!users[userId]) users[userId] = { balance: 0 };
    users[userId].balance += parseFloat(amount);
    res.json({ success: true, newBalance: users[userId].balance });
});

// --- МАРКЕТ ---
app.get('/api/market', (req, res) => res.json(marketItems));

app.post('/api/market/add', (req, res) => {
    const { name, price, hash, sellerSid, rarity } = req.body;
    const newItem = { id: Date.now(), name, price: parseFloat(price), hash, sellerSid, rarity: rarity || '' };
    marketItems.push(newItem);
    res.json({ success: true, item: newItem });
});

app.post('/api/market/buy', (req, res) => {
    const { userId, itemId } = req.body;
    const idx = marketItems.findIndex(i => i.id.toString() === itemId.toString());
    const item = marketItems[idx];

    if (!item) return res.status(404).json({ message: 'Товар не найден' });
    if (!users[userId] || users[userId].balance < item.price) return res.status(400).json({ message: 'Недостаточно средств' });

    users[userId].balance -= item.price;
    marketItems.splice(idx, 1);
    res.json({ success: true, newBalance: users[userId].balance });
});

// --- ИНВЕНТАРЬ (С ОБХОДОМ БЛОКИРОВКИ) ---
app.get('/api/inventory/:steamId', async (req, res) => {
    const { steamId } = req.params;
    const targetUrl = `https://steamcommunity.com/inventory/${steamId}/730/2?l=russian&count=75`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

    try {
        const response = await axios.get(proxyUrl);
        const steamData = JSON.parse(response.data.contents);
        
        if (steamData && steamData.descriptions) {
            res.json(steamData);
        } else {
            res.status(404).json({ error: 'Инвентарь скрыт или пуст' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Ошибка Steam API' });
    }
});

app.delete('/api/market/:id', (req, res) => {
    marketItems = marketItems.filter(i => i.id.toString() !== req.params.id);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
