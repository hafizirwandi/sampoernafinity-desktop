import { useEffect } from 'react';

export default function Modal({ title, onClose, children, footer }) {
    useEffect(() => {
        function handleKey(event) {
            if (event.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                onClick={(event) => event.stopPropagation()}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-l-4 border-border border-l-primary-600 bg-surface shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold">{title}</h2>
                    <button type="button" onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-surface-alt hover:text-text">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

                {footer && <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>}
            </div>
        </div>
    );
}
