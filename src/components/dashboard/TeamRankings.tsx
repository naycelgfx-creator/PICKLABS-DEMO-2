import React, { useMemo } from 'react';
import { Game } from '../../data/mockGames';
import { generateTeamRankings } from '../../data/mockTeamRankings';

interface TeamRankingsProps {
    game: Game;
}

export const TeamRankings: React.FC<TeamRankingsProps> = ({ game }) => {
    // Generate static rankings for this specific game
    const rankings = useMemo(() => generateTeamRankings(), []);

    return (
        <div className="bg-neutral-900 border border-border-muted rounded-xl p-6 shadow-xl relative overflow-hidden group animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <span className="material-symbols-outlined text-accent-blue text-2xl drop-shadow-[0_0_8px_rgba(0,191,255,0.5)] group-hover:animate-pulse">insert_chart</span>
                <h3 className="text-white font-black uppercase tracking-widest text-lg italic">Head-to-Head Advanced Analytics</h3>
            </div>

            {/* Sub-Header Key */}
            <div className="flex justify-between items-center mb-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    <span>{game.awayTeam.name.toUpperCase()} Avg</span>
                </div>
                <div className="hidden md:block">League Rank Comparison</div>
                <div className="flex items-center gap-2">
                    <span>{game.homeTeam.name.toUpperCase()} Avg</span>
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                </div>
            </div>

            {/* Rankings Table */}
            <div className="relative z-10 overflow-x-auto flex-1">
                <table className="w-full text-center border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-neutral-800/50">
                            <th className="py-3 px-2 text-left font-bold text-slate-400 w-1/5">{game.awayTeam.name.substring(0, 3).toUpperCase()} AVG</th>
                            <th className="py-3 px-2 font-bold text-slate-500 w-1/6 hidden sm:table-cell">RANK</th>
                            <th className="py-3 px-4 font-black text-white w-1/3 text-left sm:text-center uppercase tracking-wider text-xs">Statistic</th>
                            <th className="py-3 px-2 font-bold text-slate-500 w-1/6 hidden sm:table-cell">RANK</th>
                            <th className="py-3 px-2 text-right font-bold text-slate-400 w-1/5">{game.homeTeam.name.substring(0, 3).toUpperCase()} AVG</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/30">
                        {rankings.map((stat, idx) => {
                            const awayWins = stat.isAwayAdvantage;
                            const homeWins = !stat.isAwayAdvantage && stat.awayRank !== stat.homeRank; // Edge case tied
                            const isTie = stat.awayRank === stat.homeRank;

                            return (
                                <tr key={idx} className="hover:bg-neutral-800/20 transition-colors group/row">
                                    <td className="py-3 px-2 text-left">
                                        <span className={`font-black ${awayWins ? 'text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]' : isTie ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {stat.awayAvg}
                                        </span>
                                    </td>

                                    <td className="py-3 px-2 hidden sm:table-cell">
                                        <span className={`text-xs px-2 py-1 rounded bg-neutral-900 border ${awayWins ? 'text-primary border-primary/30 font-bold' : isTie ? 'text-slate-400 border-neutral-800' : 'text-slate-600 border-transparent font-medium'}`}>
                                            {stat.awayRank}
                                        </span>
                                    </td>

                                    <td className="py-3 px-4 font-bold text-slate-200 text-left sm:text-center group-hover/row:text-white transition-colors">
                                        {stat.statName}
                                    </td>

                                    <td className="py-3 px-2 hidden sm:table-cell">
                                        <span className={`text-xs px-2 py-1 rounded bg-neutral-900 border ${homeWins ? 'text-primary border-primary/30 font-bold' : isTie ? 'text-slate-400 border-neutral-800' : 'text-slate-600 border-transparent font-medium'}`}>
                                            {stat.homeRank}
                                        </span>
                                    </td>

                                    <td className="py-3 px-2 text-right">
                                        <span className={`font-black ${homeWins ? 'text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]' : isTie ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {stat.homeAvg}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Glowing Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent-blue/10 transition-colors duration-700"></div>
        </div>
    );
};
