import React from 'react';
import { BetPick } from '../../App';
import { useSportsbooks, SPORTSBOOKS } from '../../contexts/SportsbookContext';
import { useRookieMode } from '../../contexts/RookieModeContext';
import { WhatIfCalculator } from '../ui/WhatIfCalculator';

interface BetSlipProps {
    betSlip: BetPick[];
    setBetSlip: React.Dispatch<React.SetStateAction<BetPick[]>>;
}

export const BetSlip: React.FC<BetSlipProps> = ({ betSlip, setBetSlip }) => {
    const { isBookEnabled } = useSportsbooks();
    const { isRookieModeActive } = useRookieMode();

    const handleRemove = (id: string) => {
        setBetSlip(prev => prev.filter(b => b.id !== id));
    };

    const handleStakeChange = (id: string, newStake: string) => {
        if (newStake === '') {
            setBetSlip(prev => prev.map(b => b.id === id ? { ...b, stake: 0 } : b));
            return;
        }
        const val = parseFloat(newStake.replace(/[^0-9.]/g, ''));
        if (isNaN(val)) return;
        setBetSlip(prev => prev.map(b => b.id === id ? { ...b, stake: val } : b));
    };

    const handleApplyToAll = (newStake: string) => {
        if (newStake === '') {
            setBetSlip(prev => prev.map(b => ({ ...b, stake: 0 })));
            return;
        }
        const val = parseFloat(newStake.replace(/[^0-9.]/g, ''));
        if (isNaN(val) || betSlip.length === 0) return;

        // Distribute the total stake evenly across all bets
        const distributedStake = Number((val / betSlip.length).toFixed(2));
        setBetSlip(prev => prev.map(b => ({ ...b, stake: distributedStake })));
    };

    const calculateToWin = (stake: number, oddsStr: string) => {
        if (!oddsStr) return stake;
        const odds = parseInt(oddsStr.replace('+', ''));
        if (isNaN(odds)) return stake;

        if (odds > 0) {
            return stake * (odds / 100);
        } else {
            return stake / (Math.abs(odds) / 100);
        }
    };

    const totalStake = betSlip.reduce((sum, bet) => sum + bet.stake, 0);
    const totalPayout = betSlip.reduce((sum, bet) => sum + bet.stake + calculateToWin(bet.stake, bet.odds), 0);

    return (
        <aside id="bet-slip-sidebar" className="col-span-12 xl:col-span-3">
            <div className="xl:sticky xl:top-[140px] terminal-panel border-accent-purple/30 bg-accent-purple/5">
                <div className="p-4 border-b border-border-muted bg-white dark:bg-neutral-900/80 flex items-center justify-between">
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent-purple text-sm">shopping_cart</span>
                        Bet Slip
                    </h3>
                    <div className="flex items-center gap-3">
                        {betSlip.length > 0 && (
                            <>
                                <button
                                    onClick={() => setBetSlip([])}
                                    className="text-[9px] font-bold uppercase tracking-widest text-text-muted hover:text-red-500 transition-colors"
                                >
                                    Clear All
                                </button>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 ${betSlip.length % 2 === 0 ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                                    <span className="material-symbols-outlined text-[10px]">{betSlip.length % 2 === 0 ? 'trending_up' : 'trending_down'}</span>
                                    {betSlip.length % 2 === 0 ? 'Bullish' : 'Bearish'}
                                </span>
                            </>
                        )}
                        <span className="text-[10px] font-bold text-accent-purple">{betSlip.length} Picks</span>
                    </div>
                </div>

                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {betSlip.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs italic">
                            Your bet slip is empty. Click "AI Pick My Bets" to auto-fill!
                        </div>
                    ) : (
                        <>
                            {betSlip.length > 1 && (
                                <div className="flex justify-between items-center bg-white dark:bg-neutral-900/40 border border-border-muted p-3 rounded mb-2">
                                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Apply to All</span>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1.5 text-[10px] text-text-muted">$</span>
                                        <input
                                            className="bg-neutral-800 border-none text-[10px] font-bold text-text-main rounded w-20 py-1 pl-5 pr-2 focus:ring-1 focus:ring-primary outline-none"
                                            type="text"
                                            placeholder="Stake"
                                            onChange={(e) => handleApplyToAll(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                            {betSlip.map(bet => (
                                <div key={bet.id} className="bg-white dark:bg-neutral-900/40 border border-border-muted p-3 rounded space-y-2 relative group mb-2 last:mb-0">
                                    <button
                                        onClick={() => handleRemove(bet.id)}
                                        className="absolute top-2 right-2 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                    <div className="flex justify-between pr-4">
                                        <span className="text-[10px] font-black text-primary italic truncate">{bet.team}</span>
                                        <span className="text-[10px] font-black text-text-main">{bet.odds}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 truncate">{bet.matchupStr}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-1.5 text-[10px] text-text-muted">$</span>
                                            <input
                                                className="bg-neutral-800 border-none text-[10px] font-bold text-text-main rounded w-20 py-1 pl-5 pr-2 focus:ring-1 focus:ring-primary outline-none"
                                                type="text"
                                                title="Bet stake amount"
                                                placeholder="Stake"
                                                value={bet.stake}
                                                onChange={(e) => handleStakeChange(bet.id, e.target.value)}
                                            />
                                        </div>
                                        <p className="text-[10px] text-text-muted">To Win: <span className="text-primary">${calculateToWin(bet.stake, bet.odds).toFixed(2)}</span></p>
                                    </div>
                                    {/* Rookie Mode: What If Calculator */}
                                    {isRookieModeActive && (
                                        <WhatIfCalculator odds={bet.odds} />
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-border-muted bg-white dark:bg-neutral-900/80 space-y-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                        <span>Total Stake</span>
                        <span className="text-text-main">${totalStake.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-text-main italic">
                        <span>Total Payout</span>
                        <span className="text-primary">${totalPayout.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        {SPORTSBOOKS.filter(b => isBookEnabled(b.id)).map(book => (
                            <button
                                key={book.id}
                                className="relative overflow-hidden w-full py-2 text-white font-black uppercase tracking-widest text-[8px] sm:text-[9px] rounded hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5 group"
                                style={{ backgroundColor: book.color, color: book.textColor, boxShadow: `0 0 10px ${book.color}55` }}
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
                        {SPORTSBOOKS.filter(b => isBookEnabled(b.id)).length === 0 && (
                            <div className="col-span-2 text-center py-3 text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
                                All books hidden — enable one in the
                                <span className="text-primary"> Bookie Manager</span>
                            </div>
                        )}
                    </div>

                    {betSlip.length > 4 && (
                        <div className="mt-4 p-3 border border-red-500/50 bg-red-500/10 rounded overflow-hidden relative group">
                            <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-1">
                                <span className="material-symbols-outlined text-red-500 text-xl">warning</span>
                                <span className="text-white font-black text-[10px] uppercase tracking-widest theme-dark">Calm Down Mode Active</span>
                                <p className="text-[8px] text-text-muted">You've placed {betSlip.length} bets in rapid succession. Please play responsibly.</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 text-center border-t border-border-muted pt-4 pb-2">
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mb-1">Problem Gambling?</p>
                        <a href="tel:1800GAMBLER" className="text-red-500 font-black text-xs tracking-widest hover:text-red-400 transition-colors">Call 1-800-GAMBLER</a>
                    </div>
                    <p className="text-[8px] text-center text-slate-600 font-bold uppercase italic mt-2">System Sync v4.2 Secured</p>
                </div>
            </div>
        </aside>
    );
};
