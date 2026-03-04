import React, { useMemo, useState } from 'react';
import { Game } from '../../data/mockGames';
import { MatchupEfficiencySection } from './MatchupEfficiencySection';

interface BaseballFieldProps {
    game: Game;
}

const W = 900;
const H = 840;
const HOME_X = W / 2;
const HOME_Y = H - 120;
const BASE_DIST = 220;
const OUTFIELD_R = 530;
const LF_R = 480;
const RF_R = 480;
const FIRST_X = HOME_X + BASE_DIST / Math.SQRT2;
const FIRST_Y = HOME_Y - BASE_DIST / Math.SQRT2;
const SECOND_X = HOME_X;
const SECOND_Y = HOME_Y - BASE_DIST * Math.SQRT2;
const THIRD_X = HOME_X - BASE_DIST / Math.SQRT2;
const THIRD_Y = HOME_Y - BASE_DIST / Math.SQRT2;
const MOUND_X = HOME_X;
const MOUND_Y = HOME_Y - BASE_DIST * Math.SQRT2 * 0.45;

type PlayType = 'hit' | 'out' | 'strikeout' | 'homerun' | 'walk';
const playColor: Record<PlayType, string> = {
    hit: '#22d3ee',
    out: '#ef4444',
    strikeout: '#f97316',
    homerun: '#facc15',
    walk: '#a855f7',
};

const generatePlays = (count: number, isHome: boolean) =>
    Array.from({ length: count }, (_, i) => {
        const type: PlayType = ['hit', 'out', 'strikeout', 'homerun', 'walk'][Math.floor(Math.random() * 5)] as PlayType;
        let x: number, y: number;
        if (type === 'homerun') {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.7;
            const r = OUTFIELD_R - 20 + Math.random() * 30;
            x = HOME_X + r * Math.cos(angle); y = HOME_Y + r * Math.sin(angle);
        } else if (type === 'hit') {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.75;
            const r = 150 + Math.random() * 200;
            x = HOME_X + r * Math.cos(angle); y = HOME_Y + r * Math.sin(angle);
        } else {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
            const r = 80 + Math.random() * 260;
            x = HOME_X + r * Math.cos(angle); y = HOME_Y + r * Math.sin(angle);
        }
        x = Math.max(50, Math.min(W - 50, x));
        y = Math.max(50, Math.min(H - 50, y));
        return { id: `p${i}${isHome ? 'h' : 'a'}`, x, y, type };
    });

