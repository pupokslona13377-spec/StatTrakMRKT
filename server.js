const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Сервер StatTrakMRKT работает!'));

// ИСПРАВЛЕННЫЙ МАРШРУТ ДЛЯ КАРТИНОК
app.get('/api/image/:hash', async (req, res) => {
    try {
        const hash = req.params.hash;
        const url = `https://community.cloudflare.steamstatic.com/economy/image/${hash}/330x192`;
        
        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: {
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        res.set('Content-Type', 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400'); // Кэшировать на сутки
        res.send(response.data);
    } catch (e) {
        console.error('Ошибка загрузки картинки:', e.message);
        res.status(404).send('Image not found');
    }
});

app.get('/api/inventory/:steamId', async (req, res) => {
    const { steamId } = req.params;
    try {
        const url = `https://steamcommunity.com/inventory/${steamId}/730/2?l=russian&count=100`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Steam Error' });
    }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
