const { app } = require('electron');
const fs = require('fs');
const path = require('path');

function storeFilePath() {
    return path.join(app.getPath('userData'), 'gifts.json');
}

function imagesDir() {
    const dir = path.join(app.getPath('userData'), 'gift-images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    return dir;
}

let data = null;

function load() {
    if (data) return data;

    try {
        data = JSON.parse(fs.readFileSync(storeFilePath(), 'utf-8'));
    } catch {
        data = { syncedAt: null, categories: [], gifts: [] };
    }

    return data;
}

function getAll() {
    return load();
}

function save(next) {
    data = next;

    try {
        fs.writeFileSync(storeFilePath(), JSON.stringify(data));
    } catch {
        // Best-effort persistence; the in-memory copy still serves this session.
    }

    return data;
}

function extensionFor(url, contentType) {
    const fromUrl = path.extname(new URL(url).pathname).replace('.', '').toLowerCase();
    if (fromUrl && fromUrl.length <= 4) return fromUrl;

    const fromType = (contentType || '').split(';')[0].split('/')[1];
    return fromType || 'png';
}

/**
 * Downloads a gift/sticker image to local disk so the desktop app never has
 * to hit the network for it again — the whole point is that once you're
 * live, art loads instantly from disk instead of waiting on a remote CDN.
 */
async function downloadImage(url, fileKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`Gagal mengunduh gambar (${response.status})`);
        }

        const ext = extensionFor(url, response.headers.get('content-type'));
        const filePath = path.join(imagesDir(), `${fileKey}.${ext}`);
        const buffer = Buffer.from(await response.arrayBuffer());

        fs.writeFileSync(filePath, buffer);

        return filePath;
    } finally {
        clearTimeout(timeout);
    }
}

module.exports = { getAll, save, downloadImage };
