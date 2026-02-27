import React from 'react';
import { Game } from '../../../data/mockGames';


interface SoccerPitchProps {
    game: Game;
}

export const SoccerPitch: React.FC<SoccerPitchProps> = ({ game }) => {
    // Only show for soccer
    if (game.sport !== 'Soccer') return null;

    // Generate random shot data on a soccer pitch coordinate system
    // 0,0 is center, x is -50 to 50, y is -35 to 35
    const generateEvents = (count: number, isAway: boolean) => {
        return Array.from({ length: count }).map(() => {
            // Bias shots towards the opponent's goal
            const xBase = (Math.random() * 40) + 10;
            return {
                id: Math.random().toString(),
                x: isAway ? -xBase : xBase, // Away attacks left, Home attacks right
                y: (Math.random() * 50) - 25, // Spread across the width
                isGoal: Math.random() > 0.85
            };
        });
    };

    const awayEvents = generateEvents(12, true);
    const homeEvents = generateEvents(15, false);

    return (
        <div className="terminal-panel mt-6 overflow-hidden">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">sports_soccer</span>
                    Pitch Match Events (Last Game)
                </h3>
            </div>

            <div className="bg-background-dark p-6 flex flex-col items-center">
                {/* Team Headers */}
                <div className="flex justify-between w-full mb-6 items-center">
                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                            <img src={game.awayTeam.url} alt={game.awayTeam.name} className="h-6 w-6 object-contain drop-shadow-md" />
                            <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{game.awayTeam.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{awayEvents.filter(e => e.isGoal).length} Goals / {awayEvents.length} Shots</span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 flex-row-reverse">
                            <img src={game.homeTeam.url} alt={game.homeTeam.name} className="h-6 w-6 object-contain drop-shadow-md" />
                            <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{game.homeTeam.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{homeEvents.filter(e => e.isGoal).length} Goals / {homeEvents.length} Shots</span>
                    </div>
                </div>

                {/* Pitch Container */}
                <div className="relative w-full max-w-[600px] aspect-[105/68] border-2 border-white/20 bg-[#2d5c31] overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-center">

                    {/* Pitch pattern lines (stripes) */}
                    <div className="absolute inset-0 opacity-10 flex">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'}`}></div>
                        ))}
                    </div>

                    {/* Outer Boundary */}
                    <div className="absolute inset-[2%] border-2 border-white/60"></div>

                    {/* Center Line */}
                    <div className="absolute top-[2%] bottom-[2%] left-1/2 w-0 border-r-2 border-white/60 -translate-x-[1px]"></div>

                    {/* Center Circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18%] aspect-square border-2 border-white/60 rounded-full"></div>

                    {/* Center Spot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1.5%] aspect-square bg-white/60 rounded-full"></div>

                    {/* Left Penalty Area */}
                    <div className="absolute left-[2%] top-[22%] bottom-[22%] w-[16%] border-2 border-l-0 border-white/60"></div>
                    {/* Left Goal Area */}
                    <div className="absolute left-[2%] top-[36%] bottom-[36%] w-[5%] border-2 border-l-0 border-white/60"></div>
                    {/* Left Penalty Arc  */}
                    <div className="absolute left-[18%] top-1/2 -translate-y-1/2 w-[8%] aspect-[0.5] border-2 border-l-0 border-white/60 rounded-r-full overflow-hidden clip-path-half-circle"></div>
                    {/* Left Penalty Spot */}
                    <div className="absolute left-[11%] top-1/2 -translate-y-1/2 w-[1%] aspect-square bg-white/60 rounded-full"></div>

                    {/* Right Penalty Area */}
                    <div className="absolute right-[2%] top-[22%] bottom-[22%] w-[16%] border-2 border-r-0 border-white/60"></div>
                    {/* Right Goal Area */}
                    <div className="absolute right-[2%] top-[36%] bottom-[36%] w-[5%] border-2 border-r-0 border-white/60"></div>
                    {/* Right Penalty Arc */}
                    <div className="absolute right-[18%] top-1/2 -translate-y-1/2 w-[8%] aspect-[0.5] border-2 border-r-0 border-white/60 rounded-l-full"></div>
                    {/* Right Penalty Spot */}
                    <div className="absolute right-[11%] top-1/2 -translate-y-1/2 w-[1%] aspect-square bg-white/60 rounded-full"></div>

                    {/* Corner Arcs */}
                    <div className="absolute top-[2%] left-[2%] w-[2%] aspect-square border-2 border-t-0 border-l-0 border-white/60 rounded-br-full"></div>
                    <div className="absolute bottom-[2%] left-[2%] w-[2%] aspect-square border-2 border-b-0 border-l-0 border-white/60 rounded-tr-full"></div>
                    <div className="absolute top-[2%] right-[2%] w-[2%] aspect-square border-2 border-t-0 border-r-0 border-white/60 rounded-bl-full"></div>
                    <div className="absolute bottom-[2%] right-[2%] w-[2%] aspect-square border-2 border-b-0 border-r-0 border-white/60 rounded-tl-full"></div>


                    {/* Plot Away Events (Attacking Left -> Right) */}
                    {awayEvents.map(ev => (
                        <div
                            key={`away-${ev.id}`}
                            className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-md animate-pulse-slow ${ev.isGoal ? 'bg-[#10b981] border-2 border-white z-20' : 'bg-[#10b981]/60 border border-white/40 z-10'}`}
                            style={{
                                left: `${50 + ev.x}%`, // Map -50/50 to 0/100
                                top: `${50 + ev.y}%`   // Map -35/35 to 0/100
                            }}
                            title={`${game.awayTeam.name} ${ev.isGoal ? 'GOAL' : 'Shot'}`}
                        >
                            {ev.isGoal && <div className="w-1 h-1 bg-white rounded-full"></div>}
                        </div>
                    ))}

                    {/* Plot Home Events (Attacking Right -> Left) */}
                    {homeEvents.map(ev => (
                        <div
                            key={`home-${ev.id}`}
                            className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center shadow-md animate-pulse ${ev.isGoal ? 'bg-[#8b5cf6] border-2 border-white z-20' : 'bg-[#8b5cf6]/60 border border-white/40 z-10'}`}
                            style={{
                                left: `${50 + ev.x}%`,
                                top: `${50 + ev.y}%`
                            }}
                            title={`${game.homeTeam.name} ${ev.isGoal ? 'GOAL' : 'Shot'}`}
                        >
                            {ev.isGoal && <div className="w-1 h-1 bg-white rounded-full"></div>}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#10b981] border-2 border-white"></div>
                        <span>Away Goal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#10b981]/60 border border-white/40"></div>
                        <span>Away Shot</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6] border-2 border-white"></div>
                        <span>Home Goal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6]/60 border border-white/40"></div>
                        <span>Home Shot</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
