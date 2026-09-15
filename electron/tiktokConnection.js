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

function endCurrentSession() {
    if (currentSessionId) {
        statsStore.endSession(currentSessionId);
        currentSessionId = null;
    }
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
        // Streakable gifts (giftType 1) fire repeatedly while the streak is in
        // progress; only the final event (repeatEnd) carries the true count.
        if (data.giftDetails?.giftType === 1 && !data.repeatEnd) return;

        const unitDiamonds = data.extendedGiftInfo?.diamondCount ?? data.giftDetails?.diamondCount ?? 0;
        const diamonds = unitDiamonds * (data.repeatCount || 1);

        statsStore.recordGift(currentSessionId, {
            uniqueId: data.user?.uniqueId,
            nickname: data.user?.nickname,
            diamonds,
            giftName: data.giftDetails?.giftName || data.extendedGiftInfo?.name || 'Gift',
        });
    });

    live.on(WebcastEvent.FOLLOW, (data) => {
        statsStore.recordFollow(currentSessionId, {
            uniqueId: data.user?.uniqueId,
            nickname: data.user?.nickname,
        });
    });

    live.on(WebcastEvent.SHARE, (data) => {
        statsStore.recordShare(currentSessionId, {
            uniqueId: data.user?.uniqueId,
            nickname: data.user?.nickname,
        });
    });

    try {
        await live.connect();
        connection = live;
        currentSessionId = statsStore.startSession(username);
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

module.exports = { connect, disconnect, getState, onStateChange };
