import { useEffect, useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function OverlaySettings() {
    const { t } = useLanguage();
    const [settings, setSettings] = useState(null);
    const [newScreenName, setNewScreenName] = useState('');
    const [statusByScreen, setStatusByScreen] = useState({});
    const [copiedScreenId, setCopiedScreenId] = useState(null);

    useEffect(() => {
        window.api.overlay.getSettings().then(setSettings);
    }, []);

    useEffect(() => {
        const unsubscribe = window.api.overlay.onScreenStatus(({ screenId, connected }) => {
            setStatusByScreen((prev) => ({ ...prev, [screenId]: connected }));
        });

        return unsubscribe;
    }, []);

    if (!settings) return null;

    async function refresh() {
        setSettings(await window.api.overlay.getSettings());
    }

    async function toggleAudio() {
        const next = await window.api.overlay.updateSettings({ playAudioThroughOverlay: !settings.playAudioThroughOverlay });
        setSettings(next);
    }

    async function toggleFifo() {
        const next = await window.api.overlay.updateSettings({ liveAudioQueueFifo: !settings.liveAudioQueueFifo });
        setSettings(next);
    }

    async function addScreen() {
        await window.api.overlay.addScreen(newScreenName.trim() || undefined);
        setNewScreenName('');
        await refresh();
    }

    async function removeScreen(id) {
        try {
            await window.api.overlay.removeScreen(id);
            await refresh();
        } catch (error) {
            console.error(error);
        }
    }

    function screenUrl(screen) {
        if (!settings.port) return null;
        return `http://127.0.0.1:${settings.port}/overlay.html?screen=${screen.id}&token=${settings.token}`;
    }

    async function copyUrl(screen) {
        const url = screenUrl(screen);
        if (!url) return;

        await navigator.clipboard.writeText(url);
        setCopiedScreenId(screen.id);
        setTimeout(() => setCopiedScreenId((current) => (current === screen.id ? null : current)), 1500);
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-sm text-text-muted">{t('aksiEvent.overlaySettings.description')}</p>

                {!settings.port && (
                    <p className="mt-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700">
                        {t('aksiEvent.overlaySettings.serverInactive')}
                    </p>
                )}

                <label className="mt-4 flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={settings.playAudioThroughOverlay}
                        onChange={toggleAudio}
                        className="rounded border-border text-primary-600 focus:ring-primary-600"
                    />
                    {t('aksiEvent.overlaySettings.playThroughOverlay')}
                </label>
                <p className="ml-6 text-xs text-text-muted">{t('aksiEvent.overlaySettings.playThroughOverlayHint')}</p>

                <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={settings.liveAudioQueueFifo}
                        onChange={toggleFifo}
                        className="rounded border-border text-primary-600 focus:ring-primary-600"
                    />
                    {t('aksiEvent.overlaySettings.fifoToggle')}
                </label>
                <p className="ml-6 text-xs text-text-muted">{t('aksiEvent.overlaySettings.fifoHint')}</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                            <th className="py-2 px-4 font-medium">{t('aksiEvent.overlaySettings.tableScreenName')}</th>
                            <th className="py-2 px-4 font-medium">{t('aksiEvent.overlaySettings.tableLink')}</th>
                            <th className="py-2 px-4 font-medium">{t('aksiEvent.overlaySettings.tableMaxQueue')}</th>
                            <th className="py-2 px-4 font-medium">{t('aksiEvent.overlaySettings.tableStatus')}</th>
                            <th className="py-2 px-4 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {settings.screens.map((screen) => (
                            <tr key={screen.id} className="border-b border-border last:border-0">
                                <td className="py-2 px-4">{screen.name}</td>
                                <td className="py-2 px-4">
                                    {screenUrl(screen) ? (
                                        <button
                                            type="button"
                                            onClick={() => copyUrl(screen)}
                                            title={screenUrl(screen)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-surface-alt"
                                        >
                                            {copiedScreenId === screen.id ? (
                                                <>
                                                    <CheckIcon className="h-3.5 w-3.5 text-green-600" />
                                                    {t('aksiEvent.overlaySettings.copied')}
                                                </>
                                            ) : (
                                                <>
                                                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                                                    {t('aksiEvent.overlaySettings.copyLink')}
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-text-muted">{t('common.dash')}</span>
                                    )}
                                </td>
                                <td className="py-2 px-4">{screen.maxQueueLength}</td>
                                <td className={`py-2 px-4 text-xs font-medium ${statusByScreen[screen.id] ? 'text-green-600' : 'text-text-muted'}`}>
                                    {statusByScreen[screen.id] ? t('aksiEvent.overlaySettings.statusReady') : t('aksiEvent.overlaySettings.statusInactive')}
                                </td>
                                <td className="py-2 px-4 text-right">
                                    {settings.screens.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeScreen(screen.id)}
                                            title={t('common.delete')}
                                            className="rounded-lg p-1.5 text-primary-600 hover:bg-surface-alt hover:text-primary-700"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex items-center gap-2 border-t border-border p-3">
                    <input
                        type="text"
                        value={newScreenName}
                        onChange={(event) => setNewScreenName(event.target.value)}
                        placeholder={t('aksiEvent.overlaySettings.newScreenPlaceholder')}
                        className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    />
                    <button type="button" onClick={addScreen} className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-alt">
                        {t('aksiEvent.overlaySettings.addScreen')}
                    </button>
                </div>
            </div>
        </div>
    );
}
