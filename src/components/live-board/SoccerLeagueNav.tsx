import React from 'react';
import { SOCCER_LEAGUES, SportKey } from '../../data/espnScoreboard';

interface SoccerLeagueNavProps {
    activeLeague: SportKey;
    onSelectLeague: (league: SportKey) => void;
}

export const SoccerLeagueNav: React.FC<SoccerLeagueNavProps> = ({ activeLeague, onSelectLeague }) => {
    return (
        <div className="border-b border-border-muted/60 bg-neutral-950/60 backdrop-blur-sm z-30">
            <div className="max-w-[1536px] mx-auto px-6 py-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                    {/* League label */}
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 shrink-0 mr-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">sports_soccer</span>
                        League
                    </span>

                    {SOCCER_LEAGUES.map(league => {
                        const isActive = activeLeague === league.key;
                        return (
                            <button
                                key={league.key}
                                onClick={() => onSelectLeague(league.key)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all duration-150 shrink-0 border ${isActive
                                        ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_8px_rgba(34,197,94,0.15)]'
                                        : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300 hover:bg-neutral-800/60'
                                    }`}
                            >
                                {/* League crest */}
                                <img
                                    src={league.logo}
                                    alt={league.label}
                                    className="h-4 w-4 object-contain"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <span>{league.flag}</span>
                                <span className={isActive ? 'text-primary' : ''}>{league.label}</span>
                                {isActive && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-0.5" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
