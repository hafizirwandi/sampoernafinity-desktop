import { useEffect, useMemo, useState } from 'react';
import { formatDateTime, formatNumber } from '../lib/format.js';
import { ipcErrorMessage } from '../lib/ipc.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const GIFTS_PAGE_SIZE = 60;

function GiftCard({ gift, categoryName, t }) {
    return (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center">
            <img src={gift.imageSrc || gift.imageUrl} alt={gift.name} loading="lazy" className="h-14 w-14 rounded-lg object-contain" />
            <p className="line-clamp-2 text-sm font-medium">{gift.name}</p>
            <p className="text-xs font-medium text-yellow-600">
                {formatNumber(gift.coin)} {t('gifts.coin')}
            </p>
            <p className="text-xs text-text-muted">{categoryName}</p>
            <p className="text-xs text-text-muted">ID: {gift.tiktokId}</p>
        </div>
    );
}

export default function GiftsPanel() {
    const { t } = useLanguage();
    const [catalog, setCatalog] = useState({ syncedAt: null, categories: [], gifts: [] });
    const [currentType, setCurrentType] = useState('gift');
    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [syncing, setSyncing] = useState(false);
    const [syncError, setSyncError] = useState('');
    const [syncProgress, setSyncProgress] = useState(null);

    useEffect(() => {
        window.api.gifts.list().then(setCatalog);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setQuery(searchInput), 200);
        return () => clearTimeout(timer);
    }, [searchInput]);

    async function handleSync() {
        setSyncing(true);
        setSyncError('');
        setSyncProgress(null);

        const unsubscribe = window.api.gifts.onSyncProgress(setSyncProgress);

        try {
            const next = await window.api.gifts.sync();
            setCatalog(next);
        } catch (error) {
            setSyncError(ipcErrorMessage(error) || t('gifts.syncError'));
        } finally {
            unsubscribe();
            setSyncing(false);
            setSyncProgress(null);
        }
    }

    function handleTabChange(type) {
        setCurrentType(type);
        setCategoryFilter('all');
        setPage(1);
    }

    function handleCategoryChange(value) {
        setCategoryFilter(value);
        setPage(1);
    }

    const categoriesForType = useMemo(
        () => catalog.categories.filter((c) => c.type === currentType).sort((a, b) => a.sortOrder - b.sortOrder),
        [catalog.categories, currentType],
    );

    function categoryNameById(id) {
        const category = catalog.categories.find((c) => c.id === id);
        return category ? category.name : t('gifts.noCategory');
    }

    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return catalog.gifts.filter((g) => {
            if (g.type !== currentType) return false;
            if (categoryFilter !== 'all' && String(g.categoryId) !== categoryFilter) return false;
            if (normalizedQuery && !g.name.toLowerCase().includes(normalizedQuery)) return false;
            return true;
        });
    }, [catalog.gifts, currentType, categoryFilter, query]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / GIFTS_PAGE_SIZE));

    useEffect(() => {
        setPage((prev) => Math.min(Math.max(1, prev), totalPages));
    }, [totalPages]);

    const clampedPage = Math.min(Math.max(1, page), totalPages);
    const pageItems = filteredItems.slice((clampedPage - 1) * GIFTS_PAGE_SIZE, clampedPage * GIFTS_PAGE_SIZE);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">{t('gifts.title')}</h2>
                    <p className="mt-1 text-sm text-text-muted">{t('gifts.subtitle')}</p>
                </div>

                <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-4 w-4 shrink-0 ${syncing ? 'animate-spin' : ''}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>
                        {syncing
                            ? syncProgress
                                ? t('gifts.syncingProgress', { done: formatNumber(syncProgress.done), total: formatNumber(syncProgress.total) })
                                : t('gifts.syncing')
                            : t('gifts.updateButton')}
                    </span>
                </button>
            </div>

            <p className="text-sm text-green-600">
                {catalog.syncedAt ? t('gifts.lastSynced', { date: formatDateTime(catalog.syncedAt) }) : t('gifts.needSync')}
            </p>
            {syncError && <p className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700">{syncError}</p>}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex rounded-lg border border-border bg-surface p-1">
                    {['gift', 'sticker'].map((type) => {
                        const active = currentType === type;

                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleTabChange(type)}
                                className={`rounded-md px-4 py-1.5 text-sm font-medium ${active ? 'bg-primary-600 text-white' : 'text-text-muted'}`}
                            >
                                {type === 'gift' ? t('gifts.tabGift') : t('gifts.tabSticker')}
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder={t('gifts.searchPlaceholder')}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm sm:w-56"
                    />
                    <select
                        value={categoryFilter}
                        onChange={(event) => handleCategoryChange(event.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm sm:w-48"
                    >
                        <option value="all">{t('gifts.allCategories')}</option>
                        {categoriesForType.map((category) => (
                            <option key={category.id} value={String(category.id)}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-6">
                {!catalog.gifts.length ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">{t('gifts.emptyCatalog')}</div>
                ) : !filteredItems.length ? (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-muted">{t('gifts.emptyFiltered')}</div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                        {pageItems.map((gift) => (
                            <GiftCard key={gift.id} gift={gift} categoryName={categoryNameById(gift.categoryId)} t={t} />
                        ))}
                    </div>
                )}
            </div>

            {filteredItems.length > 0 && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3">
                    <button
                        type="button"
                        disabled={clampedPage <= 1}
                        onClick={() => setPage(clampedPage - 1)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t('gifts.previous')}
                    </button>
                    <span className="text-xs text-text-muted">
                        {t('gifts.pageInfo', { page: clampedPage, totalPages, count: formatNumber(filteredItems.length) })}
                    </span>
                    <button
                        type="button"
                        disabled={clampedPage >= totalPages}
                        onClick={() => setPage(clampedPage + 1)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {t('gifts.next')}
                    </button>
                </div>
            )}
        </div>
    );
}
