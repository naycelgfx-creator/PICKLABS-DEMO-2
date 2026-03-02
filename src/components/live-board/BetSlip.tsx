import React, { useState } from 'react';
import { BetPick } from '../../App';
import { useSportsbooks, SPORTSBOOKS } from '../../contexts/SportsbookContext';
import { useRookieMode } from '../../contexts/RookieModeContext';
import { WhatIfCalculator } from '../ui/WhatIfCalculator';

export interface BetSlipProps {
    betSlip: BetPick[];
    setBetSlip: React.Dispatch<React.SetStateAction<BetPick[]>>;
    activeTickets?: BetPick[][];
    setActiveTickets?: React.Dispatch<React.SetStateAction<BetPick[][]>>;
}

type SlipMode = 'singles' | 'parlay';

/* ── Odds math ── */
const americanToDecimal = (oddsStr: string): number => {
    if (!oddsStr || oddsStr === 'N/A') return 1.909; // -110 default
    const odds = parseInt(oddsStr.replace('+', ''));
    if (isNaN(odds)) return 1.909; // -110 default
    return odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
};

const decimalToAmerican = (decimal: number): string => {
    if (!decimal || isNaN(decimal) || decimal <= 1) return 'N/A';
    if (decimal >= 2) return `+${Math.round((decimal - 1) * 100)}`;
    return `${Math.round(-100 / (decimal - 1))}`;
};

const calculateParlayOdds = (picks: BetPick[]): string => {
    if (picks.length < 2) return picks.length === 1 ? picks[0].odds : 'N/A';
    const combined = picks.reduce((acc, pick) => acc * americanToDecimal(pick.odds), 1);
    return decimalToAmerican(combined);
};

const toWin = (stake: number, oddsStr: string): number => {
    if (!oddsStr || oddsStr === 'N/A' || stake <= 0) return 0;
    const odds = parseInt(oddsStr.replace('+', ''));
    if (isNaN(odds)) return 0;
    return odds > 0 ? stake * (odds / 100) : stake / (Math.abs(odds) / 100);
};

