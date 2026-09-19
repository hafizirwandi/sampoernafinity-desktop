import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import BehaviorFields from './BehaviorFields.jsx';
import ActionAdvancedSettings from './ActionAdvancedSettings.jsx';

const BEHAVIOR_TYPES = [
    { type: 'play_audio', label: 'Putar Audio' },
    { type: 'tts', label: 'Baca Teks (TTS)' },
    { type: 'show_media', label: 'Tampilkan gambar / GIF / video (di OBS Overlay)' },
    { type: 'show_alert', label: 'Tampilkan Peringatan (Pengguna + Teks di Overlay)' },
    { type: 'webhook', label: 'Memicu WebHook' },
    { type: 'keystroke', label: 'Simulasikan Penekanan Tombol' },
    { type: 'minecraft_command', label: 'Jalankan Perintah Minecraft' },
];

function defaultBehaviorConfig(type) {
    switch (type) {
        case 'play_audio':
            return { type, source: 'file', filePath: '', url: '', volume: 80 };
        case 'tts':
            return { type, message: '', volume: 80 };
        case 'show_media':
            return { type, mediaType: 'image', source: 'file', filePath: '', url: '', volume: 80 };
        case 'show_alert':
            return { type, text: '' };
        case 'webhook':
            return { type, method: 'GET', url: '' };
        case 'keystroke':
            return { type, keys: '', holdMs: 0 };
        case 'minecraft_command':
            return { type, lines: [''] };
        default:
            return { type };
    }
}

const DEFAULT_FORM = {
    name: '',
    behaviors: [],
    screenId: '',
    durationSeconds: 8,
    cooldownGlobalSeconds: 0,
    cooldownPerViewerSeconds: 0,
    fadeInOut: false,
    skipNextAction: false,
    repeatWithCombo: false,
    comboMax: 1000,
};

export default function ActionModal({ action, screens, onClose, onSaved }) {
    const isEdit = Boolean(action);
    const [form, setForm] = useState(() => ({
        ...DEFAULT_FORM,
        ...action,
        screenId: action?.screenId || screens[0]?.id || '',
    }));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    function patch(fields) {
        setForm((prev) => ({ ...prev, ...fields }));
    }

    function isChecked(type) {
        return form.behaviors.some((b) => b.type === type);
    }

    function toggleBehavior(type) {
        patch({
            behaviors: isChecked(type) ? form.behaviors.filter((b) => b.type !== type) : [...form.behaviors, defaultBehaviorConfig(type)],
        });
    }

    function updateBehavior(type, fields) {
        patch({ behaviors: form.behaviors.map((b) => (b.type === type ? { ...b, ...fields } : b)) });
    }

    async function handleSave() {
        setError('');

        if (!form.name.trim()) {
            setError('Nama aksi wajib diisi.');
            return;
        }

        if (!form.behaviors.length) {
            setError('Pilih minimal satu perilaku untuk aksi ini.');
            return;
        }

        setSaving(true);

        const payload = {
            ...form,
            name: form.name.trim(),
            screenId: form.screenId || null,
            durationSeconds: Number(form.durationSeconds) || 8,
            cooldownGlobalSeconds: Number(form.cooldownGlobalSeconds) || 0,
            cooldownPerViewerSeconds: Number(form.cooldownPerViewerSeconds) || 0,
            comboMax: Number(form.comboMax) || 1000,
        };

        try {
            const saved = isEdit ? await window.api.actions.update(action.id, payload) : await window.api.actions.create(payload);
            onSaved(saved);
        } catch (err) {
            setError(err?.message || 'Gagal menyimpan aksi.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            title={isEdit ? 'Ubah Aksi' : 'Aksi Baru'}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-alt">
                        Membatalkan
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                        {saving ? 'Menyimpan...' : 'Simpan Aksi'}
                    </button>
                </>
            }
        >
            <div>
                <label className="mb-1.5 block text-sm font-medium">Nama aksi</label>
                <input
                    type="text"
                    value={form.name}
                    onChange={(event) => patch({ name: event.target.value })}
                    placeholder="misalnya Melon air"
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                />
            </div>

            <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <span className="inline-block h-4 w-1 rounded bg-primary-600"></span>
                    Apa yang harus terjadi? (Anda dapat memilih beberapa)
                </p>

                <div className="space-y-2">
                    {BEHAVIOR_TYPES.map((bt) => {
                        const checked = isChecked(bt.type);
                        const behavior = form.behaviors.find((b) => b.type === bt.type);

                        return (
                            <div key={bt.type} className={`rounded-xl border p-3 ${checked ? 'border-primary-600' : 'border-border'}`}>
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleBehavior(bt.type)}
                                        className="rounded border-border text-primary-600 focus:ring-primary-600"
                                    />
                                    <span>{bt.label}</span>
                                </label>

                                {checked && behavior && (
                                    <div className="mt-3 pl-6">
                                        <BehaviorFields type={bt.type} value={behavior} onChange={(fields) => updateBehavior(bt.type, fields)} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <ActionAdvancedSettings form={form} onChange={patch} screens={screens} />

            {error && <p className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700">{error}</p>}
        </Modal>
    );
}
