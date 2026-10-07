import { useEffect, useState } from 'react';
import ActionsTable, { behaviorLabel } from './ActionsTable.jsx';
import EventsTable from './EventsTable.jsx';
import OverlaySettings from './OverlaySettings.jsx';
import MinecraftSettings from './MinecraftSettings.jsx';
import ActionModal from './ActionModal.jsx';
import EventModal from './EventModal.jsx';
import SimulateEventPanel from './SimulateEventPanel.jsx';
import Toast from '../../components/Toast.jsx';
import PlaceholderPanel from '../PlaceholderPanel.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

function testResultLine(t, result) {
    const label = behaviorLabel(t, result.type) || result.type;

    if (result.error) return t('aksiEvent.panel.resultFail', { label, error: result.error });
    if (result.skipped) return t('aksiEvent.panel.resultSkip', { label, reason: result.reason });
    return t('aksiEvent.panel.resultOk', { label });
}

export default function AksiEventPanel() {
    const { t } = useLanguage();
    const TABS = [
        { key: 'aksi', label: t('aksiEvent.panel.tabAksi') },
        { key: 'event', label: t('aksiEvent.panel.tabEvent') },
        { key: 'simulate', label: t('aksiEvent.panel.tabSimulate') },
        { key: 'import', label: t('aksiEvent.panel.tabImport') },
        { key: 'overlay', label: t('aksiEvent.panel.tabOverlay') },
    ];
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
                <h2 className="text-lg font-semibold">{t('aksiEvent.panel.title')}</h2>
                <p className="mt-1 max-w-2xl text-sm text-text-muted">{t('aksiEvent.panel.description')}</p>
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

            {tab === 'aksi' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-muted">{t('aksiEvent.panel.actionsHeading')}</h3>
                        <button
                            type="button"
                            onClick={() => setActionModal({ action: null })}
                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                            {t('aksiEvent.panel.newActionButton')}
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
                        <h3 className="text-sm font-semibold text-text-muted">{t('aksiEvent.panel.eventsHeading')}</h3>
                        <button
                            type="button"
                            onClick={() => setEventModal({ event: null })}
                            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                            {t('aksiEvent.panel.newEventButton')}
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
                    <p className="mb-1 font-medium">{t('aksiEvent.panel.testResultsTitle')}</p>
                    <ul className="list-inside list-disc space-y-0.5 text-text-muted">
                        {testResults.map((result, index) => (
                            <li key={index}>{testResultLine(t, result)}</li>
                        ))}
                    </ul>
                </Toast>
            )}
        </div>
    );
}
