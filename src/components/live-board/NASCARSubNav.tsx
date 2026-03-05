import React from 'react';
import { SportKey, NASCAR_SERIES } from '../../data/espnScoreboard';

interface NASCARSubNavProps {
    activeSeries: SportKey;
    onSelectSeries: (series: SportKey) => void;
}

export const NASCARSubNav: React.FC<NASCARSubNavProps> = ({ activeSeries, onSelectSeries }) => {
    return (
        <div className="sticky top-[56px] z-20 bg-neutral-950/95 backdrop-blur border-b border-border-muted">
            <div className="max-w-[1536px] mx-auto px-6">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest shrink-0 mr-2">Series</span>

                    {NASCAR_SERIES.map(series => {
                        const isActive = activeSeries === series.key;
                        return (
                            <button
                                key={series.key}
                                onClick={() => onSelectSeries(series.key)}
                                className={`
                                    flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0
                                    ${isActive
                                        ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_8px_rgba(var(--color-primary-rgb)/0.15)]'
                                        : 'text-slate-500 hover:text-slate-300 border border-transparent hover:border-border-muted'
                                    }
                                `}
                            >
                                <span className="text-sm">{series.flag}</span>
                                <span>{series.label}</span>
                                <span className={`text-[9px] font-normal ${isActive ? 'text-primary/70' : 'text-slate-600'}`}>
                                    {series.description}
                                </span>
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
