export const AUDIENCE_TYPE_KEYS = ['any', 'follower', 'subscriber', 'moderator', 'top_gifter', 'specific'];

export const TRIGGER_TYPE_KEYS = ['join', 'share', 'follow', 'subscribe', 'like', 'chat', 'chat_keyword', 'gift_min_coin', 'gift_specific'];

export function audienceTypes(t) {
    return AUDIENCE_TYPE_KEYS.map((type) => ({ type, label: t(`aksiEvent.audience.${type}`) }));
}

export function triggerTypes(t) {
    return TRIGGER_TYPE_KEYS.map((type) => ({ type, label: t(`aksiEvent.trigger.${type}`) }));
}

export function audienceLabel(t, type) {
    return t(`aksiEvent.audience.${type}`);
}

export function triggerLabel(t, type) {
    return t(`aksiEvent.trigger.${type}`);
}
