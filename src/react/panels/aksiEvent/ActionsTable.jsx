export const BEHAVIOR_LABELS = {
    play_audio: 'Audio',
    tts: 'TTS',
    show_media: 'Gambar/GIF/Video',
    show_alert: 'Peringatan',
    webhook: 'Webhook',
    keystroke: 'Keystroke',
    minecraft_command: 'Perintah Minecraft',
};

export default function ActionsTable({ actions, screens, onEdit, onTest, onDuplicate, onRemove }) {
    function screenName(screenId) {
        const screen = screens.find((s) => s.id === screenId);
        return screen ? screen.name : '-';
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                        <th className="py-2 px-4 font-medium">Nama</th>
                        <th className="py-2 px-4 font-medium">Layar</th>
                        <th className="py-2 px-4 font-medium">Durasi</th>
                        <th className="py-2 px-4 font-medium">Fitur</th>
                        <th className="py-2 px-4 font-medium"></th>
                    </tr>
                </thead>
                <tbody>
                    {!actions.length ? (
                        <tr>
                            <td colSpan={5} className="py-6 text-center text-text-muted">
                                Belum ada Aksi. Klik &quot;Buat Aksi baru&quot; untuk membuatnya.
                            </td>
                        </tr>
                    ) : (
                        actions.map((action) => (
                            <tr key={action.id} className="border-b border-border last:border-0">
                                <td className="py-2 px-4 font-medium">{action.name || '(tanpa nama)'}</td>
                                <td className="py-2 px-4">{screenName(action.screenId)}</td>
                                <td className="py-2 px-4">{action.durationSeconds}s</td>
                                <td className="py-2 px-4">{action.behaviors.map((b) => BEHAVIOR_LABELS[b.type] || b.type).join(', ') || '-'}</td>
                                <td className="py-2 px-4 text-right">
                                    <button type="button" onClick={() => onTest(action.id)} className="text-xs text-text-muted hover:text-text">
                                        Tes
                                    </button>
                                    <button type="button" onClick={() => onEdit(action)} className="ml-3 text-xs text-text-muted hover:text-text">
                                        Ubah
                                    </button>
                                    <button type="button" onClick={() => onDuplicate(action.id)} className="ml-3 text-xs text-text-muted hover:text-text">
                                        Duplikat
                                    </button>
                                    <button type="button" onClick={() => onRemove(action.id)} className="ml-3 text-xs text-primary-600 hover:text-primary-700">
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
