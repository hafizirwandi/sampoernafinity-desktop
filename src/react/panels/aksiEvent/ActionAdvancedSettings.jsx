import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function ActionAdvancedSettings({ form, onChange, screens }) {
    const { t } = useLanguage();

    return (
        <div className="mt-6 space-y-5 border-t border-border pt-5">
            <div>
                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                    <span className="inline-block h-4 w-1 rounded bg-primary-600"></span>
                    {t('aksiEvent.advancedSettings.durationHeading')}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-text-muted">{t('aksiEvent.advancedSettings.showFor')}</span>
                    <input
                        type="number"
                        min="1"
                        value={form.durationSeconds}
                        onChange={(event) => onChange({ durationSeconds: event.target.value })}
                        className="w-16 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm"
                    />
                    <span className="text-sm text-text-muted">{t('aksiEvent.advancedSettings.secondsOverlay')}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {screens.map((screen, index) => (
                        <button
                            key={screen.id}
                            type="button"
                            title={screen.name}
                            onClick={() => onChange({ screenId: screen.id })}
                            className={`h-8 w-8 rounded-lg text-sm font-medium ${
                                form.screenId === screen.id ? 'bg-primary-600 text-white' : 'border border-border text-text-muted hover:bg-surface-alt'
                            }`}
                        >
                            {index + 1}
                        </button>
                    ))}
                </div>
                <p className="mt-2 text-xs text-text-muted">{t('aksiEvent.advancedSettings.durationHint')}</p>
            </div>

            <div>
                <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                    <span className="inline-block h-4 w-1 rounded bg-primary-600"></span>
                    {t('aksiEvent.advancedSettings.limitsHeading')}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-text-muted">{t('aksiEvent.advancedSettings.globalCooldown')}</span>
                    <input
                        type="number"
                        min="0"
                        value={form.cooldownGlobalSeconds}
                        onChange={(event) => onChange({ cooldownGlobalSeconds: event.target.value })}
                        className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm"
                    />
                    <span className="text-sm text-text-muted">{t('aksiEvent.advancedSettings.secondsPerViewerCooldown')}</span>
                    <input
                        type="number"
                        min="0"
                        value={form.cooldownPerViewerSeconds}
                        onChange={(event) => onChange({ cooldownPerViewerSeconds: event.target.value })}
                        className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm"
                    />
                    <span className="text-sm text-text-muted">{t('aksiEvent.advancedSettings.seconds')}</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm font-medium">
                    <span>{t('aksiEvent.advancedSettings.fadeInOut')}</span>
                    <input
                        type="checkbox"
                        checked={form.fadeInOut}
                        onChange={(event) => onChange({ fadeInOut: event.target.checked })}
                        className="rounded border-border text-primary-600 focus:ring-primary-600"
                    />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm font-medium">
                    <span>{t('aksiEvent.advancedSettings.skipNext')}</span>
                    <input
                        type="checkbox"
                        checked={form.skipNextAction}
                        onChange={(event) => onChange({ skipNextAction: event.target.checked })}
                        className="rounded border-border text-primary-600 focus:ring-primary-600"
                    />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm font-medium">
                    <span className="flex items-center gap-2">
                        {t('aksiEvent.advancedSettings.repeatCombo')}
                        <input
                            type="number"
                            min="1"
                            value={form.comboMax}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => onChange({ comboMax: event.target.value })}
                            className="w-16 rounded-lg border border-border bg-bg px-2 py-1 text-xs"
                        />
                        )
                    </span>
                    <input
                        type="checkbox"
                        checked={form.repeatWithCombo}
                        onChange={(event) => onChange({ repeatWithCombo: event.target.checked })}
                        className="rounded border-border text-primary-600 focus:ring-primary-600"
                    />
                </label>
            </div>
        </div>
    );
}
