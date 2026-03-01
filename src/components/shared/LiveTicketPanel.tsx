import React, { useState } from 'react';
import { BetPick } from '../../App';
import { searchPlayers } from '../../data/playerDB';
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

const getLogoForPick = (bet: BetPick) => {
    const isPlayerProp = ['Over', 'Under', 'Prop'].includes(bet.type);
    if (isPlayerProp) {
        // Remove betting terms to isolate the player name
        const playerCleanName = bet.team.replace(/(Over|Under|Prop|\+|-|[0-9.]+|Pts|Rebs|Asts|Threes|Points|Rebounds|Assists|Steals|Blocks|Turnovers|O\/U).*$/i, '').trim();
        const results = searchPlayers(playerCleanName);
        if (results.length > 0 && results[0].headshot) {
            return results[0].headshot;
        }
    }
    const cleanTeamName = bet.team.replace(/ (ML|Spread|PK|\+|-).*$/i, '').trim();
    // Attempt ESPN NBA by stripping words, or provide fallback
    // The logo will gracefully fallback via the onError handler in the img tag
    const abbr = cleanTeamName.split(' ')[0].substring(0, 3).toLowerCase();
    return `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`;
};

const TicketCard: React.FC<{ ticket: BetPick[]; onRemove?: () => void }> = ({ ticket, onRemove }) => {
    const ticketId = React.useMemo(() => Math.floor(1000000000 + Math.random() * 9000000000).toString(), []);
    const ticketDate = React.useMemo(() => {
        const d = new Date();
        return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }, []);

    if (!ticket || ticket.length === 0) return null;

    const totalLegs = ticket.length;
    // Mock win calculations
    const winningLegs = Math.max(0, Math.floor(totalLegs / 2));
    const hitPercent = totalLegs > 0 ? Math.round((winningLegs / totalLegs) * 100) : 0;
    const isParlay = totalLegs > 1;
    const combinedOddsStr = isParlay ? calculateParlayOdds(ticket) : (ticket[0]?.odds || 'N/A');
    const sumStakes = ticket.reduce((acc, b) => acc + (b.stake || 0), 0);
    const riskAmount = isParlay ? (sumStakes > 0 ? sumStakes : 50) : (sumStakes || 10);
    const payoutAmount = riskAmount + toWin(riskAmount, combinedOddsStr);

    return (
        <div className="w-full shrink-0 bg-[#0c0c0e] border border-neutral-700 rounded-none shadow-2xl overflow-hidden font-sans mb-2 flex flex-col transition-all duration-300 relative group">
            {/* Remove Button */}
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-full transition-colors z-10 opacity-0 group-hover:opacity-100"
                    title="Remove Ticket"
                >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
            )}
            {/* PickLabs Logo Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-neutral-800 relative z-0">
                <div className="flex items-center gap-1">
                    <span className="text-[#A3FF00] font-black tracking-tighter italic text-xl leading-none">PICKLABS</span>
                </div>
                <div className="text-[10px] font-black text-white tracking-widest uppercase mt-1">
                    SPORTSBOOK
                </div>
            </div>

            {/* Header (Pick Hitting / Bullish-Bearish) */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-[#111111]">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-2 h-2 rounded-full ${hitPercent >= 50 ? 'bg-[#A3FF00] shadow-[0_0_8px_rgba(163,255,0,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'} animate-pulse`} />
                        <span className="text-sm font-black text-white tracking-widest uppercase">
                            PICKS HITTING
                        </span>
                        <span className={`text-sm font-black ${hitPercent >= 50 ? 'text-[#A3FF00]' : 'text-red-500'}`}>{hitPercent}%</span>
                    </div>
                    {/* Full Width Gradient Bar */}
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mt-2">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-yellow-500 via-orange-500 to-[#A3FF00]"
                            style={{ width: `${hitPercent}%` }}
                        />
                    </div>
                </div>
                <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                    {totalLegs} PICKS
                </div>
            </div>

            {/* Pick List */}
            <div className="flex-1 overflow-y-auto max-h-[200px] custom-[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-800 bg-[#0a0a0c]">
                {ticket.map((bet, i) => {
                    const isHitting = i < winningLegs;
                    // Provide a nice target mock: 
                    const pickProgress = isHitting ? 100 : 30 + (i * 25) % 65;
                    const logoUrl = getLogoForPick(bet);

                    // Extract the numerical target from either bet.type or bet.team
                    const targetStringMatch = (bet.team + " " + bet.type).match(/[0-9.]+/);
                    const targetNum = targetStringMatch ? parseFloat(targetStringMatch[0]) : null;

                    let currentNum = 0;
                    if (targetNum !== null) {
                        currentNum = isHitting ? targetNum : parseFloat(((targetNum * pickProgress) / 100).toFixed(1));
                        if (currentNum > targetNum) currentNum = targetNum;
                    }

                    const getColor = (prog: number) => {
                        if (prog < 33) return '#ef4444'; // red
                        if (prog < 66) return '#f97316'; // orange
                        return '#A3FF00'; // lime green
                    };
                    const barColor = getColor(pickProgress);

                    // Clean the team/player name for display and avatar fallback
                    const cleanTeamName = bet.team.replace(/(Over|Under|Prop|ML|Spread|PK|\+|-|[0-9.]+|Pts|Rebs|Asts|Threes|Points|Rebounds|Assists|Steals|Blocks|Turnovers|O\/U).*$/i, '').trim();

                    // Display Logic
                    const isMoneyline = bet.type === 'ML' || bet.type.toLowerCase().includes('moneyline');
                    let topText: string = bet.team;
                    let bottomText: string = bet.type;

                    if (isMoneyline) {
                        topText = bet.team;
                        bottomText = "MONEYLINE";
                    } else if (bet.type.toLowerCase().includes('over') || bet.type.toLowerCase().includes('under') || bet.type.toLowerCase().includes('spread')) {
                        const isUnder = bet.type.toLowerCase().includes('under');
                        const isOver = bet.type.toLowerCase().includes('over');
                        const valMatch = bet.type.match(/[0-9.]+/);
                        const val = valMatch ? valMatch[0] : '';

                        topText = `${bet.team} ${isUnder ? 'Under' : isOver ? 'Over' : ''} ${val}`.trim();
                        // Assume standard player prop if not moneyline/spread but let's mock the category
                        bottomText = `${bet.team.toUpperCase()} - ${(bet.type.split(' ')[0] || 'PROP').toUpperCase()}`;
                    } else if (bet.type.toLowerCase().includes('+')) {
                        // e.g. "To Score 25+ Points"
                        topText = bet.team;
                        bottomText = bet.type.toUpperCase();
                    }

                    // Status Logic (0: Hit, 1: Miss, 2: Pending)
                    // For mockup, let's say the very last ticket leg that isn't hitting is 'miss' and rest are 'pending'.
                    // Actually, if hitPercent is calculation based on winningLegs, we can mock:
                    // i < winningLegs -> HIT
                    // i === winningLegs -> MISS (red X)
                    // i > winningLegs -> PENDING (empty circle)
                    let statusNode = null;
                    if (i < winningLegs) {
                        statusNode = (
                            <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#111111] border border-[#A3FF00] relative z-20">
                                <span className="material-symbols-outlined text-[#A3FF00] text-[10px] font-bold">check</span>
                            </div>
                        );
                    } else if (i === winningLegs && hitPercent < 100) {
                        statusNode = (
                            <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#111111] border border-red-500 relative z-20">
                                <span className="material-symbols-outlined text-red-500 text-[10px] font-bold">close</span>
                            </div>
                        );
                    } else {
                        statusNode = (
                            <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#111111] border border-neutral-600 relative z-20">
                                {/* Empty Pending Circle */}
                            </div>
                        );
                    }

                    return (
                        <div key={bet.id} className="relative flex px-4 pt-4 hover:bg-white/[0.02] transition-colors group">
                            {/* Timeline Track & Node */}
                            <div className="flex flex-col items-center mr-3 relative z-10 w-4 pb-2">
                                {/* Top connecting line (hide on first item) */}
                                {i !== 0 && (
                                    <div className="absolute top-0 bottom-[calc(100%-1rem)] w-px bg-neutral-800" />
                                )}
                                {/* Bottom connecting line (hide on last item) */}
                                {i !== ticket.length - 1 && (
                                    <div className="absolute top-5 -bottom-4 w-px bg-neutral-800" />
                                )}

                                {/* Status Icon Node */}
                                {statusNode}
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0 pb-4 border-b border-neutral-800/60 group-last:border-b-0">
                                {/* Logo & Core Info Row */}
                                <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-start gap-2 min-w-0 pr-2 pt-0.5">
                                        {/* Avatar */}
                                        {logoUrl.includes('ui-avatars') ? (
                                            <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                                                <span className="text-white text-[8px] font-bold">{cleanTeamName.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                        ) : (
                                            <img src={logoUrl} alt={cleanTeamName} className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-800 object-cover shrink-0" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanTeamName)}&background=1d1d1d&color=fff&rounded=true&bold=true`; }} />
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-white truncate leading-tight">{topText}</span>
                                            <span className="text-[9px] text-slate-500 font-bold truncate uppercase tracking-widest mt-0.5">{bottomText}</span>
                                        </div>
                                    </div>
                                    {/* Odds */}
                                    <span className="text-sm text-white font-black shrink-0">{bet.odds}</span>
                                </div>

                                {/* Progress Bar (Only if NOT Moneyline AND has targetNum) */}
                                {!isMoneyline && targetNum !== null && (
                                    <div className="mt-4 mb-3 w-full relative px-2">
                                        <div className="h-0.5 bg-neutral-800 w-full relative flex items-center rounded-full">
                                            {/* Filled Bar */}
                                            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(currentNum / targetNum) * 100}%`, backgroundColor: barColor }} />
                                            {/* Badge positioned absolutely along the bar */}
                                            <div className="absolute w-5 h-5 flex items-center justify-center bg-[#111111] border border-neutral-700 text-[8px] font-bold text-white rounded-full transition-all duration-500 ease-out z-10 shadow-sm" style={{ left: `calc(${(currentNum / targetNum) * 100}% - 10px)` }}>
                                                {currentNum}
                                            </div>
                                        </div>
                                        {/* Target value text right under the line */}
                                        <div className="absolute -right-1 -top-1.5 text-[10px] font-bold text-white">
                                            {targetNum}
                                        </div>
                                    </div>
                                )}

                                {/* MoneyLine Box Score Mockup */}
                                {isMoneyline && (() => {
                                    const matchParts = bet.matchupStr ? bet.matchupStr.split(' vs ') : [];
                                    let opponentName = 'Opponent';
                                    if (matchParts.length === 2) {
                                        opponentName = matchParts[0].trim() === cleanTeamName ? matchParts[1].trim() : matchParts[0].trim();
                                    }
                                    return (
                                        <div className="flex flex-col text-[10px] text-slate-400 font-mono mt-3 w-full pl-8 pr-1">
                                            <div className="flex justify-between items-center py-1">
                                                <span className="truncate pr-2">{opponentName}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span>21</span><span>25</span><span>30</span><span>22</span><span className="text-white font-bold ml-2">98</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-1">
                                                <span className="truncate pr-2">{cleanTeamName}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span>25</span><span>22</span><span>33</span><span>27</span><span className="text-white font-bold ml-2">107</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Odds / Risk / To Win Box (Moved below picks) */}
            <div className="px-4 py-3 border-t border-neutral-800 bg-[#111111] flex justify-between items-center text-center shadow-[0_-4px_10px_rgba(0,0,0,0.3)] z-10 shrink-0">
                <div className="flex flex-col items-start min-w-[30%]">
                    <span className="text-[9px] font-bold text-slate-500 tracking-widest mb-0.5 uppercase">ODDS</span>
                    <span className="text-sm font-black text-white">{combinedOddsStr}</span>
                </div>
                <div className="flex flex-col items-center flex-1 border-x border-neutral-800/60 px-2 my-1">
                    <span className="text-[9px] font-bold text-slate-500 tracking-widest mb-0.5 uppercase">RISK</span>
                    <span className="text-sm font-black text-white">${riskAmount.toFixed(2)}</span>
                </div>
                <div className="flex flex-col items-end min-w-[30%]">
                    <span className="text-[9px] font-bold text-slate-500 tracking-widest mb-0.5 uppercase">TO WIN</span>
                    <span className="text-sm font-black text-[#A3FF00]">${payoutAmount.toFixed(2)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-[#0a0a0c] border-t border-neutral-900 flex justify-between items-center text-[9px] text-neutral-500 font-mono tracking-widest uppercase shrink-0">
                <span>BET ID: {ticketId}</span>
                <span>{ticketDate.toUpperCase()}</span>
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
            <div className="fixed bottom-6 xl:bottom-10 right-6 xl:right-10 z-[100] flex flex-col items-end pointer-events-none">
                <div className="w-[340px] pointer-events-auto flex flex-col shadow-2xl">
                    {activeTickets.length > 1 && (
                        <div className="flex justify-between items-center bg-black px-4 py-2 border border-neutral-700 border-b-0">
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
                    <TicketCard ticket={ticket} onRemove={() => {
                        if (onRemoveTicket) onRemoveTicket(activeIdx);
                        setCurrentIndex(0);
                    }} />
                </div>
            </div>
        );
    }

    // Default inline scroll mode
    return (
        <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-neutral-800/80 [&::-webkit-scrollbar-track]:bg-transparent snap-x snap-mandatory flex gap-4 pb-4 px-1">
            {activeTickets.map((ticket, idx) => (
                <div key={idx} className="snap-center shrink-0 w-[90%] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] min-w-[280px]">
                    <TicketCard ticket={ticket} onRemove={onRemoveTicket ? () => onRemoveTicket(idx) : undefined} />
                </div>
            ))}
        </div>
    );
};
