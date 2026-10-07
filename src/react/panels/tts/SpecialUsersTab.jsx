import { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import { useSpeechVoices } from '../../hooks/useSpeechVoices.js';
import { useLanguage } from '../../i18n/LanguageContext.jsx';

export default function SpecialUsersTab() {
    const { t } = useLanguage();
    const voices = useSpeechVoices();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        window.api.tts.listUsers().then(setUsers);
    }, []);

    function patchLocal(id, fields) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...fields } : u)));
    }

    async function saveField(id, fields) {
        const updated = await window.api.tts.updateUser(id, fields);
        setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    }

    async function addUser() {
        const created = await window.api.tts.addUser({ username: '' });
        setUsers((prev) => [...prev, created]);
    }

    async function removeUser(id) {
        await window.api.tts.removeUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
    }

    return (
        <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold">{t('tts.specialUsers.heading')}</h3>
            <p className="mt-1 text-sm text-text-muted">{t('tts.specialUsers.description')}</p>

            <button
                type="button"
                onClick={addUser}
                className="mt-4 flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-surface-alt"
            >
                <PlusIcon className="h-4 w-4" />
                {t('tts.specialUsers.addUser')}
            </button>

            <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-border text-xs uppercase tracking-wide text-text-muted">
                            <th className="py-2 pr-4 font-medium"></th>
                            <th className="py-2 pr-4 font-medium">{t('tts.specialUsers.tableUsername')}</th>
                            <th className="py-2 pr-4 font-medium">{t('tts.specialUsers.tableAllowed')}</th>
                            <th className="py-2 pr-4 font-medium">{t('tts.specialUsers.tableLanguage')}</th>
                            <th className="py-2 pr-4 font-medium">{t('tts.specialUsers.tableRandomVoice')}</th>
                            <th className="py-2 pr-4 font-medium">{t('tts.specialUsers.tableSpeed')}</th>
                            <th className="py-2 pr-4 font-medium">{t('tts.specialUsers.tablePitch')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!users.length ? (
                            <tr>
                                <td colSpan={7} className="py-4 text-center text-text-muted">
                                    {t('common.noData')}
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-border last:border-0">
                                    <td className="py-2 pr-4">
                                        <button type="button" onClick={() => removeUser(user.id)} className="rounded-lg p-1.5 text-primary-600 hover:bg-surface-alt">
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </td>
                                    <td className="py-2 pr-4">
                                        <input
                                            type="text"
                                            value={user.username}
                                            onChange={(event) => patchLocal(user.id, { username: event.target.value })}
                                            onBlur={(event) => saveField(user.id, { username: event.target.value })}
                                            placeholder="@username"
                                            className="w-36 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm"
                                        />
                                    </td>
                                    <td className="py-2 pr-4">
                                        <ToggleSwitch checked={user.allowed} onChange={() => saveField(user.id, { allowed: !user.allowed })} />
                                    </td>
                                    <td className="py-2 pr-4">
                                        <select
                                            value={user.voiceURI}
                                            onChange={(event) => saveField(user.id, { voiceURI: event.target.value })}
                                            className="w-44 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm"
                                        >
                                            <option value="">{t('common.default')}</option>
                                            {voices.map((voice) => (
                                                <option key={voice.voiceURI} value={voice.voiceURI}>
                                                    {voice.name} ({voice.lang})
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-2 pr-4">
                                        <ToggleSwitch checked={user.randomVoice} onChange={() => saveField(user.id, { randomVoice: !user.randomVoice })} />
                                    </td>
                                    <td className="py-2 pr-4">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={user.speed}
                                            onChange={(event) => patchLocal(user.id, { speed: event.target.value })}
                                            onBlur={(event) => saveField(user.id, { speed: Number(event.target.value) || 50 })}
                                            className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm"
                                        />
                                    </td>
                                    <td className="py-2 pr-4">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={user.pitch}
                                            onChange={(event) => patchLocal(user.id, { pitch: event.target.value })}
                                            onBlur={(event) => saveField(user.id, { pitch: Number(event.target.value) || 50 })}
                                            className="w-20 rounded-lg border border-border bg-bg px-2 py-1.5 text-sm"
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
