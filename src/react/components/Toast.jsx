import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Toast({ onDismiss, duration = 5000, children }) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, duration);
        return () => clearTimeout(timer);
    }, [onDismiss, duration]);

    return (
        <div className="fixed bottom-6 right-6 z-[60] w-full max-w-sm rounded-xl border border-border bg-surface p-4 text-sm shadow-lg">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">{children}</div>
                <button type="button" onClick={onDismiss} className="shrink-0 text-text-muted hover:text-text">
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
