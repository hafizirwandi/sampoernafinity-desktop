import { useState } from 'react';
import { useSidebar } from '../hooks/useSidebar.js';
import { useActionPlayback } from '../hooks/useActionPlayback.js';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardPanel from '../panels/DashboardPanel.jsx';
import AnalyticsPanel from '../panels/AnalyticsPanel.jsx';
import GiftsPanel from '../panels/GiftsPanel.jsx';
import ConnectionPanel from '../panels/ConnectionPanel.jsx';
import PlaceholderPanel from '../panels/PlaceholderPanel.jsx';
import AksiEventPanel from '../panels/aksiEvent/AksiEventPanel.jsx';

const PANEL_TITLES = {
    dashboard: 'Dashboard',
    analytics: 'Statistik Live',
    packages: 'Paket & Harga',
    balance: 'Saldo & Riwayat Transaksi',
    gifts: 'Gift & Stiker',
    'aksi-event': 'Aksi & Event',
    connection: 'Connection',
};

export default function DashboardShell({ auth, theme }) {
    const sidebar = useSidebar();
    const [activePanel, setActivePanel] = useState('dashboard');
    useActionPlayback();

    function handleNavigate(panel) {
        setActivePanel(panel);
        sidebar.closeMobile();
    }

    let panelContent;
    if (activePanel === 'dashboard') panelContent = <DashboardPanel auth={auth} />;
    else if (activePanel === 'analytics') panelContent = <AnalyticsPanel />;
    else if (activePanel === 'gifts') panelContent = <GiftsPanel />;
    else if (activePanel === 'aksi-event') panelContent = <AksiEventPanel />;
    else if (activePanel === 'connection') panelContent = <ConnectionPanel />;
    else panelContent = <PlaceholderPanel />;

    return (
        <section className="min-h-screen lg:flex">
            <Sidebar
                activePanel={activePanel}
                onNavigate={handleNavigate}
                collapsed={sidebar.collapsed}
                onToggleCollapsed={sidebar.toggleCollapsed}
                mobileOpen={sidebar.mobileOpen}
                onCloseMobile={sidebar.closeMobile}
            />

            <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
                <Topbar heading={PANEL_TITLES[activePanel] || ''} onOpenSidebar={sidebar.openMobile} theme={theme} auth={auth} />

                <main className="flex-1 px-4 py-6 sm:px-6">{panelContent}</main>
            </div>
        </section>
    );
}
