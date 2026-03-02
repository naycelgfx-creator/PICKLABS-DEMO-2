import React, { useState, useEffect, useRef } from 'react';
import { useRookieMode } from '../../contexts/RookieModeContext';
import { useLiveBets } from '../../contexts/LiveBetsContext';
import { useSportsbooks, SPORTSBOOKS } from '../../contexts/SportsbookContext';
import { PulsingBeacon } from '../ui/PulsingBeacon';
import { ViewType } from '../../App';
import { getCurrentUser, isAdminEmail } from '../../data/PickLabsAuthDB';
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
    const { isRookieModeActive, toggleRookieMode } = useRookieMode();
    const { isLiveBetsActive, toggleLiveBets } = useLiveBets();
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
    const [bookieTab, setBookieTab] = useState<'all' | 'sportsbook' | 'dfs' | 'other'>('all');
    const bookieRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const user = getCurrentUser();

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
        <header className={`fixed top-0 left-0 right-0 z-50 border-b border-border-muted bg-background-dark/90 backdrop-blur-md px-4 md:px-6 py-3 transition-transform duration-500 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="max-w-[1536px] mx-auto flex items-center justify-between gap-4">

                {/* ── Logo ── */}
                <div className="flex items-center gap-6 xl:gap-10 min-w-0">
                    <a
                        className="flex items-center gap-3 text-primary cursor-pointer group shrink-0"
                        onClick={(e) => { e.preventDefault(); setCurrentView('landing-page' as ViewType); }}
                    >
                        <img
                            src="/picklabs-logo.svg"
                            alt="PickLabs Logo"
                            className="h-14 w-auto shrink-0 transition-all duration-300 group-hover:scale-105"
                        />
                    </a>

                    {/* ── Desktop Nav ── */}
                    <nav className="hidden lg:flex items-center gap-5">
                        <a className={navLinkClass('live-board')} onClick={(e) => { e.preventDefault(); setCurrentView('live-board'); }}>Live Board</a>
                        <a
                            className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${currentView === 'sportsbook' ? 'text-[#A3FF00] border-b-2 border-[#A3FF00] pb-1' : 'text-text-muted hover:text-[#A3FF00]'}`}
                            onClick={(e) => { e.preventDefault(); setCurrentView('sportsbook'); }}
                        >
                            <span className="material-symbols-outlined text-[14px]">casino</span>
                            Sportsbook
                        </a>
                        <a className={navLinkClass('matchup-terminal')} onClick={(e) => { e.preventDefault(); setCurrentView('matchup-terminal'); }}>Matchup Terminal</a>
                        <a className={navLinkClass('teams-directory')} onClick={(e) => { e.preventDefault(); setCurrentView('teams-directory'); }}>Teams</a>
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



                    {/* AI Pick My Bets — icon only on < xl, full pill on xl+ */}
                    <button
                        onClick={onAIPick}
                        disabled={isAIPickLoading}
                        title={isAIPickLoading ? 'Analyzing...' : 'AI Pick My Bets'}
                        className={`
                            hidden md:flex items-center justify-center bg-accent-purple/20 border border-accent-purple/40 text-accent-purple hover:bg-accent-purple hover:text-white transition-all transform hover:scale-105 active:scale-95
                            ${isAIPickLoading ? 'opacity-70 cursor-not-allowed' : ''}
                            h-8 w-8 rounded xl:w-auto xl:px-4 xl:py-2 xl:rounded-full xl:gap-2
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
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-blue to-purple-600 flex items-center justify-center shadow-inner">
                                            <span className="material-symbols-outlined text-white text-xl">person</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-text-main truncate">{user?.email || 'Free Account'}</p>
                                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                                                {user?.isPremium ? 'Premium Plan' : 'Free Account'}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Plan Badge */}
                                    <div className="flex justify-between items-center mt-2 bg-black/20 p-2 rounded-lg border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Billing Cycle</span>
                                            <span className="text-[11px] font-black text-white">{user?.isPremium ? 'Yearly ($199/yr)' : 'Monthly ($0/mo)'}</span>
                                        </div>
                                        {user?.email && isAdminEmail(user.email) && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                                Admin
                                            </span>
                                        )}
                                    </div>
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
                                                toggleRookieMode();
                                                if (isRookieModeActive) setIsGlossaryOpen(false);
                                            }}
                                            className={`relative h-5 w-9 rounded-full border transition-all duration-300 ${isRookieModeActive ? 'bg-yellow-400/20 border-yellow-400/60' : 'bg-neutral-800 border-border-muted'}`}
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
                    <div className="relative hidden md:block" ref={bookieRef}>
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
                            <div className="absolute right-0 top-[calc(100%+8px)] w-72 bg-white dark:bg-neutral-900 border border-border-muted rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden z-50 animate-in">
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
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="xl:hidden h-10 w-10 flex items-center justify-center rounded-lg bg-neutral-800 border border-border-muted text-text-main hover:bg-neutral-700 transition"
                    >
                        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            {/* ── Mobile / Tablet Dropdown Menu ── */}
            {isMobileMenuOpen && (
                <div className="xl:hidden absolute top-full left-0 right-0 bg-background-dark/95 backdrop-blur-xl border-b border-border-muted shadow-2xl p-6 flex flex-col gap-6 max-h-[calc(100vh-60px)] overflow-y-auto">
                    <nav className="flex flex-col gap-4">
                        <a className={`text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'live-board' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('live-board'); }}>Live Board</a>
                        <a className={`text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'matchup-terminal' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('matchup-terminal'); }}>Matchup Terminal</a>
                        <a className={`text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'teams-directory' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('teams-directory'); }}>Teams</a>
                        <a className={`text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'sharp-tools' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('sharp-tools'); }}>Sharp Tools</a>
                        <a className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'sportsbook' ? 'text-green-400' : 'text-text-muted hover:text-green-400'}`} onClick={(e) => { e.preventDefault(); setCurrentView('sportsbook'); }}>
                            <span className="material-symbols-outlined text-sm">casino</span> Sportsbook
                        </a>
                        <a className={`text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'bankroll' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('bankroll'); }}>Bankroll</a>
                        <a className={`text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'social-dashboard' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('social-dashboard'); }}>Dashboard</a>
                        <div className="h-px bg-border-muted my-2" />
                        <a className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'popular-bets' ? 'text-orange-500' : 'text-orange-500/70 hover:text-orange-400'}`} onClick={(e) => { e.preventDefault(); setCurrentView('popular-bets'); }}>
                            <span className="material-symbols-outlined text-sm">local_fire_department</span> Popular
                        </a>
                        <a className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'saved-picks' ? 'text-primary' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('saved-picks'); }}>
                            <span className="material-symbols-outlined text-sm">bookmark</span> Saved
                        </a>
                        <a className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest cursor-pointer transition ${currentView === 'value-finder' ? 'text-accent-blue' : 'text-text-muted hover:text-white'}`} onClick={(e) => { e.preventDefault(); setCurrentView('value-finder'); }}>
                            <span className="material-symbols-outlined text-sm">manage_search</span> Value Finder
                        </a>
                    </nav>

                    <div className="h-px bg-border-muted w-full" />

                    <div className="flex flex-col gap-3">
                        <button onClick={onAIPick} disabled={isAIPickLoading} className={`flex items-center justify-center gap-2 px-4 py-3 bg-accent-purple/20 border border-accent-purple/40 rounded-lg text-accent-purple hover:bg-accent-purple hover:text-white transition text-xs font-black uppercase tracking-widest ${isAIPickLoading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            <span className={`material-symbols-outlined text-sm ${isAIPickLoading ? 'animate-spin' : ''}`}>smart_toy</span>
                            {isAIPickLoading ? 'Analyzing...' : 'AI Pick My Bets'}
                        </button>
                        {/* Mobile Settings Section */}
                        <div className="bg-neutral-900 border border-border-muted rounded-xl overflow-hidden mt-2">
                            <div className="px-4 py-3 border-b border-border-muted flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-blue to-purple-600 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-[16px]">person</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-text-main">{user?.email}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user?.isPremium ? 'Premium · Yearly' : 'Free Account'}</span>
                                </div>
                            </div>
                            <button onClick={() => { toggleRookieMode(); if (isRookieModeActive) setIsGlossaryOpen(false); }} className="w-full flex items-center justify-between px-4 py-3 border-b border-border-muted active:bg-white/5">
                                <div className="flex items-center gap-2 relative">
                                    <span className={`material-symbols-outlined text-sm ${isRookieModeActive ? 'text-yellow-400' : 'text-slate-400'}`}>school</span>
                                    <span className="text-[11px] font-bold text-text-main">Rookie Mode</span>
                                </div>
                                <div className={`relative h-4 w-8 rounded-full border transition-all duration-300 ${isRookieModeActive ? 'bg-yellow-400/20 border-yellow-400/60' : 'bg-neutral-800 border-border-muted'}`}>
                                    <div className={`absolute top-px h-3 w-3 rounded-full transition-all duration-300 ${isRookieModeActive ? 'translate-x-4 bg-yellow-400' : 'translate-x-px bg-slate-600'}`} />
                                    {!isRookieModeActive && (
                                        <span className="absolute -top-1 -right-1 z-10 scale-75">
                                            <PulsingBeacon color="yellow" alwaysVisible />
                                        </span>
                                    )}
                                </div>
                            </button>
                            {isRookieModeActive && (
                                <button onClick={() => { setIsGlossaryOpen(o => !o); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-3 border-b border-border-muted active:bg-white/5 text-yellow-500">
                                    <span className="material-symbols-outlined text-sm">menu_book</span>
                                    <span className="text-[11px] font-bold">Open Glossary</span>
                                </button>
                            )}
                            <button onClick={() => setIsDark(!isDark)} className="w-full flex items-center justify-between px-4 py-3 border-b border-border-muted active:bg-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-400">{isDark ? 'light_mode' : 'dark_mode'}</span>
                                    <span className="text-[11px] font-bold text-text-main">Dark Mode</span>
                                </div>
                                <div className={`relative h-4 w-8 rounded-full border transition-all duration-300 ${isDark ? 'bg-primary/20 border-primary/60' : 'bg-neutral-800 border-border-muted'}`}>
                                    <div className={`absolute top-px h-3 w-3 rounded-full transition-all duration-300 ${isDark ? 'translate-x-4 bg-primary' : 'translate-x-px bg-slate-600'}`} />
                                </div>
                            </button>
                            <button onClick={toggleLiveBets} className="w-full flex items-center justify-between px-4 py-3 border-b border-border-muted active:bg-white/5">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-400">monitoring</span>
                                    <span className="text-[11px] font-bold text-text-main">Live Bets</span>
                                </div>
                                <div className={`relative h-4 w-8 rounded-full border transition-all duration-300 ${isLiveBetsActive ? 'bg-primary/20 border-primary/60' : 'bg-neutral-800 border-border-muted'}`}>
                                    <div className={`absolute top-px h-3 w-3 rounded-full transition-all duration-300 ${isLiveBetsActive ? 'translate-x-4 bg-primary' : 'translate-x-px bg-slate-600'}`} />
                                </div>
                            </button>
                            <button onClick={() => alert("Bug Reporter opening...")} className="w-full flex items-center gap-2 px-4 py-3 border-b border-border-muted active:bg-white/5 text-orange-400">
                                <span className="material-symbols-outlined text-sm">bug_report</span>
                                <span className="text-[11px] font-bold">Report Bug</span>
                            </button>
                            <button onClick={() => { clearAuth(); setCurrentView('login-page'); }} className="w-full flex items-center gap-2 px-4 py-3 active:bg-red-500/10 text-red-400">
                                <span className="material-symbols-outlined text-sm">logout</span>
                                <span className="text-[11px] font-bold">Sign Out</span>
                            </button>
                        </div>

                        {/* Mobile Bookie Manager */}
                        <div className="bg-neutral-900 border border-border-muted rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-border-muted flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-sm">store</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-main">Bookie Manager</span>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={enableAll} className="text-[9px] font-black text-primary uppercase tracking-widest">All On</button>
                                    <button onClick={disableAll} className="text-[9px] font-black text-text-muted uppercase tracking-widest hover:text-red-400">All Off</button>
                                </div>
                            </div>
                            {SPORTSBOOKS.map(book => {
                                const on = enabledBooks[book.id];
                                return (
                                    <div
                                        key={book.id}
                                        className="flex items-center gap-3 px-4 py-2.5 border-b border-border-muted last:border-none active:bg-white/5"
                                        onClick={() => toggleBook(book.id)}
                                    >
                                        <div className={`h-6 w-6 rounded flex items-center justify-center shrink-0 ${on ? 'opacity-100' : 'opacity-30 grayscale'}`} style={{ backgroundColor: book.color }}>
                                            <img src={`https://www.google.com/s2/favicons?domain=${book.domain}&sz=64`} alt={book.name} className="h-3 w-3 object-contain" />
                                        </div>
                                        <span className={`text-[11px] font-bold flex-1 ${on ? 'text-text-main' : 'text-slate-600'}`}>{book.name}</span>
                                        <div className={`relative h-5 w-9 rounded-full border transition-all duration-300 ${on ? 'bg-primary/20 border-primary/60' : 'bg-neutral-800 border-border-muted'}`}>
                                            <div className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-300 ${on ? 'translate-x-4 bg-primary' : 'translate-x-0.5 bg-slate-600'}`} />
                                        </div>
                                    </div>
                                );
                            })}
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
