import React from 'react';

export const EVOpportunities: React.FC = () => {
    return (
        <div className="col-span-12 lg:col-span-4 terminal-panel border-accent-purple/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-shadow overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-muted bg-white dark:bg-neutral-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-accent-purple">calculate</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">EV+ Opportunities</h3>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-accent-purple/10 text-accent-purple border border-accent-purple/30 rounded font-black uppercase">Calculated</span>
            </div>

            <div className="p-4 space-y-4 flex-1">
                {/* EV Row 1 */}
                <div className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Anthony Davis</p>
                            <h4 className="text-sm font-bold text-text-main">Over 12.5 Rebounds</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-accent-purple">+18.4% EV</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 uppercase font-bold">Market Odds</p>
                            <p className="text-xs font-bold text-text-main">-110</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 uppercase font-bold">True Prob</p>
                            <p className="text-xs font-bold text-primary">62.1%</p>
                        </div>
                    </div>
                </div>

                {/* EV Row 2 */}
                <div className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Jayson Tatum</p>
                            <h4 className="text-sm font-bold text-text-main">Under 28.5 Points</h4>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-accent-purple">+12.2% EV</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 uppercase font-bold">Market Odds</p>
                            <p className="text-xs font-bold text-text-main">+105</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] text-slate-500 uppercase font-bold">True Prob</p>
                            <p className="text-xs font-bold text-primary">54.7%</p>
                        </div>
                    </div>
                </div>
            </div>

            <button className="w-full py-4 text-[#A855F7] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-accent-purple/5 transition-colors bg-black/20">
                Refresh AI Probabilities
            </button>
        </div>
    );
};
