import { useEffect, useState } from 'react';
import Toast from '../../components/Toast.jsx';

const ROLE_OPTIONS = [
    { value: 'any', label: 'Semua Orang' },
    { value: 'follower', label: 'Follower' },
    { value: 'friend', label: 'Teman' },
    { value: 'subscriber', label: 'Subscriber / SuperFan' },
    { value: 'moderator', label: 'Moderator' },
    { value: 'team_level', label: 'Level Tim' },
    { value: 'top_gifter', label: 'Top Gifter' },
];

const COMMENT_TYPE_OPTIONS = [
    { value: 'all', label: 'Semua Komentar' },
    { value: 'dot', label: 'Komentar yang diawali tanda titik (.)' },
    { value: 'slash', label: 'Komentar yang diawali tanda slash (/)' },
    { value: 'keyword', label: 'Komentar yang diawali kata-kata yang ditentukan:' },
];

export default function AccessFilterTab() {
    const [settings, setSettings] = useState(null);
    const [badWordsText, setBadWordsText] = useState('');
    const [savingRoles, setSavingRoles] = useState(false);
    const [savingCommentType, setSavingCommentType] = useState(false);
    const [savingBadWords, setSavingBadWords] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        window.api.tts.getSettings().then((next) => {
            setSettings(next);
            setBadWordsText((next.badWords || []).join(' '));
        });
    }, []);

    if (!settings) return null;

    function patch(fields) {
        setSettings((prev) => ({ ...prev, ...fields }));
    }

    function toggleRole(role) {
        const current = settings.allowedRoles || [];

        if (role === 'any') {
            patch({ allowedRoles: current.includes('any') ? [] : ['any'] });
            return;
        }

        const withoutAny = current.filter((r) => r !== 'any');
        const next = withoutAny.includes(role) ? withoutAny.filter((r) => r !== role) : [...withoutAny, role];
        patch({ allowedRoles: next });
    }

    async function saveRoles() {
        setSavingRoles(true);
        try {
            const next = await window.api.tts.updateSettings({
                allowedRoles: settings.allowedRoles,
                minTeamLevel: Number(settings.minTeamLevel) || 1,
                minTopGifterRank: Number(settings.minTopGifterRank) || 1,
            });
            setSettings((prev) => ({ ...prev, ...next }));
            setToastMessage('Akses tersimpan');
        } finally {
            setSavingRoles(false);
        }
    }

    async function saveCommentType() {
        setSavingCommentType(true);
        try {
            const next = await window.api.tts.updateSettings({
                commentType: settings.commentType,
                commentKeyword: settings.commentKeyword,
            });
            setSettings((prev) => ({ ...prev, ...next }));
            setToastMessage('Jenis komentar tersimpan');
        } finally {
            setSavingCommentType(false);
        }
    }

    async function saveBadWords() {
        setSavingBadWords(true);
        try {
            const badWords = badWordsText.split(/\s+/).map((w) => w.trim()).filter(Boolean);
            const next = await window.api.tts.updateSettings({ badWords });
            setSettings((prev) => ({ ...prev, ...next }));
            setBadWordsText((next.badWords || []).join(' '));
            setToastMessage('Filter kata tersimpan');
        } finally {
            setSavingBadWords(false);
        }
    }

    const noTarget = !(settings.allowedRoles || []).length;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-semibold">Siapa yang bisa menggunakan?</h3>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {ROLE_OPTIONS.map((role) => {
                            const active = (settings.allowedRoles || []).includes(role.value);

                            return (
                                <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => toggleRole(role.value)}
                                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                                        active ? 'border-primary-600 bg-primary-600 text-white' : 'border-border text-text-muted hover:bg-surface-alt'
                                    }`}
                                >
                                    {role.label}
                                </button>
                            );
                        })}
                    </div>

                    {noTarget && <p className="mt-2 text-xs text-primary-600">Pilih minimal satu target.</p>}

                    {(settings.allowedRoles || []).includes('team_level') && (
                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-medium">Minimum Tim Level (default: 1)</label>
                            <input
                                type="number"
                                min="1"
                                value={settings.minTeamLevel}
                                onChange={(event) => patch({ minTeamLevel: event.target.value })}
                                className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    {(settings.allowedRoles || []).includes('top_gifter') && (
                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-medium">Minimum Top Gifter (default: 3)</label>
                            <input
                                type="number"
                                min="1"
                                value={settings.minTopGifterRank}
                                onChange={(event) => patch({ minTopGifterRank: event.target.value })}
                                className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={saveRoles}
                        disabled={savingRoles || noTarget}
                        className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                        {savingRoles ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-semibold">Jenis komentar apa yang akan dibacakan?</h3>

                    <div className="mt-3 space-y-2">
                        {COMMENT_TYPE_OPTIONS.map((opt) => (
                            <div key={opt.value}>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        name="commentType"
                                        checked={settings.commentType === opt.value}
                                        onChange={() => patch({ commentType: opt.value })}
                                        className="text-primary-600 focus:ring-primary-600"
                                    />
                                    {opt.label}
                                </label>
                                {opt.value === 'keyword' && settings.commentType === 'keyword' && (
                                    <input
                                        type="text"
                                        value={settings.commentKeyword}
                                        onChange={(event) => patch({ commentKeyword: event.target.value })}
                                        placeholder="!say"
                                        className="mt-1.5 ml-6 w-full max-w-xs rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={saveCommentType}
                        disabled={savingCommentType}
                        className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                        {savingCommentType ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold">Filter kata</h3>
                <p className="mt-1 text-sm text-text-muted">
                    Komentar tidak akan dibacakan jika mengandung kata-kata di bawah ini. Pisahkan kata dengan spasi.
                </p>
                <textarea
                    value={badWordsText}
                    onChange={(event) => setBadWordsText(event.target.value)}
                    rows={3}
                    placeholder="Masukan kata-kata yang tidak akan dibaca, pisahkan kata dengan spasi."
                    className="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                />
                <button
                    type="button"
                    onClick={saveBadWords}
                    disabled={savingBadWords}
                    className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                    {savingBadWords ? 'Menyimpan...' : 'Simpan Kata'}
                </button>
            </div>

            {toastMessage && <Toast onDismiss={() => setToastMessage(null)}>{toastMessage}</Toast>}
        </div>
    );
}
