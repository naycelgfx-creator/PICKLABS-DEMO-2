import React, { useState, useEffect } from 'react';
import { useResponsibleGambling } from '../../hooks/useResponsibleGambling';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

function formatCountdown(ms: number): string {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const BREAK_OPTIONS = [
    { label: '24 Hours', hours: 24 },
    { label: '48 Hours', hours: 48 },
    { label: '1 Week', hours: 168 },
    { label: '1 Month', hours: 720 },
];

const LOSS_LIMIT_PRESETS = [50, 100, 200, 500];

type Tab = 'break' | 'limits' | 'safety';

export const ResponsibleGamblingModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const rg = useResponsibleGambling();
    const [activeTab, setActiveTab] = useState<Tab>('break');
    const [countdown, setCountdown] = useState(rg.breakRemainingMs);
    const [endBreakConfirm, setEndBreakConfirm] = useState(0); // # of clicks
    const [limitInput, setLimitInput] = useState(rg.state.lossLimit > 0 ? String(rg.state.lossLimit) : '');

    // Live countdown tick
    useEffect(() => {
        if (!rg.isOnBreak) return;
        const id = setInterval(() => setCountdown(Math.max(0, rg.state.breakEndsAt - Date.now())), 1000);
        return () => clearInterval(id);
    }, [rg.isOnBreak, rg.state.breakEndsAt]);

    if (!isOpen) return null;

    const tabs: Array<{ id: Tab; label: string; icon: string }> = [
        { id: 'break', label: 'Take a Break', icon: 'self_improvement' },
        { id: 'limits', label: 'Loss Limits', icon: 'account_balance_wallet' },
        { id: 'safety', label: 'AI Safety', icon: 'psychology' },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-lg bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-white/5">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-400 text-xl">shield</span>
                        <div>
                            <p className="text-[12px] font-black uppercase tracking-widest text-white">Responsible Play</p>
                            <p className="text-[10px] text-text-muted">Your wellbeing comes first</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                                : 'text-text-muted hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 space-y-4">

                    {/* ── TAKE A BREAK ── */}
                    {activeTab === 'break' && (
                        <div className="space-y-4">
                            {rg.isOnBreak ? (
                                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center space-y-3">
                                    <span className="material-symbols-outlined text-amber-400 text-4xl">timer</span>
                                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-400">Break Active</p>
                                    <p className="text-4xl font-black text-white tabular-nums tracking-tight font-mono">
                                        {formatCountdown(countdown)}
                                    </p>
                                    <p className="text-[10px] text-text-muted">Hang tight — you're taking a well-deserved break.</p>
                                    <div className="pt-2">
                                        {endBreakConfirm < 3 ? (
                                            <button
                                                onClick={() => setEndBreakConfirm(n => n + 1)}
                                                className="text-[9px] text-text-muted hover:text-white font-black uppercase tracking-wide transition-colors underline underline-offset-2"
                                            >
                                                {endBreakConfirm === 0 ? 'End break early' : endBreakConfirm === 1 ? 'Are you sure?' : 'Click once more to confirm'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { rg.endBreakEarly(); setEndBreakConfirm(0); }}
                                                className="px-4 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wide"
                                            >
                                                Confirm — End Break
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[11px] text-text-muted">
                                        Taking a break pauses all picks, alerts, and recommendations for the selected period. You can always come back.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {BREAK_OPTIONS.map(opt => (
                                            <button
                                                key={opt.label}
                                                onClick={() => rg.takeBreak(opt.hours)}
                                                className="p-4 rounded-xl border border-border bg-white/3 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-left transition-all group"
                                            >
                                                <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">{opt.label}</p>
                                                <p className="text-[9px] text-text-muted mt-0.5">{opt.hours}h cooldown</p>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}

                            <div className="border-t border-border pt-4">
                                <p className="text-[9px] text-text-muted">
                                    Need more help?{' '}
                                    <a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2">
                                        National Council on Problem Gambling
                                    </a>
                                    {' · '}
                                    <a href="https://www.gamstop.co.uk/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2">
                                        GamStop
                                    </a>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── LOSS LIMITS ── */}
                    {activeTab === 'limits' && (
                        <div className="space-y-4">
                            <p className="text-[11px] text-text-muted">
                                Set a daily loss limit. Once reached, picks are hidden and you'll see a reminder to stop.
                            </p>

                            {rg.isLossLimitReached && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-4 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-red-400 text-xl">warning</span>
                                    <div>
                                        <p className="text-[11px] font-black text-red-400">Loss Limit Reached</p>
                                        <p className="text-[10px] text-text-muted">You've lost ${rg.state.sessionLosses.toFixed(0)} today. Picks are hidden.</p>
                                    </div>
                                </div>
                            )}

                            {/* Current session losses */}
                            {rg.state.lossLimit > 0 && (
                                <div className="rounded-lg border border-border bg-white/3 p-3 space-y-2">
                                    <div className="flex justify-between text-[10px] font-black">
                                        <span className="text-text-muted">Session Losses</span>
                                        <span className={rg.isLossLimitReached ? 'text-red-400' : 'text-white'}>
                                            ${rg.state.sessionLosses.toFixed(0)} / ${rg.state.lossLimit}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${rg.isLossLimitReached ? 'bg-red-500' : 'bg-amber-400'}`}
                                            style={{ width: `${Math.min(100, (rg.state.sessionLosses / rg.state.lossLimit) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Presets */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Quick Set</p>
                                <div className="flex gap-2">
                                    {LOSS_LIMIT_PRESETS.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => { rg.setLossLimit(v); setLimitInput(String(v)); }}
                                            className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition-all ${rg.state.lossLimit === v
                                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                : 'bg-white/3 border-border text-text-muted hover:text-white'
                                                }`}
                                        >
                                            ${v}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom input */}
                            <div className="flex gap-2 items-center">
                                <div className="flex items-center gap-1 flex-1 rounded-lg border border-border bg-background px-3 py-2 focus-within:border-emerald-400/40 transition-colors">
                                    <span className="text-text-muted text-sm font-black">$</span>
                                    <input
                                        type="number"
                                        min={10}
                                        value={limitInput}
                                        onChange={e => setLimitInput(e.target.value)}
                                        placeholder="Custom amount"
                                        className="flex-1 bg-transparent text-sm text-white outline-none font-bold"
                                    />
                                </div>
                                <button
                                    onClick={() => { const v = parseFloat(limitInput); if (v > 0) rg.setLossLimit(v); }}
                                    className="px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-wide"
                                >
                                    Set
                                </button>
                                {rg.state.lossLimit > 0 && (
                                    <button
                                        onClick={() => { rg.removeLossLimit(); setLimitInput(''); }}
                                        className="px-3 py-2 rounded-lg bg-white/5 border border-border text-text-muted text-[10px] font-black uppercase"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── AI SAFETY ── */}
                    {activeTab === 'safety' && (
                        <div className="space-y-4">
                            <div className={`rounded-xl border p-4 ${rg.isChasingLosses
                                ? 'border-red-500/40 bg-red-500/8'
                                : 'border-border bg-white/3'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <span className={`material-symbols-outlined text-2xl flex-none ${rg.isChasingLosses ? 'text-red-400' : 'text-text-muted'}`}>
                                        {rg.isChasingLosses ? 'crisis_alert' : 'shield_check'}
                                    </span>
                                    <div>
                                        <p className={`text-[11px] font-black uppercase tracking-widest ${rg.isChasingLosses ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {rg.isChasingLosses ? '⚠️ Chasing Pattern Detected' : '✓ No Chasing Detected'}
                                        </p>
                                        <p className="text-[10px] text-text-muted mt-1">
                                            {rg.isChasingLosses
                                                ? 'Our AI detected you placed a significantly larger bet immediately after a loss. This is a known risk pattern. Consider taking a break.'
                                                : 'Your recent betting patterns look healthy. We monitor for escalating bets after losses automatically.'}
                                        </p>
                                    </div>
                                </div>
                                {rg.isChasingLosses && (
                                    <button
                                        onClick={() => { rg.takeBreak(24); setActiveTab('break'); }}
                                        className="mt-3 w-full py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Take a 24h Break Now
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Betting Statistics</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-lg border border-border bg-white/3 p-3 text-center">
                                        <p className="text-[9px] text-text-muted font-black uppercase">Total Bets</p>
                                        <p className="text-lg font-black text-white">{rg.state.betHistory.length}</p>
                                    </div>
                                    <div className="rounded-lg border border-border bg-white/3 p-3 text-center">
                                        <p className="text-[9px] text-text-muted font-black uppercase">Session Losses</p>
                                        <p className="text-lg font-black text-red-400">${rg.state.sessionLosses.toFixed(0)}</p>
                                    </div>
                                    <div className="rounded-lg border border-border bg-white/3 p-3 text-center">
                                        <p className="text-[9px] text-text-muted font-black uppercase">Win Rate</p>
                                        <p className="text-lg font-black text-emerald-400">
                                            {rg.state.betHistory.length > 0
                                                ? `${Math.round((rg.state.betHistory.filter(b => b.result === 'win').length / rg.state.betHistory.filter(b => b.result !== 'pending').length) * 100 || 0)}%`
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => rg.resetSession()}
                                className="w-full py-2 rounded-lg bg-white/5 border border-border text-text-muted text-[10px] font-black uppercase tracking-wide hover:text-white transition-colors"
                            >
                                Reset Session Data
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
