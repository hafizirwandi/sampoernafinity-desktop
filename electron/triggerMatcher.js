// Shared trigger/audience matching — used by both eventEngine.js (Aksi &
// Event) and soundboardEngine.js (Suara), since both react to the exact
// same "siapa yang memicu" / "apa yang memicu" config shape against the
// same live TikTok events.

function matchesAudience(entry, user, getTopGifterUniqueId) {
    const audience = entry.audience || { type: 'any' };
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

function matchesTrigger(entry, liveEvent) {
    const trigger = entry.trigger || {};
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

module.exports = { matchesAudience, matchesTrigger, underlyingLiveEventType, toRawContext };
