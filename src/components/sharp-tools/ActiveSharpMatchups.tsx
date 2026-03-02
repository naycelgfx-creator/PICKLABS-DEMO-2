import React, { useState, useEffect } from 'react';
import { Game, mockGamesBySport } from '../../data/mockGames';
import { generateAIPrediction } from '../../data/espnTeams';

interface ActiveSharpMatchupsProps {
    game?: Game | null;
    onGameSelect?: (game: Game) => void;
}

export const ActiveSharpMatchups: React.FC<ActiveSharpMatchupsProps> = ({ game, onGameSelect }) => {
    const [localGame, setLocalGame] = useState<Game | null>(game || mockGamesBySport['NBA']![0] || null);

    useEffect(() => {
        if (game) setLocalGame(game);
    }, [game]);

    const handleSelect = (g: Game) => {
        setLocalGame(g);
        if (onGameSelect) onGameSelect(g);
    };

    const activeGame = localGame;
    if (!activeGame) return null;

    const aiPred = generateAIPrediction(activeGame.homeTeam.record || '0-0', activeGame.awayTeam.record || '0-0', 'NBA', [], []);

    return (
        <div className="col-span-12 lg:col-span-8">
            <div className="terminal-panel p-1 relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                <div className="p-3 border-b border-border-muted bg-white dark:bg-neutral-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-sm">stadium</span>
                        <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Active Sharp Matchups</h3>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-[9px] text-primary font-black uppercase">Live Updates</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-around p-4">
                    <div className="flex items-center justify-between bg-white dark:bg-neutral-900/40 rounded-xl p-4 border border-border-muted">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center border border-border-muted group hover:border-accent-purple transition-all">
                                    <img src={activeGame.awayTeam.logo || "https://a.espncdn.com/i/teamlogos/nba/500/bos.png"} alt="Away Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-text-main leading-tight uppercase">{activeGame.awayTeam.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Away Team</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center px-8 border-x border-border-muted">
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Smart Money</span>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-2xl font-black">arrow_forward</span>
                                    <span className="text-xl font-black text-text-main italic">+14% Shift</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div>
                                    <h4 className="text-lg font-black text-text-main leading-tight text-right uppercase">{activeGame.homeTeam.name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase text-right">Home Team</p>
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center border border-border-muted group hover:border-primary transition-all">
                                    <img src={activeGame.homeTeam.logo || "https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/lal.png"} alt="Home Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                        </div>

                        {aiPred && (
                            <div className="flex flex-col items-center px-6 py-2 border border-green-500/30 bg-green-500/10 rounded-lg mx-4">
                                <span className="text-[9px] text-green-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[10px]">psychology</span> AI Projection
                                </span>
                                <div className="text-sm font-black text-text-main text-center">
                                    {aiPred.homeWinProb > aiPred.awayWinProb ? activeGame.homeTeam.name : activeGame.awayTeam.name} {Math.max(Number(aiPred.homeWinProb), Number(aiPred.awayWinProb)).toFixed(1)}%
                                </div>
                            </div>
                        )}

                        <div className="hidden xl:flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[9px] text-slate-500 font-black uppercase">Vegas Consensus</p>
                                <p className="text-sm font-black text-accent-purple italic">-4.5</p>
                            </div>
                            <button className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/40 rounded text-[10px] font-black text-primary uppercase tracking-widest transition-all">
                                View Data
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 overflow-x-auto custom-scrollbar pb-2">
                        {mockGamesBySport['NBA']?.map(g => {
                            const isSelected = activeGame.id === g.id;
                            // Add some synthetic trend logic purely for display
                            const trendScore = g.awayTeam.name.length;
                            const isHot = trendScore % 2 === 0;
                            const isTrendingDown = trendScore % 3 === 0;

                            return (
                                <button
                                    key={g.id}
                                    onClick={() => handleSelect(g)}
                                    className={`flex-shrink-0 flex items-center gap-3 px-4 py-2 rounded-lg transition-all border ${isSelected
                                        ? 'bg-primary/20 border-primary shadow-[0_0_10px_rgba(13,242,13,0.15)] opacity-100'
                                        : 'bg-neutral-800/50 border-border-muted opacity-60 hover:opacity-100 hover:border-border-muted'
                                        }`}
                                >
                                    <span className="text-[9px] font-black text-text-main uppercase">{g.awayTeam.name.split(' ').pop()?.substring(0, 3)} @ {g.homeTeam.name.split(' ').pop()?.substring(0, 3)}</span>
                                    {isHot ? (
                                        <>
                                            <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                                            <span className="text-[10px] font-bold text-primary">Hot Lean</span>
                                        </>
                                    ) : isTrendingDown ? (
                                        <>
                                            <span className="material-symbols-outlined text-red-500 text-sm">trending_down</span>
                                            <span className="text-[10px] font-bold text-red-500">Value Play</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-accent-purple text-sm">trending_flat</span>
                                            <span className="text-[10px] font-bold text-accent-purple">Sharp Data</span>
                                        </>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
