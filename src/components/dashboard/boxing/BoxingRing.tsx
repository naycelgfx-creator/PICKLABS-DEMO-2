import React, { useState } from 'react';
import { Game } from '../../../data/mockGames';

interface BoxingRingProps {
    game: Game;
}

// ── Seeded deterministic stats ─────────────────────────────────────────────
function seed(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
}

function genPunches(name: string, count: number): { x: number; y: number; isBodyShot: boolean }[] {
    const s = seed(name);
    return Array.from({ length: count }, (_, i) => {
        const t = (s * (i + 1) * 2654435761) >>> 0;
        const u = ((t ^ (t >> 14)) * 0x3d83) >>> 0;
        const angle = (u % 360) * (Math.PI / 180);
        const r = 25 + (t % 45);
        const cx = 50 + Math.cos(angle) * r * 0.65;
        const cy = 50 + Math.sin(angle) * r * 0.5;
        return {
            x: Math.max(5, Math.min(95, cx)),
            y: Math.max(5, Math.min(95, cy)),
            isBodyShot: u % 4 === 0,
        };
    });
}

type StatTab = 'punches' | 'stats' | 'rounds';

export const BoxingRing: React.FC<BoxingRingProps> = ({ game }) => {
    const [tab, setTab] = useState<StatTab>('punches');

    const f1name = game.homeTeam?.name ?? 'Fighter A';
    const f2name = game.awayTeam?.name ?? 'Fighter B';
    const f1Logo = game.homeTeam?.logo;
    const f2Logo = game.awayTeam?.logo;

    const s1 = seed(f1name);
    const s2 = seed(f2name);

    // Combat stats
    const f1Jabs = 18 + (s1 % 30);
    const f2Jabs = 14 + (s2 % 32);
    const f1Power = 8 + (s1 % 18);
    const f2Power = 6 + (s2 % 20);
    const f1Acc = 40 + (s1 % 35);
    const f2Acc = 35 + (s2 % 38);
    const f1KD = s1 % 3;
    const f2KD = s2 % 3;
    const f1TotalPunches = f1Jabs + f1Power;
    const f2TotalPunches = f2Jabs + f2Power;

    // Round simulation
    const rounds = Array.from({ length: 12 }, (_, r) => {
        const r1 = seed(f1name + r) % 10 + 1;
        const r2 = seed(f2name + r) % 10 + 1;
        const winner = r1 > r2 ? 'home' : r1 < r2 ? 'away' : 'draw';
        return { round: r + 1, home: r1, away: r2, winner };
    });
    const homeRounds = rounds.filter(r => r.winner === 'home').length;
    const awayRounds = rounds.filter(r => r.winner === 'away').length;

    const f1Punches = genPunches(f1name, 14);
    const f2Punches = genPunches(f2name, 14);

    const statRows = [
        { label: 'Total Jabs', f1: f1Jabs, f2: f2Jabs },
        { label: 'Power Shots', f1: f1Power, f2: f2Power },
        { label: 'Accuracy %', f1: f1Acc, f2: f2Acc },
        { label: 'Knockdowns', f1: f1KD, f2: f2KD },
        { label: 'Total Landed', f1: f1TotalPunches, f2: f2TotalPunches },
    ];

    return (
        <div className="terminal-panel mt-6 overflow-hidden col-span-12">
            {/* Header row */}
            <div className="p-4 border-b border-border-muted flex flex-wrap items-center justify-between gap-3 bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400 text-sm">sports_mma</span>
                    Boxing Ring — Punch Heatmap
                </h3>
                {/* Fighter score chips */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                        {f1Logo && <img src={f1Logo} className="w-5 h-5 rounded-full object-contain" alt="" />}
                        <span className="text-[10px] font-black text-blue-400 uppercase">{f1name}</span>
                        <span className="text-[10px] font-black text-blue-300">{homeRounds}R</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-black">VS</span>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
                        <span className="text-[10px] font-black text-red-300">{awayRounds}R</span>
                        <span className="text-[10px] font-black text-red-400 uppercase">{f2name}</span>
                        {f2Logo && <img src={f2Logo} className="w-5 h-5 rounded-full object-contain" alt="" />}
                    </div>
                </div>
            </div>

            {/* Ring SVG */}
            <div className="p-4 bg-background-dark">
                <svg viewBox="0 0 520 320" className="w-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <radialGradient id="ringFloor" cx="50%" cy="50%" r="55%">
                            <stop offset="0%" stopColor="#6b1818" />
                            <stop offset="100%" stopColor="#3b0a0a" />
                        </radialGradient>
                        <filter id="heatGlow">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Dark arena background */}
                    <rect width="520" height="320" fill="#0d0d1a" />

                    {/* Spotlight gradients */}
                    <radialGradient id="spot1" cx="30%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(59,130,246,0.08)" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <radialGradient id="spot2" cx="70%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(239,68,68,0.08)" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <rect width="520" height="320" fill="url(#spot1)" />
                    <rect width="520" height="320" fill="url(#spot2)" />

                    {/* Canvas mat */}
                    <rect x="40" y="40" width="440" height="240" rx="6" fill="url(#ringFloor)" />

                    {/* Rope shadows */}
                    <rect x="35" y="36" width="450" height="250" rx="8" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="6" />

                    {/* Ropes — 3 sets top and bottom */}
                    {[52, 68, 84].map((y, i) => (
                        <rect key={`rt${i}`} x="32" y={y} width="456" height="3" rx="1.5"
                            fill={i === 1 ? '#f59e0b' : '#d4a017'} opacity={0.9 - i * 0.15} />
                    ))}
                    {[236, 252, 268].map((y, i) => (
                        <rect key={`rb${i}`} x="32" y={y} width="456" height="3" rx="1.5"
                            fill={i === 1 ? '#f59e0b' : '#d4a017'} opacity={0.9 - i * 0.15} />
                    ))}

                    {/* Vertical rope segments (corner to corner) */}
                    {[32, 488].map((x, i) => (
                        <line key={`rv${i}`} x1={x + 1.5} y1="52" x2={x + 1.5} y2="268"
                            stroke="#b8860b" strokeWidth="3" opacity="0.7" />
                    ))}

                    {/* Corner posts */}
                    {[[25, 32], [488, 32], [25, 268], [488, 268]].map(([px, py], i) => (
                        <g key={`post${i}`}>
                            <rect x={px - 8} y={py - 8} width="16" height="16" rx="2" fill="#2d2d3e" stroke="#555" strokeWidth="1.5" />
                            <rect x={px - 3} y={py - 12} width="6" height="32" rx="2" fill={i % 2 === 0 ? '#3b82f6' : '#ef4444'} opacity="0.8" />
                        </g>
                    ))}

                    {/* Center dashed divider */}
                    <line x1="260" y1="40" x2="260" y2="280" stroke="#f59e0b" strokeWidth="1.5"
                        strokeDasharray="6,6" opacity="0.5" />

                    {/* Center circle */}
                    <circle cx="260" cy="160" r="38" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" />
                    <text x="260" y="165" fill="#f59e0b" fontSize="12" fontFamily="monospace" fontWeight="bold"
                        textAnchor="middle" opacity="0.5">RING</text>

                    {/* Fighter 1 punch heatmap (Blue / left half) */}
                    {f1Punches.map((p, i) => {
                        const cx = 45 + (p.x / 100) * 195;
                        const cy = 45 + (p.y / 100) * 230;
                        return (
                            <circle key={`f1p${i}`} cx={cx} cy={cy}
                                r={p.isBodyShot ? 7 : 5}
                                fill={p.isBodyShot ? 'rgba(96,165,250,0.45)' : 'rgba(59,130,246,0.55)'}
                                stroke="#3b82f6" strokeWidth="0.8"
                                filter="url(#heatGlow)">
                                <animate attributeName="opacity" from="0.3" to="0.9"
                                    dur={`${1.1 + i * 0.14}s`} repeatCount="indefinite"
                                    calcMode="paced" />
                            </circle>
                        );
                    })}

                    {/* Fighter 2 punch heatmap (Red / right half) */}
                    {f2Punches.map((p, i) => {
                        const cx = 280 + (p.x / 100) * 195;
                        const cy = 45 + (p.y / 100) * 230;
                        return (
                            <circle key={`f2p${i}`} cx={cx} cy={cy}
                                r={p.isBodyShot ? 7 : 5}
                                fill={p.isBodyShot ? 'rgba(248,113,113,0.45)' : 'rgba(239,68,68,0.55)'}
                                stroke="#ef4444" strokeWidth="0.8"
                                filter="url(#heatGlow)">
                                <animate attributeName="opacity" from="0.3" to="0.9"
                                    dur={`${1.3 + i * 0.12}s`} repeatCount="indefinite"
                                    calcMode="paced" />
                            </circle>
                        );
                    })}

                    {/* Fighter 1 avatar */}
                    <circle cx="95" cy="160" r="26" fill="#0d0d1a" stroke="#3b82f6" strokeWidth="2" />
                    {f1Logo
                        ? (<><image href={f1Logo} x="71" y="136" width="48" height="48" clipPath="url(#clip-f1r)" /><clipPath id="clip-f1r"><circle cx="95" cy="160" r="24" /></clipPath></>)
                        : <text x="95" y="166" textAnchor="middle" fontSize="22" fill="#3b82f6">🥊</text>
                    }

                    {/* Fighter 2 avatar */}
                    <circle cx="425" cy="160" r="26" fill="#0d0d1a" stroke="#ef4444" strokeWidth="2" />
                    {f2Logo
                        ? (<><image href={f2Logo} x="401" y="136" width="48" height="48" clipPath="url(#clip-f2r)" /><clipPath id="clip-f2r"><circle cx="425" cy="160" r="24" /></clipPath></>)
                        : <text x="425" y="166" textAnchor="middle" fontSize="22" fill="#ef4444">🥊</text>
                    }

                    {/* Corner labels */}
                    <text x="65" y="28" fill="#93c5fd" fontSize="8" fontFamily="monospace" fontWeight="800" textAnchor="middle">BLUE CORNER</text>
                    <text x="455" y="28" fill="#fca5a5" fontSize="8" fontFamily="monospace" fontWeight="800" textAnchor="middle">RED CORNER</text>

                    {/* Fighter name tags */}
                    <text x="95" y="196" fill="#93c5fd" fontSize="7.5" fontFamily="monospace" fontWeight="800"
                        textAnchor="middle" textLength={Math.min(f1name.length * 5.2, 130)} lengthAdjust="spacing">
                        {f1name.toUpperCase()}
                    </text>
                    <text x="425" y="196" fill="#fca5a5" fontSize="7.5" fontFamily="monospace" fontWeight="800"
                        textAnchor="middle" textLength={Math.min(f2name.length * 5.2, 130)} lengthAdjust="spacing">
                        {f2name.toUpperCase()}
                    </text>

                    {/* Legend */}
                    <circle cx="48" cy="308" r="4" fill="rgba(59,130,246,0.6)" stroke="#3b82f6" strokeWidth="0.8" />
                    <text x="56" y="312" fill="#94a3b8" fontSize="7" fontFamily="monospace">Jab</text>
                    <circle cx="80" cy="308" r="6" fill="rgba(96,165,250,0.5)" stroke="#3b82f6" strokeWidth="0.8" />
                    <text x="90" y="312" fill="#94a3b8" fontSize="7" fontFamily="monospace">Body</text>
                    <circle cx="126" cy="308" r="4" fill="rgba(239,68,68,0.6)" stroke="#ef4444" strokeWidth="0.8" />
                    <text x="134" y="312" fill="#94a3b8" fontSize="7" fontFamily="monospace">Power</text>
                </svg>
            </div>

            {/* Stat tabs */}
            <div className="border-t border-border-muted">
                <div className="flex border-b border-border-muted">
                    {(['punches', 'stats', 'rounds'] as StatTab[]).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${tab === t ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:text-slate-300'}`}>
                            {t === 'punches' ? '🥊 Punch Data' : t === 'stats' ? '📊 Stats' : '🔔 Rounds'}
                        </button>
                    ))}
                </div>

                {/* Punch tab */}
                {tab === 'punches' && (
                    <div className="p-4 grid grid-cols-2 gap-4">
                        {[{ label: 'Total Jabs', f1: f1Jabs, f2: f2Jabs }, { label: 'Power Shots', f1: f1Power, f2: f2Power }].map(({ label, f1, f2 }) => {
                            const total = Math.max(f1 + f2, 1);
                            const f1pct = Math.round((f1 / total) * 100);
                            return (
                                <div key={label} className="terminal-panel p-3 border border-neutral-700/40">
                                    <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">{label}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-blue-400 tabular-nums">{f1}</span>
                                        <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                            <div className="h-full flex">
                                                <div className="bg-blue-500/70 rounded-l-full" style={{ width: `${f1pct}%` }} />
                                                <div className="bg-red-500/70 rounded-r-full flex-1" />
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-red-400 tabular-nums">{f2}</span>
                                    </div>
                                    <div className="flex justify-between mt-0.5">
                                        <span className="text-[9px] text-slate-600">{f1pct}%</span>
                                        <span className="text-[9px] text-slate-600">{100 - f1pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Stats tab */}
                {tab === 'stats' && (
                    <div className="p-4 grid grid-cols-1 gap-2">
                        {statRows.map(({ label, f1, f2 }) => {
                            const total = Math.max(f1 + f2, 1);
                            const f1pct = Math.round((f1 / total) * 100);
                            return (
                                <div key={label} className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-blue-400 tabular-nums w-8 text-right">{f1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-[8px] text-slate-500 font-bold mb-0.5">
                                            <span></span><span>{label}</span><span></span>
                                        </div>
                                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden flex">
                                            <div className="bg-blue-500/80 rounded-l-full" style={{ width: `${f1pct}%` }} />
                                            <div className="bg-red-500/80 rounded-r-full flex-1" />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-red-400 tabular-nums w-8">{f2}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Rounds tab */}
                {tab === 'rounds' && (
                    <div className="p-4">
                        <div className="grid grid-cols-12 gap-1 mb-2">
                            <div className="col-span-3 text-[8px] font-black uppercase text-blue-400">{f1name}</div>
                            <div className="col-span-6 text-[8px] font-black uppercase text-slate-500 text-center">Round</div>
                            <div className="col-span-3 text-[8px] font-black uppercase text-red-400 text-right">{f2name}</div>
                        </div>
                        {rounds.map(r => (
                            <div key={r.round} className="grid grid-cols-12 gap-1 py-1 border-b border-neutral-800/40">
                                <div className={`col-span-3 text-[10px] font-black tabular-nums ${r.winner === 'home' ? 'text-blue-400' : 'text-slate-500'}`}>{r.home}</div>
                                <div className="col-span-6 text-[9px] text-slate-500 text-center font-bold">Round {r.round}</div>
                                <div className={`col-span-3 text-[10px] font-black tabular-nums text-right ${r.winner === 'away' ? 'text-red-400' : 'text-slate-500'}`}>{r.away}</div>
                            </div>
                        ))}
                        <div className="flex justify-between mt-2">
                            <span className="text-[10px] font-black text-blue-300">Rounds Won: {homeRounds}</span>
                            <span className="text-[10px] font-black text-red-300">Rounds Won: {awayRounds}</span>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-[9px] text-slate-600 text-center py-2 font-medium">
                🥊 Simulated punch data for illustrative purposes
            </p>
        </div>
    );
};
