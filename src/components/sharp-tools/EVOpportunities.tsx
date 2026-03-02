import React, { useState, useEffect, useCallback } from 'react';
import { Game } from '../../data/mockGames';

interface EVOpportunitiesProps {
    game?: Game | null;
}

export const EVOpportunities: React.FC<EVOpportunitiesProps> = ({ game }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [opportunities, setOpportunities] = useState<{ player: string; prop: string; market: string; ev: number; trueProb: number }[]>([]);

    // Generate 2 random EV picks based on the active game
    const generateOpps = useCallback(() => {
        let pool = [];

        if (game) {
            // Build dynamic pool from game details
            const props = ['Over Points', 'Under Assists', 'Over Rebounds', 'Over Threes', 'Under Total Stats', 'Over Goals', 'Under Shots', 'Over Yards'];
            const names = [game.awayTeam.name, game.homeTeam.name];

            for (let i = 0; i < 4; i++) {
                const teamName = names[Math.floor(Math.random() * names.length)];
                const propStr = props[Math.floor(Math.random() * props.length)];
                pool.push({
                    player: `${teamName.split(' ')[0]} Player ${i + 1}`,
                    prop: `${propStr.split(' ')[0]} ${Math.floor(Math.random() * 20)}.5 ${propStr.split(' ')[1]}`,
                    market: Math.random() > 0.5 ? `-${Math.floor(Math.random() * 50) + 110}` : `+${Math.floor(Math.random() * 50) + 105}`
                });
            }
        } else {
            // Fallback generic pool
            pool = [
                { player: 'Generic Player', prop: 'Over 12.5 Stats', market: '-110' },
                { player: 'Test Athlete', prop: 'Under 28.5 Points', market: '+105' },
                { player: 'Sample Guard', prop: 'Over 7.5 Assists', market: '+120' },
            ];
        }

        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2).map(opp => ({
            ...opp,
            ev: Number((Math.random() * 15 + 5).toFixed(1)), // random EV between 5% and 20%
            trueProb: Number((Math.random() * 20 + 50).toFixed(1)) // probability between 50% and 70%
        }));
    }, [game]);

    useEffect(() => {
        setIsScanning(true);
        const t = setTimeout(() => {
            setOpportunities(generateOpps());
            setIsScanning(false);
        }, 1500);
        return () => clearTimeout(t);
    }, [game, generateOpps]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setOpportunities(generateOpps());
            setIsRefreshing(false);
        }, 1500);
    };

    return (
        <div className="col-span-12 lg:col-span-4 terminal-panel border-accent-purple/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-shadow overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-muted bg-white dark:bg-neutral-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-accent-purple">calculate</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">EV+ Opportunities</h3>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-accent-purple/10 text-accent-purple border border-accent-purple/30 rounded font-black uppercase">Calculated</span>
            </div>

            <div className="p-4 space-y-4 flex-1 relative">
                {isScanning && (
                    <div className="absolute inset-0 bg-neutral-900/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-b-lg">
                        <span className="material-symbols-outlined text-4xl text-accent-purple animate-spin mb-2">calculate</span>
                        <p className="text-xs font-black text-accent-purple uppercase tracking-widest animate-pulse">Running Monte Carlo...</p>
                    </div>
                )}
                {opportunities.map((opp, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg p-4 transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{opp.player}</p>
                                <h4 className="text-sm font-bold text-text-main">{opp.prop}</h4>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-accent-purple">+{opp.ev.toFixed(1)}% EV</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[9px] text-slate-500 uppercase font-bold">Market Odds</p>
                                <p className="text-xs font-bold text-text-main">{opp.market}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] text-slate-500 uppercase font-bold">True Prob</p>
                                <p className="text-xs font-bold text-primary">{opp.trueProb.toFixed(1)}%</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full py-4 text-[#A855F7] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-accent-purple/5 transition-colors bg-black/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isRefreshing ? (
                    <>
                        <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                        Refreshing...
                    </>
                ) : (
                    <>
                        Refresh AI Probabilities
                    </>
                )}
            </button>
        </div>
    );
};
