const { spawn } = require('child_process');
const minecraftStore = require('./minecraftStore');

function renderTemplate(str, ctx) {
    return String(str || '').replace(/\{(\w+)\}/g, (match, key) => {
        const value = ctx[key.toLowerCase()];
        return value !== undefined && value !== null && value !== '' ? String(value) : match;
    });
}

// Maps a raw trigger context (from the event engine, or a synthetic test
// context) to every alias used across the 7 behavior mockups — they don't
// all use the same variable name for the same thing (e.g. {user} vs
// {username} vs {playername}).
function buildTemplateContext(raw = {}) {
    return {
        nickname: raw.nickname || raw.username || '',
        user: raw.username || raw.nickname || '',
        username: raw.username || raw.nickname || '',
        playername: raw.username || raw.nickname || '',
        gift: raw.giftName || '',
        giftname: raw.giftName || '',
        count: raw.count ?? raw.repeatCount ?? '',
        repeatcount: raw.repeatCount ?? raw.count ?? '',
        coins: raw.coins ?? raw.diamonds ?? '',
        comment: raw.comment || '',
        likecount: raw.likeCount ?? '',
    };
}

function escapePowerShellSingleQuoted(value) {
    return String(value ?? '').replace(/'/g, "''");
}

// Windows-only: shells out to PowerShell's SendKeys instead of a native
// keystroke-simulation module (robotjs/nut-js), so no native addon needs
// rebuilding against Electron's Node ABI. -EncodedCommand (base64 UTF-16LE)
// passes the whole script as one process argument, sidestepping any
// shell/argument-injection risk from the configured key combo; the single
// quotes are still escaped for defense in depth since this only protects
// against injection at the OS process-argument boundary, not inside the
// PowerShell script itself.
function runKeystroke(keys, holdMs) {
    return new Promise((resolve, reject) => {
        const safeKeys = escapePowerShellSingleQuoted(keys);
        const lines = ['Add-Type -AssemblyName System.Windows.Forms', `[System.Windows.Forms.SendKeys]::SendWait('${safeKeys}')`];

        if (holdMs > 0) {
            lines.push(`Start-Sleep -Milliseconds ${Math.max(0, Math.floor(holdMs))}`);
        }

        const encoded = Buffer.from(lines.join('; '), 'utf16le').toString('base64');
        const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded]);

        let stderr = '';
        child.stderr?.on('data', (chunk) => {
            stderr += chunk;
        });

        child.on('error', reject);
        child.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(stderr.trim() || `PowerShell keluar dengan kode ${code}`));
        });
    });
}

async function runWebhook(behavior) {
    // URL is admin-authored config, not raw viewer input — renderTemplate
    // substitutes trigger values into it, same as every other behavior type.
    if (!behavior.url) return;

    const response = await fetch(behavior.url, { method: (behavior.method || 'GET').toUpperCase() });
    if (!response.ok) {
        throw new Error(`Webhook gagal (${response.status})`);
    }
}

