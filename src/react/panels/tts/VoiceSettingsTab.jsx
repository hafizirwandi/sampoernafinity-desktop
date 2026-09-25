import { useEffect, useState } from 'react';
import { PlayIcon, StarIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import Toast from '../../components/Toast.jsx';
import { useSpeechVoices } from '../../hooks/useSpeechVoices.js';

const GOOGLE_LANG_OPTIONS = [
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'en', label: 'English' },
    { value: 'ms', label: 'Bahasa Melayu' },
    { value: 'ja', label: '日本語 (Japanese)' },
    { value: 'ko', label: '한국어 (Korean)' },
];

function speakSystem(text, { voiceURI, randomVoice, speed, pitch, volume }, voices) {
    if (!text || !('speechSynthesis' in window)) return;

    const voice = randomVoice && voices.length ? voices[Math.floor(Math.random() * voices.length)] : voices.find((v) => v.voiceURI === voiceURI);

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = Math.min(2, Math.max(0.1, (Number(speed) || 50) / 50));
    utterance.pitch = Math.min(2, Math.max(0, (Number(pitch) || 50) / 50));
    utterance.volume = Math.min(1, Math.max(0, (Number(volume) || 100) / 100));

    window.speechSynthesis.speak(utterance);
}

// The raw translate_tts URL can't be loaded directly from the renderer —
// Google 404s requests carrying a foreign Referer, which a renderer
// <audio src> always sends. The main process fetches it (no such header
// there) and hands back local file URLs instead.
async function speakGoogle(text, lang, volume) {
    if (!text) return;

    const urls = await window.api.tts.testGoogle({ text, lang });
    let index = 0;

    function playNext() {
        if (index >= urls.length) return;

        const audio = new Audio(urls[index]);
        audio.volume = Math.min(1, Math.max(0, (Number(volume) || 100) / 100));
        index += 1;

        audio.addEventListener('ended', playNext);
        audio.addEventListener('error', playNext);
        audio.play().catch(playNext);
    }

    playNext();
}

