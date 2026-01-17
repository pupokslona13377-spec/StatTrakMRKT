const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Временная база данных в памяти сервера
let marketItems = [
    { 
        id: 1, 
        name: 'AK-47 | Redline', 
        price: 5, 
        hash: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-UdvZG_0LYGddlQ7Mg7S_1C8xue9h5Pu75iY1zI97bhKshWi',
        rarity: 'rarity-ancient' // Добавил редкость дефолтному предмету
    },
];

app.get('/', (req, res) => res.send('Сервер StatTrakMRKT онлайн!'));

// Получить все товары в маркете
app.get('/api/market', (req, res) => {
    res.json(marketItems);
});

// Выставить товар на маркет
app.post('/api/market/add', (req, res) => {
    // ДОБАВИЛ rarity сюда 👇
    const { name, price, hash, sellerSid, rarity } = req.body;
    
    const newItem = {
        id: Date.now(),
        name,
        price: parseFloat(price),
        hash,
        sellerSid,
        rarity: rarity || '' // СОХРАНЯЕМ редкость в объект предмета
    };
    
    marketItems.push(newItem);
    res.json({ success: true, item: newItem });
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

// Удалить товар из маркета (Снять с продажи)
app.delete('/api/market/:id', (req, res) => {
    const { id } = req.params;
    const initialLength = marketItems.length;
    marketItems = marketItems.filter(item => item.id.toString() !== id.toString());
    
    if (marketItems.length < initialLength) {
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Товар не найден' });
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
