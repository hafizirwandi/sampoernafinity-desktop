const { app } = require('electron');
const fs = require('fs');
const path = require('path');

function filePath() {
    return path.join(app.getPath('userData'), 'tiktok-stats.json');
}

let data = null;
let saveTimer = null;

function load() {
    if (data) return data;

    try {
        data = JSON.parse(fs.readFileSync(filePath(), 'utf-8'));
    } catch {
        data = { sessions: [] };
    }

    return data;
}

function scheduleSave() {
    if (saveTimer) return;

    saveTimer = setTimeout(() => {
        saveTimer = null;
        flush();
    }, 1000);
}

function flush() {
    if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = null;
    }

    try {
        fs.writeFileSync(filePath(), JSON.stringify(load()));
    } catch {
        // Best-effort persistence; a failed write just means we retry on the next mutation.
    }
}

function startSession(username) {
    const store = load();
    const session = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        username,
        startedAt: new Date().toISOString(),
        endedAt: null,
        diamonds: 0,
        newFollowers: 0,
        newSubscribers: 0,
        shares: 0,
        gifters: {},
        gifts: {},
        sharers: {},
        followers: [],
    };

    store.sessions.push(session);
    scheduleSave();

    return session.id;
}

function getSession(sessionId) {
    return load().sessions.find((s) => s.id === sessionId) || null;
}

function endSession(sessionId) {
    const session = getSession(sessionId);
    if (session && !session.endedAt) {
        session.endedAt = new Date().toISOString();
        flush();
    }
}

function recordGift(sessionId, { uniqueId, nickname, diamonds, giftName }) {
    const session = getSession(sessionId);
    if (!session || !diamonds) return;

    session.diamonds += diamonds;

    const gifterKey = uniqueId || nickname || 'unknown';
    if (!session.gifters[gifterKey]) {
        session.gifters[gifterKey] = { uniqueId: uniqueId || '', nickname: nickname || gifterKey, diamonds: 0 };
    }
    session.gifters[gifterKey].diamonds += diamonds;

    const giftKey = giftName || 'Gift';
    session.gifts[giftKey] = (session.gifts[giftKey] || 0) + 1;

    scheduleSave();
}

function recordFollow(sessionId, { uniqueId, nickname }) {
    const session = getSession(sessionId);
    if (!session) return;

    session.newFollowers += 1;
    session.followers.push({ uniqueId: uniqueId || '', nickname: nickname || uniqueId || 'Pengguna', at: new Date().toISOString() });
    if (session.followers.length > 200) session.followers.shift();

    scheduleSave();
}

function recordShare(sessionId, { uniqueId, nickname }) {
    const session = getSession(sessionId);
    if (!session) return;

    session.shares += 1;

    const key = uniqueId || nickname || 'unknown';
    if (!session.sharers[key]) {
        session.sharers[key] = { uniqueId: uniqueId || '', nickname: nickname || key, count: 0 };
    }
    session.sharers[key].count += 1;

    scheduleSave();
}

function getStats({ days = 30 } = {}) {
    const store = load();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const sessions = store.sessions.filter((s) => new Date(s.startedAt).getTime() >= cutoff);

    const totals = { diamonds: 0, newFollowers: 0, newSubscribers: 0, shares: 0 };
    const dailyDiamonds = new Map();
    const gifterTotals = new Map();
    const giftTotals = new Map();
    const sharerTotals = new Map();
    const allFollowers = [];

    for (const session of sessions) {
        totals.diamonds += session.diamonds;
        totals.newFollowers += session.newFollowers;
        totals.newSubscribers += session.newSubscribers;
        totals.shares += session.shares;

        const day = session.startedAt.slice(0, 10);
        dailyDiamonds.set(day, (dailyDiamonds.get(day) || 0) + session.diamonds);

        for (const g of Object.values(session.gifters)) {
            const key = g.uniqueId || g.nickname;
            const cur = gifterTotals.get(key) || { ...g, diamonds: 0 };
            cur.diamonds += g.diamonds;
            gifterTotals.set(key, cur);
        }

        for (const [giftName, count] of Object.entries(session.gifts)) {
            giftTotals.set(giftName, (giftTotals.get(giftName) || 0) + count);
        }

        for (const s of Object.values(session.sharers)) {
            const key = s.uniqueId || s.nickname;
            const cur = sharerTotals.get(key) || { ...s, count: 0 };
            cur.count += s.count;
            sharerTotals.set(key, cur);
        }

        allFollowers.push(...session.followers);
    }

    const chart = [];
    for (let i = days - 1; i >= 0; i--) {
        const key = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        chart.push({ date: key, diamonds: dailyDiamonds.get(key) || 0 });
    }

    const topGifters = [...gifterTotals.values()].sort((a, b) => b.diamonds - a.diamonds).slice(0, 5);
    const topGifts = [...giftTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
    const topSharers = [...sharerTotals.values()].sort((a, b) => b.count - a.count).slice(0, 5);
    const lastFollowers = allFollowers.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 5);

    const history = sessions
        .slice()
        .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
        .slice(0, 30)
        .map((s) => ({
            startedAt: s.startedAt,
            username: s.username,
            diamonds: s.diamonds,
            newFollowers: s.newFollowers,
            newSubscribers: s.newSubscribers,
            shares: s.shares,
        }));

    return { totals, chart, topGifters, topGifts, topSharers, lastFollowers, history };
}

module.exports = { startSession, endSession, recordGift, recordFollow, recordShare, getStats, flush };
