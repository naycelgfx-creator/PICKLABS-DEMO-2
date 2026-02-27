import React, { useState } from 'react';
import { Game } from '../../../data/mockGames';
import { useESPNBoxScore, BoxScorePlayer } from '../../../data/useESPNBoxScore';

interface SportBoxScoreLineupProps {
    game: Game;
}

function sportLabel(sport: string) {
    if (sport.startsWith('Soccer')) return 'Match Lineup';
    if (sport === 'NFL' || sport === 'CFB') return 'Game Roster';
    if (sport === 'MLB') return 'Game Lineup';
    if (sport === 'NHL') return 'Game Roster';
    return 'Game Lineup';
}

function sportIcon(sport: string) {
    if (sport.startsWith('Soccer')) return 'sports_soccer';
    if (sport === 'NFL' || sport === 'CFB') return 'sports_football';
    if (sport === 'MLB') return 'sports_baseball';
    if (sport === 'NHL') return 'sports_hockey';
    return 'sports_basketball';
}

const PlayerAvatar: React.FC<{ player: BoxScorePlayer }> = ({ player }) => {
    const [err, setErr] = useState(false);
    const initials = player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (!err && player.headshot) {
        return (
            <img src={player.headshot} alt={player.name}
                className="w-8 h-8 rounded-full object-cover border border-border-muted flex-shrink-0"
                onError={() => setErr(true)} />
        );
    }
    return (
        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-border-muted flex items-center justify-center text-[9px] font-black text-slate-400 flex-shrink-0">
            {initials}
        </div>
    );
};

