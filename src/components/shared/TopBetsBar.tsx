import React, { useState } from 'react';
import { BetPick } from '../../App';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPlayers } from '../../data/playerDB';

interface TopBetsBarProps {
    betSlip: BetPick[];
    setBetSlip: React.Dispatch<React.SetStateAction<BetPick[]>>;
}

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
};

export const TopBetsBar: React.FC<TopBetsBarProps> = ({ betSlip, setBetSlip }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (betSlip.length === 0) return null;

    const removeBet = (id: string) => {
        setBetSlip(prev => prev.filter(bet => bet.id !== id));
    };

    return (
        <div className="w-full mb-4 flex flex-col items-center">
            {/* Toggle Button */}
            <div className="w-full flex justify-end px-4 mb-2">
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-neutral-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">
                        {isVisible ? 'visibility_off' : 'visibility'}
                    </span>
                    {isVisible ? 'Hide My Picks' : 'Show My Picks'}
                    <span className="bg-primary text-black px-1.5 rounded-full ml-1">
                        {betSlip.length}
                    </span>
                </button>
            </div>

            {/* Bets List */}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full overflow-hidden"
                    >
                        <div className="flex gap-3 overflow-x-auto pb-4 px-4 custom-scrollbar">
                            {betSlip.map(bet => (
                                <motion.div
                                    key={bet.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex-shrink-0 flex items-center gap-3 bg-neutral-900 border border-border-muted rounded-xl p-2.5 min-w-[200px] max-w-[280px]"
                                >
                                    {/* Logo */}
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                                        <img
                                            src={getLogoForPick(bet)}
                                            onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=TEAM&background=1d1d1d&color=fff&rounded=true'; }}
                                            className="w-full h-full object-contain p-0.5"
                                            alt=""
                                        />
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[11px] font-black text-white truncate">{bet.team}</span>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-primary font-mono">{bet.odds}</span>
                                            <span className="text-[9px] text-slate-500 font-bold px-1.5 bg-neutral-800 rounded">{bet.type}</span>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeBet(bet.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors ml-1"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
