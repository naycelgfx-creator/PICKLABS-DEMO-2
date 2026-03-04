import React from 'react';
import { Game } from '../../../data/mockGames';

interface UFCOctagonProps {
    game: Game;
}

export const UFCOctagon: React.FC<UFCOctagonProps> = ({ game }) => {
    const f1 = game.homeTeam.name;   // Red corner
    const f2 = game.awayTeam.name;   // Blue corner
    const f1Flag = game.homeTeam.logo;
    const f2Flag = game.awayTeam.logo;
    const result = game.timeLabel || '';

    // Mock strike heat zones — plotted on the octagon
    const f1Strikes = [
        { x: 55, y: 40 }, { x: 60, y: 55 }, { x: 52, y: 48 },
        { x: 58, y: 35 }, { x: 65, y: 50 }, { x: 53, y: 62 },
    ];
    const f2Strikes = [
        { x: 45, y: 60 }, { x: 40, y: 45 }, { x: 48, y: 52 },
        { x: 42, y: 65 }, { x: 35, y: 50 }, { x: 47, y: 38 },
    ];

    // Octagon polygon — 8 sides, centered at 300, 220 with radius 160
    const octagonPoints = Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI / 4) - Math.PI / 8;
        const r = 160;
        return `${300 + r * Math.cos(angle)},${220 + r * Math.sin(angle)}`;
    }).join(' ');

    // Inner octagon (mat)
    const innerPoints = Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI / 4) - Math.PI / 8;
        const r = 155;
        return `${300 + r * Math.cos(angle)},${220 + r * Math.sin(angle)}`;
    }).join(' ');

    return (
        <div className="terminal-panel mt-6 overflow-hidden">
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400 text-sm">sports_mma</span>
                    Octagon Strike Map
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Simulated Round Data</span>
            </div>

            <div className="bg-background-dark p-6 flex flex-col items-center gap-4">
                {/* Fighter headers */}
                <div className="flex justify-between w-full mb-2">
                    <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                            {f2Flag && <img src={f2Flag} alt={f2} className="h-5 w-8 object-cover rounded-sm border border-neutral-700/40" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                            <span className="text-xs font-black text-primary uppercase tracking-widest">{f2.split(' ').pop()}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Blue Corner · {f2Strikes.length} strikes</span>
                    </div>
                    {result && (
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-red-400/30 bg-red-400/10 text-red-400">{result}</span>
                        </div>
                    )}
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2 flex-row-reverse">
                            {f1Flag && <img src={f1Flag} alt={f1} className="h-5 w-8 object-cover rounded-sm border border-neutral-700/40" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                            <span className="text-xs font-black text-accent-purple uppercase tracking-widest">{f1.split(' ').pop()}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Red Corner · {f1Strikes.length} strikes</span>
                    </div>
                </div>

                {/* Octagon SVG */}
                <div className="relative w-full">
                    <svg
                        viewBox="0 0 600 440"
                        className="w-full rounded-lg overflow-hidden"
                        aria-label="UFC octagon diagram"
                    >
                        {/* Background */}
                        <rect width="600" height="440" fill="#0a0a0a" />

                        {/* Outer octagon (cage frame) */}
                        <polygon points={octagonPoints} fill="#1a1a1a" stroke="#444" strokeWidth="8" />

                        {/* Mat */}
                        <polygon points={innerPoints} fill="#c41e3a" stroke="#960f28" strokeWidth="2" opacity="0.85" />

                        {/* Canvas lines */}
                        {/* Center line horizontal */}
                        <line x1="140" y1="220" x2="460" y2="220" stroke="white" strokeWidth="1.5" opacity="0.2" />
                        {/* Center line vertical */}
                        <line x1="300" y1="60" x2="300" y2="380" stroke="white" strokeWidth="1.5" opacity="0.2" />
                        {/* Center circle */}
                        <circle cx="300" cy="220" r="50" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />

                        {/* UFC Logo area */}
                        <text x="300" y="225" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" opacity="0.12" letterSpacing="4">UFC</text>

                        {/* Corner labels */}
                        <text x="113" y="110" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold" opacity="0.9" letterSpacing="1">BLUE</text>
                        <text x="113" y="120" textAnchor="middle" fill="#10b981" fontSize="8" fontWeight="bold" opacity="0.9" letterSpacing="1">CORNER</text>
                        <text x="487" y="110" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold" opacity="0.9" letterSpacing="1">RED</text>
                        <text x="487" y="120" textAnchor="middle" fill="#ef4444" fontSize="8" fontWeight="bold" opacity="0.9" letterSpacing="1">CORNER</text>

                        {/* F2 (Blue Corner) strike dots */}
                        {f2Strikes.map((s, i) => (
                            <g key={`f2-${i}`}>
                                <circle
                                    cx={(s.x / 100) * 600}
                                    cy={(s.y / 100) * 440}
                                    r="10"
                                    fill="#10b981"
                                    opacity="0.75"
                                    className="animate-pulse"
                                />
                                <circle
                                    cx={(s.x / 100) * 600}
                                    cy={(s.y / 100) * 440}
                                    r="4"
                                    fill="white"
                                    opacity="0.9"
                                />
                            </g>
                        ))}

                        {/* F1 (Red Corner) strike dots */}
                        {f1Strikes.map((s, i) => (
                            <g key={`f1-${i}`}>
                                <circle
                                    cx={(s.x / 100) * 600}
                                    cy={(s.y / 100) * 440}
                                    r="10"
                                    fill="#8b5cf6"
                                    opacity="0.75"
                                    className="animate-pulse"
                                />
                                <circle
                                    cx={(s.x / 100) * 600}
                                    cy={(s.y / 100) * 440}
                                    r="4"
                                    fill="white"
                                    opacity="0.9"
                                />
                            </g>
                        ))}

                        {/* Fighter name labels at corners */}
                        <text x="105" y="340" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" opacity="0.9">
                            {f2.toUpperCase().substring(0, 12)}
                        </text>
                        <text x="495" y="340" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontWeight="bold" opacity="0.9">
                            {f1.toUpperCase().substring(0, 12)}
                        </text>

                        {/* Cage posts at octagon corners */}
                        {Array.from({ length: 8 }).map((_, i) => {
                            const angle = (i * Math.PI / 4) - Math.PI / 8;
                            const r = 163;
                            return (
                                <circle
                                    key={`post-${i}`}
                                    cx={300 + r * Math.cos(angle)}
                                    cy={220 + r * Math.sin(angle)}
                                    r="5"
                                    fill="#555"
                                    stroke="#333"
                                    strokeWidth="1"
                                />
                            );
                        })}
                    </svg>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                        <span>{f2.split(' ').pop()} Strikes</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                        <span>{f1.split(' ').pop()} Strikes</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
