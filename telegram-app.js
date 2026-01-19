// telegram-app.js
const tg = window.Telegram.WebApp;
const API_BASE = 'https://stattrakmrkt.onrender.com';

tg.ready();
tg.expand();

// Тот самый предохранитель: если через 7 секунд всё еще висит загрузка - убираем её
setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader && loader.style.display !== 'none') {
        console.warn("Таймаут: Сервер Render долго просыпается.");
        loader.style.display = 'none';
    }
}, 7000);

async function initApp() {
    try {
        const response = await fetch(`${API_BASE}/api/market`);
        const items = await response.json();
        renderMarket(items); // Твоя функция отрисовки
    } catch (err) {
        console.error("Ошибка при старте:", err);
    } finally {
        // Убираем лоадер, если запрос завершился (удачно или нет)
        document.getElementById('loading-screen').style.display = 'none';
    }
}

// Запуск
document.addEventListener('DOMContentLoaded', initApp);
