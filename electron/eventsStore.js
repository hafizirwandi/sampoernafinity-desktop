const { app } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function storeFilePath() {
    return path.join(app.getPath('userData'), 'events.json');
}

let data = null;

function load() {
    if (data) return data;

    try {
        data = JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8'));
    } catch {
        data = { events: [] };
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
    return load().events;
}

function create(payload) {
    const now = new Date().toISOString();
    const event = {
        id: crypto.randomUUID(),
        name: payload?.name || '',
        enabled: payload?.enabled !== false,
        audience: payload?.audience || { type: 'any', usernames: [] },
        trigger: payload?.trigger || { type: 'chat' },
        actionIds: Array.isArray(payload?.actionIds) ? payload.actionIds : [],
        randomActionIds: Array.isArray(payload?.randomActionIds) ? payload.randomActionIds : [],
        cooldownGlobalSeconds: payload?.cooldownGlobalSeconds ?? 0,
        cooldownPerViewerSeconds: payload?.cooldownPerViewerSeconds ?? 0,
        createdAt: now,
        updatedAt: now,
    };

    load().events.push(event);
    persist();

    return event;
}

function update(id, payload) {
    const store = load();
    const index = store.events.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Event tidak ditemukan.');

    store.events[index] = {
        ...store.events[index],
        ...payload,
        id,
        updatedAt: new Date().toISOString(),
    };
    persist();

    return store.events[index];
}

function remove(id) {
    const store = load();
    store.events = store.events.filter((e) => e.id !== id);
    persist();
}

function duplicate(id) {
    const store = load();
    const original = store.events.find((e) => e.id === id);
    if (!original) throw new Error('Event tidak ditemukan.');

    const now = new Date().toISOString();
    const copy = {
        ...original,
        id: crypto.randomUUID(),
        name: original.name ? `${original.name} (salinan)` : '',
        createdAt: now,
        updatedAt: now,
    };
    store.events.push(copy);
    persist();

    return copy;
}

function toggle(id) {
    const store = load();
    const event = store.events.find((e) => e.id === id);
    if (!event) throw new Error('Event tidak ditemukan.');

    event.enabled = !event.enabled;
    event.updatedAt = new Date().toISOString();
    persist();

    return event;
}

function get(id) {
    return load().events.find((e) => e.id === id) || null;
}

module.exports = { list, get, create, update, remove, duplicate, toggle };
