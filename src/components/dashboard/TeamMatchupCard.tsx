import React from 'react';
import { Game } from '../../data/mockGames';

interface TeamMatchupCardProps {
    game: Game;
}

export const TeamMatchupCard: React.FC<TeamMatchupCardProps> = ({ game }) => {
    return (
        <div className="grid grid-cols-12 gap-3 xl:gap-6 items-stretch">
            {/* Away team card */}
            <div className="col-span-12 lg:col-span-5 flex items-center justify-between terminal-panel p-4 xl:p-6 neon-glow-green relative pt-6">
                <div className="absolute -top-3 left-6">
                    <span className="text-[10px] px-3 py-1 bg-primary text-black font-black uppercase italic rounded-full shadow-[0_0_10px_rgba(13,242,13,0.5)]">
                        Sharp Action
                    </span>
                </div>
                <div className="flex items-center gap-3 xl:gap-6 min-w-0">
                    <div className="h-14 w-14 xl:h-20 xl:w-20 shrink-0 flex items-center justify-center">
                        {game.awayTeam.logo ? (
                            <img alt={game.awayTeam.name} className="w-full object-contain" src={game.awayTeam.logo} />
                        ) : (
                            <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-500 text-2xl">sports_esports</span>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 overflow-hidden">
                        <h2 className="text-lg xl:text-3xl font-black text-text-main italic uppercase truncate">
                            {game.awayTeam.name.includes(' ') ? game.awayTeam.name.split(' ').slice(0, -1).join(' ') : game.awayTeam.name}
                        </h2>
                        <p className="text-primary font-bold text-sm xl:text-lg truncate">
                            {game.awayTeam.record} <span className="text-slate-500 text-xs font-normal ml-1">1st Division</span>
                        </p>
                    </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Handle Gap</p>
                    <p className="text-xl xl:text-3xl font-black text-primary italic">+14%</p>
                </div>
            </div>

            {/* VS divider */}
            <div className="col-span-12 lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-3 py-2 lg:py-0">
                <div className="text-slate-600 font-black text-2xl italic tracking-tighter uppercase">VS</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Game ID: {game.matchupId}</div>
            </div>

            {/* Home team card */}
            <div className="col-span-12 lg:col-span-5 flex items-center justify-between terminal-panel p-4 xl:p-6 neon-glow-purple">
                <div className="text-left shrink-0 mr-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Vegas Prob</p>
                    <p className="text-xl xl:text-3xl font-black text-text-main">{game.homeTeam.winProb}%</p>
                </div>
                <div className="flex items-center gap-3 xl:gap-6 text-right min-w-0">
                    <div className="min-w-0 overflow-hidden">
                        <h2 className="text-lg xl:text-3xl font-black text-text-main italic text-right uppercase truncate">
                            {game.homeTeam.name.includes(' ') ? game.homeTeam.name.split(' ').slice(0, -1).join(' ') : game.homeTeam.name}
                        </h2>
                        <p className="text-accent-purple font-bold text-sm xl:text-lg truncate">
                            {game.homeTeam.record} <span className="text-slate-500 text-xs font-normal mr-1 italic">1st Division</span>
                        </p>
                    </div>
                    <div className="h-14 w-14 xl:h-20 xl:w-20 shrink-0 flex items-center justify-center">
                        {game.homeTeam.logo ? (
                            <img alt={game.homeTeam.name} className="w-full object-contain" src={game.homeTeam.logo} />
                        ) : (
                            <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-slate-500 text-2xl">sports_esports</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
