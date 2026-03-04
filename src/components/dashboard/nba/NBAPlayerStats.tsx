import React, { useState } from 'react';

interface PreComputedStats {
    pts: number[];
    reb: number[];
    ast: number[];
    tpm: number[]; // 3 Pointers Made
}

interface Player {
    id: string;
    name: string;
    headshot: string;
    position: string;
    stats: PreComputedStats;
}

// Helper to generate some fake last 10 games data based on player archetype
const generateStats = (avgPts: number, avgReb: number, avgAst: number, avg3pm: number): PreComputedStats => {
    return {
        pts: Array.from({ length: 10 }, () => Math.max(0, Math.floor(avgPts + (Math.random() * 14 - 7)))),
        reb: Array.from({ length: 10 }, () => Math.max(0, Math.floor(avgReb + (Math.random() * 6 - 3)))),
        ast: Array.from({ length: 10 }, () => Math.max(0, Math.floor(avgAst + (Math.random() * 6 - 3)))),
        tpm: Array.from({ length: 10 }, () => Math.max(0, Math.floor(avg3pm + (Math.random() * 4 - 2))))
    };
};

const MOCK_ROSTER: Record<string, Player[]> = {
    // We'll create a default star roster that adapts if the team isn't heavily mocked
    default: [
        { id: '1', name: 'Superstar Player', position: 'PG', headshot: 'https://ui-avatars.com/api/?name=SP&background=random&color=fff', stats: generateStats(28, 6, 9, 3) },
        { id: '2', name: 'Elite Wing', position: 'SF', headshot: 'https://ui-avatars.com/api/?name=EW&background=random&color=fff', stats: generateStats(24, 7, 4, 2) },
        { id: '3', name: 'Star Big Man', position: 'C', headshot: 'https://ui-avatars.com/api/?name=SB&background=random&color=fff', stats: generateStats(22, 12, 3, 1) },
        { id: '4', name: 'Volume Shooter', position: 'SG', headshot: 'https://ui-avatars.com/api/?name=VS&background=random&color=fff', stats: generateStats(18, 4, 3, 4) },
        { id: '5', name: 'Glue Guy', position: 'PF', headshot: 'https://ui-avatars.com/api/?name=GG&background=random&color=fff', stats: generateStats(12, 8, 5, 1) },
    ],
    'lal': [
        { id: 'lbj', name: 'LeBron James', position: 'SF', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png&w=350&h=254', stats: generateStats(25.5, 7.2, 8.1, 2.1) },
        { id: 'ad', name: 'Anthony Davis', position: 'C', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6583.png&w=350&h=254', stats: generateStats(24.8, 12.6, 3.5, 0.4) },
        { id: 'dlo', name: 'D\'Angelo Russell', position: 'PG', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3136776.png&w=350&h=254', stats: generateStats(18.0, 3.1, 6.2, 3.0) },
        { id: 'ar', name: 'Austin Reaves', position: 'SG', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4397161.png&w=350&h=254', stats: generateStats(15.9, 4.3, 5.5, 1.9) },
        { id: 'rui', name: 'Rui Hachimura', position: 'PF', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395625.png&w=350&h=254', stats: generateStats(13.6, 4.3, 1.2, 1.4) },
    ],
    'bos': [
        { id: 'jt', name: 'Jayson Tatum', position: 'SF', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4065648.png&w=350&h=254', stats: generateStats(26.9, 8.1, 4.9, 3.1) },
        { id: 'jb', name: 'Jaylen Brown', position: 'SG', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3917376.png&w=350&h=254', stats: generateStats(23.0, 5.5, 3.6, 2.1) },
        { id: 'kp', name: 'Kristaps Porzingis', position: 'C', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3102531.png&w=350&h=254', stats: generateStats(20.1, 7.2, 2.0, 1.9) },
        { id: 'dw', name: 'Derrick White', position: 'PG', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3074402.png&w=350&h=254', stats: generateStats(15.2, 4.2, 5.2, 2.7) },
        { id: 'jh', name: 'Jrue Holiday', position: 'PG', headshot: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3995.png&w=350&h=254', stats: generateStats(12.5, 5.4, 4.8, 2.0) },
    ]
};

export const NBAPlayerStats: React.FC<{ teamName: string, teamAbbr: string, teamLogo?: string }> = ({ teamAbbr, teamName }) => {
    const [viewMode, setViewMode] = useState<'L5' | 'L10'>('L5');

    // Fallback to default if we haven't hardcoded the specific roster above
    const roster = MOCK_ROSTER[teamAbbr.toLowerCase()] || MOCK_ROSTER['default'];

    const calculateAverage = (arr: number[], length: number) => {
        const slice = arr.slice(0, length);
        const sum = slice.reduce((a, b) => a + b, 0);
        return (sum / length).toFixed(1);
    };

    const getTrendColor = (current: number, overall: number) => {
        if (current > overall * 1.1) return 'text-primary';
        if (current < overall * 0.9) return 'text-red-400';
        return 'text-text-main';
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-text-main uppercase italic border-l-4 border-primary pl-3">
                    Top Players - Recent Form
                </h3>
                <div className="flex bg-white dark:bg-white dark:bg-neutral-900 border border-border-muted p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('L5')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'L5' ? 'bg-primary text-background-dark shadow-md' : 'text-text-muted hover:text-white'}`}
                    >
                        Last 5
                    </button>
                    <button
                        onClick={() => setViewMode('L10')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === 'L10' ? 'bg-primary text-background-dark shadow-md' : 'text-text-muted hover:text-white'}`}
                    >
                        Last 10
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {roster.map(player => {
                    const viewLength = viewMode === 'L5' ? 5 : 10;

                    // Averages over selected span (L5 or L10)
                    const avgPts = parseFloat(calculateAverage(player.stats.pts, viewLength));
                    const avgReb = parseFloat(calculateAverage(player.stats.reb, viewLength));
                    const avgAst = parseFloat(calculateAverage(player.stats.ast, viewLength));
                    const avg3pm = parseFloat(calculateAverage(player.stats.tpm, viewLength));

                    // Overall 10 game averages as baseline reference
                    const basePts = parseFloat(calculateAverage(player.stats.pts, 10));
                    const baseReb = parseFloat(calculateAverage(player.stats.reb, 10));
                    const baseAst = parseFloat(calculateAverage(player.stats.ast, 10));
                    const base3pm = parseFloat(calculateAverage(player.stats.tpm, 10));

                    return (
                        <div key={player.id} className="glass-panel p-4 flex flex-col md:flex-row items-center gap-6 border border-border-muted rounded-xl hover:border-primary/30 transition-colors">

                            {/* Player Identity */}
                            <div className="flex items-center gap-4 min-w-[200px] border-b md:border-b-0 md:border-r border-border-muted pb-4 md:pb-0 md:pr-6 w-full md:w-auto">
                                <img
                                    src={player.headshot}
                                    alt={player.name}
                                    className="w-16 h-16 rounded-full bg-neutral-800 object-cover border-2 border-neutral-700"
                                />
                                <div>
                                    <div className="text-lg font-black text-text-main">{player.name}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{player.position} • {teamName}</div>
                                </div>
                            </div>

                            {/* Stat Blocks */}
                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                                {/* Points */}
                                <div className="bg-background-darker p-3 rounded-lg border border-border-dark flex flex-col items-center justify-center">
                                    <span className="text-xs uppercase font-bold text-slate-500 mb-1">Points</span>
                                    <span className={`text-2xl font-black ${getTrendColor(avgPts, basePts)}`}>{avgPts.toFixed(1)}</span>
                                    {viewMode === 'L5' && (
                                        <span className="text-[10px] text-slate-500 mt-1">L10: {basePts}</span>
                                    )}
                                </div>

                                {/* Rebounds */}
                                <div className="bg-background-darker p-3 rounded-lg border border-border-dark flex flex-col items-center justify-center">
                                    <span className="text-xs uppercase font-bold text-slate-500 mb-1">Rebounds</span>
                                    <span className={`text-2xl font-black ${getTrendColor(avgReb, baseReb)}`}>{avgReb.toFixed(1)}</span>
                                    {viewMode === 'L5' && (
                                        <span className="text-[10px] text-slate-500 mt-1">L10: {baseReb}</span>
                                    )}
                                </div>

                                {/* Assists */}
                                <div className="bg-background-darker p-3 rounded-lg border border-border-dark flex flex-col items-center justify-center">
                                    <span className="text-xs uppercase font-bold text-slate-500 mb-1">Assists</span>
                                    <span className={`text-2xl font-black ${getTrendColor(avgAst, baseAst)}`}>{avgAst.toFixed(1)}</span>
                                    {viewMode === 'L5' && (
                                        <span className="text-[10px] text-slate-500 mt-1">L10: {baseAst}</span>
                                    )}
                                </div>

                                {/* 3 Pointers */}
                                <div className="bg-background-darker p-3 rounded-lg border border-border-dark flex flex-col items-center justify-center">
                                    <span className="text-xs uppercase font-bold justify-center items-center flex gap-1 text-slate-500 mb-1">
                                        3 Pointers
                                    </span>
                                    <span className={`text-2xl font-black ${getTrendColor(avg3pm, base3pm)}`}>{avg3pm.toFixed(1)}</span>
                                    {viewMode === 'L5' && (
                                        <span className="text-[10px] text-slate-500 mt-1">L10: {base3pm}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
