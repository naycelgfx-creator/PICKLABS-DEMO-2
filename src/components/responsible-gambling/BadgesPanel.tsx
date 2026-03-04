import React from 'react';
import { ALL_BADGES, evaluateBadges } from '../../data/BadgesEngine';
import { useResponsibleGambling } from '../../hooks/useResponsibleGambling';

interface Props {
    /** If true, shows all badges (for demo/showcase). Otherwise only earned ones + locked silhouettes */
    showAll?: boolean;
}

export const BadgesPanel: React.FC<Props> = ({ showAll = false }) => {
    const { state } = useResponsibleGambling();
    const earned = evaluateBadges(state.betHistory);

    // Demo: add some badges if no history yet
    const demoEarned = new Set(earned);
    if (state.betHistory.length === 0) {
        demoEarned.add('first_win');
        demoEarned.add('on_fire');
    }

    const displayEarned = showAll
        ? new Set(ALL_BADGES.map(b => b.id))
        : demoEarned;

    return (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400 text-lg">military_tech</span>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white">Achievements</p>
                        <p className="text-[10px] text-text-muted">{displayEarned.size} / {ALL_BADGES.length} badges earned</p>
                    </div>
                </div>
            </div>

            <div className="p-4 grid grid-cols-4 gap-3">
                {ALL_BADGES.map(badge => {
                    const isEarned = displayEarned.has(badge.id);
                    return (
                        <div
                            key={badge.id}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${isEarned
                                ? `${badge.bgColor} border-current/20`
                                : 'bg-white/3 border-border opacity-40 grayscale'
                                }`}
                            title={badge.description}
                        >
                            <span className="text-2xl select-none">{badge.emoji}</span>
                            <p className={`text-[9px] font-black uppercase tracking-wide leading-tight ${isEarned ? badge.color : 'text-text-muted'}`}>
                                {badge.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-4">
                <div className="flex justify-between text-[9px] font-black text-text-muted mb-1">
                    <span>Progress</span>
                    <span>{displayEarned.size}/{ALL_BADGES.length}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                        style={{ width: `${(displayEarned.size / ALL_BADGES.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
