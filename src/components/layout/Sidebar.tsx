import React, { useState } from 'react';
import { ViewType } from '../../App';

interface SidebarProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
}

interface NavItem {
    view: ViewType;
    icon: string;
    label: string;
    badge?: string;
    badgeColor?: string;
    isNew?: boolean;
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
    {
        label: 'Main',
        items: [
            { view: 'live-board', icon: 'dashboard', label: 'Live Board' },
            { view: 'sportsbook', icon: 'casino', label: 'Sportsbook', isNew: true },
            { view: 'ai-dashboard', icon: 'smart_toy', label: 'AI Dashboard', isNew: true },
            { view: 'matchup-terminal', icon: 'analytics', label: 'Matchup Terminal' },
            { view: 'popular-bets', icon: 'local_fire_department', label: 'Popular Bets' },
        ],
    },
    {
        label: 'Tools',
        items: [
            { view: 'sharp-tools', icon: 'build', label: 'Sharp Tools' },
            { view: '3d-board', icon: 'view_in_ar', label: '3D Board', isNew: true },
            { view: 'player-props', icon: 'sports_score', label: 'Player Props' },
            { view: 'trends', icon: 'show_chart', label: 'Trends' },
            { view: 'value-finder', icon: 'manage_search', label: 'Value Finder' },
            { view: 'live-odds', icon: 'compare_arrows', label: 'Live Odds' },
        ],
    },
    {
        label: 'Explore',
        items: [
            { view: 'teams-directory', icon: 'groups', label: 'Teams Directory' },
            { view: 'leaderboard', icon: 'emoji_events', label: 'Leaderboard' },
            { view: 'referrals', icon: 'diversity_3', label: 'Referrals' },
        ],
    },
    {
        label: 'My Account',
        items: [
            { view: 'bankroll', icon: 'account_balance_wallet', label: 'Bankroll' },
            { view: 'saved-picks', icon: 'bookmark', label: 'Saved Picks' },
            { view: 'account', icon: 'manage_accounts', label: 'Account Settings' },
        ],
    },
];

