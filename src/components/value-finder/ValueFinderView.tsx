import React, { useState } from 'react';
import { BetPick } from '../../App';

// Mock Value Bet data
interface ValueBet {
    id: string;
    sport: 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'NCAAB';
    matchup: string;
    play: string;
    bookOdds: string;
    modelOdds: string;
    edge: string;
    confidence: 'High' | 'Medium' | 'Low';
    analysis: string;
}

const mockValueBets: ValueBet[] = [
    {
        id: 'vb-1',
        sport: 'NBA',
        matchup: 'LAL @ GSW',
        play: 'LeBron James Under 25.5 Points',
        bookOdds: '-110 (52.4%)',
        modelOdds: '+140 (41.6%)',
        edge: '+10.8%',
        confidence: 'High',
        analysis: 'Books are overvaluing recent performance against weak defenses. Model projects 32 mins max in a blowout scenario against GSW.'
    },
    {
        id: 'vb-2',
        sport: 'NFL',
        matchup: 'KC @ SF',
        play: 'SF 49ers Moneyline',
        bookOdds: '+115 (46.5%)',
        modelOdds: '-130 (56.5%)',
        edge: '+10.0%',
        confidence: 'High',
        analysis: 'Public money is flowing heavily on KC, shifting the line incorrectly. AI models SF defensive pressure creating 2+ turnovers.'
    },
    {
        id: 'vb-3',
        sport: 'NCAAB',
        matchup: 'UCONN @ MARQ',
        play: 'Marquette +4.5',
        bookOdds: '-110 (52.4%)',
        modelOdds: '+115 (46.5%)',
        edge: '+5.9%',
        confidence: 'Medium',
        analysis: 'Home court advantage metric is being undervalued by 1.5 points. Marquette shoots 8% better at home.'
    },
    {
        id: 'vb-4',
        sport: 'MLB',
        matchup: 'NYY @ BOS',
        play: 'First 5 Innings Under 4.5',
        bookOdds: '-125 (55.6%)',
        modelOdds: '-165 (62.3%)',
        edge: '+6.7%',
        confidence: 'Medium',
        analysis: 'Umpire tendency combined with specific wind patterns in Fenway pushing in from left field strongly suppresses early power.'
    },
    {
        id: 'vb-5',
        sport: 'NBA',
        matchup: 'BOS @ MIA',
        play: 'Jayson Tatum Over 4.5 Assists',
        bookOdds: '+135 (42.5%)',
        modelOdds: '+105 (48.8%)',
        edge: '+6.3%',
        confidence: 'Medium',
        analysis: 'Miami blitzes pick-and-roll at the highest rate in the league. Tatum\'s potential assist rate spikes to 12.4 in these exact scenarios.'
    },
    {
        id: 'vb-6',
        sport: 'NHL',
        matchup: 'EDM @ FLA',
        play: 'Edmonton 60 Min ML',
        bookOdds: '+145 (40.8%)',
        modelOdds: '+110 (47.6%)',
        edge: '+6.8%',
        confidence: 'Medium',
        analysis: 'Florida starting backup goaltender on a back-to-back. Market hasn\'t fully adjusted for the drop-off in GSAx (Goals Saved Above Expected).'
    }
];

interface ValueFinderViewProps {
    betSlip: BetPick[];
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
}

