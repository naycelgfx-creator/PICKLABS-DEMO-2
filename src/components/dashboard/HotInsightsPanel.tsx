import React from 'react';
import { Game } from '../../data/mockGames';
import { useESPNBoxScore, TeamBoxLeaders } from '../../data/useESPNBoxScore';

interface HotInsightsPanelProps {
    game: Game;
}

export const HotInsightsPanel: React.FC<HotInsightsPanelProps> = ({ game }) => {
    const { data, loading } = useESPNBoxScore(game.sport, game.matchupId);

    // Build per-team leader rows from ESPN data
    const buildLeaders = (teamData: TeamBoxLeaders | null) => {
        if (!teamData) return [];
        const rows = [];
        if (teamData.points) rows.push({ label: 'Top Scorer', name: teamData.points.name, stat: `${teamData.points.value} PTS`, hot: true });
        if (teamData.rebounds) rows.push({ label: 'Top Rebounder', name: teamData.rebounds.name, stat: `${teamData.rebounds.value} REB`, hot: false });
        if (teamData.assists) rows.push({ label: 'Top Assists', name: teamData.assists.name, stat: `${teamData.assists.value} AST`, hot: false });
        if (teamData.threePointers) rows.push({ label: '3-Pointers', name: teamData.threePointers.name, stat: `${teamData.threePointers.value} 3PM`, hot: false });
        if (teamData.steals) rows.push({ label: 'Steals', name: teamData.steals.name, stat: `${teamData.steals.value} STL`, hot: false });
        return rows;
    };

    const awayLeaders = buildLeaders(data?.away ?? null);
    const homeLeaders = buildLeaders(data?.home ?? null);

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
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Who showed up in this matchup?</p>
                    </div>
                </div>
                {loading ? (
                    <span className="text-[9px] px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full font-black uppercase tracking-widest animate-pulse">
                        Loading…
                    </span>
                ) : (
                    <span className="text-[9px] px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full font-black uppercase tracking-widest">
                        {data ? data.status : 'Game Analysis'}
                    </span>
                )}
            </div>

            {/* Two-column team cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border-muted">

                {/* Away Team */}
                <div className="bg-background-dark p-5">
                    <div className="flex items-center gap-3 mb-4">
                        {(data?.away?.teamLogo || game.awayTeam.logo) && (
                            <img
                                src={data?.away?.teamLogo || game.awayTeam.logo}
                                alt={game.awayTeam.name}
                                className="w-8 h-8 object-contain"
                            />
                        )}
                        <div>
                            <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{game.awayTeam.name}</h4>
                            {data?.finalScore && (
                                <p className="text-[10px] text-orange-400 font-black uppercase tracking-wider">
                                    Final: {data.finalScore.away}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loading && (
                            <div className="flex items-center gap-2 text-text-muted text-xs animate-pulse">
                                <span className="material-symbols-outlined text-sm">autorenew</span>
                                Loading stats…
                            </div>
                        )}
                        {!loading && awayLeaders.length === 0 && (
                            <p className="text-xs text-slate-500 italic">Stats not yet available</p>
                        )}
                        {awayLeaders.map((player) => (
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
                                    {player.hot && <span className="material-symbols-outlined text-orange-400 text-sm">local_fire_department</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Home Team */}
                <div className="bg-background-dark p-5">
                    <div className="flex items-center gap-3 mb-4">
                        {(data?.home?.teamLogo || game.homeTeam.logo) && (
                            <img
                                src={data?.home?.teamLogo || game.homeTeam.logo}
                                alt={game.homeTeam.name}
                                className="w-8 h-8 object-contain"
                            />
                        )}
                        <div>
                            <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{game.homeTeam.name}</h4>
                            {data?.finalScore && (
                                <p className="text-[10px] text-orange-400 font-black uppercase tracking-wider">
                                    Final: {data.finalScore.home}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loading && (
                            <div className="flex items-center gap-2 text-text-muted text-xs animate-pulse">
                                <span className="material-symbols-outlined text-sm">autorenew</span>
                                Loading stats…
                            </div>
                        )}
                        {!loading && homeLeaders.length === 0 && (
                            <p className="text-xs text-slate-500 italic">Stats not yet available</p>
                        )}
                        {homeLeaders.map((player) => (
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
                                    {player.hot && <span className="material-symbols-outlined text-orange-400 text-sm">local_fire_department</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
