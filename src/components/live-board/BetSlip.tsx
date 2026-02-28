import React, { useState } from 'react';
import { BetPick } from '../../App';
import { useSportsbooks, SPORTSBOOKS } from '../../contexts/SportsbookContext';
import { useRookieMode } from '../../contexts/RookieModeContext';
import { WhatIfCalculator } from '../ui/WhatIfCalculator';

interface BetSlipProps {
    betSlip: BetPick[];
    setBetSlip: React.Dispatch<React.SetStateAction<BetPick[]>>;
}

type SlipMode = 'singles' | 'parlay';

/* ── Odds math ── */
const americanToDecimal = (oddsStr: string): number => {
    const odds = parseInt(oddsStr.replace('+', ''));
    if (isNaN(odds)) return 1.909; // -110 default
    return odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
};

const decimalToAmerican = (decimal: number): string => {
    if (decimal <= 1) return 'N/A';
    if (decimal >= 2) return `+${Math.round((decimal - 1) * 100)}`;
    return `${Math.round(-100 / (decimal - 1))}`;
};

const calculateParlayOdds = (picks: BetPick[]): string => {
    if (picks.length < 2) return picks.length === 1 ? picks[0].odds : 'N/A';
    const combined = picks.reduce((acc, pick) => acc * americanToDecimal(pick.odds), 1);
    return decimalToAmerican(combined);
};

const toWin = (stake: number, oddsStr: string): number => {
    if (!oddsStr || stake <= 0) return 0;
    const odds = parseInt(oddsStr.replace('+', ''));
    if (isNaN(odds)) return 0;
    return odds > 0 ? stake * (odds / 100) : stake / (Math.abs(odds) / 100);
};

