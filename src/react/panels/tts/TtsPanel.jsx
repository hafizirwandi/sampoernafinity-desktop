import { useState } from 'react';
import VoiceSettingsTab from './VoiceSettingsTab.jsx';
import AccessFilterTab from './AccessFilterTab.jsx';
import SpecialUsersTab from './SpecialUsersTab.jsx';

const TABS = [
    { key: 'voice', label: 'Pengaturan Suara' },
    { key: 'access', label: 'Akses & Filter' },
    { key: 'users', label: 'Pengguna Spesial' },
];

export default function TtsPanel() {
    const [tab, setTab] = useState('voice');

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold">TTS / Baca Komentar</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-muted">
                    Bacakan komentar TikTok LIVE secara otomatis menggunakan suara text-to-speech, lengkap dengan aturan siapa yang
                    boleh memicu dan filter kata.
                </p>
            </div>

            <div className="inline-flex rounded-lg border border-border bg-surface p-1">
                {TABS.map((t) => {
                    const active = tab === t.key;

                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setTab(t.key)}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium ${active ? 'bg-primary-600 text-white' : 'text-text-muted'}`}
                        >
                            {t.label}
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
