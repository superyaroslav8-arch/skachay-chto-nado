// Скачай, что надо! — основной скрипт

const CATEGORIES = [
  { id: "all", name: "Все", icon: "📦" },
  { id: "Игры", name: "Игры", icon: "🎮" },
  { id: "Мессенджеры", name: "Мессенджеры", icon: "💬" },
  { id: "Социальные сети", name: "Социальные сети", icon: "📱" },
  { id: "Музыка", name: "Музыка", icon: "🎵" },
  { id: "Видео", name: "Видео", icon: "🎬" },
  { id: "Искусственный интеллект", name: "ИИ", icon: "🤖" },
  { id: "Образование", name: "Образование", icon: "📚" },
  { id: "Утилиты", name: "Утилиты", icon: "🛠" },
  { id: "Фото и видео", name: "Фото и видео", icon: "📷" },
  { id: "Финансы", name: "Финансы", icon: "💰" },
  { id: "Покупки", name: "Покупки", icon: "🛒" },
  { id: "Навигация", name: "Навигация", icon: "🗺" },
  { id: "Безопасность", name: "Безопасность", icon: "🔐" },
  { id: "Работа", name: "Работа", icon: "💻" },
  { id: "Дизайн", name: "Дизайн", icon: "🎨" },
  { id: "Программирование", name: "Программирование", icon: "👨‍💻" },
  { id: "Популярное", name: "Популярное", icon: "⭐" },
  { id: "Новинки", name: "Новинки", icon: "🆕" }
];

let apps = [];
let currentDevice = "unknown";
let currentCategory = "all";
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let history = JSON.parse(localStorage.getItem("history") || "[]");

// Определение устройства
function detectDevice() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    if (/iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      return "iPad";
    }
    return "iPhone";
  }
  if (/android/i.test(ua)) {
    return /mobile/i.test(ua) ? "Android" : "Android Tablet";
  }
  return "Desktop";
}

function getDeviceKey() {
  if (currentDevice === "iPhone" || currentDevice === "iPad") return "iphone";
  if (currentDevice.startsWith("Android")) return "android";
  return "web";
}

// Тема
function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeButton(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  updateThemeButton(next);
}

function updateThemeButton(theme) {
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

// Загрузка данных
async function loadApps() {
  try {
    const res = await fetch("data/apps.json");
    apps = await res.json();
    return apps;
  } catch (e) {
    console.error("Ошибка загрузки каталога:", e);
    apps = [];
    return [];
  }
}

// Поиск
function searchApps(query) {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();
  return apps.filter(app => {
    return (
      app.name.toLowerCase().includes(q) ||
      app.developer.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q) ||
      (app.categories || []).some(c => c.toLowerCase().includes(q)) ||
      (app.shortDescription || "").toLowerCase().includes(q) ||
      (app.description || "").toLowerCase().includes(q)
    );
  }).slice(0, 12);
}

// Избранное
function toggleFavorite(id, e) {
  if (e) e.stopPropagation();
  const idx = favorites.indexOf(id);
  if (idx === -1) {
    favorites.push(id);
  } else {
    favorites.splice(idx, 1);
  }
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderCurrentView();
}

function isFavorite(id) {
  return favorites.includes(id);
}

// История
function addToHistory(id) {
  history = history.filter(h => h !== id);
  history.unshift(id);
  if (history.length > 12) history = history.slice(0, 12);
  localStorage.setItem("history", JSON.stringify(history));
}

// Рендер карточки
function renderCard(app) {
  const platforms = (app.platforms || []).map(p => `<span class="badge platform">${p}</span>`).join("");
  const favClass = isFavorite(app.id) ? "active" : "";
  const favIcon = isFavorite(app.id) ? "★" : "☆";
  return `
    <div class="app-card" onclick="openApp('${app.id}')">
      <div class="app-card-header">
        <img class="app-card-icon" src="${app.icon}" alt="${app.name}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%232563eb%22 width=%22100%22 height=%22100%22 rx=%2220%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>${app.name[0]}</text></svg>'">
        <div class="app-card-info">
          <h3>${app.name}</h3>
          <div class="dev">${app.developer}</div>
        </div>
      </div>
      <div class="app-card-meta">
        <span class="badge">${app.category}</span>
        ${app.rating ? `<span class="badge">★ ${app.rating}</span>` : ""}
        ${platforms}
      </div>
      <div class="app-card-desc">${app.shortDescription || ""}</div>
      <div class="app-card-footer">
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openApp('${app.id}')">Подробнее</button>
        <button class="fav-btn ${favClass}" onclick="toggleFavorite('${app.id}', event)" title="Избранное">${favIcon}</button>
      </div>
    </div>
  `;
}