export const ValueFinderView: React.FC<ValueFinderViewProps> = ({ betSlip, onAddBet }) => {
    const [valueBets] = useState<ValueBet[]>(mockValueBets);

    return (
        <div className="w-full flex justify-center bg-background-dark py-8 px-6 min-h-[calc(100vh-200px)]">
            <div className="max-w-[1536px] w-full flex flex-col gap-6 animate-fade-in">

                {/* Header Section */}
                <div className="flex items-center gap-4 border-b border-border-muted pb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#A3FF00]/10 border border-[#A3FF00]/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.15)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#A3FF00]/20 to-transparent"></div>
                        <span className="material-symbols-outlined text-[#A3FF00] text-3xl relative z-10">psychology</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-3xl font-black text-text-main uppercase italic tracking-tight">AI Value Finder</h2>
                            <span className="text-[10px] bg-[#A3FF00]/20 text-[#A3FF00] px-2 py-0.5 rounded border border-[#A3FF00]/40 uppercase font-black tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                <span className="material-symbols-outlined text-[10px]">auto_awesome</span> ENGINE ACTIVE
                            </span>
                        </div>
                        <p className="text-text-muted text-sm font-medium mt-1">High-edge opportunities where our predictive model disagrees with public sportsbooks.</p>
                    </div>
                </div>

                {/* Info Bar */}
                <div className="bg-[#A3FF00]/5 border border-[#A3FF00]/20 rounded-lg p-4 flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#A3FF00]"></div>
                    <span className="material-symbols-outlined text-[#A3FF00]">info</span>
                    <p className="text-sm text-text-muted">
                        <span className="font-bold text-text-main">Powered by PickLabs AI:</span> We simulate every matchup 10,000 times to generate true probabilities. If our implied probability provides a massive edge over the books, our Kelly Criterion logic flags it here.
                    </p>
                </div>

                {/* Value Bets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {valueBets.map(bet => (
                        <div key={bet.id} className="glass-panel p-6 border border-border-muted hover:border-[#A3FF00]/50 transition-colors flex flex-col h-full bg-[#111] group relative overflow-hidden">
                            {/* Subtle Glow */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#A3FF00]/5 rounded-full blur-3xl group-hover:bg-[#A3FF00]/10 transition-colors pointer-events-none"></div>

                            {/* Top Info */}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between w-full min-w-[200px] mb-1">
                                        <span className="text-[10px] font-black text-text-main bg-white/10 px-2 py-0.5 rounded uppercase tracking-widest">{bet.sport}</span>
                                        <span className="text-[10px] font-bold text-[#A3FF00] uppercase tracking-widest bg-[#A3FF00]/10 px-2 py-0.5 rounded border border-[#A3FF00]/20">{bet.matchup}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-text-main mt-2 leading-tight">{bet.play}</h3>
                                </div>

                                {/* Edge Badge */}
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px] text-[#A3FF00]">bolt</span> AI Edge
                                    </span>
                                    <span className="text-xl font-black text-[#A3FF00] bg-[#A3FF00]/10 px-3 py-1 rounded shadow-inner border border-[#A3FF00]/30">{bet.edge}</span>
                                </div>
                            </div>

                            {/* Odds Comparison */}
                            <div className="grid grid-cols-2 gap-4 mb-5 relative z-10">
                                <div className="bg-white dark:bg-neutral-900/40 border border-red-500/20 rounded-lg p-3 flex flex-col">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Sportsbook Line</span>
                                    <span className="text-sm font-black text-text-main">{bet.bookOdds}</span>
                                </div>
                                <div className="bg-[#A3FF00]/10 border border-[#A3FF00]/30 rounded-lg p-3 flex flex-col relative overflow-hidden">
                                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#A3FF00] to-transparent opacity-50"></div>
                                    <span className="text-[10px] text-[#A3FF00] font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">analytics</span> AI True Line
                                    </span>
                                    <span className="text-sm font-black text-[#A3FF00]">{bet.modelOdds}</span>
                                </div>
                            </div>

                            {/* AI Analysis */}
                            <div className="flex-1 mb-6 relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-[14px] text-[#A3FF00]">psychology</span>
                                    <span className="text-[11px] font-black text-[#A3FF00]/80 uppercase tracking-widest">PickLabs Engine Analysis</span>
                                </div>
                                <p className="text-sm text-text-muted italic leading-relaxed border-l-2 border-[#A3FF00]/30 pl-3 group-hover:border-[#A3FF00]/60 transition-colors">"{bet.analysis}"</p>
                            </div>

                            {/* Action Row */}
                            <div className="mt-auto border-t border-border-muted pt-4 flex justify-between items-center relative z-10">
                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm text-[#A3FF00]">verified</span> High-Conviction AI Play
                                </span>
                                {(() => {
                                    const isSelected = betSlip.some(b => b.gameId === `vf-${bet.id}` && b.team === bet.play);
                                    return (
                                        <button
                                            onClick={() => {
                                                if (!isSelected) {
                                                    onAddBet({
                                                        gameId: `vf-${bet.id}`,
                                                        type: 'Prop',
                                                        team: bet.play,
                                                        odds: bet.bookOdds.split(' ')[0],
                                                        matchupStr: bet.matchup,
                                                        stake: 50,
                                                        gameStatus: 'UPCOMING',
                                                        gameDate: new Date().toISOString().split('T')[0]
                                                    });
                                                }
                                            }}
                                            className={`transition-all px-6 py-2 rounded font-black text-xs uppercase tracking-widest flex items-center gap-2 ${isSelected
                                                    ? 'bg-[#A3FF00] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)] border border-[#A3FF00]'
                                                    : 'bg-[#A3FF00]/20 text-[#A3FF00] border border-[#A3FF00]/50 hover:bg-[#A3FF00] hover:text-black hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                                                }`}
                                        >
                                            {isSelected ? (
                                                <>Added to Slip <span className="material-symbols-outlined text-sm">check_circle</span></>
                                            ) : (
                                                <>Add to Slip <span className="material-symbols-outlined text-sm">add_circle</span></>
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>

                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};
