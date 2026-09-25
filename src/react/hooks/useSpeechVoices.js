import { useEffect, useState } from 'react';

// speechSynthesis.getVoices() is often empty on the very first call — most
// engines load voices asynchronously and fire 'voiceschanged' once ready,
// so this re-reads the list on that event instead of assuming it's
// populated immediately.
export function useSpeechVoices() {
    const [voices, setVoices] = useState(() => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []));

    useEffect(() => {
        if (!('speechSynthesis' in window)) return;

        function updateVoices() {
            setVoices(window.speechSynthesis.getVoices());
        }

        updateVoices();
        window.speechSynthesis.addEventListener('voiceschanged', updateVoices);

        return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    }, []);

    return voices;
}
