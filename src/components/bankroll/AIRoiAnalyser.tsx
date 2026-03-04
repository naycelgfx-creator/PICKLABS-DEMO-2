import React from 'react';

export const AIRoiAnalyser: React.FC = () => {
    return (
        <div className="glass-panel p-6 border border-accent-purple/30 rounded-xl bg-[#111] flex flex-col h-full relative overflow-hidden group">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-purple/5 rounded-full blur-3xl group-hover:bg-accent-purple/10 transition-colors"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-purple">smart_toy</span>
                    <h3 className="text-lg font-black text-text-main uppercase italic tracking-wider">AI ROI Analyser</h3>
                </div>
                <div className="px-2 py-0.5 bg-accent-purple/10 border border-accent-purple/20 rounded">
                    <span className="text-[10px] font-bold text-accent-purple uppercase tracking-widest">Model vs You</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-around relative z-10 gap-4">
                <p className="text-sm text-text-muted leading-relaxed font-medium">
                    Our predictive model shows a <span className="text-primary font-bold">+12.4% ROI</span> over the last 30 days across all suggested bets, compared to your <span className="text-text-main font-bold">+8.4% ROI</span>.
                </p>

                <div className="flex flex-col gap-2 bg-white dark:bg-neutral-900/40 border border-border-muted p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-text-muted">Model ROI (Target)</span>
                        <span className="text-xs font-black text-accent-purple">+12.4%</span>
                    </div>
                    <div className="relative h-2 bg-background-dark rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-accent-purple w-[75%]"></div>
                    </div>

                    <div className="flex justify-between items-center mt-2 mb-1">
                        <span className="text-xs font-bold text-text-muted">Your ROI</span>
                        <span className="text-xs font-black text-primary">+8.4%</span>
                    </div>
                    <div className="relative h-2 bg-background-dark rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-primary w-[55%]"></div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                    <span className="material-symbols-outlined text-sm text-yellow-400">lightbulb</span>
                    <span>You are highly profitable, but fading the public on NBA Underdogs could increase your yield.</span>
                </div>
            </div>
        </div>
    );
};
