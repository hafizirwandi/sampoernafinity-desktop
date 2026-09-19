import { useEffect, useState } from 'react';

export default function OverlaySettings() {
    const [settings, setSettings] = useState(null);
    const [newScreenName, setNewScreenName] = useState('');
    const [statusByScreen, setStatusByScreen] = useState({});

    useEffect(() => {
        window.api.overlay.getSettings().then(setSettings);
    }, []);

    useEffect(() => {
        const unsubscribe = window.api.overlay.onScreenStatus(({ screenId, connected }) => {
            setStatusByScreen((prev) => ({ ...prev, [screenId]: connected }));
        });

        return unsubscribe;
    }, []);

    if (!settings) return null;

    async function refresh() {
        setSettings(await window.api.overlay.getSettings());
    }

    async function toggleAudio() {
        const next = await window.api.overlay.updateSettings({ playAudioThroughOverlay: !settings.playAudioThroughOverlay });
        setSettings(next);
    }

    async function toggleFifo() {
        const next = await window.api.overlay.updateSettings({ liveAudioQueueFifo: !settings.liveAudioQueueFifo });
        setSettings(next);
    }

    async function addScreen() {
        await window.api.overlay.addScreen(newScreenName.trim() || undefined);
        setNewScreenName('');
        await refresh();
    }

    async function removeScreen(id) {
        try {
            await window.api.overlay.removeScreen(id);
            await refresh();
        } catch (error) {
            console.error(error);
        }
    }

    function screenUrl(screen) {
        if (!settings.port) return null;
        return `http://127.0.0.1:${settings.port}/overlay.html?screen=${screen.id}&token=${settings.token}`;
    }

    async function copyUrl(screen) {
        const url = screenUrl(screen);
        if (url) await navigator.clipboard.writeText(url);
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-sm text-text-muted">
                    Untuk menampilkan aksi di OBS atau Live Studio, Anda memerlukan setidaknya satu layar overlay (widget). Anda dapat
                    memetakan Aksi (gambar, peringatan, video...) ke Layar Overlay yang berbeda — masing-masing memiliki antreannya
                    sendiri. Salin URL di bawah ini ke OBS (Sumber Browser).
                </p>

                {!settings.port && (
                    <p className="mt-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700">
                        Server overlay lokal belum aktif — coba tutup dan buka ulang aplikasi. Jika masih muncul, cek apakah aplikasi
                        lain sedang memakai port yang sama.
                    </p>
                )}

                <label className="mt-4 flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={settings.playAudioThroughOverlay}
                        onChange={toggleAudio}
                        className="rounded border-border text-primary-600 focus:ring-primary-600"
                    />
                    Memutar audio melalui Overlay (suara live masuk ke OBS, tidak perlu pengambilan Audio Desktop)
                </label>
                <p className="ml-6 text-xs text-text-muted">
                    Layar tanpa Overlay yang terpasang akan kembali diputar di aplikasi sehingga Anda tidak akan kehilangan suara.
                </p>

                <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={settings.liveAudioQueueFifo}
                        onChange={toggleFifo}
                        className="rounded border-border text-primary-600 focus:ring-primary-600"
                    />
                    Antrian audio LIVE aktif (FIFO)
                </label>
                <p className="ml-6 text-xs text-text-muted">
                    Audio hadiah diputar satu per satu hingga selesai. Tes/Pemutaran Manual masih bisa dimainkan bersama.
                </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                            <th className="py-2 px-4 font-medium">Nama Layar</th>
                            <th className="py-2 px-4 font-medium">URL Layar (widget untuk OBS / Live Studio)</th>
                            <th className="py-2 px-4 font-medium">Maks. panjang antrian</th>
                            <th className="py-2 px-4 font-medium">Status</th>
                            <th className="py-2 px-4 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {settings.screens.map((screen) => (
                            <tr key={screen.id} className="border-b border-border last:border-0">
                                <td className="py-2 px-4">{screen.name}</td>
                                <td className="py-2 px-4">
                                    {screenUrl(screen) ? (
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-xs text-text-muted">{screenUrl(screen)}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyUrl(screen)}
                                                className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs hover:bg-surface-alt"
                                            >
                                                Copy link
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-text-muted">-</span>
                                    )}
                                </td>
                                <td className="py-2 px-4">{screen.maxQueueLength}</td>
                                <td className={`py-2 px-4 text-xs font-medium ${statusByScreen[screen.id] ? 'text-green-600' : 'text-text-muted'}`}>
                                    {statusByScreen[screen.id] ? 'Siap' : 'Tidak aktif'}
                                </td>
                                <td className="py-2 px-4 text-right">
                                    {settings.screens.length > 1 && (
                                        <button type="button" onClick={() => removeScreen(screen.id)} className="text-xs text-primary-600 hover:text-primary-700">
                                            Hapus
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex items-center gap-2 border-t border-border p-3">
                    <input
                        type="text"
                        value={newScreenName}
                        onChange={(event) => setNewScreenName(event.target.value)}
                        placeholder="Nama layar baru (opsional)"
                        className="w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                    />
                    <button type="button" onClick={addScreen} className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-alt">
                        + Tambah Layar
                    </button>
                </div>
            </div>
        </div>
    );
}
