import { useEffect, useRef, useState } from 'react';
import { PlayIcon, PauseIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/Modal.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function SoundLibraryModal({ onClose, onApply }) {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [loadMoreError, setLoadMoreError] = useState('');
    const [playingId, setPlayingId] = useState(null);
    const audioRef = useRef(null);

    // Plain refs, not state, for everything loadMore()/handleScroll() need
    // to read synchronously — a scroll gesture fires the scroll handler
    // many times per second, faster than React re-renders after setState,
    // so a state-only guard lets several calls slip past the "already
    // loading" check before it updates, each one fetching the SAME next
    // page. Their results then get deduped against each other and nothing
    // visibly changes — which is exactly the "keeps blinking, no new data"
    // bug this fixes.
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const loadingMoreRef = useRef(false);
    const resultsRef = useRef([]);
    const queryRef = useRef('');

    useEffect(() => {
        const audio = new Audio();
        audio.addEventListener('ended', () => setPlayingId(null));
        audioRef.current = audio;

        return () => audio.pause();
    }, []);

    function fetchPage(pageNum) {
        const trimmed = queryRef.current.trim();
        return trimmed ? window.api.sounds.search(trimmed, pageNum) : window.api.sounds.trending(pageNum);
    }

    // Shows myinstants' own trending sounds as soon as the modal opens
    // instead of a blank list. Typing is debounced so a fast typist doesn't
    // fire a request per keystroke; clearing the search goes back to
    // trending rather than an empty screen.
    useEffect(() => {
        queryRef.current = query;
        let cancelled = false;
        setLoading(true);
        setLoadMoreError('');
        pageRef.current = 1;
        hasMoreRef.current = true;

        const timer = setTimeout(
            async () => {
                try {
                    const found = await fetchPage(1);
                    if (cancelled) return;
                    setResults(found);
                    resultsRef.current = found;
                    hasMoreRef.current = found.length > 0;
                    setError('');
                } catch (err) {
                    if (!cancelled) setError(err?.message || t('aksiEvent.soundLibrary.loadError'));
                } finally {
                    if (!cancelled) setLoading(false);
                }
            },
            query.trim() ? 400 : 0,
        );

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    async function loadMore() {
        if (loadingMoreRef.current || loading || !hasMoreRef.current) return;

        loadingMoreRef.current = true;
        setLoadingMore(true);
        setLoadMoreError('');
        const nextPage = pageRef.current + 1;

        try {
            const found = await fetchPage(nextPage);
            const existingIds = new Set(resultsRef.current.map((r) => r.id));
            const fresh = found.filter((r) => !existingIds.has(r.id));

            const next = [...resultsRef.current, ...fresh];
            resultsRef.current = next;
            setResults(next);
            pageRef.current = nextPage;
            hasMoreRef.current = found.length > 0;
        } catch (err) {
            // Stop auto-retrying on every further scroll tick — a visible
            // retry button (below) is what re-arms hasMoreRef instead.
            hasMoreRef.current = false;
            setLoadMoreError(err?.message || t('aksiEvent.soundLibrary.loadMoreError'));
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }

    function retryLoadMore() {
        hasMoreRef.current = true;
        loadMore();
    }

    function handleScroll(event) {
        const el = event.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
            loadMore();
        }
    }

    function togglePlay(sound) {
        const audio = audioRef.current;
        if (!audio) return;

        if (playingId === sound.id) {
            audio.pause();
            setPlayingId(null);
            return;
        }

        audio.src = sound.url;
        audio.play().catch(() => {});
        setPlayingId(sound.id);
    }

    function handleApply(sound) {
        audioRef.current?.pause();
        onApply(sound);
        onClose();
    }

    return (
        <Modal title={t('aksiEvent.soundLibrary.title')} onClose={onClose}>
            <p className="mb-2 text-xs text-text-muted">{t('aksiEvent.soundLibrary.source')}</p>

            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('aksiEvent.soundLibrary.searchPlaceholder')}
                    className="w-full rounded-lg border border-border bg-bg py-2 pl-9 pr-3 text-sm"
                />
            </div>

            {/* Fixed height (not max-height) so the modal doesn't shrink/recenter
                as content swaps between loading/empty/full-list states. */}
            <div onScroll={handleScroll} className="mt-3 h-80 overflow-y-auto">
                {loading && (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-text-muted">{t('aksiEvent.soundLibrary.loading')}</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-primary-600">{error}</p>
                    </div>
                )}

                {!loading && !error && !results.length && (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-text-muted">{t('aksiEvent.soundLibrary.empty')}</p>
                    </div>
                )}

                {!loading && !error && results.length > 0 && (
                    <div className="space-y-1">
                        {results.map((sound) => (
                            <div key={sound.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-alt">
                                <button
                                    type="button"
                                    onClick={() => togglePlay(sound)}
                                    title={playingId === sound.id ? t('aksiEvent.soundLibrary.stop') : t('aksiEvent.soundLibrary.play')}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
                                >
                                    {playingId === sound.id ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
                                </button>
                                <span className="min-w-0 flex-1 truncate text-sm">{sound.name}</span>
                                <button
                                    type="button"
                                    onClick={() => handleApply(sound)}
                                    className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-surface-alt"
                                >
                                    <CheckIcon className="h-3.5 w-3.5" />
                                    {t('aksiEvent.soundLibrary.apply')}
                                </button>
                            </div>
                        ))}

                        {loadingMore && <p className="py-2 text-center text-xs text-text-muted">{t('aksiEvent.soundLibrary.loadingMore')}</p>}

                        {!loadingMore && loadMoreError && (
                            <div className="flex items-center justify-center gap-2 py-2 text-xs">
                                <span className="text-primary-600">{loadMoreError}</span>
                                <button type="button" onClick={retryLoadMore} className="rounded-lg border border-border px-2 py-1 font-medium hover:bg-surface-alt">
                                    {t('aksiEvent.soundLibrary.retry')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
