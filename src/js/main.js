const $ = (id) => document.getElementById(id);

// ipcMain.handle rejections arrive wrapped as "Error invoking remote method
// '<name>': Error: <actual message>" — unwrap that back to the plain message.
function ipcErrorMessage(error) {
    const raw = error?.message || '';
    const match = raw.match(/^Error invoking remote method '[^']+':\s*(?:Error:\s*)?([\s\S]*)$/);
    return (match ? match[1] : raw).trim();
}

if (!window.api?.auth) {
    document.body.innerHTML =
        '<div style="display:flex;min-height:100vh;align-items:center;justify-content:center;padding:2rem;text-align:center;font-family:sans-serif;color:#f3f4f6;background:#0c0d10;">' +
        '<p>Halaman ini harus dibuka lewat aplikasi desktop (jendela Electron), bukan langsung di tab browser.<br>Jalankan <code>npm run dev</code> lalu tunggu jendela aplikasinya muncul.</p>' +
        '</div>';
    throw new Error('window.api is not available — this page was not opened inside the Electron app.');
}

const viewLogin = $('view-login');
const viewDashboard = $('view-dashboard');

const loginForm = $('login-form');
const emailInput = $('email');
const passwordInput = $('password');
const rememberInput = $('remember');
const errorEmail = $('error-email');
const loginStatus = $('login-status');
const loginError = $('login-error');
const submitButton = $('btn-login-submit');
const submitIdle = $('btn-login-idle');
const submitLoading = $('btn-login-loading');
const btnGoogle = $('btn-google');
const btnDiscord = $('btn-discord');

const userMenuBtn = $('user-menu-btn');
const userMenu = $('user-menu');
const btnLogout = $('btn-logout');

const sidebar = $('sidebar');
const sidebarBackdrop = $('sidebar-backdrop');
const sidebarOpenBtn = $('sidebar-open-btn');
const sidebarCollapseBtn = $('sidebar-collapse-btn');
const sidebarCollapseIcon = $('sidebar-collapse-icon');
const sidebarCollapseLabel = $('sidebar-collapse-label');
const sidebarBrand = $('sidebar-brand');
const sidebarPreset = $('sidebar-preset');
const navItems = document.querySelectorAll('.nav-item');
const navLabels = document.querySelectorAll('.nav-label');
const sidebarSectionLabels = document.querySelectorAll('.sidebar-label');
const contentHeading = $('content-heading');
const placeholderPanel = $('panel-placeholder');
const panels = {
    dashboard: $('panel-dashboard'),
    analytics: $('panel-analytics'),
    gifts: $('panel-gifts'),
    connection: $('panel-connection'),
};
const panelTitles = {
    dashboard: 'Dashboard',
    analytics: 'Statistik Live',
    packages: 'Paket & Harga',
    balance: 'Saldo & Riwayat Transaksi',
    gifts: 'Gift & Stiker',
    connection: 'Connection',
};

const REMEMBERED_EMAIL_KEY = 'sf.rememberedEmail';

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

$('theme-toggle-login')?.addEventListener('click', toggleTheme);
$('theme-toggle-dashboard')?.addEventListener('click', toggleTheme);

$('login-year').textContent = new Date().getFullYear();

function showView(view) {
    viewLogin.hidden = view !== 'login';
    viewDashboard.hidden = view !== 'dashboard';
}

function clearLoginErrors() {
    errorEmail.hidden = true;
    errorEmail.textContent = '';
    loginError.hidden = true;
    loginError.textContent = '';
}

function setLoginBusy(busy) {
    submitButton.disabled = busy;
    submitIdle.hidden = busy;
    submitLoading.hidden = !busy;
}

function renderUser(user) {
    const initial = (user?.name || '?').trim().charAt(0).toUpperCase() || '?';

    $('user-avatar').textContent = initial;
    $('user-name-short').textContent = user?.name || '';
    $('user-name-full').textContent = user?.name || '';
    $('user-email').textContent = user?.email || '';
    $('dashboard-user-name').textContent = user?.name || '';
}