export const BetSlip: React.FC<BetSlipProps> = ({ betSlip, setBetSlip }) => {
    const { isBookEnabled } = useSportsbooks();
    const { isRookieModeActive } = useRookieMode();
    const [mode, setMode] = useState<SlipMode>('singles');
    const [parlayStake, setParlayStake] = useState<number>(50);

    const handleRemove = (id: string) => setBetSlip(prev => prev.filter(b => b.id !== id));

    const handleStakeChange = (id: string, val: string) => {
        const n = parseFloat(val.replace(/[^0-9.]/g, ''));
        setBetSlip(prev => prev.map(b => b.id === id ? { ...b, stake: isNaN(n) ? 0 : n } : b));
    };

    const handleApplyToAll = (val: string) => {
        const n = parseFloat(val.replace(/[^0-9.]/g, ''));
        if (isNaN(n) || betSlip.length === 0) return;
        setBetSlip(prev => prev.map(b => ({ ...b, stake: Number((n / betSlip.length).toFixed(2)) })));
    };

    // Singles totals
    const totalStake = betSlip.reduce((s, b) => s + b.stake, 0);
    const totalPayout = betSlip.reduce((s, b) => s + b.stake + toWin(b.stake, b.odds), 0);

    // Parlay
    const parlayOdds = calculateParlayOdds(betSlip);
    const parlayPayout = parlayStake + toWin(parlayStake, parlayOdds);
    const parlayOddsNum = parseInt(parlayOdds.replace('+', ''));
    const enabledBooks = SPORTSBOOKS.filter(b => isBookEnabled(b.id));

    const legTypeColor = (type: BetPick['type']) => {
        if (type === 'ML') return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        if (type === 'Spread') return 'text-primary border-primary/30 bg-primary/10';
        if (type === 'Over') return 'text-green-400 border-green-500/30 bg-green-500/10';
        if (type === 'Under') return 'text-red-400 border-red-500/30 bg-red-500/10';
        return 'text-slate-400 border-border-muted bg-white/5';
    };

    return (
        <aside id="bet-slip-sidebar" className="col-span-12 xl:col-span-3">
            <div className="xl:sticky xl:top-[140px] terminal-panel bg-neutral-900/50 overflow-hidden">

                {/* ── Header ── */}
                <div className="p-4 border-b border-border-muted bg-neutral-900 flex items-center justify-between">
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">receipt_long</span>
                        Bet Slip
                    </h3>
                    <div className="flex items-center gap-3">
                        {betSlip.length > 0 && (
                            <button
                                onClick={() => setBetSlip([])}
                                className="text-[9px] font-bold uppercase tracking-widest text-text-muted hover:text-red-500 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                        <span className="text-[10px] font-bold text-accent-purple">{betSlip.length} Picks</span>
                    </div>
                </div>

                {/* ── Singles / Parlay Tab Toggle ── */}
                {betSlip.length > 0 && (
                    <div className="flex border-b border-border-muted">
                        <button
                            onClick={() => setMode('singles')}
                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'singles'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            Singles ({betSlip.length})
                        </button>
                        <button
                            onClick={() => setMode('parlay')}
                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all relative ${mode === 'parlay'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            Parlay
                            {betSlip.length >= 2 && (
                                <span className="ml-1.5 text-[8px] px-1.5 py-0.5 rounded font-black bg-primary/20 text-primary border border-primary/30">
                                    {betSlip.length}-Leg
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* ── Content ── */}
                <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar">
                    {betSlip.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                            <span className="material-symbols-outlined text-3xl text-slate-600">receipt_long</span>
                            <p className="text-text-muted text-xs italic">Your bet slip is empty.</p>
                            <p className="text-[9px] text-slate-600">Click odds buttons to add picks</p>
                        </div>
                    ) : mode === 'singles' ? (
                        <>
                            {/* Apply to all */}
                            {betSlip.length > 1 && (
                                <div className="flex justify-between items-center bg-white dark:bg-neutral-900/40 border border-border-muted p-2.5 rounded-sm">
                                    <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Apply All</span>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1.5 text-[10px] text-text-muted">$</span>
                                        <input
                                            className="bg-neutral-800 border border-border-muted text-[10px] font-bold text-text-main rounded-sm w-20 py-1 pl-5 pr-2 focus:ring-1 focus:ring-primary outline-none"
                                            type="text"
                                            placeholder="Total"
                                            onChange={(e) => handleApplyToAll(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Individual picks */}
                            {betSlip.map((bet) => (
                                <div key={bet.id} className="bg-white dark:bg-neutral-900/40 border border-border-muted p-3 rounded-sm space-y-2 relative group">
                                    {/* Remove */}
                                    <button
                                        onClick={() => handleRemove(bet.id)}
                                        className="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>

                                    {/* Pick header */}
                                    <div className="flex items-center gap-2 pr-5">
                                        <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${legTypeColor(bet.type)}`}>
                                            {bet.type}
                                        </span>
                                        <span className="text-[10px] font-black text-text-main truncate flex-1">{bet.team}</span>
                                        <span className={`text-[11px] font-black font-mono shrink-0 ${parseInt(bet.odds.replace('+', '')) > 0 ? 'text-green-400' : 'text-text-main'}`}>
                                            {bet.odds}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 truncate">{bet.matchupStr}</p>

                                    {/* Stake row */}
                                    <div className="flex justify-between items-center">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1.5 text-[10px] text-text-muted">$</span>
                                            <input
                                                className="bg-neutral-800 border border-border-muted text-[10px] font-bold text-text-main rounded-sm w-20 py-1 pl-5 pr-2 focus:ring-1 focus:ring-primary outline-none"
                                                type="text"
                                                placeholder="Stake"
                                                value={bet.stake || ''}
                                                onChange={(e) => handleStakeChange(bet.id, e.target.value)}
                                            />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] text-text-muted">To Win</p>
                                            <p className="text-[11px] font-black text-primary">+${toWin(bet.stake, bet.odds).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {isRookieModeActive && <WhatIfCalculator odds={bet.odds} />}
                                </div>
                            ))}
                        </>
                    ) : (
                        /* ══ PARLAY MODE ══ */
                        <div className="space-y-3">
                            {betSlip.length < 2 && (
                                <div className="text-center py-4 px-3 border border-dashed border-primary/30 rounded-lg">
                                    <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
                                    <p className="text-[9px] text-text-muted mt-1">Add at least 2 picks to build a parlay</p>
                                </div>
                            )}

                            {/* Parlay legs list */}
                            {betSlip.map((bet, idx) => (
                                <div key={bet.id} className="flex items-center gap-2 bg-white dark:bg-neutral-900/40 border border-border-muted p-2.5 rounded-lg group">
                                    {/* Leg number */}
                                    <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                                        <span className="text-[8px] font-black text-primary">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded border ${legTypeColor(bet.type)}`}>{bet.type}</span>
                                            <span className="text-[10px] font-bold text-text-main truncate">{bet.team}</span>
                                        </div>
                                        <p className="text-[8px] text-slate-500 truncate mt-0.5">{bet.matchupStr}</p>
                                    </div>
                                    <span className={`text-[11px] font-black font-mono shrink-0 ${parseInt(bet.odds.replace('+', '')) > 0 ? 'text-green-400' : 'text-slate-300'}`}>
                                        {bet.odds}
                                    </span>
                                    <button onClick={() => handleRemove(bet.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-500 shrink-0">
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </div>
                            ))}

                            {/* Parlay odds summary */}
                            {betSlip.length >= 2 && (
                                <div className="mt-2 p-3 rounded-xl border border-primary/40 bg-primary/5 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Combined Odds</span>
                                        <span className={`text-[18px] font-black font-mono leading-none ${parlayOddsNum > 0 ? 'text-green-400' : 'text-primary'}`}>
                                            {parlayOdds}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] text-text-muted">
                                        <span>{betSlip.length}-Leg Parlay</span>
                                        <span className="font-bold text-primary">
                                            {betSlip.length}× multiplier
                                        </span>
                                    </div>

                                    {/* Parlay stake input */}
                                    <div className="pt-1 border-t border-primary/20">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Parlay Stake</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <span className="absolute left-3 top-2 text-[11px] text-text-muted font-bold">$</span>
                                                <input
                                                    className="w-full bg-neutral-800 border border-border-muted text-[12px] font-black text-text-main rounded-lg py-2 pl-7 pr-3 focus:ring-1 focus:ring-primary outline-none"
                                                    type="number"
                                                    min="1"
                                                    value={parlayStake}
                                                    onChange={(e) => setParlayStake(parseFloat(e.target.value) || 0)}
                                                    placeholder="50"
                                                />
                                            </div>
                                            {/* Quick amounts */}
                                            <div className="flex gap-1">
                                                {[25, 50, 100].map(amt => (
                                                    <button
                                                        key={amt}
                                                        onClick={() => setParlayStake(amt)}
                                                        className={`text-[8px] font-black px-1.5 py-1 rounded border transition-all ${parlayStake === amt ? 'bg-primary/20 border-primary/50 text-primary' : 'border-border-muted text-text-muted hover:border-primary/40'}`}
                                                    >
                                                        ${amt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payout */}
                                    <div className="flex justify-between items-end pt-1.5 border-t border-primary/20">
                                        <div>
                                            <p className="text-[8px] text-text-muted uppercase tracking-widest font-bold">Total Payout</p>
                                            <p className="text-[22px] font-black text-primary leading-none mt-0.5">
                                                ${parlayPayout.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] text-text-muted">Profit</p>
                                            <p className="text-[14px] font-black text-green-400">
                                                +${toWin(parlayStake, parlayOdds).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer: Totals + Place Bet ── */}
                <div className="p-4 border-t border-border-muted bg-white dark:bg-neutral-900/80 space-y-3">
                    {mode === 'singles' && betSlip.length > 0 && (
                        <>
                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                                <span>Total Stake</span>
                                <span className="text-text-main">${totalStake.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase text-text-main">
                                <span>Total Payout</span>
                                <span className="text-primary">${totalPayout.toFixed(2)}</span>
                            </div>
                        </>
                    )}
                    {mode === 'parlay' && betSlip.length >= 2 && (
                        <>
                            <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                                <span>Parlay Stake</span>
                                <span className="text-text-main">${parlayStake.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase">
                                <span className="text-slate-500">Parlay Odds</span>
                                <span className={`font-mono ${parlayOddsNum > 0 ? 'text-green-400' : 'text-primary'}`}>{parlayOdds}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase text-text-main">
                                <span>Total Payout</span>
                                <span className="text-primary">${parlayPayout.toFixed(2)}</span>
                            </div>
                        </>
                    )}

                    {/* Sportsbook buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        {enabledBooks.map(book => (
                            <button
                                key={book.id}
                                className="relative overflow-hidden w-full py-2 font-black uppercase tracking-widest text-[8px] sm:text-[9px] rounded-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5 group"
                                style={{ backgroundColor: book.color, color: '#ffffff', boxShadow: `0 0 10px ${book.color}55` }}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${book.domain}&sz=128`}
                                    alt={book.name}
                                    className="h-3 w-3 rounded-sm object-contain relative z-10"
                                />
                                <span className="relative z-10 truncate">{book.shortName.toUpperCase()}</span>
                            </button>
                        ))}
                        {enabledBooks.length === 0 && (
                            <div className="col-span-2 text-center py-3 text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
                                All books hidden — enable one in the
                                <span className="text-primary"> Bookie Manager</span>
                            </div>
                        )}
                    </div>

                    {/* Calm Down warning */}
                    {betSlip.length > 4 && (
                        <div className="p-3 border border-red-500/50 bg-red-500/10 rounded-lg text-center">
                            <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
                            <p className="text-[8px] text-text-muted mt-1">You've added {betSlip.length} picks. Please bet responsibly.</p>
                        </div>
                    )}

                    <div className="text-center border-t border-border-muted pt-3">
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mb-1">Problem Gambling?</p>
                        <a href="tel:1800GAMBLER" className="text-red-500 font-black text-xs tracking-widest hover:text-red-400 transition-colors">Call 1-800-GAMBLER</a>
                    </div>
                    <p className="text-[8px] text-center text-slate-600 font-bold uppercase italic">System Sync v4.2 Secured</p>
                </div>
            </div>
        </aside>
    );
};
