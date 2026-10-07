import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translations } from './translations.js';

const LanguageContext = createContext(null);

function initialLang() {
    return localStorage.getItem('lang') === 'en' ? 'en' : 'id';
}

function resolve(dict, key) {
    return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), dict);
}

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(initialLang);

    const toggleLang = useCallback(() => {
        setLang((prev) => {
            const next = prev === 'id' ? 'en' : 'id';
            localStorage.setItem('lang', next);
            return next;
        });
    }, []);

    const t = useCallback(
        (key, params) => {
            const raw = resolve(translations[lang], key) ?? resolve(translations.id, key) ?? key;
            if (!params) return raw;
            return raw.replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? params[name] : match));
        },
        [lang],
    );

    const value = useMemo(() => ({ lang, toggleLang, t }), [lang, toggleLang, t]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
    return ctx;
}
