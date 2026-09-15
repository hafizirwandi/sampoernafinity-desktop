const { app, BrowserWindow, ipcMain, net, protocol, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { saveToken, loadToken, clearToken } = require('./tokenStore');
const tiktokConnection = require('./tiktokConnection');
const statsStore = require('./statsStore');
const giftsStore = require('./giftsStore');

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

    app.whenReady().then(() => {
        registerProtocol();

        protocol.handle('gift-asset', (request) => {
            const filePath = decodeURIComponent(request.url.replace('gift-asset://local/', ''));
            return net.fetch(pathToFileURL(filePath).toString());
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

ipcMain.handle('gifts:sync', async () => {
    const token = loadToken();
    if (!token) throw new Error('Kamu harus masuk dulu.');

    const remote = await apiFetch('/api/gifts', {
        headers: { Authorization: `Bearer ${token}` },
    });

    const cached = giftsStore.getAll();
    const cachedByKey = new Map(cached.gifts.map((g) => [`${g.type}-${g.tiktokId}`, g]));

    const gifts = [];
    for (const g of remote.gifts) {
        const key = `${g.type}-${g.tiktok_id}`;
        const previous = cachedByKey.get(key);
        let localImage = previous?.localImage || null;

        if (!localImage || previous.imageUrl !== g.image_url) {
            try {
                localImage = await giftsStore.downloadImage(g.image_url, key);
            } catch {
                // Keep whatever we had cached (or nothing) and fall back to
                // the remote URL for this item; the next sync will retry.
                localImage = previous?.localImage || null;
            }
        }

        gifts.push({
            id: g.id,
            type: g.type,
            categoryId: g.gift_category_id,
            tiktokId: g.tiktok_id,
            name: g.name,
            coin: g.coin,
            imageUrl: g.image_url,
            localImage,
        });
    }

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