const NavButton = ({
    icon,
    label,
    isActive,
    isNew,
    onClick,
}: Omit<NavItem, 'view' | 'badge' | 'badgeColor'> & { isActive: boolean; onClick: () => void }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg relative transition-all"
            style={{
                background: isActive
                    ? 'color-mix(in srgb, var(--sidebar-primary) 12%, transparent)'
                    : hovered
                        ? 'color-mix(in srgb, var(--sidebar-foreground) 5%, transparent)'
                        : 'transparent',
                border: isActive
                    ? '1px solid color-mix(in srgb, var(--sidebar-primary) 30%, transparent)'
                    : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
            }}
        >
            {/* Active left accent */}
            {isActive && (
                <div
                    className="absolute left-0 inset-y-2 w-[3px] rounded-r-full"
                    style={{ background: 'var(--sidebar-primary)' }}
                />
            )}

            {/* Icon */}
            <span
                className="material-symbols-outlined flex-shrink-0"
                style={{
                    fontSize: 17,
                    color: isActive
                        ? (label === 'Sportsbook' ? '#A3FF00' : 'var(--sidebar-primary)')
                        : hovered
                            ? (label === 'Sportsbook' ? '#A3FF00' : 'var(--sidebar-foreground)')
                            : 'var(--muted-foreground)',
                    transition: 'color 0.15s',
                }}
            >
                {icon}
            </span>

            {/* Label */}
            <span
                className="text-[12.5px] flex-1 truncate"
                style={{
                    color: isActive
                        ? (label === 'Sportsbook' ? '#A3FF00' : 'var(--sidebar-foreground)')
                        : hovered
                            ? (label === 'Sportsbook' ? '#A3FF00' : 'var(--sidebar-foreground)')
                            : 'var(--muted-foreground)',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'color 0.15s',
                }}
            >
                {label}
            </span>

            {/* NEW badge */}
            {isNew && !isActive && (
                <span
                    className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md flex-shrink-0"
                    style={{
                        background: 'color-mix(in srgb, var(--sidebar-primary) 15%, transparent)',
                        color: 'var(--sidebar-primary)',
                        border: '1px solid color-mix(in srgb, var(--sidebar-primary) 30%, transparent)',
                    }}
                >
                    NEW
                </span>
            )}
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    return (
        <aside
            className="w-60 shrink-0 h-screen fixed left-0 top-0 z-[45] hidden xl:flex flex-col overflow-y-auto custom-scrollbar"
            style={{
                background: 'var(--sidebar)',
                borderRight: '1px solid var(--sidebar-border)',
                paddingTop: '64px',
            }}
        >
            {/* ── Logo lockup ── */}
            <div
                className="px-4 py-4 flex items-center gap-3"
                style={{ borderBottom: '1px solid var(--sidebar-border)' }}
            >
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-black"
                    style={{ background: 'var(--sidebar-primary)', color: 'var(--primary-foreground)' }}
                >
                    PL
                </div>
                <div>
                    <p className="text-[12px] font-black uppercase tracking-widest leading-none"
                        style={{ color: 'var(--sidebar-foreground)' }}>
                        PickLabs
                    </p>
                    <p className="text-[9px] font-medium mt-0.5"
                        style={{ color: 'color-mix(in srgb, var(--sidebar-primary) 70%, transparent)' }}>
                        Sports Intelligence
                    </p>
                </div>
            </div>

            {/* ── Nav sections ── */}
            <nav className="flex-1 px-2 py-3 space-y-4">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                        {/* Section header */}
                        <p
                            className="text-[9px] font-black uppercase tracking-[0.18em] px-3 mb-1"
                            style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}
                        >
                            {section.label}
                        </p>

                        {/* Nav buttons */}
                        <div className="space-y-0.5">
                            {section.items.map((item) => (
                                <NavButton
                                    key={item.view}
                                    {...item}
                                    isActive={currentView === item.view}
                                    onClick={() => setCurrentView(item.view)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── Bottom: Model accuracy card ── */}
            <div className="px-3 pb-5 mt-auto">
                <div
                    className="h-px mb-3"
                    style={{ background: 'var(--sidebar-border)' }}
                />

                {/* Settings shortcut */}
                <button
                    onClick={() => setCurrentView('settings')}
                    className="flex items-center gap-3 px-3 py-2 w-full rounded-lg mb-2 transition-all"
                    style={{
                        background: currentView === 'settings'
                            ? 'color-mix(in srgb, var(--sidebar-primary) 12%, transparent)'
                            : 'transparent',
                        border: currentView === 'settings'
                            ? '1px solid color-mix(in srgb, var(--sidebar-primary) 25%, transparent)'
                            : '1px solid transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                    }}
                >
                    <span className="material-symbols-outlined" style={{
                        fontSize: 17,
                        color: currentView === 'settings' ? 'var(--sidebar-primary)' : 'var(--muted-foreground)'
                    }}>settings</span>
                    <span className="text-[12.5px] font-medium" style={{
                        color: currentView === 'settings' ? 'var(--sidebar-foreground)' : 'var(--muted-foreground)'
                    }}>Settings</span>
                </button>

                {/* Model accuracy card — uses new .pl-meter system */}
                <div
                    className="rounded-xl p-3.5 relative overflow-hidden"
                    style={{
                        background: 'var(--card)',
                        border: '1px solid var(--sidebar-border)',
                    }}
                >
                    {/* Top gradient accent bar */}
                    <div
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: 'linear-gradient(90deg, var(--primary) 0%, #61B50E 100%)' }}
                    />

                    <div className="flex items-center gap-1.5 mb-2.5">
                        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--primary)' }}>insights</span>
                        <span className="text-[9px] font-black uppercase tracking-widest"
                            style={{ color: 'color-mix(in srgb, var(--primary) 70%, transparent)' }}>
                            Model Accuracy
                        </span>
                    </div>

                    <div className="flex items-end justify-between mb-1.5">
                        <span className="text-[26px] font-black font-mono leading-none tracking-tighter"
                            style={{ color: 'var(--sidebar-foreground)' }}>
                            55.6%
                        </span>
                        <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md mb-0.5"
                            style={{
                                background: 'rgba(97,181,14,0.12)',
                                color: '#61B50E',
                                border: '1px solid rgba(97,181,14,0.25)',
                            }}
                        >
                            +2.3%
                        </span>
                    </div>

                    <div className="text-[8.5px] mb-2.5" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
                        Last 30 days · 847 picks analyzed
                    </div>

                    {/* Premium meter */}
                    <div className="pl-meter">
                        <div
                            className="pl-meter-fill-glow"
                            style={{ width: '55.6%' }}
                        />
                    </div>

                    {/* Mini sub-meters */}
                    <div className="mt-2.5 space-y-1.5">
                        {[
                            { label: 'NBA', pct: 61 },
                            { label: 'NFL', pct: 53 },
                            { label: 'MLB', pct: 49 },
                        ].map(({ label, pct }) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className="text-[8px] font-bold w-6 shrink-0"
                                    style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                                <div className="pl-meter-sm flex-1">
                                    <div
                                        className="pl-meter-fill"
                                        style={{ width: `${pct}%`, height: '100%' }}
                                    />
                                </div>
                                <span className="text-[8px] font-mono font-bold w-7 text-right shrink-0"
                                    style={{ color: 'var(--primary)' }}>{pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
};
