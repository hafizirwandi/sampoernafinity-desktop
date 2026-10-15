import { useState } from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext.jsx';

// Non-blocking notice for an optional update. Sits bottom-left so it never
// covers the Toast in the bottom-right corner.
export default function UpdateBanner({ update }) {
    const { t } = useLanguage();
    const [dismissedFor, setDismissedFor] = useState(null);

    const state = update.state;
    if (!state || state.required) return null;
    if (!['downloading', 'downloaded'].includes(state.status)) return null;
    if (dismissedFor === `${state.status}-${state.latestVersion}`) return null;

    const downloaded = state.status === 'downloaded';

    return (
        <div className="fixed bottom-6 left-6 z-[60] w-full max-w-sm rounded-xl border border-border bg-surface p-4 text-sm shadow-lg">
            <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
                    {downloaded ? <ArrowPathIcon className="h-4 w-4" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
                </span>

                <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                        {downloaded
                            ? t('updater.readyTitle', { version: state.latestVersion })
                            : t('updater.downloadingTitle', { version: state.latestVersion })}
                    </p>

                    {downloaded ? (
                        <p className="mt-1 text-xs text-text-muted">
                            {state.liveActive ? t('updater.liveDeferred') : t('updater.readyBody')}
                        </p>
                    ) : (
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${state.progress}%` }} />
                        </div>
                    )}

                    {downloaded && (
                        <div className="mt-3 flex gap-2">
                            <button
                                type="button"
                                onClick={update.install}
                                disabled={state.liveActive}
                                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t('updater.restartNow')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setDismissedFor(`${state.status}-${state.latestVersion}`)}
                                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text"
                            >
                                {t('updater.later')}
                            </button>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setDismissedFor(`${state.status}-${state.latestVersion}`)}
                    className="shrink-0 text-text-muted hover:text-text"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
