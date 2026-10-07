import { useEffect, useMemo, useState } from 'react';
import { PlusIcon, StopIcon } from '@heroicons/react/24/outline';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import SoundboardTable from './SoundboardTable.jsx';
import SoundNotificationModal from './SoundNotificationModal.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function SoundboardPanel() {
    const { t } = useLanguage();
    const [sounds, setSounds] = useState([]);
    const [globalEnabled, setGlobalEnabled] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // { sound: null | Sound }

    useEffect(() => {
        window.api.soundboard.list().then(setSounds);
        window.api.soundboard.getGlobalEnabled().then(setGlobalEnabled);
    }, []);

    async function refresh() {
        setSounds(await window.api.soundboard.list());
    }

    async function toggleGlobalEnabled() {
        const next = await window.api.soundboard.setGlobalEnabled(!globalEnabled);
        setGlobalEnabled(next);
    }

    async function handleToggle(id) {
        await window.api.soundboard.toggle(id);
        await refresh();
    }

    async function handleRemove(id) {
        await window.api.soundboard.remove(id);
        await refresh();
    }

    async function handleTest(id) {
        await window.api.soundboard.test(id);
    }

    async function handleSaved() {
        setModal(null);
        await refresh();
    }

    const filteredSounds = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return sounds;

        return sounds.filter((sound) => (sound.name || '').toLowerCase().includes(query));
    }, [sounds, search]);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold">{t('soundboard.panel.title')}</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('soundboard.panel.description')}</p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setModal({ sound: null })}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                        <PlusIcon className="h-4 w-4" />
                        {t('soundboard.panel.createButton')}
                    </button>

                    <label className="flex items-center gap-2 text-sm">
                        <ToggleSwitch checked={globalEnabled} onChange={toggleGlobalEnabled} title={t('soundboard.panel.activeToggleLabel')} />
                        {t('soundboard.panel.activeToggleLabel')}
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder={t('soundboard.panel.searchPlaceholder')}
                        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm sm:w-56"
                    />
                    <button
                        type="button"
                        onClick={() => window.api.soundboard.stopAll()}
                        title={t('soundboard.panel.stopAll')}
                        className="flex shrink-0 items-center justify-center rounded-lg border border-border p-2.5 text-primary-600 hover:bg-surface-alt"
                    >
                        <StopIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <SoundboardTable sounds={filteredSounds} onEdit={(sound) => setModal({ sound })} onTest={handleTest} onToggle={handleToggle} onRemove={handleRemove} />

            {modal && <SoundNotificationModal sound={modal.sound} onClose={() => setModal(null)} onSaved={handleSaved} />}
        </div>
    );
}
