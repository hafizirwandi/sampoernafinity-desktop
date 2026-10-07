import { useState } from 'react';
import { useTiktokConnection } from '../hooks/useTiktokConnection.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function ConnectionPanel() {
    const { t } = useLanguage();
    const { state, connect, disconnect } = useTiktokConnection();
    const [username, setUsername] = useState(state.username);
    const [validationError, setValidationError] = useState('');

    const status = state?.status || 'idle';
    const connecting = status === 'connecting';
    const connected = status === 'connected';

    let statusText = '';
    let statusClass = 'mt-4 text-sm text-text-muted';

    if (validationError) {
        statusText = validationError;
        statusClass = 'mt-4 text-sm text-primary-600';
    } else if (connected) {
        statusText = t('connection.connectedStatus', { username: state.username });
        statusClass = 'mt-4 text-sm text-green-600';
    } else if (connecting) {
        statusText = t('connection.connectingStatus', { username: state.username });
        statusClass = 'mt-4 text-sm text-text-muted';
    } else if (status === 'error') {
        statusText = state.error || t('connection.errorGeneric');
        statusClass = 'mt-4 text-sm text-primary-600';
    } else {
        statusText = state?.error || '';
    }

    async function handleConnect() {
        const trimmed = username.trim();

        if (!trimmed) {
            setValidationError(t('connection.usernameRequired'));
            return;
        }

        setValidationError('');
        await connect(trimmed);
    }

    return (
        <div className="max-w-md space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                            <path d="M16.5 3c.4 2.3 1.9 3.9 4.5 4.1v3.1c-1.6.1-3-.4-4.5-1.3v6.6c0 3.3-2.2 5.5-5.4 5.5-3.3 0-5.6-2.3-5.6-5.5 0-3.2 2.4-5.5 5.6-5.5.3 0 .6 0 .9.1v3.2c-.3-.1-.6-.1-.9-.1-1.5 0-2.5 1-2.5 2.4 0 1.4 1 2.4 2.5 2.4 1.6 0 2.6-1.1 2.6-2.7V3h2.8Z" />
                        </svg>
                        <h2 className="font-semibold">{t('connection.title')}</h2>
                    </div>
                </div>

                <div className="mt-4">
                    <label htmlFor="tiktok-username" className="mb-1.5 block text-sm font-medium">{t('connection.usernameLabel')}</label>
                    <p className="mb-1.5 text-xs text-text-muted">{t('connection.usernameHint')}</p>
                    <input
                        type="text"
                        id="tiktok-username"
                        placeholder={t('connection.usernamePlaceholder')}
                        autoComplete="off"
                        disabled={connecting || connected}
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                    />
                </div>

                {!connected && (
                    <button
                        type="button"
                        onClick={handleConnect}
                        disabled={connecting}
                        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 ${
                            connecting ? 'bg-primary-600 opacity-60' : 'bg-primary-600'
                        }`}
                    >
                        {connecting ? t('connection.connecting') : t('connection.connectButton')}
                    </button>
                )}

                {connected && (
                    <button type="button" disabled className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {t('connection.connected')}
                    </button>
                )}

                {connected && (
                    <button type="button" onClick={disconnect} className="mt-4 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-alt">
                        {t('connection.disconnect')}
                    </button>
                )}

                <div className={statusClass}>{statusText}</div>

                <p className="mt-4 text-xs text-text-muted">{t('connection.footerHint')}</p>
            </div>
        </div>
    );
}
