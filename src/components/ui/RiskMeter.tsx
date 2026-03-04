import React from 'react';

interface RiskMeterProps {
    odds: string; // American odds string e.g. "-110", "+250", "-150"
    className?: string;
}

function parseImpliedProb(oddsStr: string): number {
    const n = parseInt(oddsStr.replace(/\s/g, ''));
    if (isNaN(n)) return 50;
    if (n < 0) {
        return Math.abs(n) / (Math.abs(n) + 100) * 100;
    } else {
        return 100 / (n + 100) * 100;
    }
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ odds, className = '' }) => {
    const prob = parseImpliedProb(odds);

    let color: string;
    let label: string;
    let icon: string;

    if (prob >= 65) {
        color = 'bg-primary';
        label = 'Safe Fav';
        icon = 'shield';
    } else if (prob >= 45) {
        color = 'bg-yellow-400';
        label = 'Coin Toss';
        icon = 'balance';
    } else {
        color = 'bg-red-500';
        label = 'Longshot';
        icon = 'local_fire_department';
    }

    const textColor = prob >= 65 ? 'text-primary' : prob >= 45 ? 'text-yellow-400' : 'text-red-500';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className={`material-symbols-outlined text-[11px] ${textColor}`}>{icon}</span>
            <div className="flex-1 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(prob, 100).toFixed(0)}%` }}
                />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${textColor} shrink-0`}>
                {label}
            </span>
            <span className="text-[9px] text-slate-500 font-bold shrink-0">
                {prob.toFixed(0)}%
            </span>
        </div>
    );
};
