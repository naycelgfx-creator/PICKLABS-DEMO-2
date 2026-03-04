import React from 'react';
import { Game } from '../../../data/mockGames';


interface FootballFieldProps {
    game: Game;
}

export const FootballField: React.FC<FootballFieldProps> = ({ game }) => {
    if (game.sport !== 'NFL' && game.sport !== 'NCAAF') return null;

    // Generate random touchdown drives (yards from left endzone)
    const generateTDs = (count: number) => {
        return Array.from({ length: count }).map(() => ({
            id: Math.random().toString(),
            yardLine: Math.random() * 100 // 0 to 100
        }));
    };

    const awayTDs = generateTDs(3);
    const homeTDs = generateTDs(4);

    // Yard line markers
    const yardLines = [10, 20, 30, 40, 50, 40, 30, 20, 10];

    return (
        <div className="terminal-panel mt-6 overflow-hidden">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-500 text-sm">sports_football</span>
                    Scoring Drive Analysis (Last Game)
                </h3>
            </div>

            <div className="bg-background-dark p-6 flex flex-col items-center">
                {/* Team Headers */}
                <div className="flex justify-between w-full mb-6 items-center">
                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                            <img src={game.awayTeam.url} alt={game.awayTeam.name} className="h-6 w-6 object-contain" />
                            <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{game.awayTeam.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{awayTDs.length} Touchdowns</span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 flex-row-reverse">
                            <img src={game.homeTeam.url} alt={game.homeTeam.name} className="h-6 w-6 object-contain" />
                            <h4 className="text-sm font-black text-text-main uppercase tracking-widest">{game.homeTeam.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{homeTDs.length} Touchdowns</span>
                    </div>
                </div>

                {/* Football Field Container */}
                <div className="relative w-full max-w-[800px] h-[200px] sm:h-[280px] bg-[#1a472a] rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] border-4 border-white/20">

                    {/* Grass Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10%, #000 10%, #000 20%)' }}></div>

                    {/* Left Endzone (Away) */}
                    <div className="absolute left-0 top-0 bottom-0 w-[10%] border-r-[3px] border-white/40 bg-black/40 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            {game.awayTeam.logo ? (
                                <img src={game.awayTeam.logo} alt="Away Logo" className="w-[80%] opacity-50 -rotate-90 object-contain" />
                            ) : (
                                <span className="text-3xl font-black text-white/40 -rotate-90 tracking-widest uppercase">{game.awayTeam.name.substring(0, 3)}</span>
                            )}
                        </div>
                    </div>

                    {/* Right Endzone (Home) */}
                    <div className="absolute right-0 top-0 bottom-0 w-[10%] border-l-[3px] border-white/40 bg-black/40 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                            {game.homeTeam.logo ? (
                                <img src={game.homeTeam.logo} alt="Home Logo" className="w-[80%] opacity-50 rotate-90 object-contain" />
                            ) : (
                                <span className="text-3xl font-black text-white/40 rotate-90 tracking-widest uppercase">{game.homeTeam.name.substring(0, 3)}</span>
                            )}
                        </div>
                    </div>

                    {/* Field Lines (10 to 90 yards) */}
                    <div className="absolute left-[10%] right-[10%] top-0 bottom-0 flex justify-between px-[5%]">
                        {yardLines.map((line, i) => (
                            <div key={i} className="h-full w-[2px] bg-white/30 relative flex items-center justify-center">
                                {/* Top Number */}
                                <span className="absolute top-4 text-white/40 font-bold text-lg rotate-180 block w-10 text-center">{line}</span>
                                {/* Bottom Number */}
                                <span className="absolute bottom-4 text-white/40 font-bold text-lg block w-10 text-center">{line}</span>
                            </div>
                        ))}
                    </div>

                    {/* Hash Marks */}
                    <div className="absolute left-[10%] right-[10%] top-[35%] h-[2px] border-y-[6px] border-dashed border-white/20"></div>
                    <div className="absolute left-[10%] right-[10%] bottom-[35%] h-[2px] border-y-[6px] border-dashed border-white/20"></div>

                    {/* Away Touchdown Markers */}
                    {awayTDs.map((td, i) => (
                        <div
                            key={`away-${i}`}
                            className="absolute top-[25%] -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#10b981] shadow-[0_0_10px_#10b981] border-2 border-white/80 z-10 animate-pulse-slow flex items-center justify-center"
                            style={{ left: `${10 + (td.yardLine * 0.8)}%` }} // Map 0-100 to 10%-90%
                            title={`${game.awayTeam.name} TD`}
                        >
                            <span className="absolute -top-6 text-[10px] font-black text-white whitespace-nowrap bg-black/50 px-1 rounded">TD {i + 1}</span>
                        </div>
                    ))}

                    {/* Home Touchdown Markers */}
                    {homeTDs.map((td, i) => (
                        <div
                            key={`home-${i}`}
                            className="absolute bottom-[25%] translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#8b5cf6] shadow-[0_0_10px_#8b5cf6] border-2 border-white/80 z-10 animate-pulse flex items-center justify-center"
                            style={{ left: `${10 + (td.yardLine * 0.8)}%` }}
                            title={`${game.homeTeam.name} TD`}
                        >
                            <span className="absolute -bottom-6 text-[10px] font-black text-white whitespace-nowrap bg-black/50 px-1 rounded">TD {i + 1}</span>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#10b981] shadow-[0_0_5px_#10b981]"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{game.awayTeam.name} TDs</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6] shadow-[0_0_5px_#8b5cf6]"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{game.homeTeam.name} TDs</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
