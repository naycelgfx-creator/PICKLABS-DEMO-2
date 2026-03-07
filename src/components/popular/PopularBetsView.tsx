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

export interface SGPBet {
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
    playerHeadshot?: string;
    playerTeamLogo?: string;
    playerTeamAltColor?: string;
    aiProbability?: string;
    aiEdge?: string;
}

// ── Build a popular SGP from a real ESPN game ─────────────────────────────
export const generateSGP = (game: ESPNGame, idx: number): SGPBet => {
    const pred = generateAIPrediction(game.homeTeam.record, game.awayTeam.record, game.sport, [], []);
    const sport = game.sport;
    const home = game.homeTeam.displayName;
    const away = game.awayTeam.displayName;
    const isLive = game.status === 'in';

    // Sport-specific prop templates
    const propTemplates: Record<string, SGPLeg[]> = {
        NBA: [
            { player: `${home} Starter`, prop: 'Points', line: `Over ${Math.round(parseFloat(pred.total) / 2 / 5) * 5 + 0.5}` },
            { player: `${away} PG`, prop: 'Assists', line: `Over 6.5` },
            { player: `${home} Center`, prop: 'Rebounds', line: `Over 9.5` },
        ],
        NFL: [
            { player: `${home} QB`, prop: 'Passing Yards', line: `Over 249.5` },
            { player: `${away} WR1`, prop: 'Receiving Yards', line: `Over 74.5` },
            { player: `${home} RB`, prop: 'Anytime TD', line: `Yes` },
        ],
        MLB: [
            { player: `${home} SP`, prop: 'Strikeouts', line: `Over 6.5` },
            { player: `${away} OF`, prop: 'Total Bases', line: `Over 1.5` },
            { player: `${home} 1B`, prop: 'Hits + Runs + RBIs', line: `Over 2.5` },
        ],
        NHL: [
            { player: `${home} C`, prop: 'Points', line: `Over 0.5` },
            { player: `${away} D`, prop: 'Shots on Goal', line: `Over 3.5` },
            { player: `${home} LW`, prop: 'Anytime Scorer', line: `Yes` },
        ],
    };

    const legs = propTemplates[sport] ?? [
        { player: `${home}`, prop: 'Total Goals', line: `Over 1.5` },
        { player: `${away}`, prop: 'Total Goals', line: `Over 0.5` },
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
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState('');
    const [addedBets, setAddedBets] = useState<Set<string>>(new Set());
    const [activeSport, setActiveSport] = useState<string>('All');
    const [allGames, setAllGames] = useState<ESPNGame[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (title: string) => {
        setExpandedCategories(prev => ({ ...prev, [title]: !prev[title] }));
    };

    // Split bets by category
    const [aiPicks, setAiPicks] = useState<SGPBet[]>([]);
    const [mlBets, setMlBets] = useState<SGPBet[]>([]);
    const [totalBets, setTotalBets] = useState<SGPBet[]>([]);
    const [spreadBets, setSpreadBets] = useState<SGPBet[]>([]);
    const [playerProps, setPlayerProps] = useState<SGPBet[]>([]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchMultiSportScoreboard(['NBA', 'NFL', 'MLB', 'NHL']);
                const fetchedGames: ESPNGame[] = Object.values(data).flat();
                setAllGames(fetchedGames);
                setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            } catch {
                setAllGames([]);
            } finally {
                setLoading(false);
            }
        };

        load();
        const interval = setInterval(load, 120_000); // refresh every 2 min
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!allGames.length) {
            setAiPicks([]);
            setMlBets([]);
            setTotalBets([]);
            setSpreadBets([]);
            setPlayerProps([]);
            return;
        }

        const filteredGames = activeSport === 'All'
            ? allGames
            : allGames.filter(g => g.sport === activeSport);

        const sorted = [
            ...filteredGames.filter(g => g.status === 'in'),
            ...filteredGames.filter(g => g.status === 'pre'),
            ...filteredGames.filter(g => g.status === 'post'),
        ];

        if (sorted.length === 0) {
            setAiPicks([]);
            setMlBets([]);
            setTotalBets([]);
            setSpreadBets([]);
            setPlayerProps([]);
            return;
        }

        const getGame = (i: number) => sorted[i % sorted.length];

        // Helper to create a specific type of single-leg bet formatted like an SGP card
        const createSingleLegBet = (game: ESPNGame, type: 'ML' | 'OU' | 'SPREAD' | 'PROP', index: number): SGPBet => {
            const pred = generateAIPrediction(game.homeTeam.record, game.awayTeam.record, game.sport, [], []);
            const homeW = Number(pred.homeWinProb) > 50;

            // Simple win prob to ML odds converter
            const winProbToMLStr = (prob: number) => {
                const winP = prob / 100;
                if (winP > 0.5) return `-${Math.round((winP / (1 - winP)) * 100)}`;
                return `+${Math.round(((1 - winP) / winP) * 100)}`;
            };

            const homeML = winProbToMLStr(Number(pred.homeWinProb));
            const awayML = winProbToMLStr(Number(pred.awayWinProb));

            let leg: SGPLeg;
            let playerHeadshot: string | undefined;
            let playerTeamLogo: string | undefined;
            if (type === 'ML') {
                leg = { player: homeW ? game.homeTeam.displayName : game.awayTeam.displayName, prop: 'Moneyline', line: homeW ? homeML : awayML };
            } else if (type === 'OU') {
                const isOver = Math.random() > 0.5;
                leg = { player: 'Game', prop: 'Total Points', line: `${isOver ? 'Over' : 'Under'} ${pred.total}` };
            } else if (type === 'SPREAD') {
                leg = { player: homeW ? game.homeTeam.displayName : game.awayTeam.displayName, prop: 'Spread', line: homeW ? pred.spread : (pred.spread.includes('-') ? pred.spread.replace('-', '+') : `-${pred.spread}`) };
            } else {
                // Player prop ticket
                if (game.leaders && game.leaders.length > 0) {
                    const leader = game.leaders[index % game.leaders.length];
                    const isHome = leader.teamId === game.homeTeam.id;
                    playerHeadshot = leader.headshot;
                    playerTeamLogo = isHome ? game.homeTeam.logo : game.awayTeam.logo;
                    const lineVal = parseFloat(leader.displayValue) || 2.5;
                    const lineOver = Math.max(0.5, lineVal - 0.5);

                    leg = { player: leader.name, prop: leader.category, line: `Over ${lineOver}` };
                } else {
                    const templates: Record<string, { p: string, t: string, l: string }> = {
                        NBA: { p: 'Starter', t: 'Points', l: `Over ${Math.round(parseFloat(pred.total) / 2 / 5) * 5 + 0.5}` },
                        NFL: { p: 'QB', t: 'Passing Yards', l: 'Over 249.5' },
                        MLB: { p: 'SP', t: 'Strikeouts', l: 'Over 5.5' },
                        NHL: { p: 'C', t: 'Shots on Goal', l: 'Over 3.5' },
                    };
                    const tmpl = templates[game.sport] || { p: 'Star', t: 'Goals', l: 'Over 1.5' };
                    const playerTeam = homeW ? game.homeTeam.displayName : game.awayTeam.displayName;
                    leg = { player: `${playerTeam} ${tmpl.p}`, prop: tmpl.t, line: tmpl.l };
                }
            }

            return {
                id: `${type.toLowerCase()}-${game.id}-${index}`,
                description: `${game.awayTeam.displayName} vs ${game.homeTeam.displayName} — ${type === 'PROP' ? 'Player Prop Ticket' : type === 'OU' ? 'Game Total' : type === 'SPREAD' ? 'Point Spread' : 'Moneyline'}`,
                odds: type === 'PROP' ? '-110' : type === 'ML' ? (homeW ? homeML : awayML) : '-110',
                legs: [leg],
                placedCount: `${Math.floor(10 + Math.random() * 40)}K`,
                sport: game.sport,
                homeTeam: game.homeTeam.displayName,
                awayTeam: game.awayTeam.displayName,
                homeLogo: game.homeTeam.logo,
                awayLogo: game.awayTeam.logo,
                isLive: game.status === 'in',
                playerHeadshot,
                playerTeamLogo,
                aiProbability: `${Math.round(Number(homeW ? pred.homeWinProb : pred.awayWinProb))}%`,
                aiEdge: `+${(Math.random() * 5 + 1).toFixed(1)}%`,
            };
        };

        setAiPicks(Array.from({ length: 6 }).map((_, i) => generateSGP(getGame(i), i)));
        setMlBets(Array.from({ length: 6 }).map((_, i) => createSingleLegBet(getGame(i + 6), 'ML', i)));
        setTotalBets(Array.from({ length: 6 }).map((_, i) => createSingleLegBet(getGame(i + 12), 'OU', i)));
        setSpreadBets(Array.from({ length: 6 }).map((_, i) => createSingleLegBet(getGame(i + 18), 'SPREAD', i)));
        setPlayerProps(Array.from({ length: 6 }).map((_, i) => createSingleLegBet(getGame(i + 24), 'PROP', i)));

    }, [allGames, activeSport]);

    // Helper to add the SGP legs
    const handleAddSGP = (betMatch: SGPBet) => {
        if (!onAddBet) return;
        betMatch.legs.forEach(leg => {
            const teamStr = leg.player === 'Game' || leg.player.includes(betMatch.homeTeam) || leg.player.includes(betMatch.awayTeam)
                ? leg.player // If it's a team/game prop, the player field describes it nicely
                : leg.line === 'Yes' ? `${leg.player} ${leg.prop}` : `${leg.player} ${leg.line} ${leg.prop}`;

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

                {/* Sport Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['All', 'NBA', 'NFL', 'MLB', 'NHL'].map(sport => (
                        <button
                            key={sport}
                            onClick={() => setActiveSport(sport)}
                            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border ${activeSport === sport
                                ? 'bg-primary text-black border-primary'
                                : 'bg-neutral-800/50 text-text-muted border-border-muted hover:border-slate-500 hover:text-text-main'
                                }`}
                        >
                            {sport}
                        </button>
                    ))}
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
                {!loading && aiPicks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border-muted rounded-xl">
                        <span className="material-symbols-outlined text-5xl text-slate-600 mb-4">event_busy</span>
                        <h3 className="text-text-main font-black text-xl uppercase tracking-widest mb-2">No Games Today</h3>
                        <p className="text-text-muted text-sm max-w-xs">
                            Popular SGPs are generated from today's live games. Check back once games are scheduled.
                        </p>
                    </div>
                )}

                {/* Categories container */}
                {!loading && aiPicks.length > 0 && (
                    <div className="flex flex-col gap-12 mt-4">

                        {[
                            { title: 'AI Editor\'s Picks', subtitle: 'Same Game Parlays', bets: aiPicks, icon: 'psychology', color: 'text-primary' },
                            { title: 'Sharp Moneylines', subtitle: 'Match Winners', bets: mlBets, icon: 'monetization_on', color: 'text-green-500' },
                            { title: 'Over / Unders', subtitle: 'Game Totals', bets: totalBets, icon: 'swap_vert', color: 'text-blue-500' },
                            { title: 'Vegas Spreads', subtitle: 'Point Covers', bets: spreadBets, icon: 'compare_arrows', color: 'text-orange-500' },
                            { title: 'Player Prop Tickets', subtitle: 'Individual Leaders', bets: playerProps, icon: 'person', color: 'text-accent-purple' },
                        ].map((category, catIdx) => {
                            const isExpanded = !!expandedCategories[category.title];
                            // If bets array is longer than 3, show either all or slice to 3 based on 'isExpanded'
                            const displayedBets = isExpanded ? category.bets : category.bets.slice(0, 3);
                            const hasMore = category.bets.length > 3;

                            return (
                                <div key={catIdx} className="flex flex-col gap-5">
                                    <div className="flex items-center gap-3 border-b border-border-muted/50 pb-2">
                                        <span className={`material-symbols-outlined ${category.color} text-2xl`}>{category.icon}</span>
                                        <div className="flex-1 flex justify-between items-center">
                                            <div>
                                                <h3 className="text-xl font-black text-text-main uppercase tracking-widest">{category.title}</h3>
                                                <p className="text-xs text-text-muted font-bold uppercase">{category.subtitle}</p>
                                            </div>
                                            {hasMore && (
                                                <button
                                                    onClick={() => toggleCategory(category.title)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors text-slate-400 hover:text-white text-[10px] sm:text-xs font-black uppercase tracking-wider"
                                                >
                                                    {isExpanded ? 'Show Less' : `Show All (${category.bets.length})`}
                                                    <span className={`material-symbols-outlined text-[14px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                        expand_more
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {displayedBets.map(bet => (
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
                                                            <span className={`text-[10px] font-bold ${category.color} uppercase tracking-widest bg-neutral-800 px-2 py-0.5 rounded border border-border-muted`}>
                                                                {category.subtitle.split(' ')[0]}
                                                            </span>
                                                        </div>
                                                        {/* Team logos + names or Player Headshot */}
                                                        {bet.playerHeadshot ? (
                                                            <div className="flex items-center gap-3 mt-1 py-1">
                                                                <div className="relative">
                                                                    <img src={bet.playerHeadshot} alt={bet.legs[0]?.player} className="w-10 h-10 rounded-full object-cover bg-neutral-800" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                    {bet.playerTeamLogo && (
                                                                        <img src={bet.playerTeamLogo} className="w-6 h-6 absolute -bottom-1 -right-2 object-contain drop-shadow-md z-10" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-black text-text-main leading-tight">{bet.legs[0]?.player}</span>
                                                                    <span className="text-[9px] text-text-muted font-bold truncate">
                                                                        {bet.awayTeam} @ {bet.homeTeam}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <img src={bet.awayLogo} alt={bet.awayTeam} className="w-6 h-6 object-contain drop-shadow-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                <span className="text-xs font-bold text-text-muted">{bet.awayTeam}</span>
                                                                <span className="text-text-muted">@</span>
                                                                <img src={bet.homeLogo} alt={bet.homeTeam} className="w-6 h-6 object-contain drop-shadow-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                                <span className="text-xs font-bold text-text-main">{bet.homeTeam}</span>
                                                            </div>
                                                        )}
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
                                                                <span className="text-[10px] text-text-muted font-medium">
                                                                    {leg.line === 'Yes' ? leg.prop : `${leg.line.includes('Over') || leg.line.includes('Under') || leg.line.includes('+') || leg.line.includes('-') ? '' : 'Over '}${leg.line} ${leg.prop}`}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs font-black text-primary">{leg.line === 'Yes' ? 'Yes' : leg.line.replace(/Over\s*/i, '').replace(/Under\s*/i, '')}</span>
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
                                                            ? 'bg-green-500 text-black border border-green-500 cursor-not-allowed'
                                                            : 'bg-primary text-black border border-primary hover:bg-primary/80 hover:scale-105'
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
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div >
    );
};
