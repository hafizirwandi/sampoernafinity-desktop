import SoundSourcePicker from '../../components/SoundSourcePicker.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export function FileOrUrlPicker({ value, onChange, kind, extraButton }) {
    const { t } = useLanguage();

    async function pickFile() {
        const result = await window.api.actions.pickMedia(kind);
        if (result) onChange({ source: 'file', filePath: result.filePath, fileName: result.originalName });
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <button type="button" onClick={pickFile} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-alt">
                    {t('aksiEvent.behaviorFields.pickFile')}
                </button>
                {extraButton}
                {value.source === 'file' && value.fileName && <span className="truncate text-xs text-text-muted">{value.fileName}</span>}
            </div>
            <p className="text-xs text-text-muted">{t('aksiEvent.behaviorFields.orUrl')}</p>
            <input
                type="text"
                value={value.url || ''}
                onChange={(event) => onChange({ source: 'url', url: event.target.value })}
                placeholder="https://... (png/gif/mp4/webm)"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
        </div>
    );
}

export function VolumeSlider({ value, onChange, label }) {
    const { t } = useLanguage();
    const resolvedLabel = label ?? t('aksiEvent.behaviorFields.volume');

    return (
        <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-text-muted">
                {resolvedLabel}: {value}%
            </label>
            <input type="range" min="0" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full" />
        </div>
    );
}

function PlayAudioFields({ value, onChange }) {
    return (
        <div>
            <SoundSourcePicker value={value} onChange={onChange} />
            <VolumeSlider value={value.volume ?? 80} onChange={(volume) => onChange({ volume })} />
        </div>
    );
}

function TtsFields({ value, onChange }) {
    const { t } = useLanguage();

    return (
        <div>
            <textarea
                value={value.message || ''}
                onChange={(event) => onChange({ message: event.target.value })}
                rows={3}
                placeholder={t('aksiEvent.behaviorFields.ttsPlaceholder')}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">{t('aksiEvent.behaviorFields.ttsVariables')}</p>
            <VolumeSlider value={value.volume ?? 80} onChange={(volume) => onChange({ volume })} />
        </div>
    );
}

function ShowMediaFields({ value, onChange }) {
    const { t } = useLanguage();

    return (
        <div>
            <FileOrUrlPicker value={value} onChange={onChange} kind="media" />
            <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-text-muted">{t('aksiEvent.behaviorFields.mediaTypeLabel')}</label>
                <select
                    value={value.mediaType || 'image'}
                    onChange={(event) => onChange({ mediaType: event.target.value })}
                    className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                >
                    <option value="image">{t('aksiEvent.behaviorFields.mediaTypeImage')}</option>
                    <option value="gif">{t('aksiEvent.behaviorFields.mediaTypeGif')}</option>
                    <option value="video">{t('aksiEvent.behaviorFields.mediaTypeVideo')}</option>
                </select>
            </div>
            {value.mediaType === 'video' && (
                <VolumeSlider value={value.volume ?? 80} onChange={(volume) => onChange({ volume })} label={t('aksiEvent.behaviorFields.videoVolumeLabel')} />
            )}
        </div>
    );
}

function ShowAlertFields({ value, onChange }) {
    const { t } = useLanguage();

    return (
        <div>
            <textarea
                value={value.text || ''}
                onChange={(event) => onChange({ text: event.target.value })}
                rows={2}
                placeholder={t('aksiEvent.behaviorFields.alertPlaceholder')}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">{t('aksiEvent.behaviorFields.alertVariables')}</p>
        </div>
    );
}

function WebhookFields({ value, onChange }) {
    const { t } = useLanguage();

    return (
        <div className="space-y-2">
            <select
                value={value.method || 'GET'}
                onChange={(event) => onChange({ method: event.target.value })}
                className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
            </select>
            <input
                type="text"
                value={value.url || ''}
                onChange={(event) => onChange({ url: event.target.value })}
                placeholder="https://example.com/hook?user={user}&gift={gift}&coins={coins}"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="text-xs text-text-muted">{t('aksiEvent.behaviorFields.webhookVariables')}</p>
        </div>
    );
}

function KeystrokeFields({ value, onChange }) {
    const { t } = useLanguage();

    return (
        <div className="space-y-2">
            <input
                type="text"
                value={value.keys || ''}
                onChange={(event) => onChange({ keys: event.target.value })}
                placeholder={t('aksiEvent.behaviorFields.keystrokePlaceholder')}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="text-xs text-text-muted">{t('aksiEvent.behaviorFields.keystrokeHint')}</p>
            <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">{t('aksiEvent.behaviorFields.holdKeyLabel')}</label>
                <input
                    type="number"
                    min="0"
                    value={value.holdMs ?? 0}
                    onChange={(event) => onChange({ holdMs: Number(event.target.value) })}
                    className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                />
            </div>
        </div>
    );
}

function MinecraftFields({ value, onChange }) {
    const { t } = useLanguage();
    const lines = value.lines?.length ? value.lines : [''];

    return (
        <div>
            <textarea
                value={lines.join('\n')}
                onChange={(event) => onChange({ lines: event.target.value.split('\n') })}
                rows={3}
                placeholder={t('aksiEvent.behaviorFields.minecraftPlaceholder')}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">{t('aksiEvent.behaviorFields.minecraftHint')}</p>
        </div>
    );
}

export default function BehaviorFields({ type, value, onChange }) {
    switch (type) {
        case 'play_audio':
            return <PlayAudioFields value={value} onChange={onChange} />;
        case 'tts':
            return <TtsFields value={value} onChange={onChange} />;
        case 'show_media':
            return <ShowMediaFields value={value} onChange={onChange} />;
        case 'show_alert':
            return <ShowAlertFields value={value} onChange={onChange} />;
        case 'webhook':
            return <WebhookFields value={value} onChange={onChange} />;
        case 'keystroke':
            return <KeystrokeFields value={value} onChange={onChange} />;
        case 'minecraft_command':
            return <MinecraftFields value={value} onChange={onChange} />;
        default:
            return null;
    }
}
