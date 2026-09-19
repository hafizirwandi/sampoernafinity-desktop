import { useEffect, useRef, useState } from 'react';

export default function Topbar({ heading, onOpenSidebar, theme, auth }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const menuBtnRef = useRef(null);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (!menuOpen) return;
            if (menuBtnRef.current?.contains(event.target)) return;
            if (menuRef.current?.contains(event.target)) return;
            setMenuOpen(false);
        }

        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [menuOpen]);

    const user = auth.user;
    const initial = (user?.name || '?').trim().charAt(0).toUpperCase() || '?';

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
            <button type="button" onClick={onOpenSidebar} className="-ml-1 inline-flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-surface-alt hover:text-text lg:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
            </button>

            <h1 className="min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">{heading}</h1>

            <button
                type="button"
                onClick={theme.toggleTheme}
                title="Ganti tema terang/gelap"
                className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-text-muted hover:bg-surface-alt hover:text-text"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 dark:hidden">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="hidden h-5 w-5 dark:block">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
            </button>

            <div className="relative">
                <button ref={menuBtnRef} type="button" onClick={() => setMenuOpen((prev) => !prev)} className="flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-surface-alt">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">{initial}</div>
                    <span className="hidden text-sm font-medium sm:inline">{user?.name || ''}</span>
                </button>

                <div ref={menuRef} hidden={!menuOpen} className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-border bg-surface p-1 shadow-lg">
                    <div className="px-3 py-2 text-sm">
                        <p className="truncate font-medium">{user?.name || ''}</p>
                        <p className="truncate text-xs text-text-muted">{user?.email || ''}</p>
                    </div>
                    <div className="my-1 border-t border-border"></div>
                    <button
                        type="button"
                        onClick={() => {
                            setMenuOpen(false);
                            auth.logout();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-muted hover:bg-surface-alt hover:text-text"
                    >
                        Keluar
                    </button>
                </div>
            </div>
        </header>
    );
}
