import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { useSidebar } from '../hooks/useSidebar.js';
import { useActionPlayback } from '../hooks/useActionPlayback.js';
import { useSoundboardPlayback } from '../hooks/useSoundboardPlayback.js';
import { useTtsPlayback } from '../hooks/useTtsPlayback.js';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardPanel from '../panels/DashboardPanel.jsx';
import AnalyticsPanel from '../panels/AnalyticsPanel.jsx';
import GiftsPanel from '../panels/GiftsPanel.jsx';
import ConnectionPanel from '../panels/ConnectionPanel.jsx';
import PlaceholderPanel from '../panels/PlaceholderPanel.jsx';
import AksiEventPanel from '../panels/aksiEvent/AksiEventPanel.jsx';
import OverlayWidgetsPanel from '../panels/overlayWidgets/OverlayWidgetsPanel.jsx';
import SoundboardPanel from '../panels/soundboard/SoundboardPanel.jsx';
import TtsPanel from '../panels/tts/TtsPanel.jsx';

function panelTitles(t) {
    return {
        dashboard: t('sidebar.navDashboard'),
        analytics: t('analytics.title'),
        packages: t('sidebar.navPackages'),
        balance: t('sidebar.navBalance'),
        gifts: t('sidebar.navGifts'),
        'aksi-event': t('aksiEvent.panel.title'),
        overlay: t('overlayWidgets.title'),
        soundboard: t('soundboard.panel.title'),
        tts: t('tts.panel.title'),
        connection: t('sidebar.navConnection'),
    };
}

export default function DashboardShell({ auth, theme }) {
    const { t } = useLanguage();
    const PANEL_TITLES = panelTitles(t);
    const sidebar = useSidebar();
    const [activePanel, setActivePanel] = useState('dashboard');
    useActionPlayback();
    useSoundboardPlayback();
    useTtsPlayback();

    function handleNavigate(panel) {
        setActivePanel(panel);
        sidebar.closeMobile();
    }

    let panelContent;
    if (activePanel === 'dashboard') panelContent = <DashboardPanel auth={auth} />;
    else if (activePanel === 'analytics') panelContent = <AnalyticsPanel />;
    else if (activePanel === 'gifts') panelContent = <GiftsPanel />;
    else if (activePanel === 'aksi-event') panelContent = <AksiEventPanel />;
    else if (activePanel === 'overlay') panelContent = <OverlayWidgetsPanel />;
    else if (activePanel === 'soundboard') panelContent = <SoundboardPanel />;
    else if (activePanel === 'tts') panelContent = <TtsPanel />;
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
