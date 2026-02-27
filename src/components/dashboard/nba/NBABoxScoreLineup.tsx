import React, { useState } from 'react';
import { Game } from '../../../data/mockGames';
import { useESPNBoxScore, BoxScorePlayer, TeamBoxLeaders } from '../../../data/useESPNBoxScore';

interface NBABoxScoreLineupProps {
    game: Game;
}

// ─── Stat bar ────────────────────────────────────────────────────────────────
const StatBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => {
    const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
    return (
        <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 font-black uppercase w-8 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-[10px] font-black text-text-main w-6 text-right flex-shrink-0">{value}</span>
        </div>
    );
};

// ─── FG mini pie (arc segment) ───────────────────────────────────────────────
const FGDonut: React.FC<{ value: string; color: string; label: string }> = ({ value, color, label }) => {
    const parts = value.split('-').map(Number);
    const makes = parts[0] || 0;
    const attempts = parts[1] || 0;
    const pct = attempts > 0 ? ((makes / attempts) * 100).toFixed(0) : '0';
    const r = 16;
    const circ = 2 * Math.PI * r;
    const strokePct = attempts > 0 ? (makes / attempts) * circ : 0;
    return (
        <div className="flex flex-col items-center gap-0.5">
            <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r={r} fill="none" stroke="#1a1a1a" strokeWidth="4" />
                <circle
                    cx="20" cy="20" r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeDasharray={`${strokePct} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                />
                <text x="20" y="24" textAnchor="middle" fontSize="8" fontWeight="900" fill="white">{pct}%</text>
            </svg>
            <span className="text-[8px] text-slate-500 font-black uppercase">{label}</span>
            <span className="text-[9px] text-slate-400 font-bold">{value}</span>
        </div>
    );
};

// ─── Single expanded player card ─────────────────────────────────────────────
const PlayerExpandedCard: React.FC<{ player: BoxScorePlayer }> = ({ player }) => {
    const s = player.stats!;
    const isHot = player.hotScore >= 3;
    const isCold = player.hotScore <= -3;

    return (
        <div className={`mt-2 p-4 rounded-xl border space-y-4 bg-background-dark transition-all ${isHot ? 'border-orange-500/40 bg-orange-950/10' : isCold ? 'border-blue-500/40 bg-blue-950/10' : 'border-border-muted'
            }`}>
            {/* Stat bars — major stats */}
            <div className="grid grid-cols-1 gap-1.5">
                <StatBar label="PTS" value={s.pts} max={40} color={isHot ? 'bg-orange-400' : 'bg-primary'} />
                <StatBar label="REB" value={s.reb} max={20} color="bg-accent-purple" />
                <StatBar label="AST" value={s.ast} max={15} color="bg-blue-400" />
                <StatBar label="STL" value={s.stl} max={5} color="bg-teal-400" />
                <StatBar label="BLK" value={s.blk} max={5} color="bg-red-400" />
                <StatBar label="TO" value={s.to} max={8} color="bg-yellow-500" />
            </div>

            {/* Shooting donuts */}
            <div className="flex justify-around pt-2 border-t border-border-muted/50">
                <FGDonut value={s.fg} color="#0ca810" label="FG%" />
                <FGDonut value={s.fg3} color="#a855f7" label="3PT%" />
                <FGDonut value={s.ft} color="#3b82f6" label="FT%" />
            </div>

            {/* Secondary stats grid */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border-muted/50">
                {[
                    ['MIN', s.min],
                    ['OREB', s.oreb],
                    ['DREB', s.dreb],
                    ['PF', s.pf],
                    ['+/-', s.plusMinus],
                ].map(([label, val]) => (
                    <div key={label} className="text-center">
                        <p className="text-[9px] text-slate-500 font-black uppercase">{label}</p>
                        <p className={`text-sm font-black ${String(val).startsWith('+') ? 'text-primary' : String(val).startsWith('-') ? 'text-red-400' : 'text-text-main'}`}>{val}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Player row (collapsed + expandable) ─────────────────────────────────────
const PlayerRow: React.FC<{ player: BoxScorePlayer; isExpanded: boolean; onClick: () => void; side: 'left' | 'right' }> = ({
    player, isExpanded, onClick, side
}) => {
    const isHot = player.hotScore >= 3;
    const isCold = player.hotScore <= -3;

    const indicator = isHot
        ? <span className="text-orange-400 text-sm leading-none" title="Hot game">🔥</span>
        : isCold
            ? <span className="text-blue-400 text-sm leading-none" title="Cold game">❄️</span>
            : <span className="text-slate-600 text-xs leading-none">•</span>;

    const statLine = player.stats
        ? `${player.stats.pts} PTS · ${player.stats.reb} REB · ${player.stats.ast} AST`
        : 'DNP';

    const headshotEl = (
        <div className="relative flex-shrink-0">
            <img
                src={player.headshot || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=111827&color=ffffff&rounded=true&bold=true&size=64`}
                alt={player.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-border-muted"
                onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.shortName || player.name)}&background=111827&color=ffffff&rounded=true&bold=true&size=64`;
                }}
            />
            {player.starter && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border border-background-dark text-[6px] flex items-center justify-center font-black text-black">S</span>
            )}
        </div>
    );

    const nameBlock = (
        <div className={`min-w-0 flex-1 ${side === 'right' ? 'text-right' : ''}`}>
            <div className={`flex items-center gap-1.5 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
                <span className="text-[10px] font-black text-text-main truncate">{player.name}</span>
                <span className={`text-[8px] text-slate-600 font-black px-1 py-0.5 rounded border border-border-muted/50 flex-shrink-0`}>{player.position}</span>
            </div>
            <p className="text-[9px] text-slate-500 font-bold truncate">{statLine}</p>
        </div>
    );

    return (
        <div>
            <button
                onClick={onClick}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer border ${isExpanded
                        ? isHot ? 'border-orange-500/30 bg-orange-950/10' : isCold ? 'border-blue-500/30 bg-blue-950/10' : 'border-primary/20 bg-primary/5'
                        : 'border-transparent'
                    } ${player.didNotPlay ? 'opacity-40' : ''} ${side === 'right' ? 'flex-row-reverse' : ''}`}
            >
                {headshotEl}
                {nameBlock}
                <div className={`flex flex-col items-center gap-0.5 flex-shrink-0 ${side === 'right' ? 'order-first' : ''}`}>
                    {indicator}
                    {player.stats && (
                        <span className={`text-[9px] font-black ${isHot ? 'text-orange-400' : isCold ? 'text-blue-400' : 'text-text-muted'}`}>
                            {player.hotScore > 0 ? `+${player.hotScore.toFixed(0)}` : player.hotScore.toFixed(0)}
                        </span>
                    )}
                </div>
                <span className={`material-symbols-outlined text-slate-600 text-sm transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                    keyboard_arrow_down
                </span>
            </button>
            {isExpanded && player.stats && <PlayerExpandedCard player={player} />}
        </div>
    );
};

