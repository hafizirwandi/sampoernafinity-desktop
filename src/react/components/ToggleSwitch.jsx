export default function ToggleSwitch({ checked, onChange, title }) {
    return (
        <label className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center" title={title}>
            <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
            <span className="absolute inset-0 rounded-full border border-border bg-surface-alt transition-colors peer-checked:border-primary-600 peer-checked:bg-primary-600"></span>
            <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"></span>
        </label>
    );
}
