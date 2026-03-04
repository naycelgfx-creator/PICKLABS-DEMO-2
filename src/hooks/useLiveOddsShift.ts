import { useState, useEffect, useMemo } from 'react';

// Generates pseudo-random shifting odds values every 10 seconds for live games
export function useLiveOddsShift(status: string, gameId: string) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        // Only run for "in-progress" (live) games
        if (status !== 'in' && status !== 'LIVE') return;

        // Shift every 10 seconds for visual feedback as requested
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 10000);
        return () => clearInterval(interval);
    }, [status]);

    return useMemo(() => {
        if (status !== 'in' && status !== 'LIVE') {
            return { spreadShift: 0, mlShift: 0, totalShift: 0, confidenceShift: 0 };
        }

        // Simple pseudo-random hash based on gameId and tick
        const hashStr = gameId + tick.toString();

        let h = 0;
        for (let i = 0; i < hashStr.length; i++) {
            h = Math.imul(31, h) + hashStr.charCodeAt(i) | 0;
        }

        // Make hash positive
        h = Math.abs(h);

        // Spread shifts between -2.0 and +2.0 (steps of 0.5)
        const spreadShift = ((h % 9) - 4) / 2;

        // ML shifts between -25 and +25 (steps of 5)
        const mlShift = ((h % 11) - 5) * 5;

        // Total shifts between -3.0 and +3.0 (steps of 0.5)
        const totalShift = ((h % 13) - 6) / 2;

        // Confidence shifts slightly between -4 and +4
        const confidenceShift = ((h % 9) - 4);

        return { spreadShift, mlShift, totalShift, confidenceShift };
    }, [status, gameId, tick]);
}

// Helper to apply the shift to formatted odds strings
export function applyOddsShift(oddsStr: string, shift: number): string {
    if (!oddsStr || oddsStr === 'N/A') return oddsStr;
    const isTotalOrSpread = oddsStr.includes('.') || Math.abs(parseInt(oddsStr)) < 100;

    if (isTotalOrSpread) {
        // e.g. "-4.5" or "228.5"
        const val = parseFloat(oddsStr);
        if (isNaN(val)) return oddsStr;
        const newVal = val + shift;

        // Never allow a total or spread to become exactly 0 for presentation
        if (Math.abs(newVal) < 0.1 && (oddsStr.includes('+') || oddsStr.includes('-'))) return '+0.5';

        return newVal > 0 && String(newVal).indexOf('.') === -1 ? `+${newVal.toFixed(1)}` : newVal.toFixed(1);
    } else {
        // ML e.g. "+150" or "-130"
        let val = parseInt(oddsStr);
        if (isNaN(val)) return oddsStr;

        val += shift;

        // Avoid -99 to +99 for moneyline (usually impossible/invalid in American odds)
        if (val > -100 && val < 0) val = -105;
        if (val < 100 && val >= 0) val = +105;

        return val > 0 ? `+${val}` : `${val}`;
    }
}
