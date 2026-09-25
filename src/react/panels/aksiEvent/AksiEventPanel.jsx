import { useEffect, useState } from 'react';
import ActionsTable, { BEHAVIOR_LABELS } from './ActionsTable.jsx';
import EventsTable from './EventsTable.jsx';
import OverlaySettings from './OverlaySettings.jsx';
import MinecraftSettings from './MinecraftSettings.jsx';
import ActionModal from './ActionModal.jsx';
import EventModal from './EventModal.jsx';
import SimulateEventPanel from './SimulateEventPanel.jsx';
import Toast from '../../components/Toast.jsx';
import PlaceholderPanel from '../PlaceholderPanel.jsx';

const TABS = [
    { key: 'aksi', label: 'Aksi' },
    { key: 'event', label: 'Event' },
    { key: 'simulate', label: 'Simulasi Event' },
    { key: 'import', label: 'Import' },
    { key: 'overlay', label: 'Pengaturan Overlay' },
];

function testResultLine(result) {
    const label = BEHAVIOR_LABELS[result.type] || result.type;

    if (result.error) return `${label}: gagal — ${result.error}`;
    if (result.skipped) return `${label}: dilewati — ${result.reason}`;
    return `${label}: berhasil dijalankan`;
}

export default function AksiEventPanel() {
    const [tab, setTab] = useState('aksi');
    const [actions, setActions] = useState([]);
    const [events, setEvents] = useState([]);
    const [screens, setScreens] = useState([]);
    const [actionModal, setActionModal] = useState(null); // { action: null | Action }
    const [eventModal, setEventModal] = useState(null); // { event: null | Event }
    const [testResults, setTestResults] = useState(null);

    useEffect(() => {
        window.api.actions.list().then(setActions);
        window.api.events.list().then(setEvents);
        window.api.overlay.listScreens().then(setScreens);
    }, []);

    async function refreshActions() {
        setActions(await window.api.actions.list());
    }

    async function handleDuplicateAction(id) {
        await window.api.actions.duplicate(id);
        await refreshActions();
    }

    async function handleRemoveAction(id) {
        await window.api.actions.remove(id);
        await refreshActions();
    }

    async function handleTestAction(id) {
        setTestResults(null);
        const results = await window.api.actions.run(id);
        setTestResults(results);
    }

    async function handleSavedAction() {
        setActionModal(null);
        await refreshActions();
    }

    async function handleToggleEvent(id) {
        await window.api.events.toggle(id);
        setEvents(await window.api.events.list());
    }

    async function handleDuplicateEvent(id) {
        await window.api.events.duplicate(id);
        setEvents(await window.api.events.list());
    }

    async function handleRemoveEvent(id) {
        await window.api.events.remove(id);
        setEvents(await window.api.events.list());
    }

    async function handleSavedEvent() {
        setEventModal(null);
        setEvents(await window.api.events.list());
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold">Aksi &amp; Event</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-muted">
                    Di sini Anda menentukan aksi dan event khusus (pemicu). Contoh: menampilkan video/animasi tentang hadiah tertentu.
                    Buat Aksi terlebih dahulu, lalu tautkan ke Event. Hubungkan TikTok LIVE di tab Connection agar event menerima
                    hadiah/suka/obrolan.
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

            {tab === 'aksi' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-muted">Aksi</h3>
                        <button
                            type="button"
                            onClick={() => setActionModal({ action: null })}
                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                            + Buat Aksi baru
                        </button>
                    </div>

                    <ActionsTable
                        actions={actions}
                        screens={screens}
                        onEdit={(action) => setActionModal({ action })}
                        onTest={handleTestAction}
                        onDuplicate={handleDuplicateAction}
                        onRemove={handleRemoveAction}
                    />
                </div>
            )}

            {tab === 'event' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-muted">Event</h3>
                        <button
                            type="button"
                            onClick={() => setEventModal({ event: null })}
                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                            + Buat Event baru
                        </button>
                    </div>
                    <EventsTable
                        events={events}
                        actions={actions}
                        onEdit={(event) => setEventModal({ event })}
                        onToggle={handleToggleEvent}
                        onDuplicate={handleDuplicateEvent}
                        onRemove={handleRemoveEvent}
                    />
                </div>
            )}

            {tab === 'simulate' && <SimulateEventPanel />}

            {tab === 'import' && <PlaceholderPanel />}

            {tab === 'overlay' && (
                <div className="space-y-6">
                    <OverlaySettings />
                    <MinecraftSettings />
                </div>
            )}

            {actionModal && (
                <ActionModal
                    action={actionModal.action}
                    screens={screens}
                    onClose={() => setActionModal(null)}
                    onSaved={handleSavedAction}
                />
            )}

            {eventModal && (
                <EventModal
                    event={eventModal.event}
                    actions={actions}
                    onClose={() => setEventModal(null)}
                    onSaved={handleSavedEvent}
                />
            )}

            {testResults && (
                <Toast onDismiss={() => setTestResults(null)}>
                    <p className="mb-1 font-medium">Hasil tes aksi:</p>
                    <ul className="list-inside list-disc space-y-0.5 text-text-muted">
                        {testResults.map((result, index) => (
                            <li key={index}>{testResultLine(result)}</li>
                        ))}
                    </ul>
                </Toast>
            )}
        </div>
    );
}