// Главная
function renderHome() {
  const popular = apps.filter(a => a.isPopular).slice(0, 8);
  const games = apps.filter(a => a.category === "Игры" || (a.categories || []).includes("Игры")).slice(0, 6);
  const news = apps.filter(a => a.isNew).slice(0, 6);
  const free = apps.filter(a => a.isFree).slice(0, 8);
  const forIphone = apps.filter(a => (a.platforms || []).some(p => p.includes("iPhone") || p.includes("iPad"))).slice(0, 6);
  const forAndroid = apps.filter(a => (a.platforms || []).some(p => p.includes("Android"))).slice(0, 6);

  let historyHtml = "";
  if (history.length) {
    const histApps = history.map(id => apps.find(a => a.id === id)).filter(Boolean);
    historyHtml = `
      <div class="section">
        <h2 class="section-title">🕐 Недавно смотрели</h2>
        <div class="history-list">
          ${histApps.map(a => `<div class="history-chip" onclick="openApp('${a.id}')">${a.name}</div>`).join("")}
        </div>
      </div>
    `;
  }

  return `
    <div class="hero">
      <h1>Скачай, что надо!</h1>
      <p>Большой каталог приложений и игр для iPhone, iPad и Android с реальными способами установки</p>
      <div class="search-box">
        <span class="search-icon">🔎</span>
        <input type="search" id="search-input" placeholder="Что хотите скачать?" autocomplete="off" />
        <div class="search-results" id="search-results"></div>
      </div>
    </div>

    <div class="categories" id="categories">
      ${CATEGORIES.map(c => `
        <button class="cat-btn ${currentCategory === c.id ? "active" : ""}" data-cat="${c.id}">
          ${c.icon} ${c.name}
        </button>
      `).join("")}
    </div>

    ${historyHtml}

    <div class="section">
      <h2 class="section-title">⭐ Популярные</h2>
      <div class="apps-grid">${popular.map(renderCard).join("")}</div>
    </div>

    <div class="section">
      <h2 class="section-title">🎮 Игры</h2>
      <div class="apps-grid">${games.map(renderCard).join("") || "<div class='empty-state'>Пока нет игр в каталоге</div>"}</div>
    </div>

    <div class="section">
      <h2 class="section-title">🆕 Новинки</h2>
      <div class="apps-grid">${news.map(renderCard).join("")}</div>
    </div>

    <div class="section">
      <h2 class="section-title">📱 Для iPhone / iPad</h2>
      <div class="apps-grid">${forIphone.map(renderCard).join("")}</div>
    </div>

    <div class="section">
      <h2 class="section-title">🤖 Для Android</h2>
      <div class="apps-grid">${forAndroid.map(renderCard).join("")}</div>
    </div>

    <div class="section">
      <h2 class="section-title">💚 Бесплатные</h2>
      <div class="apps-grid">${free.map(renderCard).join("")}</div>
    </div>
  `;
}

// Каталог по категории
function renderCatalog(catId) {
  let filtered = apps;
  if (catId && catId !== "all") {
    filtered = apps.filter(a =>
      a.category === catId ||
      (a.categories || []).includes(catId) ||
      (catId === "Популярное" && a.isPopular) ||
      (catId === "Новинки" && a.isNew)
    );
  }
  const title = CATEGORIES.find(c => c.id === catId)?.name || "Каталог";
  return `
    <div class="section">
      <h2 class="section-title">${title} <span style="font-weight:400;color:var(--text-secondary)">(${filtered.length})</span></h2>
      <div class="categories" style="justify-content:flex-start;margin-bottom:20px">
        ${CATEGORIES.map(c => `
          <button class="cat-btn ${catId === c.id ? "active" : ""}" data-cat="${c.id}">
            ${c.icon} ${c.name}
          </button>
        `).join("")}
      </div>
      <div class="apps-grid">
        ${filtered.length ? filtered.map(renderCard).join("") : "<div class='empty-state'><h3>Ничего не найдено</h3><p>Попробуйте другую категорию</p></div>"}
      </div>
    </div>
  `;
}

