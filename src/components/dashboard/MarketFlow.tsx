import React from 'react';
import { Game } from '../../data/mockGames';

interface MarketFlowProps {
    game: Game;
}

export const MarketFlow: React.FC<MarketFlowProps> = ({ game }) => {
    const favoredTeam = game.homeTeam.name;
    return (
        <div className="terminal-panel overflow-hidden h-full">
            <div className="p-4 border-b border-border-muted bg-neutral-800/80 flex items-center justify-between">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-purple text-sm">payments</span>
                    Market Flow
                </h3>
            </div>
            <div className="p-6 space-y-6 flex flex-col justify-between h-[calc(100%-54px)]">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Spread Handle Gap</p>
                        <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded font-black uppercase shadow-[0_0_10px_rgba(13,242,13,0.2)]">Sharp Signal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <div>
                                <div className="flex justify-between text-[10px] text-text-muted font-bold uppercase mb-1">
                                    <span>Tickets</span>
                                    <span>68%</span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-500 rounded-full" style={{ width: '68%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-primary font-bold uppercase mb-1">
                                    <span>Money</span>
                                    <span>82%</span>
                                </div>
                                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(13,242,13,0.5)]" style={{ width: '82%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="text-center min-w-[60px]">
                            <p className="text-3xl font-black text-primary italic leading-none">+14%</p>
                            <p className="text-[8px] text-slate-500 uppercase mt-1">Gap</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border-muted">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-sm">psychology</span>
                        <h3 className="text-xs font-black text-text-main uppercase tracking-widest">AI Reasoning</h3>
                    </div>
                    <p className={`text-[11px] text-text-muted leading-relaxed italic bg-white/5 p-4 rounded-lg border border-border-muted/50`}>
                        {`"Significant professional money entering on ${favoredTeam} Spread. 14% handle gap suggests institutional confidence despite heavy public volume."`}
                    </p>
                </div>
            </div>
        </div>
    );
};
