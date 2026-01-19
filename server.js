const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Steam API конфигурация
const STEAM_API_KEY = process.env.STEAM_API_KEY || 'YOUR_STEAM_API_KEY';
const STEAM_INVENTORY_API = 'https://steamcommunity.com/inventory';

// Кэш для маркета (в продакшене используй Redis)
let marketCache = {
  data: [],
  timestamp: 0
};

// TON кошельки админов (для комиссий)
const ADMIN_WALLETS = process.env.ADMIN_WALLETS ? process.env.ADMIN_WALLETS.split(',') : [];

// ==================== API РОУТЫ ====================

// 1. Получить все предметы маркета
app.get('/api/market', async (req, res) => {
  try {
    // Если кэш устарел (старше 5 минут)
    if (Date.now() - marketCache.timestamp > 300000 || marketCache.data.length === 0) {
      // Здесь должна быть интеграция с реальным маркетплейсом
      // Пока возвращаем мок-данные
      const mockItems = generateMockMarketData();
      marketCache = {
        data: mockItems,
        timestamp: Date.now()
      };
    }
    
    res.json(marketCache.data);
  } catch (error) {
    console.error('Market error:', error);
    res.status(500).json({ error: 'Ошибка загрузки маркета' });
  }
});

// 2. Получить инвентарь пользователя
app.get('/api/inventory/:steamId64', async (req, res) => {
  const { steamId64 } = req.params;
  
  if (!steamId64 || steamId64.length < 10) {
    return res.status(400).json({ error: 'Неверный SteamID64' });
  }

  try {
    // Steam Inventory API
    const inventoryUrl = `${STEAM_INVENTORY_API}/${steamId64}/730/2?l=russian&count=100`;
    
    const response = await fetch(inventoryUrl);
    
    if (!response.ok) {
      // Если Steam API недоступен, возвращаем мок-данные
      console.warn('Steam API недоступен, используем мок-данные');
      return res.json(generateMockInventory(steamId64));
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Inventory error:', error);
    // В случае ошибки всё равно возвращаем мок-данные для демо
    res.json(generateMockInventory(steamId64));
  }
});

// 3. Создать заказ на покупку
app.post('/api/order/create', async (req, res) => {
  try {
    const { itemId, price, userWallet, userTelegramId } = req.body;
    
    if (!itemId || !price || !userWallet) {
      return res.status(400).json({ error: 'Недостаточно данных' });
    }
    
    // Генерируем уникальный ID заказа
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Здесь должна быть логика создания сделки в блокчейне
    // Пока возвращаем мок-ответ
    
    const mockOrder = {
      orderId,
      itemId,
      price,
      status: 'pending',
      paymentLink: `ton://transfer/${ADMIN_WALLETS[0] || 'EQCD...'}?amount=${price * 1000000000}&text=${orderId}`,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 минут
    };
    
    // Сохраняем в "базу" (в продакшене используй PostgreSQL/MongoDB)
    // ordersDB[orderId] = mockOrder;
    
    res.json(mockOrder);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
});

// 4. Проверить статус платежа
app.get('/api/payment/check/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  // Мок-проверка платежа
  // В реальности проверяем блокчейн TON
  const isPaid = Math.random() > 0.5; // 50% шанс что "оплачено"
  
  res.json({
    orderId,
    paid: isPaid,
    confirmed: isPaid ? Math.random() > 0.3 : false // 70% шанс подтверждения если оплачено
  });
});

// 5. Создать офер на продажу
app.post('/api/offer/create', async (req, res) => {
  try {
    const { itemId, price, steamTradeLink, userTelegramId } = req.body;
    
    if (!itemId || !price || !steamTradeLink) {
      return res.status(400).json({ error: 'Недостаточно данных' });
    }
    
    const offerId = `OFFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const mockOffer = {
      offerId,
      itemId,
      price,
      status: 'active',
      createdAt: new Date().toISOString(),
      commission: price * 0.05 // 5% комиссия
    };
    
    res.json(mockOffer);
  } catch (error) {
    console.error('Offer creation error:', error);
    res.status(500).json({ error: 'Ошибка создания офера' });
  }
});

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function generateMockMarketData() {
  const weapons = [
    'AK-47', 'M4A4', 'M4A1-S', 'AWP', 'Desert Eagle', 
    'Glock-18', 'USP-S', 'P90', 'AUG', 'SSG 08'
  ];
  
  const skins = [
    'Redline', 'Asiimov', 'Dragon Lore', 'Fire Serpent', 'Fade',
    'Doppler', 'Marble Fade', 'Tiger Tooth', 'Lore', 'Gamma Doppler'
  ];
  
  const conditions = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];
  const rarities = ['Covert', 'Classified', 'Restricted', 'Mil-Spec', 'Industrial Grade'];
  const rarityColors = {
    'Covert': '#eb4b4b',
    'Classified': '#d32ce6',
    'Restricted': '#8847ff',
    'Mil-Spec': '#4b69ff',
    'Industrial Grade': '#5e98d9'
  };
  
  const items = [];
  
  for (let i = 0; i < 20; i++) {
    const weapon = weapons[Math.floor(Math.random() * weapons.length)];
    const skin = skins[Math.floor(Math.random() * skins.length)];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const price = (Math.random() * 10 + 0.1).toFixed(2);
    
    items.push({
      id: `ITEM_${i + 1}`,
      name: `${weapon} | ${skin} (${condition})`,
      type: 'weapon',
      rarity: rarity,
      rarityColor: rarityColors[rarity],
      price: parseFloat(price),
      icon_url: getRandomSkinImage(),
      float: Math.random().toFixed(5),
      stattrak: Math.random() > 0.7,
      souvenir: Math.random() > 0.9
    });
  }
  
  return items;
}

function generateMockInventory(steamId64) {
  const items = [];
  const itemCount = Math.floor(Math.random() * 15) + 5; // 5-20 предметов
  
  for (let i = 0; i < itemCount; i++) {
    items.push({
      assetid: `${steamId64}_${i}`,
      classid: `CLASS_${i}`,
      instanceid: "0",
      amount: "1",
      pos: i,
      name: `Mock Skin ${i + 1}`,
      market_hash_name: `mock_skin_${i + 1}`,
      icon_url: getRandomSkinImage(),
      type: 'weapon',
      tags: [{ category: 'Rarity', internal_name: `rarity_${Math.floor(Math.random() * 5)}` }]
    });
  }
  
  return {
    assets: items,
    descriptions: items,
    total_inventory_count: itemCount,
    success: true
  };
}

function getRandomSkinImage() {
  const images = [
    '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwW09Kzm7-FmP7mDLfYkWNF18lwmO7Eu4_xiVXg_0s_Ym3xctXAdVBoZlvR-FfsxL3ph5S9v53AmCc17id253_VyxSygBtMcKUx0iC9f_7E',
    '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV092lnYmGmOHLPr7Vn35cppQij-qUrN322VbgqBFqYmDycI-RI1A4YVvS8lTole_v08S06Z_MnXUws3Ur7H3ZzAv3309_7A8V7Q',
    '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0Ob3fDJ95466kYe0m_7zO6-fzj9V7cJ0n_rE89Sk0Vbg-0VpYm_wI4-VclA8ZAuF-1m2wL3og5S6uJ_An3Rru3In-z-DyPTo0YhX',
    '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tKznJm0mvLwOq7c2G1Qv5Nz3u_E9N2iilG1-RA-NmqhcY-Sdw9rYV_R-gK-x7y605S1u8zMm3p9-n51YV_0no8',
    '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou7umeldf0Ob3fDxBvYyJh5Saif73N6_um25V4dB8xL2Z8N6tjVax80E-Y273co-SdFNoYAnR_wK4yOi81pC07Zidm3p9-n51pC8f0mU'
  ];
  
  return images[Math.floor(Math.random() * images.length)];
}

// Старт сервера
app.listen(PORT, () => {
  console.log(`🚀 STATTRAK MARKET запущен на порту ${PORT}`);
  console.log(`📱 API доступен по адресу: http://localhost:${PORT}`);
  console.log(`💎 Режим: ${process.env.NODE_ENV || 'development'}`);
});
