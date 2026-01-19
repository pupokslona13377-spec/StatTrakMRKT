const tg = window.Telegram.WebApp;
const API_BASE = 'https://stattrakmrkt.onrender.com';

tg.ready();
tg.expand();

// Убираем лоадер через 7 сек в любом случае
setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader && loader.style.display !== 'none') {
        loader.style.display = 'none';
    }
}, 7000);

// Инициализация при старте
async function initApp() {
    try {
        const response = await fetch(`${API_BASE}/api/market`);
        const items = await response.json();
        renderMarket(items);
        updateBalance();
    } catch (err) {
        console.error("Ошибка при старте:", err);
    } finally {
        const loader = document.getElementById('loading-screen');
        if (loader) loader.style.display = 'none';
    }
}

// НАВИГАЦИЯ
function appNavigate(page, el) {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page + '-page');
    if (targetPage) targetPage.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (el) el.classList.add('active');

    if (page === 'inventory') loadInventory();
}

// ОТРИСОВКА МАРКЕТА
function renderMarket(items) {
    const grid = document.getElementById('market-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!items || items.length === 0) {
        grid.innerHTML = '<p style="color:gray; text-align:center; width:100%; margin-top:20px;">Маркет пуст</p>';
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
    if (!confirm('Вы уверены, что хотите купить этот скин?')) return;
    const userId = tg.initDataUnsafe?.user?.id || '76561198000000000';
    
    try {
        const response = await fetch(`${API_BASE}/api/market/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, itemId })
        });
        const res = await response.json();
        if (res.success) {
            alert('Покупка успешна!');
            initApp();
        } else {
            alert('Ошибка: ' + res.message);
        }
    } catch (e) {
        alert('Ошибка сервера при покупке');
    }
}

// ОБНОВЛЕНИЕ БАЛАНСА
async function updateBalance() {
    const userId = tg.initDataUnsafe?.user?.id || '76561198000000000';
    try {
        const response = await fetch(`${API_BASE}/api/user/${userId}`);
        const data = await response.json();
        document.getElementById('user-balance').innerText = `$${data.balance.toFixed(2)}`;
    } catch (e) {
        console.error("Ошибка баланса");
    }
}

// ИНВЕНТАРЬ (ЗАГРУЗКА)
async function loadInventory() {
    const container = document.getElementById('inventory-grid');
    if (!container) return;
    container.innerHTML = '<p>Загрузка инвентаря...</p>';
    
    const steamId = '76561198000000000'; // Замени на ввод пользователя позже

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
        container.innerHTML = '<p>Ошибка доступа к Steam</p>';
    }
}

// МОДАЛКА ПРОДАЖИ
function openSaleModal(name, hash) {
    document.getElementById('sale-modal').style.display = 'flex';
    document.getElementById('modal-item-name').innerText = name;
    document.getElementById('modal-item-img').src = `https://community.cloudflare.steamstatic.com/economy/image/${hash}`;
    window.currentSaleItem = { name, hash };
}

function closeSaleModal() {
    document.getElementById('sale-modal').style.display = 'none';
}

async function confirmSale() {
    const price = document.getElementById('sale-price').value;
    if (!price || price <= 0) return alert('Введите цену');

    const userId = tg.initDataUnsafe?.user?.id || '76561198000000000';
    
    try {
        const response = await fetch(`${API_BASE}/api/market/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: window.currentSaleItem.name,
                price: price,
                hash: window.currentSaleItem.hash,
                sellerSid: userId
            })
        });
        if (response.ok) {
            alert('Выставлено на продажу!');
            closeSaleModal();
            appNavigate('market');
            initApp();
        }
    } catch (e) {
        alert('Ошибка при выставлении');
    }
}

// Слушатель загрузки
document.addEventListener('DOMContentLoaded', initApp);
