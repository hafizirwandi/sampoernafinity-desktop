import { useEffect } from 'react';

function pickVoice(voices, voiceURI, randomVoice) {
    if (randomVoice && voices.length) {
        return voices[Math.floor(Math.random() * voices.length)];
    }

    return voices.find((v) => v.voiceURI === voiceURI) || null;
}

function speakSystem({ text, voiceURI, randomVoice, rate, pitchValue, volume }) {
    if (!text || !('speechSynthesis' in window)) return;

    const voices = window.speechSynthesis.getVoices();
    const voice = pickVoice(voices, voiceURI, randomVoice);

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate ?? 1;
    utterance.pitch = pitchValue ?? 1;
    utterance.volume = volume ?? 1;

    window.speechSynthesis.speak(utterance);
}

// Google's translate_tts has a ~200-char-per-request limit, so long
// comments arrive as several chunk URLs — played back-to-back rather than
// concatenated, since raw MP3 byte-concatenation across separately-encoded
// files isn't reliably valid.
function speakGoogleQueue(urls, volume) {
    if (!urls?.length) return;

    let index = 0;

    function playNext() {
        if (index >= urls.length) return;

        const audio = new Audio(urls[index]);
        audio.volume = volume ?? 1;
        index += 1;

        audio.addEventListener('ended', playNext);
        audio.addEventListener('error', playNext);
        audio.play().catch(playNext);
    }

    playNext();
}

// Main process resolves everything it can (access control, filters,
// template substitution, which voice source to use) and hands off the
// final text/URLs here — this is the only place that can actually
// enumerate/use speechSynthesis voices or play audio, since those only
// exist in a renderer/browser context.
export function useTtsPlayback() {
    useEffect(() => {
        const unsubscribe = window.api.tts.onSpeak((payload) => {
            if (payload.source === 'google') {
                speakGoogleQueue(payload.googleUrls, payload.volume);
            } else {
                speakSystem(payload);
            }
        });

        return unsubscribe;
    }, []);
}
