import { Compare } from './compare';

const BETS = [
    { player: 'Patrick Mahomes', market: 'Passing Yards', line: 'Over 289.5', odds: '-115', book: 'FanDuel' },
    { player: 'Tyreek Hill', market: 'Receiving Yards', line: 'Over 74.5', odds: '-110', book: 'DraftKings' },
    { player: 'Travis Kelce', market: 'Receptions', line: 'Over 5.5', odds: '-120', book: 'BetMGM' },
    { player: 'Chiefs ML', market: 'Moneyline', line: 'Kansas City', odds: '-140', book: 'Bet365' },
];

function PendingSlip() {
    return (
        <div className="w-full h-full bg-neutral-950 flex flex-col p-5 font-display">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Bet Slip</p>
                    <p className="text-xs font-black italic uppercase text-text-main">4-Leg Parlay</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">To Win</p>
                    <p className="text-lg font-black italic text-text-main tracking-tighter">$247.50</p>
                </div>
            </div>

            {/* Bets */}
            <div className="flex-1 space-y-3">
                {BETS.map((bet, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                        {/* Empty circle */}
                        <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 border-neutral-600 bg-transparent" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wide text-text-main truncate">{bet.player}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{bet.market}</p>
                            <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] font-black text-slate-300 italic">{bet.line}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">{bet.book}</span>
                                    <span className="text-[10px] font-black text-slate-400">{bet.odds}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Wager</span>
                    <span className="text-sm font-black italic text-text-main">$25.00</span>
                </div>
                <div className="w-full py-3 rounded-xl border-2 border-neutral-700 text-center text-[10px] font-black uppercase tracking-[0.2em] italic text-slate-600">
                    Pending…
                </div>
            </div>
        </div>
    );
}

function WonSlip() {
    return (
        <div className="w-full h-full bg-neutral-950 flex flex-col p-5 font-display">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-primary/30">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/70">Bet Slip</p>
                    <p className="text-xs font-black italic uppercase text-text-main">4-Leg Parlay</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-primary/70 uppercase tracking-widest font-bold">You Won</p>
                    <p className="text-lg font-black italic text-primary tracking-tighter drop-shadow-[0_0_12px_rgba(13,242,13,0.7)]">+$247.50</p>
                </div>
            </div>

            {/* Bets — all green ticked */}
            <div className="flex-1 space-y-3">
                {BETS.map((bet, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 shadow-[0_0_8px_rgba(13,242,13,0.05)]">
                        {/* Filled green circle with check */}
                        <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-[0_0_8px_rgba(13,242,13,0.6)]">
                            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 12 12">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-wide text-text-main truncate">{bet.player}</p>
                            <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">{bet.market}</p>
                            <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] font-black text-primary italic">{bet.line} ✓</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">{bet.book}</span>
                                    <span className="text-[10px] font-black text-primary/70">{bet.odds}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer — winner state */}
            <div className="mt-4 pt-3 border-t border-primary/20">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Wager</span>
                    <span className="text-sm font-black italic text-text-main">$25.00</span>
                </div>
                <div className="w-full py-3 rounded-xl bg-primary/10 border-2 border-primary/60 text-center text-[10px] font-black uppercase tracking-[0.2em] italic text-primary shadow-[0_0_16px_rgba(13,242,13,0.25)]">
                    🏆 Winner · Paid Out
                </div>
            </div>
        </div>
    );
}

export function BetSlipCompare() {
    return (
        <div className="relative">
            {/* Subtle label hints */}
            <div className="absolute -top-6 left-0 right-0 flex justify-between px-2 pointer-events-none z-10">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Before</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/70">After ←</span>
            </div>
            <Compare
                firstContent={<PendingSlip />}
                secondContent={<WonSlip />}
                className="w-full h-[460px] rounded-2xl border border-neutral-800 shadow-[0_0_40px_rgba(13,242,13,0.08)] overflow-hidden"
                initialSliderPercentage={50}
                slideMode="hover"
                showHandlebar={true}
            />
            {/* Tooltip hint */}
            <p className="text-center text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 mt-3">
                ← Hover to reveal winning slip →
            </p>
        </div>
    );
}
