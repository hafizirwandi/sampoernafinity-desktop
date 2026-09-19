const { app, BrowserWindow, ipcMain, net, protocol, shell, dialog } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { saveToken, loadToken, clearToken } = require('./tokenStore');
const tiktokConnection = require('./tiktokConnection');
const statsStore = require('./statsStore');
const giftsStore = require('./giftsStore');
const actionsStore = require('./actionsStore');
const eventsStore = require('./eventsStore');
const overlayStore = require('./overlayStore');
const minecraftStore = require('./minecraftStore');
const overlayServer = require('./overlayServer');
const actionExecutor = require('./actionExecutor');
const eventEngine = require('./eventEngine');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const DESKTOP_SCHEME = process.env.DESKTOP_APP_SCHEME || 'sampoernafinity';
const isDev = !!process.env.VITE_DEV_SERVER_URL;

let mainWindow = null;
let pendingDeepLinkUrl = null;

// Locally-cached gift/sticker images are served to the renderer through this
// privileged scheme instead of a raw file:// path, which Chromium blocks
// from loading when the page itself was loaded over http (the Vite dev
// server) — this way it works the same in dev and in the packaged build.
protocol.registerSchemesAsPrivileged([
    { scheme: 'gift-asset', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

function toAssetUrl(filePath) {
    return filePath ? `gift-asset://local/${encodeURIComponent(filePath)}` : null;
}

function registerProtocol() {
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient(DESKTOP_SCHEME, process.execPath, [path.resolve(process.argv[1])]);
        }
    } else {
        app.setAsDefaultProtocolClient(DESKTOP_SCHEME);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 720,
        minWidth: 860,
        minHeight: 600,
        backgroundColor: '#0c0d10',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    if (isDev) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

tiktokConnection.onStateChange((state) => {
    mainWindow?.webContents.send('tiktok:status', state);
});

function handleDeepLink(url) {
    if (!url || !url.startsWith(`${DESKTOP_SCHEME}://`)) return;

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return;
    }

    if (parsed.host !== 'oauth-callback') return;

    if (!mainWindow) {
        pendingDeepLinkUrl = url;
        return;
    }

    const token = parsed.searchParams.get('token');
    const error = parsed.searchParams.get('error');

    if (token) {
        saveToken(token);
        mainWindow.webContents.send('auth:oauth-result', { ok: true });
    } else {
        mainWindow.webContents.send('auth:oauth-result', { ok: false, error: error || 'unknown_error' });
    }

    mainWindow.focus();
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, argv) => {
        const url = argv.find((arg) => arg.startsWith(`${DESKTOP_SCHEME}://`));
        if (url) handleDeepLink(url);

        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.on('open-url', (event, url) => {
        event.preventDefault();
        handleDeepLink(url);
    });

    app.whenReady().then(async () => {
        registerProtocol();

        protocol.handle('gift-asset', (request) => {
            const filePath = decodeURIComponent(request.url.replace('gift-asset://local/', ''));
            return net.fetch(pathToFileURL(filePath).toString());
        });

        overlayServer.onScreenStatus((status) => {
            mainWindow?.webContents.send('overlay:screen-status', status);
        });

        try {
            await overlayServer.start();
        } catch (error) {
            console.error('Gagal memulai server overlay:', error);
        }

        eventEngine.start({
            tiktokConnection,
            overlayServer,
            overlayStore,
            getWebContents: () => mainWindow?.webContents,
            toAssetUrl,
        });

        createWindow();

        if (pendingDeepLinkUrl) {
            const url = pendingDeepLinkUrl;
            pendingDeepLinkUrl = null;
            handleDeepLink(url);
        }

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createWindow();
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    app.on('before-quit', () => {
        tiktokConnection.disconnect();
        statsStore.flush();
        overlayServer.stop();
    });
}

// --- API bridge -----------------------------------------------------------
// The renderer never talks to the Laravel API directly; every call goes
// through here so the app doesn't need CORS rules on the server and the
// auth token never has to live in renderer-reachable storage.

async function apiFetch(pathName, options = {}) {
    const response = await fetch(`${API_BASE_URL}${pathName}`, {
        ...options,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        const message = body?.message || Object.values(body?.errors || {}).flat()[0] || 'Terjadi kesalahan. Coba lagi.';
        throw new Error(message);
    }

    return body;
}

ipcMain.handle('auth:login', async (_event, { email, password }) => {
    const data = await apiFetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, device_name: 'desktop-app' }),
    });

    saveToken(data.token);

    return data.user;
});

ipcMain.handle('auth:oauth-start', async (_event, provider) => {
    await shell.openExternal(`${API_BASE_URL}/login/${provider}?client=desktop`);
});

ipcMain.handle('auth:session', async () => {
    const token = loadToken();
    if (!token) return null;

    try {
        const data = await apiFetch('/api/user', {
            headers: { Authorization: `Bearer ${token}` },
        });

        return data.user;
    } catch {
        clearToken();
        return null;
    }
});

ipcMain.handle('auth:logout', async () => {
    const token = loadToken();
    clearToken();
    await tiktokConnection.disconnect();

    if (token) {
        try {
            await apiFetch('/api/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // Token may already be invalid server-side; local logout still succeeds.
        }
    }
});

// --- TikTok Live connection ------------------------------------------------

ipcMain.handle('tiktok:connect', (_event, username) => tiktokConnection.connect(username));
ipcMain.handle('tiktok:disconnect', () => tiktokConnection.disconnect());
ipcMain.handle('tiktok:status', () => tiktokConnection.getState());

// --- Local live stats -------------------------------------------------------

ipcMain.handle('stats:get', (_event, options) => statsStore.getStats(options || {}));

// --- TikTok gift & sticker catalog ------------------------------------------
// Read-only on this side: the admin panel is where these get created, edited,
// or removed. Desktop only pulls the latest catalog and caches every image
// to disk, so art shows up instantly once someone actually goes live instead
// of waiting on a remote CDN mid-stream.

function presentCatalog(store) {
    return {
        syncedAt: store.syncedAt,
        categories: store.categories,
        gifts: store.gifts.map((gift) => ({
            ...gift,
            imageSrc: toAssetUrl(gift.localImage) || gift.imageUrl,
        })),
    };
}

ipcMain.handle('gifts:list', () => presentCatalog(giftsStore.getAll()));

// How many images to download at once. The catalog can run into the
// thousands, so downloading one-by-one would take hours and a single stalled
// request (no timeout) could hang the whole sync; a bounded pool keeps this
// down to a couple of minutes while still being gentle on the CDN.
const GIFT_DOWNLOAD_CONCURRENCY = 16;

ipcMain.handle('gifts:sync', async () => {
    const token = loadToken();
    if (!token) throw new Error('Kamu harus masuk dulu.');

    const remote = await apiFetch('/api/gifts', {
        headers: { Authorization: `Bearer ${token}` },
    });

    const cached = giftsStore.getAll();
    const cachedByKey = new Map(cached.gifts.map((g) => [`${g.type}-${g.tiktokId}`, g]));

    const total = remote.gifts.length;
    const gifts = new Array(total);
    let completed = 0;
    let cursor = 0;

    async function worker() {
        while (cursor < total) {
            const index = cursor++;
            const g = remote.gifts[index];
            const key = `${g.type}-${g.tiktok_id}`;
            const previous = cachedByKey.get(key);
            let localImage = previous?.localImage || null;

            if (!localImage || previous?.imageUrl !== g.image_url) {
                try {
                    localImage = await giftsStore.downloadImage(g.image_url, key);
                } catch {
                    // Keep whatever we had cached (or nothing) and fall back to
                    // the remote URL for this item; the next sync will retry.
                    localImage = previous?.localImage || null;
                }
            }

            gifts[index] = {
                id: g.id,
                type: g.type,
                categoryId: g.gift_category_id,
                tiktokId: g.tiktok_id,
                name: g.name,
                coin: g.coin,
                imageUrl: g.image_url,
                localImage,
            };

            completed += 1;
            mainWindow?.webContents.send('gifts:sync-progress', { done: completed, total });
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(GIFT_DOWNLOAD_CONCURRENCY, total) }, worker)
    );

    const saved = giftsStore.save({
        syncedAt: new Date().toISOString(),
        categories: remote.categories.map((c) => ({
            id: c.id,
            type: c.type,
            name: c.name,
            sortOrder: c.sort_order,
        })),
        gifts,
    });

    return presentCatalog(saved);
});

// --- Aksi (Actions) ----------------------------------------------------

ipcMain.handle('actions:list', () => actionsStore.list());
ipcMain.handle('actions:create', (_event, payload) => actionsStore.create(payload));
ipcMain.handle('actions:update', (_event, id, payload) => actionsStore.update(id, payload));
ipcMain.handle('actions:remove', (_event, id) => actionsStore.remove(id));
ipcMain.handle('actions:duplicate', (_event, id) => actionsStore.duplicate(id));

const MEDIA_PICKER_FILTERS = {
    audio: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'm4a'] }],
    media: [{ name: 'Media', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm'] }],
};

ipcMain.handle('actions:pick-media', async (_event, kind) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: MEDIA_PICKER_FILTERS[kind] || MEDIA_PICKER_FILTERS.media,
    });

    if (result.canceled || !result.filePaths.length) return null;

    const originalPath = result.filePaths[0];
    const filePath = actionsStore.importMediaFile(originalPath);

    return { filePath, originalName: path.basename(originalPath) };
});

