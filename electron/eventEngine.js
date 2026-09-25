const eventsStore = require('./eventsStore');
const actionsStore = require('./actionsStore');
const actionExecutor = require('./actionExecutor');
const { matchesAudience, matchesTrigger, toRawContext } = require('./triggerMatcher');

// In-memory only — cooldowns don't need to survive an app restart, and
// resetting them on restart is the desired behavior anyway.
const lastFiredGlobal = new Map(); // eventId -> timestamp
const lastFiredPerViewer = new Map(); // `${eventId}:${uniqueId}` -> timestamp

function checkCooldown(event, uniqueId) {
    const now = Date.now();

    if (event.cooldownGlobalSeconds > 0) {
        const last = lastFiredGlobal.get(event.id) || 0;
        if (now - last < event.cooldownGlobalSeconds * 1000) return false;
    }

    if (event.cooldownPerViewerSeconds > 0 && uniqueId) {
        const key = `${event.id}:${uniqueId}`;
        const last = lastFiredPerViewer.get(key) || 0;
        if (now - last < event.cooldownPerViewerSeconds * 1000) return false;
    }

    return true;
}

function markFired(event, uniqueId) {
    const now = Date.now();
    lastFiredGlobal.set(event.id, now);
    if (uniqueId) lastFiredPerViewer.set(`${event.id}:${uniqueId}`, now);
}

// "Picu SEMUA aksi ini" runs every linked Action; "Memicu SALAH SATU aksi
// ini (acak)" picks exactly one from its own separate group — the two
// groups are independent, matching the reference product's own behavior.
function resolveActions(event) {
    const byId = new Map(actionsStore.list().map((a) => [a.id, a]));
    const resolved = (event.actionIds || []).map((id) => byId.get(id)).filter(Boolean);

    const randomCandidates = (event.randomActionIds || []).map((id) => byId.get(id)).filter(Boolean);
    if (randomCandidates.length) {
        resolved.push(randomCandidates[Math.floor(Math.random() * randomCandidates.length)]);
    }

    return resolved;
}

// Core matching pipeline, shared by the live TikTok event stream and by
// manual "Simulasi Event" runs from the UI — a report entry is only
// produced for Events whose trigger *type* matches (chat_keyword only cares
// about chat events, etc.); everything else is silently irrelevant to this
// liveEvent and not worth reporting on.
async function processLiveEvent(liveEvent, deps) {
    const { tiktokConnection, overlayServer, overlayStore, getWebContents, toAssetUrl } = deps;
    const events = eventsStore.list().filter((e) => e.enabled);
    const user = liveEvent.user || {};
    const report = [];

    for (const event of events) {
        if (!matchesTrigger(event, liveEvent)) continue;

        if (!matchesAudience(event, user, tiktokConnection.getTopGifterUniqueId)) {
            report.push({ eventId: event.id, eventName: event.name, matched: false, reason: 'audience' });
            continue;
        }

        if (!checkCooldown(event, user.uniqueId)) {
            report.push({ eventId: event.id, eventName: event.name, matched: false, reason: 'cooldown' });
            continue;
        }

        markFired(event, user.uniqueId);

        const rawContext = toRawContext(liveEvent);
        const overlaySettings = overlayStore.getSettings();
        const actionsRun = [];

        for (const action of resolveActions(event)) {
            const results = await actionExecutor.run(action, rawContext, {
                webContents: getWebContents(),
                toAssetUrl,
                overlayServer,
                overlayThroughOverlay: overlaySettings.playAudioThroughOverlay,
                screenConnected: action.screenId ? overlayServer.isScreenConnected(action.screenId) : false,
            });
            actionsRun.push({ actionId: action.id, actionName: action.name, results });
        }

        report.push({ eventId: event.id, eventName: event.name, matched: true, actionsRun });
    }

    return report;
}

let started = false;
let engineDeps = null;

// deps: { tiktokConnection, overlayServer, overlayStore, getWebContents,
// toAssetUrl } — injected rather than required directly so this module
// doesn't need to know how main.js wires everything together.
function start(deps) {
    if (started) return;
    started = true;
    engineDeps = deps;

    deps.tiktokConnection.onLiveEvent((liveEvent) => {
        processLiveEvent(liveEvent, deps).catch((error) => console.error('eventEngine error:', error));
    });
}

// Runs a synthetic liveEvent through the exact same matching + execution
// pipeline as the real TikTok stream — used by the "Simulasi Event" panel
// so Events/Aksi can be tested without actually being live.
function simulate(liveEvent) {
    if (!engineDeps) throw new Error('Event engine belum aktif.');
    return processLiveEvent(liveEvent, engineDeps);
}

module.exports = { start, simulate };
