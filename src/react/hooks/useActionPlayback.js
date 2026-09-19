import { useEffect, useRef } from 'react';

// Plays Aksi audio/TTS locally in the app window — the fallback path used
// whenever a screen has no working Overlay attached (or the overlay server
// doesn't exist yet), so gift-triggered sound is never silently lost.
export function useActionPlayback() {
    const audioRef = useRef(null);

    useEffect(() => {
        audioRef.current = new Audio();
    }, []);

    useEffect(() => {
        const unsubscribeAudio = window.api.actions.onPlayAudioLocal(({ source, volume }) => {
            const audio = audioRef.current;
            if (!audio || !source) return;

            audio.src = source;
            audio.volume = Math.min(1, Math.max(0, (volume ?? 100) / 100));
            audio.play().catch(() => {});
        });

        const unsubscribeSpeak = window.api.actions.onSpeakLocal(({ message, volume }) => {
            if (!message || !('speechSynthesis' in window)) return;

            const utterance = new SpeechSynthesisUtterance(message);
            utterance.volume = Math.min(1, Math.max(0, (volume ?? 100) / 100));
            window.speechSynthesis.speak(utterance);
        });

        return () => {
            unsubscribeAudio();
            unsubscribeSpeak();
        };
    }, []);
}
