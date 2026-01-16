const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Сервер StatTrakMRKT работает!'));

// НОВЫЙ МАРШРУТ ДЛЯ КАРТИНОК
app.get('/api/image/:hash', async (req, res) => {
    try {
        const url = `https://community.cloudflare.steamstatic.com/economy/image/${req.params.hash}/330x192`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        res.set('Content-Type', 'image/jpeg');
        res.send(response.data);
    } catch (e) {
        res.status(404).send('Not found');
    }
});

app.get('/api/inventory/:steamId', async (req, res) => {
    const { steamId } = req.params;
    try {
        const url = `https://steamcommunity.com/inventory/${steamId}/730/2?l=russian&count=100`;
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Steam Error' });
    }
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
