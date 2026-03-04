import React, { useMemo, useState } from 'react';
import { Game } from '../../data/mockGames';
import { MatchupEfficiencySection } from './MatchupEfficiencySection';

interface HockeyRinkProps {
    game: Game;
}

const W = 2000;
const H = 850;
const CX = W / 2;
const CY = H / 2;
const CORNER_R = 170;
const CREASE_R = 120;
const FO_R = 265;
const BLUE_LINE = 500;
const GOAL_LINE = 150;
const NZ_DOT_X = 340;
const DZ_DOT_X = 380;
const DZ_DOT_Y = CY - 230;

type ShotType = 'shot_on_goal' | 'missed' | 'blocked' | 'goal';
const shotColor: Record<ShotType, string> = {
    shot_on_goal: '#22d3ee',
    missed: '#f97316',
    blocked: '#a855f7',
    goal: '#facc15',
};

const generateShots = (count: number, isHome: boolean) => Array.from({ length: count }, (_, i) => {
    const type: ShotType = (['shot_on_goal', 'missed', 'blocked', 'goal'] as ShotType[])[Math.floor(Math.random() * 4)];
    const zone = GOAL_LINE + Math.random() * (BLUE_LINE - GOAL_LINE + 60);
    const x = isHome ? W - zone : zone;
    const y = CY + (Math.random() - 0.5) * (H - 100);
    return { id: `p${i}${isHome ? 'h' : 'a'}`, x, y, type, period: Math.ceil(Math.random() * 3) };
});

const FaceOffCircle: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
    <g>
        <circle cx={cx} cy={cy} r={FO_R} fill="none" stroke="rgba(239,68,68,0.6)" strokeWidth={2.5} />
        {[-1, 1].map((s, i) => (
            <g key={i}>
                <line x1={cx + s * (FO_R - 40)} y1={cy - 40} x2={cx + s * (FO_R - 40)} y2={cy + 40} stroke="rgba(239,68,68,0.5)" strokeWidth={2} />
                <line x1={cx - 60} y1={cy + s * 80} x2={cx + 60} y2={cy + s * 80} stroke="rgba(239,68,68,0.5)" strokeWidth={2} />
            </g>
        ))}
        <circle cx={cx} cy={cy} r={6} fill="rgba(239,68,68,0.7)" />
    </g>
);

