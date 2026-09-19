import { useState } from 'react';

// Generic chip + search-dropdown multi-select, reused for both "pick gifts"
// (gift_specific trigger) and "pick actions" (Event → Aksi links) — the
// caller just tells it how to read an id/label off whatever item type it's
// given.
export default function SearchMultiSelect({ items, selectedIds, onChange, getId, getLabel, placeholder }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);

    const filtered = items
        .filter((item) => !selectedIds.includes(getId(item)) && getLabel(item).toLowerCase().includes(query.toLowerCase()))
        .slice(0, 20);

    function addItem(item) {
        onChange([...selectedIds, getId(item)]);
        setQuery('');
        setOpen(false);
    }

    function removeItem(id) {
        onChange(selectedIds.filter((existing) => existing !== id));
    }

    const selectedItems = selectedIds.map((id) => items.find((item) => getId(item) === id)).filter(Boolean);

    return (
        <div>
            {selectedItems.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                    {selectedItems.map((item) => (
                        <span key={getId(item)} className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-xs">
                            {getLabel(item)}
                            <button type="button" onClick={() => removeItem(getId(item))} className="text-text-muted hover:text-text">
                                &times;
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
                />

                {open && filtered.length > 0 && (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
                        {filtered.map((item) => (
                            <li key={getId(item)}>
                                <button
                                    type="button"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => addItem(item)}
                                    className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-alt"
                                >
                                    {getLabel(item)}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
