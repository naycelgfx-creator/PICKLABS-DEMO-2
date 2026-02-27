import React, { useMemo, useState } from 'react';
import { Game } from '../../data/mockGames';
import { MatchupEfficiencySection } from './MatchupEfficiencySection';

interface NFLFieldProps {
    game: Game;
}

const W = 1200;
const H = 533;
const YARD = W / 120;
const EZ = YARD * 10;
const CX = W / 2;
const CY = H / 2;

type PlayType = 'run' | 'pass' | 'kick' | 'sack';
const playColor: Record<PlayType, string> = {
    run: '#f97316',
    pass: '#22d3ee',
    kick: '#facc15',
    sack: '#ef4444',
};

const generatePlays = (count: number, forRight: boolean) =>
    Array.from({ length: count }, (_, i) => {
        const type: PlayType = ['run', 'pass', 'kick', 'sack'][Math.floor(Math.random() * 4)] as PlayType;
        let x = EZ + YARD * 5 + Math.random() * (W / 2 - EZ - YARD * 5);
        const y = 30 + Math.random() * (H - 60);
        if (forRight) x = W - x;
        return { id: `p${i}`, x, y, type, gain: Math.floor(Math.random() * 20) - 5 };
    });

const yardLines = Array.from({ length: 9 }, (_, i) => i + 1);

