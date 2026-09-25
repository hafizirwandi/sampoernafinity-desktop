import { useState } from 'react';

// Click the field, press a key combo, and it's converted to an Electron
// Accelerator string (e.g. "Control+Shift+F1") for globalShortcut.register
// — much less error-prone than asking the user to type the accelerator
// syntax by hand.
const KEY_NAME_MAP = {
    ' ': 'Space',
    Escape: 'Esc',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Enter: 'Return',
    Tab: 'Tab',
    Backspace: 'Backspace',
    Delete: 'Delete',
};

const IGNORED_KEYS = new Set(['Control', 'Alt', 'Shift', 'Meta', 'CapsLock', 'NumLock', 'ScrollLock']);

function toAccelerator(event) {
    if (IGNORED_KEYS.has(event.key)) return null;

    const parts = [];
    if (event.ctrlKey) parts.push('Control');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Super');

    const key = event.key;
    let keyName;

    if (/^F([1-9]|1[0-9]|2[0-4])$/.test(key)) keyName = key;
    else if (/^[a-zA-Z]$/.test(key)) keyName = key.toUpperCase();
    else if (/^[0-9]$/.test(key)) keyName = key;
    else if (KEY_NAME_MAP[key]) keyName = KEY_NAME_MAP[key];
    else if (/^[`\-=[\]\\;',./]$/.test(key)) keyName = key;
    else return null;

    parts.push(keyName);
    return parts.join('+');
}

export default function KeystrokeCapture({ value, onChange }) {
    const [listening, setListening] = useState(false);

    function handleKeyDown(event) {
        event.preventDefault();
        const accelerator = toAccelerator(event);
        if (accelerator) {
            onChange(accelerator);
            setListening(false);
        }
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                readOnly
                value={listening ? 'Tekan tombol...' : value || ''}
                onKeyDown={listening ? handleKeyDown : undefined}
                onFocus={() => setListening(true)}
                onBlur={() => setListening(false)}
                placeholder="Klik lalu tekan tombol"
                className="w-48 rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
            {value && (
                <button type="button" onClick={() => onChange('')} className="text-xs text-text-muted hover:text-text">
                    Hapus
                </button>
            )}
        </div>
    );
}
