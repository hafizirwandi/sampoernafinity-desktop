import SoundSourcePicker from '../../components/SoundSourcePicker.jsx';

export function FileOrUrlPicker({ value, onChange, kind, extraButton }) {
    async function pickFile() {
        const result = await window.api.actions.pickMedia(kind);
        if (result) onChange({ source: 'file', filePath: result.filePath, fileName: result.originalName });
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <button type="button" onClick={pickFile} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-alt">
                    Pilih berkas
                </button>
                {extraButton}
                {value.source === 'file' && value.fileName && <span className="truncate text-xs text-text-muted">{value.fileName}</span>}
            </div>
            <p className="text-xs text-text-muted">atau URL</p>
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

export function VolumeSlider({ value, onChange, label = 'Volume' }) {
    return (
        <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-text-muted">
                {label}: {value}%
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
    return (
        <div>
            <textarea
                value={value.message || ''}
                onChange={(event) => onChange({ message: event.target.value })}
                rows={3}
                placeholder="misalnya Terima kasih {nickname} sudah mengirim {gift}!"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">Variabel: {'{nickname} {gift} {count} {coins} {comment}'}</p>
            <VolumeSlider value={value.volume ?? 80} onChange={(volume) => onChange({ volume })} />
        </div>
    );
}

function ShowMediaFields({ value, onChange }) {
    return (
        <div>
            <FileOrUrlPicker value={value} onChange={onChange} kind="media" />
            <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-text-muted">Jenis</label>
                <select
                    value={value.mediaType || 'image'}
                    onChange={(event) => onChange({ mediaType: event.target.value })}
                    className="rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                >
                    <option value="image">Gambar</option>
                    <option value="gif">GIF</option>
                    <option value="video">Video</option>
                </select>
            </div>
            {value.mediaType === 'video' && <VolumeSlider value={value.volume ?? 80} onChange={(volume) => onChange({ volume })} label="Volume video" />}
        </div>
    );
}

function ShowAlertFields({ value, onChange }) {
    return (
        <div>
            <textarea
                value={value.text || ''}
                onChange={(event) => onChange({ text: event.target.value })}
                rows={2}
                placeholder="misalnya {nickname} mengirim {gift} x{count}!"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">Variabel: {'{user} {nickname} {gift} {count} {coins} {comment}'}</p>
        </div>
    );
}

function WebhookFields({ value, onChange }) {
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
            <p className="text-xs text-text-muted">
                Variabel: {'{user} {gift} {count} {coins}'} — cocok untuk Win Counter, IFTTT, atau server sendiri.
            </p>
        </div>
    );
}

function KeystrokeFields({ value, onChange }) {
    return (
        <div className="space-y-2">
            <input
                type="text"
                value={value.keys || ''}
                onChange={(event) => onChange({ keys: event.target.value })}
                placeholder="misalnya {NUMPAD3}"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="text-xs text-text-muted">
                Format SendKeys Windows, misalnya {'{NUMPAD3}'} atau {'^c'} untuk Ctrl+C. Hanya berlaku di Windows.
            </p>
            <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Tahan kunci (ms)</label>
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
    const lines = value.lines?.length ? value.lines : [''];

    return (
        <div>
            <textarea
                value={lines.join('\n')}
                onChange={(event) => onChange({ lines: event.target.value.split('\n') })}
                rows={3}
                placeholder={'say Halo {nickname}!\ngive {playername} diamond 1'}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-text-muted">
                Satu baris = satu perintah, dikirim ke Minecraft ServerTap. Variabel:{' '}
                {'{playername} {username} {nickname} {giftname} {coins} {repeatcount} {likecount}'}
            </p>
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
