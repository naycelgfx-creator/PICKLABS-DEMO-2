import React, { useState } from 'react';
import { ViewType } from '../shared/PremiumLockView';
import { cn } from '../../lib/utils';
import { ChevronRight, ChevronLeft, ChevronDown, Zap, TrendingUp, DollarSign, BarChart2, Target, Link2, Trophy } from 'lucide-react';

interface SportSelectionViewProps {
    onNavigate: (view: ViewType) => void;
}

interface League {
    id: string;
    name: string;
    image: string;
    badge?: 'live' | 'hot';
}

interface Sport {
    id: string;
    name: string;
    image: string;
    leagues?: League[];
    leagueAccent?: string;
}

const BET_TYPES = [
    { id: 'moneyline', label: 'Moneyline', Icon: DollarSign, color: 'text-primary', desc: 'Pick the winner' },
    { id: 'spreads', label: 'Spreads', Icon: BarChart2, color: 'text-accent-blue', desc: 'Cover the line' },
    { id: 'totals', label: 'Totals', Icon: Target, color: 'text-accent-cyan', desc: 'Over / Under' },
    { id: 'props', label: 'Player Props', Icon: Zap, color: 'text-accent-purple', desc: 'Player-level bets' },
    { id: 'parlays', label: 'Parlays', Icon: Link2, color: 'text-yellow-400', desc: 'Multi-leg tickets' },
    { id: 'futures', label: 'Futures', Icon: Trophy, color: 'text-orange-400', desc: 'Season-long picks' },
];

