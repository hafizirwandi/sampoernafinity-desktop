import { BoltIcon, Squares2X2Icon, SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../i18n/LanguageContext.jsx';

function navSections(t) {
    return [
        {
            label: t('sidebar.sectionWelcome'),
            items: [
                {
                    key: 'dashboard',
                    title: t('sidebar.navDashboard'),
                    path: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
                },
                {
                    key: 'analytics',
                    title: t('sidebar.navAnalytics'),
                    path: 'M3 13.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
                },
                {
                    key: 'packages',
                    title: t('sidebar.navPackages'),
                    fill: true,
                    path: 'M3 17.25 4.5 8.25l4.125 3.938L12 6.75l3.375 5.438 4.125-3.938L21 17.25H3Z',
                },
                {
                    key: 'balance',
                    title: t('sidebar.navBalance'),
                    path: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 20.25 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 3.75 19.5Z',
                },
            ],
        },
        {
            label: t('sidebar.sectionTiktokContent'),
            items: [
                {
                    key: 'gifts',
                    title: t('sidebar.navGifts'),
                    path: 'M12 8.25v13.5M12 8.25c-1.5-3.5-6.5-4-6.5-.5 0 2 2 2.5 6.5 2.5Zm0 0c1.5-3.5 6.5-4 6.5-.5 0 2-2 2.5-6.5 2.5ZM4.5 21.75h15A1.5 1.5 0 0 0 21 20.25v-9a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 11.25v9a1.5 1.5 0 0 0 1.5 1.5ZM2.25 9.75h19.5v3H2.25v-3Z',
                },
                {
                    key: 'aksi-event',
                    title: t('sidebar.navAksiEvent'),
                    icon: BoltIcon,
                },
                {
                    key: 'overlay',
                    title: t('sidebar.navOverlay'),
                    icon: Squares2X2Icon,
                },
                {
                    key: 'soundboard',
                    title: t('sidebar.navSoundboard'),
                    icon: SpeakerWaveIcon,
                },
                {
                    key: 'tts',
                    title: t('sidebar.navTts'),
                    icon: MicrophoneIcon,
                },
            ],
        },
        {
            label: t('sidebar.sectionSetup'),
            items: [
                {
                    key: 'connection',
                    title: t('sidebar.navConnection'),
                    path: 'M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244',
                },
            ],
        },
    ];
}

export default function Sidebar({ activePanel, onNavigate, collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
    const { t } = useLanguage();
    const NAV_SECTIONS = navSections(t);

    return (
        <>
            <div hidden={!mobileOpen} onClick={onCloseMobile} className="fixed inset-0 z-30 bg-black/50 lg:hidden"></div>

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 transform flex-col overflow-hidden border-r border-border bg-surface transition-all duration-200 ease-in-out lg:sticky lg:inset-y-auto lg:top-0 lg:h-screen lg:translate-x-0 ${
                    mobileOpen ? 'translate-x-0' : '-translate-x-full'
                } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
            >
                <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-base font-bold text-white">A</div>
                    <span className={`truncate text-base font-semibold tracking-tight ${collapsed ? 'lg:hidden' : ''}`}>Sampoernafinity</span>
                </div>

                <div className={`shrink-0 border-b border-border px-3 py-3 ${collapsed ? 'lg:hidden' : ''}`}>
                    <div className="flex items-center justify-between px-1">
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
                            </svg>
                            {t('sidebar.preset')}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0 text-text-muted">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    </div>

                    <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2 text-sm">
                        <span>{t('sidebar.presetDefault')}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0 text-text-muted">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4">
                    {NAV_SECTIONS.map((section, sectionIndex) => (
                        <div key={section.label}>
                            <p className={`sidebar-label mb-1 truncate px-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted ${sectionIndex > 0 ? 'mt-4' : ''} ${collapsed ? 'lg:hidden' : ''}`}>
                                {section.label}
                            </p>

                            {section.items.map((item) => {
                                const active = activePanel === item.key;

                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        title={item.title}
                                        onClick={() => onNavigate(item.key)}
                                        className={`nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                                            active ? 'bg-primary-600 text-white' : 'text-text-muted'
                                        } ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}
                                    >
                                        {item.icon ? (
                                            <item.icon className="h-5 w-5 shrink-0" />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={item.fill ? 'currentColor' : 'none'} stroke={item.fill ? undefined : 'currentColor'} strokeWidth={item.fill ? undefined : '1.5'} className="h-5 w-5 shrink-0">
                                                {item.fill ? <path d={item.path} /> : <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />}
                                            </svg>
                                        )}
                                        <span className={`nav-label truncate ${collapsed ? 'lg:hidden' : ''}`}>{item.title}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="shrink-0 border-t border-border">
                    <button
                        type="button"
                        onClick={onToggleCollapsed}
                        title={t('sidebar.collapseMenu')}
                        className={`hidden w-full items-center gap-3 px-3 py-3 text-sm font-medium text-text-muted hover:bg-surface-alt hover:text-text lg:flex ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`h-5 w-5 shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                        <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{t('sidebar.collapseMenu')}</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
