import React, { useState, useEffect, useRef } from 'react';
import { useRookieMode } from '../../contexts/RookieModeContext';
import { useLiveBets } from '../../contexts/LiveBetsContext';
import { useSportsbooks, SPORTSBOOKS } from '../../contexts/SportsbookContext';
import { PulsingBeacon } from '../ui/PulsingBeacon';
import { FreeModeQuotaMeter } from '../ui/FreeModeQuotaMeter';
import { ViewType } from '../shared/PremiumLockView';
import { getCurrentUser, isAdminEmail, logout } from '../../data/PickLabsAuthDB';
import { clearAuth } from '../../utils/auth';

interface HeaderProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
    onAIPick?: () => void;
    isAIPickLoading?: boolean;
}

const GLOSSARY_TERMS = [
    { term: 'Moneyline', icon: 'monetization_on', definition: 'You are simply picking which team will win the game outright. The final score doesn\'t matter — as long as your team gets the victory.', example: 'Lakers -150 means you bet $150 to win $100 if the Lakers win.' },
    { term: 'Point Spread', icon: 'trending_flat', definition: 'The predicted score difference. If you bet the favorite (–), they must win by MORE than that number. If you bet the underdog (+), they must win OR lose by less than that number.', example: 'Lakers -5.5 means the Lakers must win by 6+ points for you to win.' },
    { term: 'Over/Under', icon: 'swap_vert', definition: 'A bet on the COMBINED final score of both teams — you guess if total points will be Over or Under the number the sportsbook sets.', example: 'Total 228.5 — if both teams combine for 229+ points, Over wins.' },
    { term: 'Prop Bet', icon: 'person', definition: 'A bet on a specific player stat or event within the game, rather than the final score.', example: 'LeBron Over 25.5 Points — you win if LeBron scores 26 or more.' },
    { term: 'Parlay', icon: 'account_tree', definition: 'Combining multiple bets into one ticket for a much bigger payout. The catch: EVERY single bet must win. One loss and the whole ticket is trash.', example: '3-leg parlay: Lakers ML + Hornets +6.5 + Over 220 — all 3 must hit.' },
    { term: 'Vig / Juice', icon: 'percent', definition: 'The hidden commission the sportsbook charges for taking your bet. It\'s why a standard bet costs $11 to win $10 (shown as -110 odds).', example: '-110 odds = you risk $110 to win $100. The $10 difference is the vig.' },
    { term: 'Push', icon: 'remove', definition: 'A mathematical tie with the sportsbook. Nobody wins — they simply refund your original bet.', example: 'Spread is 5 points. Team wins by exactly 5. Push — you get your money back.' },
    { term: 'Unit', icon: 'straighten', definition: 'A safe, standard measure of your betting bankroll — usually 1% to 5% of your total money. Keeps your betting disciplined.', example: 'If your bankroll is $1,000, 1 unit = $10–$50 per bet.' },
    { term: '+EV (Expected Value)', icon: 'insights', definition: 'A mathematically profitable bet where the sportsbook\'s odds pay out better than the real probability of the event. The sportsbook made a pricing mistake — you capitalize.', example: 'If a coin flip pays +150 but true odds are -100, that\'s a +EV bet.' },
];

