import React from 'react';
import { Game } from '../../../data/mockGames';

interface BaseballDiamondProps {
    game: Game;
}

export const BaseballDiamond: React.FC<BaseballDiamondProps> = ({ game }) => {
    if (game.sport !== 'MLB') return null;

    // Generate hit spray vectors (angle and distance)
    const generateHits = (count: number) => {
        return Array.from({ length: count }).map(() => {
            // Angle 0 to 90 degrees (1st to 3rd base lines)
            const angle = Math.random() * 90;
            // Distance 0 to ~400ft (scaled to roughly 100 for the SVG viewBox)
            const isHR = Math.random() > 0.8;
            const distance = isHR ? (Math.random() * 20) + 85 : Math.random() * 75;

            return {
                id: Math.random().toString(),
                angle,
                distance,
                isHR
            };
        });
    };

    const awayHits = generateHits(8);
    const homeHits = generateHits(10);

    // Calculate X,Y coordinates for a given angle/distance in the SVG
    // Home plate is at 50, 90. Field opens upwards.
    const getCoordinates = (angleDegrees: number, distance: number) => {
        // Convert to radians for math. Adjust angle so 45deg is straight up (center field).
        // 0deg = down Right Field line. 90deg = down Left Field line.
        const angleRads = (angleDegrees + 45) * (Math.PI / 180);

        // Negative Y because SVG 0,0 is top-left
        const x = 50 - (Math.sin(angleRads - (Math.PI / 2)) * distance * 0.45);
        const y = 90 - (Math.cos(angleRads - (Math.PI / 2)) * distance * 0.45);
        return { x, y };
    };

    return (
        <div className="terminal-panel mt-6 overflow-hidden">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-sm">sports_baseball</span>
                    Hit Spray Chart (Last Game)
                </h3>
            </div>

            <div className="bg-background-dark p-6 flex flex-col items-center">
                {/* Team Headers */}
                <div className="flex justify-between w-full mb-6 items-center">
                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                            <img src={game.awayTeam.url} alt={game.awayTeam.name} className="h-6 w-6 object-contain" />
                            <h4 className="text-sm font-black text-text-main uppercase tracking-[0.1em]">{game.awayTeam.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{awayHits.length} Hits ({awayHits.filter(h => h.isHR).length} HR)</span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 flex-row-reverse">
                            <img src={game.homeTeam.url} alt={game.homeTeam.name} className="h-6 w-6 object-contain" />
                            <h4 className="text-sm font-black text-text-main uppercase tracking-[0.1em]">{game.homeTeam.name}</h4>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{homeHits.length} Hits ({homeHits.filter(h => h.isHR).length} HR)</span>
                    </div>
                </div>

                {/* Wind Indicator */}
                <div className="w-full flex justify-center mb-4">
                    <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-3">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">air</span>
                        <span className="text-xs font-bold text-slate-300">Wind: 12mph Out to LF</span>
                        <span className="material-symbols-outlined text-[14px] text-primary rotate-45 transform">arrow_upward</span>
                    </div>
                </div>

                {/* SVG Field */}
                <div className="relative w-full max-w-[400px] aspect-square mx-auto">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                        {/* Outfield Grass */}
                        <path d="M 50 90 L 10 50 Q 50 10 90 50 Z" fill="#2d5c31" stroke="#3d7c41" strokeWidth="0.5" />

                        {/* Dirt Pattern */}
                        <path d="M 50 85 L 25 60 A 35 35 0 0 1 75 60 Z" fill="#a47551" />

                        {/* Infield Grass */}
                        <path d="M 50 82 L 30 62 Q 50 50 70 62 Z" fill="#2d5c31" />

                        {/* Foul Lines */}
                        <line x1="50" y1="90" x2="10" y2="50" stroke="white" strokeWidth="0.5" opacity="0.6" />
                        <line x1="50" y1="90" x2="90" y2="50" stroke="white" strokeWidth="0.5" opacity="0.6" />

                        {/* Bases */}
                        <rect x="49" y="88.5" width="2" height="2" fill="white" className="origin-center rotate-45" /> {/* Home */}
                        <rect x="73" y="64" width="2" height="2" fill="white" className="origin-center rotate-45" />   {/* 1st */}
                        <rect x="49" y="40" width="2" height="2" fill="white" className="origin-center rotate-45" />   {/* 2nd */}
                        <rect x="25" y="64" width="2" height="2" fill="white" className="origin-center rotate-45" />   {/* 3rd */}

                        {/* Pitcher's Mound */}
                        <circle cx="50" cy="64" r="2.5" fill="#a47551" stroke="#8b5d3b" strokeWidth="0.5" />
                        <rect x="49" y="63.5" width="2" height="1" fill="white" />

                        {/* Trajectories (Away - Primary/Greenish) */}
                        {awayHits.map(hit => {
                            const { x, y } = getCoordinates(hit.angle, hit.distance);
                            return (
                                <g key={`away-${hit.id}`}>
                                    <line
                                        x1="50" y1="90"
                                        x2={x} y2={y}
                                        stroke="#10b981"
                                        strokeWidth={hit.isHR ? "0.6" : "0.3"}
                                        opacity={hit.isHR ? "0.8" : "0.4"}
                                        strokeDasharray={hit.isHR ? "none" : "1,1"}
                                    />
                                    <circle cx={x} cy={y} r={hit.isHR ? 1.2 : 0.8} fill={hit.isHR ? "#ffffff" : "#10b981"} stroke="#10b981" strokeWidth="0.2" className={hit.isHR ? "animate-pulse" : ""} />
                                </g>
                            );
                        })}

                        {/* Trajectories (Home - Accent/Purple) */}
                        {homeHits.map(hit => {
                            const { x, y } = getCoordinates(hit.angle, hit.distance);
                            return (
                                <g key={`home-${hit.id}`}>
                                    <line
                                        x1="50" y1="90"
                                        x2={x} y2={y}
                                        stroke="#8b5cf6"
                                        strokeWidth={hit.isHR ? "0.6" : "0.3"}
                                        opacity={hit.isHR ? "0.8" : "0.4"}
                                        strokeDasharray={hit.isHR ? "none" : "1,1"}
                                    />
                                    <circle cx={x} cy={y} r={hit.isHR ? 1.2 : 0.8} fill={hit.isHR ? "#ffffff" : "#8b5cf6"} stroke="#8b5cf6" strokeWidth="0.2" className={hit.isHR ? "animate-pulse" : ""} />
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 border-[#10b981] bg-white"></div>
                        <span>Away HR</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                        <span>Away Hit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border-2 border-[#8b5cf6] bg-white"></div>
                        <span>Home HR</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div>
                        <span>Home Hit</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
