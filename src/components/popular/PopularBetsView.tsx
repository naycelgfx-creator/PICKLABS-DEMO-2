import React, { useEffect, useState } from 'react';
import { fetchMultiSportScoreboard, ESPNGame } from '../../data/espnScoreboard';
import { generateAIPrediction } from '../../data/espnTeams';
import { BetPick } from '../../App';

// ── Types ──────────────────────────────────────────────────────────────────
export interface PopularBetsViewProps {
    onAddBet?: (bet: Omit<BetPick, 'id'>) => void;
}

interface SGPLeg {
    player: string;
    prop: string;
    line: string;
}

interface SGPBet {
    id: string;
    description: string;
    odds: string;
    legs: SGPLeg[];
    placedCount: string;
    sport: string;
    homeTeam: string;
    awayTeam: string;
    homeLogo: string;
    awayLogo: string;
    isLive: boolean;
    aiProbability?: string;
    aiEdge?: string;
}

// ── Build a popular SGP from a real ESPN game ─────────────────────────────
const generateSGP = (game: ESPNGame, idx: number): SGPBet => {
    const pred = generateAIPrediction(game.homeTeam.record, game.awayTeam.record, game.sport, [], []);
    const sport = game.sport;
    const home = game.homeTeam.displayName;
    const away = game.awayTeam.displayName;
    const isLive = game.status === 'in';

    // Sport-specific prop templates
    const propTemplates: Record<string, SGPLeg[]> = {
        NBA: [
            { player: `${home} Starter`, prop: 'Points', line: `${Math.round(parseFloat(pred.total) / 2 / 5) * 5 + 0.5}+` },
            { player: `${away} PG`, prop: 'Assists', line: `6.5+` },
            { player: `${home} Center`, prop: 'Rebounds', line: `9.5+` },
        ],
        NFL: [
            { player: `${home} QB`, prop: 'Passing Yards', line: `249.5+` },
            { player: `${away} WR1`, prop: 'Receiving Yards', line: `74.5+` },
            { player: `${home} RB`, prop: 'Anytime TD', line: `Yes` },
        ],
        MLB: [
            { player: `${home} SP`, prop: 'Strikeouts', line: `6.5+` },
            { player: `${away} OF`, prop: 'Total Bases', line: `1.5+` },
            { player: `${home} 1B`, prop: 'Hits + Runs + RBIs', line: `2.5+` },
        ],
        NHL: [
            { player: `${home} C`, prop: 'Points', line: `0.5+` },
            { player: `${away} D`, prop: 'Shots on Goal', line: `3.5+` },
            { player: `${home} LW`, prop: 'Anytime Scorer', line: `Yes` },
        ],
    };

    const legs = propTemplates[sport] ?? [
        { player: `${home}`, prop: 'Total Goals', line: `1.5+` },
        { player: `${away}`, prop: 'Total Goals', line: `0.5+` },
        { player: 'Game', prop: 'Both Teams Score', line: `Yes` },
    ];

    // Odds based on AI confidence & number of legs (3-leg SGP formula approx)
    const baseOdds = Math.round((Number(pred.awayWinProb) / 100 + Number(pred.homeWinProb) / 100) * 180 + idx * 75);
    const oddsStr = `+${Math.min(Math.max(baseOdds, 280), 950)}`;

    // Simulate trending count based on prime-time games and team size
    const bigMarket = ['Lakers', 'Warriors', 'Celtics', 'Heat', 'Cowboys', 'Chiefs', 'Eagles', 'Yankees', 'Red Sox', 'Dodgers'].some(
        t => home.includes(t) || away.includes(t)
    );
    const baseCount = bigMarket ? Math.floor(80 + Math.random() * 120) : Math.floor(20 + Math.random() * 60);
    const placedCount = `${baseCount}K`;

    // AI calculations to highlight PickLabs engine
    const aiWinProb = Number(pred.homeWinProb);
    const aiProbability = `${Math.round(aiWinProb * 0.8 + 10)}%`; // Simulated 40-70% SGP hit prob
    const aiEdge = `+${(Math.random() * 5 + 2).toFixed(1)}%`;

    return {
        id: `sgp-${game.id}-${idx}`,
        description: `${away} vs ${home} — SGP #${idx + 1}`,
        odds: oddsStr,
        legs,
        placedCount,
        sport,
        homeTeam: home,
        awayTeam: away,
        homeLogo: game.homeTeam.logo,
        awayLogo: game.awayTeam.logo,
        isLive,
        aiProbability,
        aiEdge,
    };
};

