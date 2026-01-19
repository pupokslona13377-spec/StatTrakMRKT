// telegram-app.js - УПРОЩЁННЫЙ ФАЙЛ ТОЛЬКО ДЛЯ ИНИЦИАЛИЗАЦИИ
console.log('=== Telegram Mini App Initialization ===');

function initializeTelegramApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('✅ Telegram WebApp API detected');
        
        // Основные настройки
        try {
            tg.expand();
            tg.setBackgroundColor('#17212b');
            tg.setHeaderColor('#17212b');
            tg.enableClosingConfirmation();
            tg.ready();
        } catch (e) {
            console.log('Telegram init error:', e);
        }
        
        // Проверяем, есть ли уже глобальная переменная tg из index.html
        // Если нет — создаём, если есть — используем существующую
        if (!window.tg) {
            window.tg = tg;
        }
        
        return tg;
    } else {
        console.warn('⚠️ Not in Telegram. Running in browser mode.');
        // Создаём минимальный mock-объект
        const mockTg = {
            initDataUnsafe: { user: { id: 123456789, first_name: 'Test' } },
            HapticFeedback: {
                impactOccurred: () => console.log('Haptic'),
                notificationOccurred: () => console.log('Haptic')
            }
        };
        window.tg = mockTg;
        return mockTg;
    }
}

// Инициализируем сразу при загрузке скрипта
const tg = initializeTelegramApp();

// Делаем объект доступным глобально под разными именами для совместимости
window.TelegramWebApp = tg;
window.TgApp = tg;

console.log('✅ Telegram App Module Loaded');
