import { useState } from 'react';
import { ipcErrorMessage } from '../lib/ipc.js';

export default function LoginView({ auth, theme }) {
    const [email, setEmail] = useState(auth.rememberedEmail);
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(Boolean(auth.rememberedEmail));
    const [busy, setBusy] = useState(false);
    const [formError, setFormError] = useState('');

    function clearErrors() {
        setFormError('');
        auth.clearOauthError();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        clearErrors();
        setBusy(true);

        try {
            await auth.login({ email: email.trim(), password, remember });
            setPassword('');
        } catch (error) {
            setFormError(ipcErrorMessage(error) || 'Email atau kata sandi salah.');
        } finally {
            setBusy(false);
        }
    }

    function handleProvider(provider) {
        clearErrors();
        auth.loginWithProvider(provider);
    }

    return (
        <section id="view-login" className="flex min-h-screen flex-col lg:flex-row">
            <div className="relative hidden w-full flex-col justify-between bg-zinc-950 p-10 text-white lg:flex lg:max-w-md xl:max-w-lg">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-base font-bold">A</div>
                    <span className="text-lg font-semibold">Sampoernafinity</span>
                </div>

                <div>
                    <h1 className="text-3xl font-bold leading-tight">
                        Platform trigger &amp; action untuk live TikTok yang lebih interaktif, menarik, dan profesional.
                    </h1>

                    <ul className="mt-8 space-y-4 text-sm text-white/80">
                        <li className="flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/20 text-primary-400">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5 9 3l1.5 9L11.25 21 3.75 13.5Zm7.5 0h9" />
                                </svg>
                            </span>
                            <span className="pt-1.5">Overlay &amp; suara realtime setiap ada trigger baru</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/20 text-primary-400">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h7.5v7.5h-7.5V6ZM12.75 10.5h7.5V18h-7.5v-7.5ZM3.75 15.75h7.5V18h-7.5v-2.25Z" />
                                </svg>
                            </span>
                            <span className="pt-1.5">Soundboard, overlay, dan gift mapping dalam satu dashboard</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/20 text-primary-400">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3.75 6h.008v.008H3.75V6Zm0 6h.008v.008H3.75V12Zm0 6h.008v.008H3.75V18Z" />
                                </svg>
                            </span>
                            <span className="pt-1.5">Atur trigger &amp; action sepenuhnya dari dashboard admin</span>
                        </li>
                    </ul>
                </div>

                <p className="text-xs text-white/50">&copy; <span>{new Date().getFullYear()}</span> Sampoernafinity</p>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">A</div>
                        <span className="text-base font-semibold">Sampoernafinity</span>
                    </div>
                    <button
                        type="button"
                        onClick={theme.toggleTheme}
                        title="Ganti tema terang/gelap"
                        className="ml-auto inline-flex items-center justify-center rounded-lg border border-border p-2 text-text-muted hover:bg-surface-alt hover:text-text"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 dark:hidden">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="hidden h-5 w-5 dark:block">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    </button>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-center px-4 pb-10 sm:px-6">
                    <div className="w-full min-w-0 max-w-sm">
                        <h2 className="text-xl font-semibold sm:text-2xl">Masuk ke Sampoernafinity</h2>
                        <p className="mt-1 text-sm text-text-muted">Belum punya akun? Daftar otomatis saat kamu pertama masuk.</p>

                        {auth.oauthMessage && (
                            <p className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700">{auth.oauthMessage}</p>
                        )}
                        {auth.oauthError && (
                            <p className="mt-4 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-700">{auth.oauthError}</p>
                        )}

                        <div className="mt-6 space-y-3">
                            <button
                                type="button"
                                onClick={() => handleProvider('google')}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text hover:bg-surface-alt"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.89c2.28-2.1 3.56-5.19 3.56-8.8z" />
                                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.89-2.98c-1.08.72-2.45 1.15-4.04 1.15-3.11 0-5.74-2.1-6.68-4.92H1.32v3.09C3.29 21.3 7.31 24 12 24z" />
                                    <path fill="#FBBC05" d="M5.32 14.33c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.68H1.32C.48 8.34 0 10.12 0 12s.48 3.66 1.32 5.32z" />
                                    <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.29 2.7 1.32 6.68l4 3.09c.94-2.82 3.57-4.92 6.68-5.02z" />
                                </svg>
                                Lanjutkan dengan Google
                            </button>

                            <button
                                type="button"
                                onClick={() => handleProvider('discord')}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4a54e1]"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.369a.07.07 0 0 0-.032.027C.533 9.045-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.099.246.197.373.291a.077.077 0 0 1-.006.128 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.106c.36.699.772 1.364 1.225 1.994a.077.077 0 0 0 .084.028 19.84 19.84 0 0 0 6-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.211 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                                </svg>
                                Lanjutkan dengan Discord
                            </button>
                        </div>

                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-border"></div>
                            <span className="text-xs text-text-muted">atau</span>
                            <div className="h-px flex-1 bg-border"></div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    autoComplete="username"
                                    required
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                                    placeholder="nama@contoh.com"
                                />
                                {formError && <p className="mt-1.5 text-sm text-primary-600">{formError}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Kata Sandi</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
                                    placeholder="********"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-text-muted">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(event) => setRemember(event.target.checked)}
                                    className="rounded border-border text-primary-600 focus:ring-primary-600"
                                />
                                Ingat saya
                            </label>

                            <button
                                type="submit"
                                disabled={busy}
                                className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
                            >
                                {busy ? 'Memproses...' : 'Masuk dengan Email'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
