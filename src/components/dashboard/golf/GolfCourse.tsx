import React from 'react';
import { Game } from '../../../data/mockGames';

interface GolfCourseProps {
    game: Game;
}

export const GolfCourse: React.FC<GolfCourseProps> = ({ game }) => {
    const golfer = game.homeTeam.name;
    const tournament = game.awayTeam.name;
    const scoreLabel = game.timeLabel || 'PGA TOUR';

    // Mock shot tracer positions along a dogleg-left hole
    const shotPath = [
        { x: 50, y: 88 },  // tee shot
        { x: 44, y: 65 },  // mid fairway
        { x: 36, y: 45 },  // approach
        { x: 30, y: 25 },  // on green
    ];

    return (
        <div className="terminal-panel mt-6 overflow-hidden">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="text-sm">⛳</span>
                    Course Hole Map
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Simulated Approach</span>
            </div>

            <div className="bg-background-dark p-6 flex flex-col items-center gap-4">
                {/* Header */}
                <div className="flex justify-between w-full max-w-[580px] mb-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-primary uppercase tracking-widest">{tournament}</span>
                        <span className="text-[10px] text-slate-500">{scoreLabel}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-black text-accent-purple uppercase tracking-widest">{golfer}</span>
                        <span className="text-[10px] text-slate-500">Hole 18 · Par 4</span>
                    </div>
                </div>

                {/* Hole SVG */}
                <div className="relative w-full overflow-hidden">
                    <svg
                        viewBox="0 0 1000 500"
                        className="w-full h-auto drop-shadow-xl"
                        aria-label="Golf hole diagram"
                    >
                        {/* Rough (dark green background) */}
                        <rect width="1000" height="500" fill="#20401b" />

                        {/* Fairway */}
                        <path
                            d="M 460 440 L 540 440 L 530 350 L 500 250 L 460 200 L 410 160 L 350 140 L 320 180 L 380 230 L 410 260 L 430 320 L 440 370 Z"
                            fill="#3f8a2f"
                        />

                        {/* Tee box */}
                        <rect x="475" y="420" width="50" height="15" fill="#4d9e3b" rx="2" />
                        <text x="500" y="432" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800" opacity="0.9">TEE</text>

                        {/* Green multi-layer (lighter greens) */}
                        {/* Fringe */}
                        <circle cx="340" cy="150" r="55" fill="#306b23" opacity="0.6" />
                        <circle cx="340" cy="150" r="50" fill="none" stroke="#4d9e3b" strokeWidth="4" opacity="0.4" />
                        <circle cx="330" cy="140" r="50" fill="none" stroke="#4d9e3b" strokeWidth="2" opacity="0.2" />
                        {/* Putting Green */}
                        <circle cx="340" cy="150" r="42" fill="#40c451" />
                        <circle cx="340" cy="150" r="30" fill="#4ade80" opacity="0.5" />

                        {/* Flag pin */}
                        <line x1="340" y1="150" x2="340" y2="100" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
                        <polygon points="340,100 365,110 340,120" fill="#ef4444" opacity="0.95" />
                        <circle cx="340" cy="150" r="3" fill="#ffffff" />

                        {/* Bunkers */}
                        <ellipse cx="580" cy="270" rx="40" ry="25" fill="#d0b48a" opacity="0.85" />
                        <text x="580" y="274" textAnchor="middle" fill="#a68452" fontSize="9" fontWeight="800" letterSpacing="1">BUNKER</text>

                        <ellipse cx="280" cy="280" rx="35" ry="20" fill="#d0b48a" opacity="0.85" />
                        <text x="280" y="284" textAnchor="middle" fill="#a68452" fontSize="9" fontWeight="800" letterSpacing="1">BUNKER</text>

                        {/* Water hazard overlay on fairway */}
                        <ellipse cx="480" cy="350" rx="55" ry="22" fill="#2b6b91" opacity="0.8" />
                        <text x="480" y="354" textAnchor="middle" fill="#75c0ed" fontSize="10" fontWeight="800" letterSpacing="1">WATER</text>

                        {/* Shot tracer connecting lines and dots */}
                        {shotPath.map((s, i) => {
                            // Map coordinates roughly from 0-100 to the 1000x500 svg box
                            // s.x: 0-100 -> x
                            // s.y: 0-100 -> y
                            const cx = 500 - ((50 - s.x) * 8);
                            const cy = 430 - ((88 - s.y) * 4.5);

                            const isLast = i === shotPath.length - 1;

                            // To draw the line to the *previous* point
                            let px = cx, py = cy;
                            if (i > 0) {
                                px = 500 - ((50 - shotPath[i - 1].x) * 8);
                                py = 430 - ((88 - shotPath[i - 1].y) * 4.5);
                            }

                            return (
                                <g key={`shot-${i}`}>
                                    {i > 0 && (
                                        <line
                                            x1={px}
                                            y1={py}
                                            x2={cx}
                                            y2={cy}
                                            stroke="#a855f7"
                                            strokeWidth="3"
                                            strokeDasharray="8 6"
                                            opacity="0.8"
                                        />
                                    )}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={isLast ? 8 : 6}
                                        fill={isLast ? '#8b5cf6' : '#d8b4fe'}
                                        opacity={isLast ? 1 : 0.9}
                                        className={isLast ? 'animate-pulse' : ''}
                                    />
                                    {/* Drive text next to the first shot outcome (i=1 usually, or just 0) */}
                                    {i === 1 && (
                                        <text x={cx + 15} y={cy + 4} fill="#ffffff" fontSize="11" fontWeight="600" opacity="0.9">Drive</text>
                                    )}
                                </g>
                            );
                        })}

                        {/* Yardage markers text on the right side of the fairway */}
                        <text x="530" y="230" fill="#ffffff" fontSize="11" fontWeight="700" opacity="0.6">150 YDS</text>
                        <text x="515" y="300" fill="#ffffff" fontSize="11" fontWeight="700" opacity="0.6">100 YDS</text>

                        {/* Bottom Right hole info overlay */}
                        <text x="960" y="450" textAnchor="end" fill="#ffffff" fontSize="16" fontWeight="900" opacity="0.6">Hole 18</text>
                        <text x="960" y="470" textAnchor="end" fill="#ffffff" fontSize="12" opacity="0.5">Par 4 · 418 YDS</text>

                        {/* Top Left PIN label */}
                        <text x="340" y="85" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="800" opacity="0.9">PIN</text>
                    </svg>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                        <span>{golfer.split(' ').pop()} Shot Tracer</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-1 bg-[#d4b483]" />
                        <span>Bunker</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#38d966]" />
                        <span>Green</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
