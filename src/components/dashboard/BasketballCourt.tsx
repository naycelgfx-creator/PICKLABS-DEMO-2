import React, { useMemo, useState } from 'react';
import { Game } from '../../data/mockGames';
import { ShotData, generateMockShotData } from '../../data/mockNbaData';

interface BasketballCourtProps {
    game: Game;
}

// Viewbox: 940 x 500 (NBA standard proportion)
const W = 940;
const H = 500;
const CX = W / 2;
const CY = H / 2;

// Shot dot
const ShotDot: React.FC<{ cx: number; cy: number; made: boolean; color: string; tip: string }> = ({ cx, cy, made, color, tip }) => (
    <circle
        cx={cx} cy={cy} r={5}
        fill={made ? color : 'none'}
        stroke={made ? color : '#ef4444'}
        strokeWidth={made ? 0 : 1.5}
        opacity={0.85}
        style={{ filter: made ? `drop-shadow(0 0 4px ${color})` : undefined }}
    >
        <title>{tip}</title>
    </circle>
);

// Convert old mockNbaData ShotData (0-100 percentage scale, vertical court) to our SVG coords
function toSVG(shot: ShotData, game: Game): { x: number; y: number; made: boolean; color: string; tip: string } {
    const isHome = shot.teamId === 'home';
    // Old shots: x=0-100 (width%), y=0-100 (top=home hoop, bottom=away hoop)
    // Our SVG court is horizontal: home shoots right, away shoots left
    // Remap: shot.x → y-axis (H), shot.y → x-axis (W)
    let x: number;
    let y: number;
    if (isHome) {
        // Home shoots at right hoop
        x = W - (shot.y / 100) * (W * 0.55);
        y = (shot.x / 100) * H;
    } else {
        // Away shoots at left hoop
        x = (shot.y / 100) * (W * 0.55);
        y = (shot.x / 100) * H;
    }
    x = Math.max(5, Math.min(W - 5, x));
    y = Math.max(5, Math.min(H - 5, y));
    const color = isHome ? '#0ca810' : '#3b82f6';
    const tip = `${isHome ? game.homeTeam.name : game.awayTeam.name} · ${shot.playType} · ${shot.isMade ? 'Made ✓' : 'Missed ✗'} · Q${shot.quarter}`;
    return { x, y, made: shot.isMade, color, tip };
}

