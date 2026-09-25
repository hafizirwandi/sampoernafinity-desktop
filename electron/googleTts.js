// Free "Google TTS" via the unofficial translate.google.com/translate_tts
// endpoint — the same technique used by the well-known google-tts-api /
// node-gtts npm packages, and (near-certainly, based on public descriptions
// of their free "Google (online)" voice option matching this exact
// behavior) by TikFinity/JFinity/Indofinity for their comment-reading TTS.
// No API key, but real constraints verified directly against the live
// endpoint: a hard ~200-character-per-request limit (confirmed: 200 chars
// succeeds, 220 fails with 400), no speed/pitch control (only a language
// code), and — confirmed by reproducing a 404 the same way — it rejects
// requests carrying a foreign Referer header. A renderer <audio src="...">
// always attaches one reflecting our own app's origin, which is exactly
// what broke it there; a request from here (the main process) carries no
// such header, matching the plain, working request this was verified
// against. So the audio is fetched here and handed to the renderer as a
// local file (via the existing gift-asset:// protocol), never as a raw
// Google URL.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_URL = 'https://translate.google.com/translate_tts';
const CHUNK_LIMIT = 200;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
// Long enough for playback to finish before the temp file is removed,
// short enough that hours of live TTS don't accumulate unbounded files.
const CACHE_TTL_MS = 60_000;

function splitIntoChunks(text, limit = CHUNK_LIMIT) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const chunks = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;

        if (candidate.length > limit) {
            if (current) chunks.push(current);
            // A single word longer than the limit on its own has to be
            // hard-truncated — this should be vanishingly rare in practice.
            current = word.length > limit ? word.slice(0, limit) : word;
        } else {
            current = candidate;
        }
    }

    if (current) chunks.push(current);

    return chunks;
}

function buildUrls(text, lang) {
    const chunks = splitIntoChunks(text);

    return chunks.map(
        (chunk) => `${BASE_URL}?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(lang || 'id')}&client=tw-ob`,
    );
}

function cacheDir() {
    const dir = path.join(app.getPath('userData'), 'tts-cache');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    return dir;
}

async function fetchChunk(url) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

    if (!response.ok) {
        throw new Error(`Google TTS gagal (${response.status}).`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(cacheDir(), `${crypto.randomUUID()}.mp3`);
    fs.writeFileSync(filePath, buffer);

    setTimeout(() => fs.unlink(filePath, () => {}), CACHE_TTL_MS);

    return filePath;
}

// Splits text, fetches every chunk's audio, and returns local file paths
// (not remote URLs) — the caller converts these via toAssetUrl() before
// sending them to the renderer.
async function synthesizeToFiles(text, lang) {
    const urls = buildUrls(text, lang);
    const filePaths = [];

    for (const url of urls) {
        filePaths.push(await fetchChunk(url));
    }

    return filePaths;
}

module.exports = { buildUrls, splitIntoChunks, synthesizeToFiles };
