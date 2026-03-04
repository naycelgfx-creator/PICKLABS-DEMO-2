import React, { useState } from 'react';
import { Game } from '../../../data/mockGames';

interface BaseballAtBatSimulatorProps {
    game: Game;
}

export const BaseballAtBatSimulator: React.FC<BaseballAtBatSimulatorProps> = ({ game }) => {
    // Determine who is batting and pitching based on mock game logic
    // For a real app, this would be an API feed
    const [isHomeBatting] = useState(false);

    const batterTeam = isHomeBatting ? game.homeTeam : game.awayTeam;
    const pitcherTeam = isHomeBatting ? game.awayTeam : game.homeTeam;

    // Mock details
    const batterName = "A. McCutchen";
    const batterStats = "BA: .265 | HR: 14 | RBI: 42";
    const pitcherName = "S. Strider";
    const pitcherStats = "ERA: 3.25 | K: 184 | WHIP: 1.05";
    const inning = "Top 4th";
    const count = "2-1";
    const outs = 1;

    // Pitch history mock (x, y are 0-100 percentages within the strike zone)
    const pitchHistory = [
        { id: 1, type: 'Fastball', speed: '98 mph', result: 'Strike (Called)', color: '#ef4444', x: 25, y: 75, isStrike: true },
        { id: 2, type: 'Slider', speed: '86 mph', result: 'Ball', color: '#3b82f6', x: -15, y: 40, isStrike: false },
        { id: 3, type: 'Changeup', speed: '88 mph', result: 'Ball', color: '#10b981', x: 50, y: 115, isStrike: false },
    ];

    const dueUp = [
        { name: "B. Reynolds", pos: "CF", avg: ".288" },
        { name: "O. Cruz", pos: "SS", avg: ".270" },
        { name: "K. Hayes", pos: "3B", avg: ".255" }
    ];

    return (
        <div className="terminal-panel mt-6 overflow-hidden col-span-12">
            {/* Header */}
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-rose-500 text-sm">sports_baseball</span>
                    Live At-Bat Simulation
                </h3>
                <div className="flex gap-4 items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{inning}</span>
                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest bg-yellow-500/10 px-2 py-1 rounded">Count: {count}</span>
                    <div className="flex gap-1 items-center">
                        <span className="text-xs font-bold text-slate-500 mr-1">OUTS</span>
                        {[1, 2].map(i => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full ${i <= outs ? 'bg-rose-500' : 'bg-slate-700'}`} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#0f172a] p-4 flex flex-col lg:flex-row gap-6">

                {/* Left Column: Matchup & Strike Zone */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Matchup Bar */}
                    <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        {/* Pitcher */}
                        <div className="flex items-center gap-3 w-[45%]">
                            {pitcherTeam.logo && <img src={pitcherTeam.logo} alt="Pitcher" className="w-10 h-10 object-contain drop-shadow" />}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Pitching</span>
                                <span className="text-sm font-black text-white">{pitcherName}</span>
                                <span className="text-[10px] text-slate-500">{pitcherStats}</span>
                            </div>
                        </div>
                        <div className="text-xl font-black text-slate-600 italic">VS</div>
                        {/* Batter */}
                        <div className="flex items-center justify-end gap-3 w-[45%] text-right">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Batting</span>
                                <span className="text-sm font-black text-white">{batterName}</span>
                                <span className="text-[10px] text-slate-500">{batterStats}</span>
                            </div>
                            {batterTeam.logo && <img src={batterTeam.logo} alt="Batter" className="w-10 h-10 object-contain drop-shadow" />}
                        </div>
                    </div>

                    {/* Strike Zone Area */}
                    <div className="relative flex justify-center items-center h-[300px] bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">

                        {/* Batter Silhouette (Left Handed) */}
                        <div className="absolute left-8 bottom-0 opacity-20 pointer-events-none">
                            <svg width="120" height="280" viewBox="0 0 120 280" fill="white">
                                <path d="M50 20 C 50 10 70 10 70 20 C 70 30 65 35 55 40 Z" />
                                <path d="M45 40 Q 60 40 75 50 L 90 100 Q 80 110 65 100 L 50 60 Z" />
                                <path d="M50 60 L 30 140 L 45 150 L 65 100 Z" />
                                <path d="M45 150 L 30 250 L 50 250 L 65 160 Z" />
                                <path d="M90 100 L 80 180 L 100 180 L 110 110 Z" />
                                <path d="M55 40 Q 80 20 110 40 L 115 45 Q 90 60 65 50 Z" />
                            </svg>
                        </div>

                        {/* Strike Zone Box */}
                        <div className="relative w-[140px] h-[180px]">
                            {/* Inner Grid */}
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border-2 border-slate-400/80 rounded bg-blue-500/5">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="border border-slate-400/30" />
                                ))}
                            </div>

                            {/* Pitches */}
                            {pitchHistory.map((pitch, i) => (
                                <div
                                    key={pitch.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg z-10"
                                    style={{
                                        left: `${pitch.x}%`,
                                        top: `${pitch.y}%`,
                                        backgroundColor: pitch.color,
                                        boxShadow: `0 0 8px ${pitch.color}80`
                                    }}
                                >
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        {/* Home Plate perspective below zone */}
                        <div className="absolute bottom-4 drop-shadow-lg">
                            <svg width="60" height="30" viewBox="0 0 60 30">
                                <polygon points="0,0 60,0 60,10 30,30 0,10" fill="white" opacity="0.9" />
                                <polygon points="2,2 58,2 58,9 30,27 2,9" fill="#f8fafc" />
                            </svg>
                        </div>

                    </div>
                </div>

                {/* Right Column: 3D Diamond & Due Up */}
                <div className="flex-1 flex flex-col gap-6">

                    {/* 3D Isometric Diamond */}
                    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4 h-[180px] relative overflow-hidden flex flex-col items-center justify-center group">
                        <span className="absolute top-3 left-4 text-[10px] font-black text-slate-500 tracking-widest uppercase">Defense Array</span>

                        <div className="relative w-[200px] h-[200px] transition-transform duration-1000 group-hover:scale-105"
                            style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg) rotateZ(45deg) translateY(-20px)' }}>
                            <svg viewBox="0 0 200 200" width="100%" height="100%">
                                {/* Diamond Base Grass */}
                                <rect width="140" height="140" x="30" y="30" fill="#16a34a" opacity="0.4" />

                                {/* Dirt paths */}
                                <polygon points="30,30 170,30 170,170 30,170" fill="none" stroke="#d97706" strokeWidth="8" opacity="0.8" />

                                {/* Bases */}
                                <rect x="25" y="25" width="10" height="10" fill="white" /> {/* 3B */}
                                <rect x="165" y="25" width="10" height="10" fill="white" /> {/* 2B */}
                                <rect x="165" y="165" width="10" height="10" fill="white" /> {/* 1B */}
                                <polygon points="30,165 40,165 40,175 35,180 30,175" fill="white" /> {/* Home */}

                                {/* Mound */}
                                <circle cx="100" cy="100" r="12" fill="#d97706" />

                                {/* Defensive Player Dots (Team colored) */}
                                {/* P, C, 1B, 2B, 3B, SS, LF, CF, RF */}
                                {[
                                    { x: 100, y: 100 }, // P
                                    { x: 20, y: 185 },  // C
                                    { x: 175, y: 155 }, // 1B
                                    { x: 155, y: 45 },  // 2B
                                    { x: 20, y: 20 },   // 3B
                                    { x: 80, y: 25 },   // SS
                                    { x: -20, y: -15 }, // LF
                                    { x: 100, y: -35 }, // CF
                                    { x: 220, y: 5 }    // RF
                                ].map((pos, idx) => (
                                    <circle key={idx} cx={pos.x} cy={pos.y} r="5" fill="#facc15" className="drop-shadow-xl"
                                        style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))' }}
                                    />
                                ))}
                            </svg>
                        </div>
                    </div>

                    {/* Due Up List */}
                    <div className="flex-1 bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
                        <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-3 block">Due Up</span>
                        <div className="flex flex-col gap-0 border border-slate-700/50 rounded overflow-hidden">
                            {dueUp.map((player, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-2 text-xs font-bold ${idx % 2 === 0 ? 'bg-slate-700/20' : 'bg-transparent'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[9px] text-white">
                                            {player.pos}
                                        </div>
                                        <span className="text-slate-300">{player.name}</span>
                                    </div>
                                    <span className="text-slate-400">{player.avg}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {/* Pitch Legend */}
            <div className="p-3 border-t border-border-muted flex flex-wrap justify-center gap-4 bg-[#0f172a]">
                {pitchHistory.map((pitch, idx) => (
                    <div key={pitch.id} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: pitch.color }}>
                            {idx + 1}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{pitch.type} · {pitch.speed}</span>
                    </div>
                ))}
            </div>

        </div>
    );
};
