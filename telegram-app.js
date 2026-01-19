const tg = window.Telegram.WebApp;
const API_BASE = 'https://stattrakmrkt.onrender.com';

tg.ready();
tg.expand();

// Принудительное скрытие лоадера
setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader && loader.style.display !== 'none') {
        loader.style.display = 'none';
    }
}, 5000);

// ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ
async function initApp() {
    // 1. Заполняем данные профиля сразу
    setupProfile();
    // 2. Обновляем баланс
    updateBalance();
    // 3. Грузим маркет
    try {
        const response = await fetch(`${API_BASE}/api/market`);
        const items = await response.json();
        renderMarket(items);
    } catch (err) {
        console.error("Ошибка маркета:", err);
    } finally {
        const loader = document.getElementById('loading-screen');
        if (loader) loader.style.display = 'none';
    }
}

// ДАННЫЕ ПРОФИЛЯ (Чтобы не было пустоты)
function setupProfile() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        // Заполняем имя и ID в профиле
        const userNameEl = document.getElementById('user-name');
        const userIdEl = document.getElementById('user-id');
        if (userNameEl) userNameEl.innerText = user.first_name || 'Странник';
        if (userIdEl) userIdEl.innerText = `ID: ${user.id}`;
        
        // Если у тебя есть аватарка в профиле
        const userImgEl = document.querySelector('.profile-avatar');
        if (userImgEl && user.photo_url) userImgEl.src = user.photo_url;
    }
}

// НАВИГАЦИЯ (С хабом и переходами)
function appNavigate(page, el) {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    
    // Скрываем все страницы
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Показываем нужную
    const targetPage = document.getElementById(page + '-page');
    if (targetPage) targetPage.classList.add('active');

    // Активная кнопка в меню
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (el) el.classList.add('active');

    // Доп. логика для страниц
    if (page === 'inventory') loadInventory();
    if (page === 'profile') setupProfile();
}

// ОТРИСОВКА МАРКЕТА
function renderMarket(items) {
    const grid = document.getElementById('market-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!items || items.length === 0) {
        grid.innerHTML = '<p style="color:gray; text-align:center; width:100%; margin-top:50px;">На рынке пока нет скинов</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'market-card';
        card.innerHTML = `
            <div class="rarity-stripe ${item.rarity || 'rarity-common'}"></div>
            <img src="https://community.cloudflare.steamstatic.com/economy/image/${item.hash}" alt="${item.name}">
            <div class="card-info">
                <div class="card-name">${item.name}</div>
                <div class="card-price">$${item.price}</div>
                <button class="buy-btn" onclick="buyItem('${item.id}')">Купить</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// ПОКУПКА
async function buyItem(itemId) {
    if (!confirm('Подтвердить покупку?')) return;
    const userId = tg.initDataUnsafe?.user?.id || '76561198000000000';
    
    try {
        const response = await fetch(`${API_BASE}/api/market/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, itemId })
        });
        const res = await response.json();
        if (res.success) {
            tg.showScanQrPopup({ text: 'Покупка прошла!' }); // Как вариант уведомления
            setTimeout(() => location.reload(), 1500);
        } else {
            alert(res.message || 'Ошибка');
        }
    } catch (e) {
        alert('Сервер недоступен');
    }
}

// БАЛАНС
async function updateBalance() {
    const userId = tg.initDataUnsafe?.user?.id || '76561198000000000';
    try {
        const response = await fetch(`${API_BASE}/api/user/${userId}`);
        const data = await response.json();
        const balanceEl = document.getElementById('user-balance');
        if (balanceEl) balanceEl.innerText = `$${data.balance.toFixed(2)}`;
    } catch (e) {
        console.error("Баланс не подгружен");
    }
}

// ИНВЕНТАРЬ
async function loadInventory() {
    const container = document.getElementById('inventory-grid');
    if (!container) return;
    container.innerHTML = '<div class="loader-mini"></div>';
    
    const steamId = '76561198000000000'; // Здесь потом будет твой SteamID

    try {
        const response = await fetch(`${API_BASE}/api/inventory/${steamId}`);
        const data = await response.json();
        container.innerHTML = '';
        
        if (data.descriptions) {
            data.descriptions.forEach(item => {
                const card = document.createElement('div');
                card.className = 'market-card';
                card.innerHTML = `
                    <img src="https://community.cloudflare.steamstatic.com/economy/image/${item.classid}" alt="${item.market_name}">
                    <div class="card-info">
                        <div class="card-name">${item.market_name}</div>
                        <button class="buy-btn" onclick="openSaleModal('${item.market_name}', '${item.classid}')">Продать</button>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (e) {
        container.innerHTML = '<p style="text-align:center; color:gray;">Инвентарь не найден или скрыт</p>';
    }
}

// МОДАЛКИ ПРОДАЖИ
function openSaleModal(name, hash) {
    const modal = document.getElementById('sale-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('modal-item-name').innerText = name;
        document.getElementById('modal-item-img').src = `https://community.cloudflare.steamstatic.com/economy/image/${hash}`;
        window.currentSaleItem = { name, hash };
    }
}

function closeSaleModal() {
    document.getElementById('sale-modal').style.display = 'none';
}

async function confirmSale() {
    const price = document.getElementById('sale-price').value;
    if (!price || price <= 0) return alert('Укажите цену!');

    const userId = tg.initDataUnsafe?.user?.id || '76561198000000000';
    
    try {
        const response = await fetch(`${API_BASE}/api/market/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: window.currentSaleItem.name,
                price: parseFloat(price),
                hash: window.currentSaleItem.hash,
                sellerSid: userId
            })
        });
        if (response.ok) {
            closeSaleModal();
            appNavigate('market');
            initApp();
        }
    } catch (e) {
        alert('Ошибка выставления');
    }
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', initApp);
