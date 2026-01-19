// telegram-app.js
console.log('=== Telegram Mini App Initialization ===');

// Проверяем, что мы в Telegram
function initializeTelegramApp() {
    // Если Telegram API загружен
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        console.log('✅ Telegram WebApp API detected');
        console.log('Platform:', tg.platform);
        console.log('Version:', tg.version);
        
        // Расширяем на весь экран
        try {
            tg.expand();
        } catch (e) {
            console.log('expand error:', e);
        }
        
        // Устанавливаем цвета
        try {
            tg.setBackgroundColor('#17212b');
            tg.setHeaderColor('#17212b');
            tg.enableClosingConfirmation();
        } catch (e) {
            console.log('color error:', e);
        }
        
        // Показываем кнопку "Назад" если нужно
        if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.1')) {
            if (tg.BackButton && tg.BackButton.show) {
                try {
                    tg.BackButton.show();
                    if (tg.BackButton.onClick) {
                        tg.BackButton.onClick(() => {
                            if (tg.close) tg.close();
                        });
                    }
                } catch (e) {
                    console.log('BackButton error:', e);
                }
            }
        }
        
        // Говорим Telegram что приложение готово
        try {
            tg.ready();
        } catch (e) {
            console.log('ready error:', e);
        }
        
        console.log('✅ Telegram WebApp ready');
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            console.log('User:', tg.initDataUnsafe.user);
        }
        if (tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
            console.log('StartParam:', tg.initDataUnsafe.start_param);
        }
        
        // Возвращаем объект для использования
        return tg;
        
    } else {
        console.warn('⚠️ Not in Telegram. Running in browser mode.');
        
        // Создаем мок-объект для отладки в браузере
        const mockTg = {
            initData: '',
            initDataUnsafe: {
                user: {
                    id: 123456789,
                    first_name: 'Test',
                    last_name: 'User',
                    username: 'test_user',
                    language_code: 'ru'
                }
            },
            platform: 'browser',
            version: '6.0',
            expand: function() { 
                console.log('Mock: expand');
                return true;
            },
            ready: function() { 
                console.log('Mock: ready');
                return true;
            },
            setBackgroundColor: function(color) { 
                console.log('Mock: bg color', color);
                return true;
            },
            setHeaderColor: function(color) { 
                console.log('Mock: header color', color);
                return true;
            },
            enableClosingConfirmation: function() {
                console.log('Mock: enableClosingConfirmation');
                return true;
            },
            BackButton: {
                show: function() { console.log('Mock: BackButton.show'); },
                hide: function() { console.log('Mock: BackButton.hide'); },
                onClick: function(callback) { 
                    console.log('Mock: BackButton.onClick');
                    if (typeof callback === 'function') {
                        // Сохраняем callback для возможного вызова
                        this._callback = callback;
                    }
                },
                _callback: null
            },
            isVersionAtLeast: function(version) { 
                console.log('Mock: isVersionAtLeast', version);
                return true;
            },
            close: function() { 
                console.log('Mock: close');
                return true;
            },
            HapticFeedback: {
                impactOccurred: function(style) {
                    console.log('Mock: HapticFeedback.impactOccurred', style);
                },
                notificationOccurred: function(type) {
                    console.log('Mock: HapticFeedback.notificationOccurred', type);
                },
                selectionChanged: function() {
                    console.log('Mock: HapticFeedback.selectionChanged');
                }
            },
            showConfirm: function(message, callback) {
                console.log('Mock: showConfirm', message);
                if (typeof callback === 'function') {
                    callback(true); // По умолчанию подтверждаем
                }
                return true;
            },
            showAlert: function(message, callback) {
                console.log('Mock: showAlert', message);
                alert(message);
                if (typeof callback === 'function') {
                    callback();
                }
                return true;
            },
            showPopup: function(params, callback) {
                console.log('Mock: showPopup', params);
                if (typeof callback === 'function') {
                    callback(params.buttons ? params.buttons[0].id : 'ok');
                }
                return true;
            }
        };
        
        return mockTg;
    }
}

// Инициализируем Telegram App
const tg = initializeTelegramApp();

// Экспортируем в глобальную область видимости
window.TelegramWebApp = tg;
window.TgApp = tg;

// Функция для получения данных пользователя
function getUserInfo() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        return tg.initDataUnsafe.user;
    }
    return null;
}

// Функция для проверки, в Telegram ли мы
function isInTelegram() {
    return !!(window.Telegram && window.Telegram.WebApp);
}

