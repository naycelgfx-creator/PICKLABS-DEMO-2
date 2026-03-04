import React from 'react';
import { useRookieMode } from '../../contexts/RookieModeContext';

export const RookieGuideBanner: React.FC = () => {
    const { isRookieModeActive, toggleRookieMode } = useRookieMode();

    if (!isRookieModeActive) return null;

    return (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 mb-6 shadow-[0_0_15px_rgba(250,204,21,0.15)] relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>

            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400">school</span>
                    <h3 className="text-yellow-400 font-black tracking-wider uppercase text-sm">Rookie Mode Guide</h3>
                </div>
                <button onClick={toggleRookieMode} className="text-text-muted hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Moneyline */}
                <div className="bg-black/30 border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors">
                    <h4 className="text-white font-bold text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Moneyline (ML)
                    </h4>
                    <p className="text-[10px] text-text-muted leading-relaxed">The simplest bet. You are just picking which team will win the game outright. No point spreads involved.</p>
                </div>

                {/* Spread */}
                <div className="bg-black/30 border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors">
                    <h4 className="text-white font-bold text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Point Spread
                    </h4>
                    <p className="text-[10px] text-text-muted leading-relaxed">The favored team (has a <span className="text-red-400">-</span>) must win by MORE than that number. The underdog (has a <span className="text-green-400">+</span>) can lose by less than that number or win.</p>
                </div>

                {/* Over/Under */}
                <div className="bg-black/30 border border-white/5 rounded-lg p-3 hover:border-white/10 transition-colors">
                    <h4 className="text-white font-bold text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        Over / Under
                    </h4>
                    <p className="text-[10px] text-text-muted leading-relaxed">A bet on the total combined score of both teams. You bet whether the final score will be OVER or UNDER this set number.</p>
                </div>

                {/* Kelly */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 hover:border-primary/40 transition-colors">
                    <h4 className="text-primary font-bold text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">functions</span>
                        Kelly Criterion
                    </h4>
                    <p className="text-[10px] text-primary/80 leading-relaxed">A mathematical formula that tells you exactly <span className="text-primary font-bold">how much to bet</span> based on your true edge, maximizing growth while minimizing risk of going broke.</p>
                </div>

                {/* Edge */}
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 hover:border-green-500/40 transition-colors">
                    <h4 className="text-green-400 font-bold text-[11px] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        AI Edge
                    </h4>
                    <p className="text-[10px] text-green-400/80 leading-relaxed">The statistical advantage over the sportsbook. If our AI wins 60% of the time, but the odds imply a 50% chance, you have a <span className="text-green-400 font-bold">+10% Edge</span>.</p>
                </div>
            </div>
        </div>
    );
};
