const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Порт должен быть именно таким для Render
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Проверочный путь, чтобы понять, что сервер жив
app.get('/', (req, res) => {
    res.send('Сервер StatTrakMRKT работает!');
});

// Основной путь для инвентаря
app.get('/api/inventory/:steamId', async (req, res) => {
    const { steamId } = req.params;
    console.log(`Запрос инвентаря для: ${steamId}`);
    
    try {
        const url = `https://steamcommunity.com/inventory/${steamId}/730/2?l=russian&count=100`;
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Ошибка Steam API:', error.message);
        res.status(500).json({ error: 'Steam не отвечает или инвентарь скрыт' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
