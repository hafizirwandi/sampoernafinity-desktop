const { app } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function storeFilePath() {
    return path.join(app.getPath('userData'), 'actions.json');
}

function mediaDir() {
    const dir = path.join(app.getPath('userData'), 'action-media');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    return dir;
}

// Copies a user-picked file into userData so the Aksi still works even if
// the original file is later moved, renamed, or deleted.
function importMediaFile(sourcePath) {
    const ext = path.extname(sourcePath);
    const destPath = path.join(mediaDir(), `${crypto.randomUUID()}${ext}`);
    fs.copyFileSync(sourcePath, destPath);

    return destPath;
}

let data = null;

function load() {
    if (data) return data;

    try {
        data = JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8'));
    } catch {
        data = { actions: [] };
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

function list() {
    return load().actions;
}

function create(payload) {
    const now = new Date().toISOString();
    const action = {
        id: crypto.randomUUID(),
        name: payload?.name || '',
        behaviors: Array.isArray(payload?.behaviors) ? payload.behaviors : [],
        screenId: payload?.screenId || null,
        durationSeconds: payload?.durationSeconds ?? 8,
        cooldownGlobalSeconds: payload?.cooldownGlobalSeconds ?? 0,
        cooldownPerViewerSeconds: payload?.cooldownPerViewerSeconds ?? 0,
        fadeInOut: Boolean(payload?.fadeInOut),
        skipNextAction: Boolean(payload?.skipNextAction),
        repeatWithCombo: Boolean(payload?.repeatWithCombo),
        comboMax: payload?.comboMax ?? 1000,
        createdAt: now,
        updatedAt: now,
    };

    load().actions.push(action);
    persist();

    return action;
}

function update(id, payload) {
    const store = load();
    const index = store.actions.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Aksi tidak ditemukan.');

    store.actions[index] = {
        ...store.actions[index],
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
    };
    persist();

    return store.actions[index];
}

function remove(id) {
    const store = load();
    store.actions = store.actions.filter((a) => a.id !== id);
    persist();
}

function duplicate(id) {
    const store = load();
    const original = store.actions.find((a) => a.id === id);
    if (!original) throw new Error('Aksi tidak ditemukan.');

    const now = new Date().toISOString();
    const copy = {
        ...original,
        id: crypto.randomUUID(),
        name: original.name ? `${original.name} (salinan)` : '',
        createdAt: now,
        updatedAt: now,
    };
    store.actions.push(copy);
    persist();

    return copy;
}

function get(id) {
    return load().actions.find((a) => a.id === id) || null;
}

module.exports = { list, get, create, update, remove, duplicate, importMediaFile };
