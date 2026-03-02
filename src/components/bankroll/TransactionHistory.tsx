import React, { useState } from 'react';
import { ResolvedTicket } from '../../App';

export interface TransactionHistoryProps {
    ticketHistory: ResolvedTicket[];
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ ticketHistory }) => {
    const [showAll, setShowAll] = useState(false);

    // Sort tickets (newest first)
    const sortedTickets = [...ticketHistory].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
    const displayTickets = showAll ? sortedTickets : sortedTickets.slice(0, 5);

    const getAmericanOdds = (stake: number, payout: number) => {
        if (payout <= stake) return '-110'; // Fallback if payout is broken
        const profit = payout - stake;
        if (profit >= stake) {
            return '+' + Math.round((profit / stake) * 100);
        } else {
            return '-' + Math.round((stake / profit) * 100);
        }
    };

    return (
        <div className="terminal-panel overflow-hidden">
            <div className="p-4 border-b border-border-muted bg-white dark:bg-neutral-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-text-muted">history</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">Transaction & Bet History</h3>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-[9px] text-slate-500 hover:text-white uppercase font-black tracking-widest transition-colors">Download CSV</button>
                    <div className="h-4 w-[1px] bg-border-muted"></div>
                    <button className="text-[9px] text-primary hover:text-primary/80 uppercase font-black tracking-widest transition-colors flex items-center gap-1">
                        Filter: All Settled <span className="material-symbols-outlined text-[10px]">expand_more</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-white dark:bg-neutral-900/40 border-b border-border-muted">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Date</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Matchup / Details</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Bet Type</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Odds</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Stake</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Result</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-muted">
                        {displayTickets.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-text-muted text-sm italic">
                                    No settled tickets yet. Place bets on the live board and wait for them to resolve.
                                </td>
                            </tr>
                        ) : (
                            displayTickets.map((ticket) => {
                                const d = new Date(ticket.dateStr);
                                const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

                                const isParlay = ticket.picks.length > 1;
                                const title = isParlay ? `${ticket.picks.length}-Leg Parlay` : ticket.picks[0]?.matchupStr || 'Unknown Matchup';
                                const sub = isParlay ? 'Multiple Selections' : ticket.picks[0]?.team || 'Unknown Pick';
                                const type = isParlay ? 'Parlay' : ticket.picks[0]?.type || 'Prop';
                                const odds = isParlay ? getAmericanOdds(ticket.stake, ticket.payout) : ticket.picks[0]?.odds || '-110';
                                const profit = ticket.payout - ticket.stake;

                                return (
                                    <tr key={ticket.id} className="hover:bg-neutral-800/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4 text-xs text-text-muted font-medium whitespace-nowrap">{dateStr}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">{title}</p>
                                            <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">{sub}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-text-muted font-medium whitespace-nowrap">{type}</td>
                                        <td className="px-6 py-4 text-xs text-text-main font-bold whitespace-nowrap">{odds}</td>
                                        <td className="px-6 py-4 text-xs text-text-main font-bold whitespace-nowrap">${ticket.stake.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {ticket.status === 'WON' ? (
                                                <span className="px-2 py-1 rounded bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20 shadow-[0_0_5px_rgba(13,242,13,0.1)]">
                                                    Win (+${profit.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] font-black uppercase border border-red-500/20">
                                                    Loss (-${ticket.stake.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {ticketHistory.length > 5 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-4 bg-white dark:bg-neutral-900/40 text-[10px] font-black text-slate-500 hover:text-white hover:bg-neutral-800/80 uppercase tracking-[0.3em] transition-all border-t border-border-muted"
                >
                    {showAll ? 'Show Recent Transactions' : 'Load Full 365-Day Transaction Ledger'}
                </button>
            )}
        </div>
    );
};
