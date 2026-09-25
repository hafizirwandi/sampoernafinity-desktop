export default function RowIconButton({ onClick, title, tone = 'muted', children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`rounded-lg p-1.5 hover:bg-surface-alt ${tone === 'danger' ? 'text-primary-600 hover:text-primary-700' : 'text-text-muted hover:text-text'}`}
        >
            {children}
        </button>
    );
}
