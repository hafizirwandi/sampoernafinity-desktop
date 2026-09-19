import { useCallback, useState } from 'react';

function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
    const [theme, setTheme] = useState(currentTheme);

    const toggleTheme = useCallback(() => {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        setTheme(next);
    }, []);

    return { theme, toggleTheme };
}
