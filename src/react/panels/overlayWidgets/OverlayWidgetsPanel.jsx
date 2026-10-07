import { useState } from 'react';
import { ArrowLeftIcon, TrophyIcon, HeartIcon, GiftIcon, ChatBubbleLeftRightIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

const OVERLAY_WIDGET_DEFS = [
    { key: 'target-menang', Icon: TrophyIcon, color: 'text-yellow-400' },
    { key: 'target-like', Icon: HeartIcon, color: 'text-pink-400' },
    { key: 'top-pemberi-like', Icon: HeartIcon, color: 'text-pink-400' },
    { key: 'top-pengirim-gift', Icon: GiftIcon, color: 'text-pink-400' },
    { key: 'overlay-chat', Icon: ChatBubbleLeftRightIcon, color: 'text-purple-400' },
    { key: 'join-live', Icon: SparklesIcon, color: 'text-indigo-400' },
    { key: 'timer-subathon', Icon: ClockIcon, color: 'text-blue-400' },
    { key: 'animasi-gift-live', Icon: GiftIcon, color: 'text-pink-400' },
];

export default function OverlayWidgetsPanel() {
    const { t } = useLanguage();
    const OVERLAY_WIDGETS = OVERLAY_WIDGET_DEFS.map((widget) => ({ ...widget, label: t(`overlayWidgets.widget.${widget.key}`) }));
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
                    {t('common.back')}
                </button>

                <div className="rounded-2xl border border-border bg-surface p-10 text-center">
                    <selected.Icon className={`mx-auto h-10 w-10 ${selected.color}`} />
                    <p className="mt-3 font-semibold">{selected.label}</p>
                    <p className="mt-1 text-sm text-text-muted">{t('overlayWidgets.comingSoonDesc')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold">{t('overlayWidgets.title')}</h2>
                <p className="mt-1 text-sm text-text-muted">{t('overlayWidgets.description')}</p>
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
