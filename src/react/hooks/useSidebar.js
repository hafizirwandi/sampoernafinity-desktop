import { useCallback, useState } from 'react';

const SIDEBAR_COLLAPSED_KEY = 'sf.sidebarCollapsed';

export function useSidebar() {
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true');
    const [mobileOpen, setMobileOpen] = useState(false);

    const toggleCollapsed = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? 'true' : 'false');
            return next;
        });
    }, []);

    const openMobile = useCallback(() => setMobileOpen(true), []);
    const closeMobile = useCallback(() => setMobileOpen(false), []);

    return { collapsed, toggleCollapsed, mobileOpen, openMobile, closeMobile };
}