export const BaseballField: React.FC<BaseballFieldProps> = ({ game }) => {
    const [filter, setFilter] = useState<'both' | 'home' | 'away'>('both');
    const awayPlays = useMemo(() => generatePlays(15, false), []);
    const homePlays = useMemo(() => generatePlays(15, true), []);

    const visible = [
        ...(filter !== 'home' ? awayPlays.map(p => ({ ...p, team: 'away' as const })) : []),
        ...(filter !== 'away' ? homePlays.map(p => ({ ...p, team: 'home' as const })) : []),
    ];

    const outfieldPath = `M ${HOME_X - LF_R} ${HOME_Y - 60} Q ${HOME_X - OUTFIELD_R} ${HOME_Y - OUTFIELD_R} ${HOME_X} ${HOME_Y - OUTFIELD_R + 20} Q ${HOME_X + OUTFIELD_R} ${HOME_Y - OUTFIELD_R} ${HOME_X + RF_R} ${HOME_Y - 60}`;
    const infieldPath = `M ${HOME_X - 170} ${HOME_Y - 30} Q ${HOME_X} ${HOME_Y - 360} ${HOME_X + 170} ${HOME_Y - 30}`;

    // Mock stats
    const awayHits = awayPlays.filter(p => p.type === 'hit' || p.type === 'homerun').length;
    const homeHits = homePlays.filter(p => p.type === 'hit' || p.type === 'homerun').length;
    const awayHR = awayPlays.filter(p => p.type === 'homerun').length;
    const homeHR = homePlays.filter(p => p.type === 'homerun').length;
    const awayKs = awayPlays.filter(p => p.type === 'strikeout').length;
    const homeKs = homePlays.filter(p => p.type === 'strikeout').length;
    const awayTotal = awayPlays.length;
    const homeTotal = homePlays.length;
    const awayBA = awayTotal > 0 ? (awayHits / awayTotal * 1000) / 10 : 0;
    const homeBA = homeTotal > 0 ? (homeHits / homeTotal * 1000) / 10 : 0;

    const effRows = [
        { label: 'Batting Avg', awayVal: `.${String(Math.round(awayBA * 10)).padStart(3, '0')}`, homeVal: `.${String(Math.round(homeBA * 10)).padStart(3, '0')}`, awayPct: awayBA, homePct: homeBA },
        { label: 'Home Runs', awayVal: `${awayHR}`, homeVal: `${homeHR}`, awayPct: Math.min(awayHR * 15, 100), homePct: Math.min(homeHR * 15, 100) },
        { label: 'Strikeouts (K)', awayVal: `${awayKs}`, homeVal: `${homeKs}`, awayPct: Math.min(awayKs * 12, 100), homePct: Math.min(homeKs * 12, 100) },
        { label: 'OBP', awayVal: `.${Math.round(awayBA + 7)}0`, homeVal: `.${Math.round(homeBA + 7)}0`, awayPct: awayBA + 7, homePct: homeBA + 7 },
    ];

    return (
        <div className="terminal-panel mt-6 overflow-hidden col-span-12">
            <div className="p-4 border-b border-border-muted flex flex-wrap items-center justify-between gap-3 bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400 text-sm">sports_baseball</span>
                    Hit & Play Field Chart
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

            <div className="p-4 bg-[#111827] flex justify-center w-full overflow-hidden">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[800px] h-auto drop-shadow-2xl" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Baseball field">
                    <defs>
                        {/* Outfield Grass Gradient */}
                        <radialGradient id="bbGrassSubtle" cx="50%" cy="75%" r="75%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="60%" stopColor="#16a34a" />
                            <stop offset="100%" stopColor="#15803d" />
                        </radialGradient>
                        <linearGradient id="dirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#d97706" />
                            <stop offset="100%" stopColor="#b45309" />
                        </linearGradient>
                    </defs>

                    {/* Outer dark background (stands area) */}
                    <rect x={0} y={0} width={W} height={H} fill="#0f172a" rx={8} />

                    {/* Grass Field */}
                    <path d={`${outfieldPath} L ${HOME_X + RF_R} ${HOME_Y} L ${HOME_X - LF_R} ${HOME_Y} Z`} fill="url(#bbGrassSubtle)" />

                    {/* Warning Track */}
                    <path d={outfieldPath} fill="none" stroke="#78350f" strokeWidth={18} strokeOpacity={0.8} />
                    <path d={outfieldPath} fill="none" stroke="#fcd34d" strokeWidth={2} strokeOpacity={0.6} strokeDasharray="10 6" />

                    {/* Foul Lines */}
                    <line x1={HOME_X} y1={HOME_Y} x2={HOME_X - LF_R} y2={HOME_Y - LF_R * 1.05} stroke="#ffffff" strokeWidth={3} opacity={0.8} />
                    <line x1={HOME_X} y1={HOME_Y} x2={HOME_X + RF_R} y2={HOME_Y - RF_R * 1.05} stroke="#ffffff" strokeWidth={3} opacity={0.8} />

                    {/* Infield Dirt */}
                    <path d={`${infieldPath} L ${HOME_X} ${HOME_Y} Z`} fill="url(#dirtGradient)" stroke="#78350f" strokeWidth={4} />

                    {/* Infield Grass */}
                    <polygon points={`${HOME_X},${HOME_Y - 24} ${FIRST_X - 18},${FIRST_Y + 6} ${SECOND_X},${SECOND_Y + 28} ${THIRD_X + 18},${THIRD_Y + 6}`} fill="#16a34a" stroke="#15803d" strokeWidth={2} />

                    {/* Base Paths outline */}
                    <polygon points={`${HOME_X},${HOME_Y} ${FIRST_X},${FIRST_Y} ${SECOND_X},${SECOND_Y} ${THIRD_X},${THIRD_Y}`} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />

                    {/* Pitcher's Mound */}
                    <circle cx={MOUND_X} cy={MOUND_Y} r={28} fill="url(#dirtGradient)" stroke="#78350f" strokeWidth={2} />
                    {/* Pitcher's Plate */}
                    <rect x={MOUND_X - 6} y={MOUND_Y - 2} width={12} height={4} fill="#ffffff" rx={1} />

                    {/* Bases (1st, 2nd, 3rd) */}
                    {[[FIRST_X, FIRST_Y], [SECOND_X, SECOND_Y], [THIRD_X, THIRD_Y]].map(([bx, by], i) => (
                        <g key={i} transform={`translate(${bx}, ${by}) rotate(45)`}>
                            <rect x={-10} y={-10} width={20} height={20} fill="#ffffff" rx={2} stroke="#cbd5e1" strokeWidth={2} />
                        </g>
                    ))}

                    {/* Home Plate */}
                    <path d={`M ${HOME_X - 12} ${HOME_Y - 12} L ${HOME_X + 12} ${HOME_Y - 12} L ${HOME_X + 12} ${HOME_Y} L ${HOME_X} ${HOME_Y + 12} L ${HOME_X - 12} ${HOME_Y} Z`} fill="#ffffff" stroke="#cbd5e1" strokeWidth={2} />

                    {/* Home Logo */}
                    {game.homeTeam.logo && (
                        <image href={game.homeTeam.logo} x={HOME_X - 60} y={HOME_Y - BASE_DIST * Math.SQRT2 * 0.65 - 10} width={120} height={120} opacity={0.25} preserveAspectRatio="xMidYMid meet" />
                    )}

                    {/* Distance Markers */}
                    <text x={HOME_X} y={HOME_Y - OUTFIELD_R + 50} textAnchor="middle" fontSize={14} fill="#fbbf24" fontFamily="monospace" fontWeight={900}>400</text>
                    <text x={HOME_X - LF_R + 50} y={HOME_Y - 60} textAnchor="middle" fontSize={13} fill="#fbbf24" fontFamily="monospace" fontWeight={900}>330</text>
                    <text x={HOME_X + RF_R - 50} y={HOME_Y - 60} textAnchor="middle" fontSize={13} fill="#fbbf24" fontFamily="monospace" fontWeight={900}>330</text>

                    {/* Team Names in Outfield */}
                    <text x={HOME_X - 220} y={90} textAnchor="middle" fontSize={18} fontWeight={900} fill="#93c5fd" opacity={0.7} fontFamily="monospace" letterSpacing="4">{game.awayTeam.name.toUpperCase()}</text>
                    <text x={HOME_X + 220} y={90} textAnchor="middle" fontSize={18} fontWeight={900} fill="#6ee7b7" opacity={0.7} fontFamily="monospace" letterSpacing="4">{game.homeTeam.name.toUpperCase()}</text>

                    {visible.map(p => {
                        const col = playColor[p.type];
                        const r = p.type === 'homerun' ? 7 : 5;
                        return (
                            <circle key={p.id} cx={p.x} cy={p.y} r={r} fill={col} opacity={0.85} style={{ filter: `drop-shadow(0 0 4px ${col})` }}>
                                <title>{`${p.team === 'home' ? game.homeTeam.name : game.awayTeam.name} • ${p.type}`}</title>
                            </circle>
                        );
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
                footNote="MLB efficiency stats based on simulated at-bat data for this matchup"
            />
        </div>
    );
};
