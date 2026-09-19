import { useCallback, useEffect, useState } from 'react';
import { ipcErrorMessage } from '../lib/ipc.js';

const REMEMBERED_TIKTOK_USERNAME_KEY = 'sf.rememberedTiktokUsername';

export function useTiktokConnection() {
    const [state, setState] = useState({
        status: 'idle',
        username: localStorage.getItem(REMEMBERED_TIKTOK_USERNAME_KEY) || '',
        error: null,
    });

    useEffect(() => {
        const unsubscribe = window.api.tiktok.onStatus(setState);

        window.api.tiktok.getStatus().then((current) => {
            setState((prev) => ({ ...prev, ...current, username: current?.username || prev.username }));
        });

        return unsubscribe;
    }, []);

    const connect = useCallback(async (username) => {
        localStorage.setItem(REMEMBERED_TIKTOK_USERNAME_KEY, username);

        try {
            const next = await window.api.tiktok.connect(username);
            setState(next);
        } catch (error) {
            setState({ status: 'error', username, error: ipcErrorMessage(error) });
        }
    }, []);

    const disconnect = useCallback(() => window.api.tiktok.disconnect(), []);

    return { state, connect, disconnect };
}