// Страница приложения
function renderAppDetail(id) {
  const app = apps.find(a => a.id === id);
  if (!app) {
    return `<div class="empty-state"><h3>Приложение не найдено</h3><a class="btn btn-primary" href="#/">На главную</a></div>`;
  }

  addToHistory(id);

  const deviceKey = getDeviceKey();
  const install = app.install || {};
  const platformInstall = install[deviceKey] || {};
  const webInstall = install.web;

  let installHtml = "";
  const options = [];

  if (deviceKey === "iphone") {
    if (platformInstall.appStore) {
      options.push({
        label: "App Store",
        url: platformInstall.appStore,
        note: platformInstall.note || null
      });
    }
    if (platformInstall.web || webInstall) {
      options.push({
        label: "Веб-версия",
        url: platformInstall.web || webInstall,
        note: "Открыть в браузере"
      });
    }
    if (platformInstall.officialSite) {
      options.push({
        label: "Официальный сайт",
        url: platformInstall.officialSite
      });
    }
    if (!options.length) {
      installHtml = `<div class="warning-box">Прямая установка на это устройство недоступна.</div>`;
      if (webInstall) {
        options.push({ label: "Открыть веб-версию", url: webInstall });
      }
    }
  } else if (deviceKey === "android") {
    if (platformInstall.googlePlay) {
      options.push({
        label: "Google Play",
        url: platformInstall.googlePlay,
        note: platformInstall.note || null
      });
    }
    if (platformInstall.officialSite) {
      options.push({
        label: "Официальный сайт разработчика",
        url: platformInstall.officialSite
      });
    }
    if (platformInstall.apk) {
      options.push({
        label: "Скачать APK (официальный источник)",
        url: platformInstall.apk,
        note: "Только из проверенного источника"
      });
    }
    if (platformInstall.web || webInstall) {
      options.push({
        label: "Веб-версия",
        url: platformInstall.web || webInstall
      });
    }
  } else {
    // Desktop
    if (webInstall) {
      options.push({ label: "Веб-версия", url: webInstall });
    }
    if (install.iphone?.appStore) {
      options.push({ label: "App Store (для iPhone/iPad)", url: install.iphone.appStore });
    }
    if (install.android?.googlePlay) {
      options.push({ label: "Google Play (для Android)", url: install.android.googlePlay });
    }
  }

  if (options.length) {
    installHtml += options.map(o => `
      <div class="install-option">
        <div>
          <div class="label">${o.label}</div>
          ${o.note ? `<div class="note">${o.note}</div>` : ""}
        </div>
        <a class="btn btn-primary btn-sm" href="${o.url}" target="_blank" rel="noopener noreferrer">Перейти</a>
      </div>
    `).join("");
  } else if (!installHtml) {
    installHtml = `<div class="warning-box">Доступные способы установки для вашего устройства не найдены. Проверьте официальный сайт разработчика.</div>`;
  }

  if (app.regionNote) {
    installHtml = `<div class="info-box">🌍 ${app.regionNote}</div>` + installHtml;
  }

  if (app.isFree === false && !app.install?.iphone?.appStore && !app.install?.android?.googlePlay) {
    installHtml = `<div class="warning-box">Бесплатная легальная установка недоступна. Используйте официальные магазины для приобретения.</div>` + installHtml;
  }

  const platforms = (app.platforms || []).map(p => `<span class="badge platform">${p}</span>`).join(" ");
  const favClass = isFavorite(app.id) ? "active" : "";
  const favIcon = isFavorite(app.id) ? "★" : "☆";

  return `
    <div class="app-detail">
      <a class="back-link" href="#/">← Назад к каталогу</a>
      <div class="detail-header">
        <img class="detail-icon" src="${app.icon}" alt="${app.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%232563eb%22 width=%22100%22 height=%22100%22 rx=%2220%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>${app.name[0]}</text></svg>'">
        <div class="detail-info">
          <h1>${app.name}</h1>
          <div class="dev">${app.developer}</div>
          <div class="detail-meta">
            <span class="badge">${app.category}</span>
            ${app.rating ? `<span class="badge">★ ${app.rating}</span>` : ""}
            ${app.version ? `<span class="badge">v${app.version}</span>` : ""}
            ${app.size ? `<span class="badge">${app.size}</span>` : ""}
            ${platforms}
            <button class="fav-btn ${favClass}" onclick="toggleFavorite('${app.id}')" title="Избранное">${favIcon}</button>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h2>Описание</h2>
        <p>${app.description || app.shortDescription || ""}</p>
      </div>

      <div class="detail-section">
        <h2>Как установить на ваше устройство</h2>
        <p style="margin-bottom:12px;color:var(--text-secondary);font-size:0.95rem">
          Вы используете: <strong>${currentDevice}</strong>
        </p>
        <div class="install-options">
          ${installHtml}
        </div>
      </div>

      <div class="detail-section">
        <h2>Официальные источники</h2>
        <p style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:12px">
          Все ссылки ведут на официальные магазины или сайты разработчиков. Мы не распространяем файлы самостоятельно.
        </p>
        <div class="install-options">
          ${install.iphone?.appStore ? `<div class="install-option"><div class="label">App Store</div><a class="btn btn-outline btn-sm" href="${install.iphone.appStore}" target="_blank" rel="noopener">Открыть</a></div>` : ""}
          ${install.android?.googlePlay ? `<div class="install-option"><div class="label">Google Play</div><a class="btn btn-outline btn-sm" href="${install.android.googlePlay}" target="_blank" rel="noopener">Открыть</a></div>` : ""}
          ${webInstall ? `<div class="install-option"><div class="label">Веб-версия</div><a class="btn btn-outline btn-sm" href="${webInstall}" target="_blank" rel="noopener">Открыть</a></div>` : ""}
        </div>
      </div>
    </div>
  `;
}

