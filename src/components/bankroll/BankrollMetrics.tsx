import React from 'react';
import { ResolvedTicket } from '../../App';

export interface BankrollMetricsProps {
    bankroll: number;
    ticketHistory: ResolvedTicket[];
}

export const BankrollMetrics: React.FC<BankrollMetricsProps> = ({ bankroll, ticketHistory }) => {
    const totalProfit = ticketHistory.reduce((acc, t) => {
        if (t.status === 'WON') {
            return acc + (t.payout - t.stake);
        } else {
            return acc - t.stake;
        }
    }, 0);

    const totalStake = ticketHistory.reduce((acc, t) => acc + t.stake, 0);
    const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
    const isProfit = totalProfit >= 0;
    const winCount = ticketHistory.filter(t => t.status === 'WON').length;
    const winPercent = ticketHistory.length > 0 ? (winCount / ticketHistory.length) * 100 : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="terminal-panel p-4 border-l-4 border-l-slate-500">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Total Balance</p>
                <h2 className="text-2xl font-black text-text-main">${bankroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                <p className="text-[10px] text-text-muted mt-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">account_balance</span> Real-time
                </p>
            </div>

            <div className={`terminal-panel p-4 border-l-4 ${isProfit ? 'border-l-primary shadow-[0_0_15px_rgba(13,242,13,0.1)]' : 'border-l-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]'}`}>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Net Profit/Loss</p>
                <h2 className={`text-2xl font-black ${isProfit ? 'text-primary' : 'text-red-500'}`}>
                    {isProfit ? '+' : '-'}${Math.abs(totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className={`text-[10px] ${isProfit ? 'text-primary' : 'text-red-500'} mt-2 font-bold flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-xs">{isProfit ? 'trending_up' : 'trending_down'}</span> Based on History
                </p>
            </div>

            <div className={`terminal-panel p-4 border-l-4 ${roi >= 0 ? 'border-l-accent-purple' : 'border-l-red-400'}`}>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">ROI %</p>
                <h2 className={`text-2xl font-black ${roi >= 0 ? 'text-accent-purple' : 'text-red-400'}`}>{roi >= 0 ? '+' : ''}{roi.toFixed(1)}%</h2>
                <p className="text-[10px] text-text-muted mt-2 font-bold">vs 4.2% Market Avg</p>
            </div>

            <div className="terminal-panel p-4 border-l-4 border-l-slate-700">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Win Rate</p>
                <h2 className="text-2xl font-black text-text-main">{winPercent.toFixed(1)}%</h2>
                <p className="text-[10px] text-text-muted mt-2 font-bold">Across {ticketHistory.length} Bets</p>
            </div>

            <div className="terminal-panel p-4 border-l-4 border-l-slate-700">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Total Risked</p>
                <h2 className="text-2xl font-black text-text-main">${totalStake.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                <p className="text-[10px] text-text-muted mt-2 font-bold">Risk Management: Auto</p>
            </div>
        </div>
    );
};
