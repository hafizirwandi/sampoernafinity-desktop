import { useState } from 'react';
import VoiceSettingsTab from './VoiceSettingsTab.jsx';
import AccessFilterTab from './AccessFilterTab.jsx';
import SpecialUsersTab from './SpecialUsersTab.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function TtsPanel() {
    const { t } = useLanguage();
    const TABS = [
        { key: 'voice', label: t('tts.panel.tabVoice') },
        { key: 'access', label: t('tts.panel.tabAccess') },
        { key: 'users', label: t('tts.panel.tabUsers') },
    ];
    const [tab, setTab] = useState('voice');

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold">{t('tts.panel.title')}</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('tts.panel.description')}</p>
            </div>

            <div className="inline-flex rounded-lg border border-border bg-surface p-1">
                {TABS.map((tabItem) => {
                    const active = tab === tabItem.key;

                    return (
                        <button
                            key={tabItem.key}
                            type="button"
                            onClick={() => setTab(tabItem.key)}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium ${active ? 'bg-primary-600 text-white' : 'text-text-muted'}`}
                        >
                            {tabItem.label}
                        </button>
                    );
                })}
            </div>

            {tab === 'voice' && <VoiceSettingsTab />}
            {tab === 'access' && <AccessFilterTab />}
            {tab === 'users' && <SpecialUsersTab />}
        </div>
    );
}