const PlayerRow: React.FC<{ player: BoxScorePlayer; badgeColor: string }> = ({ player, badgeColor }) => {
    const [expanded, setExpanded] = useState(false);
    const hot = player.hotScore >= 1.2;
    const cold = player.hotScore <= 0.7;
    const s = player.stats;

    return (
        <>
            <tr
                className={`border-b border-border-muted/30 transition-colors cursor-pointer hover:bg-white/5 ${player.didNotPlay ? 'opacity-40' : ''}`}
                onClick={() => !player.didNotPlay && setExpanded(e => !e)}
            >
                <td className="py-2 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                        <PlayerAvatar player={player} />
                        <div className="min-w-0">
                            <div className="text-[10px] font-black text-text-main leading-tight flex items-center gap-1 flex-wrap">
                                <span className="truncate">{player.name}</span>
                                {hot && <span title="Hot performer">🔥</span>}
                                {cold && !player.didNotPlay && <span title="Cold performer">❄️</span>}
                            </div>
                            <div className="text-[8px] text-slate-500 uppercase font-bold">{player.position} {player.jersey && `#${player.jersey}`}</div>
                        </div>
                        {player.starter && !player.didNotPlay && (
                            <span className={`ml-auto text-[7px] font-black uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${badgeColor}`}>STR</span>
                        )}
                    </div>
                </td>
                <td className="py-2 px-2 text-center text-[10px] font-black text-text-main">{s ? s.pts : '—'}</td>
                <td className="py-2 px-2 text-center text-[10px] font-black text-text-main">{s ? s.reb : '—'}</td>
                <td className="py-2 px-2 text-center text-[10px] font-black text-text-main">{s ? s.ast : '—'}</td>
                <td className="py-2 px-2 text-center text-[10px] font-black text-text-main">{s ? s.stl : '—'}</td>
                <td className="py-2 px-2 text-center text-[10px] font-black text-text-main">{s ? s.blk : '—'}</td>
                <td className="py-2 px-2 text-center text-[10px] font-black text-text-main">{s ? s.to : '—'}</td>
            </tr>
            {expanded && s && (
                <tr className="bg-neutral-900/70">
                    <td colSpan={7} className="px-4 py-3">
                        <div className="flex flex-wrap gap-4">
                            {[
                                { label: 'MIN', val: s.min },
                                { label: 'FG', val: s.fg },
                                { label: '3PT', val: s.fg3 },
                                { label: 'FT', val: s.ft },
                                { label: 'OREB', val: s.oreb },
                                { label: 'DREB', val: s.dreb },
                                { label: 'PF', val: s.pf },
                                { label: '+/-', val: s.plusMinus },
                            ].map(({ label, val }) => (
                                <div key={label} className="text-center">
                                    <div className="text-[11px] font-black text-text-main">{val}</div>
                                    <div className="text-[8px] text-slate-500 uppercase font-bold">{label}</div>
                                </div>
                            ))}
                        </div>
                        {/* Shooting % bars */}
                        <div className="mt-3 flex gap-6">
                            {[{ label: 'FG%', pct: s.fgPct }, { label: '3PT%', pct: s.fg3Pct }, { label: 'FT%', pct: s.ftPct }].map(({ label, pct }) => (
                                <div key={label} className="flex-1 space-y-1">
                                    <div className="flex justify-between text-[8px] text-slate-500 font-black uppercase">
                                        <span>{label}</span><span>{pct.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const TeamSection: React.FC<{
    teamName: string;
    teamLogo: string;
    players: BoxScorePlayer[];
    badgeColor: string;
}> = ({ teamName, teamLogo, players, badgeColor }) => {
    const [showBench, setShowBench] = useState(true);
    const starters = players.filter(p => p.starter && !p.didNotPlay);
    const bench = players.filter(p => !p.starter && !p.didNotPlay);
    const dnp = players.filter(p => p.didNotPlay);

    return (
        <div>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border-muted bg-white/3">
                {teamLogo && <img src={teamLogo} alt="" className="w-7 h-7 object-contain" />}
                <h4 className="text-xs font-black uppercase tracking-widest text-text-main">{teamName}</h4>
                <span className="ml-auto text-[9px] text-slate-500 uppercase">{players.length} players</span>
            </div>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-border-muted bg-white/5">
                        <th className="py-2 px-3 text-left text-[8px] font-black uppercase text-slate-500">Player</th>
                        {['PTS', 'REB', 'AST', 'STL', 'BLK', 'TO'].map(h => (
                            <th key={h} className="py-2 px-2 text-center text-[8px] font-black uppercase text-slate-500">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {starters.length > 0 && (<>
                        <tr><td colSpan={7} className="px-3 py-1 text-[7px] font-black uppercase tracking-widest text-slate-600 bg-white/2">Starters</td></tr>
                        {starters.map(p => <PlayerRow key={p.id} player={p} badgeColor={badgeColor} />)}
                    </>)}
                    {bench.length > 0 && (<>
                        <tr className="cursor-pointer select-none" onClick={() => setShowBench(b => !b)}>
                            <td colSpan={7} className="px-3 py-1 text-[7px] font-black uppercase tracking-widest text-slate-600 bg-white/2">
                                Bench {showBench ? '▲' : '▼'}
                            </td>
                        </tr>
                        {showBench && bench.map(p => <PlayerRow key={p.id} player={p} badgeColor={badgeColor} />)}
                    </>)}
                    {dnp.length > 0 && (<>
                        <tr><td colSpan={7} className="px-3 py-1 text-[7px] font-black uppercase tracking-widest text-slate-600 bg-white/2">DNP / Inactive</td></tr>
                        {dnp.map(p => <PlayerRow key={p.id} player={p} badgeColor={badgeColor} />)}
                    </>)}
                    {players.length === 0 && (
                        <tr><td colSpan={7} className="py-8 text-center text-[10px] font-black uppercase text-slate-500">No player data available</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export const SportBoxScoreLineup: React.FC<SportBoxScoreLineupProps> = ({ game }) => {
    const { data, loading, error } = useESPNBoxScore(game);
    const label = sportLabel(game.sport as string);
    const icon = sportIcon(game.sport as string);

    const awayPlayers = data?.away?.players ?? [];
    const homePlayers = data?.home?.players ?? [];
    const awayTeamName = data?.away?.teamName ?? game.awayTeam.name;
    const homeTeamName = data?.home?.teamName ?? game.homeTeam.name;
    const awayLogo = data?.away?.teamLogo ?? game.awayTeam.logo ?? '';
    const homeLogo = data?.home?.teamLogo ?? game.homeTeam.logo ?? '';

    return (
        <div className="terminal-panel overflow-hidden col-span-12">
            <div className="p-4 border-b border-border-muted flex items-center gap-3 bg-white/5">
                <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
                <h3 className="text-lg font-black text-text-main uppercase italic tracking-[0.2em]">{label} · Side-by-Side</h3>
                {loading && <span className="ml-auto text-[9px] text-slate-500 animate-pulse uppercase font-black">🔄 Fetching roster...</span>}
                {error && !loading && <span className="ml-auto text-[9px] text-red-400 uppercase font-black">⚠ Live data unavailable</span>}
                {!loading && !error && data && (
                    <span className="ml-auto text-[9px] text-primary uppercase font-black">{data.status}</span>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-500 text-[10px] font-black uppercase gap-2 animate-pulse">
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    Loading roster data...
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-border-muted">
                    <TeamSection teamName={awayTeamName} teamLogo={awayLogo} players={awayPlayers} badgeColor="bg-blue-500/20 text-blue-400" />
                    <TeamSection teamName={homeTeamName} teamLogo={homeLogo} players={homePlayers} badgeColor="bg-primary/20 text-primary" />
                </div>
            )}
        </div>
    );
};
