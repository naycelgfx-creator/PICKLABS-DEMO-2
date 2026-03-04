import React from 'react';

export const InsightsPanel: React.FC = () => {
    return (
        <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="terminal-panel p-5 border-l-2 border-primary">
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-sm">psychology</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-widest">AI Reasoning Engine</h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed italic">
                    "Model detects high efficiency mismatch in the paint. Boston's secondary defensive rotation is lagging by 0.4s vs league average. Fair spread value calculated at BOS -4.2."
                </p>
                <div className="mt-4 pt-4 border-t border-border-muted flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Confidence Score</span>
                    <span className="text-primary font-black">84.2%</span>
                </div>
            </div>
            <div className="terminal-panel p-5 border-l-2 border-accent-purple">
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-accent-purple text-sm">history_edu</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-widest">Historical Trend</h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                    Boston is 12-2 Straight Up at home following a loss this season. Average margin of victory in those games is +11.4 points.
                </p>
            </div>
        </div>
    );
};
