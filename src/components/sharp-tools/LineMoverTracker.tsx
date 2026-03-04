import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OddsSnapshot {
    gameId: string;
    label: string;
    odds: number;
    timestamp: number;
}

interface LineAlert {
    id: string;
    gameId: string;
    label: string;
    oldOdds: number;
    newOdds: number;
    movement: number;
    type: 'STEAM' | 'DROP';
    timestamp: number;
}

// ─── LineTracker logic (direct port of Python class) ─────────────────────────

class LineTracker {
    private history: Record<string, number> = {};

    checkForMovement(
        gameId: string,
        currentOdds: number,
        threshold = 10
    ): { alert: boolean; movement: number; type: 'STEAM' | 'DROP' | null } | null {
        if (!(gameId in this.history)) {
            this.history[gameId] = currentOdds;
            return null;
        }

        const oldOdds = this.history[gameId];
        const movement = currentOdds - oldOdds;

        if (Math.abs(movement) >= threshold) {
            // movement < 0 means odds got shorter (heavier action on that side) → STEAM
            // movement > 0 means odds drifted out → DROP
            const type: 'STEAM' | 'DROP' = movement < 0 ? 'STEAM' : 'DROP';
            this.history[gameId] = currentOdds; // update history
            return { alert: true, movement, type };
        }
        return { alert: false, movement, type: null };
    }

    getHistory() {
        return { ...this.history };
    }

    seed(gameId: string, odds: number) {
        this.history[gameId] = odds;
    }
}

// ─── Mock live odds feed (simulates real sportsbook scraper output) ───────────

const LIVE_GAMES: Array<{ id: string; label: string; baseLine: number }> = [
    { id: 'BOS_vs_LAL', label: 'BOS Celtics vs LAL Lakers', baseLine: -115 },
    { id: 'GSW_vs_PHX', label: 'GSW Warriors vs PHX Suns', baseLine: +105 },
    { id: 'MIA_vs_NYK', label: 'MIA Heat vs NYK Knicks', baseLine: -130 },
    { id: 'DEN_vs_MIL', label: 'DEN Nuggets vs MIL Bucks', baseLine: -108 },
    { id: 'OKC_vs_SAC', label: 'OKC Thunder vs SAC Kings', baseLine: -145 },
];

// Simulate a scraper returning the current odds with drift
function simulateLiveOdds(base: number, tick: number): number {
    // Add some deterministic drift every tick using a simple pattern
    const drift = Math.round(
        Math.sin(tick * 0.7 + base * 0.01) * 8 +
        Math.cos(tick * 1.3 + base * 0.02) * 6
    );
    return base + drift;
}

function formatOdds(n: number): string {
    return n >= 0 ? `+${n}` : `${n}`;
}

