const eventsStore = require('./eventsStore');
const actionsStore = require('./actionsStore');
const actionExecutor = require('./actionExecutor');

// In-memory only — cooldowns don't need to survive an app restart, and
// resetting them on restart is the desired behavior anyway.
const lastFiredGlobal = new Map(); // eventId -> timestamp
const lastFiredPerViewer = new Map(); // `${eventId}:${uniqueId}` -> timestamp

function matchesAudience(event, user, getTopGifterUniqueId) {
    const audience = event.audience || { type: 'any' };
    const uniqueId = (user.uniqueId || '').toLowerCase();

    switch (audience.type) {
        case 'any':
            return true;
        case 'follower':
            return Boolean(user.isFollower);
        case 'subscriber':
            return Boolean(user.isSubscriber);
        case 'moderator':
            return Boolean(user.isModerator);
        case 'top_gifter':
            return Boolean(user.uniqueId) && user.uniqueId === getTopGifterUniqueId();
        case 'specific':
            return (audience.usernames || []).some((u) => u.toLowerCase() === uniqueId);
        default:
            return false;
    }
}

// chat_keyword and gift_min_coin/gift_specific are refinements of the raw
// 'chat'/'gift' live events, not distinct live-event types of their own —
// they must be matched against the underlying type, not their own trigger
// type string.
function underlyingLiveEventType(triggerType) {
    if (triggerType === 'chat_keyword') return 'chat';
    if (triggerType === 'gift_min_coin' || triggerType === 'gift_specific') return 'gift';
    return triggerType;
}

function matchesTrigger(event, liveEvent) {
    const trigger = event.trigger || {};
    if (underlyingLiveEventType(trigger.type) !== liveEvent.type) return false;

    switch (trigger.type) {
        case 'like':
            return (liveEvent.count || 0) >= (trigger.minLikes || 1);
        case 'chat_keyword':
            return (liveEvent.content || '').toLowerCase().includes((trigger.keyword || '').toLowerCase());
        case 'gift_min_coin':
            return (liveEvent.diamonds || 0) >= (trigger.minCoins || 0);
        case 'gift_specific':
            return (trigger.giftIds || []).map(String).includes(String(liveEvent.giftId));
        default:
            // join / share / follow / subscribe / chat — no extra condition.
            return true;
    }
}

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

function toRawContext(liveEvent) {
    return {
        nickname: liveEvent.user?.nickname,
        username: liveEvent.user?.uniqueId,
        giftName: liveEvent.giftName,
        count: liveEvent.repeatCount ?? liveEvent.count,
        repeatCount: liveEvent.repeatCount,
        coins: liveEvent.diamonds,
        comment: liveEvent.content,
        likeCount: liveEvent.count,
    };
}

let started = false;

// deps: { tiktokConnection, overlayServer, overlayStore, getWebContents,
// toAssetUrl } — injected rather than required directly so this module
// doesn't need to know how main.js wires everything together.
function start(deps) {
    if (started) return;
    started = true;

    const { tiktokConnection, overlayServer, overlayStore, getWebContents, toAssetUrl } = deps;

    tiktokConnection.onLiveEvent(async (liveEvent) => {
        const events = eventsStore.list().filter((e) => e.enabled);
        const user = liveEvent.user || {};

        for (const event of events) {
            if (!matchesTrigger(event, liveEvent)) continue;
            if (!matchesAudience(event, user, tiktokConnection.getTopGifterUniqueId)) continue;
            if (!checkCooldown(event, user.uniqueId)) continue;

            markFired(event, user.uniqueId);

            const rawContext = toRawContext(liveEvent);
            const overlaySettings = overlayStore.getSettings();

            for (const action of resolveActions(event)) {
                await actionExecutor.run(action, rawContext, {
                    webContents: getWebContents(),
                    toAssetUrl,
                    overlayServer,
                    overlayThroughOverlay: overlaySettings.playAudioThroughOverlay,
                    screenConnected: action.screenId ? overlayServer.isScreenConnected(action.screenId) : false,
                });
            }
        }
    });
}

module.exports = { start };
