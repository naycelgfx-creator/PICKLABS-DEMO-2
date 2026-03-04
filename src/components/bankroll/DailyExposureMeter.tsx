import React from 'react';

export const DailyExposureMeter: React.FC = () => {
    // Mock values
    const totalExposure = 1250;
    const maxRecommended = 2000;
    const exposurePercent = Math.min((totalExposure / maxRecommended) * 100, 100);

    // Status colors based on percent
    const getStatusColor = () => {
        if (exposurePercent < 50) return 'bg-primary';
        if (exposurePercent < 80) return 'bg-yellow-400';
        return 'bg-red-500';
    };

    return (
        <div className="glass-panel p-6 border border-border-muted rounded-xl bg-[#111] flex flex-col h-full relative overflow-hidden group">
            {/* Background Gradient Effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-blue/5 rounded-full blur-3xl group-hover:bg-accent-blue/10 transition-colors"></div>

            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-blue">water_drop</span>
                    <h3 className="text-lg font-black text-text-main uppercase italic tracking-wider">Daily Exposure</h3>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-text-main">${totalExposure.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">At Risk</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <div className="relative h-4 bg-background-dark rounded-full overflow-hidden border border-white/5 mb-2">
                    <div
                        className={`absolute top-0 left-0 h-full ${getStatusColor()} transition-all duration-1000 ease-out`}
                        style={{ width: `${exposurePercent}%` }}
                    ></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-500">Safe Zone</span>
                    <span className="text-text-muted">Limit: ${maxRecommended.toLocaleString()}</span>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted font-medium">Pending Bets</span>
                    <span className="text-text-main font-bold">14</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-text-muted font-medium">Largest Stake</span>
                    <span className="text-text-main font-bold">$250.00</span>
                </div>
            </div>
        </div>
    );
};
