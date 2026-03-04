import React, { useState, useRef } from 'react';
import { Player, PlayerProp, PlayerLog, AltLine } from '../../data/mockPlayers';
import { BetPick } from '../../App';

interface FavoritePlayerPanelProps {
    player: Player;
    sport: string;
    onAddBet: (bet: BetPick) => void;
    onClose?: () => void;
}

function parseMinutes(minStr: string): number {
    const parts = minStr.split(':');
    return parseInt(parts[0], 10) + parseInt(parts[1] || '0', 10) / 60;
}

function calcHitRate(logs: PlayerLog[], line: number): number {
    if (logs.length === 0) return 0;
    return Math.round((logs.filter(l => l.stat1 > line).length / logs.length) * 100);
}

function calcTrendHitPct(arr: number[]): number {
    if (arr.length === 0) return 0;
    // Treat each value as a "over 50" = hit
    return Math.round((arr.filter(v => v > 50).length / arr.length) * 100);
}

function buildInsight(player: Player, prop: PlayerProp): string {
    const logs = player.recentLogs.slice(0, 5);
    const l5over = logs.filter(l => l.stat1 > prop.line).length;
    const road = logs.filter(l => l.opponent.startsWith('@')).filter(l => l.stat1 > prop.line).length;
    const roadTotal = logs.filter(l => l.opponent.startsWith('@')).length;
    const oppName = prop.oppRank.team;
    const rank = prop.oppRank.rank;
    const hitStr = l5over >= 4 ? 'hit' : l5over <= 1 ? 'missed' : 'covered';
    const roadStr = roadTotal > 0 ? ` In road games L5, ${road}/${roadTotal} over.` : '';
    const rankStr = rank <= 10 ? `⚠ ${oppName} ranks Top 10 in defense vs ${prop.type}.` : rank >= 21 ? <><span className="material-symbols-outlined text-orange-500 text-[10px] align-middle mr-1">local_fire_department</span> {oppName} ranks Bottom 10 in defending {prop.type} — exploitable.</> : '';
    return `${player.name} has ${hitStr} ${prop.type} ${prop.line}+ in ${l5over}/5 of their last 5 games.${roadStr}${rankStr ? ' ' + rankStr : ''}`;
}

interface HoverData {
    log: PlayerLog;
    barX: number;
    barY: number;
    barW: number;
    isOver: boolean;
}

// Extra prop types are now generated as real props in mockPlayers.ts

const SHARP_THRESHOLD = 12; // If money% > bet% by this many pts => sharp lean indicator

