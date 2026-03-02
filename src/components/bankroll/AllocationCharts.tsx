import React, { useMemo } from 'react';
import { ResolvedTicket } from '../../App';

export interface AllocationChartsProps {
    ticketHistory: ResolvedTicket[];
}

export const AllocationCharts: React.FC<AllocationChartsProps> = ({ ticketHistory }) => {

    const { sportAllocations, betTypeAllocations, totalVolume } = useMemo(() => {
        let nbaCount = 0;
        let nflCount = 0;
        let nhlCount = 0;
        let propCount = 0;
        let spreadMlCount = 0;
        let otherCount = 0;

        let totalBets = 0;

        ticketHistory.forEach(ticket => {
            ticket.picks.forEach(pick => {
                totalBets++;

                // Bet Type Bucket
                if (pick.type === 'Prop') propCount++;
                else if (pick.type === 'Spread' || pick.type === 'ML') spreadMlCount++;
                else otherCount++;

                // Sport Bucket (simple keyword search)
                const teamStr = pick.matchupStr.toLowerCase() + ' ' + pick.team.toLowerCase();
                const nbaKeywords = ['lakers', 'celtics', 'warriors', 'suns', 'knicks', '76ers', 'nuggets', 'heat', 'bulls', 'mavericks', 'timberwolves'];
                const nflKeywords = ['chiefs', '49ers', 'eagles', 'cowboys', 'ravens', 'bills', 'lions', 'packers', 'texans'];
                const nhlKeywords = ['rangers', 'bruins', 'maple leafs', 'avalanche', 'knights', 'panthers', 'oilers', 'canucks'];

                if (nbaKeywords.some(k => teamStr.includes(k))) nbaCount++;
                else if (nflKeywords.some(k => teamStr.includes(k))) nflCount++;
                else if (nhlKeywords.some(k => teamStr.includes(k))) nhlCount++;
                else nbaCount++; // Default to NBA if unknown
            });
        });

        // Avoid divide by zero
        const safeTotal = totalBets === 0 ? 1 : totalBets;

        return {
            totalVolume: totalBets,
            sportAllocations: {
                nba: (nbaCount / safeTotal) * 100,
                nfl: (nflCount / safeTotal) * 100,
                nhl: (nhlCount / safeTotal) * 100,
            },
            betTypeAllocations: {
                prop: (propCount / safeTotal) * 100,
                spreadMl: (spreadMlCount / safeTotal) * 100,
                other: (otherCount / safeTotal) * 100,
            }
        };

    }, [ticketHistory]);


    // SVG Math Helpers
    // Calculate stroke-dasharray based on percentage: `[dash, gap]`. Full circle is 100.
    const nbaDash = sportAllocations.nba;
    const nflDash = sportAllocations.nfl;
    const nhlDash = sportAllocations.nhl;

    // Offsets to chain them
    const nbaOffset = 25; // start near top
    const nflOffset = 25 - nbaDash;
    const nhlOffset = nflOffset - nflDash;

    const propDash = betTypeAllocations.prop;
    const spreadMlDash = betTypeAllocations.spreadMl;
    const otherDash = betTypeAllocations.other;

    const propOffset = 25;
    const spreadMlOffset = 25 - propDash;
    const otherOffset = spreadMlOffset - spreadMlDash;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="terminal-panel p-6 border-accent-purple/20 hover:border-accent-purple/50 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-accent-purple">pie_chart</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">Allocation by Sport</h3>
                </div>
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                    <div className="relative w-36 h-36 xl:w-40 xl:h-40 shrink-0 group">
                        <svg className="w-full h-full transform -rotate-90 group-hover:scale-105 transition-transform" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" fill="none" r="16" stroke="#1e2e1e" strokeWidth="3"></circle>
                            {totalVolume > 0 && (
                                <>
                                    <circle cx="18" cy="18" fill="none" r="16" stroke="#0df20d" strokeDasharray={`${nbaDash}, 100`} strokeDashoffset={nbaOffset} strokeWidth="3" pathLength="100" className="hover:opacity-80 transition-opacity cursor-pointer"></circle>
                                    <circle cx="18" cy="18" fill="none" r="16" stroke="#a855f7" strokeDasharray={`${nflDash}, 100`} strokeDashoffset={nflOffset} strokeWidth="3" pathLength="100" className="hover:opacity-80 transition-opacity cursor-pointer"></circle>
                                    <circle cx="18" cy="18" fill="none" r="16" stroke="#3b82f6" strokeDasharray={`${nhlDash}, 100`} strokeDashoffset={nhlOffset} strokeWidth="3" pathLength="100" className="hover:opacity-80 transition-opacity cursor-pointer"></circle>
                                </>
                            )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-500 font-bold uppercase transition-colors group-hover:text-accent-purple">Total</span>
                            <span className="text-xl font-black text-text-main group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">{totalVolume > 0 ? '100%' : '0%'}</span>
                        </div>
                    </div>
                    <div className="space-y-4 w-full">
                        <div className="flex items-center gap-3 group cursor-pointer hover:bg-neutral-800/50 p-2 rounded -ml-2 transition-colors">
                            <div className="w-3 h-3 shrink-0 rounded-full bg-primary shadow-[0_0_5px_#0df20d] group-hover:scale-125 transition-transform"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-main uppercase tracking-wider">NBA Basketball</p>
                                <p className="text-[9px] text-slate-500 font-bold">{sportAllocations.nba.toFixed(1)}% Allocation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer hover:bg-neutral-800/50 p-2 rounded -ml-2 transition-colors">
                            <div className="w-3 h-3 shrink-0 rounded-full bg-accent-purple shadow-[0_0_5px_#a855f7] group-hover:scale-125 transition-transform"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-main uppercase tracking-wider">NFL Football</p>
                                <p className="text-[9px] text-slate-500 font-bold">{sportAllocations.nfl.toFixed(1)}% Allocation</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer hover:bg-neutral-800/50 p-2 rounded -ml-2 transition-colors">
                            <div className="w-3 h-3 shrink-0 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6] group-hover:scale-125 transition-transform"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-main uppercase tracking-wider">NHL Hockey</p>
                                <p className="text-[9px] text-slate-500 font-bold">{sportAllocations.nhl.toFixed(1)}% Allocation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="terminal-panel p-6 border-primary/20 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-primary">donut_large</span>
                    <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">Allocation by Bet Type</h3>
                </div>
                <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                    <div className="relative w-36 h-36 xl:w-40 xl:h-40 shrink-0 group">
                        <svg className="w-full h-full transform -rotate-90 group-hover:scale-105 transition-transform" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" fill="none" r="16" stroke="#1e2e1e" strokeWidth="3"></circle>
                            {totalVolume > 0 && (
                                <>
                                    <circle cx="18" cy="18" fill="none" r="16" stroke="#0df20d" strokeDasharray={`${propDash}, 100`} strokeDashoffset={propOffset} strokeWidth="3" pathLength="100" className="hover:opacity-80 transition-opacity cursor-pointer"></circle>
                                    <circle cx="18" cy="18" fill="none" r="16" stroke="#fbbf24" strokeDasharray={`${spreadMlDash}, 100`} strokeDashoffset={spreadMlOffset} strokeWidth="3" pathLength="100" className="hover:opacity-80 transition-opacity cursor-pointer"></circle>
                                    <circle cx="18" cy="18" fill="none" r="16" stroke="#475569" strokeDasharray={`${otherDash}, 100`} strokeDashoffset={otherOffset} strokeWidth="3" pathLength="100" className="hover:opacity-80 transition-opacity cursor-pointer"></circle>
                                </>
                            )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs text-slate-500 font-bold uppercase transition-colors group-hover:text-primary">Volume</span>
                            <span className="text-xl font-black text-text-main group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all">{totalVolume}</span>
                        </div>
                    </div>
                    <div className="space-y-4 w-full">
                        <div className="flex items-center gap-3 group cursor-pointer hover:bg-neutral-800/50 p-2 rounded -ml-2 transition-colors">
                            <div className="w-3 h-3 shrink-0 rounded-full bg-primary shadow-[0_0_5px_#0df20d] group-hover:scale-125 transition-transform"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-main uppercase tracking-wider">Player Props</p>
                                <p className="text-[9px] text-slate-500 font-bold">{betTypeAllocations.prop.toFixed(1)}% of bets</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer hover:bg-neutral-800/50 p-2 rounded -ml-2 transition-colors">
                            <div className="w-3 h-3 shrink-0 rounded-full bg-amber-400 shadow-[0_0_5px_#fbbf24] group-hover:scale-125 transition-transform"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-main uppercase tracking-wider">Spreads/ML</p>
                                <p className="text-[9px] text-slate-500 font-bold">{betTypeAllocations.spreadMl.toFixed(1)}% of bets</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 group cursor-pointer hover:bg-neutral-800/50 p-2 rounded -ml-2 transition-colors">
                            <div className="w-3 h-3 shrink-0 rounded-full bg-slate-600 shadow-[0_0_5px_#475569] group-hover:scale-125 transition-transform"></div>
                            <div>
                                <p className="text-[10px] font-black text-text-main uppercase tracking-wider">Others/Alt</p>
                                <p className="text-[9px] text-slate-500 font-bold">{betTypeAllocations.other.toFixed(1)}% of bets</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
