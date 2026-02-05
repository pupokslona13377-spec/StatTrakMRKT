const fetch = require('node-fetch');
const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

module.exports = {
  notifyBooking: async (userId, order) => {
    try {
      const chat_id = userId; // Для теста можно заменить на id админа
      await fetch(TELEGRAM_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id,
          text: `Новая бронь!\nМастер: ${order.master}\nСумма: ${order.price} ₽\nДата: ${order.date}`
        })
      });
    } catch (err) {
      console.error('Telegram notification failed', err);
    }
  }
};
