import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function PlaceholderPanel() {
    const { t } = useLanguage();

    return (
        <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="font-semibold">{t('placeholder.title')}</p>
            <p className="mt-1 text-sm text-text-muted">{t('placeholder.subtitle')}</p>
        </div>
    );
}
