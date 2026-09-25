// "TTS / Baca Komentar" — reads TikTok LIVE chat aloud through the
// renderer's Web Speech API (speechSynthesis only exists in a browser
// context, so this engine resolves everything it can in the main process —
// access control, comment filtering, template substitution — and leaves
// only "which installed voice object to actually use" to the renderer,
// which is the only place that can enumerate them).
const ttsStore = require('./ttsStore');
const googleTts = require('./googleTts');

function matchesRole(role, user, settings, getGifterRank) {
    switch (role) {
        case 'follower':
            return Boolean(user.isFollower);
        case 'friend':
            return Boolean(user.isFriend);
        case 'subscriber':
            return Boolean(user.isSubscriber);
        case 'moderator':
            return Boolean(user.isModerator);
        case 'team_level':
            return (user.teamLevel || 0) >= (settings.minTeamLevel || 1);
        case 'top_gifter': {
            const rank = getGifterRank(user.uniqueId);
            return rank !== null && rank <= (settings.minTopGifterRank || 1);
        }
        default:
            return false;
    }
}

// A per-user "Pengguna Spesial" entry overrides the role-based check
// entirely — explicitly allowed or explicitly blocked regardless of role.
function isAllowed(settings, user, override, getGifterRank) {
    if (override) return override.allowed;
    if ((settings.allowedRoles || []).includes('any')) return true;

    return (settings.allowedRoles || []).some((role) => matchesRole(role, user, settings, getGifterRank));
}

function matchesCommentType(settings, content) {
    switch (settings.commentType) {
        case 'dot':
            return content.startsWith('.');
        case 'slash':
            return content.startsWith('/');
        case 'keyword':
            return content.toLowerCase().startsWith((settings.commentKeyword || '').toLowerCase());
        default:
            return true;
    }
}

function stripPrefix(settings, content) {
    switch (settings.commentType) {
        case 'dot':
        case 'slash':
            return content.slice(1).trim();
        case 'keyword':
            return content.slice((settings.commentKeyword || '').length).trim();
        default:
            return content;
    }
}

function containsBadWord(settings, text) {
    const lower = text.toLowerCase();
    return (settings.badWords || []).some((word) => word && lower.includes(word.toLowerCase()));
}

function renderTemplate(template, ctx) {
    return String(template || '{comment}').replace(/\{(\w+)\}/g, (match, key) => {
        const value = ctx[key.toLowerCase()];
        return value !== undefined && value !== null ? String(value) : match;
    });
}

let started = false;

// deps: { tiktokConnection, getWebContents, toAssetUrl }
function start(deps) {
    if (started) return;
    started = true;

    deps.tiktokConnection.onLiveEvent(async (liveEvent) => {
        if (liveEvent.type !== 'chat') return;

        const settings = ttsStore.getSettings();
        if (!settings.enabled) return;

        const user = liveEvent.user || {};
        const content = liveEvent.content || '';

        if (containsBadWord(settings, content)) return;
        if (!matchesCommentType(settings, content)) return;

        const override = ttsStore.findUserByUsername(user.uniqueId);
        if (!isAllowed(settings, user, override, deps.tiktokConnection.getGifterRank)) return;

        const spoken = stripPrefix(settings, content);
        if (!spoken.trim()) return;

        const text = renderTemplate(settings.template, {
            comment: spoken,
            username: user.uniqueId,
            nickname: user.nickname,
        });

        const volume = Math.min(1, Math.max(0, (settings.volume ?? 100) / 100));

        // "Google" source has no speed/pitch or per-user voice control of
        // its own — translate_tts only takes a language code — so
        // per-user overrides only apply to the 'system' (Web Speech API)
        // path.
        if (settings.voiceSource === 'google') {
            try {
                const filePaths = await googleTts.synthesizeToFiles(text, settings.googleLang);
                deps.getWebContents()?.send('tts:speak', {
                    source: 'google',
                    text,
                    googleUrls: filePaths.map((p) => deps.toAssetUrl(p)),
                    volume,
                });
            } catch (error) {
                console.error('ttsEngine Google TTS error:', error);
            }
            return;
        }

        const voiceURI = override?.voiceURI || settings.voiceURI;
        const randomVoice = override ? override.randomVoice : settings.randomVoice;
        const speed = override?.speed ?? settings.speed;
        const pitch = override?.pitch ?? settings.pitch;

        deps.getWebContents()?.send('tts:speak', {
            source: 'system',
            text,
            voiceURI,
            randomVoice,
            // 0-100 UI scale -> Web Speech API's native scale (rate 0.1-10,
            // default 1; pitch 0-2, default 1), with 50 landing on the
            // neutral default in both.
            rate: Math.min(2, Math.max(0.1, speed / 50)),
            pitchValue: Math.min(2, Math.max(0, pitch / 50)),
            volume,
        });
    });
}

module.exports = { start };
