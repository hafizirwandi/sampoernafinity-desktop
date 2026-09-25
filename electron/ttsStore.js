const { app } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function storeFilePath() {
    return path.join(app.getPath('userData'), 'tts.json');
}

const DEFAULT_SETTINGS = {
    enabled: false,
    voiceSource: 'system', // 'system' (Web Speech API, offline) | 'google' (translate_tts, online)
    voiceURI: '',
    randomVoice: false,
    speed: 50,
    pitch: 50,
    volume: 100,
    googleLang: 'id',
    template: '{comment}',
    allowedRoles: ['any'],
    minTeamLevel: 1,
    minTopGifterRank: 3,
    commentType: 'all', // 'all' | 'dot' | 'slash' | 'keyword'
    commentKeyword: '!say',
    badWords: [],
    users: [],
};

let data = null;

function load() {
    if (data) return data;

    try {
        data = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8')) };
    } catch {
        data = { ...DEFAULT_SETTINGS };
    }

    if (!Array.isArray(data.users)) data.users = [];
    if (!Array.isArray(data.badWords)) data.badWords = [];
    if (!Array.isArray(data.allowedRoles)) data.allowedRoles = ['any'];

    return data;
}

function persist() {
    try {
        fs.writeFileSync(storeFilePath(), JSON.stringify(data));
    } catch {
        // Best-effort persistence; the in-memory copy still serves this session.
    }
}

function getSettings() {
    return load();
}

// Partial update — every "Simpan" button in the UI saves just its own
// slice of settings (voice, access roles, comment filter, bad words, ...)
// independently, matching the reference's per-card save buttons.
function updateSettings(payload) {
    const store = load();
    Object.assign(store, payload);
    persist();

    return store;
}

function listUsers() {
    return load().users;
}

function addUser(payload) {
    const store = load();
    const user = {
        id: crypto.randomUUID(),
        username: (payload?.username || '').replace(/^@/, '').trim(),
        allowed: payload?.allowed !== false,
        voiceURI: payload?.voiceURI || '',
        randomVoice: Boolean(payload?.randomVoice),
        speed: payload?.speed ?? 50,
        pitch: payload?.pitch ?? 50,
    };

    store.users.push(user);
    persist();

    return user;
}

function updateUser(id, payload) {
    const store = load();
    const user = store.users.find((u) => u.id === id);
    if (!user) throw new Error('Pengguna tidak ditemukan.');

    Object.assign(user, payload);
    if (typeof payload?.username === 'string') {
        user.username = payload.username.replace(/^@/, '').trim();
    }
    persist();

    return user;
}

function removeUser(id) {
    const store = load();
    store.users = store.users.filter((u) => u.id !== id);
    persist();
}

// Case-insensitive lookup used by ttsEngine to find a per-user override for
// an incoming chat message's sender.
function findUserByUsername(username) {
    if (!username) return null;
    const normalized = username.toLowerCase();

    return load().users.find((u) => u.username.toLowerCase() === normalized) || null;
}

module.exports = { getSettings, updateSettings, listUsers, addUser, updateUser, removeUser, findUserByUsername };
