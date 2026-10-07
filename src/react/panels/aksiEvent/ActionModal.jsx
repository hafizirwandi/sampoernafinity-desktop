import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import BehaviorFields from './BehaviorFields.jsx';
import ActionAdvancedSettings from './ActionAdvancedSettings.jsx';
import { BEHAVIOR_TYPE_KEYS } from './ActionsTable.jsx';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

function behaviorTypes(t) {
    return BEHAVIOR_TYPE_KEYS.map((type) => ({ type, label: t(`aksiEvent.behaviorType.${type}`) }));
}

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

// Each behavior type has its own idea of "empty" (a file/URL pair, a line
// list, plain text, ...), so it needs its own required-field check rather
// than a single generic emptiness test.
function validateBehavior(t, behavior) {
    switch (behavior.type) {
        case 'play_audio':
        case 'show_media': {
            const value = behavior.source === 'url' ? behavior.url : behavior.filePath;
            return value && value.trim() ? null : t('aksiEvent.actionModal.validationFileOrUrl');
        }
        case 'tts':
            return behavior.message && behavior.message.trim() ? null : t('aksiEvent.actionModal.validationTtsMessage');
        case 'show_alert':
            return behavior.text && behavior.text.trim() ? null : t('aksiEvent.actionModal.validationAlertText');
        case 'webhook':
            return behavior.url && behavior.url.trim() ? null : t('aksiEvent.actionModal.validationWebhookUrl');
        case 'keystroke':
            return behavior.keys && behavior.keys.trim() ? null : t('aksiEvent.actionModal.validationKeystrokeKeys');
        case 'minecraft_command':
            return (behavior.lines || []).some((line) => line.trim()) ? null : t('aksiEvent.actionModal.validationMinecraftLines');
        default:
            return null;
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
    const { t } = useLanguage();
    const BEHAVIOR_TYPES = behaviorTypes(t);
    const isEdit = Boolean(action);
    const [form, setForm] = useState(() => ({
        ...DEFAULT_FORM,
        ...action,
        screenId: action?.screenId || screens[0]?.id || '',
    }));
    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    function patch(fields) {
        setForm((prev) => ({ ...prev, ...fields }));
    }

    function clearFieldError(key) {
        setFieldErrors((prev) => {
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }

    function isChecked(type) {
        return form.behaviors.some((b) => b.type === type);
    }

    function toggleBehavior(type) {
        patch({
            behaviors: isChecked(type) ? form.behaviors.filter((b) => b.type !== type) : [...form.behaviors, defaultBehaviorConfig(type)],
        });
        clearFieldError(type);
        clearFieldError('behaviors');
    }

    function updateBehavior(type, fields) {
        patch({ behaviors: form.behaviors.map((b) => (b.type === type ? { ...b, ...fields } : b)) });
        clearFieldError(type);
    }

    function validate() {
        const nextErrors = {};

        if (!form.name.trim()) {
            nextErrors.name = t('aksiEvent.actionModal.errorName');
        }

        if (!form.behaviors.length) {
            nextErrors.behaviors = t('aksiEvent.actionModal.errorBehaviors');
        } else {
            for (const behavior of form.behaviors) {
                const message = validateBehavior(t, behavior);
                if (message) nextErrors[behavior.type] = message;
            }
        }

        return nextErrors;
    }

    async function handleSave() {
        const nextErrors = validate();
        setFieldErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setSubmitError('');
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
            setSubmitError(err?.message || t('aksiEvent.actionModal.errorSaveGeneric'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            title={isEdit ? t('aksiEvent.actionModal.titleEdit') : t('aksiEvent.actionModal.titleNew')}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-alt">
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                    >
                        {saving ? t('common.saving') : t('aksiEvent.actionModal.saveButton')}
                    </button>
                </>
            }
        >
            <div>
                <label className="mb-1.5 block text-sm font-medium">
                    {t('aksiEvent.actionModal.nameLabel')} <span className="text-primary-600">*</span>
                </label>
                <input
                    type="text"
                    value={form.name}
                    onChange={(event) => {
                        patch({ name: event.target.value });
                        clearFieldError('name');
                    }}
                    placeholder={t('aksiEvent.actionModal.namePlaceholder')}
                    className={`w-full rounded-lg border bg-bg px-3 py-2 text-sm ${fieldErrors.name ? 'border-2 border-primary-600' : 'border-border'}`}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-primary-600">{fieldErrors.name}</p>}
            </div>

            <div className="mt-5">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                    <span className="inline-block h-4 w-1 rounded bg-primary-600"></span>
                    {t('aksiEvent.actionModal.whatHappensLabel')}
                </p>
                {fieldErrors.behaviors && <p className="mb-2 text-xs text-primary-600">{fieldErrors.behaviors}</p>}

                <div className="space-y-2">
                    {BEHAVIOR_TYPES.map((bt) => {
                        const checked = isChecked(bt.type);
                        const behavior = form.behaviors.find((b) => b.type === bt.type);
                        const behaviorError = fieldErrors[bt.type];

                        return (
                            <div
                                key={bt.type}
                                className={`rounded-xl border p-3 ${
                                    behaviorError ? 'border-2 border-primary-600' : checked ? 'border-primary-600' : 'border-border'
                                }`}
                            >
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
                                        {behaviorError && <p className="mt-2 text-xs text-primary-600">{behaviorError}</p>}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <ActionAdvancedSettings form={form} onChange={patch} screens={screens} />

            {submitError && <p className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700">{submitError}</p>}
        </Modal>
    );
}
