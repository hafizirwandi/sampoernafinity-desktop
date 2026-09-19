const { app } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function storeFilePath() {
    return path.join(app.getPath('userData'), 'overlay.json');
}

let data = null;

function load() {
    if (data) return data;

    try {
        data = JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8'));
    } catch {
        data = {};
    }

    return data;
}

function persist() {
    try {
        fs.writeFileSync(storeFilePath(), JSON.stringify(data));
    } catch {
        // Best-effort persistence; the in-memory copy still serves this session.
    }
}

// Fills in anything missing from an older/empty store — a random per-install
// token (never the real auth token — this gets pasted into OBS, which the
// auth token must never reach) and a default single Screen so the Aksi
// modal's Screen picker is never empty.
function ensureDefaults() {
    const store = load();
    let changed = false;

    if (!store.token) {
        store.token = crypto.randomBytes(16).toString('hex');
        changed = true;
    }

    if (!Array.isArray(store.screens) || !store.screens.length) {
        store.screens = [{ id: crypto.randomUUID(), name: 'Screen 1', maxQueueLength: 1000 }];
        changed = true;
    }

    if (typeof store.playAudioThroughOverlay !== 'boolean') {
        store.playAudioThroughOverlay = true;
        changed = true;
    }

    if (typeof store.liveAudioQueueFifo !== 'boolean') {
        store.liveAudioQueueFifo = true;
        changed = true;
    }

    if (store.port === undefined) {
        // Set once overlayServer actually binds a port (setPort below) —
        // null here just means "server hasn't started yet".
        store.port = null;
        changed = true;
    }

    if (changed) persist();

    return store;
}

function getSettings() {
    return ensureDefaults();
}

function updateSettings(payload) {
    const store = ensureDefaults();

    if (typeof payload?.playAudioThroughOverlay === 'boolean') {
        store.playAudioThroughOverlay = payload.playAudioThroughOverlay;
    }

    if (typeof payload?.liveAudioQueueFifo === 'boolean') {
        store.liveAudioQueueFifo = payload.liveAudioQueueFifo;
    }

    persist();

    return store;
}

function listScreens() {
    return ensureDefaults().screens;
}

function addScreen(name) {
    const store = ensureDefaults();
    const screen = {
        id: crypto.randomUUID(),
        name: name || `Screen ${store.screens.length + 1}`,
        maxQueueLength: 1000,
    };

    store.screens.push(screen);
    persist();

    return screen;
}

function updateScreen(id, payload) {
    const store = ensureDefaults();
    const screen = store.screens.find((s) => s.id === id);
    if (!screen) throw new Error('Layar tidak ditemukan.');

    if (typeof payload?.name === 'string') screen.name = payload.name;
    if (typeof payload?.maxQueueLength === 'number') screen.maxQueueLength = payload.maxQueueLength;
    persist();

    return screen;
}

function removeScreen(id) {
    const store = ensureDefaults();
    if (store.screens.length <= 1) throw new Error('Minimal harus ada satu Layar Overlay.');

    store.screens = store.screens.filter((s) => s.id !== id);
    persist();
}

// Called by overlayServer once it has actually bound a port, so the
// persisted URL stays stable across app restarts instead of changing on
// every launch.
function setPort(port) {
    const store = ensureDefaults();
    store.port = port;
    persist();

    return store;
}

module.exports = { getSettings, updateSettings, listScreens, addScreen, updateScreen, removeScreen, setPort };