// Matchup Efficiency mini-bar
const EffBar: React.FC<{ label: string; val: number; max: number; pct: string; colorClass: string }> = ({ label, val, max, pct, colorClass }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-end">
            <span className="text-[9px] font-black uppercase text-slate-500">{label}</span>
            <span className="text-sm font-black text-text-main italic">{pct}%</span>
        </div>
        <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} transition-all duration-1000 rounded-full`} style={{ width: `${Math.min(Number(pct), 100)}%` }} />
        </div>
        <div className="flex justify-between text-[8px] text-slate-600 uppercase font-black">
            <span>Made: <span className="text-slate-300">{val}</span></span>
            <span>Total: <span className="text-slate-300">{max}</span></span>
        </div>
    </div>
);

export const BasketballCourt: React.FC<BasketballCourtProps> = ({ game }) => {
    const [teamFilter, setTeamFilter] = useState<'both' | 'home' | 'away'>('both');
    const [quarterFilter, setQuarterFilter] = useState<'All' | 1 | 2 | 3 | 4>('All');
    const [playTypeFilter, setPlayTypeFilter] = useState<'All' | ShotData['playType']>('All');

    // Use the richer mock shot data (250 shots, all quarters + play types)
    const allShots = useMemo(() => generateMockShotData(250), []);

    const filteredShots = useMemo(() => {
        return allShots.filter(s => {
            const matchTeam = teamFilter === 'both' || s.teamId === teamFilter;
            const matchQtr = quarterFilter === 'All' || s.quarter === quarterFilter;
            const matchType = playTypeFilter === 'All' || s.playType === playTypeFilter;
            return matchTeam && matchQtr && matchType;
        });
    }, [allShots, teamFilter, quarterFilter, playTypeFilter]);

    const svgShots = useMemo(() => filteredShots.map(s => toSVG(s, game)), [filteredShots, game]);

    // Matchup Efficiency stats from all shots
    const effStats = useMemo(() => {
        const calc = (teamId: 'home' | 'away') => {
            const ts = allShots.filter(s => s.teamId === teamId);
            const made = ts.filter(s => s.isMade).length;
            const threes = ts.filter(s => s.playType === 'Three Pointer');
            const threeMade = threes.filter(s => s.isMade).length;
            const paints = ts.filter(s => s.playType === 'Layup' || s.playType === 'Dunk');
            const paintMade = paints.filter(s => s.isMade).length;
            const efg = ts.length > 0 ? ((made + threeMade * 0.5) / ts.length * 100).toFixed(1) : '0.0';
            return {
                fg: { made, total: ts.length, pct: ts.length > 0 ? (made / ts.length * 100).toFixed(1) : '0.0' },
                threeP: { made: threeMade, total: threes.length, pct: threes.length > 0 ? (threeMade / threes.length * 100).toFixed(1) : '0.0' },
                paint: { made: paintMade, total: paints.length, pct: paints.length > 0 ? (paintMade / paints.length * 100).toFixed(1) : '0.0' },
                efg,
            };
        };
        return { away: calc('away'), home: calc('home') };
    }, [allShots]);

    return (
        <div className="terminal-panel overflow-hidden col-span-12">
            {/* Header */}
            <div className="p-4 border-b border-border-muted flex flex-wrap items-center justify-between gap-3 bg-white/5">
                <h3 className="text-lg font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2 italic">
                    <span className="material-symbols-outlined text-orange-500 text-xl">sports_basketball</span>
                    Shot Chart · Full Court
                </h3>
                <div className="flex flex-wrap gap-1.5">
                    {/* Team filter */}
                    {(['both', 'away', 'home'] as const).map(s => (
                        <button key={s} onClick={() => setTeamFilter(s)}
                            className={`text-[9px] font-black uppercase px-2.5 py-1 rounded border transition-all ${teamFilter === s ? 'bg-primary/20 border-primary text-primary' : 'border-border-muted text-slate-500 hover:border-slate-500'}`}
                        >
                            {s === 'both' ? 'Both Teams' : s === 'away' ? game.awayTeam.name : game.homeTeam.name}
                        </button>
                    ))}
                    {/* Quarter filter */}
                    <select
                        value={quarterFilter}
                        onChange={e => setQuarterFilter(e.target.value === 'All' ? 'All' : Number(e.target.value) as 1 | 2 | 3 | 4)}
                        className="bg-neutral-900 border border-border-muted text-white text-[9px] font-black uppercase rounded px-2.5 py-1 focus:border-primary outline-none cursor-pointer hover:bg-neutral-800 transition-colors"
                        title="Quarter Filter"
                    >
                        <option value="All">All Quarters</option>
                        <option value={1}>Q1</option>
                        <option value={2}>Q2</option>
                        <option value={3}>Q3</option>
                        <option value={4}>Q4</option>
                    </select>
                    {/* Play type filter */}
                    <select
                        value={playTypeFilter}
                        onChange={e => setPlayTypeFilter(e.target.value as ShotData['playType'] | 'All')}
                        className="bg-neutral-900 border border-border-muted text-white text-[9px] font-black uppercase rounded px-2.5 py-1 focus:border-primary outline-none cursor-pointer hover:bg-neutral-800 transition-colors"
                        title="Play Type Filter"
                    >
                        <option value="All">All Play Types</option>
                        <option value="Jump Shot">Jump Shot</option>
                        <option value="Layup">Layup</option>
                        <option value="Dunk">Dunk</option>
                        <option value="Three Pointer">3-Pointer</option>
                    </select>
                </div>
                <span className="text-[9px] text-slate-600 font-black uppercase">{svgShots.length} shots</span>
            </div>

            {/* Shot count bar */}
            <div className="h-0.5 bg-border-muted flex">
                <div className="h-full bg-blue-500/60 transition-all" style={{ width: `${(filteredShots.filter(s => s.teamId === 'away').length / Math.max(allShots.length, 1)) * 100}%` }} />
                <div className="h-full bg-primary/60 transition-all" style={{ flex: 1 }} />
            </div>

            {/* Court SVG */}
            <div className="p-4 bg-background-dark">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full h-auto"
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label="Basketball court shot chart"
                >
                    {/* Court surface — hardwood */}
                    <rect x={0} y={0} width={W} height={H} fill="#8B4513" rx={8} />
                    <rect x={2} y={2} width={W - 4} height={H - 4} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={2} rx={7} />
                    {/* Wood grain lines */}
                    {Array.from({ length: 20 }, (_, i) => (
                        <line key={i} x1={0} y1={i * 26} x2={W} y2={i * 26} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
                    ))}

                    {/* === LEFT HALF (Away offense) === */}
                    <rect x={0} y={CY - 80} width={188} height={160} fill="rgba(0,60,120,0.25)" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                    <rect x={0} y={CY - 60} width={188} height={120} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                    <circle cx={188} cy={CY} r={60} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
                    <path d={`M 30 ${CY - 220} A 238 238 0 0 1 30 ${CY + 220}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} clipPath="url(#leftHalf)" />
                    <line x1={0} y1={CY - 220} x2={30} y2={CY - 220} stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
                    <line x1={0} y1={CY + 220} x2={30} y2={CY + 220} stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
                    <line x1={0} y1={CY - 30} x2={0} y2={CY + 30} stroke="white" strokeWidth={4} />
                    <circle cx={22} cy={CY} r={10} fill="none" stroke="#ff4500" strokeWidth={3} style={{ filter: 'drop-shadow(0 0 5px rgba(255,69,0,0.7))' }} />
                    {/* Restricted area */}
                    <path d={`M 22 ${CY - 30} A 30 30 0 0 1 22 ${CY + 30}`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />

                    {/* === RIGHT HALF (Home offense) === */}
                    <rect x={W - 188} y={CY - 80} width={188} height={160} fill="rgba(0,120,30,0.25)" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                    <rect x={W - 188} y={CY - 60} width={188} height={120} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                    <circle cx={W - 188} cy={CY} r={60} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
                    <path d={`M ${W - 30} ${CY - 220} A 238 238 0 0 0 ${W - 30} ${CY + 220}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} clipPath="url(#rightHalf)" />
                    <line x1={W} y1={CY - 220} x2={W - 30} y2={CY - 220} stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
                    <line x1={W} y1={CY + 220} x2={W - 30} y2={CY + 220} stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
                    <line x1={W} y1={CY - 30} x2={W} y2={CY + 30} stroke="white" strokeWidth={4} />
                    <circle cx={W - 22} cy={CY} r={10} fill="none" stroke="#ff4500" strokeWidth={3} style={{ filter: 'drop-shadow(0 0 5px rgba(255,69,0,0.7))' }} />
                    <path d={`M ${W - 22} ${CY - 30} A 30 30 0 0 0 ${W - 22} ${CY + 30}`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />

                    {/* === CENTER === */}
                    <line x1={CX} y1={0} x2={CX} y2={H} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                    <circle cx={CX} cy={CY} r={60} fill="rgba(0,0,0,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
                    <circle cx={CX} cy={CY} r={6} fill="rgba(255,255,255,0.4)" />
                    {/* Home team logo center */}
                    {game.homeTeam.logo && (
                        <image href={game.homeTeam.logo} x={CX - 30} y={CY - 30} width={60} height={60} opacity={0.18} preserveAspectRatio="xMidYMid meet" />
                    )}

                    {/* Team labels */}
                    <text x={W * 0.18} y={18} textAnchor="middle" fontSize={11} fontWeight={900} fill="#3b82f6" opacity={0.8} fontFamily="monospace">{game.awayTeam.name.toUpperCase()}</text>
                    <text x={W * 0.82} y={18} textAnchor="middle" fontSize={11} fontWeight={900} fill="#0ca810" opacity={0.8} fontFamily="monospace">{game.homeTeam.name.toUpperCase()}</text>

                    {/* Clip paths */}
                    <defs>
                        <clipPath id="leftHalf"><rect x={0} y={0} width={CX} height={H} /></clipPath>
                        <clipPath id="rightHalf"><rect x={CX} y={0} width={CX} height={H} /></clipPath>
                    </defs>

                    {/* Shot dots */}
                    {svgShots.map((s, i) => (
                        <ShotDot key={i} cx={s.x} cy={s.y} made={s.made} color={s.color} tip={s.tip} />
                    ))}
                </svg>
            </div>

            {/* Legend */}
            <div className="px-4 pb-3 flex flex-wrap items-center justify-center gap-5 bg-background-dark border-t border-border-muted/30">
                <div className="flex items-center gap-1.5 pt-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" style={{ boxShadow: '0 0 6px #3b82f6' }} />
                    <span className="text-[9px] text-slate-400 font-black uppercase">{game.awayTeam.name} made</span>
                </div>
                <div className="flex items-center gap-1.5 pt-3">
                    <div className="w-3 h-3 rounded-full bg-primary" style={{ boxShadow: '0 0 6px #0ca810' }} />
                    <span className="text-[9px] text-slate-400 font-black uppercase">{game.homeTeam.name} made</span>
                </div>
                <div className="flex items-center gap-1.5 pt-3">
                    <div className="w-3 h-3 rounded-full border border-red-500" />
                    <span className="text-[9px] text-slate-400 font-black uppercase">missed</span>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* MATCHUP EFFICIENCY */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <div className="border-t border-border-muted bg-accent-purple/5 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-accent-purple text-xl">analytics</span>
                    <h2 className="text-sm font-black text-text-main uppercase italic tracking-[0.2em]">Matchup Efficiency</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Away team */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-border-muted">
                            {game.awayTeam.logo ? (
                                <img src={game.awayTeam.logo} alt="" className="w-6 h-6 object-contain" />
                            ) : null}
                            <h4 className="text-sm font-black text-text-main uppercase tracking-wider">{game.awayTeam.name}</h4>
                            <span className="ml-auto text-[10px] text-blue-400 font-black">eFG {effStats.away.efg}%</span>
                        </div>
                        <EffBar label="Field Goal %" val={effStats.away.fg.made} max={effStats.away.fg.total} pct={effStats.away.fg.pct} colorClass="bg-blue-500" />
                        <EffBar label="3-Point %" val={effStats.away.threeP.made} max={effStats.away.threeP.total} pct={effStats.away.threeP.pct} colorClass="bg-accent-purple" />
                        <EffBar label="Paint %" val={effStats.away.paint.made} max={effStats.away.paint.total} pct={effStats.away.paint.pct} colorClass="bg-cyan-500" />
                    </div>

                    {/* Home team */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2 pb-2 border-b border-border-muted">
                            {game.homeTeam.logo ? (
                                <img src={game.homeTeam.logo} alt="" className="w-6 h-6 object-contain" />
                            ) : null}
                            <h4 className="text-sm font-black text-text-main uppercase tracking-wider">{game.homeTeam.name}</h4>
                            <span className="ml-auto text-[10px] text-primary font-black">eFG {effStats.home.efg}%</span>
                        </div>
                        <EffBar label="Field Goal %" val={effStats.home.fg.made} max={effStats.home.fg.total} pct={effStats.home.fg.pct} colorClass="bg-primary" />
                        <EffBar label="3-Point %" val={effStats.home.threeP.made} max={effStats.home.threeP.total} pct={effStats.home.threeP.pct} colorClass="bg-yellow-500" />
                        <EffBar label="Paint %" val={effStats.home.paint.made} max={effStats.home.paint.total} pct={effStats.home.paint.pct} colorClass="bg-orange-500" />
                    </div>
                </div>

                {/* Head-to-head eFG bar */}
                <div className="mt-6 pt-5 border-t border-border-muted space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500 mb-1">
                        <span>{game.awayTeam.name} eFG {effStats.away.efg}%</span>
                        <span>VS</span>
                        <span>eFG {effStats.home.efg}% {game.homeTeam.name}</span>
                    </div>
                    <div className="h-3 w-full rounded-full overflow-hidden flex">
                        <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${Number(effStats.away.efg)}%` }} />
                        <div className="bg-primary h-full transition-all duration-1000 ml-auto" style={{ width: `${Number(effStats.home.efg)}%` }} />
                    </div>
                    <p className="text-center text-[9px] text-slate-600 font-bold italic">
                        Effective field goal % — weights 3-pointers 1.5× vs. 2-pointers
                    </p>
                </div>
            </div>
        </div>
    );
};
