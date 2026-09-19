export function LeaderboardRow({ rank, avatarInitial, title, subtitle, value }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-alt px-3 py-2">
            <div className="flex min-w-0 items-center gap-3">
                <span className="w-4 shrink-0 text-sm font-semibold text-text-muted">{rank}</span>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">{avatarInitial}</div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{title}</p>
                    {subtitle ? <p className="truncate text-xs text-text-muted">{subtitle}</p> : null}
                </div>
            </div>
            <span className="shrink-0 text-sm font-semibold">{value}</span>
        </div>
    );
}

export default function Leaderboard({ items, emptyText, renderItem }) {
    return (
        <div className="mt-3 space-y-2">
            {items.length ? items.map((item, index) => renderItem(item, index)) : <p className="text-sm text-text-muted">{emptyText}</p>}
        </div>
    );
}
