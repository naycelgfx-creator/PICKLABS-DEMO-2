import React from 'react';
import { Game } from '../../data/mockGames';
import { getTeamInsights } from '../../data/teamRosters';

interface HotInsightsPanelProps {
    game: Game;
}

export const HotInsightsPanel: React.FC<HotInsightsPanelProps> = ({ game }) => {
    const awayInsights = getTeamInsights(game.sport, game.awayTeam.name);
    const homeInsights = getTeamInsights(game.sport, game.homeTeam.name);

    return (
        <div className="terminal-panel mt-6 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border-muted flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
                        <span className="material-symbols-outlined text-orange-400 text-xl">local_fire_department</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-text-main uppercase tracking-[0.2em]">Hot Insights</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Who is catching fire in this matchup?</p>
                    </div>
                </div>
                <span className="text-[9px] px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full font-black uppercase tracking-widest animate-pulse">
                    Live Analysis
                </span>
            </div>

            {/* Two-column team cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-muted">
                {/* Away Team */}
                <div className="bg-background-dark p-5">
                    <div className="flex items-center gap-3 mb-4">
                        {game.awayTeam.logo && (
                            <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-8 h-8 object-contain" />
                        )}
                        <div>
                            <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{game.awayTeam.name}</h4>
                            <p className="text-[10px] text-orange-400 font-black uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                                {awayInsights.trend}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {awayInsights.leaders.map((player) => (
                            <div key={player.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{player.label}</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-[11px] text-slate-400">person</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-text-muted truncate">{player.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className={`text-[11px] font-black ${player.hot ? 'text-orange-400' : 'text-text-main'}`}>
                                        {player.stat}
                                    </span>
                                    <span className="material-symbols-outlined text-orange-400 text-sm">local_fire_department</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Home Team */}
                <div className="bg-background-dark p-5">
                    <div className="flex items-center gap-3 mb-4">
                        {game.homeTeam.logo && (
                            <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-8 h-8 object-contain" />
                        )}
                        <div>
                            <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{game.homeTeam.name}</h4>
                            <p className="text-[10px] text-orange-400 font-black uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                                {homeInsights.trend}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {homeInsights.leaders.map((player) => (
                            <div key={player.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{player.label}</span>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded bg-neutral-800 flex items-center justify-center flex-shrink-0">
                                                <span className="material-symbols-outlined text-[11px] text-slate-400">person</span>
                                            </div>
                                            <span className="text-[11px] font-bold text-text-muted truncate">{player.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className={`text-[11px] font-black ${player.hot ? 'text-orange-400' : 'text-text-main'}`}>
                                        {player.stat}
                                    </span>
                                    <span className="material-symbols-outlined text-orange-400 text-sm">local_fire_department</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
