import React from 'react';

export const PerformanceWidget: React.FC = () => {
    return (
        <div className="glass-panel p-6 border border-border-muted rounded-xl bg-gradient-to-br from-[#111] to-[#0a0a0a] flex flex-col h-full relative overflow-hidden group">

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">monitoring</span>
                    <h3 className="text-lg font-black text-text-main uppercase italic tracking-wider">Your Performance</h3>
                </div>
                <div className="px-2 py-0.5 bg-white/5 border border-border-muted dark:border-white/10 rounded">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Last 30 Days</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Win Rate */}
                <div className="flex flex-col justify-center bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Win Rate</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-text-main">56.2%</span>
                        <span className="text-xs font-bold text-primary">+2.1%</span>
                    </div>
                </div>

                {/* Profit/Loss */}
                <div className="flex flex-col justify-center bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Net ROI</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-text-main">+8.4%</span>
                        <span className="text-xs font-bold text-primary">+$420</span>
                    </div>
                </div>

                {/* Best Sport */}
                <div className="flex flex-col justify-center bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Best Sport</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-text-main">NBA</span>
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded">62% WR</span>
                    </div>
                </div>

                {/* Worst Sport */}
                <div className="flex flex-col justify-center bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Needs Work</span>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-text-main">NFL</span>
                        <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">48% WR</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
