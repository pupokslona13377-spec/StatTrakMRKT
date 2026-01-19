/**
 * Инициализация Telegram Web App
 * Отдельный файл для работы с Telegram Mini Apps API
 */

class TelegramApp {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.initDate = new Date().toISOString().split('T')[0];
    this.user = null;
    this.isPremium = false;
    
    this.init();
  }
  
  init() {
    if (!this.tg) {
      console.warn('Telegram Web App не обнаружен. Запускаем в браузерном режиме.');
      this.setupMockTelegram();
      return;
    }
    
    // Расширяем на весь экран
    this.tg.expand();
    
    // Настройка темы
    this.setupTheme();
    
    // Получаем данные пользователя
    this.user = this.tg.initDataUnsafe?.user;
    this.isPremium = this.tg.initDataUnsafe?.user?.is_premium || false;
    
    // Настройка главной кнопки
    this.setupMainButton();
    
    // Отслеживание событий
    this.tg.onEvent('viewportChanged', this.handleViewportChange.bind(this));
    this.tg.onEvent('themeChanged', this.setupTheme.bind(this));
    
    console.log('Telegram Web App инициализирован:', {
      user: this.user,
      theme: this.tg.themeParams,
      platform: this.tg.platform
    });
    
    // Отправляем данные о запуске
    this.sendLaunchEvent();
  }
  
  setupMockTelegram() {
    // Для локальной разработки без Telegram
    this.user = {
      id: 123456789,
      first_name: 'Demo',
      last_name: 'User',
      username: 'demo_user',
      language_code: 'ru'
    };
    
    this.tg = {
      themeParams: {
        bg_color: '#0f172a',
        text_color: '#ffffff',
        hint_color: '#94a3b8',
        button_color: '#00d2ff',
        button_text_color: '#000000'
      },
      platform: 'web',
      isExpanded: true,
      expand: () => console.log('App expanded'),
      close: () => console.log('App closed'),
      showAlert: (msg) => alert(msg),
      showConfirm: (msg, callback) => {
        const result = confirm(msg);
        if (callback) callback(result);
      },
      HapticFeedback: {
        impactOccurred: (type) => console.log('Haptic:', type),
        notificationOccurred: (type) => console.log('Notification:', type),
        selectionChanged: () => console.log('Selection changed')
      }
    };
    
    document.documentElement.style.setProperty('--tg-theme-bg-color', this.tg.themeParams.bg_color);
    document.documentElement.style.setProperty('--tg-theme-text-color', this.tg.themeParams.text_color);
    document.documentElement.style.setProperty('--tg-theme-button-color', this.tg.themeParams.button_color);
  }
  
  setupTheme() {
    if (!this.tg?.themeParams) return;
    
    // Применяем тему Telegram к CSS переменным
    const theme = this.tg.themeParams;
    
    document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color || '#0f172a');
    document.documentElement.style.setProperty('--tg-theme-text-color', theme.text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-hint-color', theme.hint_color || '#94a3b8');
    document.documentElement.style.setProperty('--tg-theme-button-color', theme.button_color || '#00d2ff');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', theme.button_text_color || '#000000');
    
    // Обновляем акцентный цвет приложения
    if (theme.button_color) {
      document.documentElement.style.setProperty('--accent', theme.button_color);
      document.documentElement.style.setProperty('--accent-glow', `${theme.button_color}40`);
    }
    
    // Темная/светлая тема
    const isDark = this.tg.colorScheme === 'dark' || 
                  (theme.bg_color && this.getBrightness(theme.bg_color) < 128);
    
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
  
  setupMainButton() {
    if (!this.tg?.MainButton) return;
    
    const mainButton = this.tg.MainButton;
    
    // Конфигурация кнопки по умолчанию
    mainButton.setParams({
      text: 'ПРОДОЛЖИТЬ',
      color: this.tg.themeParams.button_color || '#00d2ff',
      text_color: this.tg.themeParams.button_text_color || '#000000',
      is_active: false,
      is_visible: false
    });
    
    // Сохраняем ссылку для глобального доступа
    window.TelegramMainButton = mainButton;
  }
  
  handleViewportChange() {
    // Адаптация к клавиатуре и другим изменениям viewport
    const viewport = this.tg.viewportHeight;
    const stable = this.tg.viewportStableHeight;
    
    if (viewport < stable) {
      // Клавиатура открыта
      document.body.classList.add('keyboard-open');
      this.adjustForKeyboard(viewport);
    } else {
      // Клавиатура закрыта
      document.body.classList.remove('keyboard-open');
    }
    
    console.log('Viewport changed:', { viewport, stable });
  }
  
  adjustForKeyboard(viewportHeight) {
    // Поднимаем важные элементы когда открыта клавиатура
    const modals = document.querySelectorAll('.modal-content');
    const inputs = document.querySelectorAll('input:focus');
    
    modals.forEach(modal => {
      modal.style.marginBottom = '200px';
      modal.style.transition = 'margin-bottom 0.3s ease';
    });
    
    // Прокрутка к активному инпуту
    if (inputs.length > 0) {
      setTimeout(() => {
        inputs[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }
  
  getBrightness(hexColor) {
    // Конвертируем hex в RGB и вычисляем яркость
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return (r * 299 + g * 587 + b * 114) / 1000;
  }
  
  sendLaunchEvent() {
    // Отправляем аналитику о запуске приложения
    const launchData = {
      event: 'app_launch',
      timestamp: new Date().toISOString(),
      user_id: this.user?.id,
      platform: this.tg.platform,
      init_date: this.initDate,
      is_premium: this.isPremium
    };
    
    // В реальном приложении отправляем на бекенд
    console.log('App launch:', launchData);
    
    // Сохраняем в localStorage для аналитики
    try {
      const launches = JSON.parse(localStorage.getItem('stattrak_launches') || '[]');
      launches.push(launchData);
      localStorage.setItem('stattrak_launches', JSON.stringify(launches.slice(-50))); // Храним последние 50 запусков
    } catch (e) {
      console.error('Failed to save launch data:', e);
    }
  }
  
  // Публичные методы для использования в основном коде
  showNotification(message, type = 'info') {
    if (this.tg?.showAlert) {
      this.tg.showAlert(message);
    } else {
      alert(message);
    }
    
    // Вибрация в зависимости от типа
    if (this.tg?.HapticFeedback) {
      const hapticMap = {
        'success': 'success',
        'error': 'error',
        'warning': 'warning',
        'info': 'impactOccurred'
      };
      
      const hapticType = hapticMap[type] || 'impactOccurred';
      if (hapticType === 'impactOccurred') {
        this.tg.HapticFeedback.impactOccurred('medium');
      } else {
        this.tg.HapticFeedback.notificationOccurred(hapticType);
      }
    }
  }
  
  closeApp() {
    if (this.tg?.close) {
      this.tg.close();
    }
  }
  
  getUserData() {
    return this.user;
  }
  
  getTheme() {
    return this.tg?.themeParams || {};
  }
  
  isTelegram() {
    return !!window.Telegram?.WebApp;
  }
}

// Экспортируем глобальный инстанс
window.TelegramApp = new TelegramApp();

// Глобальные хелперы для удобства
window.showToast = function(message, duration = 3000) {
  const toastContainer = document.getElementById('toast-container') || (() => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      width: 90%;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  })();
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div style="width: 24px; height: 24px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      <span style="color: black; font-weight: bold;">✓</span>
    </div>
    <span>${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  // Удаляем через указанное время
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
  
  // Вибрация
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  }
};

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  window.TelegramApp = new TelegramApp();
});
