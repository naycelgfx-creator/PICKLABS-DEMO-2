import React, { useState, useRef, useEffect } from 'react';
import { BetPick } from '../../App';
import { useLiveBets } from '../../contexts/LiveBetsContext';

interface LiveTicketPanelProps {
    activeTickets?: BetPick[][];
    onRemoveTicket?: (index: number) => void;
}

const americanToDecimal = (oddsStr: string): number => {
    if (!oddsStr || oddsStr === 'N/A') return 1.909;
    const odds = parseInt(oddsStr.replace('+', ''));
    if (isNaN(odds)) return 1.909;
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

const BeforeAfterTicketCard: React.FC<{ ticket: BetPick[]; onRemove?: () => void }> = ({ ticket, onRemove }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (containerRef.current) {
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight
            });
        }
    }, [ticket]); // Recalculate if ticket changes

    if (!ticket || ticket.length === 0) return null;

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setSliderPos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        setSliderPos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
    };

    const handleMouseLeave = () => {
        setSliderPos(50);
    };

    const totalLegs = ticket.length;
    const isParlay = totalLegs > 1;
    const combinedOddsStr = isParlay ? calculateParlayOdds(ticket) : (ticket[0]?.odds || 'N/A');
    const sumStakes = ticket.reduce((acc, b) => acc + (b.stake || 0), 0);
    const riskAmount = isParlay ? (sumStakes > 0 ? sumStakes : 50) : (sumStakes || 10);
    const payoutAmount = toWin(riskAmount, combinedOddsStr); // payout is strictly winnings

    const TicketContent = ({ state }: { state: 'before' | 'after' }) => {
        const isAfter = state === 'after';
        return (
            <div className="w-full flex-shrink-0 flex flex-col px-6 py-8" style={{ minWidth: dimensions.width > 0 ? `${dimensions.width}px` : 'auto' }}>

                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="text-[10px] text-slate-500 font-black tracking-[0.2em] mb-1">BET SLIP</div>
                        <div className="text-2xl text-white font-black italic uppercase">{totalLegs}-LEG PARLAY</div>
                    </div>
                    <div className="text-right">
                        {!isAfter ? (
                            <>
                                <div className="text-[10px] text-slate-500 font-black tracking-[0.2em] mb-1">POTENTIAL PAYOUT</div>
                                <div className="text-2xl text-white font-black italic uppercase">+${payoutAmount.toFixed(2)}</div>
                            </>
                        ) : (
                            <>
                                <div className="text-[10px] text-[#A3FF00] font-black tracking-[0.2em] mb-1 drop-shadow-[0_0_8px_rgba(163,255,0,0.6)]">YOU WON</div>
                                <div className="text-2xl text-[#A3FF00] font-black italic uppercase drop-shadow-[0_0_12px_rgba(163,255,0,0.8)]">+${payoutAmount.toFixed(2)}</div>
                            </>
                        )}
                    </div>
                </div>

                {/* Picks List */}
                <div className="space-y-4">
                    {ticket.map((bet, i) => {
                        const cleanTeamName = bet.team.replace(/(Over|Under|Prop|ML|Spread|PK|\+|-|[0-9.]+|Pts|Rebs|Asts|Threes|Points|Rebounds|Assists|Steals|Blocks|Turnovers|O\/U).*$/i, '').trim();
                        const isMoneyline = bet.type === 'ML' || bet.type.toLowerCase().includes('moneyline');

                        let playerName = cleanTeamName.toUpperCase();
                        let statCategory = "MONEYLINE";
                        let statValue = "Winner";

                        const valMatch = bet.type.match(/[0-9.]+/);
                        const valNum = valMatch ? valMatch[0] : '';

                        if (isMoneyline) {
                            playerName = cleanTeamName.toUpperCase() + " ML";
                            statCategory = "MONEYLINE";
                            const matchupSplit = bet.matchupStr ? bet.matchupStr.split(' vs ') : [];
                            statValue = cleanTeamName;
                        } else if (bet.type.toLowerCase().includes('spread')) {
                            playerName = bet.team.toUpperCase();
                            statCategory = "SPREAD";
                            statValue = `${bet.type}`;
                        } else {
                            playerName = bet.team.toUpperCase();
                            const isUnder = bet.type.toLowerCase().includes('under');
                            const isOver = bet.type.toLowerCase().includes('over');
                            // Replace betting terms to extract exact prop category
                            const extractedCat = bet.type.replace(/over|under|[0-9.]+|prop|props|player/gi, '').trim().toUpperCase();
                            statCategory = extractedCat || "PASSING YARDS";
                            statValue = `${isUnder ? 'Under' : isOver ? 'Over' : 'Target'} ${valNum}`.trim();
                        }

                        // Deterministic book mocking for design
                        const betSeed = Array.from(bet.id || "").reduce((acc, char) => acc + char.charCodeAt(0), i * 123);
                        const books = ['FANDUEL', 'DRAFTKINGS', 'BETMGM', 'BET365', 'CAESARS'];
                        const book = books[betSeed % books.length];

                        return (
                            <div key={bet.id} className={`flex items-center justify-between p-4 ${isAfter ? 'border border-[#A3FF00]/40 rounded-sm bg-gradient-to-r from-transparent to-[#A3FF00]/[0.05]' : 'border-b border-neutral-800'}`}>
                                <div className="flex items-center gap-5">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isAfter ? 'border-2 border-[#A3FF00] bg-[#A3FF00]/10' : 'border-2 border-neutral-600'}`}>
                                        {isAfter && <span className="material-symbols-outlined text-[#A3FF00] text-[16px] font-bold">check</span>}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-black text-white uppercase tracking-tight leading-tight">{playerName}</span>
                                        <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase mt-1 mb-1.5">{statCategory}</span>
                                        <span className="text-base font-black italic text-white">{statValue}</span>
                                    </div>
                                </div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">
                                    {book} <span className="text-[#A3FF00] ml-1">{bet.odds}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Footer Message */}
                <div className="mt-8 text-center text-[10px] text-slate-500 font-bold tracking-[0.2em]">
                    &larr; HOVER TO REVEAL WINNING SLIP &rarr;
                </div>
            </div>
        );
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full shrink-0 bg-[#09090b] shadow-2xl font-sans flex flex-col overflow-hidden cursor-crosshair group select-none mt-3 rounded-md"
        >
            {/* Remove Button for Live Tracking Panel integration */}
            {onRemove && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="absolute top-4 right-4 p-1.5 bg-black/80 hover:bg-red-500 border border-neutral-800 text-slate-400 hover:text-white rounded-full transition-colors z-[100] opacity-0 group-hover:opacity-100"
                    title="Remove Ticket"
                >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
            )}

            {/* Base Pending Layer (BEFORE) */}
            <div className="w-full relative z-0">
                <TicketContent state="before" />
            </div>

            {/* Clipped Top Layer (AFTER) */}
            <div
                className="absolute inset-0 bg-[#09090b] pointer-events-none z-10 overflow-hidden"
                style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
            >
                <div className="w-full h-full relative" style={{ width: dimensions.width > 0 ? `${dimensions.width}px` : '100%' }}>
                    <TicketContent state="after" />
                </div>
            </div>

            {/* Splitter Grip Line */}
            <div
                className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#A3FF00] to-transparent shadow-[0_0_12px_#A3FF00] pointer-events-none transition-transform duration-75 z-20"
                style={{ left: `${sliderPos}%` }}
            >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[18px] h-8 bg-[#09090b] border-[1.5px] border-[#A3FF00] rounded-sm flex items-center justify-center pointer-events-none shadow-[0_0_10px_#A3FF00]">
                    <div className="grid grid-cols-2 gap-[2px]">
                        <div className="w-[2px] h-[2px] bg-[#A3FF00] rounded-full" />
                        <div className="w-[2px] h-[2px] bg-[#A3FF00] rounded-full" />
                        <div className="w-[2px] h-[2px] bg-[#A3FF00] rounded-full" />
                        <div className="w-[2px] h-[2px] bg-[#A3FF00] rounded-full" />
                        <div className="w-[2px] h-[2px] bg-[#A3FF00] rounded-full" />
                        <div className="w-[2px] h-[2px] bg-[#A3FF00] rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LiveTicketPanel: React.FC<LiveTicketPanelProps> = ({ activeTickets, onRemoveTicket }) => {
    const { isLiveBetsActive } = useLiveBets();
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!activeTickets || activeTickets.length === 0) return null;

    if (isLiveBetsActive) {
        // Floating mode (Live Bets Tracker ON)
        const activeIdx = Math.min(currentIndex, activeTickets.length - 1);
        const ticket = activeTickets[activeIdx];
        return (
            <div className="fixed bottom-6 xl:bottom-10 right-6 xl:right-10 z-[100] flex flex-col items-end pointer-events-none drop-shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                <div className="w-[420px] pointer-events-auto flex flex-col">
                    {activeTickets.length > 1 && (
                        <div className="flex justify-between items-center bg-[#09090b] px-5 py-3 border border-neutral-800 border-b-0 rounded-t-md">
                            <button onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : activeTickets.length - 1)} className="text-[#A3FF00] hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <span className="text-[10px] font-black text-white tracking-widest uppercase">
                                Ticket {activeIdx + 1} of {activeTickets.length}
                            </span>
                            <button onClick={() => setCurrentIndex(prev => prev < activeTickets.length - 1 ? prev + 1 : 0)} className="text-[#A3FF00] hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    )}
                    <BeforeAfterTicketCard ticket={ticket} onRemove={() => {
                        if (onRemoveTicket) onRemoveTicket(activeIdx);
                        setCurrentIndex(0);
                    }} />
                </div>
            </div>
        );
    }

    // Default inline scroll mode
    return (
        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-neutral-800/80 [&::-webkit-scrollbar-track]:bg-transparent snap-x snap-mandatory flex gap-6 pb-4 px-1">
            {activeTickets.map((ticket, idx) => (
                <div key={idx} className="snap-center shrink-0 w-[95%] sm:w-[500px] min-w-[340px]">
                    <BeforeAfterTicketCard ticket={ticket} onRemove={onRemoveTicket ? () => onRemoveTicket(idx) : undefined} />
                </div>
            ))}
        </div>
    );
};
