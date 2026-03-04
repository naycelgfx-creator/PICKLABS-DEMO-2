import React, { useState, useMemo } from 'react';
import { Game } from '../../../data/mockGames';
import { ShotData, generateMockShotData } from '../../../data/mockNbaData';

interface NBAShotChartProps {
    game: Game;
}

export const NBAShotChart: React.FC<NBAShotChartProps> = ({ game }) => {
    const [quarterFilter, setQuarterFilter] = useState<'All' | number>('All');
    const [playTypeFilter, setPlayTypeFilter] = useState<'All' | ShotData['playType']>('All');
    const [playerFilter, setPlayerFilter] = useState<'All Players' | string>('All Players'); // Mocking filter for display

    // Generate static shots for this game instance
    const shots = useMemo(() => generateMockShotData(250), []);

    const filteredShots = useMemo(() => {
        return shots.filter(shot => {
            const matchQtr = quarterFilter === 'All' || shot.quarter === quarterFilter;
            const matchType = playTypeFilter === 'All' || shot.playType === playTypeFilter;
            return matchQtr && matchType;
        });
    }, [shots, quarterFilter, playTypeFilter]);

    return (
        <div className="terminal-panel p-6 border-accent-purple/30 bg-accent-purple/5 col-span-12 lg:col-span-8 flex flex-col min-h-[500px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-muted pb-4 mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">sports_basketball</span>
                    <h2 className="text-xl font-black text-text-main uppercase italic tracking-[0.2em]">Live Shot Chart</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                    <select
                        className="bg-neutral-900 border border-border-muted text-white text-[10px] font-bold uppercase rounded px-3 py-1.5 focus:border-primary outline-none custom-select cursor-pointer hover:bg-neutral-800 transition-colors"
                        value={quarterFilter}
                        onChange={(e) => setQuarterFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                        title="Quarter Filter"
                    >
                        <option value="All">All Quarters</option>
                        <option value={1}>1st Quarter</option>
                        <option value={2}>2nd Quarter</option>
                        <option value={3}>3rd Quarter</option>
                        <option value={4}>4th Quarter</option>
                    </select>

                    <select
                        className="bg-neutral-900 border border-border-muted text-white text-[10px] font-bold uppercase rounded px-3 py-1.5 focus:border-primary outline-none custom-select cursor-pointer hover:bg-neutral-800 transition-colors"
                        value={playTypeFilter}
                        onChange={(e) => setPlayTypeFilter(e.target.value as ShotData['playType'] | 'All')}
                        title="Play Type Filter"
                    >
                        <option value="All">All Play Types</option>
                        <option value="Jump Shot">Jump Shot</option>
                        <option value="Layup">Layup</option>
                        <option value="Dunk">Dunk</option>
                        <option value="Three Pointer">Three Pointer</option>
                    </select>

                    <select
                        className="bg-neutral-900 border border-border-muted text-white text-[10px] font-bold uppercase rounded px-3 py-1.5 focus:border-primary outline-none custom-select cursor-pointer hover:bg-neutral-800 transition-colors"
                        value={playerFilter}
                        onChange={(e) => setPlayerFilter(e.target.value)}
                        title="Player Filter"
                    >
                        <option value="All Players">All Players</option>
                        <option value="Star">Star Player (Mock)</option>
                    </select>
                </div>
            </div>

            <div className="relative flex-1 bg-white dark:bg-neutral-900/40 border border-border-muted rounded-lg overflow-hidden flex items-center justify-center p-4 min-h-[400px]">

                {/* Full CSS Basketball Court Representation (Horizontal) */}
                <div className="relative w-[500px] h-[300px] sm:w-[800px] sm:h-[440px] border-2 border-border-muted bg-[#cd853f] opacity-80" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

                    {/* Half Court Line */}
                    <div className="absolute top-0 left-1/2 h-full w-[2px] bg-border-muted -translate-x-1/2"></div>

                    {/* Center Circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] border-2 border-border-muted rounded-full bg-[#cd853f] z-0 flex items-center justify-center">
                    </div>

                    {/* --- LEFT HALF (AWAY TEAM DEFENDING / HOME OFFENSE) --- */}
                    {/* Paint */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[190px] h-[160px] border-y-2 border-r-2 border-border-muted bg-orange-900/40"></div>
                    {/* Free Throw Circle */}
                    <div className="absolute top-1/2 left-[190px] -translate-y-1/2 -translate-x-1/2 w-[120px] h-[120px] border-2 border-border-muted rounded-full bg-transparent"></div>
                    {/* 3 Point Line */}
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[250px] h-[340px] border-y-2 border-r-2 border-border-muted rounded-r-full bg-transparent" style={{ borderLeft: 'none' }}></div>
                    <div className="absolute top-[50px] sm:top-[50px] left-0 w-[100px] h-[2px] bg-border-muted"></div>
                    <div className="absolute bottom-[50px] sm:bottom-[50px] left-0 w-[100px] h-[2px] bg-border-muted"></div>
                    {/* Hoop */}
                    <div className="absolute top-1/2 left-[30px] -translate-y-1/2 w-[30px] h-[30px] border-4 border-[#ff4500] rounded-full bg-transparent shadow-[0_0_10px_rgba(255,69,0,0.5)] z-10"></div>
                    {/* Backboard */}
                    <div className="absolute top-1/2 left-[20px] -translate-y-1/2 h-[60px] w-[4px] bg-white z-10"></div>

                    {/* --- RIGHT HALF (HOME TEAM DEFENDING / AWAY OFFENSE) --- */}
                    {/* Paint */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[190px] h-[160px] border-y-2 border-l-2 border-border-muted bg-orange-900/40"></div>
                    {/* Free Throw Circle */}
                    <div className="absolute top-1/2 right-[190px] -translate-y-1/2 translate-x-1/2 w-[120px] h-[120px] border-2 border-border-muted rounded-full bg-transparent"></div>
                    {/* 3 Point Line */}
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[250px] h-[340px] border-y-2 border-l-2 border-border-muted rounded-l-full bg-transparent" style={{ borderRight: 'none' }}></div>
                    <div className="absolute top-[50px] sm:top-[50px] right-0 w-[100px] h-[2px] bg-border-muted"></div>
                    <div className="absolute bottom-[50px] sm:bottom-[50px] right-0 w-[100px] h-[2px] bg-border-muted"></div>
                    {/* Hoop */}
                    <div className="absolute top-1/2 right-[30px] -translate-y-1/2 w-[30px] h-[30px] border-4 border-[#ff4500] rounded-full bg-transparent shadow-[0_0_10px_rgba(255,69,0,0.5)] z-10"></div>
                    {/* Backboard */}
                    <div className="absolute top-1/2 right-[20px] -translate-y-1/2 h-[60px] w-[4px] bg-white z-10"></div>

                    {/* Scattered Shots */}
                    {filteredShots.map(shot => {
                        const tailwindColor = shot.teamId === 'home' ? game.homeTeam.color : game.awayTeam.color;
                        const shotColor = tailwindColor.includes('primary') ? '#10b981' : tailwindColor.includes('purple') ? '#8b5cf6' : '#3b82f6';

                        return (
                            <div
                                key={shot.id}
                                className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${shot.isMade ? 'z-20' : 'bg-red-500/50 border border-red-900 z-10'}`}
                                style={{
                                    // In a horizontal view, swap X and Y properties appropriately
                                    // Since our generated shots mapped to Y (length) and X (width) for a vertical court...
                                    // We reverse that: mapping previous Y to current X, and previous X to current Y.
                                    left: `${shot.y}%`,
                                    top: `${shot.x}%`,
                                    backgroundColor: shot.isMade ? shotColor : undefined,
                                    boxShadow: shot.isMade ? `0 0 8px ${shotColor}` : undefined,
                                    opacity: shot.isMade ? 0.9 : 0.6
                                }}
                                title={`${shot.playType} - ${shot.isMade ? 'Made' : 'Missed'} (Q${shot.quarter}) by ${shot.teamId === 'home' ? game.homeTeam.name : game.awayTeam.name}`}
                            />
                        );
                    })}

                </div>

            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {game.awayTeam.logo ? (
                            <img src={game.awayTeam.logo} alt="Away Logo" className="w-5 h-5 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]" />
                        ) : (
                            <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" style={{ backgroundColor: game.awayTeam.color.includes('primary') ? '#10b981' : game.awayTeam.color.includes('purple') ? '#8b5cf6' : '#3b82f6' }}></div>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white truncate max-w-[100px]">
                            {game.awayTeam.name}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {game.homeTeam.logo ? (
                            <img src={game.homeTeam.logo} alt="Home Logo" className="w-5 h-5 object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.4)]" />
                        ) : (
                            <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" style={{ backgroundColor: game.homeTeam.color.includes('primary') ? '#10b981' : game.homeTeam.color.includes('purple') ? '#8b5cf6' : '#3b82f6' }}></div>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white truncate max-w-[100px]">
                            {game.homeTeam.name}
                        </span>
                    </div>
                </div>

                <div className="w-[1px] h-4 bg-border-muted hidden sm:block"></div>

                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-900"></div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Missed</span>
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase italic">
                    Showing {filteredShots.length} Shots
                </div>
            </div>

        </div>
    );
};
