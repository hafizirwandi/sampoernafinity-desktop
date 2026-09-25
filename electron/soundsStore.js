const { app } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function storeFilePath() {
    return path.join(app.getPath('userData'), 'sounds.json');
}

let data = null;

function load() {
    if (data) return data;

    try {
        data = JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8'));
    } catch {
        data = { globalEnabled: true, sounds: [] };
    }

    if (typeof data.globalEnabled !== 'boolean') data.globalEnabled = true;
    if (!Array.isArray(data.sounds)) data.sounds = [];

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
    return load().sounds;
}

function get(id) {
    return load().sounds.find((s) => s.id === id) || null;
}

function create(payload) {
    const now = new Date().toISOString();
    const sound = {
        id: crypto.randomUUID(),
        name: payload?.name || '',
        enabled: payload?.enabled !== false,
        audience: payload?.audience || { type: 'any', usernames: [] },
        trigger: payload?.trigger || { type: 'chat' },
        sound: payload?.sound || { source: 'file', filePath: '', url: '', fileName: '' },
        volume: payload?.volume ?? 80,
        keystroke: payload?.keystroke || '',
        createdAt: now,
        updatedAt: now,
    };

    load().sounds.push(sound);
    persist();

    return sound;
}

function update(id, payload) {
    const store = load();
    const index = store.sounds.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Suara tidak ditemukan.');

    store.sounds[index] = {
        ...store.sounds[index],
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
    };
    persist();

    return store.sounds[index];
}

function remove(id) {
    const store = load();
    store.sounds = store.sounds.filter((s) => s.id !== id);
    persist();
}

function toggle(id) {
    const store = load();
    const sound = store.sounds.find((s) => s.id === id);
    if (!sound) throw new Error('Suara tidak ditemukan.');

    sound.enabled = !sound.enabled;
    sound.updatedAt = new Date().toISOString();
    persist();

    return sound;
}

function getGlobalEnabled() {
    return load().globalEnabled;
}

function setGlobalEnabled(enabled) {
    const store = load();
    store.globalEnabled = Boolean(enabled);
    persist();

    return store.globalEnabled;
}

module.exports = { list, get, create, update, remove, toggle, getGlobalEnabled, setGlobalEnabled };