export const BetSlip: React.FC<BetSlipProps & { onClose?: () => void }> = ({ betSlip, setBetSlip, activeTickets, setActiveTickets, onClose }) => {
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

                <div className="p-4 border-b border-border-muted bg-neutral-900 pb-3 group relative">
                    <div className="text-[9px] font-black tracking-[0.2em] text-[#A3FF00] flex items-center gap-1.5 mb-2">
                        <span className="w-1.5 h-1.5 bg-[#A3FF00] inline-block rotate-45 transform"></span>
                        SESSION LOG
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-6 h-6 rounded-full bg-neutral-800 text-text-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-700 hover:text-text-main"
                            title="Close Bet Slip"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    )}
                    <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-black text-white tracking-[0.1em] flex items-center gap-2 uppercase">
                            <span className="material-symbols-outlined text-[#9B4FF5] text-lg">receipt_long</span>
                            BET SLIP
                        </h3>
                        {betSlip.length > 0 ? (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setBetSlip([])}
                                    className="text-[9px] font-bold uppercase tracking-widest text-text-muted hover:text-red-500 transition-colors"
                                >
                                    Clear All
                                </button>
                                <span className="text-[10px] font-black text-[#9B4FF5]">{betSlip.length < 10 ? `0${betSlip.length}` : betSlip.length}</span>
                            </div>
                        ) : (
                            <span className="text-[11px] font-black text-[#9B4FF5] tracking-widest">00</span>
                        )}
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
                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center justify-center gap-1 ${mode === 'parlay'
                                ? 'text-primary border-b-2 border-primary bg-primary/5'
                                : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            Parlay
                            {betSlip.length >= 2 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-[8px] px-1.5 py-0.5 rounded font-black bg-primary/20 text-primary border border-primary/30">
                                        {betSlip.length}-Leg
                                    </span>
                                    {new Set(betSlip.filter(b => b.gameId).map(b => b.gameId)).size < betSlip.filter(b => b.gameId).length && (
                                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black bg-primary/20 text-primary border border-primary/30">
                                            SGP
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    </div>
                )}

                <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar">
                    {betSlip.length === 0 ? (
                        <div className="text-center py-24 space-y-4">
                            <span className="material-symbols-outlined text-[40px] text-[#A3FF00]/40 mb-2 inline-block">science</span>
                            <p className="text-[#A3FF00]/60 text-[10px] font-black uppercase tracking-[0.2em]">NO SPECIMENS QUEUED</p>
                            <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">Click odds on any game to add</p>
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

                <div className="p-4 border-t border-border-muted bg-neutral-900 space-y-5">
                    {/* Always show Totals, even when empty (with $0.00) like screenshot */}
                    <div className="space-y-4 border-b border-border-muted pb-5 pt-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                            <span className="flex items-center gap-2">
                                <span className="text-[13px] font-mono leading-none">Σ</span>
                                <span>{mode === 'parlay' && betSlip.length >= 2 ? 'Total Stake (Parlay)' : 'Total stake'}</span>
                            </span>
                            <span className="text-slate-300 font-mono text-[11px] tracking-wider">
                                ${(betSlip.length === 0 ? 0 : mode === 'parlay' && betSlip.length >= 2 ? parlayStake : totalStake).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                            <span className="pl-5">Projected Yield</span>
                            <span className="text-[#A3FF00] font-mono text-[12px] tracking-wider">
                                ${(betSlip.length === 0 ? 0 : mode === 'parlay' && betSlip.length >= 2 ? parlayPayout : totalPayout).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Complete Slip Button */}
                    <div className="pt-2 pb-1">
                        <button
                            onClick={() => {
                                if (setActiveTickets && activeTickets && betSlip.length > 0) {
                                    setActiveTickets([[...betSlip], ...activeTickets]);
                                    setBetSlip([]);
                                }
                            }}
                            disabled={betSlip.length === 0}
                            className={`w-full py-3 rounded-lg font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${betSlip.length > 0
                                ? 'bg-[#A3FF00] text-black hover:bg-[#8ee600] shadow-[0_4px_14px_rgba(163,255,0,0.3)]'
                                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">description</span>
                            Complete Ticket
                        </button>
                    </div>

                    {/* Available Books List */}
                    <div className="pt-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Distribute to station:</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                            {enabledBooks.map(book => (
                                <a key={book.id} href={`https://${book.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-1.5 border border-[#2c2c2c] rounded-sm bg-[#161616] hover:bg-white/5 cursor-pointer relative group transition-colors">
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-sm" style={{ backgroundColor: book.color }}></div>
                                    <div className="w-5 h-5 rounded-sm bg-white flex items-center justify-center p-0.5 shrink-0 ml-1.5">
                                        <img
                                            src={`https://www.google.com/s2/favicons?domain=${book.domain}&sz=128`}
                                            alt={book.name}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate group-hover:text-white transition-colors">
                                        {book.shortName.length > 4 ? book.name : book.shortName}
                                    </span>
                                </a>
                            ))}
                            {enabledBooks.length === 0 && (
                                <div className="col-span-2 text-[9px] text-slate-600 font-bold uppercase py-2 tracking-widest">No books enabled.</div>
                            )}
                        </div>
                    </div>

                    {/* Calm Down warning */}
                    {betSlip.length > 4 && (
                        <div className="p-3 border border-red-500/50 bg-red-500/10 rounded-sm text-center">
                            <span className="material-symbols-outlined text-red-500 text-lg">warning</span>
                            <p className="text-[8px] text-text-muted mt-1">You've added {betSlip.length} picks. Please bet responsibly.</p>
                        </div>
                    )}

                    <div className="text-center pt-2">
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mb-1">Problem Gambling?</p>
                        <a href="tel:1800GAMBLER" className="text-red-500 font-black text-xs tracking-widest hover:text-red-400 transition-colors">1-800-GAMBLER</a>
                    </div>
                </div>
            </div>
        </aside>
    );
};
