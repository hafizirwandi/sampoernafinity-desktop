import { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import SearchMultiSelect from '../../components/SearchMultiSelect.jsx';
import Toast from '../../components/Toast.jsx';
import { BEHAVIOR_LABELS } from './ActionsTable.jsx';

const TYPE_OPTIONS = [
    { value: 'chat', label: 'Obrolan (Chat)' },
    { value: 'like', label: 'Menyukai (Like)' },
    { value: 'join', label: 'Bergabung ke ruang (Join)' },
    { value: 'follow', label: 'Mengikuti (Follow)' },
    { value: 'share', label: 'Membagikan (Share)' },
    { value: 'subscribe', label: 'Berlangganan (Subscribe)' },
    { value: 'gift', label: 'Mengirim Hadiah (Gift)' },
];

const SKIP_REASON_LABELS = {
    audience: 'audience (siapa yang memicu) tidak cocok',
    cooldown: 'sedang cooldown',
};

function behaviorResultLine(result) {
    const label = BEHAVIOR_LABELS[result.type] || result.type;

    if (result.error) return `${label}: gagal — ${result.error}`;
    if (result.skipped) return `${label}: dilewati — ${result.reason}`;
    return `${label}: berhasil dijalankan`;
}

export default function SimulateEventPanel() {
    const [type, setType] = useState('chat');
    const [uniqueId, setUniqueId] = useState('test_user');
    const [nickname, setNickname] = useState('Test User');
    const [isFollower, setIsFollower] = useState(false);
    const [isSubscriber, setIsSubscriber] = useState(false);
    const [isModerator, setIsModerator] = useState(false);
    const [content, setContent] = useState('halo semua!');
    const [likeCount, setLikeCount] = useState(1);
    const [giftId, setGiftId] = useState('');
    const [repeatCount, setRepeatCount] = useState(1);
    const [gifts, setGifts] = useState([]);
    const [running, setRunning] = useState(false);
    const [report, setReport] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        window.api.gifts.list().then((catalog) => setGifts(catalog.gifts || []));
    }, []);

    async function handleRun() {
        setRunning(true);
        setReport(null);

        const user = { uniqueId: uniqueId.trim(), nickname: nickname.trim() || uniqueId.trim(), isFollower, isSubscriber, isModerator };
        let liveEvent = { type, user };

        if (type === 'chat') {
            liveEvent.content = content;
        } else if (type === 'like') {
            liveEvent.count = Number(likeCount) || 1;
        } else if (type === 'gift') {
            const gift = gifts.find((g) => g.tiktokId === giftId);
            liveEvent = {
                ...liveEvent,
                giftId,
                giftName: gift?.name || '',
                repeatCount: Number(repeatCount) || 1,
                diamonds: (gift?.coin || 0) * (Number(repeatCount) || 1),
            };
        }

        try {
            const result = await window.api.events.simulate(liveEvent);
            setReport(result);

            const matchedEvents = result.filter((entry) => entry.matched);
            const actionsRunCount = matchedEvents.reduce((sum, entry) => sum + entry.actionsRun.length, 0);

            setToastMessage(
                matchedEvents.length
                    ? `${matchedEvents.length} Event terpicu, ${actionsRunCount} Aksi dijalankan.`
                    : 'Tidak ada Event yang terpicu untuk simulasi ini.',
            );
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold">Simulasi Event</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-muted">
                    Uji Event dan Aksi tanpa perlu sedang LIVE — atur pemicu palsu di bawah, lalu jalankan untuk melihat Event mana
                    yang cocok dan Aksi apa yang dijalankan.
                </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Tipe event</label>
                        <select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
                            {TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Username (uniqueId)</label>
                        <input
                            type="text"
                            value={uniqueId}
                            onChange={(event) => setUniqueId(event.target.value)}
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(event) => setNickname(event.target.value)}
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                        />
                    </div>

                    {type === 'chat' && (
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">Isi pesan</label>
                            <input
                                type="text"
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    {type === 'like' && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Jumlah like</label>
                            <input
                                type="number"
                                min="1"
                                value={likeCount}
                                onChange={(event) => setLikeCount(event.target.value)}
                                className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    {type === 'gift' && (
                        <>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Gift</label>
                                <SearchMultiSelect
                                    items={gifts}
                                    selectedIds={giftId ? [giftId] : []}
                                    onChange={(ids) => setGiftId(ids[ids.length - 1] || '')}
                                    getId={(g) => g.tiktokId}
                                    getLabel={(g) => g.name}
                                    placeholder="Cari gift..."
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Jumlah (combo)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={repeatCount}
                                    onChange={(event) => setRepeatCount(event.target.value)}
                                    className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-4">
                    <p className="mb-1.5 text-sm font-medium">Status pengirim</p>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isFollower} onChange={(event) => setIsFollower(event.target.checked)} className="rounded border-border text-primary-600 focus:ring-primary-600" />
                            Pengikut
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isSubscriber} onChange={(event) => setIsSubscriber(event.target.checked)} className="rounded border-border text-primary-600 focus:ring-primary-600" />
                            Subscriber
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isModerator} onChange={(event) => setIsModerator(event.target.checked)} className="rounded border-border text-primary-600 focus:ring-primary-600" />
                            Moderator
                        </label>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleRun}
                    disabled={running || (type === 'gift' && !giftId)}
                    className="mt-5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                    {running ? 'Menjalankan...' : 'Jalankan Simulasi'}
                </button>
            </div>

            {report && (
                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-semibold">Hasil Simulasi</h3>

                    {!report.length ? (
                        <p className="mt-2 text-sm text-text-muted">Tidak ada Event dengan pemicu tipe ini.</p>
                    ) : (
                        <div className="mt-3 space-y-3">
                            {report.map((entry) => (
                                <div key={entry.eventId} className="rounded-xl border border-border p-3">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        {entry.matched ? (
                                            <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-600" />
                                        ) : (
                                            <XCircleIcon className="h-4 w-4 shrink-0 text-text-muted" />
                                        )}
                                        {entry.eventName || '(tanpa nama)'}
                                    </div>

                                    {!entry.matched && (
                                        <p className="mt-1 pl-6 text-xs text-text-muted">Tidak dipicu — {SKIP_REASON_LABELS[entry.reason] || entry.reason}.</p>
                                    )}

                                    {entry.matched && (
                                        <div className="mt-2 space-y-1.5 pl-6">
                                            {entry.actionsRun.map((run, index) => (
                                                <div key={index}>
                                                    <p className="text-xs font-medium">{run.actionName || '(tanpa nama)'}</p>
                                                    <ul className="list-inside list-disc text-xs text-text-muted">
                                                        {run.results.map((result, resultIndex) => (
                                                            <li key={resultIndex}>{behaviorResultLine(result)}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {toastMessage && <Toast onDismiss={() => setToastMessage(null)}>{toastMessage}</Toast>}
        </div>
    );
}
