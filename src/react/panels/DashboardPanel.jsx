import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function DashboardPanel({ auth }) {
    const { t } = useLanguage();

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-sm text-text-muted">{t('dashboard.greeting')}</p>
                <p className="text-lg font-semibold">{auth.user?.name || ' '}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-5">
                    <p className="font-semibold">{t('dashboard.myPackage')}</p>
                    <p className="mt-1 text-sm text-text-muted">{t('dashboard.myPackageDesc')}</p>
                    <span className="mt-3 inline-block rounded-full bg-surface-alt px-2.5 py-1 text-xs text-text-muted">{t('common.comingSoon')}</span>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5">
                    <p className="font-semibold">{t('dashboard.manualBook')}</p>
                    <p className="mt-1 text-sm text-text-muted">{t('dashboard.manualBookDesc')}</p>
                    <span className="mt-3 inline-block rounded-full bg-surface-alt px-2.5 py-1 text-xs text-text-muted">{t('common.comingSoon')}</span>
                </div>
            </div>
        </div>
    );
}
