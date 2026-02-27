import React, { useMemo, useState } from 'react';
import { Game } from '../../data/mockGames';
import { MatchupEfficiencySection } from './MatchupEfficiencySection';

interface SoccerFieldProps {
    game: Game;
}

const W = 1050;
const H = 680;
const CX = W / 2;
const CY = H / 2;

const GOAL_W = 73;
const GOAL_DEPTH = 20;
const P_BOX_W = 403;
const P_BOX_H = 165;
const S_BOX_W = 183;
const S_BOX_H = 55;
const CC_R = 91.5;
const PEN_SPOT = 110;

type PlayType = 'shot' | 'pass' | 'tackle' | 'chance';

const generatePlays = (count: number, forRight: boolean): Array<{
    id: string; x: number; y: number; type: PlayType; successful: boolean;
}> => Array.from({ length: count }, (_, i) => {
    const type: PlayType = ['shot', 'pass', 'tackle', 'chance'][Math.floor(Math.random() * 4)] as PlayType;
    let x = 20 + Math.random() * (W / 2 - 30);
    const y = 30 + Math.random() * (H - 60);
    if (forRight) x = W - x;
    return { id: `p${i}`, x, y, type, successful: Math.random() > 0.4 };
});

const playColor: Record<PlayType, string> = {
    shot: '#f97316',
    pass: '#22d3ee',
    tackle: '#a855f7',
    chance: '#facc15',
};

// Seeded random for stable mock stats
const seed = (n: number) => 30 + (n * 17) % 50;

