import React from 'react';

export const BettingFlowTable: React.FC = () => {
    return (
        <div className="col-span-12 pb-12">
            <div className="terminal-panel overflow-hidden">
                <div className="p-4 border-b border-border-muted bg-neutral-800/80 flex items-center justify-between">
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent-purple text-sm">payments</span>
                        Public Betting &amp; Money Flow
                    </h3>
                    <div className="text-[10px] text-slate-500 font-bold uppercase italic">Real-time Book Sync: 2s ago</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] text-slate-500 uppercase tracking-widest bg-white dark:bg-neutral-900/40">
                                <th className="px-6 py-4 text-left border-b border-border-muted">Market Type</th>
                                <th className="px-6 py-4 text-center border-b border-border-muted">Outcome</th>
                                <th className="px-6 py-4 text-center border-b border-border-muted">Public Bets %</th>
                                <th className="px-6 py-4 text-center border-b border-border-muted">Money %</th>
                                <th className="px-6 py-4 text-center border-b border-border-muted">Handle Gap</th>
                                <th className="px-6 py-4 text-right border-b border-border-muted">Signal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-muted">
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold text-text-main">Spread</td>
                                <td className="px-6 py-4 text-center text-text-muted">Celtics -5.5</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-white">68%</span>
                                        <div className="w-12 h-1 bg-neutral-800 rounded-full"><div className="h-full bg-slate-500" style={{ width: '68%' }}></div></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-primary font-bold">82%</span>
                                        <div className="w-12 h-1 bg-neutral-800 rounded-full"><div className="h-full bg-primary" style={{ width: '82%' }}></div></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-primary">+14%</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded font-black uppercase">Sharp Action</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold text-text-main">Moneyline</td>
                                <td className="px-6 py-4 text-center text-text-muted">Lakers (+180)</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-white">45%</span>
                                        <div className="w-12 h-1 bg-neutral-800 rounded-full"><div className="h-full bg-slate-500" style={{ width: '45%' }}></div></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-white">32%</span>
                                        <div className="w-12 h-1 bg-neutral-800 rounded-full"><div className="h-full bg-slate-500" style={{ width: '32%' }}></div></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-red-500">-13%</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-[10px] px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded font-black uppercase">Public Fade</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-bold text-text-main">Over/Under</td>
                                <td className="px-6 py-4 text-center text-text-muted">Over 224.5</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-white">74%</span>
                                        <div className="w-12 h-1 bg-neutral-800 rounded-full"><div className="h-full bg-slate-500" style={{ width: '74%' }}></div></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-accent-purple font-bold">78%</span>
                                        <div className="w-12 h-1 bg-neutral-800 rounded-full"><div className="h-full bg-accent-purple" style={{ width: '78%' }}></div></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-accent-purple">+4%</td>
                                <td className="px-6 py-4 text-right">
                                    <span className="text-[10px] px-2 py-1 bg-slate-800 text-text-muted border border-border-muted rounded font-black uppercase">Neutral</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
