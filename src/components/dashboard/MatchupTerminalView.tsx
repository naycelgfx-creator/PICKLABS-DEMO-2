import React, { useState } from 'react';
import { Game } from '../../data/mockGames';
import { TeamMatchupCard } from './TeamMatchupCard';
import { WeatherImpact } from './WeatherImpact';
import { HeadCoachMatchup } from './HeadCoachMatchup';
import { MatchupScouting } from './MatchupScouting';
import { BasketballCourt } from './BasketballCourt';
import { SoccerField } from './SoccerField';
import { NFLField } from './NFLField';
import { BaseballField } from './BaseballField';
import { HockeyRink } from './HockeyRink';

import { SimulationResults } from './SimulationResults';
import { OffenseVsDefense } from './OffenseVsDefense';
import { MarketFlow } from './MarketFlow';
import { TeamRankings } from './TeamRankings';
import { MatchupRecords } from './MatchupRecords';
import { NBAMatchupDashboard } from './nba/NBAMatchupDashboard';
import { AITopBets } from './AITopBets';
import { HotInsightsPanel } from './HotInsightsPanel';
import { BetSlip } from '../live-board/BetSlip';
import { BetPick } from '../../App';

interface MatchupTerminalViewProps {
    game: Game;
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
    hasSimulated: boolean;
    onRunSimulation: () => void;
    betSlip: BetPick[];
    setBetSlip: React.Dispatch<React.SetStateAction<BetPick[]>>;
}

export const MatchupTerminalView: React.FC<MatchupTerminalViewProps> = ({
    game,
    onAddBet,
    hasSimulated,
    onRunSimulation,
    betSlip,
    setBetSlip
}) => {
    const [showBetSlip, setShowBetSlip] = useState<boolean>(true);
    return (
        <main className="max-w-[1536px] mx-auto p-4 md:p-6 grid grid-cols-12 gap-4 md:gap-6 relative">
            <div className={`${showBetSlip ? 'col-span-12 xl:col-span-9' : 'col-span-12'} space-y-6 transition-all duration-300`}>
                <div className="flex flex-col items-center justify-center py-4 gap-4">
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <a
                            className="group relative inline-flex items-center gap-3 px-12 py-5 bg-accent-purple rounded-full text-text-main font-black uppercase tracking-[0.2em] italic hover:scale-105 transition-transform animate-neon-pulse overflow-hidden cursor-pointer"
                            onClick={onRunSimulation}
                        >
                            <span className="material-symbols-outlined text-2xl group-hover:rotate-180 transition-transform duration-500">model_training</span>
                            {hasSimulated ? 'Re-run AI Simulations' : 'Run 10,000 AI Simulations'}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
                        </a>
                        <button className="hidden md:flex px-8 py-5 border-2 border-primary/40 bg-primary/5 rounded-full text-primary font-black uppercase tracking-[0.2em] italic hover:bg-primary/10 transition-all items-center gap-3">
                            <span className="material-symbols-outlined">query_stats</span>
                            Show Handle Gaps
                        </button>
                        {/* Bet Slip toggle button */}
                        <button
                            onClick={() => setShowBetSlip(p => !p)}
                            className={`hidden md:flex px-8 py-5 border-2 rounded-full font-black uppercase tracking-[0.2em] italic transition-all items-center gap-3 ${showBetSlip
                                ? 'border-accent-purple/60 bg-accent-purple/10 text-accent-purple'
                                : 'border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 text-slate-500 dark:text-slate-400 hover:text-text-main hover:border-neutral-500'
                                }`}
                        >
                            <span className="material-symbols-outlined">receipt_long</span>
                            Bet Slip
                            {betSlip.length > 0 && (
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-accent-purple text-white text-[10px] font-black">
                                    {betSlip.length}
                                </span>
                            )}
                        </button>
                    </div>
                    <p className="mt-2 text-[10px] text-accent-purple/60 font-bold uppercase tracking-widest">Quantum Predictive Engine v4.2.1-10k</p>
                </div>

                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-3 rounded-lg mb-6">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">verified</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary hidden sm:inline">Filtering for Significant Handle Gaps (&gt;10% Diff)</span>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary sm:hidden">Handle Gaps (&gt;10%)</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-[10px] text-slate-500 uppercase font-bold">Games Found: <span className="text-accent-purple dark:text-white font-black">1</span></div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold hidden sm:block">Total Volume: <span className="text-accent-purple dark:text-white font-black">$4.2M</span></div>
                    </div>
                </div>

                <TeamMatchupCard game={game} />

                <HotInsightsPanel game={game} />

                <WeatherImpact game={game} />

                <HeadCoachMatchup game={game} />

                <MatchupScouting game={game} />

                {/* Sport-specific field / court / pitch */}
                {(() => {
                    const s = game.sport as string;
                    if (s === 'NBA' || s === 'NCAAB' || s === 'CBB' || s === 'WNBA') return <BasketballCourt game={game} />;
                    if (s.startsWith('Soccer')) return <SoccerField game={game} />;
                    if (s === 'NFL' || s === 'CFB') return <NFLField game={game} />;
                    if (s === 'MLB') return <BaseballField game={game} />;
                    if (s === 'NHL') return <HockeyRink game={game} />;
                    return null;
                })()}

                {game.sport === 'NBA' && (
                    <div className="mt-8 border-t-2 border-primary/30 pt-8" id="nba-context-dashboard">
                        <NBAMatchupDashboard game={game} onAddBet={onAddBet} />
                    </div>
                )}

                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12">
                        <SimulationResults game={game} />
                        {hasSimulated && <AITopBets game={game} onAddBet={onAddBet} />}
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 items-stretch">
                    <div className="col-span-12 lg:col-span-7">
                        <TeamRankings game={game} />
                    </div>
                    <div className="col-span-12 lg:col-span-5">
                        <MatchupRecords game={game} />
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 items-stretch pt-6 border-t border-neutral-800/50 mt-6">
                    <div className="col-span-12 lg:col-span-8">
                        <OffenseVsDefense game={game} />
                    </div>
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                        <MarketFlow game={game} />
                    </div>
                </div>



            </div>
            {showBetSlip && <BetSlip betSlip={betSlip} setBetSlip={setBetSlip} />}
        </main>
    );
};