// Избранное
function renderFavorites() {
  const favApps = favorites.map(id => apps.find(a => a.id === id)).filter(Boolean);
  return `
    <div class="section">
      <h2 class="section-title">⭐ Избранное</h2>
      ${favApps.length
        ? `<div class="apps-grid">${favApps.map(renderCard).join("")}</div>`
        : `<div class="empty-state"><h3>Пока пусто</h3><p>Добавляйте приложения звёздочкой на карточках</p></div>`
      }
    </div>
  `;
}

// Роутинг
function renderCurrentView() {
  const hash = location.hash.slice(1) || "/";
  const main = document.getElementById("main");
  if (!main) return;

  if (hash.startsWith("/app/")) {
    const id = hash.replace("/app/", "");
    main.innerHTML = renderAppDetail(id);
    document.title = (apps.find(a => a.id === id)?.name || "Приложение") + " — Скачай, что надо!";
  } else if (hash === "/favorites") {
    main.innerHTML = renderFavorites();
    document.title = "Избранное — Скачай, что надо!";
  } else if (hash.startsWith("/category/")) {
    const cat = decodeURIComponent(hash.replace("/category/", ""));
    currentCategory = cat;
    main.innerHTML = renderCatalog(cat);
    document.title = cat + " — Скачай, что надо!";
  } else if (hash === "/catalog") {
    currentCategory = "all";
    main.innerHTML = renderCatalog("all");
    document.title = "Каталог — Скачай, что надо!";
  } else {
    currentCategory = "all";
    main.innerHTML = renderHome();
    document.title = "Скачай, что надо! — Каталог приложений и игр";
    setupSearch();
  }

  // Навешиваем обработчики категорий
  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      if (cat === "all") {
        location.hash = "#/";
      } else {
        location.hash = "#/category/" + encodeURIComponent(cat);
      }
    });
  });
}

function openApp(id) {
  location.hash = "#/app/" + id;
}

function setupSearch() {
  const input = document.getElementById("search-input");
  const results = document.getElementById("search-results");
  if (!input || !results) return;

  input.addEventListener("input", () => {
    const q = input.value;
    const found = searchApps(q);
    if (found.length && q.trim()) {
      results.innerHTML = found.map(app => `
        <div class="search-item" onclick="openApp('${app.id}'); document.getElementById('search-results').classList.remove('show');">
          <img src="${app.icon}" alt="" loading="lazy" onerror="this.style.display='none'">
          <div>
            <strong>${app.name}</strong>
            <div style="font-size:0.85rem;color:var(--text-secondary)">${app.developer} · ${app.category}</div>
          </div>
        </div>
      `).join("");
      results.classList.add("show");
    } else {
      results.classList.remove("show");
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const found = searchApps(input.value);
      if (found.length === 1) {
        openApp(found[0].id);
        results.classList.remove("show");
      } else if (found.length > 1) {
        location.hash = "#/catalog";
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-box")) {
      results.classList.remove("show");
    }
  });
}

// Инициализация
async function init() {
  currentDevice = detectDevice();
  initTheme();

  const badge = document.getElementById("device-badge");
  if (badge) {
    badge.textContent = `Вы используете: ${currentDevice}`;
  }

  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

  const menuBtn = document.getElementById("mobile-menu-btn");
  const nav = document.getElementById("nav");
  menuBtn?.addEventListener("click", () => nav?.classList.toggle("open"));

  await loadApps();
  renderCurrentView();
  window.addEventListener("hashchange", renderCurrentView);
}

document.addEventListener("DOMContentLoaded", init);

// Экспорт для onclick
window.openApp = openApp;
window.toggleFavorite = toggleFavorite;
