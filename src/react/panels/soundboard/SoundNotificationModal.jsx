import { useEffect, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import SearchMultiSelect from '../../components/SearchMultiSelect.jsx';
import SoundSourcePicker from '../../components/SoundSourcePicker.jsx';
import KeystrokeCapture from '../../components/KeystrokeCapture.jsx';
import { VolumeSlider } from '../aksiEvent/BehaviorFields.jsx';
import { AUDIENCE_TYPES, TRIGGER_TYPES, TRIGGER_LABELS } from '../aksiEvent/constants.js';

function defaultTriggerConfig(type) {
    switch (type) {
        case 'like':
            return { type, minLikes: 1 };
        case 'chat_keyword':
            return { type, keyword: '' };
        case 'gift_min_coin':
            return { type, minCoins: 100 };
        case 'gift_specific':
            return { type, giftIds: [] };
        default:
            return { type };
    }
}

const DEFAULT_FORM = {
    name: '',
    enabled: true,
    audience: { type: 'any', usernames: [] },
    trigger: { type: 'chat' },
    sound: { source: 'file', filePath: '', url: '', fileName: '' },
    volume: 80,
    keystroke: '',
};

export default function SoundNotificationModal({ sound, onClose, onSaved }) {
    const isEdit = Boolean(sound);
    const [form, setForm] = useState(() => ({ ...DEFAULT_FORM, ...sound }));
    const [gifts, setGifts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        window.api.gifts.list().then((catalog) => setGifts(catalog.gifts || []));
    }, []);

    function patch(fields) {
        setForm((prev) => ({ ...prev, ...fields }));
    }

    function setAudienceType(type) {
        patch({ audience: { type, usernames: [] } });
    }

    function setTriggerType(type) {
        patch({ trigger: defaultTriggerConfig(type) });
    }

    async function handleSave() {
        setError('');

        const hasSound = form.sound.source === 'url' ? Boolean(form.sound.url) : Boolean(form.sound.filePath);
        if (!hasSound) {
            setError('Pilih berkas suara atau ambil dari Sound Library.');
            return;
        }

        if (form.audience.type === 'specific' && !(form.audience.usernames || []).length) {
            setError('Isi minimal satu username penampil.');
            return;
        }

        setSaving(true);

        const payload = {
            ...form,
            name: form.name.trim() || TRIGGER_LABELS[form.trigger.type] || '',
            volume: Number(form.volume) || 0,
        };

        try {
            const saved = isEdit ? await window.api.soundboard.update(sound.id, payload) : await window.api.soundboard.create(payload);
            onSaved(saved);
        } catch (err) {
            setError(err?.message || 'Gagal menyimpan suara.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            title={isEdit ? 'Ubah Notifikasi Suara' : 'Notifikasi Suara Baru'}
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
                        {saving ? 'Menyimpan...' : 'Simpan Suara'}
                    </button>
                </>
            }
        >
            <div>
                <label className="mb-1.5 block text-sm font-medium">Nama (opsional)</label>
                <input
                    type="text"
                    value={form.name}
                    onChange={(evt) => patch({ name: evt.target.value })}
                    placeholder="Biarkan kosong — diberi nama otomatis berdasarkan pemicu"
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                />
            </div>

            <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <span className="inline-block h-4 w-1 rounded bg-primary-600"></span>
                    Siapa yang dapat memicu suara ini?
                </p>
                <div className="space-y-1.5">
                    {AUDIENCE_TYPES.map((a) => (
                        <label key={a.type} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                            <input
                                type="radio"
                                name="audience"
                                checked={form.audience.type === a.type}
                                onChange={() => setAudienceType(a.type)}
                                className="text-primary-600 focus:ring-primary-600"
                            />
                            {a.label}
                        </label>
                    ))}
                </div>

                {form.audience.type === 'specific' && (
                    <input
                        type="text"
                        value={(form.audience.usernames || []).join(', ')}
                        onChange={(evt) =>
                            patch({
                                audience: {
                                    ...form.audience,
                                    usernames: evt.target.value
                                        .split(',')
                                        .map((u) => u.trim())
                                        .filter(Boolean),
                                },
                            })
                        }
                        placeholder="username1, username2"
                        className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                    />
                )}
            </div>

            <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <span className="inline-block h-4 w-1 rounded bg-primary-600"></span>
                    Apa yang memicu suara ini?
                </p>
                <div className="space-y-1.5">
                    {TRIGGER_TYPES.map((t) => {
                        const active = form.trigger.type === t.type;

                        return (
                            <div key={t.type} className={`rounded-xl border p-3 ${active ? 'border-primary-600' : 'border-border'}`}>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="radio"
                                        name="trigger"
                                        checked={active}
                                        onChange={() => setTriggerType(t.type)}
                                        className="text-primary-600 focus:ring-primary-600"
                                    />
                                    {t.label}
                                </label>

                                {active && t.type === 'like' && (
                                    <div className="mt-2 pl-6">
                                        <label className="mb-1 block text-xs font-medium text-text-muted">Minimal jumlah like</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={form.trigger.minLikes}
                                            onChange={(evt) => patch({ trigger: { ...form.trigger, minLikes: Number(evt.target.value) } })}
                                            className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                                        />
                                    </div>
                                )}

                                {active && t.type === 'chat_keyword' && (
                                    <div className="mt-2 pl-6">
                                        <label className="mb-1 block text-xs font-medium text-text-muted">Kata kunci</label>
                                        <input
                                            type="text"
                                            value={form.trigger.keyword}
                                            onChange={(evt) => patch({ trigger: { ...form.trigger, keyword: evt.target.value } })}
                                            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                                        />
                                    </div>
                                )}

                                {active && t.type === 'gift_min_coin' && (
                                    <div className="mt-2 pl-6">
                                        <label className="mb-1 block text-xs font-medium text-text-muted">Nilai minimum (koin)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={form.trigger.minCoins}
                                            onChange={(evt) => patch({ trigger: { ...form.trigger, minCoins: Number(evt.target.value) } })}
                                            className="w-32 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                                        />
                                    </div>
                                )}

                                {active && t.type === 'gift_specific' && (
                                    <div className="mt-2 pl-6">
                                        <SearchMultiSelect
                                            items={gifts}
                                            selectedIds={form.trigger.giftIds || []}
                                            onChange={(giftIds) => patch({ trigger: { ...form.trigger, giftIds } })}
                                            getId={(g) => g.tiktokId}
                                            getLabel={(g) => g.name}
                                            placeholder="Cari gift..."
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <span className="inline-block h-4 w-1 rounded bg-primary-600"></span>
                    Suara
                </p>
                <SoundSourcePicker value={form.sound} onChange={(fields) => patch({ sound: { ...form.sound, ...fields } })} />
                <VolumeSlider value={form.volume} onChange={(volume) => patch({ volume })} />
            </div>

            <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <span className="inline-block h-4 w-1 rounded bg-primary-600"></span>
                    Tombol pintas (opsional)
                </p>
                <p className="mb-2 text-xs text-text-muted">
                    Suara ini juga bisa diputar langsung dengan menekan tombol ini di mana saja — tanpa perlu pemicu di atas.
                </p>
                <KeystrokeCapture value={form.keystroke} onChange={(keystroke) => patch({ keystroke })} />
            </div>

            {error && <p className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700">{error}</p>}
        </Modal>
    );
}
