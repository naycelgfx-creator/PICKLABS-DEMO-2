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
                <div className="relative w-full max-w-[580px]">
                    <svg
                        viewBox="0 0 580 360"
                        className="w-full rounded-lg overflow-hidden"
                        aria-label="Golf hole diagram"
                    >
                        {/* Sky/background */}
                        <rect width="580" height="360" fill="#1a2e1a" />

                        {/* Rough (full background) */}
                        <rect width="580" height="360" fill="#2d5c1e" opacity="0.6" />

                        {/* Fairway — dogleg left shape */}
                        <path
                            d="M 220 340 L 310 340 L 315 240 L 320 160 L 280 100 L 230 80 L 160 75 L 140 85 L 145 110 L 180 115 L 210 120 L 215 160 L 210 240 L 215 340 Z"
                            fill="#4a9e35"
                            opacity="0.9"
                        />

                        {/* Tee box */}
                        <rect x="228" y="326" width="50" height="16" fill="#5db84a" rx="2" />
                        <text x="253" y="338" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" opacity="0.8">TEE</text>

                        {/* Bunkers */}
                        <ellipse cx="330" cy="200" rx="25" ry="18" fill="#d4b483" opacity="0.8" />
                        <ellipse cx="145" cy="200" rx="20" ry="14" fill="#d4b483" opacity="0.8" />
                        <ellipse cx="195" cy="95" rx="18" ry="12" fill="#d4b483" opacity="0.7" />

                        {/* Water hazard */}
                        <ellipse cx="270" cy="280" rx="28" ry="14" fill="#1e6b9e" opacity="0.7" />
                        <text x="270" y="284" textAnchor="middle" fill="#7ec8e3" fontSize="7" fontWeight="bold" opacity="0.9">WATER</text>

                        {/* Green */}
                        <ellipse cx="173" cy="93" rx="42" ry="30" fill="#38d966" opacity="0.95" />

                        {/* Fringe around green */}
                        <ellipse cx="173" cy="93" rx="50" ry="38" fill="none" stroke="#5db84a" strokeWidth="4" opacity="0.5" />

                        {/* Flag pin */}
                        <line x1="173" y1="93" x2="173" y2="55" stroke="white" strokeWidth="1.5" opacity="0.9" />
                        <polygon points="173,55 190,62 173,69" fill="#ef4444" opacity="0.95" />
                        <circle cx="173" cy="93" r="3" fill="white" opacity="0.9" />

                        {/* Shot tracer dots */}
                        {shotPath.map((s, i) => {
                            const cx = (s.x / 100) * 580;
                            const cy = (s.y / 100) * 360;
                            const isLast = i === shotPath.length - 1;
                            return (
                                <g key={`shot-${i}`}>
                                    {i > 0 && (
                                        <line
                                            x1={(shotPath[i - 1].x / 100) * 580}
                                            y1={(shotPath[i - 1].y / 100) * 360}
                                            x2={cx}
                                            y2={cy}
                                            stroke="#8b5cf6"
                                            strokeWidth="1.5"
                                            strokeDasharray="4 3"
                                            opacity="0.7"
                                        />
                                    )}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={isLast ? 6 : 4}
                                        fill={isLast ? '#8b5cf6' : '#c4b5fd'}
                                        opacity={isLast ? 1 : 0.8}
                                        className={isLast ? 'animate-pulse' : ''}
                                    />
                                    {i === 0 && (
                                        <text x={cx + 8} y={cy + 4} fill="white" fontSize="7" opacity="0.7">Drive</text>
                                    )}
                                </g>
                            );
                        })}

                        {/* Yardage markers */}
                        <text x="295" y="180" fill="white" fontSize="8" opacity="0.5" fontWeight="bold">150 YDS</text>
                        <text x="295" y="250" fill="white" fontSize="8" opacity="0.5" fontWeight="bold">100 YDS</text>

                        {/* Compass / hole info */}
                        <text x="540" y="340" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.5">Hole 18</text>
                        <text x="540" y="350" textAnchor="middle" fill="white" fontSize="8" opacity="0.4">Par 4 · 418 YDS</text>

                        {/* Labels */}
                        <text x="173" y="57" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" opacity="0.8">PIN</text>
                        <text x="330" y="220" textAnchor="middle" fill="#c4a355" fontSize="7" fontWeight="bold" opacity="0.8">BUNKER</text>
                        <text x="145" y="210" textAnchor="middle" fill="#c4a355" fontSize="7" fontWeight="bold" opacity="0.8">BUNKER</text>
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
