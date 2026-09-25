// "Suara" — sound notifications with two independent triggers: a TikTok
// LIVE event (same audience/trigger shape as Aksi & Event) and/or a global
// keyboard shortcut, so a sound can fire even when the app isn't focused.
const { globalShortcut } = require('electron');
const soundsStore = require('./soundsStore');
const { matchesAudience, matchesTrigger } = require('./triggerMatcher');

let engineDeps = null;
let started = false;

function resolveSoundUrl(sound, toAssetUrl) {
    if (!sound) return null;
    return sound.source === 'url' ? sound.url : toAssetUrl?.(sound.filePath);
}

function playSound(soundEntry) {
    if (!engineDeps) return;

    const webContents = engineDeps.getWebContents();
    if (!webContents) return;

    const url = resolveSoundUrl(soundEntry.sound, engineDeps.toAssetUrl);
    if (!url) return;

    webContents.send('soundboard:play', { url, volume: soundEntry.volume ?? 80 });
}

function stopAll() {
    engineDeps?.getWebContents()?.send('soundboard:stop-all');
}

// Plays a Sound immediately regardless of its enabled/trigger config — the
// ▶ preview button in the Suara table.
function testPlay(id) {
    const soundEntry = soundsStore.get(id);
    if (!soundEntry) throw new Error('Suara tidak ditemukan.');

    playSound(soundEntry);
}

// Re-registers every enabled Sound's keystroke as a system-wide hotkey.
// Called whenever a Sound or the global on/off toggle changes, so a
// disabled Sound's key stops being captured immediately — and doesn't keep
// clashing with other apps — instead of staying registered until restart.
function syncShortcuts() {
    globalShortcut.unregisterAll();

    if (!soundsStore.getGlobalEnabled()) return;

    for (const soundEntry of soundsStore.list()) {
        if (!soundEntry.enabled || !soundEntry.keystroke) continue;

        try {
            globalShortcut.register(soundEntry.keystroke, () => playSound(soundEntry));
        } catch {
            // An invalid/unsupported accelerator string for this OS — skip
            // it rather than letting one bad entry break the whole sync.
        }
    }
}

// deps: { tiktokConnection, getWebContents, toAssetUrl }
function start(deps) {
    if (started) return;
    started = true;
    engineDeps = deps;

    deps.tiktokConnection.onLiveEvent((liveEvent) => {
        if (!soundsStore.getGlobalEnabled()) return;

        const user = liveEvent.user || {};

        for (const soundEntry of soundsStore.list()) {
            if (!soundEntry.enabled) continue;
            if (!matchesTrigger(soundEntry, liveEvent)) continue;
            if (!matchesAudience(soundEntry, user, deps.tiktokConnection.getTopGifterUniqueId)) continue;

            playSound(soundEntry);
        }
    });

    syncShortcuts();
}

module.exports = { start, syncShortcuts, testPlay, stopAll };