const MAIN_SPORTS: Sport[] = [
    { id: 'nfl', name: 'NFL', image: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png' },
    { id: 'nba', name: 'NBA', image: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png' },
    { id: 'mlb', name: 'MLB', image: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png' },
    { id: 'nhl', name: 'NHL', image: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png' },
    {
        id: 'ncaa', name: 'NCAA', image: '/ncaa-logo.png', leagueAccent: 'sky',
        leagues: [
            { id: 'ncaaf', name: 'NCAAF', image: '/NCAAF_logo.png', badge: 'hot' },
            { id: 'ncaam', name: 'NCAAM', image: '/NCAAM_logo.png', badge: 'live' },
            { id: 'ncaaw', name: 'NCAAW', image: '/NCAAW_logo.png' },
            { id: 'ncaa-baseball', name: 'NCAAB', image: '/ncaab-baseball-logo.png' },
        ]
    },
    { id: 'wnba', name: 'WNBA', image: '/wnba-logo-orange.png' },
    {
        id: 'nascar', name: 'NASCAR', image: '/nascar-logo.png', leagueAccent: 'yellow',
        leagues: [
            { id: 'nascar-cup', name: 'Cup Series', image: '/nascar-cup.png', badge: 'live' },
            { id: 'nascar-xfinity', name: 'Xfinity', image: '/nascar-xfinity.png', badge: 'hot' },
            { id: 'nascar-trucks', name: 'Trucks', image: '/nascar-truck.png' },
        ]
    },
    {
        id: 'tennis', name: 'Tennis', image: '/wimbledon-logo.png', leagueAccent: 'purple',
        leagues: [
            { id: 'atp', name: 'ATP Tour', image: '/atp_tour.png', badge: 'live' },
            { id: 'wta', name: 'WTA Tour', image: '/wta.png', badge: 'hot' },
            { id: 'wimbledon', name: 'Wimbledon', image: '/wimbledon-logo.png' },
            { id: 'us-open-t', name: 'US Open', image: '/us-open.png' },
        ]
    },
    {
        id: 'soccer', name: 'Soccer', image: '/fifa-logo.png', leagueAccent: 'emerald',
        leagues: [
            { id: 'epl', name: 'EPL', image: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png', badge: 'live' },
            { id: 'mls', name: 'MLS', image: 'https://a.espncdn.com/i/leaguelogos/soccer/500/19.png', badge: 'hot' },
            { id: 'ucl', name: 'Champions', image: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png', badge: 'hot' },
            { id: 'liga', name: 'La Liga', image: '/la_liga.png' },
            { id: 'seria', name: 'Serie A', image: '/serie_a.png' },
            { id: 'bund', name: 'Bundesliga', image: '/bundesliga.png' },
        ]
    },
    { id: 'mma', name: 'UFC', image: '/ufc-logo.png' },
    { id: 'boxing', name: 'Boxing', image: '/boxing-logo.png' },
    {
        id: 'golf', name: 'Golf', image: '/pga-tour-logo.png', leagueAccent: 'lime',
        leagues: [
            { id: 'pga-tour', name: 'PGA Tour', image: '/pga-tour-logo.png', badge: 'live' },
            { id: 'lpga', name: 'LPGA', image: '/lpga.png', badge: 'hot' },
            { id: 'liv', name: 'LIV Golf', image: '/liv_golf.png' },
            { id: 'dp-world', name: 'DP World', image: '/dp_world_tour.png' },
        ]
    },
];

const ACCENT_STYLES: Record<string, { border: string; bg: string; text: string; panelBorder: string; panelBg: string; headerText: string; divider: string }> = {
    sky: { border: 'border-sky-400', bg: 'bg-sky-500/10', text: 'text-sky-400', panelBorder: 'border-sky-400/30', panelBg: 'bg-sky-500/5', headerText: 'text-sky-400', divider: 'bg-sky-400/20' },
    yellow: { border: 'border-yellow-400', bg: 'bg-yellow-500/10', text: 'text-yellow-400', panelBorder: 'border-yellow-400/30', panelBg: 'bg-yellow-500/5', headerText: 'text-yellow-400', divider: 'bg-yellow-400/20' },
    purple: { border: 'border-purple-400', bg: 'bg-purple-500/10', text: 'text-purple-400', panelBorder: 'border-purple-400/30', panelBg: 'bg-purple-500/5', headerText: 'text-purple-400', divider: 'bg-purple-400/20' },
    emerald: { border: 'border-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400', panelBorder: 'border-emerald-400/30', panelBg: 'bg-emerald-500/5', headerText: 'text-emerald-400', divider: 'bg-emerald-400/20' },
    lime: { border: 'border-lime-400', bg: 'bg-lime-500/10', text: 'text-lime-400', panelBorder: 'border-lime-400/30', panelBg: 'bg-lime-500/5', headerText: 'text-lime-400', divider: 'bg-lime-400/20' },
};

const BadgeTag = ({ type }: { type: 'live' | 'hot' }) => (
    <span className={cn(
        "absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
        type === 'live' ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-orange-500/20 text-orange-400 border border-orange-500/40"
    )}>
        {type === 'live' ? <><Zap className="w-2 h-2" /> Live</> : <><TrendingUp className="w-2 h-2" /> Hot</>}
    </span>
);

export const SportSelectionView: React.FC<SportSelectionViewProps> = ({ onNavigate }) => {
    const [selectedSports, setSelectedSports] = useState<string[]>([]);
    const [expandedSport, setExpandedSport] = useState<string | null>(null);
    const [selectedBetTypes, setSelectedBetTypes] = useState<string[]>([]);

    const toggleSport = (id: string) => {
        setSelectedSports(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleBetType = (id: string) => {
        setSelectedBetTypes(prev =>
            prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
        );
    };

    const hasSelection = selectedSports.length > 0;

    const handleNext = () => {
        if (hasSelection) {
            localStorage.setItem('onboarding_sports', JSON.stringify(selectedSports));
            localStorage.setItem('onboarding_bet_types', JSON.stringify(selectedBetTypes));
            onNavigate('team-selection');
        } else {
            onNavigate('home');
        }
    };

    return (
        <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-display selection:bg-primary selection:text-black">
            {/* Top Navigation */}
            <header className="px-6 py-6 flex items-center justify-between border-b border-border-muted/30 max-w-7xl mx-auto w-full relative z-10">
                <img src="/picklabs-full-logo.svg" alt="PickLabs Logo" className="h-16 md:h-24 w-auto cursor-pointer" onClick={() => onNavigate('landing-page')} />
                <button onClick={handleNext} className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 px-4 py-2 rounded-full",
                    hasSelection
                        ? "bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] shadow-[0_0_15px_rgba(13,242,13,0.3)]"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                )}>
                    {hasSelection ? 'Next Page' : 'Skip for now'}
                    <ChevronRight className="w-3 h-3 ml-1" />
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center py-12 px-4 max-w-3xl mx-auto w-full">

                {/* Breadcrumb Steps */}
                <div className="flex items-center gap-6 mb-12 opacity-80">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold ring-1 ring-primary/50">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Plan</span>
                    </div>
                    <div className="w-4 h-[1px] bg-border-muted" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-black shadow-[0_0_10px_rgba(13,242,13,0.3)]">2</div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">Sports</span>
                    </div>
                    <div className="w-4 h-[1px] bg-border-muted" />
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="w-6 h-6 rounded-full bg-neutral-800 text-slate-500 border border-neutral-700 flex items-center justify-center text-xs font-bold">3</div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Teams</span>
                    </div>
                </div>

                <div className="text-center mb-10 space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/30 text-accent-purple text-[9px] font-black uppercase tracking-[0.2em]">
                        <span className="material-symbols-outlined text-[11px]">auto_awesome</span> Optional
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-tight">
                        Personalize your feed
                    </h1>
                    <p className="text-text-muted text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                        Pick the sports you care about so we show the most relevant predictive insights and games first.
                    </p>
                </div>

                {/* Main Sports Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full mb-4">
                    {MAIN_SPORTS.map(sport => {
                        const hasLeagues = !!sport.leagues?.length;
                        const accentKey = sport.leagueAccent ?? 'sky';
                        const accent = ACCENT_STYLES[accentKey];
                        const isExpanded = expandedSport === sport.id;
                        const isSelected = selectedSports.includes(sport.id);
                        const isActive = hasLeagues ? isExpanded : isSelected;

                        return (
                            <button
                                key={sport.id}
                                onClick={() => {
                                    if (hasLeagues) {
                                        setExpandedSport(prev => prev === sport.id ? null : sport.id);
                                    } else {
                                        toggleSport(sport.id);
                                    }
                                }}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all duration-300",
                                    isActive
                                        ? hasLeagues
                                            ? `${accent.bg} ${accent.border} scale-[1.02] shadow-lg`
                                            : "bg-primary/5 border-primary shadow-[0_0_20px_rgba(13,242,13,0.15)] scale-[1.02]"
                                        : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
                                )}
                            >
                                <img
                                    src={sport.image}
                                    alt={sport.name}
                                    className={cn(
                                        "w-16 h-16 object-contain transition-all duration-300",
                                        !isActive && "grayscale opacity-60 mix-blend-luminosity",
                                        isActive && "drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                    )}
                                />
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-wider flex items-center gap-1",
                                    isActive
                                        ? hasLeagues ? `${accent.text} italic` : "text-primary italic"
                                        : "text-slate-400"
                                )}>
                                    {sport.name}
                                    {hasLeagues && (
                                        <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isExpanded && "rotate-180")} />
                                    )}
                                </span>

                                {!hasLeagues && isSelected && (
                                    <div className="absolute top-3 right-3 text-primary">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Sub-league expansion panel — shown below the entire grid */}
                {MAIN_SPORTS.filter(s => s.leagues).map(sport => {
                    const accentKey = sport.leagueAccent ?? 'sky';
                    const accent = ACCENT_STYLES[accentKey];
                    const isExpanded = expandedSport === sport.id;

                    return (
                        <div
                            key={`panel-${sport.id}`}
                            className={cn(
                                "w-full overflow-hidden transition-all duration-500 ease-in-out",
                                isExpanded ? "max-h-[600px] opacity-100 mb-4" : "max-h-0 opacity-0 pointer-events-none"
                            )}
                        >
                            <div className={`border ${accent.panelBorder} rounded-2xl ${accent.panelBg} p-5`}>
                                {/* Panel header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <img src={sport.image} alt={sport.name} className="w-6 h-6 object-contain" />
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${accent.headerText}`}>
                                        {sport.name} Leagues
                                    </span>
                                    <div className={`flex-1 h-[1px] ${accent.divider}`} />
                                </div>
                                {/* League grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {sport.leagues!.map(league => {
                                        const isSelected = selectedSports.includes(league.id);
                                        return (
                                            <button
                                                key={league.id}
                                                onClick={() => toggleSport(league.id)}
                                                className={cn(
                                                    "relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border-2 transition-all duration-300",
                                                    isSelected
                                                        ? `${accent.bg} ${accent.border} scale-[1.02]`
                                                        : "bg-neutral-900/60 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-900"
                                                )}
                                            >
                                                {league.badge && <BadgeTag type={league.badge} />}
                                                <img
                                                    src={league.image}
                                                    alt={league.name}
                                                    className={cn(
                                                        "w-11 h-11 object-contain transition-all duration-300",
                                                        !isSelected && "grayscale opacity-60",
                                                        isSelected && "drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                                    )}
                                                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }}
                                                />
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-wider text-center",
                                                    isSelected ? `${accent.text} italic` : "text-slate-400"
                                                )}>
                                                    {league.name}
                                                </span>
                                                {isSelected && (
                                                    <div className={`absolute top-2 right-2 ${accent.text}`}>
                                                        <span className="material-symbols-outlined text-xs">check_circle</span>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* ─── Betting Preferences ─── */}
                <div className="w-full mt-6 mb-24">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="material-symbols-outlined text-primary text-sm">analytics</span>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">What types of bets do you follow?</h2>
                        <div className="flex-1 h-[1px] bg-white/10" />
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold shrink-0">Optional</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {BET_TYPES.map(bt => {
                            const isActive = selectedBetTypes.includes(bt.id);
                            return (
                                <button
                                    key={bt.id}
                                    onClick={() => toggleBetType(bt.id)}
                                    className={cn(
                                        "relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200",
                                        isActive
                                            ? "bg-primary/10 border-primary shadow-[0_0_12px_rgba(13,242,13,0.15)] scale-[1.01]"
                                            : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
                                    )}
                                >
                                    <bt.Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? bt.color : 'text-slate-500 group-hover:text-slate-400')} />
                                    <div>
                                        <p className={cn("text-xs font-black uppercase tracking-wider", isActive ? "text-primary" : "text-slate-300")}>{bt.label}</p>
                                        <p className="text-[9px] text-slate-500 mt-0.5">{bt.desc}</p>
                                    </div>
                                    {isActive && (
                                        <div className="absolute top-2 right-2 text-primary">
                                            <span className="material-symbols-outlined text-xs">check_circle</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

            </main>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-[#07090D]/90 backdrop-blur-md border-t border-[#1C2333] px-6 py-4 flex items-center justify-between z-20">
                <button
                    onClick={() => onNavigate('pricing-page')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('home')} className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider">Skip</button>
                    <button
                        onClick={handleNext}
                        className={cn(
                            "px-8 py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] italic transition-all flex items-center gap-1",
                            hasSelection
                                ? "bg-primary text-black hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_rgba(13,242,13,0.3)]"
                                : "bg-white text-black hover:bg-gray-200"
                        )}
                    >
                        Next step <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
