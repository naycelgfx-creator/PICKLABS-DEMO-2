import React, { useState, useEffect } from 'react';
import { ViewType } from '../shared/PremiumLockView';
import { cn } from '../../lib/utils';
import { REAL_TEAMS } from '../../data/mockGames';


interface HomeDashboardViewProps {
    onNavigate: (view: ViewType) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ onNavigate }) => {
    const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);

    useEffect(() => {
        try {
            const savedTeams = localStorage.getItem('favorite_teams');
            if (savedTeams) {
                setFavoriteTeams(JSON.parse(savedTeams));
            }
        } catch (e) {
            console.error('Failed to parse favorite teams:', e);
        }
    }, []);

    // Get favorite teams details
    const favoriteTeamDetails = favoriteTeams.map(teamId => {
        const [sport, abbr] = teamId.split('-');
        const sportTeams = REAL_TEAMS[sport] || [];
        const teamObj = sportTeams.find(t => t.abbr === abbr);
        return {
            id: teamId,
            sport,
            ...teamObj
        };
    }).filter(t => t.name);




    return (
        <div className="flex-1 w-full bg-[#0A0A0A] min-h-screen text-slate-100 overflow-y-auto font-display pb-12 custom-scrollbar">
            <div className="px-4 md:px-8 space-y-8 max-w-[1600px] mx-auto pt-6">
                
                {/* ── DASHBOARD HEADER ── */}
                <header className="flex flex-col gap-8 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button className="w-10 h-10 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[20px]">tune</span>
                            </button>
                            <button className="w-10 h-10 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                            </button>
                            <button className="w-10 h-10 rounded-full bg-[#A3FF00] flex items-center justify-center text-black hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined font-bold text-[20px]">add</span>
                            </button>
                        </div>
                    </div>

                    {/* ── SPORT RIBBON ── */}
                    <div className="flex items-center gap-8 overflow-x-auto pb-6 scrollbar-hide">
                        {[
                            { name: 'Popular', icon: 'local_fire_department', active: true },
                            { name: 'Live', icon: 'schedule', live: true },
                            { name: 'Soccer', icon: 'sports_soccer' },
                            { name: 'Basketball', icon: 'sports_basketball' },
                            { name: 'Football', icon: 'sports_football' },
                            { name: 'Tennis', icon: 'sports_tennis' },
                            { name: 'Baseball', icon: 'sports_baseball' },
                            { name: 'Hockey', icon: 'sports_hockey' },
                            { name: 'Golf', icon: 'golf_course' },
                            { name: 'Fighting', icon: 'sports_mma' },
                        ].map((sport, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 cursor-pointer group shrink-0">
                                <div className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center relative transition-all duration-300",
                                    sport.active ? "bg-[#1c1c1c] border-2 border-slate-700 shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "bg-neutral-900 border border-white/5 group-hover:border-white/20"
                                )}>
                                    <span className={cn(
                                        "material-symbols-outlined text-[20px]",
                                        sport.active ? "text-white" : "text-slate-400 group-hover:text-white"
                                    )}>
                                        {sport.icon}
                                    </span>
                                    {sport.live && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0A0A0A] animate-pulse" />
                                    )}
                                    {i % 4 === 0 && !sport.active && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0A0A0A]" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] uppercase font-black tracking-widest transition-colors",
                                    sport.active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                                )}>
                                    {sport.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </header>

                {favoriteTeamDetails.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                        {/* LEFT COLUMN: Balance & Combos */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Balance Card */}
                            <div className="terminal-panel !bg-[#121212]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Balance</span>
                                    <span className="text-[10px] font-black text-[#A3FF00]">+13%, 14 MAY 2025</span>
                                </div>
                                
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-yellow-500 text-[24px]">stat_0</span>
                                    </div>
                                    <span className="text-4xl font-black text-white">$2,460</span>
                                </div>

                                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-black text-slate-500 mb-1">Games</div>
                                        <div className="text-sm font-black text-white">290</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-black text-slate-500 mb-1">Win</div>
                                        <div className="text-sm font-black text-white">160</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-black text-slate-500 mb-1">Loss</div>
                                        <div className="text-sm font-black text-white">160</div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Combo Card */}
                            <div className="terminal-panel !bg-[#121212] !p-0 overflow-hidden group">
                                <div className="p-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-red-500 text-[20px]">star</span>
                                            </div>
                                            <div>
                                                <h3 className="text-[11px] font-black uppercase text-white tracking-widest">6 Bet Combo: Flex Mode</h3>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase">Entry Amount - $500.00</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-white/10 text-white text-[9px] font-black uppercase tracking-widest">Hit</div>
                                    </div>

                                    <div className="space-y-4 mb-4">
                                        {[
                                            { team: 'Manchester United', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png', score: '0 4 6' },
                                            { team: 'FC Barcelona', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png', score: '0 2 1' },
                                            { team: 'FC Barcelona', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png', score: '0 2 1' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between group/item">
                                                <div className="flex items-center gap-3">
                                                    <img src={item.logo} alt="" className="w-8 h-8 object-contain" />
                                                    <span className="text-[10px] font-black text-slate-300 uppercase truncate w-24">{item.team}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex gap-1">
                                                        {[0, 1, 2].map(dot => <div key={dot} className="w-1.5 h-1.5 rounded-full bg-slate-700" />)}
                                                    </div>
                                                    <span className="text-xs font-black text-white font-mono tracking-widest">{item.score}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-[#A3FF00]/10 border-t border-[#A3FF00]/20 p-4 text-center">
                                    <span className="text-[10px] font-black text-[#A3FF00] uppercase tracking-[0.2em]">Potential Winnings</span>
                                </div>
                            </div>
                        </div>

                        {/* MIDDLE COLUMN: Matches & Feed */}
                        <div className="lg:col-span-6 space-y-6">
                            {/* Calendar & League Nav */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-neutral-900/50 p-2 rounded-full border border-white/5">
                                    {['SUN 27', 'MON 28', 'TUE 29', 'WED 30', 'THR 1', 'FRI 2', 'SAT 3'].map((day, i) => (
                                        <div key={i} className={cn(
                                            "flex flex-col items-center justify-center px-4 py-2 rounded-full transition-all cursor-pointer",
                                            day.includes('WED 30') ? "bg-[#A3FF00] text-black" : "text-slate-500 hover:text-white"
                                        )}>
                                            <span className="text-[8px] font-black uppercase mb-1">{day.split(' ')[0]}</span>
                                            <span className="text-xs font-black">{day.split(' ')[1]}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide px-2">
                                    {[
                                        { name: 'UEFA', icon: 'https://a.espncdn.com/i/teamlogos/soccer/500/2.png' },
                                        { name: 'Premier League', icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png' },
                                        { name: 'MLS', icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/10.png' },
                                        { name: 'EFL', icon: 'https://a.espncdn.com/i/leaguelogos/soccer/500/24.png' }
                                    ].map((league, i) => (
                                        <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#121212] border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                                            <img src={league.icon} alt={league.name} className="w-5 h-5 object-contain opacity-60 group-hover:opacity-100" />
                                            <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-widest">{league.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glow-divider" />

                            {/* Live Match Feed */}
                            <div className="space-y-4">
                                {[
                                    { home: 'FC BM', away: 'MANUTD', score: '0 - 2', time: '1ST 32:32', status: 'LOSE', hLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png', aLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png' },
                                    { home: 'FCB', away: 'BVB', score: '3 - 0', time: '1ST 32:32', status: 'WIN', hLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png', aLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png' },
                                ].map((match, i) => (
                                    <div key={i} className="terminal-panel !bg-[#121212] !p-6 cursor-pointer hover:border-white/10 transition-all">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-8 flex-1">
                                                <div className="flex flex-col items-center gap-2">
                                                    <img src={match.aLogo} alt="" className="w-12 h-12 object-contain" />
                                                    <span className="text-[10px] font-black uppercase text-slate-400">{match.away}</span>
                                                </div>
                                                <div className="flex flex-col items-center flex-1">
                                                    <div className="flex lg:hidden items-center gap-1 mb-1">
                                                        <div className="w-1 h-1 rounded-full bg-red-500" />
                                                        <span className="text-[8px] font-black text-red-500 uppercase">Live</span>
                                                    </div>
                                                    <span className="text-3xl font-black text-white">{match.score}</span>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase mt-1">{match.time}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-2">
                                                    <img src={match.hLogo} alt="" className="w-12 h-12 object-contain" />
                                                    <span className="text-[10px] font-black uppercase text-slate-400">{match.home}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3, 4].map(av => (
                                                        <img key={av} src={`https://i.pravatar.cc/40?img=${av + i * 5}`} className="w-6 h-6 rounded-full border-2 border-[#121212]" alt="" />
                                                    ))}
                                                    <div className="w-6 h-6 rounded-full bg-neutral-800 border-2 border-[#121212] flex items-center justify-center text-[7px] font-black">1.2K</div>
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">People placed a bet</span>
                                            </div>
                                            <div className={cn(
                                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                match.status === 'WIN' ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                            )}>
                                                {match.status}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Video & Tracker */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Live Video Panel */}
                            <div className="terminal-panel !bg-[#121212] !p-0 overflow-hidden relative aspect-video lg:aspect-square flex flex-col group">
                                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-[#A3FF00] rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-black uppercase">Live</span>
                                </div>
                                <div className="absolute top-4 right-4 z-20 flex gap-2">
                                    <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[16px]">closed_caption</span>
                                    </button>
                                    <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-[16px]">cast</span>
                                    </button>
                                </div>

                                <div className="flex-1 relative overflow-hidden">
                                    <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80" alt="Live Match" className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl">
                                            <span className="material-symbols-outlined text-white text-[24px] translate-x-0.5">pause</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Match Tracker/Odds Card */}
                            <div className="terminal-panel !bg-[#121212]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <img src="https://a.espncdn.com/i/teamlogos/soccer/500/2.png" className="w-6 h-6 object-contain" alt="" />
                                        <span className="text-[11px] font-black uppercase tracking-widest text-white">UEFA</span>
                                    </div>
                                    <div className="flex -space-x-3">
                                        <img src="https://a.espncdn.com/i/teamlogos/soccer/500/360.png" className="w-6 h-6 rounded-full border-2 border-[#121212]" alt="" />
                                        <div className="w-6 h-6 rounded-full bg-neutral-800 border-2 border-[#121212] flex items-center justify-center text-[7px] font-black">vs</div>
                                        <img src="https://a.espncdn.com/i/teamlogos/soccer/500/132.png" className="w-6 h-6 rounded-full border-2 border-[#121212]" alt="" />
                                    </div>
                                </div>

                                <div className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">00:43:43</div>
                                
                                <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-8">
                                    <div className="absolute h-full bg-[#A3FF00] rounded-full shadow-[0_0_10px_#A3FF00]" style={{ width: '65%' }} />
                                    <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-[#121212]" />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { label: '-3.5', odds: '120' },
                                        { label: 'o12.5', odds: '-30' },
                                        { label: '-29', odds: '', active: true }
                                    ].map((odd, i) => (
                                        <button key={i} className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all h-16",
                                            odd.active 
                                                ? "bg-[#A3FF00] border-[#A3FF00] text-black shadow-[0_0_20px_rgba(163,255,0,0.3)]" 
                                                : "bg-white/5 border-white/5 text-white hover:border-white/20"
                                        )}>
                                            <span className="text-xs font-black">{odd.label}</span>
                                            {odd.odds && <span className="text-[8px] font-black opacity-60">{odd.odds}</span>}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="flex items-center justify-between mt-6 border-t border-white/5 pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-[10px] font-black text-slate-400">Q1 10:21</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400">FOX</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400">Q1 10:21</span>
                                        <span className="material-symbols-outlined text-[14px] text-red-500">videocam</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ) : (
                    // ZERO STATE: No favorite teams
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-900 border border-neutral-800 rounded-[3.5rem]">
                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-slate-500">sports_football</span>
                        </div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">No Favorites Yet</h2>
                        <p className="text-slate-400 max-w-md mx-auto mb-8">
                            Select your favorite teams to see personalized upcoming games, news, and tailored AI parlays right here on your dashboard.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => onNavigate('sport-selection')}
                                className="px-6 py-3 bg-primary text-black text-sm font-black uppercase tracking-widest rounded-full hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(13,242,13,0.3)]"
                            >
                                Setup Basecamp
                            </button>
                            <button
                                onClick={() => onNavigate('live-board')}
                                className="px-6 py-3 bg-neutral-800 border border-neutral-700 text-sm font-bold uppercase tracking-widest rounded-full hover:bg-neutral-700 hover:text-white transition-all"
                            >
                                Go to Live Board
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
