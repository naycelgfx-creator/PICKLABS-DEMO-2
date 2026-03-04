import React from 'react';

export const DepthChart: React.FC = () => {
    return (
        <div className="col-span-12">
            <div className="terminal-panel">
                <div className="p-4 border-b border-border-muted bg-white/5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-text-muted text-sm">groups</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">Expected Depth Chart &amp; Injury Status</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-border-muted">
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            <h4 className="text-sm font-bold text-text-main uppercase italic">Los Angeles Lakers</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">PG</span>
                                    <span className="text-sm text-text-main">D'Angelo Russell</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-primary text-primary font-bold">Probable</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">SG</span>
                                    <span className="text-sm text-text-main">Austin Reaves</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-500 font-bold">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">SF</span>
                                    <span className="text-sm text-text-main">LeBron James</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-yellow-500/50 text-yellow-500 font-bold">Questionable</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">PF</span>
                                    <span className="text-sm text-text-main">Rui Hachimura</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-500 font-bold">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">C</span>
                                    <span className="text-sm text-text-main">Anthony Davis</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-red-500 text-red-500 font-bold">Out</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent-purple"></div>
                            <h4 className="text-sm font-bold text-text-main uppercase italic">Boston Celtics</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">PG</span>
                                    <span className="text-sm text-text-main">Jrue Holiday</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-500 font-bold">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">SG</span>
                                    <span className="text-sm text-text-main">Derrick White</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-500 font-bold">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">SF</span>
                                    <span className="text-sm text-text-main">Jaylen Brown</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-primary text-primary font-bold">Probable</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">PF</span>
                                    <span className="text-sm text-text-main">Jayson Tatum</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-500 font-bold">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-4">C</span>
                                    <span className="text-sm text-text-main">Kristaps Porziņģis</span>
                                </div>
                                <span className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-500 font-bold">Healthy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