function formatTime(ts: number): string {
    return new Date(ts).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

// ─── Component ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 6000; // 6s in UI (feels snappy), would be 15-30s in prod
const MAX_ALERTS = 30;

export const LineMoverTracker: React.FC = () => {
    const trackerRef = useRef(new LineTracker());
    const tickRef = useRef(0);

    const [snapshots, setSnapshots] = useState<OddsSnapshot[]>([]);
    const [alerts, setAlerts] = useState<LineAlert[]>([]);
    const [isLive, setIsLive] = useState(true);
    const [threshold, setThreshold] = useState(10);
    const [lastPoll, setLastPoll] = useState<string>('—');
    const [totalMoves, setTotalMoves] = useState(0);

    // Seed tracker with base lines on mount
    useEffect(() => {
        const tracker = trackerRef.current;
        LIVE_GAMES.forEach(g => tracker.seed(g.id, g.baseLine));
        // Set initial snapshots
        setSnapshots(
            LIVE_GAMES.map(g => ({
                gameId: g.id,
                label: g.label,
                odds: g.baseLine,
                timestamp: Date.now(),
            }))
        );
    }, []);

    const poll = useCallback(() => {
        tickRef.current += 1;
        const tick = tickRef.current;
        const now = Date.now();
        const tracker = trackerRef.current;

        const newSnaps: OddsSnapshot[] = [];
        const newAlerts: LineAlert[] = [];

        LIVE_GAMES.forEach(game => {
            const currentOdds = simulateLiveOdds(game.baseLine, tick);
            newSnaps.push({ gameId: game.id, label: game.label, odds: currentOdds, timestamp: now });

            const result = tracker.checkForMovement(game.id, currentOdds, threshold);
            if (result?.alert && result.type) {
                newAlerts.push({
                    id: `${game.id}_${now}`,
                    gameId: game.id,
                    label: game.label,
                    oldOdds: currentOdds - result.movement,
                    newOdds: currentOdds,
                    movement: result.movement,
                    type: result.type,
                    timestamp: now,
                });
            }
        });

        setSnapshots(newSnaps);
        if (newAlerts.length > 0) {
            setAlerts(prev => [...newAlerts, ...prev].slice(0, MAX_ALERTS));
            setTotalMoves(prev => prev + newAlerts.length);
        }
        setLastPoll(formatTime(now));
    }, [threshold]);

    useEffect(() => {
        if (!isLive) return;
        const id = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [isLive, poll]);

    const clearAlerts = () => setAlerts([]);

    return (
        <div className="col-span-12 terminal-panel overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/5">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-400 text-lg">trending_up</span>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white">
                            Line Movement Tracker
                        </p>
                        <p className="text-[10px] text-text-muted">
                            Auto-detects STEAM & DROP alerts · polling every 6s
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Threshold control */}
                    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
                        <span className="text-[9px] text-text-muted font-black uppercase tracking-wide">Alert at</span>
                        <input
                            type="number"
                            min={5}
                            max={50}
                            step={5}
                            value={threshold}
                            onChange={e => setThreshold(Number(e.target.value))}
                            className="w-10 bg-transparent text-sm font-black text-primary text-center outline-none"
                        />
                        <span className="text-[9px] text-text-muted font-black">pts</span>
                    </div>

                    {/* Last poll */}
                    <div className="text-[9px] text-text-muted font-mono">
                        <span className="text-white/40">LAST POLL</span><br />
                        <span className="text-white font-bold">{lastPoll}</span>
                    </div>

                    {/* Live toggle */}
                    <button
                        onClick={() => setIsLive(v => !v)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${isLive
                            ? 'bg-primary/10 border-primary/40 text-primary'
                            : 'bg-white/5 border-border text-text-muted'
                            }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-primary animate-pulse' : 'bg-white/30'}`} />
                        {isLive ? 'LIVE' : 'PAUSED'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 divide-x divide-border min-h-[280px]">
                {/* Left: Live odds table */}
                <div className="col-span-7 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Current Lines
                    </p>
                    <div className="space-y-1.5">
                        {snapshots.map(snap => {
                            const base = LIVE_GAMES.find(g => g.id === snap.gameId)?.baseLine ?? 0;
                            const diff = snap.odds - base;
                            const recentAlert = alerts.find(a => a.gameId === snap.gameId);
                            return (
                                <div
                                    key={snap.gameId}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${recentAlert?.type === 'STEAM'
                                        ? 'border-red-500/30 bg-red-500/5'
                                        : recentAlert?.type === 'DROP'
                                            ? 'border-emerald-500/30 bg-emerald-500/5'
                                            : 'border-border bg-white/3'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {recentAlert ? (
                                            <span className={`text-sm ${recentAlert.type === 'STEAM' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {recentAlert.type === 'STEAM' ? '🔺' : '🔻'}
                                            </span>
                                        ) : (
                                            <span className="w-4 h-4 rounded-full bg-white/5 border border-border text-[8px] flex items-center justify-center text-text-muted font-bold">—</span>
                                        )}
                                        <span className="text-[11px] font-bold text-white truncate">{snap.label}</span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-none">
                                        {/* Movement since open */}
                                        <span className={`text-[10px] font-black ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-text-muted'}`}>
                                            {diff === 0 ? '—' : diff > 0 ? `+${diff}` : `${diff}`}
                                        </span>
                                        {/* Current odds badge */}
                                        <span className={`text-sm font-black min-w-[3.5rem] text-right ${snap.odds > 0 ? 'text-emerald-400' : 'text-red-300'
                                            }`}>
                                            {formatOdds(snap.odds)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Stat bar */}
                    <div className="mt-3 flex items-center gap-4 pt-3 border-t border-border">
                        <div className="text-center">
                            <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Tracking</p>
                            <p className="text-sm font-black text-white">{LIVE_GAMES.length} Games</p>
                        </div>
                        <div className="text-center border-x border-border px-4">
                            <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Total Moves</p>
                            <p className="text-sm font-black text-amber-400">{totalMoves}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Alert Threshold</p>
                            <p className="text-sm font-black text-white">±{threshold} pts</p>
                        </div>
                    </div>
                </div>

                {/* Right: Alert feed */}
                <div className="col-span-5 flex flex-col">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-400 text-sm">notifications_active</span>
                            Alert Feed
                            {alerts.length > 0 && (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400/20 text-amber-400 text-[9px] font-black">
                                    {alerts.length}
                                </span>
                            )}
                        </p>
                        {alerts.length > 0 && (
                            <button
                                onClick={clearAlerts}
                                className="text-[9px] text-text-muted hover:text-white font-black uppercase tracking-wide transition-colors"
                            >
                                CLEAR
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 max-h-[260px]">
                        {alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                                <span className="material-symbols-outlined text-white/10 text-3xl">radar</span>
                                <p className="text-[10px] text-text-muted">Monitoring lines… alerts appear here</p>
                            </div>
                        ) : (
                            alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`rounded-lg border px-3 py-2 ${alert.type === 'STEAM'
                                        ? 'border-red-500/30 bg-red-500/8'
                                        : 'border-emerald-500/30 bg-emerald-500/8'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">{alert.type === 'STEAM' ? '🔺' : '🔻'}</span>
                                            <span className={`text-[10px] font-black ${alert.type === 'STEAM' ? 'text-red-400' : 'text-emerald-400'
                                                }`}>
                                                {alert.type}
                                            </span>
                                        </div>
                                        <span className="text-[9px] text-text-muted font-mono flex-none">
                                            {formatTime(alert.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-white font-bold mt-0.5 truncate">{alert.label}</p>
                                    <p className="text-[9px] text-text-muted mt-0.5">
                                        {formatOdds(alert.oldOdds)} →{' '}
                                        <span className={`font-black ${alert.type === 'STEAM' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {formatOdds(alert.newOdds)}
                                        </span>
                                        {' '}
                                        <span className={`${alert.movement < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                            ({alert.movement > 0 ? '+' : ''}{alert.movement} pts)
                                        </span>
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer legend */}
            <div className="border-t border-border px-5 py-2 flex items-center gap-6 bg-white/2">
                <div className="flex items-center gap-1.5">
                    <span className="text-sm">🔺</span>
                    <span className="text-[9px] text-text-muted font-bold">STEAM — Line getting shorter (sharp money taking action)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-sm">🔻</span>
                    <span className="text-[9px] text-text-muted font-bold">DROP — Line drifting out (public betting fading)</span>
                </div>
            </div>
        </div>
    );
};
