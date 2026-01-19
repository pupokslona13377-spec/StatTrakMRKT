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
// =============================================
// ИНИЦИАЛИЗАЦИЯ НАВИГАЦИИ И КНОПОК
// =============================================

function initializeNavigation() {
    console.log('🔄 Initializing navigation...');
    
    // Находим все кнопки навигации
    const navButtons = document.querySelectorAll('.nav-item');
    console.log('Found nav buttons:', navButtons.length);
    
    // Добавляем обработчики клика
    navButtons.forEach(button => {
        // Удаляем старые обработчики
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Добавляем новый обработчик
        newButton.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page') || 
                          this.getAttribute('onclick')?.match(/appNavigate\('(\w+)'/)?.[1] ||
                          this.id?.replace('nav-', '');
            
            console.log('Navigation clicked:', pageId, this);
            
            if (pageId && window.appNavigate) {
                window.appNavigate(pageId, this);
            } else if (pageId) {
                // Резервная навигация
                navigateToPage(pageId, this);
            } else {
                console.error('Cannot determine page for navigation:', this);
            }
        });
    });
    
    // Инициализируем первую страницу
    setTimeout(() => {
        const firstButton = document.querySelector('.nav-item');
        if (firstButton) {
            const pageId = firstButton.getAttribute('data-page') || 'market';
            if (window.appNavigate) {
                window.appNavigate(pageId, firstButton);
            } else {
                navigateToPage(pageId, firstButton);
            }
        }
    }, 500);
}

// Резервная функция навигации
function navigateToPage(page, element) {
    console.log('Navigating to page:', page);
    
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(pageEl => {
        pageEl.classList.remove('active');
    });
    
    // Убираем активность у всех кнопок
    document.querySelectorAll('.nav-item').forEach(navEl => {
        navEl.classList.remove('active');
    });
    
    // Показываем нужную страницу
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) {
        targetPage.classList.add('active');
    } else {
        console.error('Page not found:', 'page-' + page);
        // Пробуем найти любую страницу
        const firstPage = document.querySelector('.page');
        if (firstPage) firstPage.classList.add('active');
    }
    
    // Активируем кнопку
    if (element) {
        element.classList.add('active');
    }
    
    // Вибрация
    if (window.TelegramApp && window.TelegramApp.haptic) {
        window.TelegramApp.haptic('impact', 'light');
    }
    
    // Скрываем/показываем поиск
    const searchBar = document.getElementById('search-bar-container');
    if (searchBar) {
        searchBar.style.display = (page === 'market') ? 'block' : 'none';
    }
    
    // Загружаем инвентарь если нужно
    if (page === 'profile' && window.loadInventory) {
        setTimeout(() => {
            window.loadInventory();
        }, 300);
    }
    
    console.log('✅ Navigation complete to:', page);
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    // Ждем немного чтобы все элементы точно загрузились
    setTimeout(() => {
        initializeNavigation();
        
        // Также добавляем обработчики для других кнопок
        initializeButtons();
    }, 1000);
});

// Инициализация всех кнопок
function initializeButtons() {
    console.log('🔄 Initializing buttons...');
    
    // Кнопка синхронизации Steam
    const syncBtn = document.getElementById('sync-steam-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', function() {
            if (window.handleSteamSync) {
                window.handleSteamSync();
            } else {
                console.warn('handleSteamSync function not found');
                showToast("Функция синхронизации загружается...");
            }
        });
    }
    
    // Кнопки вкладок профиля
    const tabInv = document.getElementById('tab-inv');
    const tabHist = document.getElementById('tab-hist');
    
    if (tabInv) {
        tabInv.addEventListener('click', function() {
            if (window.toggleProfileTab) {
                window.toggleProfileTab('inv');
            } else {
                navigateToPage('profile', document.querySelector('.nav-item[data-page="profile"]'));
            }
        });
    }
    
    if (tabHist) {
        tabHist.addEventListener('click', function() {
            if (window.toggleProfileTab) {
                window.toggleProfileTab('hist');
            } else {
                // Показываем заглушку для истории
                const grid = document.getElementById('inventory-grid');
                if (grid) {
                    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px; opacity:0.2;">НЕТ ИСТОРИИ ОПЕРАЦИЙ</p>`;
                }
                const info = document.getElementById('inventory-info');
                if (info) info.innerText = "";
            }
        });
    }
    
    // Кнопка поиска
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            if (window.filterSkins) {
                window.filterSkins();
            }
        });
    }
    
    // Поле поиска (при вводе)
    const searchInput = document.getElementById('market-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (window.filterSkins) {
                window.filterSkins();
            }
        });
    }
    
    // Кнопки модального окна продажи
    initializeModalButtons();
}

// Инициализация модального окна
function initializeModalButtons() {
    // Закрытие модального окна
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            if (window.closeSellModal) {
                window.closeSellModal();
            } else {
                const modal = document.getElementById('sell-modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        });
    }
    
    // Подтверждение цены
    const confirmBtn = document.querySelector('.confirm-price-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (window.goToConfirm) {
                window.goToConfirm();
            }
        });
    }
    
    // Назад к вводу цены
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            if (window.backToInput) {
                window.backToInput();
            }
        });
    }
    
    // Финал продажи
    const finalSellBtn = document.querySelector('.final-sell-btn');
    if (finalSellBtn) {
        finalSellBtn.addEventListener('click', function() {
            if (window.startCartAnimation) {
                window.startCartAnimation();
            } else {
                showToast("Анимация тележки временно недоступна");
            }
        });
    }
    
    // Расчет комиссии
    const priceInput = document.getElementById('sell-price-input');
    if (priceInput) {
        priceInput.addEventListener('input', function() {
            if (window.calculateFee) {
                window.calculateFee(this.value);
            }
        });
    }
}

// Вспомогательная функция для тостов
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        animation: toastSlide 0.3s ease;
    `;
    
    // Добавляем CSS анимацию
    if (!document.getElementById('toast-animation')) {
        const style = document.createElement('style');
        style.id = 'toast-animation';
        style.textContent = `
            @keyframes toastSlide {
                from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Убираем через 2 секунды
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 2000);
}

// Экспортируем функции для глобального использования
window.initializeNavigation = initializeNavigation;
window.navigateToPage = navigateToPage;
window.showToast = showToast;

console.log('✅ Navigation module loaded');

console.log('=== Telegram App Module Loaded ===');
