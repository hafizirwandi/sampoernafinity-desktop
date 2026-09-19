const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');

// baseUrl lives in plain JSON like the app's other settings stores; apiKey
// is a real credential so it's kept in its own file and encrypted the same
// way tokenStore.js encrypts the auth token.
function settingsFilePath() {
    return path.join(app.getPath('userData'), 'minecraft.json');
}

function apiKeyFilePath() {
    return path.join(app.getPath('userData'), 'minecraft.key');
}

function loadSettings() {
    try {
        return JSON.parse(fs.readFileSync(settingsFilePath(), 'utf-8'));
    } catch {
        return { baseUrl: '' };
    }
}

function saveSettingsFile(settings) {
    try {
        fs.writeFileSync(settingsFilePath(), JSON.stringify(settings));
    } catch {
        // Best-effort persistence.
    }
}

function loadApiKey() {
    const file = apiKeyFilePath();
    if (!fs.existsSync(file)) return '';

    const data = fs.readFileSync(file);

    try {
        return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(data) : data.toString('utf-8');
    } catch {
        return '';
    }
}

function saveApiKey(apiKey) {
    const file = apiKeyFilePath();

    if (!apiKey) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
        return;
    }

    const data = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(apiKey) : Buffer.from(apiKey, 'utf-8');
    fs.writeFileSync(file, data);
}

// Never returns the actual key to the renderer — only whether one is set,
// so the UI can show "API Key tersimpan" without the secret leaving main.
function getSettings() {
    const settings = loadSettings();
    return { baseUrl: settings.baseUrl || '', hasApiKey: Boolean(loadApiKey()) };
}

function saveSettings({ baseUrl, apiKey } = {}) {
    saveSettingsFile({ baseUrl: baseUrl || '' });

    if (apiKey !== undefined) {
        saveApiKey(apiKey);
    }

    return getSettings();
}

function getBaseUrl() {
    return loadSettings().baseUrl || '';
}

function getApiKey() {
    return loadApiKey();
}

async function testConnection() {
    const baseUrl = getBaseUrl();
    const apiKey = getApiKey();

    if (!baseUrl) throw new Error('Base URL ServerTap belum diisi.');
    if (!apiKey) throw new Error('API Key ServerTap belum diisi.');

    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/server`, {
        headers: { key: apiKey },
    });

    if (!response.ok) {
        throw new Error(`Gagal terhubung ke ServerTap (${response.status}).`);
    }

    return true;
}

module.exports = { getSettings, saveSettings, testConnection, getBaseUrl, getApiKey };
