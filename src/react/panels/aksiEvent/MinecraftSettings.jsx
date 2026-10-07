import { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function MinecraftSettings() {
    const { t } = useLanguage();
    const [baseUrl, setBaseUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageIsError, setMessageIsError] = useState(false);

    useEffect(() => {
        window.api.minecraft.getSettings().then((settings) => {
            setBaseUrl(settings.baseUrl || '');
            setHasApiKey(settings.hasApiKey);
        });
    }, []);

    async function handleSave() {
        setSaving(true);
        setMessage('');

        try {
            const payload = { baseUrl: baseUrl.trim() };
            if (apiKey) payload.apiKey = apiKey;

            const settings = await window.api.minecraft.saveSettings(payload);
            setHasApiKey(settings.hasApiKey);
            setApiKey('');
            setMessage(t('aksiEvent.minecraftSettings.savedMessage'));
            setMessageIsError(false);
        } catch (error) {
            setMessage(error?.message || t('aksiEvent.minecraftSettings.saveErrorGeneric'));
            setMessageIsError(true);
        } finally {
            setSaving(false);
        }
    }

    async function handleTest() {
        setTesting(true);
        setMessage('');

        try {
            await window.api.minecraft.testConnection();
            setMessage(t('aksiEvent.minecraftSettings.testSuccessMessage'));
            setMessageIsError(false);
        } catch (error) {
            setMessage(error?.message || t('aksiEvent.minecraftSettings.testErrorGeneric'));
            setMessageIsError(true);
        } finally {
            setTesting(false);
        }
    }

    return (
        <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold">{t('aksiEvent.minecraftSettings.title')}</h3>
            <p className="mt-1 text-xs text-text-muted">{t('aksiEvent.minecraftSettings.description')}</p>

            <div className="mt-4 space-y-3">
                <div>
                    <label className="mb-1.5 block text-sm font-medium">{t('aksiEvent.minecraftSettings.baseUrlLabel')}</label>
                    <input
                        type="text"
                        value={baseUrl}
                        onChange={(event) => setBaseUrl(event.target.value)}
                        placeholder="http://localhost:4567"
                        className="w-full max-w-md rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                    />
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-medium">{t('aksiEvent.minecraftSettings.apiKeyLabel')}</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        placeholder={hasApiKey ? t('aksiEvent.minecraftSettings.apiKeySavedPlaceholder') : t('aksiEvent.minecraftSettings.apiKeyPlaceholder')}
                        className="w-full max-w-md rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                        {saving ? t('common.saving') : t('common.save')}
                    </button>
                    <button
                        type="button"
                        onClick={handleTest}
                        disabled={testing}
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-alt disabled:opacity-60"
                    >
                        {testing ? t('aksiEvent.minecraftSettings.testing') : t('aksiEvent.minecraftSettings.testConnection')}
                    </button>
                </div>

                {message && <p className={`text-sm ${messageIsError ? 'text-primary-600' : 'text-green-600'}`}>{message}</p>}
            </div>
        </div>
    );
}
