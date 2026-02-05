require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const telegramApp = require('./telegram-app');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- In-memory store ---
const state = {
  users: {}, // { userId: { balance, activeOrders, historyOrders } }
  masters: [
    { name: 'Анастасия', price: 2500 },
    { name: 'Полина', price: 2200 },
    { name: 'Виктория', price: 3000 },
    { name: 'Екатерина', price: 2700 }
  ]
};

function getUser(userId) {
  if (!state.users[userId]) {
    state.users[userId] = { balance: 0, activeOrders: [], historyOrders: [] };
  }
  return state.users[userId];
}

// --- Routes ---
// Главная
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Мастера
app.get('/api/masters', (req, res) => {
  res.json(state.masters);
});

// Баланс пользователя
app.get('/api/user/:id', (req, res) => {
  const user = getUser(req.params.id);
  res.json({ id: req.params.id, ...user });
});

// Пополнить баланс
app.post('/api/user/:id/topup', (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Неверная сумма' });
  const user = getUser(req.params.id);
  user.balance += amount;
  res.json({ success: true, balance: user.balance });
});

// Забронировать мастера
app.post('/api/user/:id/book', (req, res) => {
  const { masterName } = req.body;
  const user = getUser(req.params.id);
  const master = state.masters.find(m => m.name === masterName);
  if (!master) return res.status(400).json({ error: 'Мастер не найден' });
  if (user.balance < master.price) return res.status(400).json({ error: 'Недостаточно средств' });

  user.balance -= master.price;
  const order = { master: master.name, price: master.price, date: new Date().toISOString() };
  user.activeOrders.push(order);

  // Telegram notification
  telegramApp.notifyBooking(req.params.id, order);

  res.json({ success: true, order, balance: user.balance });
});

// Завершить заказ
app.post('/api/user/:id/complete', (req, res) => {
  const { index } = req.body;
  const user = getUser(req.params.id);
  if (index < 0 || index >= user.activeOrders.length) return res.status(400).json({ error: 'Неверный индекс' });

  const order = user.activeOrders.splice(index, 1)[0];
  user.historyOrders.push(order);
  res.json({ success: true, active: user.activeOrders, history: user.historyOrders });
});

// Получить заказы
app.get('/api/user/:id/orders', (req, res) => {
  const user = getUser(req.params.id);
  res.json({ active: user.activeOrders, history: user.historyOrders });
});

// --- Запуск сервера ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