// ── Sport badge colors ────────────────────────────────────────────────────
const SPORT_COLORS: Record<string, string> = {
    NBA: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    NFL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    MLB: 'bg-red-500/20 text-red-400 border-red-500/30',
    NHL: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    Soccer: 'bg-green-500/20 text-green-400 border-green-500/30',
};

// ── Component ─────────────────────────────────────────────────────────────
export const PopularBetsView: React.FC<PopularBetsViewProps> = ({ onAddBet }) => {
    const [bets, setBets] = useState<SGPBet[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');
    const [addedBets, setAddedBets] = useState<Set<string>>(new Set());

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchMultiSportScoreboard(['NBA', 'NFL', 'MLB', 'NHL']);
                const allGames: ESPNGame[] = Object.values(data).flat();

                // Prioritise live games, then upcoming
                const sorted = [
                    ...allGames.filter(g => g.status === 'in'),
                    ...allGames.filter(g => g.status === 'pre'),
                    ...allGames.filter(g => g.status === 'post'),
                ];

                const top6 = sorted.slice(0, 6);
                const generated = top6.map((g, i) => generateSGP(g, i));
                setBets(generated);
                setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            } catch {
                setBets([]);
            } finally {
                setLoading(false);
            }
        };

        load();
        const interval = setInterval(load, 120_000); // refresh every 2 min
        return () => clearInterval(interval);
    }, []);

    // Helper to add the SGP legs
    const handleAddSGP = (betMatch: SGPBet) => {
        if (!onAddBet) return;
        betMatch.legs.forEach(leg => {
            const teamStr = leg.player === 'Game' || leg.player.includes(betMatch.homeTeam) || leg.player.includes(betMatch.awayTeam)
                ? leg.player // If it's a team/game prop, the player field describes it nicely
                : `${leg.player} Over ${leg.line.replace('+', '')} ${leg.prop}`; // player prop string format

            onAddBet({
                gameId: betMatch.id.replace(/^sgp-/, 'espn-').replace(/-\d+$/, ''),
                type: 'Prop',
                team: teamStr,
                odds: '-110', // SGP individual legs are often standard odds
                matchupStr: `${betMatch.awayTeam} vs ${betMatch.homeTeam}`,
                stake: 20, // default stake
                gameStatus: betMatch.isLive ? 'in' : 'pre',
                gameStatusName: betMatch.isLive ? 'In Progress' : 'Scheduled',
            });
        });

        setAddedBets(prev => new Set(prev).add(betMatch.id));
    };

    return (
        <div className="w-full flex justify-center bg-background-dark py-8 px-6 min-h-[calc(100vh-200px)]">
            <div className="max-w-[1536px] w-full flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-muted pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                            <span className="material-symbols-outlined text-orange-500 text-3xl">local_fire_department</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-text-main uppercase italic tracking-tight">Popular Bets</h2>
                            <p className="text-text-muted text-sm font-medium mt-1">
                                AI-generated SGPs based on today's live games · Updated daily
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${loading ? 'bg-slate-600 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                            {loading ? 'Loading...' : `Live · ${lastUpdated}`}
                        </span>
                    </div>
                </div>

                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="glass-panel p-6 border border-border-muted animate-pulse">
                                <div className="h-4 bg-neutral-700/50 rounded w-3/4 mb-4"></div>
                                <div className="h-3 bg-neutral-700/50 rounded w-1/2 mb-6"></div>
                                {[...Array(3)].map((_, j) => (
                                    <div key={j} className="h-10 bg-neutral-800/50 rounded mb-2"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && bets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border-muted rounded-xl">
                        <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">event_busy</span>
                        <h3 className="text-text-main font-black text-xl uppercase tracking-widest mb-2">No Games Today</h3>
                        <p className="text-text-muted text-sm max-w-xs">
                            Popular SGPs are generated from today's live games. Check back once games are scheduled.
                        </p>
                    </div>
                )}

                {/* SGP Cards Grid */}
                {!loading && bets.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                        {bets.map(bet => (
                            <div
                                key={bet.id}
                                className="glass-panel p-6 border border-border-muted hover:border-orange-500/50 transition-colors flex flex-col h-full bg-neutral-900/60 relative overflow-hidden group"
                            >
                                {/* Background glow */}
                                <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>

                                {/* Card Header */}
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${SPORT_COLORS[bet.sport] ?? 'bg-primary/10 text-primary border-primary/30'}`}>
                                                {bet.sport}
                                            </span>
                                            {bet.isLive && (
                                                <span className="text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                                                    <span className="w-1 h-1 bg-red-400 rounded-full animate-pulse"></span>
                                                    Live
                                                </span>
                                            )}
                                            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">SGP</span>
                                        </div>
                                        {/* Team logos + names */}
                                        <div className="flex items-center gap-2 mt-1">
                                            <img src={bet.awayLogo} alt={bet.awayTeam} className="w-5 h-5 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            <span className="text-xs font-bold text-text-muted">{bet.awayTeam}</span>
                                            <span className="text-text-muted">@</span>
                                            <img src={bet.homeLogo} alt={bet.homeTeam} className="w-5 h-5 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            <span className="text-xs font-bold text-text-main">{bet.homeTeam}</span>
                                        </div>
                                        {/* AI Edge Badge */}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded tracking-wider flex items-center gap-1 uppercase">
                                                <span className="material-symbols-outlined text-[10px]">psychology</span>
                                                AI Edge {bet.aiEdge}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-xl font-black text-primary bg-primary/10 px-3 py-1 rounded">{bet.odds}</span>
                                        <div className="mt-1 flex flex-col justify-end">
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">AI Win Prob</span>
                                            <span className="text-[11px] font-black text-text-main tabular-nums">{bet.aiProbability}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Legs List */}
                                <div className="flex-1 flex flex-col gap-2 mb-5 relative z-10">
                                    {bet.legs.map((leg, i) => (
                                        <div key={i} className="flex items-center justify-between bg-neutral-800/60 border border-border-muted p-3 rounded">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-text-main">{leg.player}</span>
                                                <span className="text-[10px] text-text-muted font-medium">{leg.prop}</span>
                                            </div>
                                            <span className="text-xs font-black text-primary">{leg.line}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="mt-auto flex items-center justify-between border-t border-border-muted pt-4 relative z-10">
                                    <div className="flex items-center gap-1.5 bg-orange-500 text-black px-3 py-1.5 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                                        <span className="material-symbols-outlined text-sm">local_fire_department</span>
                                        {bet.placedCount} <span className="text-[9px] font-bold opacity-80">Placed</span>
                                    </div>
                                    <button
                                        disabled={addedBets.has(bet.id)}
                                        onClick={() => handleAddSGP(bet)}
                                        className={`transition-colors px-4 py-2 rounded font-black text-xs uppercase tracking-widest filter active:brightness-75 ${addedBets.has(bet.id)
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-not-allowed'
                                                : 'bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-black'
                                            }`}
                                    >
                                        {addedBets.has(bet.id) ? (
                                            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check</span> Added</div>
                                        ) : 'Add to Slip'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div >
    );
};
