export default function DashboardPanel({ auth }) {
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-sm text-text-muted">Halo,</p>
                <p className="text-lg font-semibold">{auth.user?.name || ' '}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-5">
                    <p className="font-semibold">Paket Saya</p>
                    <p className="mt-1 text-sm text-text-muted">Belum ada trigger yang diaktifkan.</p>
                    <span className="mt-3 inline-block rounded-full bg-surface-alt px-2.5 py-1 text-xs text-text-muted">Segera hadir</span>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5">
                    <p className="font-semibold">Manual Book</p>
                    <p className="mt-1 text-sm text-text-muted">Panduan pemakaian aplikasi &amp; dashboard.</p>
                    <span className="mt-3 inline-block rounded-full bg-surface-alt px-2.5 py-1 text-xs text-text-muted">Segera hadir</span>
                </div>
            </div>
        </div>
    );
}
