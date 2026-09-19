import { useCallback, useEffect, useState } from 'react';

const REMEMBERED_EMAIL_KEY = 'sf.rememberedEmail';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | login | dashboard
    const [oauthMessage, setOauthMessage] = useState('');
    const [oauthError, setOauthError] = useState('');

    useEffect(() => {
        let cancelled = false;

        window.api.auth.getSession().then((session) => {
            if (cancelled) return;
            setUser(session);
            setStatus(session ? 'dashboard' : 'login');
        });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const unsubscribe = window.api.auth.onOAuthResult(async (result) => {
            setOauthMessage('');

            if (!result.ok) {
                setOauthError(result.error === 'account_disabled' ? 'Akun ini sudah dinonaktifkan.' : 'Gagal masuk. Coba lagi.');
                return;
            }

            const session = await window.api.auth.getSession();
            if (session) {
                setUser(session);
                setStatus('dashboard');
            }
        });

        return unsubscribe;
    }, []);

    const login = useCallback(async ({ email, password, remember }) => {
        const session = await window.api.auth.login({ email, password });

        if (remember) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
        } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        setUser(session);
        setStatus('dashboard');
        return session;
    }, []);

    const loginWithProvider = useCallback(async (provider) => {
        setOauthError('');
        setOauthMessage(provider === 'google' ? 'Membuka browser untuk masuk dengan Google...' : 'Membuka browser untuk masuk dengan Discord...');
        await window.api.auth.loginWithProvider(provider);
    }, []);

    const clearOauthError = useCallback(() => setOauthError(''), []);

    const logout = useCallback(async () => {
        await window.api.auth.logout();
        setUser(null);
        setStatus('login');
    }, []);

    return {
        user,
        status,
        rememberedEmail: localStorage.getItem(REMEMBERED_EMAIL_KEY) || '',
        oauthMessage,
        oauthError,
        clearOauthError,
        login,
        loginWithProvider,
        logout,
    };
}