async function runMinecraftCommand(behavior, ctx) {
    const baseUrl = minecraftStore.getBaseUrl();
    const apiKey = minecraftStore.getApiKey();

    if (!baseUrl || !apiKey) {
        throw new Error('Koneksi Minecraft (ServerTap) belum dikonfigurasi.');
    }

    const lines = Array.isArray(behavior.lines) ? behavior.lines : [];

    for (const line of lines) {
        const command = renderTemplate(line, ctx).trim();
        if (!command) continue;

        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/server/exec`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', key: apiKey },
            body: JSON.stringify({ command }),
        });

        if (!response.ok) {
            throw new Error(`Perintah Minecraft gagal (${response.status}): ${command}`);
        }
    }
}

// Fallback for audio/TTS when no Overlay Screen is listening — plays back
// in this app's own window instead, mirroring the mockup's own "layar tanpa
// overlay tetap diputar di aplikasi" text so a gift's sound is never lost.
function runLocalAudio(behavior, webContents, toAssetUrl) {
    if (!webContents) return;

    const source = behavior.source === 'url' ? behavior.url : toAssetUrl?.(behavior.filePath);
    if (!source) return;

    webContents.send('actions:play-audio-local', { source, volume: behavior.volume ?? 100 });
}

function runLocalTts(message, volume, webContents) {
    if (!webContents || !message) return;

    webContents.send('actions:speak-local', { message, volume });
}

async function runNonOverlayBehavior(behavior, ctx) {
    switch (behavior.type) {
        case 'webhook':
            await runWebhook({ ...behavior, url: renderTemplate(behavior.url, ctx) });
            return {};
        case 'keystroke':
            await runKeystroke(behavior.keys, behavior.holdMs);
            return {};
        case 'minecraft_command':
            await runMinecraftCommand(behavior, ctx);
            return {};
        default:
            return { skipped: true, reason: `Tipe aksi tidak dikenal: ${behavior.type}` };
    }
}

// A single Aksi can bundle several overlay-facing behaviors (image + alert +
// audio, say) — they're merged into ONE trigger payload so the Overlay
// Screen shows/plays them together within the same duration/fade window,
// instead of queuing separately and stepping on each other.
async function run(action, rawContext, deps = {}) {
    const { webContents, toAssetUrl, overlayServer, overlayThroughOverlay, screenConnected } = deps;
    const ctx = buildTemplateContext(rawContext);
    const results = [];
    const overlayPayload = {};
    let hasOverlayContent = false;

    for (const behavior of action.behaviors || []) {
        try {
            if (behavior.type === 'show_media') {
                const url = behavior.source === 'url' ? behavior.url : overlayServer?.toMediaUrl(behavior.filePath);
                if (!url) {
                    results.push({ type: behavior.type, skipped: true, reason: 'Berkas/URL belum diisi.' });
                    continue;
                }
                overlayPayload.media = { mediaType: behavior.mediaType, url, volume: behavior.volume ?? 100 };
                hasOverlayContent = true;
                results.push({ type: behavior.type });
                continue;
            }

            if (behavior.type === 'show_alert') {
                const text = renderTemplate(behavior.text, ctx).trim();
                if (!text) {
                    results.push({ type: behavior.type, skipped: true, reason: 'Teks peringatan kosong.' });
                    continue;
                }
                overlayPayload.alert = { text };
                hasOverlayContent = true;
                results.push({ type: behavior.type });
                continue;
            }

            if (behavior.type === 'play_audio') {
                const overlayUrl = behavior.source === 'url' ? behavior.url : overlayServer?.toMediaUrl(behavior.filePath);
                if (overlayThroughOverlay && screenConnected && overlayUrl) {
                    overlayPayload.audio = { url: overlayUrl, volume: behavior.volume ?? 100 };
                    hasOverlayContent = true;
                } else {
                    runLocalAudio(behavior, webContents, toAssetUrl);
                }
                results.push({ type: behavior.type });
                continue;
            }

            if (behavior.type === 'tts') {
                const message = renderTemplate(behavior.message, ctx).trim();
                if (overlayThroughOverlay && screenConnected && message) {
                    overlayPayload.tts = { message, volume: behavior.volume ?? 100 };
                    hasOverlayContent = true;
                } else {
                    runLocalTts(message, behavior.volume ?? 100, webContents);
                }
                results.push({ type: behavior.type });
                continue;
            }

            const result = await runNonOverlayBehavior(behavior, ctx);
            results.push({ type: behavior.type, ...result });
        } catch (error) {
            results.push({ type: behavior.type, error: error.message });
        }
    }

    if (hasOverlayContent) {
        if (!action.screenId) {
            results.push({ type: 'overlay', skipped: true, reason: 'Aksi ini belum ditautkan ke Layar Overlay.' });
        } else {
            const queued = overlayServer?.enqueue(action.screenId, {
                ...overlayPayload,
                durationSeconds: action.durationSeconds,
                fadeInOut: action.fadeInOut,
            });
            if (!queued) {
                results.push({ type: 'overlay', error: 'Antrian Layar Overlay penuh atau Layar tidak ditemukan.' });
            }
        }
    }

    return results;
}

module.exports = { run, renderTemplate, buildTemplateContext };
