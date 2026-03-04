import React, { useState, useEffect } from 'react';
import { Game } from '../../data/mockGames';
import { generateMockPlayers, Player, PlayerProp, PlayerLog } from '../../data/mockPlayers';
import { BetPick } from '../../App';
import { FavoritePlayerPanel } from './FavoritePlayerPanel';
import { useRookieMode } from '../../contexts/RookieModeContext';
import { GlossaryTooltip } from '../ui/GlossaryTooltip';

interface PlayerPropsFormProps {
    game: Game;
    onAddBet: (bet: BetPick) => void;
}

type SortCol = 'l5' | 'l10' | 'l20' | 'h2h' | 'season' | 'line' | 'ip' | 'opp';
type SortDir = 'asc' | 'desc';

// Compute hit-rate % from an array of 0-100 "hit" values (>50 = over)
const hitPct = (arr: number[]): number => {
    if (!arr.length) return 0;
    return Math.round(arr.filter(v => v > 50).length / arr.length * 100);
};

// ── Game Square Strip ─────────────────────────────────────────
// Bigger squares with opponent abbreviation below + hover tooltip
const GameSquareStrip: React.FC<{
    logs: PlayerLog[];
    line: number;
    propType: string;
    count?: number;
}> = ({ logs, line, propType, count }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
    const sliced = count ? logs.slice(0, count) : logs;

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '3px', minHeight: '44px' }}>
            {sliced.map((log, i) => {
                const isOver = log.stat1 >= line;
                const opp = log.opponent.replace(/^@\s*/, '').substring(0, 3).toUpperCase();
                return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <div
                            style={{
                                width: '16px',
                                height: '28px',
                                borderRadius: '2px',
                                backgroundColor: isOver ? '#10b981' : '#ef4444',
                                cursor: 'help',
                                flexShrink: 0,
                                transition: 'transform 0.1s'
                            }}
                            onMouseEnter={e => {
                                (e.target as HTMLElement).style.transform = 'scale(1.15)';
                                const rect = (e.target as HTMLElement).getBoundingClientRect();
                                setTooltip({
                                    x: rect.left + rect.width / 2,
                                    y: rect.top - 8,
                                    text: `vs ${opp}: ${log.stat1} ${propType}`
                                });
                            }}
                            onMouseLeave={e => {
                                (e.target as HTMLElement).style.transform = '';
                                setTooltip(null);
                            }}
                        />
                        <span style={{ fontSize: '8px', fontWeight: 700, color: '#94a3b8', lineHeight: 1 }}>{opp}</span>
                    </div>
                );
            })}
            {tooltip && (
                <div
                    style={{
                        position: 'fixed',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -100%)',
                        background: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        color: '#fff',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    );
};

// Pct badge
const PctBadge: React.FC<{ pct: number; muted?: boolean }> = ({ pct, muted }) => {
    const color = pct >= 70 ? 'text-emerald-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400';
    return (
        <span className={`font-black text-sm tabular-nums ${muted ? 'text-slate-500' : color}`}>
            {pct}%
        </span>
    );
};

// OPP Rank badge
const OppRankBadge: React.FC<{ rank: number; color: 'green' | 'red' | 'yellow' }> = ({ rank, color }) => {
    const cls = color === 'green'
        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        : color === 'red'
            ? 'bg-red-500/15 text-red-400 border-red-500/30'
            : 'bg-yellow-400/15 text-yellow-400 border-yellow-400/30';
    const label = rank <= 10 ? `${rank}th` : rank <= 20 ? `${rank}th` : `${rank}th`;
    return (
        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${cls}`}>
            {label}
        </span>
    );
};

interface PropRow {
    player: Player;
    prop: PlayerProp;
    l5Pct: number;
    l10Pct: number;
    l20Pct: number;
    h2hPct: number;
    seasonPct: number;
}

export const PlayerPropsForm: React.FC<PlayerPropsFormProps> = ({ game, onAddBet }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [expandedKey, setExpandedKey] = useState<string | null>(null);
    const [sortCol, setSortCol] = useState<SortCol>('l10');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const { isRookieModeActive } = useRookieMode();

    useEffect(() => {
        const away = generateMockPlayers(game.awayTeam.name, game.sport, 5);
        const home = generateMockPlayers(game.homeTeam.name, game.sport, 5);
        setPlayers([...away, ...home]);
        setExpandedKey(null);
    }, [game]);

    if (players.length === 0) return null;

    // Build flat rows (each player × each prop)
    const rows: PropRow[] = players.flatMap(player =>
        player.props.map(prop => ({
            player,
            prop,
            l5Pct: hitPct(prop.l5),
            l10Pct: hitPct(prop.l10),
            l20Pct: hitPct(prop.l20),
            h2hPct: hitPct(prop.h2h),
            seasonPct: hitPct(prop.season2025),
        }))
    );

    const handleSort = (col: SortCol) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('desc'); }
    };

    const sorted = [...rows].sort((a, b) => {
        let av = 0, bv = 0;
        if (sortCol === 'l5') { av = a.l5Pct; bv = b.l5Pct; }
        else if (sortCol === 'l10') { av = a.l10Pct; bv = b.l10Pct; }
        else if (sortCol === 'l20') { av = a.l20Pct; bv = b.l20Pct; }
        else if (sortCol === 'h2h') { av = a.h2hPct; bv = b.h2hPct; }
        else if (sortCol === 'season') { av = a.seasonPct; bv = b.seasonPct; }
        else if (sortCol === 'line') { av = a.prop.line; bv = b.prop.line; }
        else if (sortCol === 'ip') { av = a.prop.impliedProb; bv = b.prop.impliedProb; }
        else if (sortCol === 'opp') { av = a.prop.oppRank.rank; bv = b.prop.oppRank.rank; }
        return sortDir === 'desc' ? bv - av : av - bv;
    });

    const handleAddProp = (player: Player, prop: PlayerProp) => {
        onAddBet({
            id: `prop-${Date.now()}`,
            gameId: game.id,
            type: 'Prop',
            team: `${player.name} Over ${prop.line} ${prop.type}`,
            odds: prop.overOdds,
            matchupStr: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
            stake: 25.00,
        });
    };

    const SortArrow = ({ col }: { col: SortCol }) => (
        <span className={`ml-0.5 text-[8px] ${sortCol === col ? 'text-primary' : 'text-slate-600'}`}>
            {sortCol === col ? (sortDir === 'desc' ? '▼' : '▲') : '↕'}
        </span>
    );

    const ThBtn: React.FC<{ col: SortCol; children: React.ReactNode; className?: string }> = ({ col, children, className }) => (
        <th
            className={`py-3 px-2 text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-text-main transition-colors select-none whitespace-nowrap ${sortCol === col ? 'text-primary' : ''} ${className ?? ''}`}
            onClick={() => handleSort(col)}
        >
            {children}<SortArrow col={col} />
        </th>
    );

    // Group rows by player to show dividers between teams
    const awayTeamName = game.awayTeam.name;

    return (
        <div className="terminal-panel overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border-muted flex justify-between items-center bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-accent-purple text-sm">person_search</span>
                    {isRookieModeActive ? (
                        <GlossaryTooltip term="Player Props" definition="Bets on individual player statistics like points, rebounds, or assists." example={`Will ${sorted[0]?.player.name ?? 'the player'} go Over ${sorted[0]?.prop.line ?? '—'} points?`}>
                            <span>Player Props</span>
                        </GlossaryTooltip>
                    ) : 'Player Props'}
                    <span className="text-text-muted font-normal normal-case tracking-normal">— Showing props for <span className="text-primary font-bold">{players.length} {game.awayTeam.name} & {game.homeTeam.name} players</span> · Real ESPN roster</span>
                </h3>
                <div className="flex items-center gap-4 text-[9px] font-black uppercase text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Over</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Under</span>
                </div>
            </div>

            {/* Scrollable table */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="border-b-2 border-border-muted bg-neutral-900/60 sticky top-0 z-10">
                            <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-slate-500 w-64">Proposition</th>
                            <ThBtn col="line" className="w-16 text-center">Line</ThBtn>
                            <th className="py-3 px-2 text-[9px] font-black uppercase tracking-widest text-slate-500 w-28 text-center">Odds
                                <span className="block text-[7px] text-slate-600 font-bold normal-case tracking-normal">DK · FD</span>
                            </th>
                            <ThBtn col="ip" className="w-14 text-center">IP%</ThBtn>
                            <ThBtn col="opp" className="w-20 text-center">Opp Rank</ThBtn>
                            <ThBtn col="l5" className="w-28 text-center">L5</ThBtn>
                            <ThBtn col="l10" className="w-36 text-center">
                                L10 <span className="text-primary">↓</span>
                            </ThBtn>
                            <ThBtn col="l20" className="w-16 text-center">L20</ThBtn>
                            <ThBtn col="h2h" className="w-16 text-center">H2H</ThBtn>
                            <ThBtn col="season" className="w-16 text-center">2025</ThBtn>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row, idx) => {
                            const { player, prop } = row;
                            const key = `${player.id}-${prop.id}`;
                            const isExpanded = expandedKey === key;
                            const isOver = row.l10Pct >= 50;
                            // Team divider
                            const isFirstOfHomeTeam = player.teamName !== awayTeamName
                                && (idx === 0 || sorted[idx - 1].player.teamName === awayTeamName);

                            return (
                                <React.Fragment key={key}>
                                    {isFirstOfHomeTeam && (
                                        <tr>
                                            <td colSpan={10} className="py-1 px-4 bg-neutral-900/30 border-y border-border-muted">
                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                                                    {game.homeTeam.name}
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    {idx === 0 && (
                                        <tr>
                                            <td colSpan={10} className="py-1 px-4 bg-neutral-900/30 border-b border-border-muted">
                                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                                                    {awayTeamName}
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    {/* Main data row */}
                                    <tr
                                        className={`border-b border-border-muted/40 cursor-pointer transition-colors group
                                            ${isExpanded
                                                ? 'bg-accent-purple/8 border-l-2 border-l-accent-purple'
                                                : 'hover:bg-white/[0.03]'
                                            }`}
                                        onClick={() => setExpandedKey(isExpanded ? null : key)}
                                    >
                                        {/* PROPOSITION */}
                                        <td className="py-2.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    className="shrink-0 w-5 h-5 rounded-full border border-border-muted text-text-muted hover:text-primary hover:border-primary transition-colors flex items-center justify-center text-xs"
                                                    title="Add to bet slip"
                                                    onClick={e => { e.stopPropagation(); handleAddProp(player, prop); }}
                                                >+</button>
                                                <img
                                                    src={player.photoUrl}
                                                    alt={player.name}
                                                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-border-muted bg-neutral-800"
                                                    onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random&color=fff&rounded=true`; }}
                                                />
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[11px] font-black text-text-main uppercase leading-tight">{player.name}</span>
                                                        {row.l10Pct >= 70 && <span className="material-symbols-outlined text-orange-500 text-[10px] align-middle">local_fire_department</span>}
                                                        {row.l10Pct <= 30 && <span className="text-[10px]">❄️</span>}
                                                    </div>
                                                    <span className={`text-[9px] font-bold ${isOver ? 'text-emerald-400' : 'text-accent-purple'}`}>
                                                        {isOver ? 'Over' : 'Under'} {prop.line} {prop.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* LINE */}
                                        <td className="py-2.5 px-2 text-center">
                                            <span className="text-sm font-black text-text-main tabular-nums">{prop.line}</span>
                                        </td>

                                        {/* ODDS */}
                                        <td className="py-2.5 px-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-[10px] font-bold text-slate-300 bg-neutral-800/60 px-1.5 py-0.5 rounded">{prop.dkOdds}</span>
                                                <span className="text-[10px] font-bold text-slate-300 bg-neutral-800/60 px-1.5 py-0.5 rounded">{prop.fdOdds}</span>
                                            </div>
                                        </td>

                                        {/* IP% */}
                                        <td className="py-2.5 px-2 text-center">
                                            <span className="text-[11px] font-bold text-slate-400 tabular-nums">{prop.impliedProb}%</span>
                                        </td>

                                        {/* OPP RANK */}
                                        <td className="py-2.5 px-2 text-center">
                                            <OppRankBadge rank={prop.oppRank.rank} color={prop.oppRank.color} />
                                        </td>

                                        {/* L5 */}
                                        <td className="py-2 px-2">
                                            <GameSquareStrip
                                                logs={player.recentLogs}
                                                line={prop.line}
                                                propType={prop.type}
                                                count={5}
                                            />
                                        </td>

                                        {/* L10 — featured column */}
                                        <td className={`py-2 px-2 ${sortCol === 'l10' ? 'bg-primary/5' : ''}`}>
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`text-[9px] font-black uppercase ${row.l10Pct >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {row.l10Pct}% Hit Rate
                                                </span>
                                                <GameSquareStrip
                                                    logs={player.recentLogs}
                                                    line={prop.line}
                                                    propType={prop.type}
                                                />
                                            </div>
                                        </td>

                                        {/* L20 */}
                                        <td className="py-2.5 px-2 text-center">
                                            <PctBadge pct={row.l20Pct} />
                                        </td>

                                        {/* H2H */}
                                        <td className="py-2.5 px-2 text-center">
                                            <PctBadge pct={row.h2hPct} />
                                        </td>

                                        {/* 2025 */}
                                        <td className="py-2.5 px-2 text-center">
                                            <PctBadge pct={row.seasonPct} />
                                        </td>
                                    </tr>

                                    {/* Expanded deep-dive panel */}
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={10} className="p-0 border-b-2 border-accent-purple/40">
                                                <div className="bg-neutral-900/60 border-t border-accent-purple/20 animate-in slide-in-from-top-1 duration-200">
                                                    {/* Panel header */}
                                                    <div className="flex items-center justify-between px-6 py-3 border-b border-border-muted bg-accent-purple/5">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={player.photoUrl}
                                                                alt={player.name}
                                                                className="w-8 h-8 rounded-full object-cover border border-accent-purple/40 bg-neutral-800"
                                                                onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=random&color=fff&rounded=true`; }}
                                                            />
                                                            <div>
                                                                <h4 className="text-sm font-black text-text-main uppercase tracking-wider">{player.name} — Deep-Dive Analysis</h4>
                                                                <p className="text-[10px] text-accent-purple font-bold uppercase tracking-widest">{player.teamName}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setExpandedKey(null); }}
                                                            className="p-1.5 rounded border border-border-muted text-slate-500 hover:text-white hover:border-accent-purple/40 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">close</span>
                                                        </button>
                                                    </div>
                                                    {/* Deep-dive content */}
                                                    <div className="p-6">
                                                        <FavoritePlayerPanel
                                                            player={player}
                                                            sport={game.sport}
                                                            onAddBet={onAddBet}
                                                            onClose={() => setExpandedKey(null)}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
