import React, { useState, useEffect } from 'react';
import { PlayerProp } from './PlayerPropsView';

interface OutlierPropChartProps {
    prop: PlayerProp;
    onClose: () => void;
    onAddBet: (odds: string) => void;
}

export const OutlierPropChart: React.FC<OutlierPropChartProps> = ({ prop, onClose, onAddBet }) => {
    const [timeframe, setTimeframe] = useState<'L5' | 'L10' | 'L20' | 'H2H'>('L10');
    const [chartData, setChartData] = useState<number[]>([]);

    // Generate fake chart data based on the prop line and confidence
    useEffect(() => {
        const length = timeframe === 'L5' ? 5 : timeframe === 'L10' ? 10 : timeframe === 'L20' ? 20 : 5;
        const data: number[] = [];
        const hitRate = prop.confidence / 100; // e.g. 0.70

        for (let i = 0; i < length; i++) {
            const isHit = Math.random() < hitRate;
            // Generate a random score centered around the line, ensuring it hits/misses appropriately
            const variance = prop.line * 0.3; // 30% variance
            let score = 0;

            if (prop.type === 'Over') {
                score = isHit
                    ? prop.line + (Math.random() * variance) + 0.5
                    : Math.max(0, prop.line - (Math.random() * variance) - 0.5);
            } else {
                score = isHit
                    ? Math.max(0, prop.line - (Math.random() * variance) - 0.5)
                    : prop.line + (Math.random() * variance) + 0.5;
            }

            data.push(Math.round(score));
        }
        setChartData(data);
    }, [timeframe, prop]);

    const hits = chartData.filter(d => prop.type === 'Over' ? d > prop.line : d < prop.line).length;
    const maxVal = Math.max(...chartData, prop.line * 1.5);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            {/* Modal Dialog */}
            <div
                className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* ── Header ── */}
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative bg-gradient-to-r from-neutral-900 to-neutral-800">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {/* Initials placeholder since we don't have headshots */}
                            <span className="text-xl font-black text-text-muted font-mono">
                                {prop.player.split(' ').map(n => n[0]).join('')}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white m-0 uppercase tracking-tight">{prop.player}</h2>
                            <div className="flex items-center gap-3 mt-1.5 opacity-80">
                                <span className="px-2 py-0.5 rounded bg-primary text-black text-[10px] font-mono font-bold uppercase">{prop.team}</span>
                                <span className="text-text-muted text-xs font-medium">vs <span className="text-white">{prop.opponent}</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-end gap-2 text-right">
                        <div className="bg-neutral-800 border border-white/5 rounded-lg p-2.5 px-4 flex flex-col items-center">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-0.5">PickLabs Projection</span>
                            <div className="text-xl font-black text-primary font-mono">{prop.projection}</div>
                        </div>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 custom-scrollbar">

                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex bg-neutral-800 rounded-lg p-1 border border-white/5">
                                <button className="px-5 py-1.5 rounded-md bg-white/10 text-white text-sm font-bold shadow-sm transition-all">
                                    {prop.category}
                                </button>
                                {/* In a real app we'd map over available categories here */}
                            </div>
                            <div className="text-2xl font-black text-white ml-2 flex items-center gap-2 font-mono">
                                <span className={prop.type === 'Over' ? 'text-emerald-400' : 'text-text-muted'}>O</span>
                                <span className="opacity-50">/</span>
                                <span className={prop.type === 'Under' ? 'text-red-400' : 'text-text-muted'}>U</span>
                                <span className="ml-1">{prop.line}</span>
                            </div>
                        </div>

                        {/* Timeframe selector */}
                        <div className="flex bg-neutral-800 rounded-lg p-1 border border-white/5 w-full sm:w-auto overflow-x-auto custom-scrollbar">
                            {(['L5', 'L10', 'L20', 'H2H'] as const).map(tf => (
                                <button
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap
                                        ${timeframe === tf ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-white'}
                                    `}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Chart Container ── */}
                    <div className="w-full h-72 border-b border-white/10 relative pb-6 flex items-end gap-2 px-4 pt-10">
                        {/* Y-Axis Labels */}
                        <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between items-end pr-2 text-[10px] font-mono text-text-muted opacity-50 z-10">
                            <span>{Math.ceil(maxVal)}</span>
                            <span>{Math.ceil(maxVal / 2)}</span>
                            <span>0</span>
                        </div>

                        {/* Threshold Line */}
                        <div
                            className="absolute left-8 right-0 border-t-2 border-dashed border-primary/50 z-10 pointer-events-none flex items-center"
                            style={{ bottom: `${(prop.line / maxVal) * 100}%`, marginBottom: '24px' }}
                        >
                            <div className="absolute right-0 translate-x-full ml-2 bg-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                                Line {prop.line}
                            </div>
                        </div>

                        {/* Bars */}
                        <div className="flex-1 flex justify-around items-end h-full relative z-20 pl-6 pr-10">
                            {chartData.map((val, i) => {
                                const isOver = val > prop.line;
                                const hitColor = prop.type === 'Over'
                                    ? (isOver ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-neutral-700')
                                    : (!isOver ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-neutral-700');

                                return (
                                    <div key={i} className="flex flex-col items-center justify-end h-full flex-1 max-w-[40px] group relative">
                                        <div
                                            className={`w-full rounded-t-sm transition-all duration-500 ease-out ${hitColor} group-hover:brightness-125`}
                                            style={{ height: `${Math.max(2, (val / maxVal) * 100)}%` }}
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold py-1 px-2 rounded shadow-lg transition-opacity whitespace-nowrap z-30 pointer-events-none">
                                                {val} {prop.category}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="absolute left-10 right-10 bottom-0 h-6 flex justify-around items-center">
                            {chartData.map((_, i) => (
                                <div key={i} className="flex-1 text-center text-[10px] text-text-muted font-mono uppercase opacity-50">
                                    Gm {chartData.length - i}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Summary Stats ── */}
                    <div className="flex flex-col md:flex-row gap-4 bg-neutral-900 border border-white/5 rounded-xl p-4">
                        <div className="flex-1 flex flex-col justify-center items-center p-4 bg-neutral-800/50 rounded-lg">
                            <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase mb-1">Hit Rate ({timeframe})</div>
                            <div className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
                                {Math.round((hits / chartData.length) * 100)}<span className="text-xl">%</span>
                            </div>
                            <div className="text-xs text-text-muted font-medium mt-1">Hit {hits} of {chartData.length} games</div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center items-center p-4 bg-neutral-800/50 rounded-lg text-center">
                            <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase mb-2">PickLabs Insight</div>
                            <div className="text-sm text-white font-medium">
                                Player has exceeded this projection in {hits} of their last {chartData.length} outings.
                                <span className={`ml-1 font-bold ${prop.confidence >= 70 ? 'text-primary' : 'text-orange-400'}`}>
                                    Model confidence is {prop.confidence}%.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Footer / CTA ── */}
                <div className="p-6 border-t border-white/5 bg-neutral-900 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="bg-neutral-800 border border-white/10 rounded px-3 py-2 flex flex-col items-center flex-1 sm:flex-none">
                            <span className="text-[9px] font-mono text-text-muted uppercase">Line</span>
                            <span className="text-sm font-bold text-white">{prop.line}</span>
                        </div>
                        <div className="bg-neutral-800 border border-white/10 rounded px-3 py-2 flex flex-col items-center flex-1 sm:flex-none">
                            <span className="text-[9px] font-mono text-text-muted uppercase">Odds</span>
                            <span className="text-sm font-bold text-accent-blue">{prop.odds}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => onAddBet(prop.odds)}
                        className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-white text-black font-black font-mono tracking-widest uppercase rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(191,255,0,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                    >
                        <span className="material-symbols-outlined text-xl">add_box</span>
                        Add to Slip
                    </button>
                </div>
            </div>
        </div>
    );
};