export const NFLField: React.FC<NFLFieldProps> = ({ game }) => {
    const [filter, setFilter] = useState<'both' | 'home' | 'away'>('both');
    const awayPlays = useMemo(() => generatePlays(18, false), []);
    const homePlays = useMemo(() => generatePlays(18, true), []);

    const visible = [
        ...(filter !== 'home' ? awayPlays.map(p => ({ ...p, team: 'away' as const })) : []),
        ...(filter !== 'away' ? homePlays.map(p => ({ ...p, team: 'home' as const })) : []),
    ];

    // Mock efficiency stats
    const awayCompPct = 60 + Math.floor((awayPlays.filter(p => p.type === 'pass').length * 7) % 22);
    const homeCompPct = 60 + Math.floor((homePlays.filter(p => p.type === 'pass').length * 7) % 22);
    const awayYPP = (4.5 + (awayPlays.reduce((s, p) => s + Math.abs(p.gain), 0) / awayPlays.length * 0.15)).toFixed(1);
    const homeYPP = (4.5 + (homePlays.reduce((s, p) => s + Math.abs(p.gain), 0) / homePlays.length * 0.15)).toFixed(1);
    const awayRuns = awayPlays.filter(p => p.type === 'run').length;
    const homeRuns = homePlays.filter(p => p.type === 'run').length;
    const aTotal = awayRuns + awayPlays.filter(p => p.type === 'pass').length;
    const hTotal = homeRuns + homePlays.filter(p => p.type === 'pass').length;

    const effRows = [
        { label: 'Completion %', awayVal: `${awayCompPct}%`, homeVal: `${homeCompPct}%`, awayPct: awayCompPct, homePct: homeCompPct },
        { label: 'Yds Per Play', awayVal: awayYPP, homeVal: homeYPP, awayPct: (parseFloat(awayYPP) / 12) * 100, homePct: (parseFloat(homeYPP) / 12) * 100 },
        { label: 'Run Rate', awayVal: `${aTotal > 0 ? Math.round(awayRuns / aTotal * 100) : 0}%`, homeVal: `${hTotal > 0 ? Math.round(homeRuns / hTotal * 100) : 0}%`, awayPct: aTotal > 0 ? awayRuns / aTotal * 100 : 0, homePct: hTotal > 0 ? homeRuns / hTotal * 100 : 0 },
        { label: 'Sacks Allowed', awayVal: `${awayPlays.filter(p => p.type === 'sack').length}`, homeVal: `${homePlays.filter(p => p.type === 'sack').length}`, awayPct: Math.min(awayPlays.filter(p => p.type === 'sack').length * 20, 100), homePct: Math.min(homePlays.filter(p => p.type === 'sack').length * 20, 100) },
    ];

    return (
        <div className="terminal-panel mt-6 overflow-hidden col-span-12">
            <div className="p-4 border-b border-border-muted flex flex-wrap items-center justify-between gap-3 bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500 text-sm">sports_football</span>
                    Play-by-Play Field Chart
                </h3>
                <div className="flex gap-1">
                    {(['both', 'away', 'home'] as const).map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`text-[9px] font-black uppercase px-2.5 py-1 rounded border transition-all ${filter === s ? 'bg-primary/20 border-primary text-primary' : 'border-border-muted text-slate-500 hover:border-slate-500'}`}
                        >
                            {s === 'both' ? 'Both' : s === 'away' ? game.awayTeam.name : game.homeTeam.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-background-dark">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="NFL field">
                    <defs>
                        <linearGradient id="nflGrass2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14532d" />
                            <stop offset="100%" stopColor="#166534" />
                        </linearGradient>
                        <pattern id="nflStripes2" x="0" y="0" width={YARD * 10} height={H} patternUnits="userSpaceOnUse">
                            <rect x="0" y="0" width={YARD * 10} height={H} fill="rgba(255,255,255,0.03)" />
                            <rect x={YARD * 5} y="0" width={YARD * 5} height={H} fill="rgba(0,0,0,0.035)" />
                        </pattern>
                    </defs>
                    <rect x={0} y={0} width={W} height={H} fill="url(#nflGrass2)" rx={4} />
                    <rect x={0} y={0} width={W} height={H} fill="url(#nflStripes2)" rx={4} />
                    <rect x={0} y={0} width={EZ} height={H} fill="rgba(59,130,246,0.25)" />
                    <rect x={W - EZ} y={0} width={EZ} height={H} fill="rgba(16,185,129,0.25)" />
                    <text x={EZ / 2} y={CY + 5} textAnchor="middle" fontSize={13} fontWeight={900} fill="rgba(147,197,253,0.9)" fontFamily="monospace" transform={`rotate(-90, ${EZ / 2}, ${CY})`}>{game.awayTeam.name.toUpperCase()}</text>
                    <text x={W - EZ / 2} y={CY + 5} textAnchor="middle" fontSize={13} fontWeight={900} fill="rgba(110,231,183,0.9)" fontFamily="monospace" transform={`rotate(90, ${W - EZ / 2}, ${CY})`}>{game.homeTeam.name.toUpperCase()}</text>
                    <rect x={EZ} y={5} width={W - EZ * 2} height={H - 10} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
                    {Array.from({ length: 19 }, (_, i) => {
                        const x = EZ + YARD * 5 * (i + 1);
                        if (x >= W - EZ) return null;
                        const isMajor = i % 2 === 1;
                        return <line key={i} x1={x} y1={5} x2={x} y2={H - 5} stroke={`rgba(255,255,255,${isMajor ? 0.5 : 0.2})`} strokeWidth={isMajor ? 1.5 : 0.8} />;
                    })}
                    {Array.from({ length: 100 }, (_, i) => {
                        const x = EZ + YARD * i;
                        if (x >= W - EZ) return null;
                        return (
                            <g key={i}>
                                <line x1={x} y1={H * 0.28} x2={x} y2={H * 0.28 + 8} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
                                <line x1={x} y1={H * 0.72 - 8} x2={x} y2={H * 0.72} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
                            </g>
                        );
                    })}
                    {yardLines.map(i => {
                        const xPos = EZ + YARD * 10 * i;
                        const num = i <= 5 ? i * 10 : (10 - i) * 10;
                        return <text key={i} x={xPos} y={38} textAnchor="middle" fontSize={18} fontWeight={900} fill="rgba(255,255,255,0.55)" fontFamily="monospace">{num}</text>;
                    })}
                    <line x1={CX} y1={0} x2={CX} y2={H} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />

                    {/* BIGGER HOME LOGO at midfield */}
                    {game.homeTeam.logo && (
                        <image href={game.homeTeam.logo} x={CX - 65} y={CY - 65} width={130} height={130} opacity={0.20} preserveAspectRatio="xMidYMid meet" />
                    )}

                    {/* Goal posts */}
                    <line x1={EZ} y1={CY} x2={EZ - 12} y2={CY} stroke="rgba(255,220,0,0.8)" strokeWidth={2.5} />
                    <line x1={EZ - 12} y1={CY - 40} x2={EZ - 12} y2={CY + 40} stroke="rgba(255,220,0,0.8)" strokeWidth={2.5} />
                    <line x1={EZ - 12} y1={CY - 40} x2={EZ - 27} y2={CY - 40} stroke="rgba(255,220,0,0.8)" strokeWidth={2} />
                    <line x1={EZ - 12} y1={CY + 40} x2={EZ - 27} y2={CY + 40} stroke="rgba(255,220,0,0.8)" strokeWidth={2} />
                    <line x1={W - EZ} y1={CY} x2={W - EZ + 12} y2={CY} stroke="rgba(255,220,0,0.8)" strokeWidth={2.5} />
                    <line x1={W - EZ + 12} y1={CY - 40} x2={W - EZ + 12} y2={CY + 40} stroke="rgba(255,220,0,0.8)" strokeWidth={2.5} />
                    <line x1={W - EZ + 12} y1={CY - 40} x2={W - EZ + 27} y2={CY - 40} stroke="rgba(255,220,0,0.8)" strokeWidth={2} />
                    <line x1={W - EZ + 12} y1={CY + 40} x2={W - EZ + 27} y2={CY + 40} stroke="rgba(255,220,0,0.8)" strokeWidth={2} />

                    {visible.map(p => {
                        const col = playColor[p.type];
                        return <circle key={p.id} cx={p.x} cy={p.y} r={6} fill={col} opacity={0.85} style={{ filter: `drop-shadow(0 0 4px ${col})` }}><title>{`${p.team === 'home' ? game.homeTeam.name : game.awayTeam.name} ${p.type} • ${p.gain > 0 ? '+' : ''}${p.gain} yds`}</title></circle>;
                    })}
                </svg>
            </div>

            <div className="p-3 border-t border-border-muted flex flex-wrap justify-center gap-4 bg-background-dark">
                {Object.entries(playColor).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                        <span className="text-[9px] font-black uppercase text-slate-400">{type}</span>
                    </div>
                ))}
            </div>

            {/* ── Matchup Efficiency ── */}
            <MatchupEfficiencySection
                game={game}
                icon="analytics"
                rows={effRows}
                footNote="NFL efficiency stats based on simulated play-by-play data for this matchup"
            />
        </div>
    );
};