// Функция для отправки данных в Telegram
function sendDataToTelegram(data) {
    if (tg && tg.sendData) {
        try {
            tg.sendData(JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error sending data to Telegram:', e);
            return false;
        }
    }
    console.warn('sendData not available');
    return false;
}

// Функция для вибрации (Haptic Feedback)
function triggerHaptic(type, style) {
    if (tg && tg.HapticFeedback) {
        try {
            switch(type) {
                case 'impact':
                    if (tg.HapticFeedback.impactOccurred) {
                        tg.HapticFeedback.impactOccurred(style || 'light');
                    }
                    break;
                case 'notification':
                    if (tg.HapticFeedback.notificationOccurred) {
                        tg.HapticFeedback.notificationOccurred(style || 'success');
                    }
                    break;
                case 'selection':
                    if (tg.HapticFeedback.selectionChanged) {
                        tg.HapticFeedback.selectionChanged();
                    }
                    break;
            }
            return true;
        } catch (e) {
            console.error('Haptic error:', e);
            return false;
        }
    }
    return false;
}

// Функция для показа подтверждения
function showConfirmDialog(message, callback) {
    if (tg && tg.showConfirm) {
        try {
            tg.showConfirm(message, function(result) {
                if (typeof callback === 'function') {
                    callback(result);
                }
            });
            return true;
        } catch (e) {
            console.error('Confirm error:', e);
            // Fallback на стандартный confirm
            const result = confirm(message);
            if (typeof callback === 'function') {
                callback(result);
            }
            return false;
        }
    } else {
        // Fallback на стандартный confirm
        const result = confirm(message);
        if (typeof callback === 'function') {
            callback(result);
        }
        return false;
    }
}

// Функция для показа алерта
function showAlertDialog(message, callback) {
    if (tg && tg.showAlert) {
        try {
            tg.showAlert(message, function() {
                if (typeof callback === 'function') {
                    callback();
                }
            });
            return true;
        } catch (e) {
            console.error('Alert error:', e);
            alert(message);
            if (typeof callback === 'function') {
                callback();
            }
            return false;
        }
    } else {
        alert(message);
        if (typeof callback === 'function') {
            callback();
        }
        return false;
    }
}

// Функция для закрытия приложения
function closeApp() {
    if (tg && tg.close) {
        try {
            tg.close();
            return true;
        } catch (e) {
            console.error('Close error:', e);
            return false;
        }
    }
    console.warn('App cannot be closed - not in Telegram');
    return false;
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing app...');
    
    // Скрываем лоадер и показываем приложение
    setTimeout(function() {
        const loader = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loader) {
            loader.classList.remove('active');
            setTimeout(function() {
                loader.style.display = 'none';
            }, 500);
        }
        
        if (app) {
            app.style.display = 'block';
            // Анимация появления
            setTimeout(function() {
                app.style.opacity = '1';
                app.style.transform = 'translateY(0)';
            }, 50);
        }
        
        console.log('✅ App UI initialized');
        
        // Инициализация основного приложения, если есть
        if (window.appInitialize) {
            window.appInitialize();
        }
        
        // Запускаем проверку готовности
        checkAppReady();
        
    }, 1000);
    
    // Обработчик ошибок изображений
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            console.warn('Image failed to load:', e.target.src);
            // Можно установить заглушку
            if (!e.target.getAttribute('data-error-handled')) {
                e.target.setAttribute('data-error-handled', 'true');
                e.target.src = 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVdgYpw23d9dfHldogjSA1BW7mD8v_k_W4RS04_IiH6NBX8j66F8WLY';
            }
        }
    }, true);
});

// Функция проверки готовности приложения
function checkAppReady() {
    const checkInterval = setInterval(function() {
        const appContent = document.querySelector('#app .container, #app-content, .page.active');
        if (appContent && appContent.children.length > 0) {
            console.log('✅ App content loaded successfully');
            clearInterval(checkInterval);
            
            // Отправляем событие готовности
            const event = new CustomEvent('appReady', { 
                detail: { telegramApp: tg, user: getUserInfo() } 
            });
            document.dispatchEvent(event);
            
            // Вибрация успешной загрузки
            triggerHaptic('notification', 'success');
        }
    }, 100);
    
    // Таймаут проверки
    setTimeout(function() {
        clearInterval(checkInterval);
        console.log('⚠️ App content check timeout');
    }, 10000);
}

// Экспорт функций для использования в других файлах
window.TelegramApp = {
    // Основной объект
    tg: tg,
    
    // Вспомогательные функции
    getUser: getUserInfo,
    isInTelegram: isInTelegram,
    sendData: sendDataToTelegram,
    haptic: triggerHaptic,
    confirm: showConfirmDialog,
    alert: showAlertDialog,
    close: closeApp,
    
    // Информация
    version: tg.version || '1.0.0',
    platform: tg.platform || 'unknown',
    themeParams: tg.themeParams || {},
    
    // Инициализация
    init: function() {
        console.log('TelegramApp initialized');
        return this;
    }
};

// Автоматическая инициализация
window.TelegramApp.init();

// Добавляем CSS для анимаций, если их нет
if (!document.getElementById('telegram-app-styles')) {
    const style = document.createElement('style');
    style.id = 'telegram-app-styles';
    style.textContent = `
        #loading-screen {
            transition: opacity 0.5s ease;
        }
        
        #app {
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* Стили для скинов в корзине */
        .skin-drop-final {
            position: absolute;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: dropIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        @keyframes dropIn {
            0% { transform: translateY(-100px) rotate(-15deg); opacity: 0; }
            100% { transform: translateY(0) rotate(0deg); opacity: 1; }
        }
        
        /* Анимация тележки */
        #cart-anim {
            transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        #cart-anim.active {
            animation: cartEnter 1s ease;
        }
        
        @keyframes cartEnter {
            0% { transform: translateX(-100vw); }
            70% { transform: translateX(20px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);
}

console.log('=== Telegram App Module Loaded ===');
