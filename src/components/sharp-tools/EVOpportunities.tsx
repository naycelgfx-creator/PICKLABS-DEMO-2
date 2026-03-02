import React, { useState } from 'react';

export const EVOpportunities: React.FC = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [opportunities, setOpportunities] = useState([
        {
            player: 'Anthony Davis',
            prop: 'Over 12.5 Rebounds',
            ev: 18.4,
            market: '-110',
            trueProb: 62.1
        },
        {
            player: 'Jayson Tatum',
            prop: 'Under 28.5 Points',
            ev: 12.2,
            market: '+105',
            trueProb: 54.7
        }
    ]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setOpportunities(prev => prev.map(opp => ({
                ...opp,
                ev: Number((opp.ev + (Math.random() * 4 - 2)).toFixed(1)),
                trueProb: Number((opp.trueProb + (Math.random() * 4 - 2)).toFixed(1)),
            })));
            setIsRefreshing(false);
        }, 1500);
    };

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
                {opportunities.map((opp, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-4 transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{opp.player}</p>
                                <h4 className="text-sm font-bold text-text-main">{opp.prop}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-accent-purple">+{opp.ev.toFixed(1)}% EV</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Market Odds</p>
                                <p className="text-xs font-bold text-text-main">{opp.market}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] text-slate-500 uppercase font-bold">True Prob</p>
                                <p className="text-xs font-bold text-primary">{opp.trueProb.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full py-4 text-[#A855F7] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-accent-purple/5 transition-colors bg-black/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isRefreshing ? (
                    <>
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        Refreshing...
                    </>
                ) : (
                    <>
                        Refresh AI Probabilities
                    </>
                )}
            </button>
        </div>
    );
};
