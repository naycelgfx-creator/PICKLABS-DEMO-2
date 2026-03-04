import React, { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WinProbPoint {
    timeLabel: string;     // "Q1", "Q2 5:30", "FINAL", etc.
    homeProb: number;      // 0–100
    awayProb: number;      // 0–100
    impliedOdds?: number;  // book's current implied probability (0–100)
    isValueMoment?: boolean; // True when graph dips below implied odds → value pick
}

interface Props {
    homeTeam: string;
    awayTeam: string;
    homeColor?: string;
    awayColor?: string;
}

// ─── Simulated live data (mirrors Python plotly real-time feed) ───────────────
// In production: fetch from ESPN live odds + win-probability API every 30s

function generateInitialSeries(): WinProbPoint[] {
    // Simulates a close game that swings momentum multiple times
    const points: WinProbPoint[] = [];
    const labels = ['PRE', 'Q1 8:00', 'Q1 4:00', 'Q1 END', 'Q2 8:00', 'Q2 4:00', 'HALF', 'Q3 8:00', 'Q3 4:00', 'Q3 END', 'Q4 8:00', 'Q4 4:00', 'LIVE'];
    let homeProb = 52;
    let impliedOdds = 55;

    for (let i = 0; i < labels.length; i++) {
        const swing = (Math.random() - 0.5) * 18;
        homeProb = Math.max(15, Math.min(85, homeProb + swing));
        impliedOdds = Math.max(40, Math.min(70, impliedOdds + (Math.random() - 0.5) * 5));
        const isValue = homeProb < impliedOdds - 8; // If model says lower prob than book implies → value on away

        points.push({
            timeLabel: labels[i],
            homeProb: Math.round(homeProb),
            awayProb: Math.round(100 - homeProb),
            impliedOdds: Math.round(impliedOdds),
            isValueMoment: isValue,
        });
    }
    return points;
}

// ─── SVG Chart ────────────────────────────────────────────────────────────────

const CHART_W = 580;
const CHART_H = 200;
const PAD = { top: 20, right: 24, bottom: 30, left: 40 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

function probToY(prob: number): number {
    return PAD.top + INNER_H - (prob / 100) * INNER_H;
}

function idxToX(idx: number, total: number): number {
    return PAD.left + (idx / (total - 1)) * INNER_W;
}

function pointsToPath(pts: WinProbPoint[], total: number, key: 'homeProb' | 'awayProb'): string {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${idxToX(i, total).toFixed(1)} ${probToY(p[key]).toFixed(1)}`).join(' ');
}

// ─── Component ────────────────────────────────────────────────────────────────

export const WinProbabilityGraph: React.FC<Props> = ({
    homeTeam = 'BOS Celtics',
    awayTeam = 'LAL Lakers',
    homeColor = '#22d3ee',  // cyan
    awayColor = '#a855f7',  // purple
}) => {
    const [series, setSeries] = useState<WinProbPoint[]>(() => generateInitialSeries());
    const [isLive, setIsLive] = useState(true);
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Simulates new live data point every 8s (real: ESPN win prob endpoint)
    useEffect(() => {
        if (!isLive) return;
        const id = setInterval(() => {
            setSeries(prev => {
                const last = prev[prev.length - 1];
                const swing = (Math.random() - 0.48) * 12;
                const newHome = Math.max(15, Math.min(85, last.homeProb + swing));
                const newImplied = Math.max(40, Math.min(70, (last.impliedOdds || 55) + (Math.random() - 0.5) * 3));
                const newPt: WinProbPoint = {
                    timeLabel: 'LIVE',
                    homeProb: Math.round(newHome),
                    awayProb: Math.round(100 - newHome),
                    impliedOdds: Math.round(newImplied),
                    isValueMoment: newHome < newImplied - 8,
                };
                // Roll the window — keep last 13 points
                return [...prev.slice(-12), newPt];
            });
        }, 8000);
        return () => clearInterval(id);
    }, [isLive]);

    const total = series.length;
    const current = series[series.length - 1];
    const hovered = hoveredIdx !== null ? series[hoveredIdx] : null;
    const display = hovered || current;

    const homePath = pointsToPath(series, total, 'homeProb');
    const awayPath = pointsToPath(series, total, 'awayProb');

    // Implied odds dashed line path
    const impliedPath = series
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${idxToX(i, total).toFixed(1)} ${probToY(p.impliedOdds || 50).toFixed(1)}`)
        .join(' ');

    // Value markers (dots where model dips below implied)
    const valueMarkers = series
        .map((p, i) => p.isValueMoment ? { x: idxToX(i, total), y: probToY(p.awayProb), label: p.timeLabel } : null)
        .filter(Boolean) as Array<{ x: number; y: number; label: string }>;

    return (
        <div className="col-span-12 lg:col-span-6 terminal-panel overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400 text-lg">show_chart</span>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white">Live Win Probability</p>
                        <p className="text-[10px] text-text-muted">Real-time model vs book implied odds</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Legend */}
                    <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-wide text-text-muted">
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 inline-block rounded-full" style={{ backgroundColor: homeColor }} />
                            {homeTeam}
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0.5 inline-block rounded-full" style={{ backgroundColor: awayColor }} />
                            {awayTeam}
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-3 h-0 inline-block border-t border-dashed border-white/30" />
                            Book Implied
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 inline-block rounded-full bg-yellow-400" />
                            Value
                        </span>
                    </div>

                    <button
                        onClick={() => setIsLive(l => !l)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase border transition-all ${isLive
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 border-border text-text-muted'
                            }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                        {isLive ? 'LIVE' : 'PAUSED'}
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 divide-x divide-border border-b border-border">
                {[
                    { label: homeTeam + ' Win%', value: `${display.homeProb}%`, color: homeColor },
                    { label: awayTeam + ' Win%', value: `${display.awayProb}%`, color: awayColor },
                    { label: 'Book Implied', value: `${display.impliedOdds || 50}%`, color: '#9ca3af' },
                    { label: 'Value Spots', value: valueMarkers.length, color: '#facc15' },
                ].map((stat, i) => (
                    <div key={i} className="px-4 py-3 text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted truncate">{stat.label}</p>
                        <p className="text-lg font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* SVG Graph */}
            <div className="p-4 relative">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                    className="w-full"
                    style={{ height: '200px' }}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onMouseMove={e => {
                        const rect = svgRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const relX = ((e.clientX - rect.left) / rect.width) * CHART_W;
                        const closest = Math.round(((relX - PAD.left) / INNER_W) * (total - 1));
                        setHoveredIdx(Math.max(0, Math.min(total - 1, closest)));
                    }}
                >
                    {/* Y-axis grid lines */}
                    {[25, 50, 75].map(pct => (
                        <g key={pct}>
                            <line
                                x1={PAD.left} y1={probToY(pct)}
                                x2={CHART_W - PAD.right} y2={probToY(pct)}
                                stroke="rgba(255,255,255,0.06)" strokeWidth={1}
                            />
                            <text x={PAD.left - 4} y={probToY(pct) + 4} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.3)" fontWeight="900">
                                {pct}%
                            </text>
                        </g>
                    ))}

                    {/* 50% center line */}
                    <line x1={PAD.left} y1={probToY(50)} x2={CHART_W - PAD.right} y2={probToY(50)} stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="4 4" />

                    {/* Book implied odds dashed line */}
                    <path d={impliedPath} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} strokeDasharray="5 4" />

                    {/* Away team shaded area */}
                    <path
                        d={`${awayPath} L ${idxToX(total - 1, total)} ${PAD.top + INNER_H} L ${PAD.left} ${PAD.top + INNER_H} Z`}
                        fill={awayColor}
                        fillOpacity={0.06}
                    />
                    {/* Home team shaded area */}
                    <path
                        d={`${homePath} L ${idxToX(total - 1, total)} ${PAD.top + INNER_H} L ${PAD.left} ${PAD.top + INNER_H} Z`}
                        fill={homeColor}
                        fillOpacity={0.06}
                    />

                    {/* Lines */}
                    <path d={awayPath} fill="none" stroke={awayColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
                    <path d={homePath} fill="none" stroke={homeColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

                    {/* VALUE markers — yellow dot where model dips below book */}
                    {valueMarkers.map((m, i) => (
                        <g key={i}>
                            <circle cx={m.x} cy={m.y} r={6} fill="#facc15" fillOpacity={0.2} />
                            <circle cx={m.x} cy={m.y} r={3} fill="#facc15" />
                            <text x={m.x} y={m.y - 10} textAnchor="middle" fontSize={7} fill="#facc15" fontWeight="900">
                                VALUE
                            </text>
                        </g>
                    ))}

                    {/* X-axis labels */}
                    {series.map((p, i) => (
                        (i === 0 || i % 3 === 0 || i === total - 1) && (
                            <text key={i} x={idxToX(i, total)} y={CHART_H - 4} textAnchor="middle" fontSize={7.5} fill="rgba(255,255,255,0.35)" fontWeight="900">
                                {p.timeLabel}
                            </text>
                        )
                    ))}

                    {/* Hover cursor + dot */}
                    {hoveredIdx !== null && (
                        <g>
                            <line
                                x1={idxToX(hoveredIdx, total)} y1={PAD.top}
                                x2={idxToX(hoveredIdx, total)} y2={PAD.top + INNER_H}
                                stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="3 3"
                            />
                            <circle cx={idxToX(hoveredIdx, total)} cy={probToY(series[hoveredIdx].homeProb)} r={4} fill={homeColor} />
                            <circle cx={idxToX(hoveredIdx, total)} cy={probToY(series[hoveredIdx].awayProb)} r={4} fill={awayColor} />
                        </g>
                    )}

                    {/* Live dot on last point */}
                    <circle cx={idxToX(total - 1, total)} cy={probToY(current.homeProb)} r={5} fill={homeColor} />
                    <circle cx={idxToX(total - 1, total)} cy={probToY(current.homeProb)} r={9} fill={homeColor} fillOpacity={0.2} />
                </svg>
            </div>

            {/* Value Alert Banner */}
            {current.isValueMoment && (
                <div className="mx-4 mb-4 px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400 text-lg">bolt</span>
                    <div>
                        <p className="text-[10px] font-black text-yellow-400">VALUE PICK DETECTED</p>
                        <p className="text-[9px] text-text-muted">
                            Model assigns {current.awayProb}% win chance to {awayTeam} — book implied is {current.impliedOdds}%.
                            Potential edge of {(current.impliedOdds! - current.awayProb)}pts.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
