import React from 'react';
import { Game } from '../../data/mockGames';

interface MatchupScoutingProps {
    game: Game;
}

export const MatchupScouting: React.FC<MatchupScoutingProps> = ({ game }) => {
    // Only show scouting for MLB
    if (game.sport !== 'MLB') return null;

    // Generate mock heatmap data for a 3x3 strike zone
    // Higher number = deeper red (hot zone), lower = blue (cold zone)
    const generateHeatmap = () => {
        return Array.from({ length: 9 }).map(() => Math.floor(Math.random() * 100));
    };

    const zoneData = generateHeatmap();

    const getZoneColor = (value: number) => {
        if (value > 80) return 'bg-red-500/80 border-red-400';
        if (value > 60) return 'bg-red-500/50 border-red-500/50';
        if (value > 40) return 'bg-neutral-500/40 border-border-muted';
        if (value > 20) return 'bg-blue-500/50 border-blue-500/50';
        return 'bg-blue-500/80 border-blue-400';
    };

    return (
        <div className="terminal-panel mt-6 overflow-hidden">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">radar</span>
                    Matchup Scouting: Pitcher Tendencies
                </h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Vs LHB / RHB
                </span>
            </div>

            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border-muted">
                {/* Left Side: Strike Zone Visual */}
                <div className="p-6 flex-1 flex flex-col items-center justify-center bg-white dark:bg-neutral-900/40">
                    <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Starting Pitcher Heatmap</h4>

                    {/* The 3x3 Strike Zone Grid */}
                    <div className="relative w-48 h-64 border-2 border-border-muted dark:border-white/20 rounded-sm grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5 bg-white dark:bg-neutral-900/40">
                        {zoneData.map((val, idx) => (
                            <div
                                key={idx}
                                className={`w-full h-full border rounded-sm flex items-center justify-center transition-colors ${getZoneColor(val)}`}
                                title={`Swing Rate: ${val}%`}
                            >
                                <span className="text-[10px] font-bold text-text-main/90">{val}%</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500/80 rounded block"></div>
                            <span className="text-[9px] font-bold text-text-muted uppercase">Hot Zone</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500/80 rounded block"></div>
                            <span className="text-[9px] font-bold text-text-muted uppercase">Cold Zone</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Scouting Report Insights */}
                <div className="p-6 flex-1 flex flex-col justify-center bg-gradient-to-br from-white/5 to-transparent">
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-green-400 text-sm">psychology</span>
                            <h4 className="text-xs font-black text-text-main uppercase tracking-widest">Pitch Arsenal Analysis</h4>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                            Primary fastball relies on high spin rate at the top of the zone. Deep red zones indicate areas where this pitcher generates the highest swinging-strike percentage (Whiff%). Heavily favors the down-and-away slider in 2-strike counts.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-3">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Fastball Velo</span>
                            <span className="text-lg font-black text-text-main">96.4 <span className="text-[10px] text-slate-500">mph</span></span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-3">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Whiff Rate</span>
                            <span className="text-lg font-black text-green-400">32.8%</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-3">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Groundball Rate</span>
                            <span className="text-lg font-black text-text-main">45.2%</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-3">
                            <span className="text-[9px] text-red-400 uppercase font-bold block mb-1">Walk Rate (BB/9)</span>
                            <span className="text-lg font-black text-red-500">3.4</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
