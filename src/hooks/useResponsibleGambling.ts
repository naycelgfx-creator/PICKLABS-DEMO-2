/**
 * useResponsibleGambling.ts
 * Shared state hook for Responsible Gambling features.
 * All state persisted to localStorage so it survives page refresh.
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BetRecord {
    id: string;
    amount: number;          // dollar amount wagered
    result: 'win' | 'loss' | 'pending';
    sport: string;
    timestamp: number;
}

interface RGState {
    /** Unix ms timestamp of when the break ends (0 = not on break) */
    breakEndsAt: number;
    /** Loss limit in dollars (-1 = no limit) */
    lossLimit: number;
    /** Total losses recorded so far this session */
    sessionLosses: number;
    /** Bet history for chasing-loss detection */
    betHistory: BetRecord[];
}

const STORAGE_KEY = 'picklabs_rg_state';
const DEFAULT_STATE: RGState = {
    breakEndsAt: 0,
    lossLimit: -1,
    sessionLosses: 0,
    betHistory: [],
};

function load(): RGState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
    } catch {
        return DEFAULT_STATE;
    }
}

function save(state: RGState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Chasing-Loss Detection (port of Python detect_chasing) ──────────────────
/**
 * Python original:
 *   if bet_history[i-1]['result'] == 'loss':
 *     if bet_history[i]['amount'] > bet_history[i-1]['amount'] * 1.5:
 *       return True
 */
export function detectChasingLosses(history: BetRecord[]): boolean {
    const settled = history.filter(b => b.result !== 'pending');
    if (settled.length < 2) return false;

    let consecutiveEscalations = 0;
    for (let i = 1; i < settled.length; i++) {
        const prev = settled[i - 1];
        const curr = settled[i];
        if (prev.result === 'loss' && curr.amount > prev.amount * 1.5) {
            consecutiveEscalations++;
            if (consecutiveEscalations >= 1) return true; // 1 confirmed chase is enough to warn
        } else {
            consecutiveEscalations = 0;
        }
    }
    return false;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useResponsibleGambling() {
    const [state, setState] = useState<RGState>(load);

    // Persist on every change
    useEffect(() => {
        save(state);
    }, [state]);

    const isOnBreak = state.breakEndsAt > Date.now();
    const breakRemainingMs = Math.max(0, state.breakEndsAt - Date.now());

    const isLossLimitReached =
        state.lossLimit > 0 && state.sessionLosses >= state.lossLimit;

    const isChasingLosses = detectChasingLosses(state.betHistory);

    // ── Actions ──

    const takeBreak = useCallback((hours = 24) => {
        setState(prev => ({ ...prev, breakEndsAt: Date.now() + hours * 60 * 60 * 1000 }));
    }, []);

    const endBreakEarly = useCallback(() => {
        setState(prev => ({ ...prev, breakEndsAt: 0 }));
    }, []);

    const setLossLimit = useCallback((dollars: number) => {
        setState(prev => ({ ...prev, lossLimit: dollars }));
    }, []);

    const removeLossLimit = useCallback(() => {
        setState(prev => ({ ...prev, lossLimit: -1, sessionLosses: 0 }));
    }, []);

    const recordBet = useCallback((bet: BetRecord) => {
        setState(prev => {
            const newSessionLosses =
                bet.result === 'loss'
                    ? prev.sessionLosses + bet.amount
                    : prev.sessionLosses;
            return {
                ...prev,
                sessionLosses: newSessionLosses,
                betHistory: [...prev.betHistory, bet].slice(-50), // keep last 50
            };
        });
    }, []);

    const resetSession = useCallback(() => {
        setState(prev => ({ ...prev, sessionLosses: 0, betHistory: [] }));
    }, []);

    return {
        state,
        isOnBreak,
        breakRemainingMs,
        isLossLimitReached,
        isChasingLosses,
        takeBreak,
        endBreakEarly,
        setLossLimit,
        removeLossLimit,
        recordBet,
        resetSession,
    };
}
