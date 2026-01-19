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
        /* ================================================================
           8. ЯДРО (КОНТРОЛЛЕР ПРИЛОЖЕНИЯ)
           ================================================================
        */
        const tg = window.Telegram.WebApp;
        const API_BASE = 'https://stattrakmrkt.onrender.com';
        let cachedMarket = [];

        // --- ДОБАВЛЕНО: ФУНКЦИЯ ОПРЕДЕЛЕНИЯ РЕДКОСТИ ---
       function getRarityClass(item) {
    const typeStr = (item.type || "").toLowerCase();
    const tagStr = item.tags ? JSON.stringify(item.tags).toLowerCase() : "";
    const full = typeStr + " " + tagStr;

    if (full.includes('covert') || full.includes('тайное')) return 'rare-covert';
    if (full.includes('classified') || full.includes('засекреченное')) return 'rare-classified';
    if (full.includes('restricted') || full.includes('запрещенное')) return 'rare-restricted';
    if (full.includes('mil-spec') || full.includes('армейское')) return 'rare-milspec';
    if (full.includes('knife') || full.includes('нож') || full.includes('gloves') || full.includes('перчатки')) return 'rare-gold';
    return 'rare-common';
}
        // Старт системы
        window.addEventListener('DOMContentLoaded', async () => {
            tg.ready();
            tg.expand();
            
            // Настройка темы под ТГ
            document.body.style.setProperty('--tg-color', tg.themeParams.button_color);

            // Загрузка данных
            const storedSid = localStorage.getItem('titanium_sid');
            if (storedSid) document.getElementById('steam-id-field').value = storedSid;

            await loadMarketData();

            // Плавное скрытие загрузки
            setTimeout(() => {
                const ls = document.getElementById('loading-screen');
                ls.style.opacity = '0';
                setTimeout(() => ls.style.display = 'none', 500);
            }, 800);
        });

        // Навигация
        function appNavigate(page, el) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            
            document.getElementById('page-' + page).classList.add('active');
            el.classList.add('active');

            // Скрываем поиск в профиле и хабе
            document.getElementById('search-bar-container').style.display = (page === 'market') ? 'block' : 'none';

            if (page === 'profile') loadInventory();
            
            tg.HapticFeedback.impactOccurred('light');
        }

        // Загрузка Маркета
        async function loadMarketData() {
            const list = document.getElementById('market-list');
            try {
                const response = await fetch(`${API_BASE}/api/market`);
                cachedMarket = await response.json();
                renderItems(cachedMarket, 'market-list', true);
            } catch (err) {
                list.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px; opacity:0.3;">Маркет временно недоступен</p>`;
            }
        }

        // Умный Рендер (Исправляет картинки и undefined + ДОБАВЛЕНА РЕДКОСТЬ)
        function renderItems(items, containerId, isMarket = false) {
            const container = document.getElementById(containerId);
            if (!items || items.length === 0) {
                container.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:20px; opacity:0.3;">Нет предметов</p>`;
                return;
            }

            container.innerHTML = items.map(item => {
                // ПРАВИЛЬНАЯ ЛОГИКА КАРТИНОК STEAM
                let imgCode = item.icon_url || item.image || item.img;
                let fullImg = '';

                if (imgCode) {
                    if (imgCode.includes('http')) {
                        fullImg = imgCode;
                    } else {
                        fullImg = `https://community.cloudflare.steamstatic.com/economy/image/${imgCode}/330x192`;
                    }
                } else {
                    fullImg = 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVdgYpw23d9dfHldogjSA1BW7mD8v_k_W4RS04_IiH6NBX8j66F8WLY';
                }

                const itemName = item.name || item.market_hash_name || 'CS2 Item';
                
                // --- ДОБАВЛЕНО: ПОЛУЧАЕМ КЛАСС РЕДКОСТИ ---
                const rClass = getRarityClass(item);

                return `
                <div class="item-card anim-fade">
                    <div class="item-img-holder">
                        <img src="${fullImg}" class="item-img" onerror="this.src='https://community.cloudflare.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVdgYpw23d9dfHldogjSA1BW7mD8v_k_W4RS04_IiH6NBX8j66F8WLY'">
                    </div>
                    <div class="item-name">${itemName}</div>
                    <div class="item-footer">
                        <div class="price-tag">
                           <svg width="14" height="14" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:4px;"><path d="M28 56C43.464 56 56 43.464 56 28C56 12.536 43.464 0 28 0C12.536 0 0 12.536 0 28C0 43.464 12.536 56 28 56ZM14.5607 15.7513C14.7963 15.3979 15.228 15.2158 15.6318 15.2995L27.6318 17.7995C27.8727 17.8497 28.1273 17.8497 28.3682 17.7995L40.3682 15.2995C40.772 15.2158 41.2037 15.3979 41.4393 15.7513C41.6749 16.1047 41.6738 16.5701 41.4367 16.9234L28.9367 35.4234C28.5146 36.0487 27.4854 36.0487 27.0633 35.4234L14.5633 16.9234C14.3262 16.5701 14.3251 16.1047 14.5607 15.7513Z" fill="#00D2FF"/></svg>
${item.price || '0.00'}
                        </div>
                    </div>
                    <button class="action-btn" onclick="${isMarket ? `itemAction('buy', '${item.id}')` : `itemAction('sell', '${item.id}')`}">
                        ${isMarket ? 'Купить' : 'Продать'}
                    </button>
                    <div class="rarity-line ${rClass}"></div>
                </div>`;
            }).join('');
        }

        // ИСПРАВЛЕННЫЙ ИНВЕНТАРЬ (MAPPER LOGIC)
        async function loadInventory() {
            const sid = document.getElementById('steam-id-field').value.trim();
            const grid = document.getElementById('inventory-grid');
            const info = document.getElementById('inventory-info');

            if (!sid) {
                grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:40px; opacity:0.3; font-size:12px;">ПРИВЯЖИТЕ STEAM ID ДЛЯ ТОРГОВЛИ</p>`;
                return;
            }

            info.innerText = "СИНХРОНИЗАЦИЯ...";
            
            try {
                const res = await fetch(`${API_BASE}/api/inventory/${sid}`);
                const data = await res.json();

                let items = [];

                // Если API возвращает структуру assets + descriptions (стандарт Steam)
                if (data.assets && data.descriptions) {
                    items = data.assets.map(asset => {
                        const description = data.descriptions.find(d => d.classid === asset.classid);
                        return {
    id: asset.assetid,
    name: description ? description.market_hash_name : 'Предмет Steam',
    icon_url: description ? description.icon_url : '',
    type: description ? description.type : '',      // ОШИБКА БЫЛА ТУТ (отсутствовало)
    tags: description ? description.tags : [],      // И ТУТ
    price: '---'
};
                    });
                } else {
                    items = Array.isArray(data) ? data : (data.items || []);
                }

                if (items.length === 0) {
                    info.innerText = "ИНВЕНТАРЬ ПУСТ ИЛИ СКРЫТ";
                    grid.innerHTML = '';
                } else {
                    info.innerText = `ПРЕДМЕТОВ НАЙДЕНО: ${items.length}`;
                    renderItems(items, 'inventory-grid', false);
                }
            } catch (err) {
                info.innerText = "ОШИБКА API STEAM";
                grid.innerHTML = '';
            }
        }

        function handleSteamSync() {
            const sid = document.getElementById('steam-id-field').value.trim();
            if (sid.length > 10) {
                localStorage.setItem('titanium_sid', sid);
                showToast("Steam ID успешно сохранен");
                loadInventory();
                tg.HapticFeedback.notificationOccurred('success');
            } else {
                showToast("Некорректный SteamID64");
            }
        }

        function filterSkins() {
            const query = document.getElementById('market-search').value.toLowerCase();
            const filtered = cachedMarket.filter(i => (i.name || '').toLowerCase().includes(query));
            renderItems(filtered, 'market-list', true);
        }

        function toggleProfileTab(tab) {
            document.getElementById('tab-inv').classList.toggle('active', tab === 'inv');
            document.getElementById('tab-hist').classList.toggle('active', tab === 'hist');
            
            const grid = document.getElementById('inventory-grid');
            const info = document.getElementById('inventory-info');

            if (tab === 'hist') {
                grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px; opacity:0.2;">НЕТ ИСТОРИИ ОПЕРАЦИЙ</p>`;
                info.innerText = "";
            } else {
                loadInventory();
            }
        }

       let currentSellingItem = null;

