import React, { useState, useEffect, useMemo } from 'react';
import { ViewType } from '../shared/PremiumLockView';
import { cn } from '../../lib/utils';
import { ChevronRight, ChevronLeft, Search, X } from 'lucide-react';
import { REAL_TEAMS } from '../../data/mockGames';

interface TeamSelectionViewProps {
    onNavigate: (view: ViewType) => void;
}

const SPORT_ID_MAP: Record<string, string> = {
    'nfl': 'NFL', 'nba': 'NBA', 'mlb': 'MLB', 'nhl': 'NHL',
    'ncaa': 'CFB', 'ncaaf': 'CFB', 'ncaam': 'NCAAB', 'ncaaw': 'NCAAW',
    'ncaa-baseball': 'NCAAB',
    'wnba': 'WNBA', 'mma': 'UFC', 'golf': 'Golf',
    'nascar': 'NASCAR', 'tennis': 'Tennis', 'soccer': 'Soccer',
    'boxing': 'Boxing',
};

const LEAGUE_LOGO: Record<string, string> = {
    'NFL': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
    'NBA': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
    'MLB': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
    'NHL': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
    'WNBA': 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
    'CFB': '/NCAAF_logo.png',
    'NCAAB': '/NCAAM_logo.png',
    'NCAAW': '/NCAAW_logo.png',
    'UFC': '/ufc-logo.png',
    'Golf': '/pga-tour-logo.png',
};

