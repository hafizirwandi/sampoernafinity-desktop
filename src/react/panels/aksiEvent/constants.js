export const AUDIENCE_TYPES = [
    { type: 'any', label: 'Setiap orang' },
    { type: 'follower', label: 'Pengikut' },
    { type: 'subscriber', label: 'Subscriber' },
    { type: 'moderator', label: 'Moderator' },
    { type: 'top_gifter', label: 'Top Gifter' },
    { type: 'specific', label: 'Penampil tertentu' },
];

export const TRIGGER_TYPES = [
    { type: 'join', label: 'Bergabung ke ruang (Join room)' },
    { type: 'share', label: 'Membagikan' },
    { type: 'follow', label: 'Mengikuti' },
    { type: 'subscribe', label: 'Berlangganan' },
    { type: 'like', label: 'Menyukai' },
    { type: 'chat', label: 'Obrolan apapun' },
    { type: 'chat_keyword', label: 'Obrolan dengan kata kunci' },
    { type: 'gift_min_coin', label: 'Hadiah mencapai koin minimum' },
    { type: 'gift_specific', label: 'Hadiah tertentu' },
];

export const AUDIENCE_LABELS = Object.fromEntries(AUDIENCE_TYPES.map((a) => [a.type, a.label]));
export const TRIGGER_LABELS = Object.fromEntries(TRIGGER_TYPES.map((t) => [t.type, t.label]));
