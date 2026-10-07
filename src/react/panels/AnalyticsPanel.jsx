import { useEffect, useState } from 'react';
import StatsChart from './StatsChart.jsx';
import Leaderboard, { LeaderboardRow } from '../components/Leaderboard.jsx';
import { formatDateTime, formatNumber, timeAgo } from '../lib/format.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function AnalyticsPanel() {
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const next = await window.api.stats.get({ days: 30 });
            if (!cancelled) setStats(next);
        }

        load();
        const timer = setInterval(load, 5000);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">{t('analytics.title')}</h2>
                        <p className="mt-1 max-w-md text-sm text-text-muted">{t('analytics.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                        <div>
                            <p className="text-xs text-text-muted">{t('analytics.diamonds')}</p>
                            <p className="text-2xl font-bold">{formatNumber(stats.totals.diamonds)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted">{t('analytics.newFollowers')}</p>
                            <p className="text-2xl font-bold">{formatNumber(stats.totals.newFollowers)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted">{t('analytics.newSubscribers')}</p>
                            <p className="text-2xl font-bold">{formatNumber(stats.totals.newSubscribers)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-text-muted">{t('analytics.shares')}</p>
                            <p className="text-2xl font-bold">{formatNumber(stats.totals.shares)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
                <StatsChart points={stats.chart} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="flex items-center gap-2 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0 text-text-muted">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-4.5m-9 4.5v-4.5M9 15h6m-6 0a6 6 0 0 1-6-6V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25V9a6 6 0 0 1-6 6" />
                        </svg>
                        {t('analytics.topGifter')}
                    </h3>
                    <Leaderboard
                        items={stats.topGifters}
                        emptyText={t('analytics.emptyLeaderboard')}
                        renderItem={(gifter, index) => (
                            <LeaderboardRow
                                key={gifter.uniqueId || gifter.nickname || index}
                                rank={index + 1}
                                avatarInitial={(gifter.nickname || gifter.uniqueId || '?').charAt(0).toUpperCase()}
                                title={gifter.nickname || gifter.uniqueId}
                                subtitle={gifter.uniqueId ? `@${gifter.uniqueId}` : ''}
                                value={formatNumber(gifter.diamonds)}
                            />
                        )}
                    />
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="flex items-center gap-2 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0 text-text-muted">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H4.5a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18.25" />
                        </svg>
                        {t('analytics.topGift')}
                    </h3>
                    <Leaderboard
                        items={stats.topGifts}
                        emptyText={t('analytics.emptyLeaderboard')}
                        renderItem={(gift, index) => (
                            <LeaderboardRow key={gift.name || index} rank={index + 1} avatarInitial="🎁" title={gift.name} subtitle="" value={`${gift.count}x`} />
                        )}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="flex items-center gap-2 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0 text-text-muted">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                        </svg>
                        {t('analytics.topShare')}
                    </h3>
                    <Leaderboard
                        items={stats.topSharers}
                        emptyText={t('analytics.emptyLeaderboard')}
                        renderItem={(sharer, index) => (
                            <LeaderboardRow
                                key={sharer.uniqueId || sharer.nickname || index}
                                rank={index + 1}
                                avatarInitial={(sharer.nickname || sharer.uniqueId || '?').charAt(0).toUpperCase()}
                                title={sharer.nickname || sharer.uniqueId}
                                subtitle={sharer.uniqueId ? `@${sharer.uniqueId}` : ''}
                                value={`${sharer.count}x`}
                            />
                        )}
                    />
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="flex items-center gap-2 font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0 text-text-muted">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                        </svg>
                        {t('analytics.lastFollowers')}
                    </h3>
                    <Leaderboard
                        items={stats.lastFollowers}
                        emptyText={t('analytics.emptyLeaderboard')}
                        renderItem={(follower, index) => (
                            <LeaderboardRow
                                key={`${follower.uniqueId || follower.nickname || index}-${follower.at}`}
                                rank={index + 1}
                                avatarInitial={(follower.nickname || follower.uniqueId || '?').charAt(0).toUpperCase()}
                                title={follower.nickname || follower.uniqueId}
                                subtitle={follower.uniqueId ? `@${follower.uniqueId}` : ''}
                                value={timeAgo(follower.at)}
                            />
                        )}
                    />
                </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="flex items-center gap-2 font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0 text-text-muted">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {t('analytics.history')}
                </h3>
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                                <th className="py-2 pr-4 font-medium">{t('analytics.tableDate')}</th>
                                <th className="py-2 pr-4 font-medium">{t('analytics.tableUsername')}</th>
                                <th className="py-2 pr-4 font-medium">{t('analytics.tableDiamonds')}</th>
                                <th className="py-2 pr-4 font-medium">{t('analytics.tableNewFollowers')}</th>
                                <th className="py-2 pr-4 font-medium">{t('analytics.tableSubscribers')}</th>
                                <th className="py-2 pr-4 font-medium">{t('analytics.tableShares')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!stats.history.length ? (
                                <tr>
                                    <td colSpan={6} className="py-4 text-center text-text-muted">{t('analytics.emptyHistory')}</td>
                                </tr>
                            ) : (
                                stats.history.map((session) => (
                                    <tr key={session.id || session.startedAt} className="border-b border-border last:border-0">
                                        <td className="py-2 pr-4">{formatDateTime(session.startedAt)}</td>
                                        <td className="py-2 pr-4">{session.username}</td>
                                        <td className="py-2 pr-4">{formatNumber(session.diamonds)}</td>
                                        <td className="py-2 pr-4">{formatNumber(session.newFollowers)}</td>
                                        <td className="py-2 pr-4">{formatNumber(session.newSubscribers)}</td>
                                        <td className="py-2 pr-4">{formatNumber(session.shares)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
