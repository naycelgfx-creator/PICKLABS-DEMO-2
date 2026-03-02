import React from 'react';

export const ArbitrageFinder: React.FC = () => {
    return (
        <div className="col-span-12 lg:col-span-4 terminal-panel border-primary/20 hover:shadow-[0_0_15px_rgba(13,242,13,0.1)] transition-shadow overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-muted bg-white dark:bg-neutral-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">swap_horiz</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">Arbitrage Finder</h3>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/30 rounded font-black uppercase">Live</span>
            </div>

            <div className="p-4 space-y-4 flex-1">
                {/* Arb Row 1 */}
                <div className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-3 hover:border-primary/40 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">LAL Lakers ML</span>
                        <span className="text-xs font-black text-primary italic">+4.82% Profit</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="flex-1 bg-neutral-800/50 p-2 rounded border border-border-muted">
                            <p className="text-[8px] text-slate-500 uppercase font-black">Book A</p>
                            <p className="text-sm font-bold text-text-main">+115</p>
                        </div>
                        <div className="flex-1 bg-neutral-800/50 p-2 rounded border border-border-muted">
                            <p className="text-[8px] text-slate-500 uppercase font-black">Book B</p>
                            <p className="text-sm font-bold text-text-main">-105</p>
                        </div>
                    </div>
                </div>

                {/* Arb Row 2 */}
                <div className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-3 hover:border-primary/40 transition-all">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">BOS/NYK Over 228.5</span>
                        <span className="text-xs font-black text-primary italic">+2.15% Profit</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <div className="flex-1 bg-neutral-800/50 p-2 rounded border border-border-muted">
                            <p className="text-[8px] text-slate-500 uppercase font-black">Book C</p>
                            <p className="text-sm font-bold text-text-main">+102</p>
                        </div>
                        <div className="flex-1 bg-neutral-800/50 p-2 rounded border border-border-muted">
                            <p className="text-[8px] text-slate-500 uppercase font-black">Book D</p>
                            <p className="text-sm font-bold text-text-main">-101</p>
                        </div>
                    </div>
                </div>
            </div>

            <button className="w-full py-4 text-[#A3FF00] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#A3FF00]/5 transition-colors bg-black/20">
                View 12 More Opportunities
            </button>
        </div>
    );
};
