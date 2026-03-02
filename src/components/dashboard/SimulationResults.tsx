import React from 'react';
import { Game } from '../../data/mockGames';

interface SimulationResultsProps {
    game: Game;
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({ game }) => {
    // Generate mock win probabilities based on Vegas Prob for visual demonstration
    const homeProb = parseFloat(game.homeTeam.winProb.toString());
    const awayProb = parseFloat(game.awayTeam.winProb.toString());

    // Normalize if they don't add to 100
    const total = homeProb + awayProb;
    const homePercent = ((homeProb / total) * 100).toFixed(1);
    const awayPercent = ((awayProb / total) * 100).toFixed(1);

    // Calculate SVG stroke dashes (circumference = 2 * pi * r = ~276)
    const awayDashoffset = 276 - (parseFloat(awayPercent) / 100) * 276;
    const homeDashoffset = 276 - (parseFloat(homePercent) / 100) * 276;

    const awayAbbr = game.awayTeam.name.substring(0, 3).toUpperCase();
    const homeAbbr = game.homeTeam.name.substring(0, 3).toUpperCase();

    return (
        <div className="terminal-panel border-accent-purple/30 bg-accent-purple/5 overflow-hidden">
            <div className="p-4 border-b border-border-muted bg-white dark:bg-neutral-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-accent-purple">query_stats</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">Simulation Results: 10,000 Iterations</h3>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Model Confidence</p>
                        <p className="text-sm font-black text-accent-purple uppercase tracking-tighter">High (0.04σ Variance)</p>
                    </div>
                </div>
            </div>
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="flex items-center justify-around bg-white dark:bg-neutral-900/40 rounded-xl p-6 border border-border-muted">
                    <div className="text-center">
                        <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                            <svg className="w-full h-full -rotate-90">
                                <circle className="text-neutral-800" cx="48" cy="48" fill="transparent" r="44" stroke="currentColor" strokeWidth="6"></circle>
                                <circle className="text-primary" cx="48" cy="48" fill="transparent" r="44" stroke="currentColor" strokeDasharray="276" strokeDashoffset={awayDashoffset} strokeWidth="6"></circle>
                            </svg>
                            <span className="absolute text-xl font-black italic text-text-main">
                                {`${awayPercent}%`}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase">{awayAbbr} Win %</p>
                    </div>
                    <div className="text-center">
                        <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                            <svg className="w-full h-full -rotate-90">
                                <circle className="text-neutral-800" cx="48" cy="48" fill="transparent" r="44" stroke="currentColor" strokeWidth="6"></circle>
                                <circle className="text-accent-purple" cx="48" cy="48" fill="transparent" r="44" stroke="currentColor" strokeDasharray="276" strokeDashoffset={homeDashoffset} strokeWidth="6"></circle>
                            </svg>
                            <span className="absolute text-xl font-black italic text-text-main">
                                {`${homePercent}%`}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase">{homeAbbr} Win %</p>
                    </div>
                </div>
                <div className="lg:col-span-1 bg-white dark:bg-neutral-900/40 rounded-xl p-6 border border-border-muted flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Probability Distribution</h4>
                        <span className="text-[9px] text-accent-purple font-bold">σ = 14.5</span>
                    </div>
                    <div className="flex items-end justify-between h-32 gap-1 px-2">
                        <div className="w-2 bg-accent-purple/10 h-[10%] rounded-t-sm"></div>
                        <div className="w-2 bg-accent-purple/20 h-[25%] rounded-t-sm"></div>
                        <div className="w-2 bg-accent-purple/30 h-[45%] rounded-t-sm"></div>
                        <div className="w-2 bg-accent-purple/50 h-[75%] rounded-t-sm"></div>
                        <div className="w-2 bg-accent-purple h-[95%] rounded-t-sm shadow-[0_0_10px_rgba(168,85,247,0.4)]"></div>
                        <div className="w-2 bg-accent-purple h-[100%] rounded-t-sm shadow-[0_0_15px_rgba(168,85,247,0.6)]"></div>
                        <div className="w-2 bg-accent-purple h-[85%] rounded-t-sm shadow-[0_0_10px_rgba(168,85,247,0.4)]"></div>
                        <div className="w-2 bg-accent-purple/50 h-[60%] rounded-t-sm"></div>
                        <div className="w-2 bg-accent-purple/30 h-[35%] rounded-t-sm"></div>
                        <div className="w-2 bg-accent-purple/20 h-[15%] rounded-t-sm"></div>
                        <div className="w-2 bg-accent-purple/10 h-[5%] rounded-t-sm"></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[8px] text-slate-500 font-bold uppercase">
                        <span>-25 Spread</span>
                        <span>Most Likely</span>
                        <span>+25 Spread</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-neutral-900/40 rounded-xl p-6 border border-border-muted flex flex-col justify-center">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-6 italic text-center">Most Likely Final Score</p>
                    <div className="flex items-center justify-center gap-8">
                        <div className="text-center">
                            <p className="text-4xl font-black text-text-main italic tracking-tighter">114</p>
                            <p className="text-[10px] text-primary font-bold">{awayAbbr}</p>
                        </div>
                        <div className="h-10 w-[1px] bg-border-muted rotate-12"></div>
                        <div className="text-center">
                            <p className="text-4xl font-black text-text-main italic tracking-tighter">121</p>
                            <p className="text-[10px] text-accent-purple font-bold">{homeAbbr}</p>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-border-muted/50 text-center">
                        <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Expected Total</p>
                        <p className="text-lg font-bold text-text-main tracking-[0.3em]">235.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