export const SoccerField: React.FC<SoccerFieldProps> = ({ game }) => {
    const [filter, setFilter] = useState<'both' | 'home' | 'away'>('both');

    const awayPlays = useMemo(() => generatePlays(22, false), []);
    const homePlays = useMemo(() => generatePlays(22, true), []);

    const visible = [
        ...(filter !== 'home' ? awayPlays.map(p => ({ ...p, team: 'away' as const })) : []),
        ...(filter !== 'away' ? homePlays.map(p => ({ ...p, team: 'home' as const })) : []),
    ];

    // Mock efficiency stats
    const awayShotsTotal = awayPlays.filter(p => p.type === 'shot').length;
    const homeShotsTotal = homePlays.filter(p => p.type === 'shot').length;
    const awaySOG = awayPlays.filter(p => p.type === 'shot' && p.successful).length;
    const homeSOG = homePlays.filter(p => p.type === 'shot' && p.successful).length;
    const awayPoss = 35 + seed(1) % 30;
    const homePoss = 100 - awayPoss;
    const awayPassComp = 72 + seed(2) % 20;
    const homePassComp = 72 + seed(3) % 20;
    const awayTackles = awayPlays.filter(p => p.type === 'tackle' && p.successful).length;
    const homeTackles = homePlays.filter(p => p.type === 'tackle' && p.successful).length;

    const effRows = [
        { label: 'Possession %', awayVal: `${awayPoss}%`, homeVal: `${homePoss}%`, awayPct: awayPoss, homePct: homePoss },
        { label: 'Shot Accuracy', awayVal: `${awayShotsTotal > 0 ? Math.round(awaySOG / awayShotsTotal * 100) : 0}%`, homeVal: `${homeShotsTotal > 0 ? Math.round(homeSOG / homeShotsTotal * 100) : 0}%`, awayPct: awayShotsTotal > 0 ? awaySOG / awayShotsTotal * 100 : 0, homePct: homeShotsTotal > 0 ? homeSOG / homeShotsTotal * 100 : 0 },
        { label: 'Pass Completion', awayVal: `${awayPassComp}%`, homeVal: `${homePassComp}%`, awayPct: awayPassComp, homePct: homePassComp },
        { label: 'Tackles Won', awayVal: `${awayTackles}`, homeVal: `${homeTackles}`, awayPct: Math.min(awayTackles * 10, 100), homePct: Math.min(homeTackles * 10, 100) },
    ];

    return (
        <div className="terminal-panel mt-6 overflow-hidden col-span-12">
            <div className="p-4 border-b border-border-muted flex flex-wrap items-center justify-between gap-3 bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-400 text-sm">sports_soccer</span>
                    Match Heatmap & Play Chart
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
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Soccer pitch">
                    <defs>
                        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#166534" />
                            <stop offset="100%" stopColor="#14532d" />
                        </linearGradient>
                        <pattern id="stripes2" x="0" y="0" width="70" height="680" patternUnits="userSpaceOnUse">
                            <rect x="0" y="0" width="35" height="680" fill="rgba(255,255,255,0.03)" />
                        </pattern>
                    </defs>
                    <rect x={0} y={0} width={W} height={H} fill="url(#pitchGrad)" rx={6} />
                    <rect x={0} y={0} width={W} height={H} fill="url(#stripes2)" rx={6} />
                    <rect x={10} y={10} width={W - 20} height={H - 20} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />

                    {/* Left Goal& box */}
                    <rect x={10} y={CY - GOAL_W / 2} width={GOAL_DEPTH} height={GOAL_W} fill="rgba(59,130,246,0.15)" stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
                    <rect x={10} y={CY - P_BOX_W / 2} width={P_BOX_H} height={P_BOX_W} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
                    <rect x={10} y={CY - S_BOX_W / 2} width={S_BOX_H} height={S_BOX_W} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
                    <circle cx={10 + PEN_SPOT} cy={CY} r={4} fill="rgba(255,255,255,0.7)" />
                    <path d={`M ${10 + P_BOX_H} ${CY - 73} A 91.5 91.5 0 0 1 ${10 + P_BOX_H} ${CY + 73}`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />

                    {/* Right Goal & box */}
                    <rect x={W - 10 - GOAL_DEPTH} y={CY - GOAL_W / 2} width={GOAL_DEPTH} height={GOAL_W} fill="rgba(16,185,129,0.15)" stroke="rgba(255,255,255,0.7)" strokeWidth={2} />
                    <rect x={W - 10 - P_BOX_H} y={CY - P_BOX_W / 2} width={P_BOX_H} height={P_BOX_W} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
                    <rect x={W - 10 - S_BOX_H} y={CY - S_BOX_W / 2} width={S_BOX_H} height={S_BOX_W} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
                    <circle cx={W - 10 - PEN_SPOT} cy={CY} r={4} fill="rgba(255,255,255,0.7)" />
                    <path d={`M ${W - 10 - P_BOX_H} ${CY - 73} A 91.5 91.5 0 0 0 ${W - 10 - P_BOX_H} ${CY + 73}`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />

                    {/* Center */}
                    <line x1={CX} y1={10} x2={CX} y2={H - 10} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
                    <circle cx={CX} cy={CY} r={CC_R} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
                    <circle cx={CX} cy={CY} r={5} fill="rgba(255,255,255,0.7)" />
                    {/* BIGGER HOME LOGO */}
                    {game.homeTeam.logo && (
                        <image href={game.homeTeam.logo} x={CX - 60} y={CY - 60} width={120} height={120} opacity={0.22} preserveAspectRatio="xMidYMid meet" />
                    )}

                    {/* Corner arcs */}
                    {[[10, 10], [W - 10, 10], [10, H - 10], [W - 10, H - 10]].map(([cx2, cy2], i) => (
                        <circle key={i} cx={cx2} cy={cy2} r={25} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
                    ))}

                    <text x={220} y={28} textAnchor="middle" fontSize={12} fontWeight={900} fill="#93c5fd" opacity={0.9} fontFamily="monospace">{game.awayTeam.name.toUpperCase()} →</text>
                    <text x={W - 220} y={28} textAnchor="middle" fontSize={12} fontWeight={900} fill="#6ee7b7" opacity={0.9} fontFamily="monospace">← {game.homeTeam.name.toUpperCase()}</text>

                    {visible.map(p => {
                        const col = playColor[p.type];
                        const r = p.type === 'shot' ? 7 : p.type === 'chance' ? 6 : 5;
                        return (
                            <circle key={p.id} cx={p.x} cy={p.y} r={r}
                                fill={p.successful ? col : 'none'} stroke={col}
                                strokeWidth={p.successful ? 0 : 1.5} opacity={0.8}
                                style={{ filter: p.successful && p.type === 'shot' ? `drop-shadow(0 0 5px ${col})` : undefined }}>
                                <title>{`${p.team === 'home' ? game.homeTeam.name : game.awayTeam.name} • ${p.type} • ${p.successful ? 'Successful' : 'Unsuccessful'}`}</title>
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
                footNote="Soccer efficiency stats based on simulated play data for this matchup"
            />
        </div>
    );
};