export default function VoiceSettingsTab() {
    const voices = useSpeechVoices();
    const [settings, setSettings] = useState(null);
    const [savingVoice, setSavingVoice] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [testerText, setTesterText] = useState('Halo semua');
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => {
        window.api.tts.getSettings().then(setSettings);
    }, []);

    if (!settings) return null;

    function patch(fields) {
        setSettings((prev) => ({ ...prev, ...fields }));
    }

    async function saveVoiceSettings() {
        setSavingVoice(true);
        try {
            const next = await window.api.tts.updateSettings({
                enabled: settings.enabled,
                voiceSource: settings.voiceSource,
                voiceURI: settings.voiceURI,
                randomVoice: settings.randomVoice,
                speed: Number(settings.speed) || 50,
                pitch: Number(settings.pitch) || 50,
                volume: Number(settings.volume) || 100,
                googleLang: settings.googleLang,
            });
            setSettings((prev) => ({ ...prev, ...next }));
            setToastMessage('Pengaturan suara tersimpan');
        } finally {
            setSavingVoice(false);
        }
    }

    async function saveTemplate() {
        setSavingTemplate(true);
        try {
            const next = await window.api.tts.updateSettings({ template: settings.template });
            setSettings((prev) => ({ ...prev, ...next }));
            setToastMessage('Template tersimpan');
        } finally {
            setSavingTemplate(false);
        }
    }

    async function playTester() {
        if (settings.voiceSource === 'google') {
            try {
                await speakGoogle(testerText, settings.googleLang, settings.volume);
            } catch (error) {
                console.error('Google TTS tester error:', error);
                setToastMessage('Gagal memutar suara Google TTS');
            }
        } else {
            speakSystem(testerText, settings, voices);
        }
    }

    const isGoogle = settings.voiceSource === 'google';

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <h3 className="text-sm font-semibold">Pengaturan</h3>

                <label className="mt-3 flex items-center gap-2 text-sm">
                    <ToggleSwitch checked={settings.enabled} onChange={() => patch({ enabled: !settings.enabled })} />
                    Enabled
                </label>

                <div className="mt-4">
                    <label className="mb-1.5 block text-sm font-medium">Sumber Suara</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => patch({ voiceSource: 'google' })}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${
                                isGoogle ? 'border-primary-600 bg-primary-600 text-white' : 'border-border text-text-muted hover:bg-surface-alt'
                            }`}
                        >
                            <StarIcon className="h-4 w-4" />
                            Google (online · gratis)
                        </button>
                        <button
                            type="button"
                            onClick={() => patch({ voiceSource: 'system' })}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium ${
                                !isGoogle ? 'border-primary-600 bg-primary-600 text-white' : 'border-border text-text-muted hover:bg-surface-alt'
                            }`}
                        >
                            <ComputerDesktopIcon className="h-4 w-4" />
                            Suara Windows (offline · tanpa upload)
                        </button>
                    </div>
                    {isGoogle && (
                        <p className="mt-1.5 text-xs text-text-muted">
                            Tidak resmi (endpoint publik Google Translate) — butuh internet, maksimal ±200 karakter per potongan
                            (komentar panjang otomatis dipecah), dan tidak mendukung pengaturan speed/pitch.
                        </p>
                    )}
                </div>

                {isGoogle ? (
                    <div className="mt-4">
                        <label className="mb-1.5 block text-sm font-medium">Bahasa</label>
                        <select
                            value={settings.googleLang}
                            onChange={(event) => patch({ googleLang: event.target.value })}
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                        >
                            {GOOGLE_LANG_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <>
                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-medium">Suara</label>
                            <select
                                value={settings.voiceURI}
                                onChange={(event) => patch({ voiceURI: event.target.value })}
                                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                            >
                                <option value="">Default</option>
                                {voices.map((voice) => (
                                    <option key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))}
                            </select>
                            {!voices.length && <p className="mt-1 text-xs text-text-muted">Tidak ada suara terdeteksi dari sistem.</p>}
                        </div>

                        <label className="mt-4 flex items-center gap-2 text-sm">
                            <ToggleSwitch checked={settings.randomVoice} onChange={() => patch({ randomVoice: !settings.randomVoice })} />
                            Random Voice
                        </label>

                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-medium">Speed (default: 50)</label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={settings.speed}
                                onChange={(event) => patch({ speed: event.target.value })}
                                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="mb-1.5 block text-sm font-medium">Pitch (default: 50)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={settings.pitch}
                                onChange={(event) => patch({ pitch: event.target.value })}
                                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                            />
                        </div>
                    </>
                )}

                <div className="mt-4">
                    <label className="mb-1.5 block text-sm font-medium">Volume (default: 100): {settings.volume}%</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.volume}
                        onChange={(event) => patch({ volume: Number(event.target.value) })}
                        className="w-full"
                    />
                </div>

                <button
                    type="button"
                    onClick={saveVoiceSettings}
                    disabled={savingVoice}
                    className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                >
                    {savingVoice ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>

            <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-semibold">Tester</h3>
                    <div className="mt-3 flex items-center gap-2">
                        <input
                            type="text"
                            value={testerText}
                            onChange={(event) => setTesterText(event.target.value)}
                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                        />
                        <button
                            type="button"
                            onClick={playTester}
                            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-alt"
                        >
                            <PlayIcon className="h-4 w-4" />
                            Play
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5">
                    <h3 className="text-sm font-semibold">Template</h3>
                    <input
                        type="text"
                        value={settings.template}
                        onChange={(event) => patch({ template: event.target.value })}
                        className="mt-3 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                    />
                    <p className="mt-1.5 text-xs text-text-muted">Placeholder: {'{username} {nickname} {comment}'}</p>
                    <button
                        type="button"
                        onClick={saveTemplate}
                        disabled={savingTemplate}
                        className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                        {savingTemplate ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </div>

            {toastMessage && <Toast onDismiss={() => setToastMessage(null)}>{toastMessage}</Toast>}
        </div>
    );
}
