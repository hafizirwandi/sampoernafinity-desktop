import { ArrowDownTrayIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext.jsx';

// Shown instead of the whole app when the server says this build is below
// the minimum supported version. The download keeps running in the
// background; once it's done the only way forward is installing it. When
// auto-update can't run (dev build, or it errored) a manual download link
// is offered instead.
export default function UpdateRequiredScreen({ update }) {
    const { t } = useLanguage();
    const { state } = update;

    const downloaded = state.status === 'downloaded';
    const downloading = state.status === 'downloading' || state.status === 'available' || state.status === 'checking';
    const manualOnly = state.status === 'unsupported' || state.status === 'error' || state.status === 'not-available';

    return (
        <section className="flex min-h-screen items-center justify-center bg-bg p-6 text-text">
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-xl">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                </span>

                <h1 className="mt-5 text-xl font-bold">{t('updater.requiredTitle')}</h1>
                <p className="mt-2 text-sm text-text-muted">
                    {t('updater.requiredBody', { current: state.currentVersion, min: state.minVersion || '-' })}
                </p>

                {downloading && (
                    <div className="mt-6 text-left">
                        <div className="flex justify-between text-xs text-text-muted">
                            <span>{t('updater.downloadingShort')}</span>
                            <span>{state.progress}%</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
                            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${state.progress}%` }} />
                        </div>
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-2">
                    {downloaded && (
                        <button
                            type="button"
                            onClick={update.install}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                            {t('updater.installAndRestart')}
                        </button>
                    )}

                    {(manualOnly || !downloaded) && (
                        <button
                            type="button"
                            onClick={update.openDownload}
                            className={
                                manualOnly
                                    ? 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700'
                                    : 'inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-muted hover:text-text'
                            }
                        >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            {t('updater.manualDownload')}
                        </button>
                    )}
                </div>

                {state.status === 'error' && <p className="mt-4 text-xs text-text-muted">{t('updater.autoFailed')}</p>}
            </div>
        </section>
    );
}