export const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onAIPick, isAIPickLoading = false }) => {
    const { isRookieModeActive, toggleRookieMode, hasExceededQuota } = useRookieMode();
    const { isLiveBetsActive, toggleLiveBets } = useLiveBets();
    const [shakeRookieMode, setShakeRookieMode] = useState(false);
    const { enabledBooks, toggleBook, enableAll, disableAll } = useSportsbooks();
    const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return true;
    });

    const [isBookieOpen, setIsBookieOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Accent color theme
    const ACCENT_COLORS = [
        { id: 'lime', label: 'Lime', rgb: '163 255 0', hex: '#a3ff00' },
        { id: 'orange', label: 'Orange', rgb: '249 115 22', hex: '#f97316' },
        { id: 'purple', label: 'Purple', rgb: '155 79 245', hex: '#9b4ff5' },
        { id: 'blue', label: 'Blue', rgb: '56 128 250', hex: '#3880fa' },
        { id: 'white', label: 'White', rgb: '230 230 230', hex: '#e6e6e6' },
    ];
    const [accentId, setAccentId] = useState(() => localStorage.getItem('pl-accent') || 'lime');
    const applyAccent = (color: typeof ACCENT_COLORS[0]) => {
        document.documentElement.style.setProperty('--primary', color.rgb);
        document.documentElement.style.setProperty('--accent-green', color.rgb);
        localStorage.setItem('pl-accent', color.id);
        setAccentId(color.id);
    };
    // CSS filter to tint the SVG logo to match accent color
    const LOGO_FILTERS: Record<string, string> = {
        lime: 'brightness(0) saturate(100%) invert(91%) sepia(50%) saturate(600%) hue-rotate(40deg) brightness(110%)',
        orange: 'brightness(0) saturate(100%) invert(60%) sepia(90%) saturate(800%) hue-rotate(10deg) brightness(105%)',
        purple: 'brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(700%) hue-rotate(255deg) brightness(100%)',
        blue: 'brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(700%) hue-rotate(200deg) brightness(120%)',
        white: 'brightness(0) invert(1)',
    };
    const logoFilter = LOGO_FILTERS[accentId] ?? LOGO_FILTERS['lime'];
    // Restore persisted accent on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('pl-accent');
        if (saved) {
            const found = [{ id: 'lime', rgb: '163 255 0' }, { id: 'orange', rgb: '249 115 22' }, { id: 'purple', rgb: '155 79 245' }, { id: 'blue', rgb: '56 128 250' }, { id: 'white', rgb: '230 230 230' }].find(c => c.id === saved);
            if (found) document.documentElement.style.setProperty('--primary', found.rgb);
        }
    }, []);
    const [bookieTab, setBookieTab] = useState<'all' | 'sportsbook' | 'dfs' | 'other'>('all');
    const bookieRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const user = getCurrentUser();
    const isPremiumUser = user?.isPremium || (user?.email && isAdminEmail(user.email));
    const [shakeAIPick, setShakeAIPick] = useState(false);

    const handleAIPickClick = () => {
        if (!isPremiumUser && hasExceededQuota) {
            setShakeAIPick(true);
            setTimeout(() => setShakeAIPick(false), 500);
            return;
        }
        onAIPick?.();
    };

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    }, [isDark]);

    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close bookie dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (bookieRef.current && !bookieRef.current.contains(e.target as Node)) {
                setIsBookieOpen(false);
            }
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [currentView]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const navLinkClass = (view: ViewType, hoverColor = 'hover:text-primary') =>
        `text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${currentView === view
            ? 'text-primary border-b-2 border-primary pb-1'
            : `text-text-muted ${hoverColor}`}`;

    // Count of enabled books for badge
    const enabledCount = Object.values(enabledBooks).filter(Boolean).length;

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 border-b border-border-muted bg-background-dark/90 backdrop-blur-md px-3 md:px-6 py-2 md:py-3 transition-transform duration-500 ${isVisible ? 'translate-y-0' : '-translate-y-full'} max-w-[100vw]`}>
            <div className="max-w-[1536px] mx-auto flex items-center justify-between gap-3 md:gap-4">

                {/* ── Logo ── */}
                <div className="flex items-center gap-3 sm:gap-6 xl:gap-10 min-w-0">
                    <a
                        className="flex items-center gap-3 text-primary cursor-pointer group shrink-0"
                        onClick={(e) => { e.preventDefault(); setCurrentView('home' as ViewType); }}
                    >
                        <img
                            src="/picklabs-logo.svg"
                            alt="PickLabs Logo"
                            className="h-10 md:h-14 w-auto shrink-0 transition-all duration-300 group-hover:scale-105"
                        />
                    </a>

                    {/* ── Desktop Nav ── */}
                    <nav className="hidden xl:flex items-center gap-2 xl:gap-5">
                        <a className={navLinkClass('live-board')} onClick={(e) => { e.preventDefault(); setCurrentView('live-board'); }}>Live Board</a>
                        <a
                            className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${currentView === 'precision-hub' ? 'text-yellow-400 border-b-2 border-yellow-400 pb-1' : 'text-yellow-500/70 hover:text-yellow-400'}`}
                            onClick={(e) => { e.preventDefault(); setCurrentView('precision-hub'); }}
                        >
                            <span className="material-symbols-outlined text-[14px]">bolt</span>
                            Precision Hub
                        </a>
                        <a
                            className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${currentView === 'sportsbook' ? 'text-[#A3FF00] border-b-2 border-[#A3FF00] pb-1' : 'text-text-muted hover:text-[#A3FF00]'}`}
                            onClick={(e) => { e.preventDefault(); setCurrentView('sportsbook'); }}
                        >
                            <span className="material-symbols-outlined text-[14px]">casino</span>
                            Sportsbook
                        </a>
                        <a className={navLinkClass('matchup-terminal')} onClick={(e) => { e.preventDefault(); setCurrentView('matchup-terminal'); }}>Matchup Terminal</a>
                        <a className={navLinkClass('teams-directory')} onClick={(e) => { e.preventDefault(); setCurrentView('teams-directory'); }}>Teams</a>
                        <a className={navLinkClass('player-directory')} onClick={(e) => { e.preventDefault(); setCurrentView('player-directory'); }}>Players</a>
                        <a className={navLinkClass('sharp-tools')} onClick={(e) => { e.preventDefault(); setCurrentView('sharp-tools'); }}>Sharp Tools</a>
                        <a className={navLinkClass('bankroll')} onClick={(e) => { e.preventDefault(); setCurrentView('bankroll'); }}>Bankroll</a>
                        <a className={navLinkClass('social-dashboard')} onClick={(e) => { e.preventDefault(); setCurrentView('social-dashboard'); }}>Dashboard</a>

                        <div className="h-4 w-px bg-border-muted mx-1" />

                        <a
                            className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${currentView === 'popular-bets' ? 'text-orange-500 border-b-2 border-orange-500 pb-1' : 'text-orange-500/70 hover:text-orange-400'}`}
                            onClick={(e) => { e.preventDefault(); setCurrentView('popular-bets'); }}
                        >
                            <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                            Popular
                        </a>
                        <a
                            className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${currentView === 'saved-picks' ? 'text-primary border-b-2 border-primary pb-1' : 'text-text-muted hover:text-primary'}`}
                            onClick={(e) => { e.preventDefault(); setCurrentView('saved-picks'); }}
                        >
                            <span className="material-symbols-outlined text-[14px]">bookmark</span>
                            Saved
                        </a>
                        <a
                            className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${currentView === 'value-finder' ? 'text-accent-blue border-b-2 border-accent-blue pb-1' : 'text-text-muted hover:text-accent-blue'}`}
                            onClick={(e) => { e.preventDefault(); setCurrentView('value-finder'); }}
                        >
                            <span className="material-symbols-outlined text-[14px]">manage_search</span>
                            Value Finder
                        </a>
                    </nav>
                </div>

                {/* ── Right Controls ── */}
                <div className="flex items-center gap-2 shrink-0">

                    <div className="hidden sm:block">
                    </div>

                    {/* AI Pick My Bets — icon only on < xl, full pill on xl+ */}
                    <button
                        onClick={handleAIPickClick}
                        disabled={isAIPickLoading}
                        title={isAIPickLoading ? 'Analyzing...' : 'AI Pick My Bets'}
                        className={`
                            hidden md:flex items-center justify-center border transition-all transform hover:scale-105 active:scale-95
                            h-8 w-8 rounded xl:w-auto xl:px-4 xl:py-2 xl:rounded-full xl:gap-2
                            ${shakeAIPick
                                ? 'animate-shake border-red-500 text-red-500 bg-red-500/10'
                                : 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple hover:bg-accent-purple hover:text-white'}
                            ${isAIPickLoading && !shakeAIPick ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        <span className={`material-symbols-outlined text-sm ${isAIPickLoading ? 'animate-spin' : ''}`}>smart_toy</span>
                        <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest">{isAIPickLoading ? 'Analyzing...' : 'AI Pick My Bets'}</span>
                    </button>

                    {/* ── SETTINGS & PROFILE ── */}
                    <div className="relative hidden md:block" ref={settingsRef}>
                        <button
                            onClick={() => setIsSettingsOpen(prev => !prev)}
                            title="Settings & Profile"
                            aria-label="Settings & Profile"
                            className={`h-8 w-8 shrink-0 rounded border flex items-center justify-center cursor-pointer transition-all ${isSettingsOpen
                                ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                : 'bg-neutral-800 border-border-muted text-text-muted hover:bg-neutral-700 hover:text-text-main'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">settings</span>
                        </button>

                        {/* Settings Dropdown Panel */}
                        {isSettingsOpen && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-72 bg-white dark:bg-neutral-900 border border-border-muted rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden z-50 animate-in">
                                {/* Header / User Info */}
                                <div className="px-4 py-4 border-b border-border-muted bg-neutral-50 dark:bg-neutral-900/80 flex flex-col gap-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 flex items-center justify-center p-0.5 rounded-full bg-neutral-800 border border-border-muted overflow-hidden shrink-0">
                                            {user?.email && isAdminEmail(user.email) ? (
                                                <img src="/src/assets/avatars/admin_avatar.png" alt="Admin Avatar" className="w-full h-full object-contain transition-[filter] duration-400 ease-in-out" style={{ filter: logoFilter }} />
                                            ) : user?.isPremium ? (
                                                <img src="/src/assets/avatars/premium_plus_avatar.png" alt="Premium Avatar" className="w-full h-full object-contain transition-[filter] duration-400 ease-in-out" style={{ filter: logoFilter }} />
                                            ) : (
                                                <img src="/src/assets/avatars/free_avatar.png" alt="Free Avatar" className="w-full h-full object-contain transition-[filter] duration-400 ease-in-out" style={{ filter: logoFilter }} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <p className="text-xs font-black text-text-main truncate">{user?.email || 'Free Account'}</p>
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">
                                                {user?.email && isAdminEmail(user.email) ? 'Admin' : user?.isPremium ? 'Premium Plan' : 'Free Account'}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Plan Badge */}
                                    <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-white/10 shadow-inner">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Billing Cycle</span>
                                            <span className="text-xs font-black text-white">{user?.isPremium ? 'Yearly ($199/yr)' : 'Monthly ($0/mo)'}</span>
                                        </div>
                                        {user?.email && isAdminEmail(user.email) && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    {!isPremiumUser && (
                                        <div className="mt-2 -mx-1">
                                            <FreeModeQuotaMeter />
                                        </div>
                                    )}
                                </div>

                                {/* Menu Items */}
                                <div className="py-2 flex flex-col">
                                    {/* App Settings Toggles */}
                                    <div className="px-4 py-3 border-b border-border-muted flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined text-[16px] ${isRookieModeActive ? 'text-yellow-400' : 'text-slate-400'}`}>school</span>
                                            <span className="text-xs font-bold text-text-main">Rookie Mode</span>
                                        </div>
                                        <button
                                            aria-label="Toggle Rookie Mode"
                                            onClick={() => {
                                                if (!user?.isPremium && hasExceededQuota && !isRookieModeActive) {
                                                    setShakeRookieMode(true);
                                                    setTimeout(() => setShakeRookieMode(false), 500);
                                                    return;
                                                }
                                                toggleRookieMode();
                                                if (isRookieModeActive) setIsGlossaryOpen(false);
                                            }}
                                            className={`relative h-5 w-9 rounded-full border transition-all duration-300 ${shakeRookieMode ? 'animate-shake border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : isRookieModeActive ? 'bg-yellow-400/20 border-yellow-400/60' : 'bg-neutral-800 border-border-muted'}`}
                                        >
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-300 ${isRookieModeActive ? 'translate-x-4 bg-yellow-400' : 'translate-x-0.5 bg-slate-600'}`} />
                                            {!isRookieModeActive && (
                                                <span className="absolute -top-1 -right-1 z-10">
                                                    <PulsingBeacon color="yellow" alwaysVisible />
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    {isRookieModeActive && (
                                        <button
                                            onClick={() => {
                                                setIsGlossaryOpen(o => !o);
                                                setIsSettingsOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 border-b border-border-muted hover:bg-white/5 transition-colors text-left"
                                        >
                                            <span className="material-symbols-outlined text-[16px] text-yellow-500">menu_book</span>
                                            <span className="text-xs font-bold text-yellow-500">Open Betting Glossary</span>
                                        </button>
                                    )}
                                    {/* Accent Color Picker */}
                                    <div className="px-4 py-3 border-b border-border-muted">
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <span className="material-symbols-outlined text-[16px] text-slate-400">palette</span>
                                            <span className="text-xs font-bold text-text-main">Accent Color</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {ACCENT_COLORS.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => applyAccent(c)}
                                                    title={c.label}
                                                    className={`h-7 w-7 rounded-full border-2 transition-all ${accentId === c.id
                                                        ? 'border-white scale-110 shadow-lg'
                                                        : 'border-neutral-700 hover:border-neutral-400 hover:scale-105'
                                                        }`}
                                                    style={{ backgroundColor: c.hex }}
                                                />
                                            ))}
                                            {/* Reset / clear swatch */}
                                            <button
                                                onClick={() => applyAccent({ id: 'lime', label: 'Lime', rgb: '163 255 0', hex: '#a3ff00' })}
                                                title="Reset to default (Lime)"
                                                className={`h-7 w-7 rounded-full border-2 border-dashed transition-all ${accentId === 'lime'
                                                    ? 'border-neutral-600 scale-100'
                                                    : 'border-neutral-600 hover:border-neutral-300 hover:scale-105'
                                                    }`}
                                                style={{
                                                    background: 'repeating-conic-gradient(#444 0% 25%, transparent 0% 50%) 0 0 / 6px 6px',
                                                }}
                                            />
                                            <span className="text-[8px] text-text-muted font-bold uppercase tracking-widest ml-1 capitalize">{accentId}</span>
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 border-b border-border-muted flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-[16px] text-slate-400">dark_mode</span>
                                            <span className="text-xs font-bold text-text-main">Dark Mode</span>
                                        </div>
                                        <button
                                            aria-label="Toggle Dark Mode"
                                            onClick={() => setIsDark(!isDark)}
                                            className={`relative h-5 w-9 rounded-full border transition-all duration-300 ${isDark ? 'bg-primary/20 border-primary/60' : 'bg-neutral-800 border-border-muted'}`}
                                        >
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-300 ${isDark ? 'translate-x-4 bg-primary' : 'translate-x-0.5 bg-slate-600'}`} />
                                        </button>
                                    </div>

                                    <div className="px-4 py-3 border-b border-border-muted flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-[16px] text-slate-400">notifications</span>
                                            <span className="text-xs font-bold text-text-main">Push Notifications</span>
                                        </div>
                                        <button
                                            aria-label="Toggle Push Notifications"
                                            className="relative h-5 w-9 rounded-full border transition-all duration-300 bg-primary/20 border-primary/60"
                                        >
                                            <div className="absolute top-0.5 h-4 w-4 rounded-full transition-all duration-300 translate-x-4 bg-primary" />
                                        </button>
                                    </div>

                                    {/* Live Bets Tracker Toggle */}
                                    <div className="px-4 py-3 border-b border-border-muted flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-[16px] text-slate-400">monitoring</span>
                                            <span className="text-xs font-bold text-text-main">Live Bets</span>
                                        </div>
                                        <button
                                            aria-label="Toggle Live Bets Tracker"
                                            onClick={toggleLiveBets}
                                            className={`relative h-5 w-9 rounded-full border transition-all duration-300 ${isLiveBetsActive ? 'bg-primary/20 border-primary/60' : 'bg-neutral-800 border-border-muted'}`}
                                        >
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-300 ${isLiveBetsActive ? 'translate-x-4 bg-primary' : 'translate-x-0.5 bg-slate-600'}`} />
                                        </button>
                                    </div>

                                    {/* Admin Only: Analytics & Master Panel */}
                                    {user?.email && isAdminEmail(user.email) && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setCurrentView('admin-analytics');
                                                    setIsSettingsOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 border-b border-border-muted hover:bg-primary/10 transition-colors text-left text-primary"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">monitoring</span>
                                                <span className="text-xs font-bold uppercase tracking-widest">Admin Analytics</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setCurrentView('admin-panel');
                                                    setIsSettingsOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 border-b border-border-muted hover:bg-red-500/10 transition-colors text-left text-red-500"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                                                <span className="text-xs font-bold uppercase tracking-widest">Master Admin Panel</span>
                                            </button>
                                        </>
                                    )}

                                    {/* Account Settings / Portal */}
                                    <button
                                        onClick={() => {
                                            setCurrentView('account-settings');
                                            setIsSettingsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 border-b border-border-muted hover:bg-white/5 transition-colors text-left"
                                    >
                                        <span className="material-symbols-outlined text-[16px] text-accent-blue">manage_accounts</span>
                                        <span className="text-xs font-bold text-text-main">Account Portal</span>
                                    </button>

                                    {/* Actions */}
                                    <button
                                        onClick={() => {
                                            alert("Bug Reporter opening... (Developer Hook)");
                                            setIsSettingsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                                    >
                                        <span className="material-symbols-outlined text-[16px] text-orange-400">bug_report</span>
                                        <span className="text-xs font-bold text-text-main">Report a Bug</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            clearAuth();
                                            logout();
                                            setCurrentView('login-page');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left text-red-400 group"
                                    >
                                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">logout</span>
                                        <span className="text-xs font-bold">Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── BOOKIE MANAGER — icon + dropdown ── */}
                    <div className="relative" ref={bookieRef}>
                        <button
                            onClick={() => setIsBookieOpen(prev => !prev)}
                            title="Sportsbook Manager"
                            aria-label="Sportsbook Manager"
                            className={`h-8 w-8 shrink-0 rounded border flex items-center justify-center cursor-pointer transition-all relative
                                ${isBookieOpen
                                    ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_10px_rgba(13,242,13,0.2)]'
                                    : 'bg-neutral-800 border-border-muted text-text-muted hover:bg-neutral-700 hover:text-text-main'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">store</span>
                            {/* Badge: shows number of disabled books */}
                            {enabledCount < SPORTSBOOKS.length && (
                                <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-red-500 text-[8px] font-black text-white flex items-center justify-center leading-none">
                                    {SPORTSBOOKS.length - enabledCount}
                                </span>
                            )}
                        </button>

                        {/* ── Dropdown Panel ── */}
                        {isBookieOpen && (
                            <div className="absolute right-0 sm:right-0 -mr-12 sm:mr-0 top-[calc(100%+8px)] w-[90vw] sm:w-72 max-w-[320px] bg-white dark:bg-neutral-900 border border-border-muted rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden z-50 animate-in">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-border-muted bg-neutral-50 dark:bg-neutral-900/80 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-base">store</span>
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-main">Bookie Manager</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={enableAll}
                                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                                        >All On</button>
                                        <span className="text-border-muted">·</span>
                                        <button
                                            onClick={disableAll}
                                            className="text-[9px] font-black uppercase tracking-widest text-text-muted hover:text-red-400 transition-colors"
                                        >All Off</button>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-border-muted text-[9px] font-black uppercase tracking-widest">
                                    {(['all', 'sportsbook', 'dfs', 'other'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setBookieTab(tab)}
                                            className={`flex-1 py-2 transition-colors ${bookieTab === tab
                                                ? 'text-primary border-b-2 border-primary'
                                                : 'text-slate-500 hover:text-text-main'
                                                }`}
                                        >
                                            {tab === 'all' ? 'Any' : tab === 'sportsbook' ? 'Books' : tab === 'dfs' ? 'DFS' : 'Other'}
                                        </button>
                                    ))}
                                </div>

                                {/* Status line */}
                                <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-950/50 border-b border-border-muted">
                                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">
                                        <span className="text-primary">{enabledCount}</span> of {SPORTSBOOKS.length} books active · odds &amp; slip reflect selection
                                    </p>
                                </div>

                                {/* Book rows */}
                                <ul className="py-2 max-h-72 overflow-y-auto custom-scrollbar">
                                    {SPORTSBOOKS.filter(b => bookieTab === 'all' || b.category === bookieTab).map(book => {
                                        const on = enabledBooks[book.id];
                                        return (
                                            <li
                                                key={book.id}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer group"
                                                onClick={() => toggleBook(book.id)}
                                            >
                                                {/* Favicon logo */}
                                                <div
                                                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${on ? 'opacity-100' : 'opacity-30 grayscale'}`}
                                                    style={{ backgroundColor: book.color }}
                                                >
                                                    <img
                                                        src={`https://www.google.com/s2/favicons?domain=${book.domain}&sz=64`}
                                                        alt={book.name}
                                                        className="h-4 w-4 object-contain"
                                                    />
                                                </div>

                                                {/* Name */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-[11px] font-black uppercase tracking-wide transition-colors ${on ? 'text-neutral-900 dark:text-text-main' : 'text-slate-400 dark:text-slate-600'}`}>
                                                        {book.name}
                                                    </p>
                                                    <p className="text-[9px] text-text-muted font-bold">{book.domain}</p>
                                                </div>

                                                {/* Sleek toggle */}
                                                <div
                                                    className={`relative h-5 w-9 rounded-full border transition-all duration-300 shrink-0
                                                        ${on
                                                            ? 'bg-primary/20 border-primary/60 shadow-[0_0_8px_rgba(13,242,13,0.3)]'
                                                            : 'bg-neutral-800 border-border-muted'
                                                        }`}
                                                >
                                                    <div
                                                        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-300 shadow-sm
                                                            ${on
                                                                ? 'translate-x-4 bg-primary shadow-[0_0_6px_rgba(13,242,13,0.5)]'
                                                                : 'translate-x-0.5 bg-slate-600'
                                                            }`}
                                                    />
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Footer note */}
                                <div className="px-4 py-3 border-t border-border-muted bg-neutral-50 dark:bg-neutral-950/40">
                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center italic">
                                        Toggling a book hides it from bet slip &amp; odds tables
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Hamburger — mobile only */}
                    <button
                        title="Toggle Mobile Menu"
                        aria-label="Toggle Mobile Menu"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="xl:hidden h-10 w-10 flex items-center justify-center rounded-lg bg-neutral-800 border border-border-muted text-text-main hover:bg-neutral-700 transition"
                    >
                        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            {/* ── Mobile / Tablet Dropdown Menu ── */}
            {isMobileMenuOpen && (
                <div className="xl:hidden absolute top-full left-0 right-0 bg-background-dark/95 backdrop-blur-xl border-b border-border-muted shadow-2xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {/* Primary Nav Grid */}
                    <nav className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <a className={`text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'live-board' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('live-board'); }}>Live Board</a>
                        <a className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'precision-hub' ? 'text-yellow-400' : 'text-yellow-500/70 hover:text-yellow-400'}`} onClick={(e) => { e.preventDefault(); setCurrentView('precision-hub'); }}>
                            <span className="material-symbols-outlined text-[14px]">bolt</span> Precision Hub
                        </a>
                        <a className={`text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'matchup-terminal' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('matchup-terminal'); }}>Matchup</a>
                        <a className={`text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'teams-directory' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('teams-directory'); }}>Teams</a>
                        <a className={`text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'player-directory' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('player-directory'); }}>Players</a>
                        <a className={`text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'sharp-tools' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('sharp-tools'); }}>Sharp Tools</a>
                        <a className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'sportsbook' ? 'text-[#A3FF00]' : 'text-text-muted hover:text-[#A3FF00]'}`} onClick={(e) => { e.preventDefault(); setCurrentView('sportsbook'); }}>
                            <span className="material-symbols-outlined text-[14px]">casino</span> Sportsbook
                        </a>
                        <a className={`text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'bankroll' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('bankroll'); }}>Bankroll</a>
                        <a className={`text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'social-dashboard' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('social-dashboard'); }}>Dashboard</a>

                        {/* Secondary Nav Grid Items */}
                        <a className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'popular-bets' ? 'text-orange-500' : 'text-orange-500/70 hover:text-orange-400'}`} onClick={(e) => { e.preventDefault(); setCurrentView('popular-bets'); }}>
                            <span className="material-symbols-outlined text-[14px]">local_fire_department</span> Popular
                        </a>
                        <a className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'saved-picks' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('saved-picks'); }}>
                            <span className="material-symbols-outlined text-[14px]">bookmark</span> Saved
                        </a>
                        <a className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'value-finder' ? 'text-accent-blue' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('value-finder'); }}>
                            <span className="material-symbols-outlined text-[14px]">manage_search</span> Value Finder
                        </a>
                    </nav>

                    <div className="h-px bg-border-muted w-full my-1" />

                    <div className="flex flex-col gap-2 relative pb-4">
                        <button title="AI Pick My Bets" aria-label="AI Pick My Bets" onClick={onAIPick} disabled={isAIPickLoading} className={`flex items-center justify-center gap-2 px-4 py-2 bg-accent-purple/20 border border-accent-purple/40 rounded-lg text-accent-purple hover:bg-accent-purple hover:text-white transition text-[10px] font-black uppercase tracking-widest ${isAIPickLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            <span className={`material-symbols-outlined text-[16px] ${isAIPickLoading ? 'animate-spin' : ''}`}>smart_toy</span>
                            {isAIPickLoading ? 'Analyzing...' : 'AI Pick My Bets'}
                        </button>

                        {/* Mobile Settings Section */}
                        <div className="bg-neutral-900 border border-border-muted rounded-xl overflow-hidden mt-1">
                            <div className="p-4 border-b border-border-muted bg-black/20 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex items-center justify-center p-0.5 rounded-full bg-neutral-800 border border-border-muted overflow-hidden shrink-0">
                                        {user?.email && isAdminEmail(user.email) ? (
                                            <img src="/src/assets/avatars/admin_avatar.png" alt="Admin Avatar" className="w-full h-full object-contain" />
                                        ) : user?.isPremium ? (
                                            <img src="/src/assets/avatars/premium_plus_avatar.png" alt="Premium Avatar" className="w-full h-full object-contain" />
                                        ) : (
                                            <img src="/src/assets/avatars/free_avatar.png" alt="Free Avatar" className="w-full h-full object-contain" />
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-black text-white truncate">{user?.email || 'Free Account'}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.email && isAdminEmail(user.email) ? 'Admin' : user?.isPremium ? 'Premium · Yearly' : 'Free Account'}</span>
                                    </div>
                                </div>
                                {!isPremiumUser && (
                                    <div className="w-full">
                                        <FreeModeQuotaMeter />
                                    </div>
                                )}
                            </div>
                            <button onClick={() => {
                                if (!user?.isPremium && hasExceededQuota && !isRookieModeActive) {
                                    setShakeRookieMode(true);
                                    setTimeout(() => setShakeRookieMode(false), 500);
                                    return;
                                }
                                toggleRookieMode();
                                if (isRookieModeActive) setIsGlossaryOpen(false);
                            }} className="w-full flex items-center justify-between px-3 py-2 border-b border-border-muted active:bg-white/5">
                                <div className="flex items-center gap-2 relative">
                                    <span className={`material-symbols-outlined text-[16px] ${isRookieModeActive ? 'text-yellow-400' : 'text-slate-400'}`}>school</span>
                                    <span className="text-[10px] font-bold text-text-main uppercase tracking-widest">Rookie Mode</span>
                                </div>
                                <div className={`relative h-4 w-7 rounded-full border transition-all duration-300 ${shakeRookieMode ? 'animate-shake border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : isRookieModeActive ? 'bg-yellow-400/20 border-yellow-400/60' : 'bg-neutral-800 border-border-muted'}`}>
                                    <div className={`absolute top-px h-3 w-3 rounded-full transition-all duration-300 ${isRookieModeActive ? 'translate-x-3.5 bg-yellow-400' : 'translate-x-[1px] bg-slate-600'}`} />
                                    {!isRookieModeActive && (
                                        <span className="absolute -top-1 -right-1 z-10 scale-[0.6]">
                                            <PulsingBeacon color="yellow" alwaysVisible />
                                        </span>
                                    )}
                                </div>
                            </button>
                            {
                                isRookieModeActive && (
                                    <button onClick={() => { setIsGlossaryOpen(o => !o); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 border-b border-border-muted active:bg-white/5 text-yellow-500">
                                        <span className="material-symbols-outlined text-[16px]">menu_book</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Open Glossary</span>
                                    </button>
                                )
                            }
                            <button aria-label="Toggle Dark Mode" title="Toggle Dark Mode" onClick={() => setIsDark(!isDark)} className="w-full flex items-center justify-between px-3 py-2 border-b border-border-muted active:bg-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">{isDark ? 'light_mode' : 'dark_mode'}</span>
                                    <span className="text-[10px] font-bold text-text-main uppercase tracking-widest">Dark Mode</span>
                                </div>
                                <div className={`relative h-4 w-7 rounded-full border transition-all duration-300 ${isDark ? 'bg-primary/20 border-primary/60' : 'bg-neutral-800 border-border-muted'}`}>
                                    <div className={`absolute top-px h-3 w-3 rounded-full transition-all duration-300 ${isDark ? 'translate-x-3.5 bg-primary' : 'translate-x-[1px] bg-slate-600'}`} />
                                </div>
                            </button>

                            {/* Mobile Accent Colors */}
                            <div className="w-full flex justify-between items-center px-3 py-2 border-b border-border-muted bg-neutral-800/20">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">palette</span>
                                    <span className="text-[10px] font-bold text-text-main uppercase tracking-widest">Colors</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    {ACCENT_COLORS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => applyAccent(c)}
                                            title={c.label}
                                            aria-label={`Select ${c.label} Accent`}
                                            className={`h-5 w-5 rounded-full border transition-all ${accentId === c.id
                                                ? 'border-white scale-110 shadow-sm'
                                                : 'border-neutral-700'
                                                }`}
                                            style={{ backgroundColor: c.hex }}
                                        />
                                    ))}
                                    <button
                                        onClick={() => applyAccent({ id: 'lime', label: 'Lime', rgb: '163 255 0', hex: '#a3ff00' })}
                                        title="Reset to Lime"
                                        aria-label="Reset to Lime Accent"
                                        className={`h-5 w-5 rounded-full border border-dashed transition-all ${accentId === 'lime'
                                            ? 'border-neutral-500 scale-100'
                                            : 'border-neutral-600'
                                            }`}
                                        style={{
                                            background: 'repeating-conic-gradient(#444 0% 25%, transparent 0% 50%) 0 0 / 4px 4px',
                                        }}
                                    />
                                </div>
                            </div>

                            <button aria-label="Toggle Live Bets" title="Toggle Live Bets" onClick={toggleLiveBets} className="w-full flex items-center justify-between px-3 py-2 border-b border-border-muted active:bg-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-slate-400">monitoring</span>
                                    <span className="text-[10px] font-bold text-text-main uppercase tracking-widest">Live Bets</span>
                                </div>
                                <div className={`relative h-4 w-7 rounded-full border transition-all duration-300 ${isLiveBetsActive ? 'bg-primary/20 border-primary/60' : 'bg-neutral-800 border-border-muted'}`}>
                                    <div className={`absolute top-px h-3 w-3 rounded-full transition-all duration-300 ${isLiveBetsActive ? 'translate-x-3.5 bg-primary' : 'translate-x-[1px] bg-slate-600'}`} />
                                </div>
                            </button>

                            <div className="grid grid-cols-2 text-center divide-x divide-border-muted border-b border-border-muted">
                                <button onClick={() => { setCurrentView('account-settings'); setIsMobileMenuOpen(false); }} className="w-full flex flex-col items-center justify-center gap-1 p-2 active:bg-white/5 text-accent-blue">
                                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Account</span>
                                </button>
                                <button onClick={() => alert("Bug Reporter opening...")} className="w-full flex flex-col items-center justify-center gap-1 p-2 active:bg-white/5 text-orange-400">
                                    <span className="material-symbols-outlined text-[18px]">bug_report</span>
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Report Bug</span>
                                </button>
                            </div>

                            <button onClick={() => { clearAuth(); logout(); setCurrentView('login-page'); }} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 active:bg-red-500/10 text-red-400 bg-neutral-900/50">
                                <span className="material-symbols-outlined text-[16px]">logout</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ── Rookie Glossary Drawer ── */}
            {isRookieModeActive && isGlossaryOpen && (
                <div className="fixed top-[var(--header-h,112px)] left-0 right-0 z-40 bg-neutral-900 border-b border-yellow-500/30 shadow-[0_8px_40px_rgba(250,204,21,0.12)] animate-slide-down">
                    <div className="max-w-screen-2xl mx-auto px-4 py-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-400 text-lg">menu_book</span>
                                <h3 className="text-xs font-black text-yellow-400 uppercase tracking-[0.2em]">Rookie Betting Glossary</h3>
                                <span className="text-[9px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full font-bold">
                                    {GLOSSARY_TERMS.length} Terms
                                </span>
                            </div>
                            <button
                                onClick={() => setIsGlossaryOpen(false)}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                            {GLOSSARY_TERMS.map((g) => (
                                <div key={g.term} className="bg-neutral-900 border border-yellow-500/30 rounded-xl p-3 hover:border-yellow-400/70 transition-colors group">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="material-symbols-outlined text-yellow-400 text-sm group-hover:text-yellow-300 transition-colors">{g.icon}</span>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{g.term}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed mb-2">{g.definition}</p>
                                    {g.example && (
                                        <div className="bg-neutral-800 rounded p-2 border border-yellow-500/20">
                                            <span className="text-[8px] font-bold text-yellow-400/80 uppercase tracking-widest block mb-0.5">Example</span>
                                            <p className="text-[10px] text-slate-300 italic">{g.example}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};
