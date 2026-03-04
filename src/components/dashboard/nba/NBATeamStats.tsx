import React, { useMemo } from 'react';
import { Game } from '../../../data/mockGames';
import { generateMockShotData } from '../../../data/mockNbaData';

interface NBATeamStatsProps {
    game: Game;
}

export const NBATeamStats: React.FC<NBATeamStatsProps> = ({ game }) => {
    // Generate a global pool of mock shots to calculate team aggregate stats from
    const shots = useMemo(() => generateMockShotData(150), []);

    const getStats = (teamId: 'home' | 'away') => {
        const teamShots = shots.filter(s => s.teamId === teamId);
        const made = teamShots.filter(s => s.isMade).length;
        const missed = teamShots.filter(s => !s.isMade).length;
        const total = teamShots.length;
        const pct = total > 0 ? ((made / total) * 100).toFixed(1) : '0.0';
        return { made, missed, pct };
    };

    const awayStats = getStats('away');
    const homeStats = getStats('home');

    const renderBar = (stats: { made: number, missed: number, pct: string }, label: string, colorClass: string) => (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
                <span className="text-lg font-black text-text-main italic">{stats.pct}%</span>
            </div>
            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                <div
                    className={`h-full ${colorClass} transition-all duration-1000`}
                    style={{ width: `${stats.pct}%` }}
                />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 uppercase font-black">
                <span>Made: <span className="text-white">{stats.made}</span></span>
                <span>Missed: <span className="text-white">{stats.missed}</span></span>
            </div>
        </div>
    );

    return (
        <div className="terminal-panel p-6 border-accent-purple/30 bg-accent-purple/5 col-span-12 lg:col-span-4 flex flex-col justify-center gap-6">
            <div className="flex items-center gap-2 border-b border-border-muted pb-4">
                <span className="material-symbols-outlined text-accent-purple text-xl">analytics</span>
                <h2 className="text-sm font-black text-text-main uppercase italic tracking-[0.2em]">Matchup Efficiency</h2>
            </div>

            <div className="space-y-6">
                {renderBar(awayStats, game.awayTeam.name, 'bg-primary')}
                {renderBar(homeStats, game.homeTeam.name, 'bg-accent-purple')}
            </div>

            <div className="mt-4 p-4 bg-white dark:bg-neutral-900/40 rounded border border-border-muted text-center">
                <p className="text-[10px] text-text-muted leading-relaxed italic">
                    Values reflect current aggregated shot data probability heuristics for active simulation paths.
                </p>
            </div>
        </div>
    );
};
