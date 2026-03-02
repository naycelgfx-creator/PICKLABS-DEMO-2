import React, { useState, useMemo } from 'react';
import { ResolvedTicket } from '../../App';

export interface BankrollChartProps {
    ticketHistory: ResolvedTicket[];
}

export const BankrollChart: React.FC<BankrollChartProps> = ({ ticketHistory }) => {
    const [chartMode, setChartMode] = useState<'line' | 'bar'>('bar');
    const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'ALL'>('ALL');

    // Calculate cumulative bankroll over time points
    const chartData = useMemo(() => {
        // Filter by timeframe
        const now = new Date().getTime();
        const filtered = ticketHistory.filter(t => {
            if (timeframe === 'ALL') return true;
            const tDate = new Date(t.dateStr).getTime();
            const daysDiff = (now - tDate) / (1000 * 3600 * 24);
            if (timeframe === '7D') return daysDiff <= 7;
            if (timeframe === '30D') return daysDiff <= 30;
            return true;
        });

        // Reverse so chronological order
        const chronological = [...filtered].sort((a, b) => new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime());

        // Determine bucket count based on timeframe for detail
        const numBuckets = timeframe === '7D' ? 7 : (timeframe === '30D' ? 30 : 30);

        if (chronological.length === 0) {
            return Array(numBuckets).fill({ profit: 0, balance: 1000 });
        }

        let currentBalance = 1000;
        const pts = chronological.map(t => {
            const profit = t.payout - t.stake;
            currentBalance += profit;
            return { profit, balance: currentBalance, date: t.dateStr };
        });

        const bucketed: { profit: number, balance: number, date?: string }[] = [];
        let startBalance = 1000;

        for (let i = 0; i < numBuckets; i++) {
            const startIndex = Math.floor(i * (pts.length / numBuckets));
            const endIndex = Math.floor((i + 1) * (pts.length / numBuckets));

            if (startIndex >= pts.length || startIndex === endIndex) {
                // empty bucket
                bucketed.push({ profit: 0, balance: startBalance });
            } else {
                const bucketSlice = pts.slice(startIndex, endIndex);
                const finalBalanceInBucket = bucketSlice[bucketSlice.length - 1].balance;
                bucketed.push({
                    profit: finalBalanceInBucket - startBalance,
                    balance: finalBalanceInBucket,
                    date: bucketSlice[bucketSlice.length - 1].date
                });
                startBalance = finalBalanceInBucket;
            }
        }

        return bucketed;
    }, [ticketHistory, timeframe]);

    // Find min and max for scaling
    // We add some padding so max isn't exactly at the top
    const maxBalance = Math.max(1200, ...chartData.map(d => d.balance)) * 1.05;
    const minBalance = Math.min(800, ...chartData.map(d => d.balance)) * 0.95;
    const range = maxBalance - minBalance || 1;

    // SVG Line Path logic
    const buildPath = () => {
        if (chartData.length === 0) return '';

        const pathPoints = chartData.map((d, index) => {
            const x = 5 + (index * (90 / Math.max(1, chartData.length - 1)));
            // Y spans correctly (100 is bottom, 0 is top)
            const normalizedY = ((d.balance - minBalance) / range);
            // Clamp Y
            const y = 90 - (normalizedY * 80);

            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        });

        return pathPoints.join(' ');
    };

    return (
        <div className="terminal-panel p-6 overflow-hidden relative">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">show_chart</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">Bankroll Growth Curve</h3>
                </div>
                <div className="flex items-center gap-4 flex-wrap justify-end">

                    {/* Timeframe Toggle */}
                    <div className="flex items-center bg-neutral-900/50 rounded-lg p-1 border border-border-muted overflow-hidden">
                        {(['7D', '30D', 'ALL'] as const).map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${timeframe === tf ? 'bg-primary/20 text-primary shadow-[0_0_8px_rgba(13,242,13,0.2)]' : 'text-text-muted hover:text-white'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center bg-neutral-900/50 rounded-lg p-1 border border-border-muted overflow-hidden">
                        <button
                            onClick={() => setChartMode('bar')}
                            className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${chartMode === 'bar' ? 'bg-primary text-black shadow-md' : 'text-text-muted hover:text-white'}`}
                        >
                            Bar Focus
                        </button>
                        <button
                            onClick={() => setChartMode('line')}
                            className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${chartMode === 'line' ? 'bg-primary text-black shadow-md' : 'text-text-muted hover:text-white'}`}
                        >
                            Line Trending
                        </button>
                    </div>

                    <div className="hidden sm:block h-4 w-[1px] bg-border-muted mx-2"></div>

                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-0.5 bg-primary"></span>
                            <span className="text-[10px] text-text-muted font-bold uppercase">Actual Growth</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-0.5 bg-slate-600 border-dashed border-t"></span>
                            <span className="text-[10px] text-text-muted font-bold uppercase">Baseline</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-64 flex items-end justify-between relative gap-1 px-4">
                {/* Dynamically Map the Bars */}
                {chartData.map((d, i) => {
                    const normalizedHeight = ((d.balance - minBalance) / range);
                    let hPercent = normalizedHeight * 100;
                    hPercent = Math.max(5, Math.min(100, hPercent));

                    const isActive = chartMode === 'bar';
                    const opacityClass = isActive ? `opacity-${Math.min(100, 20 + i * 5)}` : 'opacity-10';
                    const bgClass = d.balance >= 1000 ? 'bg-primary' : 'bg-red-500';
                    const borderClass = d.balance >= 1000 ? 'border-primary' : 'border-red-500';

                    return (
                        <div key={i} className={`flex-1 ${bgClass} ${isActive ? 'bg-opacity-20' : 'bg-opacity-5'} rounded-t border-t ${borderClass} ${isActive ? 'border-opacity-60' : 'border-opacity-20'} relative group transition-all duration-500 ${opacityClass}`} style={{ height: `${hPercent}%` }}>
                            {isActive && (
                                <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 text-[10px] p-1 border border-border-muted rounded text-text-main z-10 font-bold">
                                    ${Math.round(d.balance).toLocaleString()}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* SVG Overlay for the Line Graph */}
                <div className={`absolute bottom-0 left-0 w-full h-full pointer-events-none transition-opacity duration-500 ${chartMode === 'line' ? 'opacity-100' : 'opacity-40'}`}>
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        {/* Static Baseline */}
                        <path d={`M0 ${90 - (((1000 - minBalance) / range) * 80)} L 100 ${90 - (((1000 - minBalance) / range) * 80)}`} fill="none" stroke="#475569" strokeDasharray="4" strokeWidth="0.5"></path>

                        {/* Dynamic Path */}
                        <path
                            className={`drop-shadow-[0_0_5px_rgba(13,242,13,0.5)] ${chartMode === 'line' ? 'stroke-primary animate-[dash_2s_linear_forwards]' : 'stroke-primary/50'}`}
                            d={buildPath()}
                            fill="none"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>
                    </svg>
                </div>
            </div>

            <div className="flex justify-between mt-4 px-4 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                <span>Start</span>
                <span>Q1</span>
                <span>Q2</span>
                <span>Q3</span>
                <span>Current</span>
            </div>
        </div>
    );
};
