import { useState } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import { FileOrUrlPicker } from '../panels/aksiEvent/BehaviorFields.jsx';
import SoundLibraryModal from '../panels/aksiEvent/SoundLibraryModal.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';

// File-or-URL audio picker with a "Sound Library" (myinstants.com) button
// alongside it — shared between the Aksi "Putar Audio" behavior and the
// Suara (sound notification) form, since both need the exact same source
// picker.
export default function SoundSourcePicker({ value, onChange }) {
    const { t } = useLanguage();
    const [libraryOpen, setLibraryOpen] = useState(false);

    return (
        <div>
            <FileOrUrlPicker
                value={value}
                onChange={onChange}
                kind="audio"
                extraButton={
                    <button
                        type="button"
                        onClick={() => setLibraryOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-alt"
                    >
                        <MusicalNoteIcon className="h-4 w-4" />
                        {t('soundSourcePicker.library')}
                    </button>
                }
            />

            {libraryOpen && (
                <SoundLibraryModal
                    onClose={() => setLibraryOpen(false)}
                    onApply={(sound) => onChange({ source: 'url', url: sound.url, fileName: sound.name })}
                />
            )}
        </div>
    );
}
