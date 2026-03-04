import React from 'react';
import { Game } from '../../data/mockGames';

interface HeadCoachMatchupProps {
    game: Game;
}

export const HeadCoachMatchup: React.FC<HeadCoachMatchupProps> = ({ game }) => {
    // Only show coaching matchups for NCAAM as requested
    if (game.sport !== 'NCAAM') {
        return null;
    }

    // Mock coaching data for NCAAB
    const getMockCoaches = () => {
        const coachNames = ['Jon Scheyer', 'Hubert Davis', 'Bill Self', 'John Calipari', 'Dan Hurley', 'Matt Painter', 'Kelvin Sampson', 'Tommy Lloyd'];

        return {
            awayCoach: {
                name: coachNames[Math.floor(Math.random() * coachNames.length)],
                experience: `${Math.floor(Math.random() * 20) + 2} Yrs`,
                tournamentWins: Math.floor(Math.random() * 40) + 5,
                finalFours: Math.floor(Math.random() * 6),
                championships: Math.floor(Math.random() * 3),
                atsRecord: `${Math.floor(Math.random() * 100) + 50}-${Math.floor(Math.random() * 80) + 30}`,
                rating: (Math.random() * 2 + 7.5).toFixed(1) // 7.5 to 9.5
            },
            homeCoach: {
                name: coachNames[Math.floor(Math.random() * coachNames.length)],
                experience: `${Math.floor(Math.random() * 20) + 2} Yrs`,
                tournamentWins: Math.floor(Math.random() * 40) + 5,
                finalFours: Math.floor(Math.random() * 6),
                championships: Math.floor(Math.random() * 3),
                atsRecord: `${Math.floor(Math.random() * 100) + 50}-${Math.floor(Math.random() * 80) + 30}`,
                rating: (Math.random() * 2 + 7.5).toFixed(1)
            }
        };
    };

    const coaches = getMockCoaches();

    // Determine edge
    const awayScore = parseFloat(coaches.awayCoach.rating) + (coaches.awayCoach.championships * 0.5);
    const homeScore = parseFloat(coaches.homeCoach.rating) + (coaches.homeCoach.championships * 0.5);
    const edgeDiff = Math.abs(awayScore - homeScore);

    let edgeTeam = "Even Matchup";
    let edgeColor = "text-text-muted";

    if (edgeDiff > 1.0) {
        if (awayScore > homeScore) {
            edgeTeam = `Strong Edge: ${game.awayTeam.name}`;
            edgeColor = "text-accent-purple";
        } else {
            edgeTeam = `Strong Edge: ${game.homeTeam.name}`;
            edgeColor = "text-primary";
        }
    } else if (edgeDiff > 0.3) {
        if (awayScore > homeScore) {
            edgeTeam = `Slight Edge: ${game.awayTeam.name}`;
            edgeColor = "text-accent-purple/80";
        } else {
            edgeTeam = `Slight Edge: ${game.homeTeam.name}`;
            edgeColor = "text-primary/80";
        }
    }

    return (
        <div className="terminal-panel mt-6 relative overflow-hidden group">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-400 text-sm">groups</span>
                    Head Coach Matchup
                </h3>
                <span className={`text-[10px] font-black uppercase tracking-widest ${edgeColor}`}>
                    {edgeTeam}
                </span>
            </div>

            <div className="p-0 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] relative z-10">
                {/* Away Coach */}
                <div className="p-6 bg-gradient-to-br from-accent-purple/10 to-transparent flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-accent-purple/20 border-2 border-accent-purple flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl text-accent-purple">person</span>
                    </div>
                    <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{coaches.awayCoach.name}</h4>
                    <p className="text-[10px] text-accent-purple font-bold uppercase tracking-widest mb-4">{game.awayTeam.name} HC</p>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-[200px]">
                        <div className="bg-white dark:bg-neutral-900/40 rounded border border-border-muted p-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">NCAA Wins</span>
                            <span className="text-sm font-black text-text-main">{coaches.awayCoach.tournamentWins}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900/40 rounded border border-border-muted p-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Final 4s</span>
                            <span className="text-sm font-black text-text-main">{coaches.awayCoach.finalFours}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900/40 rounded border border-border-muted p-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Titles</span>
                            <span className="text-sm font-black text-text-main">{coaches.awayCoach.championships}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900/40 rounded border border-border-muted p-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Rating</span>
                            <span className="text-sm font-black text-accent-purple">{coaches.awayCoach.rating}</span>
                        </div>
                    </div>
                </div>

                {/* Divider/VS */}
                <div className="flex flex-col items-center justify-center py-6 md:py-0 px-4 bg-white dark:bg-neutral-900/40 border-y md:border-y-0 md:border-x border-border-muted">
                    <span className="text-xs font-black text-slate-600 italic uppercase">Vs</span>
                </div>

                {/* Home Coach */}
                <div className="p-6 bg-gradient-to-bl from-primary/10 to-transparent flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl text-primary">person</span>
                    </div>
                    <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{coaches.homeCoach.name}</h4>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-4">{game.homeTeam.name} HC</p>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-[200px]">
                        <div className="bg-white dark:bg-neutral-900/40 rounded border border-border-muted p-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">NCAA Wins</span>
                            <span className="text-sm font-black text-text-main">{coaches.homeCoach.tournamentWins}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900/40 rounded border border-border-muted p-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Final 4s</span>
                            <span className="text-sm font-black text-text-main">{coaches.homeCoach.finalFours}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900/40 rounded border border-border-muted p-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Titles</span>
                            <span className="text-sm font-black text-text-main">{coaches.homeCoach.championships}</span>
                        </div>
                        <div className="bg-white dark:bg-neutral-900/40 rounded border border-border-muted p-2">
                            <span className="text-[9px] text-slate-500 uppercase font-bold block mb-1">Rating</span>
                            <span className="text-sm font-black text-primary">{coaches.homeCoach.rating}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-900/40 p-3 border-t border-border-muted text-center flex justify-center items-center gap-6">
                <div className="text-[10px] font-bold text-text-muted tracking-widest uppercase">
                    Away ATS: <span className="text-white ml-1">{coaches.awayCoach.atsRecord}</span>
                </div>
                <div className="w-px h-3 bg-border-muted"></div>
                <div className="text-[10px] font-bold text-text-muted tracking-widest uppercase">
                    Home ATS: <span className="text-white ml-1">{coaches.homeCoach.atsRecord}</span>
                </div>
            </div>
        </div>
    );
};
