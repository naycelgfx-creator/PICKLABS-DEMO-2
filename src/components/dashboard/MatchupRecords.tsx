import React, { useMemo } from 'react';
import { Game } from '../../data/mockGames';
import { generateMatchupRecords } from '../../data/mockMatchupRecords';

interface MatchupRecordsProps {
    game: Game;
}

export const MatchupRecords: React.FC<MatchupRecordsProps> = ({ game }) => {
    // Generate records based on the sport
    const records = useMemo(() => generateMatchupRecords(game.sport), [game.sport]);

    return (
        <div className="bg-neutral-900 border border-border-muted rounded-xl p-6 shadow-xl relative overflow-hidden group animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <span className="material-symbols-outlined text-accent-purple text-2xl drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] group-hover:animate-pulse">sports_score</span>
                <h3 className="text-white font-black uppercase tracking-widest text-lg italic">Team Records</h3>
            </div>

            {/* Sub-Header Key */}
            <div className="flex justify-between items-center mb-4 px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 relative z-10 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    <span>{game.awayTeam.name.substring(0, 3).toUpperCase()}</span>
                </div>
                <div className="hidden sm:block">Split Category</div>
                <div className="flex items-center gap-2">
                    <span>{game.homeTeam.name.substring(0, 3).toUpperCase()}</span>
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                </div>
            </div>

            {/* Records Table */}
            <div className="relative z-10 overflow-x-auto flex-1">
                <table className="w-full text-center border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-neutral-800/50">
                            <th className="py-3 px-2 text-left font-black text-slate-400 w-1/4 sm:w-1/3">{game.awayTeam.name.substring(0, 3).toUpperCase()}</th>
                            <th className="py-3 px-2 font-black text-white w-2/4 sm:w-1/3 text-center uppercase tracking-wider text-[10px] sm:text-xs">Category</th>
                            <th className="py-3 px-2 text-right font-black text-slate-400 w-1/4 sm:w-1/3">{game.homeTeam.name.substring(0, 3).toUpperCase()}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/30">
                        {records.map((split, idx) => {
                            // Determine Advantage
                            const awayWins = split.awayWinPct > split.homeWinPct;
                            const homeWins = split.homeWinPct > split.awayWinPct;
                            const isTie = split.awayWinPct === split.homeWinPct;

                            return (
                                <tr key={idx} className="hover:bg-neutral-800/20 transition-colors group/row">
                                    <td className="py-3 px-2 text-left">
                                        <span className={`font-black tracking-tight ${awayWins ? 'text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]' : isTie ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {split.awayRecord}
                                        </span>
                                    </td>

                                    <td className="py-3 px-2 font-bold text-slate-300 text-center uppercase text-xs tracking-wider group-hover/row:text-white transition-colors">
                                        {split.category}
                                    </td>

                                    <td className="py-3 px-2 text-right">
                                        <span className={`font-black tracking-tight ${homeWins ? 'text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]' : isTie ? 'text-slate-300' : 'text-slate-500'}`}>
                                            {split.homeRecord}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Glowing Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent-purple/10 transition-colors duration-700"></div>
        </div>
    );
};
