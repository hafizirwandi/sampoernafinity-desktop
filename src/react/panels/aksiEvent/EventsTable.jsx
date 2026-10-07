import { PencilSquareIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';
import RowIconButton from '../../components/RowIconButton.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import { audienceLabel, triggerLabel } from './constants.js';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function EventsTable({ events, actions, onEdit, onToggle, onDuplicate, onRemove }) {
    const { t } = useLanguage();

    function actionNames(event) {
        const ids = [...(event.actionIds || []), ...(event.randomActionIds || [])];
        const names = ids.map((id) => actions.find((a) => a.id === id)?.name).filter(Boolean);
        return names.length ? names.join(', ') : t('common.dash');
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                        <th className="py-2 px-4 font-medium">{t('aksiEvent.eventsTable.status')}</th>
                        <th className="py-2 px-4 font-medium">{t('aksiEvent.eventsTable.audience')}</th>
                        <th className="py-2 px-4 font-medium">{t('aksiEvent.eventsTable.trigger')}</th>
                        <th className="py-2 px-4 font-medium">{t('aksiEvent.eventsTable.actions')}</th>
                        <th className="py-2 px-4 font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {!events.length ? (
                        <tr>
                            <td colSpan={5} className="py-6 text-center text-text-muted">
                                {t('aksiEvent.eventsTable.empty')}
                            </td>
                        </tr>
                    ) : (
                        events.map((event) => (
                            <tr key={event.id} className="border-b border-border last:border-0">
                                <td className="py-2 px-4">
                                    <ToggleSwitch
                                        checked={event.enabled}
                                        onChange={() => onToggle(event.id)}
                                        title={event.enabled ? t('common.active') : t('common.inactive')}
                                    />
                                </td>
                                <td className="py-2 px-4">{audienceLabel(t, event.audience?.type)}</td>
                                <td className="py-2 px-4">{event.name || triggerLabel(t, event.trigger?.type)}</td>
                                <td className="py-2 px-4">{actionNames(event)}</td>
                                <td className="py-2 px-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <RowIconButton onClick={() => onEdit(event)} title={t('common.edit')}>
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </RowIconButton>
                                        <RowIconButton onClick={() => onDuplicate(event.id)} title={t('common.duplicate')}>
                                            <DocumentDuplicateIcon className="h-4 w-4" />
                                        </RowIconButton>
                                        <RowIconButton onClick={() => onRemove(event.id)} title={t('common.delete')} tone="danger">
                                            <TrashIcon className="h-4 w-4" />
                                        </RowIconButton>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
