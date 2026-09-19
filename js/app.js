// Скачай, что надо! — поиск в центре

let items = [];
let currentDevice = "unknown";
let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let history = JSON.parse(localStorage.getItem("history") || "[]");

function detectDevice() {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    if (/iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "iPad";
    return "iPhone";
  }
  if (/android/i.test(ua)) return "Android";
  return "Desktop";
}

function getDeviceKey() {
  if (currentDevice === "iPhone" || currentDevice === "iPad") return "iphone";
  if (currentDevice === "Android") return "android";
  return "web";
}

function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.textContent = saved === "dark" ? "☀️" : "🌙";
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  const next = cur === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  document.getElementById("theme-toggle").textContent = next === "dark" ? "☀️" : "🌙";
}

async function loadData() {
  try {
    const res = await fetch("data/apps.json");
    items = await res.json();
  } catch (e) {
    items = [];
  }
}

function smartSearch(query) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();
  const terms = q.split(/[\s,.-]+/).filter(t => t.length > 1);

  const scored = items.map(item => {
    let score = 0;
    const name = (item.name || "").toLowerCase();
    const dev = (item.developer || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    const short = (item.shortDescription || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const tags = ((item.categories || []).join(" ") + " " + (item.tags || []).join(" ")).toLowerCase();
    const type = item.type || "app";

    if (name === q) score += 200;
    else if (name.startsWith(q)) score += 120;
    else if (name.includes(q)) score += 80;

    terms.forEach(t => {
      if (name.includes(t)) score += 25;
      if (dev.includes(t)) score += 12;
      if (cat.includes(t)) score += 10;
      if (tags.includes(t)) score += 8;
      if (short.includes(t)) score += 6;
      if (desc.includes(t)) score += 3;
    });

    if ((q.includes("банк") || q.includes("сбер") || q.includes("тиньк") || q.includes("т-банк")) && (cat.includes("банк") || name.includes("сбер") || name.includes("т-банк") || name.includes("тиньк"))) score += 40;
    if ((q.includes("ии") || q.includes("нейро") || q.includes("chatgpt") || q.includes("gpt") || q.includes("claude") || q.includes("gemini")) && cat.includes("интеллект")) score += 35;
    if ((q.includes("мессендж") || q.includes("чат") || q.includes("телег") || q.includes("whats")) && cat.includes("мессендж")) score += 30;
    if ((q.includes("видео") || q.includes("ютуб") || q.includes("youtube")) && (cat.includes("видео") || name.includes("youtube"))) score += 30;
    if ((q.includes("музык") || q.includes("spotify") || q.includes("песн")) && cat.includes("музык")) score += 25;
    if ((q.includes("карт") || q.includes("навигац") || q.includes("яндекс") || q.includes("google maps")) && cat.includes("навигац")) score += 25;
    if (q.includes("сайт") && type === "site") score += 20;
    if ((q.includes("прилож") || q.includes("скачать") || q.includes("app")) && type === "app") score += 15;

    if (item.isPopular) score += 5;
    if (item.isNew) score += 3;

    return { item, score };
  });

  return scored
    .filter(x => x.score > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(x => x.item);
}

function isFavorite(id) {
  return favorites.includes(id);
}

function toggleFavorite(id, e) {
  if (e) e.stopPropagation();
  const i = favorites.indexOf(id);
  if (i === -1) favorites.push(id);
  else favorites.splice(i, 1);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderCurrentView();
}

function addToHistory(id) {
  history = [id, ...history.filter(h => h !== id)].slice(0, 12);
  localStorage.setItem("history", JSON.stringify(history));
}

function openItem(id) {
  location.hash = "#/item/" + id;
}

function renderSearchHome() {
  const recent = history.map(id => items.find(i => i.id === id)).filter(Boolean).slice(0, 6);

  return `
    <div class="search-home">
      <div class="search-hero">
        <img src="assets/logo.png" alt="" class="hero-logo" width="88" height="88"
          onerror="this.outerHTML='<div class=\\'hero-logo-fallback\\'>↓</div>'">
        <h1>Скачай, что надо!</h1>
        <p class="hero-sub">Введи название или опиши, что ищешь — подберём подходящие варианты</p>

        <div class="big-search">
          <input type="search" id="main-search" placeholder="Например: Сбер, ChatGPT, карты, мессенджер…" autocomplete="off" autofocus />
          <button class="search-btn" id="search-btn">Найти</button>
        </div>

        <div class="quick-tags">
          <button class="tag" data-q="СберБанк">СберБанк</button>
          <button class="tag" data-q="Т-Банк">Т-Банк</button>
          <button class="tag" data-q="ChatGPT">ChatGPT</button>
          <button class="tag" data-q="Telegram">Telegram</button>
          <button class="tag" data-q="YouTube">YouTube</button>
          <button class="tag" data-q="карты">Карты</button>
          <button class="tag" data-q="ИИ">ИИ</button>
        </div>
      </div>

      <div id="results-area" class="results-area" style="display:none">
        <h2 class="results-title">Результаты</h2>
        <div id="results-list" class="results-list"></div>
      </div>

      ${recent.length ? `
        <div class="recent-block">
          <h3>Недавно искали</h3>
          <div class="recent-chips">
            ${recent.map(r => `<button class="chip" onclick="openItem('${r.id}')">${r.name}</button>`).join("")}
          </div>
        </div>
      ` : ""}

      <div class="hint-block">
        <p>На iPhone для многих банков и сервисов лучший способ — <strong>веб-версия</strong>. Она работает сразу в Safari, без установки.</p>
      </div>
    </div>
  `;
}

function renderResultCard(item) {
  const isSite = item.type === "site";
  const deviceKey = getDeviceKey();
  const install = item.install || {};
  const platform = install[deviceKey] || {};
  const web = platform.web || install.web || item.url;

  let actionLabel = isSite ? "Открыть сайт" : "Подробнее";
  let actionUrl = null;

  if (deviceKey === "iphone") {
    if (platform.appStore) {
      actionLabel = "Открыть в App Store";
      actionUrl = platform.appStore;
    } else if (web) {
      actionLabel = "Открыть веб-версию";
      actionUrl = web;
    }
  } else if (deviceKey === "android") {
    if (platform.googlePlay) {
      actionLabel = "Открыть в Google Play";
      actionUrl = platform.googlePlay;
    } else if (platform.apk) {
      actionLabel = "Скачать APK";
      actionUrl = platform.apk;
    } else if (web) {
      actionLabel = "Открыть веб-версию";
      actionUrl = web;
    }
  } else if (web) {
    actionLabel = isSite ? "Открыть сайт" : "Открыть веб-версию";
    actionUrl = web;
  }

  const typeBadge = isSite
    ? `<span class="badge type-site">Сайт</span>`
    : `<span class="badge type-app">Приложение</span>`;

  return `
    <div class="result-card" onclick="openItem('${item.id}')">
      <img class="result-icon" src="${item.icon}" alt="" loading="lazy"
        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%232563eb%22 width=%22100%22 height=%22100%22 rx=%2220%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>${(item.name||'?')[0]}</text></svg>'">
      <div class="result-info">
        <div class="result-name">${item.name}</div>
        <div class="result-meta">${typeBadge} ${item.category || ""} · ${item.developer || ""}</div>
        <div class="result-desc">${item.shortDescription || ""}</div>
      </div>
      <div class="result-actions" onclick="event.stopPropagation()">
        ${actionUrl
          ? `<a class="btn btn-primary btn-sm" href="${actionUrl}" target="_blank" rel="noopener">${actionLabel}</a>`
          : `<button class="btn btn-primary btn-sm" onclick="openItem('${item.id}')">Подробнее</button>`
        }
      </div>
    </div>
  `;
}

function showResults(query) {
  const list = smartSearch(query);
  const area = document.getElementById("results-area");
  const container = document.getElementById("results-list");
  if (!area || !container) return;

  if (!query.trim()) {
    area.style.display = "none";
    return;
  }

  area.style.display = "block";
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state"><h3>Ничего не найдено</h3><p>Попробуй другое название или описание</p></div>`;
  } else {
    container.innerHTML = list.map(renderResultCard).join("");
  }
}

function renderDetail(id) {
  const item = items.find(i => i.id === id);
  if (!item) {
    return `<div class="empty-state"><h3>Не найдено</h3><a href="#/" class="btn btn-primary">На главную</a></div>`;
  }
  addToHistory(id);

  const deviceKey = getDeviceKey();
  const install = item.install || {};
  const platform = install[deviceKey] || {};
  const web = platform.web || install.web || item.url;
  const isSite = item.type === "site";

  let blocks = [];

  if (deviceKey === "iphone") {
    if (platform.appStore) {
      blocks.push({
        title: "App Store",
        desc: "Официальная установка через App Store",
        url: platform.appStore,
        primary: true,
        label: "Открыть в App Store"
      });
    }
    if (web) {
      blocks.push({
        title: "Веб-версия",
        desc: "Работает сразу в Safari. Часто лучший способ, когда приложения нет в App Store.",
        url: web,
        primary: !platform.appStore,
        label: "Открыть веб-версию"
      });
    }
    if (!platform.appStore && isSite === false) {
      blocks.unshift({
        type: "warning",
        text: "Прямая установка этого приложения на iPhone через сторонние сайты невозможна без джейлбрейка. Apple не позволяет устанавливать произвольные IPA. Используй App Store (если доступно) или веб-версию."
      });
    }
  } else if (deviceKey === "android") {
    if (platform.googlePlay) {
      blocks.push({
        title: "Google Play",
        desc: "Официальная установка",
        url: platform.googlePlay,
        primary: true,
        label: "Открыть в Google Play"
      });
    }
    if (platform.apk) {
      blocks.push({
        title: "Официальный APK",
        desc: "Файл с сайта разработчика",
        url: platform.apk,
        label: "Скачать APK"
      });
    }
    if (web) {
      blocks.push({
        title: "Веб-версия",
        desc: "Открыть в браузере",
        url: web,
        label: "Открыть"
      });
    }
  } else {
    if (web) {
      blocks.push({
        title: isSite ? "Сайт" : "Веб-версия",
        desc: "Открыть в браузере",
        url: web,
        primary: true,
        label: "Открыть"
      });
    }
    if (install.iphone?.appStore) {
      blocks.push({ title: "App Store", url: install.iphone.appStore, label: "App Store" });
    }
    if (install.android?.googlePlay) {
      blocks.push({ title: "Google Play", url: install.android.googlePlay, label: "Google Play" });
    }
  }

  if (platform.note) {
    blocks.unshift({ type: "info", text: platform.note });
  }
  if (item.regionNote) {
    blocks.unshift({ type: "info", text: "🌍 " + item.regionNote });
  }

  const actionsHtml = blocks.map(b => {
    if (b.type === "warning") return `<div class="warning-box">${b.text}</div>`;
    if (b.type === "info") return `<div class="info-box">${b.text}</div>`;
    return `
      <div class="install-option">
        <div>
          <div class="label">${b.title}</div>
          ${b.desc ? `<div class="note">${b.desc}</div>` : ""}
        </div>
        <a class="btn ${b.primary ? "btn-primary" : "btn-outline"} btn-sm" href="${b.url}" target="_blank" rel="noopener">${b.label}</a>
      </div>`;
  }).join("");

  return `
    <div class="app-detail">
      <a class="back-link" href="#/">← Назад к поиску</a>
      <div class="detail-header">
        <img class="detail-icon" src="${item.icon}" alt=""
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%232563eb%22 width=%22100%22 height=%22100%22 rx=%2220%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>${(item.name||'?')[0]}</text></svg>'">
        <div class="detail-info">
          <h1>${item.name}</h1>
          <div class="dev">${item.developer || ""}</div>
          <div class="detail-meta">
            <span class="badge ${isSite ? "type-site" : "type-app"}">${isSite ? "Сайт" : "Приложение"}</span>
            <span class="badge">${item.category || ""}</span>
            ${item.rating ? `<span class="badge">★ ${item.rating}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h2>Описание</h2>
        <p>${item.description || item.shortDescription || ""}</p>
      </div>

      <div class="detail-section">
        <h2>Как открыть / установить</h2>
        <p style="margin-bottom:12px;color:var(--text-secondary);font-size:0.92rem">Ваше устройство: <strong>${currentDevice}</strong></p>
        <div class="install-options">${actionsHtml || "<div class='warning-box'>Подходящих способов не найдено</div>"}</div>
      </div>
    </div>
  `;
}

function renderCurrentView() {
  const hash = (location.hash || "#/").slice(1);
  const main = document.getElementById("main");
  if (!main) return;

  if (hash.startsWith("/item/") || hash.startsWith("/app/")) {
    const id = hash.replace(/^\/(item|app)\//, "");
    main.innerHTML = renderDetail(id);
    document.title = (items.find(i => i.id === id)?.name || "Результат") + " — Скачай, что надо!";
  } else {
    main.innerHTML = renderSearchHome();
    document.title = "Скачай, что надо!";
    setupSearchUI();
  }
}

function setupSearchUI() {
  const input = document.getElementById("main-search");
  const btn = document.getElementById("search-btn");
  if (!input) return;

  const doSearch = () => showResults(input.value);

  input.addEventListener("input", () => {
    if (input.value.trim().length >= 2) doSearch();
    else {
      const area = document.getElementById("results-area");
      if (area) area.style.display = "none";
    }
  });
  input.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });
  btn?.addEventListener("click", doSearch);

  document.querySelectorAll(".tag").forEach(tag => {
    tag.addEventListener("click", () => {
      input.value = tag.dataset.q;
      doSearch();
      input.focus();
    });
  });
}

async function init() {
  currentDevice = detectDevice();
  initTheme();
  const badge = document.getElementById("device-badge");
  if (badge) badge.textContent = currentDevice;

  document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);

  await loadData();
  renderCurrentView();
  window.addEventListener("hashchange", renderCurrentView);
}

document.addEventListener("DOMContentLoaded", init);
window.openItem = openItem;
window.toggleFavorite = toggleFavorite;
