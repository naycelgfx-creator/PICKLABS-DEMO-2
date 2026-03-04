import React, { useState } from 'react';
import { useLiveBets } from '../../contexts/LiveBetsContext';
import { BetPick } from '../../App';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPlayers } from '../../data/playerDB';

interface LiveBetsMeterProps {
    betSlip: BetPick[];
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
    const isPlayerProp = bet.type.includes('Over') || bet.type.includes('Under') || bet.team.includes(' ');
    if (isPlayerProp) {
        // Query the loaded player DB to find a real ESPN headshot match
        const results = searchPlayers(bet.team);
        if (results.length > 0 && results[0].headshot) {
            return results[0].headshot;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(bet.team)}&background=1d1d1d&color=fff&rounded=true&bold=true`;
    }
    const match = bet.gameId.match(/([a-z]+)_[0-9]+/);
    const sport = match ? match[1] : 'nba';
    const abbr = bet.team.toLowerCase();

    // ESPN Team Logo pattern
    return `https://a.espncdn.com/i/teamlogos/${sport}/500/${abbr}.png`;
}

export const LiveBetsMeter: React.FC<LiveBetsMeterProps> = ({ betSlip }) => {
    const { isLiveBetsActive } = useLiveBets();
    const [isMinimized, setIsMinimized] = useState(false);

    if (!isLiveBetsActive || betSlip.length === 0) return null;

    const totalLegs = betSlip.length;
    // For demo purposes, pretend 1/3 of the bets are hitting, 1/3 pending.
    const winningLegs = Math.max(0, Math.floor(totalLegs / 2));
    const isWinning = winningLegs > 0;
    const hitPercent = Math.round((winningLegs / totalLegs) * 100);

    const isParlay = totalLegs > 1;
    const combinedOddsStr = isParlay ? calculateParlayOdds(betSlip) : (betSlip[0]?.odds || 'N/A');
    const sumStakes = betSlip.reduce((acc, b) => acc + (b.stake || 0), 0);
    const riskAmount = isParlay ? (sumStakes > 0 ? sumStakes : 50) : (sumStakes || 10);
    const payoutAmount = riskAmount + toWin(riskAmount, combinedOddsStr);

    return (
        <div className="fixed bottom-6 xl:bottom-10 right-6 xl:right-10 z-[100] flex flex-col items-end pointer-events-none">

            <AnimatePresence>
                {!isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="w-80 bg-neutral-900 border border-border-muted rounded-xl shadow-2xl overflow-hidden mb-3 pointer-events-auto backdrop-blur-md"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/5 bg-black/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full animate-pulse ${isWinning ? 'bg-[#A3FF00] shadow-[0_0_8px_rgba(163,255,0,0.6)]' : 'bg-amber-500'}`} />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                                    {isParlay ? 'Live Parlay' : 'Live Single'}
                                </span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{totalLegs} Picks</span>
                        </div>

                        {/* Meter Visual */}
                        <div className="p-4 bg-gradient-to-b from-black/20 to-transparent border-b border-white/5">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs font-bold text-slate-300">Picks Hitting</span>
                                <span className={`text-lg font-black ${isWinning ? 'text-[#A3FF00]' : 'text-amber-500'}`}>
                                    {hitPercent}%
                                </span>
                            </div>
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative mb-3">
                                <motion.div
                                    className={`absolute top-0 bottom-0 left-0 rounded-full ${isWinning ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-[#A3FF00]' : 'bg-amber-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${hitPercent}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                            </div>

                            <div className="flex justify-between items-center bg-black/30 rounded-lg p-2.5 border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Odds</span>
                                    <span className="text-sm font-black text-white">{combinedOddsStr}</span>
                                </div>
                                <div className="flex flex-col text-center">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Risk</span>
                                    <span className="text-sm font-black text-white">${riskAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">To Win</span>
                                    <span className="text-sm font-black text-[#A3FF00]">${payoutAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* List of Legs Tracker */}
                        <div className="max-h-64 overflow-y-auto custom-scrollbar bg-black/10">
                            {betSlip.map((bet, i) => {
                                const isHitting = i < winningLegs;
                                // Mock progress percentage for individual picks
                                const pickProgress = isHitting ? 100 : 30 + (i * 25) % 65;

                                return (
                                    <div key={bet.id} className="px-4 py-3 border-b border-white/5 last:border-none flex flex-col">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3 pr-3 min-w-0">
                                                {/* Avatar/Logo */}
                                                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                                                    <img
                                                        src={getLogoForPick(bet)}
                                                        onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=TEAM&background=1d1d1d&color=fff&rounded=true'; }}
                                                        className="w-full h-full object-contain p-0.5"
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[10px] font-black text-white truncate">{bet.team} {bet.type}</span>
                                                    <span className="text-[9px] text-slate-400 truncate">{bet.matchupStr}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {isHitting ? (
                                                    <span className="material-symbols-outlined text-[16px] text-[#A3FF00] drop-shadow-[0_0_5px_rgba(163,255,0,0.5)]">check_circle</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-[16px] text-amber-500">pending</span>
                                                )}
                                                <span className="text-[8.5px] font-mono font-bold text-slate-500 mt-0.5">{bet.odds}</span>
                                            </div>
                                        </div>
                                        {/* Individual Pick Progress Meter */}
                                        <div className="w-full pl-11 pr-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Progress</span>
                                                <span className={`text-[8px] font-black ${isHitting ? 'text-[#A3FF00]' : 'text-orange-500'}`}>{pickProgress}%</span>
                                            </div>
                                            <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                                                <motion.div
                                                    className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-[#A3FF00]"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pickProgress}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsMinimized(prev => !prev)}
                className="pointer-events-auto h-12 w-12 rounded-full bg-neutral-900 border border-primary/40 shadow-[0_0_20px_rgba(163,255,0,0.15)] flex items-center justify-center text-[#A3FF00] hover:bg-neutral-800 hover:scale-105 transition-all outline-none"
            >
                <span className="material-symbols-outlined text-lg">
                    {isMinimized ? 'monitoring' : 'keyboard_arrow_down'}
                </span>
                {isMinimized && (
                    <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-[#A3FF00] rounded-full border-2 border-neutral-900 flex items-center justify-center text-[8px] font-black text-neutral-900">
                        {totalLegs}
                    </span>
                )}
            </button>
        </div>
    );
};