export const FavoritePlayerPanel: React.FC<FavoritePlayerPanelProps> = ({ player, onAddBet, onClose }) => {
    const [activePropIdx, setActivePropIdx] = useState(0);
    const [activeAltLineIdx, setActiveAltLineIdx] = useState(2); // center = base line
    const [hoveredBar, setHoveredBar] = useState<HoverData | null>(null);
    const [posFilter, setPosFilter] = useState<string | null>(null);
    const [betSide, setBetSide] = useState<'Over' | 'Under'>('Over');
    const chartRef = useRef<HTMLDivElement>(null);

    const prop: PlayerProp = player.props[activePropIdx] ?? player.props[0];
    const altLine: AltLine = prop.altLines?.[activeAltLineIdx] ?? { line: prop.line, overOdds: prop.overOdds, underOdds: prop.underOdds };
    const activeLine = altLine.line;
    const logs = player.recentLogs.slice(0, 10);

    // Chart
    const CHART_H = 160;
    const BAR_GAP = 6;
    const maxStat = Math.max(...logs.map(l => l.stat1), activeLine * 1.5, 1);
    const maxMins = Math.max(...logs.map(l => parseMinutes(l.minutes)), 40);

    // Hit rates
    const l5Rate = calcHitRate(logs.slice(0, 5), activeLine);
    const l10Rate = calcHitRate(logs, activeLine);
    const l20Rate = calcTrendHitPct(prop.l20);
    const h2hRate = calcTrendHitPct(prop.h2h);
    const seasonRate = calcTrendHitPct(prop.season2025);

    // All props are now real — no locked chips

    // Positional matchup filter
    const positions = (prop.positionalMatchups ?? []).map(r => r.pos).filter((v, i, a) => a.indexOf(v) === i);
    const filteredMatchups = posFilter
        ? (prop.positionalMatchups ?? []).filter(r => r.pos === posFilter)
        : (prop.positionalMatchups ?? []);

    const handleAddBet = () => {
        const odds = betSide === 'Over' ? altLine.overOdds : altLine.underOdds;
        onAddBet({
            id: `prop-${Date.now()}`,
            gameId: player.id,
            type: 'Prop',
            team: `${player.name} ${betSide} ${activeLine} ${prop.type}`,
            odds,
            matchupStr: `${player.teamName} vs ${player.opponent}`,
            stake: 25,
        });
    };

    const rateColor = (r: number) => r >= 65 ? 'text-primary' : r <= 40 ? 'text-red-400' : 'text-yellow-400';
    const rateBg = (r: number) => r >= 65 ? 'bg-primary/10 border-primary/30' : r <= 40 ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-400/10 border-yellow-400/30';

    return (
        <div className="w-full bg-neutral-900/60 border border-border-muted rounded-2xl overflow-hidden mt-3 shadow-2xl">

            {/* ══════════════════════════════════════════════
                SECTION 1 — HERO HEADER
            ═══════════════════════════════════════════════ */}
            <div className="relative bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-b border-border-muted p-5">
                {/* Close button */}
                {onClose && (
                    <button onClick={onClose} className="absolute top-3 right-3 h-7 w-7 rounded-full bg-neutral-800 border border-border-muted flex items-center justify-center text-text-muted hover:text-white hover:bg-neutral-700 transition-colors z-10">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                )}

                <div className="flex items-start gap-5">
                    {/* Large player photo */}
                    <div className="relative shrink-0">
                        <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-[0_0_20px_rgba(13,242,13,0.15)] bg-neutral-800">
                            <img
                                src={player.photoUrl}
                                alt={player.name}
                                className="h-full w-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18181b&color=fff&rounded=false&size=128`; }}
                            />
                        </div>
                        {/* Position badge */}
                        <div className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 bg-primary text-black text-[8px] font-black rounded-md uppercase tracking-widest">
                            {player.position}
                        </div>
                    </div>

                    {/* Name + context */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">{player.name}</h2>
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{player.teamName}</span>
                        </div>

                        {/* Opponent badge */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">vs</span>
                            <span className="px-2 py-0.5 rounded-md bg-neutral-800 border border-border-muted text-[10px] font-black text-text-main uppercase">{player.opponent}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border
                                ${prop.oppRank.color === 'green' ? 'bg-primary/10 text-primary border-primary/30' :
                                    prop.oppRank.color === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                        'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'}`}>
                                #{prop.oppRank.rank} vs {prop.type}
                            </span>
                        </div>

                        {/* Active line display */}
                        <div className="flex items-center gap-3 mt-2.5">
                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{prop.type} Line</span>
                            <span className="text-2xl font-black text-primary leading-none">{activeLine}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setBetSide('Over')}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105
                                        ${betSide === 'Over' ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_8px_rgba(13,242,13,0.2)]' : 'bg-neutral-800 text-text-muted border-border-muted hover:border-primary/40'}`}
                                >
                                    Over {altLine.overOdds}
                                </button>
                                <button
                                    onClick={() => setBetSide('Under')}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all hover:scale-105
                                        ${betSide === 'Under' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-neutral-800 text-text-muted border-border-muted hover:border-red-500/40'}`}
                                >
                                    Under {altLine.underOdds}
                                </button>
                                <button
                                    onClick={handleAddBet}
                                    className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-accent-purple/20 text-accent-purple border border-accent-purple/40 hover:bg-accent-purple hover:text-white transition-all hover:scale-105"
                                >
                                    + Slip
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Prop Chip Scroll Row — all chips are unlocked real props ── */}
                <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {player.props.map((p, idx) => {
                        const isActive = idx === activePropIdx;
                        return (
                            <button
                                key={p.id}
                                onClick={() => setActivePropIdx(idx)}
                                className={`shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap cursor-pointer
                                    ${isActive
                                        ? 'bg-primary/15 text-primary border-primary/60 shadow-[0_0_10px_rgba(13,242,13,0.25)]'
                                        : 'bg-neutral-900 text-slate-400 border-border-muted hover:border-primary/40 hover:text-primary'
                                    }`}
                            >
                                {p.type}
                            </button>
                        );
                    })}
                </div>

                {/* ── Alt Lines Dropdown Row ── */}
                {prop.altLines && prop.altLines.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] text-text-muted font-black uppercase tracking-widest shrink-0">Alt Lines:</span>
                        {prop.altLines.map((al, idx) => (
                            <button
                                key={al.line}
                                onClick={() => setActiveAltLineIdx(idx)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-all
                                    ${activeAltLineIdx === idx
                                        ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50'
                                        : 'bg-neutral-800/60 text-text-muted border-border-muted hover:border-yellow-400/40 hover:text-yellow-400'
                                    }`}
                            >
                                {al.line}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════
                MAIN BODY — 2 COLUMN LAYOUT (chart + sidebar)
            ═══════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x divide-border-muted">

                {/* ────────────────────────────────────────
                    LEFT/CENTER COL — Charts & Stats
                ─────────────────────────────────────────── */}
                <div className="xl:col-span-2 divide-y divide-border-muted">

                    {/* SECTION 2 — Interactive Bar Chart */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-accent-purple">bar_chart</span>
                                Last 10 Games — {prop.type}
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-primary" /><span className="text-[9px] text-text-muted font-bold uppercase">Over</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500" /><span className="text-[9px] text-text-muted font-bold uppercase">Under</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-8 border-t-2 border-dashed border-yellow-400" /><span className="text-[9px] text-yellow-400 font-bold uppercase">Line {activeLine}</span></div>
                            </div>
                        </div>

                        <div className="bg-neutral-950/40 rounded-xl p-3 relative" ref={chartRef}>
                            <div className="relative select-none">
                                <svg
                                    viewBox={`0 0 700 ${CHART_H + 30}`}
                                    className="w-full overflow-visible"
                                    style={{ height: CHART_H + 30 }}
                                    onMouseLeave={() => setHoveredBar(null)}
                                >
                                    {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                                        const y = CHART_H - pct * CHART_H;
                                        return (
                                            <g key={pct}>
                                                <line x1="0" y1={y} x2="100%" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                                <text x="0" y={y - 3} fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="monospace">{Math.round(pct * maxStat)}</text>
                                            </g>
                                        );
                                    })}
                                    {/* Dotted line at active line */}
                                    <line
                                        x1="0" y1={CHART_H - (activeLine / maxStat) * CHART_H}
                                        x2="100%" y2={CHART_H - (activeLine / maxStat) * CHART_H}
                                        stroke="#facc15" strokeWidth="1.5" strokeDasharray="5,4"
                                    />
                                    {logs.map((log, i) => {
                                        const totalW = 700;
                                        const barW = (totalW / logs.length) - BAR_GAP;
                                        const barX = i * (totalW / logs.length) + BAR_GAP / 2 + 12;
                                        const isOver = log.stat1 > activeLine;
                                        const barH = Math.max(4, (log.stat1 / maxStat) * CHART_H);
                                        const barY = CHART_H - barH;
                                        return (
                                            <g key={log.id}>
                                                <rect x={barX - 1} y={barY - 1} width={barW + 2} height={barH + 2}
                                                    fill={isOver ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'} rx="3" />
                                                <rect
                                                    x={barX} y={barY} width={barW} height={barH}
                                                    fill={isOver ? '#22c55e' : '#ef4444'} rx="3"
                                                    className="cursor-pointer"
                                                    onMouseEnter={() => setHoveredBar({ log, barX, barY, barW, isOver })}
                                                />
                                                <text x={barX + barW / 2} y={barY - 4} textAnchor="middle"
                                                    fill={isOver ? '#22c55e' : '#ef4444'} fontSize="9" fontWeight="bold" fontFamily="monospace">
                                                    {log.stat1}
                                                </text>
                                                <text x={barX + barW / 2} y={CHART_H + 16} textAnchor="middle"
                                                    fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace"
                                                    transform={`rotate(-30, ${barX + barW / 2}, ${CHART_H + 16})`}>
                                                    {log.date}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>

                                {/* Hover tooltip */}
                                {hoveredBar && (
                                    <div
                                        className="absolute z-30 bg-neutral-900 border border-border-muted rounded-xl shadow-2xl p-3 w-56 pointer-events-none"
                                        style={{
                                            bottom: `calc(100% - ${hoveredBar.barY}px + 8px)`,
                                            left: `max(0px, min(calc(${(hoveredBar.barX / 700) * 100}% - 112px), calc(100% - 224px)))`,
                                        }}
                                    >
                                        {/* Game header */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-black text-text-main uppercase">{hoveredBar.log.opponent}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-text-muted">{hoveredBar.log.score}</span>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${hoveredBar.log.result === 'W' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                                                    {hoveredBar.log.result}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-px bg-border-muted mb-2" />
                                        <div className="flex justify-between mb-1.5">
                                            <span className="text-[9px] text-text-muted font-bold uppercase">Date</span>
                                            <span className="text-[9px] text-text-main font-bold">{hoveredBar.log.date}</span>
                                        </div>
                                        <div className="flex justify-between mb-1.5">
                                            <span className="text-[9px] text-text-muted font-bold uppercase">{prop.type}</span>
                                            <span className={`text-sm font-black ${hoveredBar.isOver ? 'text-primary' : 'text-red-400'}`}>
                                                {hoveredBar.log.stat1}
                                                <span className="text-[9px] text-text-muted ml-1">
                                                    ({hoveredBar.isOver ? '+' : ''}{hoveredBar.log.stat1 - activeLine} vs {activeLine})
                                                </span>
                                            </span>
                                        </div>
                                        <div className={`text-center py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mt-1 ${hoveredBar.isOver ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                            {hoveredBar.isOver ? '✓ OVER' : '✗ UNDER'}
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-muted">
                                            <span className="text-[9px] text-text-muted font-bold uppercase">Opp Rank</span>
                                            <span className={`text-[10px] font-black ${prop.oppRank.color === 'green' ? 'text-primary' : prop.oppRank.color === 'red' ? 'text-red-400' : 'text-yellow-400'}`}>
                                                #{prop.oppRank.rank} vs {prop.type}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-5 gap-2 mt-3">
                            {[
                                { label: 'L5', rate: l5Rate },
                                { label: 'L10', rate: l10Rate },
                                { label: 'L20', rate: l20Rate },
                                { label: 'H2H', rate: h2hRate },
                                { label: 'Season', rate: seasonRate },
                            ].map(({ label, rate }) => (
                                <div key={label} className={`text-center py-2 rounded-xl border ${rateBg(rate)}`}>
                                    <p className={`text-base font-black ${rateColor(rate)}`}>{rate}%</p>
                                    <p className="text-[8px] text-text-muted font-black uppercase tracking-widest mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 3 — Averages + Minutes + Insights */}
                    <div className="p-4 space-y-4">
                        {/* Shooting averages row */}
                        <div>
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-accent-blue">analytics</span>
                                Season Averages
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {[
                                    { label: 'MIN', value: `${(player.recentLogs.reduce((s, l) => s + parseMinutes(l.minutes), 0) / player.recentLogs.length).toFixed(1)}` },
                                    { label: 'FOULS', value: player.foulsPerGame.toFixed(1) },
                                    { label: 'FG%', value: `${player.fgPct}% (${player.fgMade}/${player.fgAtt})` },
                                    { label: '3PT%', value: `${player.threePct}% (${player.threeMade}/${player.threeAtt})` },
                                    { label: 'FT%', value: `${player.ftPct}% (${player.ftMade}/${player.ftAtt})` },
                                ].map(({ label, value }) => (
                                    <div key={label} className="bg-neutral-800/60 border border-border-muted rounded-xl px-3 py-2">
                                        <p className="text-[8px] text-text-muted font-black uppercase tracking-widest">{label}</p>
                                        <p className="text-[10px] font-black text-text-main mt-0.5 leading-tight">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Minutes Played sub-chart */}
                        <div>
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-accent-blue">timer</span>
                                Minutes Played — Last 10
                            </p>
                            <div className="space-y-1.5">
                                {logs.map(log => {
                                    const mins = parseMinutes(log.minutes);
                                    const pct = (mins / maxMins) * 100;
                                    const isLow = mins < 25;
                                    return (
                                        <div key={log.id} className="flex items-center gap-3">
                                            <span className="text-[9px] text-text-muted font-bold w-10 text-right shrink-0">{log.date}</span>
                                            <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-yellow-400' : 'bg-accent-blue'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className={`text-[9px] font-black w-8 shrink-0 ${isLow ? 'text-yellow-400' : 'text-accent-blue'}`}>{log.minutes}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Insights text box */}
                        <div className="bg-neutral-950/40 border border-accent-purple/20 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-accent-purple text-base mt-0.5">auto_awesome</span>
                                <div>
                                    <p className="text-[9px] font-black text-accent-purple uppercase tracking-widest mb-1">PickLabs AI Insight</p>
                                    <p className="text-[10px] text-text-muted leading-relaxed">{buildInsight(player, prop)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 4 — Positional Matchup Table */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-orange-400">compare_arrows</span>
                                {prop.type} vs {player.opponent} by Position
                            </p>
                            {/* Position filter tabs */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPosFilter(null)}
                                    className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all
                                        ${posFilter === null ? 'bg-primary/20 text-primary border-primary/40' : 'bg-neutral-800 text-text-muted border-border-muted hover:border-primary/30'}`}
                                >All</button>
                                {positions.map(pos => (
                                    <button
                                        key={pos}
                                        onClick={() => setPosFilter(pos === posFilter ? null : pos)}
                                        className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all
                                            ${posFilter === pos ? 'bg-primary/20 text-primary border-primary/40' : 'bg-neutral-800 text-text-muted border-border-muted hover:border-primary/30'}`}
                                    >{pos}</button>
                                ))}
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border-muted">
                                    {['Player / Date', 'Pos', 'Result', 'Line', 'Odds'].map(h => (
                                        <th key={h} className="text-[8px] font-black text-text-muted uppercase tracking-wider pb-2 pr-2">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMatchups.map((row, idx) => (
                                    <tr key={idx} className="border-b border-border-muted/20 hover:bg-white/[0.02]">
                                        <td className="py-2 pr-2">
                                            <p className="text-[9px] font-black text-text-main">{row.player}</p>
                                            <p className="text-[8px] text-text-muted">{row.date}</p>
                                        </td>
                                        <td className="py-2 pr-2">
                                            <span className="text-[8px] font-black text-text-muted uppercase px-1.5 py-0.5 rounded bg-neutral-800 border border-border-muted">{row.pos}</span>
                                        </td>
                                        <td className="py-2 pr-2">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${row.result === 'Over' ? 'text-primary bg-primary/10 border-primary/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}>
                                                {row.result}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-2 text-[9px] font-black text-text-main">{row.line}</td>
                                        <td className="py-2 text-[9px] font-black text-text-muted">{row.odds}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ────────────────────────────────────────
                    RIGHT COL — Team Sidebar
                ─────────────────────────────────────────── */}
                <div className="divide-y divide-border-muted">

                    {/* Team Record */}
                    <div className="p-4">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">emoji_events</span>
                            {player.teamName} Record
                        </p>
                        <div className="space-y-2">
                            {[
                                { label: 'Home', value: player.teamRecord.home },
                                { label: 'Away', value: player.teamRecord.away },
                                { label: 'Conference', value: player.teamRecord.conf, sub: `Rank #${player.teamRecord.confRank}` },
                                { label: 'Division', value: player.teamRecord.div, sub: `Rank #${player.teamRecord.divRank}` },
                                { label: 'ATS', value: player.teamRecord.ats, sub: `${player.teamRecord.atsPct}% cover rate` },
                            ].map(({ label, value, sub }) => (
                                <div key={label} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{label}</p>
                                        {sub && <p className="text-[8px] text-text-muted/60">{sub}</p>}
                                    </div>
                                    <span className={`text-[10px] font-black ${value.startsWith('1') || parseInt(value) >= 15 ? 'text-primary' :
                                        parseInt(value) <= 10 ? 'text-red-400' : 'text-text-main'
                                        }`}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Public Betting Module */}
                    <div className="p-4">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">groups</span>
                            Public Betting %
                        </p>

                        {[
                            {
                                label: 'Money Line',
                                betPct: player.publicBetting.mlBetPct,
                                moneyPct: player.publicBetting.mlMoneyPct,
                                icon: 'payments'
                            },
                            {
                                label: 'Spread',
                                betPct: player.publicBetting.spreadBetPct,
                                moneyPct: player.publicBetting.spreadMoneyPct,
                                icon: 'trending_up'
                            },
                            {
                                label: 'Over / Under',
                                betPct: player.publicBetting.ouBetPct,
                                moneyPct: player.publicBetting.ouMoneyPct,
                                icon: 'swap_vert'
                            },
                        ].map(({ label, betPct, moneyPct, icon }) => {
                            const isSharp = moneyPct - betPct >= SHARP_THRESHOLD;
                            return (
                                <div key={label} className="mb-4 last:mb-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[12px] text-text-muted">{icon}</span>
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">{label}</span>
                                        </div>
                                        {isSharp && (
                                            <span className="text-[8px] font-black text-accent-purple uppercase tracking-widest px-1.5 py-0.5 rounded bg-accent-purple/10 border border-accent-purple/30">
                                                ⚡ Sharp
                                            </span>
                                        )}
                                    </div>

                                    {/* Bet % bar */}
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[8px] text-text-muted w-12 shrink-0">Bets</span>
                                        <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                                            <div className="h-full bg-neutral-500 rounded-full transition-all duration-700" style={{ width: `${betPct}%` }} />
                                        </div>
                                        <span className="text-[9px] font-black text-text-muted w-8 text-right">{betPct}%</span>
                                    </div>

                                    {/* Money % bar */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] text-text-muted w-12 shrink-0">Money</span>
                                        <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${isSharp ? 'bg-gradient-to-r from-accent-purple/60 to-accent-purple' : 'bg-gradient-to-r from-primary/60 to-primary'}`}
                                                style={{ width: `${moneyPct}%` }}
                                            />
                                        </div>
                                        <span className={`text-[9px] font-black w-8 text-right ${isSharp ? 'text-accent-purple' : 'text-primary'}`}>{moneyPct}%</span>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="mt-4 pt-3 border-t border-border-muted">
                            <p className="text-[8px] text-text-muted font-bold uppercase tracking-widest text-center">
                                When Money% &gt;&gt; Bet% = 💡 Sharp money indicator
                            </p>
                        </div>
                    </div>

                    {/* Odds comparison */}
                    <div className="p-4">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-yellow-400">price_check</span>
                            Line Shopping
                        </p>
                        <div className="space-y-2">
                            {[
                                { book: 'DraftKings', odds: prop.dkOdds, domain: 'draftkings.com', color: '#4F9000' },
                                { book: 'FanDuel', odds: prop.fdOdds, domain: 'fanduel.com', color: '#0052A3' },
                                { book: 'BetMGM', odds: prop.mgmOdds, domain: 'betmgm.com', color: '#B89456' },
                            ].map(b => (
                                <div key={b.book} className="flex items-center justify-between bg-neutral-800/60 border border-border-muted rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-5 rounded flex items-center justify-center" style={{ backgroundColor: b.color }}>
                                            <img src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=32`} alt={b.book} className="h-3 w-3 object-contain" />
                                        </div>
                                        <span className="text-[9px] font-bold text-text-muted">{b.book}</span>
                                    </div>
                                    <span className={`text-[10px] font-black ${b.odds.startsWith('+') ? 'text-primary' : 'text-text-main'}`}>{b.odds}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
