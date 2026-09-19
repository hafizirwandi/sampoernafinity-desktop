const statsStore = require('./statsStore');

// tiktok-live-connector ships as an ES module; Electron's bundled Node (20.x)
// can't require() it synchronously, so it's loaded lazily via dynamic import
// and cached on first use.
let modulePromise = null;

function loadModule() {
    if (!modulePromise) {
        modulePromise = import('tiktok-live-connector');
    }

    return modulePromise;
}

let connection = null;
let currentSessionId = null;
let state = { status: 'idle', username: null, error: null };
let onChange = null;
let onLiveEventCallback = null;

// Top gifter for the CURRENT live session only (resets every time a session
// starts/ends) — distinct from statsStore's multi-day leaderboard, which is
// a rolling aggregate across sessions and answers a different question.
let topGifterTotals = new Map();
let topGifterId = null;

function setState(next) {
    state = { ...state, ...next };
    if (onChange) onChange(state);
}

function onStateChange(callback) {
    onChange = callback;
}

function getState() {
    return state;
}

function onLiveEvent(callback) {
    onLiveEventCallback = callback;
}

function emitLiveEvent(event) {
    if (onLiveEventCallback) onLiveEventCallback(event);
}

function resetTopGifter() {
    topGifterTotals = new Map();
    topGifterId = null;
}

function recordTopGifter(uniqueId, diamonds) {
    if (!uniqueId || !diamonds) return;

    const total = (topGifterTotals.get(uniqueId) || 0) + diamonds;
    topGifterTotals.set(uniqueId, total);

    if (!topGifterId || total > (topGifterTotals.get(topGifterId) || 0)) {
        topGifterId = uniqueId;
    }
}

function getTopGifterUniqueId() {
    return topGifterId;
}

// The modern TikTokLiveConnection payloads expose user identity via
// `user.displayId` (not `user.uniqueId`, which only existed on the
// deprecated legacy client) and role flags via `userIdentity` on chat/gift
// messages; other event types don't carry `userIdentity`, so those fall
// back to the equivalent raw fields on `user`.
function deriveUserInfo(data) {
    const user = data.user || {};
    const identity = data.userIdentity;

    return {
        uniqueId: user.displayId || undefined,
        nickname: user.nickname,
        isFollower: identity ? !!identity.isFollowerOfAnchor : !!user.isFollower,
        isSubscriber: identity ? !!identity.isSubscriberOfAnchor : !!user.subscribeInfo?.isSubscribe,
        isModerator: identity ? !!identity.isModeratorOfAnchor : !!user.userAttr?.isAdmin,
    };
}

function endCurrentSession() {
    if (currentSessionId) {
        statsStore.endSession(currentSessionId);
        currentSessionId = null;
    }

    resetTopGifter();
}

async function disconnect() {
    const current = connection;
    connection = null;

    if (current) {
        try {
            await current.disconnect();
        } catch {
            // Tearing it down anyway; nothing useful to do with a close error.
        }
    }

    endCurrentSession();
    setState({ status: 'idle', error: null });
}

async function connect(rawUsername) {
    const username = String(rawUsername || '').trim().replace(/^@/, '');

    if (!username) {
        throw new Error('Username TikTok wajib diisi.');
    }

    await disconnect();

    setState({ status: 'connecting', username, error: null });

    const { TikTokLiveConnection, ControlEvent, WebcastEvent, UserOfflineError } = await loadModule();

    // The library's options argument is accessed unconditionally internally,
    // so an explicit {} is required even though it's documented as optional.
    // enableExtendedGiftInfo is needed to get each gift's diamond cost.
    const live = new TikTokLiveConnection(username, { enableExtendedGiftInfo: true });

    live.on(ControlEvent.DISCONNECTED, () => {
        if (connection === live) {
            connection = null;
            endCurrentSession();
            setState({ status: 'idle', error: null });
        }
    });

    live.on(WebcastEvent.STREAM_END, () => {
        if (connection === live) {
            connection = null;
            endCurrentSession();
            setState({ status: 'idle', error: 'Live sudah berakhir.' });
        }
    });

    live.on(WebcastEvent.GIFT, (data) => {
        const user = deriveUserInfo(data);

        // Streakable gifts (gift.type === 1) fire repeatedly while the combo
        // is in progress; only the final tick (repeatEnd === 1) carries the
        // true total, so intermediate ticks are skipped here.
        const isStreakable = data.gift?.type === 1;
        if (isStreakable && data.repeatEnd !== 1) return;

        const unitDiamonds = data.gift?.diamondCount ?? data.extendedGiftInfo?.diamondCount ?? 0;
        const repeatCount = data.repeatCount || 1;
        const diamonds = unitDiamonds * repeatCount;
        const giftName = data.gift?.name || data.extendedGiftInfo?.name || 'Gift';

        statsStore.recordGift(currentSessionId, {
            uniqueId: user.uniqueId,
            nickname: user.nickname,
            diamonds,
            giftName,
        });

        recordTopGifter(user.uniqueId, diamonds);

        emitLiveEvent({
            type: 'gift',
            user,
            giftId: data.gift?.id,
            giftName,
            diamonds,
            repeatCount,
            comboCount: data.comboCount,
        });
    });

    live.on(WebcastEvent.FOLLOW, (data) => {
        const user = deriveUserInfo(data);

        statsStore.recordFollow(currentSessionId, {
            uniqueId: user.uniqueId,
            nickname: user.nickname,
        });

        emitLiveEvent({ type: 'follow', user });
    });

    live.on(WebcastEvent.SHARE, (data) => {
        const user = deriveUserInfo(data);

        statsStore.recordShare(currentSessionId, {
            uniqueId: user.uniqueId,
            nickname: user.nickname,
        });

        emitLiveEvent({ type: 'share', user });
    });

    live.on(WebcastEvent.CHAT, (data) => {
        emitLiveEvent({ type: 'chat', user: deriveUserInfo(data), content: data.content });
    });

    live.on(WebcastEvent.LIKE, (data) => {
        emitLiveEvent({ type: 'like', user: deriveUserInfo(data), count: data.count, total: data.total });
    });

    live.on(WebcastEvent.MEMBER, (data) => {
        const user = deriveUserInfo(data);

        // MemberMessageAction 3 = MEMBER_MESSAGE_ACTION_SUBSCRIBED; every
        // other action (1 = joined, plus assorted rarer ones) is treated as
        // a room join since that's the only other case triggers care about.
        if (data.action === 3) {
            emitLiveEvent({ type: 'subscribe', user, memberCount: data.memberCount });
            return;
        }

        emitLiveEvent({ type: 'join', user, memberCount: data.memberCount });
    });

    try {
        await live.connect();
        connection = live;
        currentSessionId = statsStore.startSession(username);
        resetTopGifter();
        setState({ status: 'connected', username, error: null });

        return getState();
    } catch (error) {
        let message = 'Gagal terhubung. Coba lagi.';

        if (error instanceof UserOfflineError) {
            message = `@${username} sedang tidak live sekarang.`;
        } else if (error?.message) {
            message = error.message;
        }

        setState({ status: 'error', username, error: message });
        throw new Error(message);
    }
}

module.exports = { connect, disconnect, getState, onStateChange, onLiveEvent, getTopGifterUniqueId };
