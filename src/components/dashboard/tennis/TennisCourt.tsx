import React from 'react';
import { Game } from '../../../data/mockGames';

interface TennisCourtProps {
    game: Game;
}

export const TennisCourt: React.FC<TennisCourtProps> = ({ game }) => {
    const p1 = game.homeTeam.name;
    const p2 = game.awayTeam.name;
    const p1Flag = game.homeTeam.logo;
    const p2Flag = game.awayTeam.logo;

    // Mock shot / rally data for visual
    const rallyShotsP1 = [
        { x: 72, y: 30 }, { x: 78, y: 60 }, { x: 65, y: 20 },
        { x: 80, y: 72 }, { x: 70, y: 45 }, { x: 75, y: 55 },
    ];
    const rallyShotsP2 = [
        { x: 28, y: 35 }, { x: 22, y: 65 }, { x: 35, y: 22 },
        { x: 20, y: 75 }, { x: 30, y: 50 }, { x: 25, y: 42 },
    ];

    return (
        <div className="terminal-panel mt-6 overflow-hidden">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">sports_tennis</span>
                    Court Rally Map
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Simulated Last Set</span>
            </div>

            <div className="bg-background-dark p-6 flex flex-col items-center gap-4">
                {/* Player Headers */}
                <div className="flex justify-between w-full max-w-[580px] mb-2">
                    <div className="flex flex-col items-start gap-1">
                        {p2Flag && <img src={p2Flag} alt={p2} className="h-5 w-8 object-cover rounded-sm border border-neutral-700/40" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                        <span className="text-xs font-black text-primary uppercase tracking-widest">{p2.split(' ').pop()}</span>
                        <span className="text-[10px] text-slate-500">{rallyShotsP2.length} winners</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {p1Flag && <img src={p1Flag} alt={p1} className="h-5 w-8 object-cover rounded-sm border border-neutral-700/40" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                        <span className="text-xs font-black text-accent-purple uppercase tracking-widest">{p1.split(' ').pop()}</span>
                        <span className="text-[10px] text-slate-500">{rallyShotsP1.length} winners</span>
                    </div>
                </div>

                {/* Court SVG */}
                <div className="relative w-full overflow-x-auto overflow-y-hidden pb-4">
                    <div className="min-w-[700px] w-full max-w-[1000px] mx-auto">
                        <svg
                            viewBox="0 0 800 400"
                            className="w-full h-auto drop-shadow-xl"
                            aria-label="Tennis court diagram"
                        >
                            {/* Outer Surround (Dark Blue/Gray) */}
                            <rect width="800" height="400" fill="#1e3a5f" rx="6" />

                            {/* Inner Playing Court (Slightly lighter Blue) */}
                            <rect x="100" y="50" width="600" height="300" fill="#154979" />

                            <g stroke="#ffffff" strokeOpacity="0.8" fill="none">
                                {/* Doubles Sidelines (Outer) */}
                                <rect x="100" y="50" width="600" height="300" strokeWidth="2.5" />

                                {/* Singles Sidelines (Inner) */}
                                <line x1="100" y1="95" x2="700" y2="95" strokeWidth="2" />
                                <line x1="100" y1="305" x2="700" y2="305" strokeWidth="2" />

                                {/* Service Lines */}
                                <line x1="260" y1="95" x2="260" y2="305" strokeWidth="2" />
                                <line x1="540" y1="95" x2="540" y2="305" strokeWidth="2" />

                                {/* Center Service Line */}
                                <line x1="260" y1="200" x2="540" y2="200" strokeWidth="2" />

                                {/* Center Marks on Baselines */}
                                <line x1="100" y1="200" x2="110" y2="200" strokeWidth="3" />
                                <line x1="690" y1="200" x2="700" y2="200" strokeWidth="3" />
                            </g>

                            {/* Net & Posts */}
                            <g>
                                <line x1="400" y1="35" x2="400" y2="365" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
                                <circle cx="400" cy="35" r="5" fill="#ffffff" />
                                <circle cx="400" cy="365" r="5" fill="#ffffff" />
                            </g>

                            {/* "NET" label at the top */}
                            <text x="400" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800" opacity="0.7" letterSpacing="3">NET</text>

                            {/* P2 shot dots (green — left/away side) */}
                            {rallyShotsP2.map((s, i) => {
                                // map s.x 0-100 to left side of court: x: 100 to 400
                                const cx = 100 + (s.x / 100) * 300;
                                // map s.y 0-100 to y: 50 to 350
                                const cy = 50 + (s.y / 100) * 300;
                                return (
                                    <g key={`p2-${i}`}>
                                        <circle cx={cx} cy={cy} r="6" fill="#10b981" opacity="0.9" className="animate-pulse" />
                                        <circle cx={cx} cy={cy} r="2.5" fill="#ffffff" />
                                    </g>
                                );
                            })}

                            {/* P1 shot dots (purple — right/home side) */}
                            {rallyShotsP1.map((s, i) => {
                                // map s.x 0-100 to right side of court (mirrored): x: 400 to 700
                                const cx = 400 + ((100 - s.x) / 100) * 300;
                                const cy = 50 + (s.y / 100) * 300;
                                return (
                                    <g key={`p1-${i}`}>
                                        <circle cx={cx} cy={cy} r="6" fill="#a855f7" opacity="0.9" className="animate-pulse" />
                                        <circle cx={cx} cy={cy} r="2.5" fill="#ffffff" />
                                    </g>
                                );
                            })}

                            {/* Player Name Labels on Court Floor */}
                            <text x="250" y="385" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="900" opacity="0.6" letterSpacing="1.5">
                                {game.awayTeam.name.toUpperCase()}
                            </text>
                            <text x="550" y="385" textAnchor="middle" fill="#a855f7" fontSize="11" fontWeight="900" opacity="0.6" letterSpacing="1.5">
                                {game.homeTeam.name.toUpperCase()}
                            </text>
                        </svg>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                        <span>{p2.split(' ').pop()} Winner</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                        <span>{p1.split(' ').pop()} Winner</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