// Runs an Aksi against a synthetic sample context so it can be tested from
// the Aksi table without needing a real TikTok LIVE event to trigger it.
ipcMain.handle('actions:run', async (_event, id) => {
    const action = actionsStore.get(id);
    if (!action) throw new Error('Aksi tidak ditemukan.');

    const sampleContext = {
        nickname: 'TestUser',
        username: 'testuser',
        giftName: 'Rose',
        count: 1,
        repeatCount: 1,
        coins: 100,
        comment: 'Halo dari test!',
        likeCount: 5,
    };

    const overlaySettings = overlayStore.getSettings();

    return actionExecutor.run(action, sampleContext, {
        webContents: mainWindow?.webContents,
        toAssetUrl,
        overlayServer,
        overlayThroughOverlay: overlaySettings.playAudioThroughOverlay,
        screenConnected: action.screenId ? overlayServer.isScreenConnected(action.screenId) : false,
    });
});

// --- Event (Triggers) ---------------------------------------------------

ipcMain.handle('events:list', () => eventsStore.list());
ipcMain.handle('events:create', (_event, payload) => eventsStore.create(payload));
ipcMain.handle('events:update', (_event, id, payload) => eventsStore.update(id, payload));
ipcMain.handle('events:remove', (_event, id) => eventsStore.remove(id));
ipcMain.handle('events:duplicate', (_event, id) => eventsStore.duplicate(id));
ipcMain.handle('events:toggle', (_event, id) => eventsStore.toggle(id));

// --- Overlay (local OBS/Live Studio browser-source server) -------------

ipcMain.handle('overlay:get-settings', () => overlayStore.getSettings());
ipcMain.handle('overlay:update-settings', (_event, payload) => overlayStore.updateSettings(payload));
ipcMain.handle('overlay:list-screens', () => overlayStore.listScreens());
ipcMain.handle('overlay:add-screen', (_event, name) => overlayStore.addScreen(name));
ipcMain.handle('overlay:update-screen', (_event, id, payload) => overlayStore.updateScreen(id, payload));
ipcMain.handle('overlay:remove-screen', (_event, id) => overlayStore.removeScreen(id));

// --- Minecraft (ServerTap) connection -----------------------------------

ipcMain.handle('minecraft:get-settings', () => minecraftStore.getSettings());
ipcMain.handle('minecraft:save-settings', (_event, payload) => minecraftStore.saveSettings(payload));
ipcMain.handle('minecraft:test-connection', () => minecraftStore.testConnection());
