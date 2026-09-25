import { useState } from 'react';
import { ArrowLeftIcon, TrophyIcon, HeartIcon, GiftIcon, ChatBubbleLeftRightIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';

const OVERLAY_WIDGETS = [
    { key: 'target-menang', label: 'Target Menang', Icon: TrophyIcon, color: 'text-yellow-400' },
    { key: 'target-like', label: 'Target Like', Icon: HeartIcon, color: 'text-pink-400' },
    { key: 'top-pemberi-like', label: 'Top Pemberi Like', Icon: HeartIcon, color: 'text-pink-400' },
    { key: 'top-pengirim-gift', label: 'Top Pengirim Gift', Icon: GiftIcon, color: 'text-pink-400' },
    { key: 'overlay-chat', label: 'Overlay Chat', Icon: ChatBubbleLeftRightIcon, color: 'text-purple-400' },
    { key: 'join-live', label: 'Join LIVE', Icon: SparklesIcon, color: 'text-indigo-400' },
    { key: 'timer-subathon', label: 'Timer / Subathon', Icon: ClockIcon, color: 'text-blue-400' },
    { key: 'animasi-gift-live', label: 'Animasi Gift LIVE', Icon: GiftIcon, color: 'text-pink-400' },
];

export default function OverlayWidgetsPanel() {
    const [selectedKey, setSelectedKey] = useState(null);
    const selected = OVERLAY_WIDGETS.find((w) => w.key === selectedKey);

    if (selected) {
        return (
            <div className="space-y-4">
                <button
                    type="button"
                    onClick={() => setSelectedKey(null)}
                    className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Kembali
                </button>

                <div className="rounded-2xl border border-border bg-surface p-10 text-center">
                    <selected.Icon className={`mx-auto h-10 w-10 ${selected.color}`} />
                    <p className="mt-3 font-semibold">{selected.label}</p>
                    <p className="mt-1 text-sm text-text-muted">Segera hadir. Widget ini sedang disiapkan.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold">Overlay</h2>
                <p className="mt-1 text-sm text-text-muted">Pilih widget overlay yang ingin ditampilkan di OBS / Live Studio.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {OVERLAY_WIDGETS.map((widget) => (
                    <button
                        key={widget.key}
                        type="button"
                        onClick={() => setSelectedKey(widget.key)}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-5 text-center hover:bg-surface-alt"
                    >
                        <widget.Icon className={`h-8 w-8 ${widget.color}`} />
                        <span className="text-sm font-medium">{widget.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