/* --- ЛОГИКА ОКНА ПРОДАЖИ (В КОНЕЦ СКРИПТА) --- */
function itemAction(type, id) {
    if (type === 'buy') {
        tg.showConfirm(`Купить этот предмет?`);
    } else {
        const itemCard = document.querySelector(`[onclick*="'${id}'"]`).closest('.item-card');
        document.getElementById('modal-img').src = itemCard.querySelector('.item-img').src;
        document.getElementById('modal-item-name').innerText = itemCard.querySelector('.item-name').innerText;
        document.getElementById('floor-val').innerText = (Math.random() * 0.5 + 0.1).toFixed(2);
        
        // Открываем окно
        const modal = document.getElementById('sell-modal');
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
        tg.HapticFeedback.impactOccurred('medium');
    }
}

function closeSellModal() {
    const modal = document.getElementById('sell-modal');
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; backToInput(); }, 300);
}

function goToConfirm() {
    const price = document.getElementById('sell-price-input').value;
    if (!price || price <= 0) return tg.showAlert("Введите корректную цену!");
    document.getElementById('confirm-price-val').innerText = price;
    document.getElementById('step-input').style.display = 'none';
    document.getElementById('step-confirm').style.display = 'block';
}

function backToInput() {
    document.getElementById('step-input').style.display = 'block';
    document.getElementById('step-confirm').style.display = 'none';
}

