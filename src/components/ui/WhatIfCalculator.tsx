import React, { useState } from 'react';

interface WhatIfCalculatorProps {
    odds: string;
}

function calcToWin(stake: number, oddsStr: string): number {
    if (!oddsStr || typeof oddsStr !== 'string' || oddsStr === 'N/A') return 0;
    const n = parseInt(oddsStr.replace(/\s/g, '').replace('+', ''));
    if (isNaN(n)) return 0;
    if (n > 0) return stake * (n / 100);
    return stake / (Math.abs(n) / 100);
}

export const WhatIfCalculator: React.FC<WhatIfCalculatorProps> = ({ odds }) => {
    const [stake, setStake] = useState(10);
    const toWin = calcToWin(stake, odds);
    const totalPayout = stake + toWin;

    return (
        <div className="mt-2 p-2.5 bg-yellow-400/5 border border-yellow-400/20 rounded-lg">
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-2">
                <span className="material-symbols-outlined text-yellow-400 text-xs">calculate</span>
                <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">What If? Calculator</span>
            </div>

            {/* Slider */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-slate-400 font-bold shrink-0">$5</span>
                <input
                    type="range"
                    min={5}
                    max={500}
                    step={5}
                    value={stake}
                    onChange={e => setStake(Number(e.target.value))}
                    className="flex-1 accent-yellow-400 cursor-pointer h-1"
                />
                <span className="text-[10px] text-slate-400 font-bold shrink-0">$500</span>
            </div>

            {/* Payout display */}
            <div className="text-center space-y-0.5">
                <p className="text-[11px] text-slate-400 font-medium">
                    Bet <span className="text-yellow-300 font-black">${stake}</span>
                    <span className="text-slate-500 mx-1">→</span>
                    Risk <span className="text-white font-black">${stake}</span> to win
                    <span className="text-primary font-black ml-1">+${toWin.toFixed(2)}</span>
                </p>
                <p className="text-[10px] text-slate-500">
                    Total payout: <span className="text-primary font-black">${totalPayout.toFixed(2)}</span>
                </p>
            </div>
        </div>
    );
};
