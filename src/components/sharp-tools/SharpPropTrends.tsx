import React from 'react';

export const SharpPropTrends: React.FC = () => {
    return (
        <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-accent-purple shadow-[0_0_10px_#a855f7]"></div>
                    <h2 className="text-xl font-black text-text-main italic uppercase tracking-tighter">Sharp Prop Trends</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="text-[10px] text-text-muted font-bold uppercase">Over Hit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-[10px] text-text-muted font-bold uppercase">Under Hit</span>
                    </div>
                </div>
            </div>

            <div className="terminal-panel overflow-hidden">
                <div className="p-6 overflow-x-auto custom-scrollbar">
                    <div className="flex gap-6 min-w-max pb-4">

                        {/* Prop Card 1 */}
                        <div className="w-[340px] bg-neutral-800/40 border border-border-muted rounded-xl p-5 hover:border-primary/50 hover:bg-neutral-800/60 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-base font-black text-text-main uppercase tracking-wide group-hover:text-primary transition-colors">Anthony Davis</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">LAL | Center</span>
                                        <span className="text-[10px] text-primary font-bold uppercase bg-primary/10 px-1.5 rounded">Rebounds: 12.5</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded font-black uppercase italic">Over in 4 of 5</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">14</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">@MIN</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">16</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">vs PHX</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-text-main font-black text-sm border-2 border-red-500/20">11</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">@SAC</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">15</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">vs GSW</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">13</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">@DEN</span>
                                </div>
                            </div>
                        </div>

                        {/* Prop Card 2 */}
                        <div className="w-[340px] bg-neutral-800/40 border border-border-muted rounded-xl p-5 hover:border-accent-purple/50 hover:bg-neutral-800/60 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-base font-black text-text-main uppercase tracking-wide group-hover:text-accent-purple transition-colors">Jayson Tatum</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">BOS | Forward</span>
                                        <span className="text-[10px] text-accent-purple font-bold uppercase bg-accent-purple/10 px-1.5 rounded">Points: 28.5</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] px-2 py-1 bg-accent-purple/10 text-accent-purple border border-accent-purple/30 rounded font-black uppercase italic">Over in 2 of 5</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-text-main font-black text-sm border-2 border-red-500/20">26</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">vs MIA</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">32</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">@PHI</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-text-main font-black text-sm border-2 border-red-500/20">24</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">vs NYK</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500 text-text-main font-black text-sm border-2 border-red-500/20">21</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">@CHI</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">35</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">vs MIL</span>
                                </div>
                            </div>
                        </div>

                        {/* Prop Card 3 */}
                        <div className="w-[340px] bg-neutral-800/40 border border-border-muted rounded-xl p-5 hover:border-primary/50 hover:bg-neutral-800/60 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-base font-black text-text-main uppercase tracking-wide group-hover:text-primary transition-colors">LeBron James</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">LAL | Forward</span>
                                        <span className="text-[10px] text-primary font-bold uppercase bg-primary/10 px-1.5 rounded">Assists: 7.5</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded font-black uppercase italic">Over in 5 of 5</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">9</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">@MIN</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">11</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">vs PHX</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">8</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">@SAC</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">10</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">vs GSW</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary text-black font-black text-sm border-2 border-primary/20 shadow-[0_0_10px_rgba(13,242,13,0.2)]">9</div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">@DEN</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
