const numberFormatter = new Intl.NumberFormat('id-ID');

export function formatNumber(value) {
    return numberFormatter.format(value || 0);
}

export function formatChartDate(isoDate) {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function formatChartDateFull(isoDate) {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(iso) {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

export function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
}