export const TeamSelectionView: React.FC<TeamSelectionViewProps> = ({ onNavigate }) => {
    const [selectedSports, setSelectedSports] = useState<string[]>([]);
    const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        try {
            const saved = localStorage.getItem('onboarding_sports');
            if (saved) setSelectedSports(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

    const toggleTeam = (teamId: string) => {
        setFavoriteTeams(prev =>
            prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
        );
    };

    const handleFinishSetup = () => {
        localStorage.setItem('favorite_teams', JSON.stringify(favoriteTeams));
        onNavigate('home');
    };

    const availableSports = useMemo(() => {
        const sports = selectedSports.map(id => SPORT_ID_MAP[id]).filter(Boolean);
        return sports.length > 0 ? [...new Set(sports)] : null;
    }, [selectedSports]);

    // Filter and group teams
    const visibleGroups = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return Object.entries(REAL_TEAMS)
            .filter(([sportName]) => !availableSports || availableSports.includes(sportName))
            .map(([sportName, teams]) => {
                const filtered = teams.filter(team =>
                    !q
                    || team.name.toLowerCase().includes(q)
                    || team.abbr.toLowerCase().includes(q)
                );
                return { sportName, teams: filtered };
            })
            .filter(g => g.teams.length > 0);
    }, [availableSports, searchQuery]);

    const selectedCount = favoriteTeams.length;

    return (
        <div className="min-h-screen bg-[#07090D] text-slate-100 flex flex-col font-display selection:bg-primary selection:text-black">
            {/* Header */}
            <header className="px-6 py-6 flex items-center justify-between border-b border-[#1C2333] max-w-7xl mx-auto w-full">
                <img src="/picklabs-full-logo.svg" alt="PickLabs Logo" className="h-16 md:h-20 w-auto cursor-pointer" onClick={() => onNavigate('landing-page')} />
                <button onClick={() => onNavigate('home')} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                    Skip for now
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center py-8 px-4 max-w-5xl mx-auto w-full">

                {/* Breadcrumb */}
                <div className="flex items-center gap-6 mb-10 opacity-90">
                    {[
                        { label: 'Plan', done: true },
                        { label: 'Sports', done: true },
                        { label: 'Teams', active: true },
                    ].map((step, i) => (
                        <React.Fragment key={step.label}>
                            {i > 0 && <div className={cn("w-4 h-[1px]", step.done || step.active ? "bg-primary/50" : "bg-border-muted")} />}
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black",
                                    step.done ? "bg-primary/20 text-primary ring-1 ring-primary/50" : "",
                                    step.active ? "bg-primary text-black shadow-[0_0_10px_rgba(13,242,13,0.3)]" : "",
                                    !step.done && !step.active ? "bg-neutral-800 border border-neutral-700 text-slate-500" : "",
                                )}>
                                    {step.done ? <span className="material-symbols-outlined text-[14px]">check</span> : i + 1}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-black uppercase tracking-wider",
                                    step.done ? "text-primary" : step.active ? "text-white" : "text-slate-500"
                                )}>{step.label}</span>
                            </div>
                        </React.Fragment>
                    ))}
                </div>

                {/* Title */}
                <div className="text-center mb-8 space-y-2 w-full">
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tight text-white">
                        Select your favorite teams
                    </h1>
                    <p className="text-text-muted text-sm">
                        We'll highlight games featuring your favourites. This is optional.
                    </p>
                </div>

                {/* Full-width Search Bar */}
                <div className="w-full relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search teams, cities, or abbreviations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0E121B] border-2 border-[#1C2333] focus:border-primary/60 text-white pl-12 pr-12 py-4 rounded-xl text-sm outline-none transition-colors placeholder-slate-600"
                    />
                    {searchQuery && (
                        <button title="Clear search" onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Selection summary pill */}
                {selectedCount > 0 && (
                    <div className="w-full flex items-center justify-between mb-4 px-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                            {selectedCount} team{selectedCount !== 1 ? 's' : ''} selected
                        </span>
                        <button onClick={() => setFavoriteTeams([])} className="text-[10px] text-red-400 hover:text-red-300 uppercase tracking-wider font-bold transition-colors">
                            Clear all
                        </button>
                    </div>
                )}

                {/* Dense Groups */}
                <div className="w-full space-y-10 mb-28">
                    {visibleGroups.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                            <p className="text-sm">No teams found for "{searchQuery}"</p>
                        </div>
                    ) : visibleGroups.map(({ sportName, teams }) => (
                        <div key={sportName} className="w-full">
                            {/* League Header */}
                            <div className="flex items-center gap-3 mb-4 pb-2 border-b border-[#1C2333]">
                                <img
                                    src={LEAGUE_LOGO[sportName] ?? `https://a.espncdn.com/i/teamlogos/leagues/500/${sportName.toLowerCase()}.png`}
                                    alt={sportName}
                                    className="w-7 h-7 object-contain"
                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                                <h2 className="text-sm font-black uppercase tracking-widest text-white">{sportName}</h2>
                                <span className="text-[10px] text-slate-600 font-bold ml-auto">{teams.length} teams</span>
                            </div>

                            {/* Pill-shaped team cards — dense grid */}
                            <div className="flex flex-wrap gap-2">
                                {teams.map(team => {
                                    const teamId = `${sportName}-${team.abbr}`;
                                    const isSelected = favoriteTeams.includes(teamId);
                                    const logoUrl = team.url || `https://a.espncdn.com/i/teamlogos/${sportName.toLowerCase()}/500/${team.abbr.toLowerCase()}.png`;

                                    return (
                                        <button
                                            key={teamId}
                                            onClick={() => toggleTeam(teamId)}
                                            className={cn(
                                                "inline-flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-200 text-left group",
                                                isSelected
                                                    ? "bg-primary/10 border-primary/60 shadow-[0_0_10px_rgba(13,242,13,0.1)]"
                                                    : "bg-[#0E121B] border-[#1C2333] hover:border-slate-600 hover:bg-[#12161f]"
                                            )}
                                        >
                                            <img
                                                src={logoUrl}
                                                alt={team.name}
                                                className={cn(
                                                    "w-5 h-5 object-contain flex-shrink-0 transition-all",
                                                    !isSelected && "grayscale opacity-60 group-hover:opacity-80"
                                                )}
                                                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                                            />
                                            <div className="flex items-baseline gap-1.5 min-w-0">
                                                <span className={cn(
                                                    "text-[11px] font-bold truncate max-w-[120px]",
                                                    isSelected ? "text-white" : "text-slate-300"
                                                )}>
                                                    {team.name}
                                                </span>
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-wider flex-shrink-0",
                                                    isSelected ? "text-primary" : "text-slate-600"
                                                )}>
                                                    {team.abbr}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-primary text-[12px] flex-shrink-0 ml-0.5">check_circle</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-[#07090D]/95 backdrop-blur-md border-t border-[#1C2333] px-6 py-4 flex items-center justify-between z-20">
                <button onClick={() => onNavigate('sport-selection')} className="flex items-center gap-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-wider">
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={() => onNavigate('home')} className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider">Skip</button>
                    <button
                        onClick={handleFinishSetup}
                        className={cn(
                            "px-8 py-3 rounded-lg text-xs font-black uppercase tracking-[0.2em] italic transition-all flex items-center gap-1",
                            selectedCount > 0
                                ? "bg-primary text-black hover:bg-primary/90 hover:scale-105 shadow-[0_0_20px_rgba(13,242,13,0.3)]"
                                : "bg-white text-black hover:bg-gray-200"
                        )}
                    >
                        {selectedCount > 0 ? `Finish (${selectedCount})` : 'Finish Setup'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