// ─── Team column ──────────────────────────────────────────────────────────────
const TeamColumn: React.FC<{
    team: TeamBoxLeaders;
    fallbackLogo?: string;
    fallbackName?: string;
    score?: number;
    side: 'left' | 'right';
}> = ({ team, fallbackLogo, fallbackName, score, side }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const playing = team.players.filter(p => !p.didNotPlay);
    const dnp = team.players.filter(p => p.didNotPlay);

    const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

    return (
        <div className="flex-1 min-w-0">
            {/* Team header */}
            <div className={`flex items-center gap-3 p-4 border-b border-border-muted ${side === 'right' ? 'flex-row-reverse' : ''}`}>
                <img
                    src={team.teamLogo || fallbackLogo}
                    alt={team.teamName || fallbackName}
                    className="w-10 h-10 object-contain flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className={`flex-1 min-w-0 ${side === 'right' ? 'text-right' : ''}`}>
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest truncate">{team.teamName || fallbackName}</h3>
                    {score !== undefined && (
                        <p className="text-2xl font-black text-primary">{score}</p>
                    )}
                </div>
            </div>

            {/* Starters header */}
            <div className="px-3 py-1.5 bg-white/5 border-b border-border-muted">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Starters</p>
            </div>

            <div className="p-2 space-y-0.5">
                {playing.filter(p => p.starter).map(p => (
                    <PlayerRow
                        key={p.id}
                        player={p}
                        isExpanded={expandedId === p.id}
                        onClick={() => toggle(p.id)}
                        side={side}
                    />
                ))}
            </div>

            {/* Bench */}
            {playing.filter(p => !p.starter).length > 0 && (
                <>
                    <div className="px-3 py-1.5 bg-white/5 border-y border-border-muted">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Bench</p>
                    </div>
                    <div className="p-2 space-y-0.5">
                        {playing.filter(p => !p.starter).map(p => (
                            <PlayerRow
                                key={p.id}
                                player={p}
                                isExpanded={expandedId === p.id}
                                onClick={() => toggle(p.id)}
                                side={side}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* DNP */}
            {dnp.length > 0 && (
                <div className="px-3 py-1.5 border-t border-border-muted/40">
                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-1">Did Not Play</p>
                    {dnp.map(p => (
                        <div key={p.id} className={`flex items-center gap-2 py-1 opacity-35 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
                            <img
                                src={p.headshot || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=111827&color=555&rounded=true&bold=true&size=40`}
                                alt={p.name}
                                className="w-6 h-6 rounded-full object-cover border border-border-muted"
                                onError={(e) => {
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.shortName || p.name)}&background=111827&color=555&rounded=true&bold=true&size=40`;
                                }}
                            />
                            <span className="text-[9px] text-slate-600 font-bold truncate">{p.name}</span>
                            <span className="text-[8px] text-slate-700 font-black">DNP</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────
export const NBABoxScoreLineup: React.FC<NBABoxScoreLineupProps> = ({ game }) => {
    const { data, loading, error } = useESPNBoxScore(game.sport, game.matchupId);

    return (
        <div className="terminal-panel col-span-12 overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-border-muted flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">groups</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-text-main uppercase tracking-[0.2em]">Full Box Score</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Both lineups · click player for full stats
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1 text-orange-400"><span>🔥</span> Hot game</span>
                    <span className="flex items-center gap-1 text-blue-400"><span>❄️</span> Cold game</span>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center gap-3 p-16 text-text-muted">
                    <span className="material-symbols-outlined animate-spin text-primary text-2xl">autorenew</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Loading box score…</span>
                </div>
            )}

            {!loading && (error || !data || (data.away.players.length === 0 && data.home.players.length === 0)) && (
                <div className="flex items-center gap-3 p-8 text-text-muted">
                    <span className="material-symbols-outlined text-slate-500">info</span>
                    <p className="text-xs font-bold">
                        {game.status === 'UPCOMING'
                            ? 'Lineup and box score will be available once the game begins.'
                            : 'Box score not available for this matchup.'}
                    </p>
                </div>
            )}

            {!loading && data && (data.away.players.length > 0 || data.home.players.length > 0) && (
                <div className="flex divide-x divide-border-muted min-h-[400px]">
                    <TeamColumn
                        team={data.away}
                        fallbackLogo={game.awayTeam.logo}
                        fallbackName={game.awayTeam.name}
                        score={data.finalScore?.away}
                        side="left"
                    />
                    <TeamColumn
                        team={data.home}
                        fallbackLogo={game.homeTeam.logo}
                        fallbackName={game.homeTeam.name}
                        score={data.finalScore?.home}
                        side="right"
                    />
                </div>
            )}
        </div>
    );
};
