const { app, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');

function tokenFilePath() {
    return path.join(app.getPath('userData'), 'auth.token');
}

function saveToken(token) {
    const dir = app.getPath('userData');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const data = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(token) : Buffer.from(token, 'utf-8');

    fs.writeFileSync(tokenFilePath(), data);
}

function loadToken() {
    const file = tokenFilePath();
    if (!fs.existsSync(file)) return null;

    const data = fs.readFileSync(file);

    try {
        return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(data) : data.toString('utf-8');
    } catch {
        return null;
    }
}

function clearToken() {
    const file = tokenFilePath();
    if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { saveToken, loadToken, clearToken };
