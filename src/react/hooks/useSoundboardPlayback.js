import { useEffect, useRef } from 'react';

// A pool of concurrent Audio instances, not a single shared one, so
// multiple Suara notifications can genuinely overlap — the whole reason
// "Stop All Sound" needs to exist (stopping a single shared player would
// make no sense if only one sound could ever play at a time).
export function useSoundboardPlayback() {
    const playingRef = useRef(new Set());

    useEffect(() => {
        const unsubscribePlay = window.api.soundboard.onPlay(({ url, volume }) => {
            if (!url) return;

            const audio = new Audio(url);
            audio.volume = Math.min(1, Math.max(0, (volume ?? 80) / 100));
            playingRef.current.add(audio);

            const cleanup = () => playingRef.current.delete(audio);
            audio.addEventListener('ended', cleanup);
            audio.addEventListener('error', cleanup);

            audio.play().catch(cleanup);
        });

        const unsubscribeStopAll = window.api.soundboard.onStopAll(() => {
            for (const audio of playingRef.current) {
                audio.pause();
            }
            playingRef.current.clear();
        });

        return () => {
            unsubscribePlay();
            unsubscribeStopAll();
        };
    }, []);
}
