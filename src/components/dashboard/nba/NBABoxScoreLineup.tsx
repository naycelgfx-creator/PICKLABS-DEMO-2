import React, { useState } from 'react';
import { Game } from '../../../data/mockGames';
import { useESPNBoxScore, BoxScorePlayer, TeamBoxLeaders } from '../../../data/useESPNBoxScore';

interface NBABoxScoreLineupProps {
    game: Game;
}

// ─── Shooting tile ────────────────────────────────────────────────────────────
const ShootingTile: React.FC<{ label: string; value: string; accentColor: string }> = ({ label, value, accentColor }) => {
    const parts = value.split('-').map(Number);
    const makes = parts[0] || 0;
    const attempts = parts[1] || 0;
    const pct = attempts > 0 ? Math.round((makes / attempts) * 100) : 0;
    const r = 20;
    const circ = 2 * Math.PI * r;
    const filled = attempts > 0 ? (makes / attempts) * circ : 0;

    return (
        <div className="flex flex-col items-center gap-2 flex-1">
            {/* Ring */}
            <div className="relative">
                <svg width="56" height="56" viewBox="0 0 56 56">
                    {/* Track */}
                    <circle cx="28" cy="28" r={r} fill="none" stroke="#1e1e2e" strokeWidth="5" />
                    {/* Fill */}
                    <circle
                        cx="28" cy="28" r={r}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="5"
                        strokeDasharray={`${filled} ${circ}`}
                        strokeLinecap="round"
                        transform="rotate(-90 28 28)"
                        className="transition-[stroke-dasharray] duration-700 ease-in-out"
                    />
                    <text x="28" y="33" textAnchor="middle" fontSize="10" fontWeight="900" fill="white">{pct}%</text>
                </svg>
            </div>
            {/* Label + split */}
            <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-[11px] font-black text-white mt-0.5">{value}</p>
            </div>
        </div>
    );
};

// ─── Stat highlight block ──────────────────────────────────────────────────────
const StatBlock: React.FC<{ label: string; value: number | string; accent?: string }> = ({ label, value, accent }) => (
    <div className="flex flex-col items-center text-center flex-1 py-2 px-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</span>
        <span className={`text-lg font-black leading-none ${accent ?? 'text-white'}`}>{value}</span>
    </div>
);

// ─── Single expanded player card ─────────────────────────────────────────────
const PlayerExpandedCard: React.FC<{ player: BoxScorePlayer }> = ({ player }) => {
    const s = player.stats!;
    const isHot = player.hotScore >= 3;
    const isCold = player.hotScore <= -3;

    const borderColor = isHot ? 'border-orange-500/40' : isCold ? 'border-blue-500/40' : 'border-white/10';
    const bgColor = isHot ? 'bg-orange-950/10' : isCold ? 'bg-blue-950/10' : 'bg-white/[0.02]';

    const ptColor = isHot ? 'text-orange-400' : 'text-primary';

    return (
        <div className={`mt-1.5 rounded-xl border ${borderColor} ${bgColor} overflow-hidden`}>

            {/* ── Primary stat row ── */}
            <div className="grid grid-cols-6 divide-x divide-white/5 border-b border-white/5">
                <StatBlock label="PTS" value={s.pts} accent={ptColor} />
                <StatBlock label="REB" value={s.reb} accent="text-violet-400" />
                <StatBlock label="AST" value={s.ast} accent="text-blue-400" />
                <StatBlock label="STL" value={s.stl} accent="text-teal-400" />
                <StatBlock label="BLK" value={s.blk} accent="text-red-400" />
                <StatBlock label="TO" value={s.to} accent={s.to > 3 ? 'text-yellow-400' : 'text-slate-400'} />
            </div>

            {/* ── Shooting splits ── */}
            <div className="flex items-stretch divide-x divide-white/5 border-b border-white/5 px-2 py-3">
                <ShootingTile label="FG%" value={s.fg} accentColor="#0df20d" />
                <ShootingTile label="3PT%" value={s.fg3} accentColor="#a855f7" />
                <ShootingTile label="FT%" value={s.ft} accentColor="#3b82f6" />
            </div>

            {/* ── Secondary stats ── */}
            <div className="grid grid-cols-5 divide-x divide-white/5 px-0">
                {([
                    ['MIN', s.min, ''],
                    ['OREB', s.oreb, 'text-slate-300'],
                    ['DREB', s.dreb, 'text-slate-300'],
                    ['PF', s.pf, s.pf >= 4 ? 'text-red-400' : ''],
                    ['+/-', s.plusMinus, String(s.plusMinus).startsWith('+') ? 'text-primary' : String(s.plusMinus).startsWith('-') ? 'text-red-400' : 'text-slate-400'],
                ] as [string, string | number, string][]).map(([lbl, val, accent]) => (
                    <div key={lbl} className="flex flex-col items-center text-center py-2.5 px-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-0.5">{lbl}</span>
                        <span className={`text-[13px] font-black leading-none ${accent || 'text-white'}`}>{val}</span>
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
        ? <span className="material-symbols-outlined text-orange-500 text-sm leading-none align-middle" title="Hot game">local_fire_department</span>
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
                <span className={`material-symbols-outlined text-slate-600 text-sm transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true">
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
                    <span className="flex items-center gap-1 text-orange-400"><span><span className="material-symbols-outlined text-orange-500 text-sm align-middle">local_fire_department</span></span> Hot game</span>
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
