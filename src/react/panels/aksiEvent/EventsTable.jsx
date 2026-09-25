import { PencilSquareIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';
import RowIconButton from '../../components/RowIconButton.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import { AUDIENCE_LABELS, TRIGGER_LABELS } from './constants.js';

export default function EventsTable({ events, actions, onEdit, onToggle, onDuplicate, onRemove }) {
    function actionNames(event) {
        const ids = [...(event.actionIds || []), ...(event.randomActionIds || [])];
        const names = ids.map((id) => actions.find((a) => a.id === id)?.name).filter(Boolean);
        return names.length ? names.join(', ') : '-';
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                        <th className="py-2 px-4 font-medium">Status</th>
                        <th className="py-2 px-4 font-medium">Pengguna</th>
                        <th className="py-2 px-4 font-medium">Pemicu</th>
                        <th className="py-2 px-4 font-medium">Aksi</th>
                        <th className="py-2 px-4 font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {!events.length ? (
                        <tr>
                            <td colSpan={5} className="py-6 text-center text-text-muted">
                                Belum ada Event. Klik &quot;Buat Event baru&quot; untuk membuatnya.
                            </td>
                        </tr>
                    ) : (
                        events.map((event) => (
                            <tr key={event.id} className="border-b border-border last:border-0">
                                <td className="py-2 px-4">
                                    <ToggleSwitch
                                        checked={event.enabled}
                                        onChange={() => onToggle(event.id)}
                                        title={event.enabled ? 'Aktif' : 'Non-aktif'}
                                    />
                                </td>
                                <td className="py-2 px-4">{AUDIENCE_LABELS[event.audience?.type] || event.audience?.type}</td>
                                <td className="py-2 px-4">{event.name || TRIGGER_LABELS[event.trigger?.type] || event.trigger?.type}</td>
                                <td className="py-2 px-4">{actionNames(event)}</td>
                                <td className="py-2 px-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <RowIconButton onClick={() => onEdit(event)} title="Ubah">
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </RowIconButton>
                                        <RowIconButton onClick={() => onDuplicate(event.id)} title="Duplikat">
                                            <DocumentDuplicateIcon className="h-4 w-4" />
                                        </RowIconButton>
                                        <RowIconButton onClick={() => onRemove(event.id)} title="Hapus" tone="danger">
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
