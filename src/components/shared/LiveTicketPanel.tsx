/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { BetPick } from '../../App';
import { searchPlayers } from '../../data/playerDB';
import { useLiveBets } from '../../contexts/LiveBetsContext';
import { getCurrentUser, isAdminEmail } from '../../data/PickLabsAuthDB';
import { IconBrandInstagram, IconBrandFacebook, IconBrandDiscord, IconBrandWhatsapp, IconBrandTelegram } from '@tabler/icons-react';

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
    const abbr = cleanTeamName.split(' ')[0].substring(0, 3).toLowerCase();
    return `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png`;
};

export const TicketCard: React.FC<{
    ticket: BetPick[];
    onRemove?: () => void;
    forceStatus?: 'WON' | 'LOST' | 'VOID';
    dateOverride?: string;
}> = ({ ticket, onRemove, forceStatus, dateOverride }) => {
    const { activeGames } = useLiveBets();
    const ticketId = React.useMemo(() => Math.floor(1000000000 + Math.random() * 9000000000).toString(), []);

    const ticketDate = React.useMemo(() => {
        if (dateOverride) return dateOverride;
        const d = new Date();
        return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }, [dateOverride]);

    const hasSGP = React.useMemo(() => {
        if (!ticket || ticket.length < 2) return false;
        const gameIds = ticket.filter(b => b.gameId).map(b => b.gameId);
        const uniqueGameIds = new Set(gameIds);
        return uniqueGameIds.size < gameIds.length;
    }, [ticket]);

    const user = getCurrentUser();
    const isPremiumUser = user?.isPremium || isAdminEmail(user?.email || '');
    const totalLegs = ticket?.length || 0;

    // Calculate a mock "AI Win Probability" based on number of legs and odds. 
    const winProbability = React.useMemo(() => {
        let prob = 90 - (totalLegs * 5);
        if (prob < 15) prob = 15;
        // Seed randomness based on combined ticket ID
        const hash = Array.from(ticketId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return Math.min(99, Math.max(1, prob + (hash % 15)));
    }, [totalLegs, ticketId]);

    const [isShareVisible, setIsShareVisible] = useState(false);

    if (!ticket || ticket.length === 0) return null;

    const legResults = ticket ? ticket.map((bet, i) => {
        const isFinished = forceStatus ? true : (bet.gameStatusName === 'STATUS_FINAL' || bet.gameStatus === 'post' || bet.gameStatus === 'FINAL');
        const isLive = forceStatus ? false : (bet.gameStatusName === 'STATUS_IN_PROGRESS' || bet.gameStatus === 'in' || bet.gameStatus === 'LIVE' || bet.gameStatus === 'inprogress');
        const isUpcoming = !isFinished && !isLive;

        const betSeed = Array.from(bet.id || "").reduce((acc, char) => acc + char.charCodeAt(0), i * 123);

        // Extract the numerical target from either bet.type or bet.team
        const targetStringMatch = (bet.team + " " + bet.type).match(/[0-9.]+/);
        const targetNum = targetStringMatch ? parseFloat(targetStringMatch[0]) : null;

        const isMoneyline = bet.type === 'ML' || bet.type.toLowerCase().includes('moneyline');
        const isUnder = bet.type.toLowerCase().includes('under');
        const isOver = bet.type.toLowerCase().includes('over');

        let isWon = false;
        let isLost = false;
        let isVoid = false;

        if (forceStatus === 'WON') {
            isWon = true;
        } else if (forceStatus === 'LOST') {
            // If the whole ticket is declared LOST externally, we don't arbitrarily mark the first leg lost anymore, 
            // we'll just let the natural mock evaluation do its thing or randomly pick one to be lost.
            isVoid = isFinished && (betSeed % 15 === 0);
            isWon = isFinished && !isVoid && (betSeed % 4 !== 0);
            isLost = isFinished && !isVoid && !isWon;

            // Guarantee at least one lost leg if finished to justify the forceStatus LOST
            if (isFinished && !ticket.some((_, idx) => {
                const seed = Array.from(ticket[idx].id || "").reduce((acc, char) => acc + char.charCodeAt(0), idx * 123);
                return !(seed % 15 === 0) && (seed % 4 === 0);
            })) {
                if (i === 0) isLost = true;
            }
        } else {
            // Mock evaluation logic 
            isVoid = isFinished && (betSeed % 15 === 0);
            isWon = isFinished && !isVoid && (betSeed % 4 !== 0);
            isLost = isFinished && !isVoid && !isWon;
        }

        // Apply strict rules
        if (isMoneyline) {
            // Moneyline can NEVER be lost while the game is live or upcoming
            if (!isFinished) {
                isLost = false;
                isWon = false;
            }
        }

        let progress = 0;
        if (isWon) progress = 100;
        else if (isVoid) progress = 100;
        else if (isLost && isFinished) progress = 20 + (betSeed % 30);
        else if (isLive) progress = 10 + (betSeed % 80);
        else progress = 0; // Upcoming game

        // Under strict live logic:
        if (isUnder && isLive && targetNum !== null && !isFinished) {
            let mockedCurrentNum = parseFloat(((targetNum * progress) / 100).toFixed(1));
            // Randomly spike it over the under to simulate losing live (but we won't officially mark it LOST until final)
            if (betSeed % 5 === 0) {
                mockedCurrentNum = targetNum + (betSeed % 5) + 1;
            }
            if (mockedCurrentNum > targetNum) {
                // Technically busted, but we don't mark official loss until game is over
                isLost = false;
            }
        }

        // *** USER FIX: Enforce STRICT PENDING while LIVE ***
        if (isLive && !isFinished && !forceStatus) {
            isWon = false;
            isLost = false;
            isVoid = false;
        }

        let status = 'PENDING';
        if (isVoid) status = 'VOID';
        else if (isWon) status = 'WON';
        else if (isLost) status = 'LOST';

        return {
            bet,
            index: i,
            isFinished,
            isLive,
            isUpcoming,
            status,
            progress,
            betSeed,
            targetNum
        };
    }) : [];

    const hasLostLeg = legResults.some(l => l.status === 'LOST');
    const allFinished = legResults.every(l => l.isFinished);
    const allVoid = legResults.every(l => l.status === 'VOID');

    let ticketStatus = 'PENDING';
    if (forceStatus) {
        ticketStatus = forceStatus;
    } else if (hasLostLeg) {
        ticketStatus = 'LOST';
    } else if (allVoid && legResults.length > 0) {
        ticketStatus = 'VOID';
    } else if (allFinished && legResults.length > 0) {
        ticketStatus = 'WON';
    }

    const winningOrPendingGood = legResults.filter(l => l.status === 'WON' || (l.status === 'PENDING' && l.progress >= 50)).length;
    const hitPercent = totalLegs > 0 ? Math.round((winningOrPendingGood / totalLegs) * 100) : 0;

    // Filter out voided legs for odds calculation
    const activeTicketLegs = ticket.filter((_, i) => legResults[i].status !== 'VOID');
    const isParlay = activeTicketLegs.length > 1;

    // If all legs voided, odds are effectively 1.0 (push)
    const combinedOddsStr = activeTicketLegs.length > 0 ? (isParlay ? calculateParlayOdds(activeTicketLegs) : (activeTicketLegs[0]?.odds || 'N/A')) : '+100';

    const sumStakes = ticket.reduce((acc, b) => acc + (b.stake || 0), 0);
    const riskAmount = isParlay ? (sumStakes > 0 ? sumStakes : 50) : (sumStakes || 10);

    // If ticket is entirely VOID, payout is exact risk amount (refund). Otherwise do math.
    const payoutAmount = ticketStatus === 'VOID' || activeTicketLegs.length === 0 ? riskAmount : riskAmount + toWin(riskAmount, combinedOddsStr);

    return (
        <div
            className="w-full shrink-0 bg-[#0c0c0e] border border-neutral-700 rounded-none shadow-2xl font-sans mb-2 flex flex-col transition-all duration-300 relative overflow-hidden mt-3 group"
        >

            {/* Share Overlay */}
            <div className={`absolute inset-0 bg-black/95 z-30 flex flex-col items-center justify-center transition-opacity duration-300 backdrop-blur-md ${isShareVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Close Button Highly Visible */}
                <button
                    onClick={() => setIsShareVisible(false)}
                    className="absolute top-3 right-3 w-8 h-8 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:border-red-500 hover:text-white transition-all shadow-lg hover:scale-110 z-40"
                    title="Close Share"
                >
                    <span className="material-symbols-outlined text-lg font-black">close</span>
                </button>
                <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">Share Ticket</h4>
                <div className="flex gap-4">
                    {/* Official Social Buttons Theme */}
                    <button title="Share on Instagram" className="w-10 h-10 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/50 flex items-center justify-center text-[#E1306C] hover:bg-[#E1306C] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(225,48,108,0.3)]">
                        <IconBrandInstagram size={20} stroke={2} />
                    </button>
                    <button title="Share on Facebook" className="w-10 h-10 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/50 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(24,119,242,0.3)]">
                        <IconBrandFacebook size={20} stroke={2} />
                    </button>
                    <button title="Share on Discord" className="w-10 h-10 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/50 flex items-center justify-center text-[#5865F2] hover:bg-[#5865F2] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(88,101,242,0.3)]">
                        <IconBrandDiscord size={20} stroke={2} />
                    </button>
                    <button title="Share on Telegram" className="w-10 h-10 rounded-full bg-[#229ED9]/10 border border-[#229ED9]/50 flex items-center justify-center text-[#229ED9] hover:bg-[#229ED9] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(34,158,217,0.3)]">
                        <IconBrandTelegram size={20} stroke={2} />
                    </button>
                    <button title="Share on WhatsApp" className="w-10 h-10 rounded-full bg-[#25D366]/10 border border-[#25D366]/50 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]">
                        <IconBrandWhatsapp size={20} stroke={2} />
                    </button>
                </div>
            </div>

            {/* Corner Status Badge — Only display if the ticket is strictly WON or strictly LOST */}
            {ticketStatus !== 'PENDING' && (
                <div className="absolute top-0 right-0 z-20 flex pointer-events-none shadow-xl">
                    <div
                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center ${ticketStatus === 'WON' ? 'bg-[#A3FF00] text-black' : 'bg-red-500 text-white'}`}
                    >
                        {ticketStatus}
                    </div>
                </div>
            )}
            {/* Top Right Actions (Hover visible) */}
            <div className="absolute top-8 right-2 flex items-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Share Trigger Button */}
                <button
                    onClick={() => setIsShareVisible(true)}
                    className="p-1.5 bg-black/60 hover:bg-neutral-800 text-slate-300 hover:text-white rounded-full transition-colors border border-transparent hover:border-neutral-600 shadow-md backdrop-blur"
                    title="Share Ticket"
                >
                    <span className="material-symbols-outlined text-[16px]">share</span>
                </button>
                {/* Remove Button */}
                {onRemove && (
                    <button
                        onClick={onRemove}
                        className="p-1.5 bg-black/60 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-full transition-colors border border-transparent hover:border-red-500/50 shadow-md backdrop-blur"
                        title="Remove Ticket"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                )}
            </div>


            {/* PickLabs Logo Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black border-b border-neutral-800 relative z-0">
                <div className="flex items-center gap-1">
                    <span className="text-[#A3FF00] font-black tracking-tighter italic text-xl leading-none">PICKLABS</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    {hasSGP && (
                        <span className="text-[8px] font-black bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded tracking-widest uppercase">
                            SGP
                        </span>
                    )}
                    <div className="text-[10px] font-black text-white tracking-widest uppercase">
                        SPORTSBOOK
                    </div>
                </div>
            </div>

            {/* Header (Pick Hitting / Bullish-Bearish) - restricted to premium/admin */}
            {isPremiumUser && (
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
            )}

            {/* Pick List */}
            <div className="flex-1 overflow-y-auto max-h-[250px] custom-scrollbar flex flex-col pb-2">
                {ticket.map((bet, i) => {
                    const leg = legResults[i];
                    const pickProgress = leg.progress;
                    const logoUrl = getLogoForPick(bet);

                    // Extract the numerical target from either bet.type or bet.team
                    const targetStringMatch = (bet.team + " " + bet.type).match(/[0-9.]+/);
                    const targetNum = targetStringMatch ? parseFloat(targetStringMatch[0]) : null;

                    let currentNum = 0;
                    if (targetNum !== null) {
                        if (leg.isUpcoming) {
                            currentNum = 0;
                        } else {
                            currentNum = leg.status === 'WON' ? targetNum : parseFloat(((targetNum * pickProgress) / 100).toFixed(1));
                            if (currentNum > targetNum) currentNum = targetNum;
                        }
                    }

                    // Helper to abbreviate team names (e.g. Houston Rockets -> HOU)
                    const abbreviateTeamName = (fullName: string) => {
                        const words = fullName.trim().split(' ');
                        if (words.length === 1) return words[0].substring(0, 3).toUpperCase();

                        // Treat the first part of the name (up to the last word) as the location
                        const location = words.slice(0, -1).join(' ');
                        const locWords = location.split(' ');

                        if (locWords.length > 1) {
                            // Elements like New York -> NYK
                            return (locWords[0][0] + locWords[1][0] + words[words.length - 1][0]).toUpperCase();
                        } else {
                            // Elements like Houston -> HOU
                            return locWords[0].substring(0, 3).toUpperCase();
                        }
                    };

                    const getColor = (prog: number) => {
                        if (prog < 33) return '#ef4444'; // red
                        if (prog < 66) return '#f97316'; // orange
                        return '#A3FF00'; // lime green
                    };
                    const barColor = leg.status === 'WON' ? '#A3FF00' : leg.status === 'LOST' ? '#ef4444' : getColor(pickProgress);

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
                        topText = bet.team;

                        let displayMatchup = bet.matchupStr || '';
                        if (displayMatchup.includes(' vs ')) {
                            const [away, home] = displayMatchup.split(' vs ');
                            displayMatchup = `${abbreviateTeamName(away)} VS ${abbreviateTeamName(home)}`;
                        } else if (displayMatchup.includes(' @ ')) {
                            const [away, home] = displayMatchup.split(' @ ');
                            displayMatchup = `${abbreviateTeamName(away)} @ ${abbreviateTeamName(home)}`;
                        }

                        bottomText = displayMatchup
                            ? `${displayMatchup.toUpperCase()} - ${(bet.type.split(' ')[0] || 'PROP').toUpperCase()}`
                            : `${bet.team.toUpperCase()} - ${(bet.type.split(' ')[0] || 'PROP').toUpperCase()}`;
                    } else if (bet.type.toLowerCase().includes('+')) {
                        topText = bet.team;
                        bottomText = bet.type.toUpperCase();
                    }

                    // Status Logic & Bet Type Icons
                    let statusNode = null;
                    if (leg.status === 'WON') {
                        statusNode = (
                            <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#111111] border border-[#A3FF00] relative z-20">
                                <span className="material-symbols-outlined text-[#A3FF00] text-[10px] font-bold">check</span>
                            </div>
                        );
                    } else if (leg.status === 'LOST') {
                        statusNode = (
                            <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#111111] border border-red-500 relative z-20">
                                <span className="material-symbols-outlined text-red-500 text-[10px] font-bold">close</span>
                            </div>
                        );
                    } else if (leg.status === 'VOID') {
                        statusNode = (
                            <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#111111] border border-neutral-500 relative z-20">
                                <span className="material-symbols-outlined text-neutral-500 text-[10px] font-bold">priority_high</span>
                            </div>
                        );
                    } else if (leg.isLive) {
                        statusNode = (
                            <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-[#111111] border border-[#f97316] relative z-20">
                                <div className="w-1.5 h-1.5 bg-[#f97316] rounded-full animate-pulse"></div>
                            </div>
                        );
                    } else {
                        // Pending/Upcoming State: Show Bet Type Icon
                        const pendingIcon = <span className="text-white text-[10px] font-black">{i + 1}</span>;
                        const bgColor = "bg-slate-700";
                        const borderColor = "border-slate-500";

                        statusNode = (
                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border relative z-20 ${bgColor} ${borderColor} shadow-inner`}>
                                {pendingIcon}
                            </div>
                        );
                    }

                    return (
                        <div key={bet.id} className={`relative flex px-4 pt-4 transition-colors group ${leg.status === 'VOID' ? 'opacity-50 grayscale hover:bg-neutral-900/50' : 'hover:bg-white/[0.02]'}`}>
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
                                <div className="flex items-start justify-between mb-1 gap-2">
                                    <div className="flex items-start gap-2 min-w-0 flex-1 pt-0.5">
                                        {/* Avatar */}
                                        {logoUrl.includes('ui-avatars') ? (
                                            <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-white text-[8px] font-bold">{cleanTeamName.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                        ) : (
                                            <img src={logoUrl} alt={cleanTeamName} className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-800 object-cover shrink-0 mt-0.5" onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanTeamName)}&background=1d1d1d&color=fff&rounded=true&bold=true`; }} />
                                        )}
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm font-bold text-white leading-tight break-words">{topText}</span>
                                            <span className="text-[9px] text-slate-500 font-bold truncate uppercase tracking-widest mt-1">{bottomText}</span>
                                        </div>
                                    </div>
                                    {/* Odds / Status */}
                                    <div className="flex flex-col items-end shrink-0 pl-1">
                                        {leg.status === 'VOID' ? (
                                            <span className="text-sm text-neutral-500 font-black tracking-widest uppercase">VOID</span>
                                        ) : (
                                            <span className="text-sm text-white font-black">{bet.odds}</span>
                                        )}
                                    </div>
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

                                    // Generate 4 quarters
                                    let q1A = 0, q2A = 0, q3A = 0, q4A = 0, totalA = 0;
                                    let q1B = 0, q2B = 0, q3B = 0, q4B = 0, totalB = 0;

                                    if (!leg.isUpcoming) {
                                        q1A = 15 + (leg.betSeed % 12);
                                        q2A = 15 + ((leg.betSeed * 2) % 15);
                                        q3A = 15 + ((leg.betSeed * 3) % 14);
                                        q4A = 15 + ((leg.betSeed * 5) % 18);
                                        totalA = q1A + q2A + q3A + q4A;

                                        q1B = 15 + ((leg.betSeed * 7) % 13);
                                        q2B = 15 + ((leg.betSeed * 11) % 16);
                                        q3B = 15 + ((leg.betSeed * 13) % 12);
                                        q4B = 15 + ((leg.betSeed * 17) % 15);
                                        totalB = q1B + q2B + q3B + q4B;
                                    }

                                    const isTeamSelectedWinning = leg.status === 'WON' || (leg.status === 'PENDING' && leg.progress >= 50);

                                    let finalScoreOpp = totalA;
                                    let finalScoreTeam = totalB;

                                    if (leg.status === 'WON' && finalScoreTeam <= finalScoreOpp) {
                                        finalScoreTeam = finalScoreOpp + 1 + (leg.betSeed % 8);
                                    } else if (leg.status === 'LOST' && finalScoreTeam >= finalScoreOpp) {
                                        finalScoreOpp = finalScoreTeam + 1 + (leg.betSeed % 8);
                                    }

                                    return (
                                        <div className="flex flex-col text-[10px] text-slate-400 font-mono mt-3 w-full pl-8 pr-1">
                                            <div className="flex justify-between items-center py-1">
                                                <span className="truncate pr-2">{opponentName}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span>{leg.isUpcoming ? '-' : q1A}</span><span>{leg.isUpcoming ? '-' : q2A}</span><span>{leg.isUpcoming ? '-' : q3A}</span><span>{leg.isUpcoming ? '-' : q4A}</span><span className="text-white font-bold ml-2">{finalScoreOpp}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-1">
                                                <span className="truncate pr-2">{cleanTeamName}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span>{leg.isUpcoming ? '-' : q1B}</span><span>{leg.isUpcoming ? '-' : q2B}</span><span>{leg.isUpcoming ? '-' : q3B}</span><span>{leg.isUpcoming ? '-' : q4B}</span><span className={`font-bold ml-2 ${isTeamSelectedWinning ? 'text-[#A3FF00]' : 'text-white'}`}>{finalScoreTeam}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Odds / Risk / To Win Box (Moved below picks) */}
            <div className={`px-4 py-3 border-t border-neutral-800 bg-[#111111] flex justify-between items-center text-center shadow-[0_-4px_10px_rgba(0,0,0,0.3)] z-10 shrink-0 ${isPremiumUser ? 'pb-2 border-b border-[#2b2b2b]' : ''}`}>
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

            {/* AI Win Probability Meter (Premium/Admin Only) */}
            {isPremiumUser && (
                <div className="px-4 py-2 bg-gradient-to-r from-[#111111] via-[#1a1a1a] to-[#111111] border-b border-neutral-900 border-x border-x-transparent flex flex-col justify-center gap-1.5 shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-2xl rounded-full" />
                    <div className="flex items-center justify-between z-10">
                        <span className="flex items-center gap-1 text-[9px] font-black tracking-widest text-[#A3FF00] uppercase shadow-sm">
                            <span className="material-symbols-outlined text-[11px]">psychology</span>
                            AI HITTING METER
                        </span>
                        <span className="text-xs font-black text-white bg-black/50 px-1.5 rounded border border-green-500/20">{winProbability}%</span>
                    </div>
                    <div className="w-full h-[3px] bg-neutral-800 rounded-full overflow-hidden relative z-10">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-[#A3FF00] rounded-full shadow-[0_0_8px_rgba(163,255,0,0.4)] transition-all duration-1000 ease-out"
                            style={{ width: `${winProbability}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2.5 bg-[#0a0a0c] border-t border-neutral-900 flex justify-between items-center text-[9px] text-neutral-500 font-mono tracking-widest uppercase shrink-0">
                <span>BET ID: {ticketId}</span>
                <span>{ticketDate.toUpperCase()}</span>
            </div>
        </div >
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
