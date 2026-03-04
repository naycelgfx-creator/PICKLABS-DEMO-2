import React from 'react';

export const SharpFlow: React.FC = () => {
    return (
        <div className="col-span-12 lg:col-span-4 terminal-panel border-border-muted overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-muted bg-white dark:bg-neutral-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-text-muted">trending_up</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">Sharp Flow</h3>
                </div>
                <div className="flex gap-1">
                    <div className="w-1 h-3 bg-primary/40"></div>
                    <div className="w-1 h-3 bg-primary/60"></div>
                    <div className="w-1 h-3 bg-primary"></div>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <h4 className="text-xs font-bold text-text-main uppercase tracking-tight">BOS Celtics @ LAL Lakers</h4>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">Spread Movement (Last 12h)</p>
                            </div>
                            <span className="text-[10px] font-black text-primary italic">-2.5 &rarr; -4.5</span>
                        </div>
                        <div className="h-24 flex items-end gap-1 px-1">
                            <div className="flex-1 bg-neutral-800 rounded-t-sm h-[40%]"></div>
                            <div className="flex-1 bg-neutral-800 rounded-t-sm h-[38%]"></div>
                            <div className="flex-1 bg-neutral-800 rounded-t-sm h-[45%]"></div>
                            <div className="flex-1 bg-neutral-800 rounded-t-sm h-[55%]"></div>
                            <div className="flex-1 bg-neutral-800 rounded-t-sm h-[52%]"></div>
                            <div className="flex-1 bg-primary/50 rounded-t-sm h-[70%]"></div>
                            <div className="flex-1 bg-primary rounded-t-sm h-[85%] shadow-[0_0_10px_rgba(13,242,13,0.3)]"></div>
                            <div className="flex-1 bg-primary rounded-t-sm h-[100%] shadow-[0_0_15px_rgba(13,242,13,0.5)]"></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-900/40 rounded-lg p-3 border border-border-muted">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-[14px] text-primary">info</span>
                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Alert</span>
                        </div>
                        <p className="text-[10px] text-text-muted italic leading-relaxed">
                            Steam detected on Boston -4.5. 72% of handle from 4 high-limit offshore accounts.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