async function bootstrap() {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberInput.checked = true;
    }

    const user = await window.api.auth.getSession();

    if (user) {
        renderUser(user);
        showView('dashboard');
    } else {
        showView('login');
    }
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearLoginErrors();
    setLoginBusy(true);

    try {
        const user = await window.api.auth.login({
            email: emailInput.value.trim(),
            password: passwordInput.value,
        });

        if (rememberInput.checked) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, emailInput.value.trim());
        } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        passwordInput.value = '';
        renderUser(user);
        showView('dashboard');
    } catch (error) {
        errorEmail.hidden = false;
        errorEmail.textContent = ipcErrorMessage(error) || 'Email atau kata sandi salah.';
    } finally {
        setLoginBusy(false);
    }
});

btnGoogle.addEventListener('click', async () => {
    clearLoginErrors();
    loginStatus.hidden = false;
    loginStatus.textContent = 'Membuka browser untuk masuk dengan Google...';
    await window.api.auth.loginWithProvider('google');
});

btnDiscord.addEventListener('click', async () => {
    clearLoginErrors();
    loginStatus.hidden = false;
    loginStatus.textContent = 'Membuka browser untuk masuk dengan Discord...';
    await window.api.auth.loginWithProvider('discord');
});

window.api.auth.onOAuthResult(async (result) => {
    loginStatus.hidden = true;

    if (!result.ok) {
        loginError.hidden = false;
        loginError.textContent = result.error === 'account_disabled' ? 'Akun ini sudah dinonaktifkan.' : 'Gagal masuk. Coba lagi.';
        return;
    }

    const user = await window.api.auth.getSession();

    if (user) {
        renderUser(user);
        showView('dashboard');
    }
});

userMenuBtn.addEventListener('click', () => {
    userMenu.hidden = !userMenu.hidden;
});

document.addEventListener('click', (event) => {
    if (!userMenu.hidden && !userMenuBtn.contains(event.target) && !userMenu.contains(event.target)) {
        userMenu.hidden = true;
    }
});

btnLogout.addEventListener('click', async () => {
    userMenu.hidden = true;
    await window.api.auth.logout();
    emailInput.value = '';
    passwordInput.value = '';
    showView('login');
    showPanel('dashboard');
});

// --- Sidebar (mobile open/close + desktop collapse) ---

const SIDEBAR_COLLAPSED_KEY = 'sf.sidebarCollapsed';

function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    sidebar.classList.add('translate-x-0');
    sidebarBackdrop.hidden = false;
}

function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    sidebar.classList.remove('translate-x-0');
    sidebarBackdrop.hidden = true;
}

