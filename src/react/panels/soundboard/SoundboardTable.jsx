import { PlayIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import RowIconButton from '../../components/RowIconButton.jsx';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import { TRIGGER_LABELS } from '../aksiEvent/constants.js';

function soundLabel(sound) {
    return sound.sound?.fileName || (sound.sound?.source === 'url' ? sound.sound?.url : sound.sound?.filePath) || '-';
}

export default function SoundboardTable({ sounds, onEdit, onTest, onToggle, onRemove }) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                        <th className="py-2 px-4 font-medium">Aktif</th>
                        <th className="py-2 px-4 font-medium">Pemicu</th>
                        <th className="py-2 px-4 font-medium">Suara</th>
                        <th className="py-2 px-4 font-medium">Tombol Pintas</th>
                        <th className="py-2 px-4 font-medium">Volume</th>
                        <th className="py-2 px-4 font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {!sounds.length ? (
                        <tr>
                            <td colSpan={6} className="py-6 text-center text-text-muted">
                                Belum ada notifikasi suara. Klik &quot;Buat Notifikasi Suara&quot; untuk membuatnya.
                            </td>
                        </tr>
                    ) : (
                        sounds.map((sound) => (
                            <tr key={sound.id} className="border-b border-border last:border-0">
                                <td className="py-2 px-4">
                                    <ToggleSwitch checked={sound.enabled} onChange={() => onToggle(sound.id)} title={sound.enabled ? 'Aktif' : 'Non-aktif'} />
                                </td>
                                <td className="py-2 px-4">{sound.name || TRIGGER_LABELS[sound.trigger?.type] || sound.trigger?.type}</td>
                                <td className="py-2 px-4">
                                    <span className="truncate text-xs text-text-muted" title={soundLabel(sound)}>
                                        {soundLabel(sound)}
                                    </span>
                                </td>
                                <td className="py-2 px-4">
                                    {sound.keystroke ? (
                                        <span className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium">{sound.keystroke}</span>
                                    ) : (
                                        <span className="text-xs text-text-muted">-</span>
                                    )}
                                </td>
                                <td className="py-2 px-4 text-xs text-text-muted">{sound.volume ?? 80}%</td>
                                <td className="py-2 px-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <RowIconButton onClick={() => onTest(sound.id)} title="Tes">
                                            <PlayIcon className="h-4 w-4" />
                                        </RowIconButton>
                                        <RowIconButton onClick={() => onEdit(sound)} title="Ubah">
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </RowIconButton>
                                        <RowIconButton onClick={() => onRemove(sound.id)} title="Hapus" tone="danger">
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
