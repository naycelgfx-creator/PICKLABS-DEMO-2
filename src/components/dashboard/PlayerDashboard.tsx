import React, { useState, useRef } from 'react';
import { Player, PlayerLog, PlayerProp } from '../../data/mockPlayers';
import { getCurrentUser, isAdminEmail } from '../../data/PickLabsAuthDB';

interface BoxPopData {
    log: PlayerLog;
    bar: { x: number; y: number; width: number };
    isOver: boolean;
    stat: number;
    line: number;
}

interface PlayerDashboardProps {
    player: Player;
    prop: PlayerProp;
    sport: string;
}

const OPP_POSITION_DATA = [
    { opp: 'vs PG Allowed', rank: 8, avgAllowed: 28.4, color: 'text-red-400' },
    { opp: 'vs SG Allowed', rank: 15, avgAllowed: 24.1, color: 'text-yellow-400' },
    { opp: 'vs SF Allowed', rank: 3, avgAllowed: 19.8, color: 'text-primary' },
    { opp: 'vs PF Allowed', rank: 22, avgAllowed: 27.6, color: 'text-red-400' },
    { opp: 'vs C Allowed', rank: 11, avgAllowed: 22.3, color: 'text-yellow-400' },
];

function parseMinutes(minStr: string): number {
    const parts = minStr.split(':');
    return parseInt(parts[0], 10) + parseInt(parts[1] || '0', 10) / 60;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ player, prop, sport }) => {
    const isPremiumUser = getCurrentUser()?.isPremium || isAdminEmail(getCurrentUser()?.email || '');
    const [hoveredBar, setHoveredBar] = useState<BoxPopData | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    const logs = player.recentLogs.slice(0, 10);
    const statLabel = prop.type;
    const line = prop.line;

    // Chart dimensions
    const CHART_H = 160;
    const BAR_GAP = 6;
    const maxStat = Math.max(...logs.map(l => l.stat1), line * 1.5, 1);

    const overCount = logs.filter(l => l.stat1 > line).length;
    const underCount = logs.length - overCount;
    const overPct = Math.round((overCount / logs.length) * 100);
    const underPct = 100 - overPct;

    const minutes = logs.map(l => parseMinutes(l.minutes));
    const maxMins = Math.max(...minutes, 40);

    const handleBarEnter = (
        _e: React.MouseEvent<SVGRectElement>,
        log: PlayerLog,
        isOver: boolean,
        barX: number,
        barY: number,
        barW: number
    ) => {
        setHoveredBar({ log, bar: { x: barX, y: barY, width: barW }, isOver, stat: log.stat1, line });
    };

    return (
        <div className="mt-4 space-y-4 border-t border-border-muted pt-4">

            {/* ── Header Strip ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={player.photoUrl} alt={player.name} className="w-10 h-10 rounded-full object-cover border border-border-muted bg-neutral-800" onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18181b&color=fff&rounded=true`; }} />
                    <div>
                        <p className="text-xs font-black text-text-main uppercase tracking-widest">{player.name}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase">{prop.type} Line: <span className="text-primary">{line}</span></p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="text-center">
                        <p className="text-lg font-black text-primary">{overCount}/10</p>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Over L10</p>
                    </div>
                    <div className="w-px bg-border-muted" />
                    <div className="text-center">
                        <p className="text-lg font-black text-text-muted">{underCount}/10</p>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Under L10</p>
                    </div>
                    <div className="w-px bg-border-muted" />
                    <div className="text-center">
                        <p className={`text-lg font-black ${overPct >= 60 ? 'text-primary' : overPct <= 40 ? 'text-red-400' : 'text-yellow-400'}`}>{overPct}%</p>
                        <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Hit Rate</p>
                    </div>
                </div>
            </div>

            {/* ── Main Bar Chart ── */}
            <div className="bg-neutral-900/60 border border-border-muted rounded-xl p-4 relative" ref={chartRef}>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-accent-purple">bar_chart</span>
                        Last 10 Games — {statLabel}
                    </p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                            <span className="text-[9px] text-text-muted font-bold uppercase">Over</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                            <span className="text-[9px] text-text-muted font-bold uppercase">Under</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-8 border-t-2 border-dashed border-yellow-400" />
                            <span className="text-[9px] text-yellow-400 font-bold uppercase">Line {line}</span>
                        </div>
                    </div>
                </div>

                {/* SVG Chart */}
                <div className="relative select-none">
                    <svg
                        viewBox={`0 0 ${logs.length * (100 / logs.length) * logs.length} ${CHART_H + 30}`}
                        className="w-full overflow-visible"
                        style={{ height: CHART_H + 30 }}
                        onMouseLeave={() => setHoveredBar(null)}
                    >
                        {/* Y-axis gridlines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                            const y = CHART_H - pct * CHART_H;
                            const val = Math.round(pct * maxStat);
                            return (
                                <g key={pct}>
                                    <line x1="0" y1={y} x2="100%" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                                    <text x="0" y={y - 3} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">{val}</text>
                                </g>
                            );
                        })}



                        {/* Bars */}
                        {logs.map((log, i) => {
                            const totalW = 700;
                            const barW = (totalW / logs.length) - BAR_GAP;
                            const barX = i * (totalW / logs.length) + BAR_GAP / 2 + 12;
                            const isOver = log.stat1 > line;
                            const barH = Math.max(4, (log.stat1 / maxStat) * CHART_H);
                            const barY = CHART_H - barH;

                            return (
                                <g key={log.id}>
                                    {/* Bar glow background */}
                                    <rect
                                        x={barX - 1} y={barY - 1}
                                        width={barW + 2} height={barH + 2}
                                        fill={isOver ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'}
                                        rx="3"
                                    />
                                    {/* Main bar */}
                                    <rect
                                        x={barX} y={barY}
                                        width={barW} height={barH}
                                        fill={isOver ? '#22c55e' : '#ef4444'}
                                        rx="3"
                                        className="cursor-pointer transition-opacity hover:opacity-80"
                                        onMouseEnter={e => handleBarEnter(e, log, isOver, barX, barY, barW)}
                                    />
                                    {/* Stat value ABOVE bar */}
                                    <text
                                        x={barX + barW / 2} y={barY - 4}
                                        textAnchor="middle"
                                        fill={isOver ? '#4ade80' : '#f87171'}
                                        fontSize="10" fontWeight="900" fontFamily="monospace"
                                    >
                                        {log.stat1}
                                    </text>
                                    {/* Date label at bottom */}
                                    <text
                                        x={barX + barW / 2} y={CHART_H + 16}
                                        textAnchor="middle"
                                        fill="rgba(255,255,255,0.35)"
                                        fontSize="7.5" fontFamily="monospace"
                                        transform={`rotate(-30, ${barX + barW / 2}, ${CHART_H + 16})`}
                                    >
                                        {log.date}
                                    </text>
                                </g>
                            );
                        })}

                        {/* ── Yellow prop line ABOVE all bars ── */}
                        {(() => {
                            const lineY = CHART_H - (line / maxStat) * CHART_H;
                            return (
                                <g>
                                    {/* Glow shadow */}
                                    <line
                                        x1="0" y1={lineY} x2="700" y2={lineY}
                                        stroke="#facc15"
                                        strokeWidth="5"
                                        strokeOpacity="0.15"
                                    />
                                    {/* Main line */}
                                    <line
                                        x1="0" y1={lineY} x2="700" y2={lineY}
                                        stroke="#facc15"
                                        strokeWidth="2"
                                        strokeDasharray="6,4"
                                    />
                                    <text x="4" y={lineY - 4} fill="#facc15" fontSize="9" fontWeight="bold" fontFamily="monospace">{line}</text>
                                </g>
                            );
                        })()}
                    </svg>

                    {/* ── Box Pop Tooltip ── */}
                    {hoveredBar && (
                        <div
                            className="absolute z-30 bg-neutral-900 border border-border-muted rounded-xl shadow-2xl p-3 w-56 pointer-events-none"
                            style={{
                                bottom: `calc(100% - ${hoveredBar.bar.y}px + 8px)`,
                                left: `max(0px, min(calc(${(hoveredBar.bar.x / 700) * 100}% - 112px), calc(100% - 224px)))`,
                            }}
                        >
                            {/* Header: player logo vs opp logo */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <img
                                        src={player.photoUrl}
                                        alt={player.name}
                                        className="w-7 h-7 rounded-full object-cover border border-border-muted bg-neutral-800"
                                        onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=18181b&color=fff&rounded=true`; }}
                                    />
                                    <span className="text-[10px] font-black text-white uppercase">{hoveredBar.log.date}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">vs</span>
                                    <span className="text-[9px] font-black text-text-main uppercase">{hoveredBar.log.opponent}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${hoveredBar.log.result === 'W' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                                        {hoveredBar.log.result}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-border-muted mb-2" />

                            {/* Date */}
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[9px] text-text-muted font-bold uppercase">Date</span>
                                <span className="text-[9px] text-text-main font-bold">{hoveredBar.log.date}</span>
                            </div>

                            {/* Player stat vs line */}
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[9px] text-text-muted font-bold uppercase">{statLabel}</span>
                                <span className={`text-sm font-black ${hoveredBar.isOver ? 'text-primary' : 'text-red-400'}`}>
                                    {hoveredBar.stat}
                                    <span className="text-[9px] text-text-muted ml-1 font-bold">
                                        ({hoveredBar.isOver ? '+' : ''}{hoveredBar.stat - hoveredBar.line} vs {hoveredBar.line})
                                    </span>
                                </span>
                            </div>

                            {/* Over/Under badge */}
                            <div className={`text-center mt-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${hoveredBar.isOver ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                {hoveredBar.isOver ? '✓ OVER' : '✗ UNDER'}
                            </div>

                            {/* Opp Rank */}
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

            {/* ── Minutes Played Sub-Chart ── */}
            <div className="bg-neutral-900/60 border border-border-muted rounded-xl p-4">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-accent-blue">timer</span>
                    Minutes Played — Last 10 Games
                </p>
                <div className="space-y-1.5">
                    {logs.map((log) => {
                        const mins = parseMinutes(log.minutes);
                        const pct = (mins / maxMins) * 100;
                        const isLow = mins < 25;
                        return (
                            <div key={log.id} className="flex items-center gap-3">
                                <span className="text-[9px] text-text-muted font-bold w-10 text-right shrink-0">{log.date}</span>
                                <div className="flex-1 bg-neutral-800 rounded-full h-2.5 relative overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-yellow-400' : 'bg-accent-blue'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className={`text-[9px] font-black w-8 shrink-0 ${isLow ? 'text-yellow-400' : 'text-accent-blue'}`}>
                                    {log.minutes}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Bottom Row: Positional Matchup Table + Public Betting % ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Points vs Opponent Positional Table */}
                <div className="bg-neutral-900/60 border border-border-muted rounded-xl p-4">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-orange-400">compare_arrows</span>
                        {sport === 'NBA' ? 'Points vs Opp. Position' : `${prop.type} vs Opp. Position`}
                    </p>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border-muted">
                                <th className="text-[8px] font-black text-text-muted uppercase tracking-wider pb-2">Matchup</th>
                                <th className="text-[8px] font-black text-text-muted uppercase tracking-wider pb-2 text-center">Rank</th>
                                <th className="text-[8px] font-black text-text-muted uppercase tracking-wider pb-2 text-right">Avg Allowed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {OPP_POSITION_DATA.map((row, i) => (
                                <tr key={i} className="border-b border-border-muted/30">
                                    <td className="text-[9px] font-bold text-text-muted py-2">{row.opp}</td>
                                    <td className="py-2 text-center">
                                        <span className={`text-[9px] font-black ${row.color}`}>#{row.rank}</span>
                                    </td>
                                    <td className="text-[10px] font-black text-text-main text-right py-2">{row.avgAllowed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Public Betting % Bars */}
                <div className="bg-neutral-900/60 border border-border-muted rounded-xl p-4">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary">groups</span>
                        Public Betting %
                    </p>

                    {/* Over % */}
                    <div className="mb-5">
                        <div className="flex justify-between mb-1.5">
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                {!isPremiumUser && <span className="material-symbols-outlined text-[10px]">lock</span>} Over {line}
                            </span>
                            <span className={`text-[10px] font-black text-primary ${!isPremiumUser ? 'blur-sm select-none pointer-events-none' : ''}`}>{isPremiumUser ? `${overPct}%` : '88%'}</span>
                        </div>
                        <div className="bg-neutral-800 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-1000"
                                style={{ width: `${overPct}%` }}
                            />
                        </div>
                        <p className="text-[8px] text-text-muted mt-1">{overPct >= 60 ? <><span className="material-symbols-outlined text-orange-500 text-[10px] align-middle mr-1">local_fire_department</span> Sharp lean Over</> : overPct <= 40 ? '⚠ Public fading Over' : '⚖ Even split'}</p>
                    </div>

                    {/* Under % */}
                    <div className="mb-5">
                        <div className="flex justify-between mb-1.5">
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                                {!isPremiumUser && <span className="material-symbols-outlined text-[10px]">lock</span>} Under {line}
                            </span>
                            <span className={`text-[10px] font-black text-red-400 ${!isPremiumUser ? 'blur-sm select-none pointer-events-none' : ''}`}>{isPremiumUser ? `${underPct}%` : '88%'}</span>
                        </div>
                        <div className="bg-neutral-800 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-500/60 to-red-500 rounded-full transition-all duration-1000"
                                style={{ width: `${underPct}%` }}
                            />
                        </div>
                    </div>

                    {/* Odds comparison */}
                    <div className="mt-auto pt-3 border-t border-border-muted grid grid-cols-3 gap-2">
                        {[
                            { book: 'DK', odds: prop.dkOdds },
                            { book: 'FD', odds: prop.fdOdds },
                            { book: 'MGM', odds: prop.mgmOdds },
                        ].map(b => (
                            <div key={b.book} className="text-center bg-neutral-800 rounded-lg py-1.5">
                                <p className="text-[8px] text-text-muted font-bold uppercase">{b.book}</p>
                                <p className="text-[10px] font-black text-primary">{b.odds}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