function applySidebarCollapsed(collapsed) {
    sidebar.classList.toggle('lg:w-20', collapsed);
    sidebar.classList.toggle('lg:w-64', !collapsed);
    sidebarBrand.classList.toggle('lg:hidden', collapsed);
    sidebarPreset.classList.toggle('lg:hidden', collapsed);
    navLabels.forEach((label) => label.classList.toggle('lg:hidden', collapsed));
    sidebarSectionLabels.forEach((label) => label.classList.toggle('lg:hidden', collapsed));
    navItems.forEach((item) => {
        item.classList.toggle('lg:justify-center', collapsed);
        item.classList.toggle('lg:px-2', collapsed);
    });
    sidebarCollapseLabel.classList.toggle('lg:hidden', collapsed);
    sidebarCollapseIcon.classList.toggle('rotate-180', collapsed);
    sidebarCollapseBtn.classList.toggle('lg:justify-center', collapsed);
    sidebarCollapseBtn.classList.toggle('lg:px-2', collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
}

sidebarOpenBtn.addEventListener('click', openSidebar);
sidebarBackdrop.addEventListener('click', closeSidebar);
sidebarCollapseBtn.addEventListener('click', () => {
    applySidebarCollapsed(!sidebar.classList.contains('lg:w-20'));
});

applySidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');

// --- Panel navigation (Dashboard / Connection) ---

let analyticsRefreshTimer = null;

function showPanel(name) {
    const hasPanel = Object.prototype.hasOwnProperty.call(panels, name);

    Object.entries(panels).forEach(([key, el]) => {
        el.hidden = key !== name;
    });
    placeholderPanel.hidden = hasPanel;
    contentHeading.textContent = panelTitles[name] || '';

    navItems.forEach((item) => {
        const active = item.dataset.nav === name;
        item.classList.toggle('bg-primary-600', active);
        item.classList.toggle('text-white', active);
        item.classList.toggle('text-text-muted', !active);
    });

    closeSidebar();

    if (analyticsRefreshTimer) {
        clearInterval(analyticsRefreshTimer);
        analyticsRefreshTimer = null;
    }

    if (name === 'analytics') {
        loadAndRenderStats();
        analyticsRefreshTimer = setInterval(loadAndRenderStats, 5000);
    }

    if (name === 'gifts') {
        loadGiftsFromCache();
    }
}

navItems.forEach((item) => {
    item.addEventListener('click', () => showPanel(item.dataset.nav));
});

showPanel('dashboard');

// --- TikTok Live connection ---

const tiktokUsernameInput = $('tiktok-username');
const btnTiktokConnect = $('btn-tiktok-connect');
const btnTiktokConnectIdle = $('btn-tiktok-connect-idle');
const btnTiktokConnectLoading = $('btn-tiktok-connect-loading');
const btnTiktokConnectSuccess = $('btn-tiktok-connect-success');
const btnTiktokDisconnect = $('btn-tiktok-disconnect');
const tiktokStatusEl = $('tiktok-status');

const REMEMBERED_TIKTOK_USERNAME_KEY = 'sf.rememberedTiktokUsername';

function renderTiktokState(state) {
    const status = state?.status || 'idle';
    const connecting = status === 'connecting';
    const connected = status === 'connected';

    btnTiktokConnect.disabled = connecting || connected;
    btnTiktokConnectIdle.hidden = connecting || connected;
    btnTiktokConnectLoading.hidden = !connecting;
    btnTiktokConnectSuccess.hidden = !connected;
    btnTiktokDisconnect.hidden = !connected;
    tiktokUsernameInput.disabled = connecting || connected;

    btnTiktokConnect.classList.toggle('bg-primary-600', !connected);
    btnTiktokConnect.classList.toggle('hover:bg-primary-700', !connected);
    btnTiktokConnect.classList.toggle('opacity-60', connecting);
    btnTiktokConnect.classList.toggle('bg-green-600', connected);

    if (connected) {
        tiktokStatusEl.textContent = `Terhubung ke live @${state.username}`;
        tiktokStatusEl.className = 'mt-4 text-sm text-green-600';
    } else if (connecting) {
        tiktokStatusEl.textContent = `Menghubungkan ke @${state.username}...`;
        tiktokStatusEl.className = 'mt-4 text-sm text-text-muted';
    } else if (status === 'error') {
        tiktokStatusEl.textContent = state.error || 'Gagal terhubung.';
        tiktokStatusEl.className = 'mt-4 text-sm text-primary-600';
    } else {
        tiktokStatusEl.textContent = state?.error || '';
        tiktokStatusEl.className = 'mt-4 text-sm text-text-muted';
    }
}

btnTiktokConnect.addEventListener('click', async () => {
    const username = tiktokUsernameInput.value.trim();

    if (!username) {
        tiktokStatusEl.textContent = 'Username TikTok wajib diisi.';
        tiktokStatusEl.className = 'mt-4 text-sm text-primary-600';
        return;
    }

    localStorage.setItem(REMEMBERED_TIKTOK_USERNAME_KEY, username);

    try {
        const state = await window.api.tiktok.connect(username);
        renderTiktokState(state);
    } catch (error) {
        renderTiktokState({ status: 'error', username, error: ipcErrorMessage(error) });
    }
});

btnTiktokDisconnect.addEventListener('click', async () => {
    await window.api.tiktok.disconnect();
});

window.api.tiktok.onStatus(renderTiktokState);

const rememberedTiktokUsername = localStorage.getItem(REMEMBERED_TIKTOK_USERNAME_KEY);
if (rememberedTiktokUsername) {
    tiktokUsernameInput.value = rememberedTiktokUsername;
}

window.api.tiktok.getStatus().then((state) => {
    if (state?.username) {
        tiktokUsernameInput.value = state.username;
    }
    renderTiktokState(state);
});

// --- Analytics (Statistik Live) ---

const statDiamonds = $('stat-diamonds');
const statFollowers = $('stat-followers');
const statSubscribers = $('stat-subscribers');
const statShares = $('stat-shares');
const statsChartSvg = $('stats-chart');
const statsTooltip = $('stats-tooltip');
const topGiftersEl = $('top-gifters');
const topGiftsEl = $('top-gifts');
const topSharersEl = $('top-sharers');
const lastFollowersEl = $('last-followers');
const historyBodyEl = $('history-body');

const numberFormatter = new Intl.NumberFormat('id-ID');

function formatNumber(value) {
    return numberFormatter.format(value || 0);
}

function formatChartDate(isoDate) {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatChartDateFull(isoDate) {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(iso) {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}

function leaderboardRow({ rank, avatarInitial, title, subtitle, value }) {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-3 rounded-lg bg-surface-alt px-3 py-2';

    const left = document.createElement('div');
    left.className = 'flex min-w-0 items-center gap-3';

    const rankEl = document.createElement('span');
    rankEl.className = 'w-4 shrink-0 text-sm font-semibold text-text-muted';
    rankEl.textContent = String(rank);

    const avatar = document.createElement('div');
    avatar.className = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700';
    avatar.textContent = avatarInitial;

    const textWrap = document.createElement('div');
    textWrap.className = 'min-w-0';

    const titleEl = document.createElement('p');
    titleEl.className = 'truncate text-sm font-medium';
    titleEl.textContent = title;
    textWrap.appendChild(titleEl);

    if (subtitle) {
        const subtitleEl = document.createElement('p');
        subtitleEl.className = 'truncate text-xs text-text-muted';
        subtitleEl.textContent = subtitle;
        textWrap.appendChild(subtitleEl);
    }

    left.append(rankEl, avatar, textWrap);

    const valueEl = document.createElement('span');
    valueEl.className = 'shrink-0 text-sm font-semibold';
    valueEl.textContent = value;

    row.append(left, valueEl);

    return row;
}

function renderLeaderboard(container, items, { emptyText, renderItem }) {
    container.innerHTML = '';

    if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'text-sm text-text-muted';
        empty.textContent = emptyText;
        container.appendChild(empty);
        return;
    }

    items.forEach((item, index) => container.appendChild(renderItem(item, index)));
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const CHART_PAD_TOP = 12;
const CHART_PAD_BOTTOM = 28;
const CHART_PLOT_HEIGHT = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
const CHART_BASELINE = CHART_PAD_TOP + CHART_PLOT_HEIGHT;
const SVG_NS = 'http://www.w3.org/2000/svg';

function renderChart(points) {
    statsChartSvg.innerHTML = '';

    if (!points.length) return;

    const maxValue = Math.max(1, ...points.map((p) => p.diamonds));
    const stepX = points.length > 1 ? CHART_WIDTH / (points.length - 1) : 0;
    const xAt = (i) => i * stepX;
    const yAt = (v) => CHART_BASELINE - (v / maxValue) * CHART_PLOT_HEIGHT;

    for (let i = 0; i <= 2; i++) {
        const y = CHART_PAD_TOP + (CHART_PLOT_HEIGHT / 2) * i;
        const gridline = document.createElementNS(SVG_NS, 'line');
        gridline.setAttribute('x1', '0');
        gridline.setAttribute('x2', String(CHART_WIDTH));
        gridline.setAttribute('y1', String(y));
        gridline.setAttribute('y2', String(y));
        gridline.setAttribute('style', 'stroke: var(--color-border); stroke-width: 1;');
        statsChartSvg.appendChild(gridline);
    }

    const linePoints = points.map((p, i) => `${xAt(i)},${yAt(p.diamonds)}`).join(' L ');

    const defs = document.createElementNS(SVG_NS, 'defs');
    const gradient = document.createElementNS(SVG_NS, 'linearGradient');
    gradient.setAttribute('id', 'stats-chart-gradient');
    gradient.setAttribute('x1', '0');
    gradient.setAttribute('y1', '0');
    gradient.setAttribute('x2', '0');
    gradient.setAttribute('y2', '1');

    const stopTop = document.createElementNS(SVG_NS, 'stop');
    stopTop.setAttribute('offset', '0%');
    stopTop.setAttribute('style', 'stop-color: var(--color-primary-600); stop-opacity: 0.35;');
    const stopBottom = document.createElementNS(SVG_NS, 'stop');
    stopBottom.setAttribute('offset', '100%');
    stopBottom.setAttribute('style', 'stop-color: var(--color-primary-600); stop-opacity: 0;');
    gradient.append(stopTop, stopBottom);
    defs.appendChild(gradient);
    statsChartSvg.appendChild(defs);

    const area = document.createElementNS(SVG_NS, 'path');
    area.setAttribute('d', `M0,${CHART_BASELINE} L ${linePoints} L ${CHART_WIDTH},${CHART_BASELINE} Z`);
    area.setAttribute('fill', 'url(#stats-chart-gradient)');
    area.setAttribute('stroke', 'none');
    statsChartSvg.appendChild(area);

    const line = document.createElementNS(SVG_NS, 'path');
    line.setAttribute('d', `M ${linePoints}`);
    line.setAttribute('fill', 'none');
    line.setAttribute('style', 'stroke: var(--color-primary-600); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;');
    statsChartSvg.appendChild(line);

    const labelEvery = Math.max(1, Math.round(points.length / 6));
    points.forEach((p, i) => {
        if (i % labelEvery !== 0 && i !== points.length - 1) return;

        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(xAt(i)));
        text.setAttribute('y', String(CHART_HEIGHT - 6));
        text.setAttribute('text-anchor', i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle');
        text.setAttribute('style', 'fill: var(--color-text-muted); font-size: 10px;');
        text.textContent = formatChartDate(p.date);
        statsChartSvg.appendChild(text);
    });

    const hoverLine = document.createElementNS(SVG_NS, 'line');
    hoverLine.setAttribute('y1', String(CHART_PAD_TOP));
    hoverLine.setAttribute('y2', String(CHART_BASELINE));
    hoverLine.setAttribute('style', 'stroke: var(--color-text-muted); stroke-width: 1; opacity: 0;');
    statsChartSvg.appendChild(hoverLine);

    const hoverDot = document.createElementNS(SVG_NS, 'circle');
    hoverDot.setAttribute('r', '4');
    hoverDot.setAttribute('style', 'fill: var(--color-primary-600); opacity: 0;');
    statsChartSvg.appendChild(hoverDot);

    const capture = document.createElementNS(SVG_NS, 'rect');
    capture.setAttribute('x', '0');
    capture.setAttribute('y', '0');
    capture.setAttribute('width', String(CHART_WIDTH));
    capture.setAttribute('height', String(CHART_HEIGHT));
    capture.setAttribute('fill', 'transparent');
    statsChartSvg.appendChild(capture);

    capture.addEventListener('mousemove', (event) => {
        const rect = statsChartSvg.getBoundingClientRect();
        const relX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
        let index = stepX ? Math.round(relX / stepX) : 0;
        index = Math.min(points.length - 1, Math.max(0, index));

        const point = points[index];
        const x = xAt(index);
        const y = yAt(point.diamonds);

        hoverLine.setAttribute('x1', String(x));
        hoverLine.setAttribute('x2', String(x));
        hoverLine.style.opacity = '1';
        hoverDot.setAttribute('cx', String(x));
        hoverDot.setAttribute('cy', String(y));
        hoverDot.style.opacity = '1';

        statsTooltip.hidden = false;
        statsTooltip.style.left = `${(x / CHART_WIDTH) * rect.width}px`;
        statsTooltip.style.top = `${(y / CHART_HEIGHT) * rect.height}px`;
        statsTooltip.innerHTML = '';

        const dateEl = document.createElement('p');
        dateEl.className = 'font-medium';
        dateEl.textContent = formatChartDateFull(point.date);
        const valueEl = document.createElement('p');
        valueEl.className = 'text-text-muted';
        valueEl.textContent = `${formatNumber(point.diamonds)} diamonds`;
        statsTooltip.append(dateEl, valueEl);
    });

    capture.addEventListener('mouseleave', () => {
        hoverLine.style.opacity = '0';
        hoverDot.style.opacity = '0';
        statsTooltip.hidden = true;
    });
}

async function loadAndRenderStats() {
    const stats = await window.api.stats.get({ days: 30 });

    statDiamonds.textContent = formatNumber(stats.totals.diamonds);
    statFollowers.textContent = formatNumber(stats.totals.newFollowers);
    statSubscribers.textContent = formatNumber(stats.totals.newSubscribers);
    statShares.textContent = formatNumber(stats.totals.shares);

    renderChart(stats.chart);

    renderLeaderboard(topGiftersEl, stats.topGifters, {
        emptyText: 'Tidak ada data yang tersedia',
        renderItem: (gifter, index) =>
            leaderboardRow({
                rank: index + 1,
                avatarInitial: (gifter.nickname || gifter.uniqueId || '?').charAt(0).toUpperCase(),
                title: gifter.nickname || gifter.uniqueId,
                subtitle: gifter.uniqueId ? `@${gifter.uniqueId}` : '',
                value: formatNumber(gifter.diamonds),
            }),
    });

    renderLeaderboard(topGiftsEl, stats.topGifts, {
        emptyText: 'Tidak ada data yang tersedia',
        renderItem: (gift, index) =>
            leaderboardRow({
                rank: index + 1,
                avatarInitial: '🎁',
                title: gift.name,
                subtitle: '',
                value: `${gift.count}x`,
            }),
    });

    renderLeaderboard(topSharersEl, stats.topSharers, {
        emptyText: 'Tidak ada data yang tersedia',
        renderItem: (sharer, index) =>
            leaderboardRow({
                rank: index + 1,
                avatarInitial: (sharer.nickname || sharer.uniqueId || '?').charAt(0).toUpperCase(),
                title: sharer.nickname || sharer.uniqueId,
                subtitle: sharer.uniqueId ? `@${sharer.uniqueId}` : '',
                value: `${sharer.count}x`,
            }),
    });

    renderLeaderboard(lastFollowersEl, stats.lastFollowers, {
        emptyText: 'Tidak ada data yang tersedia',
        renderItem: (follower, index) =>
            leaderboardRow({
                rank: index + 1,
                avatarInitial: (follower.nickname || follower.uniqueId || '?').charAt(0).toUpperCase(),
                title: follower.nickname || follower.uniqueId,
                subtitle: follower.uniqueId ? `@${follower.uniqueId}` : '',
                value: timeAgo(follower.at),
            }),
    });

    historyBodyEl.innerHTML = '';

    if (!stats.history.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.className = 'py-4 text-center text-text-muted';
        cell.textContent = 'Belum ada riwayat live.';
        row.appendChild(cell);
        historyBodyEl.appendChild(row);
    } else {
        stats.history.forEach((session) => {
            const row = document.createElement('tr');
            row.className = 'border-b border-border last:border-0';

            [
                formatDateTime(session.startedAt),
                session.username,
                formatNumber(session.diamonds),
                formatNumber(session.newFollowers),
                formatNumber(session.newSubscribers),
                formatNumber(session.shares),
            ].forEach((text) => {
                const cell = document.createElement('td');
                cell.className = 'py-2 pr-4';
                cell.textContent = text;
                row.appendChild(cell);
            });

            historyBodyEl.appendChild(row);
        });
    }
}

// --- TikTok Gift & Sticker catalog (read-only, synced from server) ---

const btnGiftsSync = $('btn-gifts-sync');
const btnGiftsSyncIcon = $('btn-gifts-sync-icon');
const btnGiftsSyncLabel = $('btn-gifts-sync-label');
const giftsSyncInfo = $('gifts-sync-info');
const giftsErrorEl = $('gifts-error');
const giftsListEl = $('gifts-list');
const giftsTabs = document.querySelectorAll('.gifts-tab');

const GIFT_TYPE_LABELS = { gift: 'Gift', sticker: 'Stiker' };

let giftsCatalog = { syncedAt: null, categories: [], gifts: [] };
let giftsCurrentType = 'gift';

function setGiftsTab(type) {
    giftsCurrentType = type;

    giftsTabs.forEach((tab) => {
        const active = tab.dataset.giftType === type;
        tab.classList.toggle('bg-primary-600', active);
        tab.classList.toggle('text-white', active);
        tab.classList.toggle('text-text-muted', !active);
    });

    renderGiftsList();
}

giftsTabs.forEach((tab) => {
    tab.addEventListener('click', () => setGiftsTab(tab.dataset.giftType));
});

function giftCard(gift) {
    const card = document.createElement('div');
    card.className = 'flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center';

    const img = document.createElement('img');
    img.src = gift.imageSrc || gift.imageUrl;
    img.alt = gift.name;
    img.loading = 'lazy';
    img.className = 'h-14 w-14 rounded-lg object-contain';

    const name = document.createElement('p');
    name.className = 'line-clamp-2 text-sm font-medium';
    name.textContent = gift.name;

    const coin = document.createElement('p');
    coin.className = 'text-xs font-medium text-yellow-600';
    coin.textContent = `${formatNumber(gift.coin)} Coin`;

    const id = document.createElement('p');
    id.className = 'text-xs text-text-muted';
    id.textContent = `ID: ${gift.tiktokId}`;

    card.append(img, name, coin, id);
    return card;
}

function giftsCategorySection(title, count, items) {
    const section = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'mb-2 flex items-center justify-between';

    const heading = document.createElement('h3');
    heading.className = 'text-sm font-semibold';
    heading.textContent = title;

    const countEl = document.createElement('span');
    countEl.className = 'text-xs text-text-muted';
    countEl.textContent = `${count} item`;

    header.append(heading, countEl);
    section.appendChild(header);

    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'rounded-2xl border border-dashed border-border p-6 text-center text-sm text-text-muted';
        empty.textContent = 'Belum ada item di kategori ini.';
        section.appendChild(empty);
        return section;
    }

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    items.forEach((gift) => grid.appendChild(giftCard(gift)));
    section.appendChild(grid);

    return section;
}

function renderGiftsList() {
    giftsListEl.innerHTML = '';

    const categories = giftsCatalog.categories
        .filter((c) => c.type === giftsCurrentType)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    const items = giftsCatalog.gifts.filter((g) => g.type === giftsCurrentType);

    if (!categories.length && !items.length) {
        const empty = document.createElement('div');
        empty.className = 'rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted';
        empty.textContent = 'Belum ada data. Klik "Update Gift" untuk sinkron dari server.';
        giftsListEl.appendChild(empty);
        return;
    }

    categories.forEach((category) => {
        const categoryItems = items.filter((g) => g.categoryId === category.id);
        giftsListEl.appendChild(giftsCategorySection(category.name, categoryItems.length, categoryItems));
    });

    const uncategorized = items.filter((g) => !g.categoryId || !categories.some((c) => c.id === g.categoryId));
    if (uncategorized.length) {
        giftsListEl.appendChild(giftsCategorySection('Tanpa Kategori', uncategorized.length, uncategorized));
    }
}

function renderGiftsSyncInfo() {
    giftsSyncInfo.textContent = giftsCatalog.syncedAt
        ? `Terakhir disinkronkan: ${formatDateTime(giftsCatalog.syncedAt)}`
        : 'Membutuhkan data gift terbaru? Klik tombol Update Gift di atas.';
}

function setGiftsSyncBusy(busy) {
    btnGiftsSync.disabled = busy;
    btnGiftsSyncIcon.classList.toggle('animate-spin', busy);
    btnGiftsSyncLabel.textContent = busy ? 'Menyinkronkan...' : 'Update Gift';
}

async function loadGiftsFromCache() {
    giftsCatalog = await window.api.gifts.list();
    renderGiftsSyncInfo();
    renderGiftsList();
}

btnGiftsSync.addEventListener('click', async () => {
    setGiftsSyncBusy(true);
    giftsErrorEl.hidden = true;

    try {
        giftsCatalog = await window.api.gifts.sync();
        renderGiftsSyncInfo();
        renderGiftsList();
    } catch (error) {
        giftsErrorEl.hidden = false;
        giftsErrorEl.textContent = ipcErrorMessage(error) || 'Gagal menyinkronkan data gift.';
    } finally {
        setGiftsSyncBusy(false);
    }
});

setGiftsTab('gift');

bootstrap();
