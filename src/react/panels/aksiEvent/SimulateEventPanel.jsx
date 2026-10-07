import { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import SearchMultiSelect from '../../components/SearchMultiSelect.jsx';
import Toast from '../../components/Toast.jsx';
import { behaviorLabel } from './ActionsTable.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

function typeOptions(t) {
    return [
        { value: 'chat', label: t('aksiEvent.simulateEvent.typeChat') },
        { value: 'like', label: t('aksiEvent.simulateEvent.typeLike') },
        { value: 'join', label: t('aksiEvent.simulateEvent.typeJoin') },
        { value: 'follow', label: t('aksiEvent.simulateEvent.typeFollow') },
        { value: 'share', label: t('aksiEvent.simulateEvent.typeShare') },
        { value: 'subscribe', label: t('aksiEvent.simulateEvent.typeSubscribe') },
        { value: 'gift', label: t('aksiEvent.simulateEvent.typeGift') },
    ];
}

function skipReasonLabel(t, reason) {
    if (reason === 'audience') return t('aksiEvent.simulateEvent.skipReasonAudience');
    if (reason === 'cooldown') return t('aksiEvent.simulateEvent.skipReasonCooldown');
    return reason;
}

function behaviorResultLine(t, result) {
    const label = behaviorLabel(t, result.type) || result.type;

    if (result.error) return t('aksiEvent.panel.resultFail', { label, error: result.error });
    if (result.skipped) return t('aksiEvent.panel.resultSkip', { label, reason: result.reason });
    return t('aksiEvent.panel.resultOk', { label });
}

export default function SimulateEventPanel() {
    const { t } = useLanguage();
    const TYPE_OPTIONS = typeOptions(t);
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
                    ? t('aksiEvent.simulateEvent.toastMatched', { count: matchedEvents.length, actionsCount: actionsRunCount })
                    : t('aksiEvent.simulateEvent.toastNoMatch'),
            );
        } finally {
            setRunning(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold">{t('aksiEvent.simulateEvent.title')}</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('aksiEvent.simulateEvent.description')}</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">{t('aksiEvent.simulateEvent.typeLabel')}</label>
                        <select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm">
                            {TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">{t('aksiEvent.simulateEvent.usernameLabel')}</label>
                        <input
                            type="text"
                            value={uniqueId}
                            onChange={(event) => setUniqueId(event.target.value)}
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">{t('aksiEvent.simulateEvent.nicknameLabel')}</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(event) => setNickname(event.target.value)}
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                        />
                    </div>

                    {type === 'chat' && (
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium">{t('aksiEvent.simulateEvent.messageLabel')}</label>
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
                            <label className="mb-1.5 block text-sm font-medium">{t('aksiEvent.simulateEvent.likeCountLabel')}</label>
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
                                <label className="mb-1.5 block text-sm font-medium">{t('aksiEvent.simulateEvent.giftLabel')}</label>
                                <SearchMultiSelect
                                    items={gifts}
                                    selectedIds={giftId ? [giftId] : []}
                                    onChange={(ids) => setGiftId(ids[ids.length - 1] || '')}
                                    getId={(g) => g.tiktokId}
                                    getLabel={(g) => g.name}
                                    placeholder={t('common.searchGift')}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">{t('aksiEvent.simulateEvent.comboLabel')}</label>
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
                    <p className="mb-1.5 text-sm font-medium">{t('aksiEvent.simulateEvent.senderStatus')}</p>
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isFollower} onChange={(event) => setIsFollower(event.target.checked)} className="rounded border-border text-primary-600 focus:ring-primary-600" />
                            {t('aksiEvent.simulateEvent.follower')}
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isSubscriber} onChange={(event) => setIsSubscriber(event.target.checked)} className="rounded border-border text-primary-600 focus:ring-primary-600" />
                            {t('aksiEvent.simulateEvent.subscriber')}
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={isModerator} onChange={(event) => setIsModerator(event.target.checked)} className="rounded border-border text-primary-600 focus:ring-primary-600" />
                            {t('aksiEvent.simulateEvent.moderator')}
                        </label>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleRun}
                    disabled={running || (type === 'gift' && !giftId)}
                    className="mt-5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                    {running ? t('aksiEvent.simulateEvent.running') : t('aksiEvent.simulateEvent.runButton')}
                </button>
            </div>

            {report && (
                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-semibold">{t('aksiEvent.simulateEvent.resultsTitle')}</h3>

                    {!report.length ? (
                        <p className="mt-2 text-sm text-text-muted">{t('aksiEvent.simulateEvent.noMatchingType')}</p>
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
                                        {entry.eventName || t('aksiEvent.simulateEvent.unnamed')}
                                    </div>

                                    {!entry.matched && (
                                        <p className="mt-1 pl-6 text-xs text-text-muted">
                                            {t('aksiEvent.simulateEvent.notTriggered', { reason: skipReasonLabel(t, entry.reason) })}
                                        </p>
                                    )}

                                    {entry.matched && (
                                        <div className="mt-2 space-y-1.5 pl-6">
                                            {entry.actionsRun.map((run, index) => (
                                                <div key={index}>
                                                    <p className="text-xs font-medium">{run.actionName || t('aksiEvent.simulateEvent.unnamed')}</p>
                                                    <ul className="list-inside list-disc text-xs text-text-muted">
                                                        {run.results.map((result, resultIndex) => (
                                                            <li key={resultIndex}>{behaviorResultLine(t, result)}</li>
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