export const HockeyRink: React.FC<HockeyRinkProps> = ({ game }) => {
    const [filter, setFilter] = useState<'both' | 'home' | 'away'>('both');
    const [periodFilter, setPeriodFilter] = useState<0 | 1 | 2 | 3>(0);

    const awayShots = useMemo(() => generateShots(18, false), []);
    const homeShots = useMemo(() => generateShots(18, true), []);

    let visible = [
        ...(filter !== 'home' ? awayShots.map(s => ({ ...s, team: 'away' as const })) : []),
        ...(filter !== 'away' ? homeShots.map(s => ({ ...s, team: 'home' as const })) : []),
    ];
    if (periodFilter > 0) visible = visible.filter(s => s.period === periodFilter);

    const awaySOG = awayShots.filter(s => s.type === 'shot_on_goal' || s.type === 'goal').length;
    const homeSOG = homeShots.filter(s => s.type === 'shot_on_goal' || s.type === 'goal').length;
    const awayGoals = awayShots.filter(s => s.type === 'goal').length;
    const homeGoals = homeShots.filter(s => s.type === 'goal').length;
    const awayBlocked = awayShots.filter(s => s.type === 'blocked').length;
    const homeBlocked = homeShots.filter(s => s.type === 'blocked').length;
    const awaySavePct = awaySOG > 0 ? Math.round((1 - awayGoals / (awaySOG + homeSOG + 1)) * 100) : 94;
    const homeSavePct = homeSOG > 0 ? Math.round((1 - homeGoals / (homeSOG + awaySOG + 1)) * 100) : 94;
    const awayFaceoff = 40 + (awayShots.length * 3) % 25;
    const homeFaceoff = 100 - awayFaceoff;

    const effRows = [
        { label: 'Shots on Goal', awayVal: `${awaySOG}`, homeVal: `${homeSOG}`, awayPct: Math.min(awaySOG * 5, 100), homePct: Math.min(homeSOG * 5, 100) },
        { label: 'Goals', awayVal: `${awayGoals}`, homeVal: `${homeGoals}`, awayPct: Math.min(awayGoals * 20, 100), homePct: Math.min(homeGoals * 20, 100) },
        { label: 'Save %', awayVal: `${awaySavePct}%`, homeVal: `${homeSavePct}%`, awayPct: awaySavePct, homePct: homeSavePct },
        { label: 'Shots Blocked', awayVal: `${awayBlocked}`, homeVal: `${homeBlocked}`, awayPct: Math.min(awayBlocked * 12, 100), homePct: Math.min(homeBlocked * 12, 100) },
        { label: 'Faceoff Win %', awayVal: `${awayFaceoff}%`, homeVal: `${homeFaceoff}%`, awayPct: awayFaceoff, homePct: homeFaceoff },
    ];

    const rinkPath = `M ${CORNER_R} 0 L ${W - CORNER_R} 0 Q ${W} 0 ${W} ${CORNER_R} L ${W} ${H - CORNER_R} Q ${W} ${H} ${W - CORNER_R} ${H} L ${CORNER_R} ${H} Q 0 ${H} 0 ${H - CORNER_R} L 0 ${CORNER_R} Q 0 0 ${CORNER_R} 0 Z`;

    return (
        <div className="terminal-panel mt-6 overflow-hidden col-span-12">
            <div className="p-4 border-b border-border-muted flex flex-wrap items-center justify-between gap-3 bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-sm">sports_hockey</span>
                    Shot Map · Full Rink
                    <span className="text-slate-500">|</span>
                    <span className="text-cyan-400">{game.awayTeam.name} {awaySOG} SOG</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-primary">{game.homeTeam.name} {homeSOG} SOG</span>
                </h3>
                <div className="flex flex-wrap gap-1">
                    {(['both', 'away', 'home'] as const).map(s => (
                        <button key={s} onClick={() => setFilter(s)} className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-all ${filter === s ? 'bg-primary/20 border-primary text-primary' : 'border-border-muted text-slate-500 hover:border-slate-500'}`}>
                            {s === 'both' ? 'Both' : s === 'away' ? game.awayTeam.name : game.homeTeam.name}
                        </button>
                    ))}
                    {([0, 1, 2, 3] as const).map(p => (
                        <button key={p} onClick={() => setPeriodFilter(p)} className={`text-[9px] font-black uppercase px-2 py-1 rounded border transition-all ${periodFilter === p ? 'bg-accent-purple/20 border-accent-purple text-accent-purple' : 'border-border-muted text-slate-500 hover:border-slate-500'}`}>
                            {p === 0 ? 'All' : `P${p}`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-background-dark">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Hockey rink">
                    <defs>
                        <clipPath id="rinkClip2"><path d={rinkPath} /></clipPath>
                        <linearGradient id="iceGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.04" />
                        </linearGradient>
                    </defs>
                    <path d={rinkPath} fill="#0c1829" />
                    <path d={rinkPath} fill="url(#iceGrad2)" />
                    <path d={rinkPath} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={4} />
                    <line x1={CX} y1={0} x2={CX} y2={H} stroke="rgba(239,68,68,0.7)" strokeWidth={5} strokeDasharray="16 10" clipPath="url(#rinkClip2)" />
                    <line x1={CX - BLUE_LINE} y1={0} x2={CX - BLUE_LINE} y2={H} stroke="rgba(59,130,246,0.8)" strokeWidth={4} clipPath="url(#rinkClip2)" />
                    <line x1={CX + BLUE_LINE} y1={0} x2={CX + BLUE_LINE} y2={H} stroke="rgba(59,130,246,0.8)" strokeWidth={4} clipPath="url(#rinkClip2)" />
                    <line x1={GOAL_LINE} y1={0} x2={GOAL_LINE} y2={H} stroke="rgba(239,68,68,0.5)" strokeWidth={2.5} />
                    <line x1={W - GOAL_LINE} y1={0} x2={W - GOAL_LINE} y2={H} stroke="rgba(239,68,68,0.5)" strokeWidth={2.5} />
                    <path d={`M ${GOAL_LINE} ${CY - CREASE_R} A ${CREASE_R} ${CREASE_R} 0 0 1 ${GOAL_LINE} ${CY + CREASE_R}`} fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.7)" strokeWidth={2} />
                    <path d={`M ${W - GOAL_LINE} ${CY - CREASE_R} A ${CREASE_R} ${CREASE_R} 0 0 0 ${W - GOAL_LINE} ${CY + CREASE_R}`} fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.7)" strokeWidth={2} />
                    <rect x={GOAL_LINE - 60} y={CY - 55} width={60} height={110} fill="rgba(59,130,246,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5} rx={4} />
                    <rect x={W - GOAL_LINE} y={CY - 55} width={60} height={110} fill="rgba(16,185,129,0.12)" stroke="rgba(255,255,255,0.5)" strokeWidth={2.5} rx={4} />
                    <circle cx={CX} cy={CY} r={FO_R} fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth={2.5} />
                    <circle cx={CX} cy={CY} r={14} fill="rgba(239,68,68,0.85)" />

                    {/* BIGGER HOME LOGO at center */}
                    {game.homeTeam.logo && (
                        <image href={game.homeTeam.logo} x={CX - 80} y={CY - 80} width={160} height={160} opacity={0.18} preserveAspectRatio="xMidYMid meet" />
                    )}

                    <FaceOffCircle cx={DZ_DOT_X} cy={DZ_DOT_Y} />
                    <FaceOffCircle cx={DZ_DOT_X} cy={H - DZ_DOT_Y} />
                    <FaceOffCircle cx={W - DZ_DOT_X} cy={DZ_DOT_Y} />
                    <FaceOffCircle cx={W - DZ_DOT_X} cy={H - DZ_DOT_Y} />
                    {[-1, 1].map((s, i) => (
                        <g key={i}>
                            <circle cx={CX - NZ_DOT_X} cy={CY + s * 210} r={8} fill="rgba(239,68,68,0.7)" />
                            <circle cx={CX + NZ_DOT_X} cy={CY + s * 210} r={8} fill="rgba(239,68,68,0.7)" />
                        </g>
                    ))}
                    <text x={GOAL_LINE + 110} y={30} textAnchor="middle" fontSize={16} fontWeight={900} fill="#93c5fd" opacity={0.8} fontFamily="monospace">{game.awayTeam.name.toUpperCase()}</text>
                    <text x={W - GOAL_LINE - 110} y={30} textAnchor="middle" fontSize={16} fontWeight={900} fill="#6ee7b7" opacity={0.8} fontFamily="monospace">{game.homeTeam.name.toUpperCase()}</text>
                    <text x={CX - BLUE_LINE / 2 - 50} y={H - 18} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.25)" fontFamily="monospace" fontWeight={900}>DEF ZONE</text>
                    <text x={CX} y={H - 18} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.25)" fontFamily="monospace" fontWeight={900}>NEUTRAL</text>
                    <text x={CX + BLUE_LINE / 2 + 50} y={H - 18} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.25)" fontFamily="monospace" fontWeight={900}>OFF ZONE</text>

                    {visible.map(s => {
                        const col = shotColor[s.type];
                        return (
                            <circle key={s.id} cx={s.x} cy={s.y} r={s.type === 'goal' ? 8 : 6} fill={col} opacity={0.9} clipPath="url(#rinkClip2)"
                                style={{ filter: s.type === 'goal' ? `drop-shadow(0 0 6px ${col})` : undefined }}>
                                <title>{`${s.team === 'home' ? game.homeTeam.name : game.awayTeam.name} • ${s.type.replace('_', ' ')} • P${s.period}`}</title>
                            </circle>
                        );
                    })}
                </svg>
            </div>

            <div className="p-3 border-t border-border-muted flex flex-wrap justify-center gap-4 bg-background-dark">
                {Object.entries(shotColor).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                        <span className="text-[9px] font-black uppercase text-slate-400">{type.replace('_', ' ')}</span>
                    </div>
                ))}
            </div>

            {/* ── Matchup Efficiency ── */}
            <MatchupEfficiencySection
                game={game}
                icon="analytics"
                rows={effRows}
                footNote="NHL efficiency stats based on simulated shot data for this matchup"
            />
        </div>
    );
};
