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
                <div className="relative w-full max-w-[580px]">
                    <svg
                        viewBox="0 0 580 320"
                        className="w-full rounded-lg overflow-hidden"
                        aria-label="Tennis court diagram"
                    >
                        {/* Court surface — hard blue */}
                        <rect width="580" height="320" fill="#1a4b7a" rx="4" />

                        {/* Court outer boundary */}
                        <rect x="40" y="30" width="500" height="260" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />

                        {/* Singles sidelines */}
                        <rect x="40" y="64" width="500" height="192" fill="none" stroke="white" strokeWidth="1.5" opacity="0.7" />

                        {/* Center line (net) */}
                        <line x1="290" y1="30" x2="290" y2="290" stroke="white" strokeWidth="2" opacity="0.8" />

                        {/* Service boxes */}
                        {/* Left side */}
                        <line x1="40" y1="160" x2="290" y2="160" stroke="white" strokeWidth="1.5" opacity="0.6" />
                        <line x1="165" y1="64" x2="165" y2="256" stroke="white" strokeWidth="1.5" opacity="0.6" />
                        {/* Right side */}
                        <line x1="290" y1="160" x2="540" y2="160" stroke="white" strokeWidth="1.5" opacity="0.6" />
                        <line x1="415" y1="64" x2="415" y2="256" stroke="white" strokeWidth="1.5" opacity="0.6" />

                        {/* Net */}
                        <rect x="275" y="30" width="30" height="260" fill="#00000040" />
                        <line x1="275" y1="30" x2="275" y2="290" stroke="white" strokeWidth="3" opacity="0.9" />
                        <line x1="305" y1="30" x2="305" y2="290" stroke="white" strokeWidth="3" opacity="0.9" />
                        {/* Net strap */}
                        <line x1="275" y1="160" x2="305" y2="160" stroke="white" strokeWidth="4" opacity="1" />
                        {/* Net posts */}
                        <circle cx="275" cy="30" r="4" fill="white" opacity="0.9" />
                        <circle cx="305" cy="30" r="4" fill="white" opacity="0.9" />
                        <circle cx="275" cy="290" r="4" fill="white" opacity="0.9" />
                        <circle cx="305" cy="290" r="4" fill="white" opacity="0.9" />

                        {/* Baseline ticks */}
                        <line x1="290" y1="30" x2="290" y2="44" stroke="white" strokeWidth="2" opacity="0.7" />
                        <line x1="290" y1="276" x2="290" y2="290" stroke="white" strokeWidth="2" opacity="0.7" />

                        {/* P2 shot dots (primary green — left/away side) */}
                        {rallyShotsP2.map((s, i) => (
                            <g key={`p2-${i}`}>
                                <circle
                                    cx={(s.x / 100) * 580}
                                    cy={(s.y / 100) * 320}
                                    r="7"
                                    fill="#10b981"
                                    opacity="0.85"
                                    className="animate-pulse"
                                />
                                <circle
                                    cx={(s.x / 100) * 580}
                                    cy={(s.y / 100) * 320}
                                    r="3"
                                    fill="white"
                                    opacity="0.9"
                                />
                            </g>
                        ))}

                        {/* P1 shot dots (purple — right/home side) */}
                        {rallyShotsP1.map((s, i) => (
                            <g key={`p1-${i}`}>
                                <circle
                                    cx={(s.x / 100) * 580}
                                    cy={(s.y / 100) * 320}
                                    r="7"
                                    fill="#8b5cf6"
                                    opacity="0.85"
                                    className="animate-pulse"
                                />
                                <circle
                                    cx={(s.x / 100) * 580}
                                    cy={(s.y / 100) * 320}
                                    r="3"
                                    fill="white"
                                    opacity="0.9"
                                />
                            </g>
                        ))}

                        {/* "NET" label */}
                        <text x="290" y="22" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.6" letterSpacing="2">NET</text>

                        {/* Player name labels */}
                        <text x="145" y="312" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" opacity="0.8" letterSpacing="1">
                            {p2.toUpperCase().substring(0, 14)}
                        </text>
                        <text x="435" y="312" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold" opacity="0.8" letterSpacing="1">
                            {p1.toUpperCase().substring(0, 14)}
                        </text>
                    </svg>
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
