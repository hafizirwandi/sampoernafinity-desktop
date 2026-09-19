const { app } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const overlayStore = require('./overlayStore');

const OVERLAY_PAGE_DIR = path.join(__dirname, 'overlay-page');
const PREFERRED_PORT = 51820;

let server = null;
let wss = null;
let onScreenStatusChange = null;

// screenId -> { queue: [], active: <payload>|null, timeout, sockets: Set<WebSocket> }
const screens = new Map();

function getScreenState(screenId) {
    if (!screens.has(screenId)) {
        screens.set(screenId, { queue: [], active: null, timeout: null, sockets: new Set() });
    }

    return screens.get(screenId);
}

function onScreenStatus(callback) {
    onScreenStatusChange = callback;
}

function notifyStatus(screenId) {
    if (!onScreenStatusChange) return;
    onScreenStatusChange({ screenId, connected: getScreenState(screenId).sockets.size > 0 });
}

const CONTENT_TYPES = {
    '.html': 'text/html',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
};

function serveFile(req, res, filePath) {
    fs.stat(filePath, (err, stat) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        const range = req.headers.range;

        if (range) {
            const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
            const start = parseInt(startStr, 10) || 0;
            const end = endStr ? parseInt(endStr, 10) : stat.size - 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': end - start + 1,
                'Content-Type': contentType,
            });
            fs.createReadStream(filePath, { start, end }).pipe(res);
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
        fs.createReadStream(filePath).pipe(res);
    });
}

function handleRequest(req, res) {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/overlay.html') {
        serveFile(req, res, path.join(OVERLAY_PAGE_DIR, 'overlay.html'));
        return;
    }

    if (url.pathname.startsWith('/media/')) {
        const settings = overlayStore.getSettings();
        if (url.searchParams.get('token') !== settings.token) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        const fileName = path.basename(url.pathname.slice('/media/'.length));
        serveFile(req, res, path.join(app.getPath('userData'), 'action-media', fileName));
        return;
    }

    res.writeHead(404);
    res.end('Not found');
}

function verifyClient(info, done) {
    const url = new URL(info.req.url, 'http://localhost');
    const settings = overlayStore.getSettings();
    done(url.searchParams.get('token') === settings.token);
}

function broadcast(screenId, payload) {
    const message = JSON.stringify(payload);

    for (const socket of getScreenState(screenId).sockets) {
        if (socket.readyState === socket.OPEN) socket.send(message);
    }
}

function advanceQueue(screenId, id) {
    const state = getScreenState(screenId);
    if (!state.active || state.active.id !== id) return;

    clearTimeout(state.timeout);
    state.active = null;
    processQueue(screenId);
}

function processQueue(screenId) {
    const state = getScreenState(screenId);
    if (state.active || !state.queue.length || !state.sockets.size) return;

    const next = state.queue.shift();
    state.active = next;
    broadcast(screenId, { type: 'trigger', ...next });

    // Fallback in case the overlay page never reports back "done" (e.g. it
    // reloaded mid-playback) — the queue must never get stuck forever.
    state.timeout = setTimeout(() => advanceQueue(screenId, next.id), (next.durationSeconds || 8) * 1000 + 3000);
}

// Queues a trigger payload ({ media?, alert?, audio?, tts?, durationSeconds,
// fadeInOut }) for the given Overlay Screen, honoring its configured max
// queue length. Returns false if the screen doesn't exist or is full.
function enqueue(screenId, payload) {
    if (!screenId) return false;

    const screenConfig = overlayStore.listScreens().find((s) => s.id === screenId);
    if (!screenConfig) return false;

    const state = getScreenState(screenId);
    if (state.queue.length >= (screenConfig.maxQueueLength || 1000)) return false;

    state.queue.push({ id: crypto.randomUUID(), ...payload });
    processQueue(screenId);

    return true;
}

function isScreenConnected(screenId) {
    return getScreenState(screenId).sockets.size > 0;
}

// Builds the http://127.0.0.1:<port>/media/... URL an OBS-loaded overlay
// page can actually fetch — unlike gift-asset://, which only exists inside
// this app's own renderer process and is invisible to OBS's separate CEF
// instance.
function toMediaUrl(filePath) {
    if (!filePath) return null;

    const settings = overlayStore.getSettings();
    if (!settings.port) return null;

    return `http://127.0.0.1:${settings.port}/media/${encodeURIComponent(path.basename(filePath))}?token=${settings.token}`;
}

function start() {
    if (server) return Promise.resolve();

    return new Promise((resolve, reject) => {
        server = http.createServer(handleRequest);
        wss = new WebSocketServer({ server, path: '/ws', verifyClient });

        wss.on('connection', (socket, req) => {
            const url = new URL(req.url, 'http://localhost');
            const screenId = url.searchParams.get('screen');

            if (!screenId) {
                socket.close();
                return;
            }

            const state = getScreenState(screenId);
            state.sockets.add(socket);
            notifyStatus(screenId);
            processQueue(screenId);

            socket.on('message', (raw) => {
                try {
                    const msg = JSON.parse(raw.toString());
                    if (msg.type === 'done') advanceQueue(screenId, msg.id);
                } catch {
                    // Ignore malformed messages from the overlay page.
                }
            });

            socket.on('close', () => {
                state.sockets.delete(socket);
                notifyStatus(screenId);
            });
        });

        const settings = overlayStore.getSettings();
        const preferredPort = settings.port || PREFERRED_PORT;
        let fellBack = false;

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE' && !fellBack) {
                fellBack = true;
                server.listen(0, '127.0.0.1');
                return;
            }

            reject(err);
        });

        server.listen(preferredPort, '127.0.0.1', () => {
            overlayStore.setPort(server.address().port);
            resolve();
        });
    });
}

function stop() {
    if (wss) wss.close();
    if (server) server.close();
    server = null;
    wss = null;
}

module.exports = { start, stop, enqueue, isScreenConnected, onScreenStatus, toMediaUrl };