function calculateFee(val) {
    const p = parseFloat(val);
    document.getElementById('final-receive').innerText = p ? (p * 0.95).toFixed(2) + " TON" : "0.00 TON";
}

// РЕШЕНИЕ ПРОБЛЕМЫ С КЛАВИАТУРОЙ
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        const modalContent = document.querySelector('.modal-content');
        const offset = window.innerHeight - window.visualViewport.height;
        if (offset > 0) {
            modalContent.style.marginBottom = offset + 'px'; // Поднимаем окно на высоту клавиатуры
        } else {
            modalContent.style.marginBottom = '0px';
        }
    });
}
        // ФУНКЦИЯ ЗАПУСКА АНИМАЦИИ ТЕЛЕЖКИ
function startCartAnimation() {
    // 1. Закрываем модальное окно продажи
    closeSellModal();

    const cart = document.getElementById('cart-anim');
    const box = document.getElementById('items-box');
    
    if (!cart || !box) return; // Защита от ошибок

    box.innerHTML = ''; // Очищаем корзину от старых предметов
    
    // 2. Показываем и запускаем тележку
    cart.classList.add('active');
    
    // Вибрация в Telegram (Тяжелый удар при появлении)
    if(window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
    }

    // 3. Список легендарных скинов (те самые ссылки, которые всегда грузятся)
    const premiumSkins = [
        'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwW09Kzm7-FmP7mDLfYkWNF18lwmO7Eu4_xiVXg_0s_Ym3xctXAdVBoZlvR-FfsxL3ph5S9v53AmCc17id253_VyxSygBtMcKUx0iC9f_7E/200fx200f',
        'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV092lnYmGmOHLPr7Vn35cppQij-qUrN322VbgqBFqYmDycI-RI1A4YVvS8lTole_v08S06Z_MnXUws3Ur7H3ZzAv3309_7A8V7Q/200fx200f',
        'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0Ob3fDJ95466kYe0m_7zO6-fzj9V7cJ0n_rE89Sk0Vbg-0VpYm_wI4-VclA8ZAuF-1m2wL3og5S6uJ_An3Rru3In-z-DyPTo0YhX/200fx200f',
        'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tKznJm0mvLwOq7c2G1Qv5Nz3u_E9N2iilG1-RA-NmqhcY-Sdw9rYV_R-gK-x7y605S1u8zMm3p9-n51YV_0no8/200fx200f',
        'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou7umeldf0Ob3fDxBvYyJh5Saif73N6_um25V4dB8xL2Z8N6tjVax80E-Y273co-SdFNoYAnR_wK4yOi81pC07Zidm3p9-n51pC8f0mU/200fx200f'
    ];

    // Позиции для создания эффекта "горки"
    const stackPositions = [
        { x: '-10px', b: '0px' },
        { x: '20px', b: '0px' },
        { x: '5px', b: '25px' },
        { x: '-15px', b: '45px' },
        { x: '15px', b: '65px' }
    ];

    // 4. Начинаем сыпать скины, когда тележка остановится в центре (через 1.8 сек)
    premiumSkins.forEach((url, i) => {
        setTimeout(() => {
            const img = document.createElement('img');
            img.src = url;
            img.className = 'skin-drop-final';
            img.style.left = stackPositions[i].x;
            img.style.bottom = stackPositions[i].b;
            
            box.appendChild(img);
            
            // Физический эффект тряски тележки при падении предмета
            cart.style.transform = 'translateY(5px)';
            setTimeout(() => cart.style.transform = 'translateY(0)', 80);
            
            // Легкая вибрация при каждом падении
            if(window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.HapticFeedback.impactOccurred('medium');
            }
        }, 1800 + (i * 400));
    });

    // 5. Завершение анимации: убираем тележку и показываем успех
    setTimeout(() => {
        cart.classList.remove('active');
        showToast("✅ Предмет выставлен на маркет!");
        
        if(window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    }, 5600);
}
