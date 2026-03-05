import React, { useEffect, useState, useCallback } from 'react';
import { fetchESPNScoreboardByDate, ESPNGame, APP_SPORT_TO_ESPN, SportKey } from '../../data/espnScoreboard';

interface ESPNScoreboardPanelProps {
    sport: string; // app sport name e.g. "NBA"
    selectedDate?: string; // YYYY-MM-DD, defaults to today
    onSelectGame?: (game: ESPNGame) => void;
    overrideSportKey?: SportKey; // if provided, use this key directly (used for soccer sub-leagues)
    layoutMode?: 'grid' | 'list'; // grid = cards (default), list = compact rows
}

const StatusBadge: React.FC<{ game: ESPNGame }> = ({ game }) => {
    if (game.status === 'in') {
        return (
            <span className="flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                LIVE · {game.statusDetail}
            </span>
        );
    }
    if (game.status === 'post') {
        return (
            <span className="bg-neutral-700 text-slate-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                Final
            </span>
        );
    }
    return (
        <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider">
            {game.statusDetail}
        </span>
    );
};

const ESPNGameCard: React.FC<{ game: ESPNGame; onSelectGame?: (game: ESPNGame) => void }> = ({ game, onSelectGame }) => {
    const isLive = game.status === 'in';
    const isFinal = game.status === 'post';

    return (
        <div
            className={`bg-neutral-900 border rounded-xl overflow-hidden shadow-lg transition-all duration-200 ${isLive ? 'border-red-500/30 hover:border-red-500/60' : 'border-neutral-800 hover:border-primary/40'
                } ${onSelectGame ? 'cursor-pointer' : ''}`}
            onClick={() => onSelectGame?.(game)}
        >
            {/* Card Top: Venue + Broadcast */}
            <div className="bg-neutral-800/60 px-4 py-2 flex items-center justify-between border-b border-neutral-700/50">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium truncate">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    <span className="truncate">{game.venue}{game.city ? ` · ${game.city}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end shrink-0 ml-2">
                    {game.broadcast && (
                        <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">tv</span>
                            {game.broadcast}
                        </span>
                    )}
                    <StatusBadge game={game} />
                </div>
            </div>

            {/* Scoreboard */}
            <div className="px-4 py-4">
                {/* Away Team */}
                <div className={`flex items-center gap-3 mb-3 ${!isFinal ? '' : game.awayTeam.winner ? '' : 'opacity-60'}`}>
                    <div className="w-9 h-9 rounded-full bg-neutral-800 overflow-hidden shrink-0">
                        <img
                            src={game.awayTeam.logo}
                            alt={game.awayTeam.abbreviation}
                            className="w-full h-full object-contain p-1"
                            onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${game.awayTeam.abbreviation}&background=1a1a2e&color=fff&rounded=true`; }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-black text-text-main truncate">{game.awayTeam.displayName}</span>
                            {game.awayTeam.record && (
                                <span className="text-[10px] text-slate-600 font-medium shrink-0">{game.awayTeam.record}</span>
                            )}
                        </div>
                        {/* Quarter scores */}
                        {game.awayTeam.linescores.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                                {game.awayTeam.linescores.map((ls) => (
                                    <span key={ls.period} className="text-[10px] text-slate-600 bg-neutral-800 px-1 rounded min-w-[20px] text-center">{ls.displayValue}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className={`text-2xl font-black tabular-nums ${game.awayTeam.winner ? 'text-text-main' : 'text-text-muted'}`}>
                        {game.awayTeam.score || '—'}
                    </span>
                </div>

                {/* Home Team */}
                <div className={`flex items-center gap-3 ${!isFinal ? '' : game.homeTeam.winner ? '' : 'opacity-60'}`}>
                    <div className="w-9 h-9 rounded-full bg-neutral-800 overflow-hidden shrink-0">
                        <img
                            src={game.homeTeam.logo}
                            alt={game.homeTeam.abbreviation}
                            className="w-full h-full object-contain p-1"
                            onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${game.homeTeam.abbreviation}&background=1a1a2e&color=fff&rounded=true`; }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm font-black text-text-main truncate">{game.homeTeam.displayName}</span>
                            {game.homeTeam.record && (
                                <span className="text-[10px] text-slate-600 font-medium shrink-0">{game.homeTeam.record}</span>
                            )}
                        </div>
                        {game.homeTeam.linescores.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                                {game.homeTeam.linescores.map((ls) => (
                                    <span key={ls.period} className="text-[10px] text-slate-600 bg-neutral-800 px-1 rounded min-w-[20px] text-center">{ls.displayValue}</span>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className={`text-2xl font-black tabular-nums ${game.homeTeam.winner ? 'text-text-main' : 'text-text-muted'}`}>
                        {game.homeTeam.score || '—'}
                    </span>
                </div>
            </div>

            {/* Leaders */}
            {game.leaders.length > 0 && (
                <div className="px-4 pb-3 border-t border-neutral-800/60 pt-3">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar">
                        {game.leaders.slice(0, 3).map((leader, i) => (
                            <React.Fragment key={i}>
                                <div className="flex items-center gap-2.5 shrink-0">
                                    {leader.headshot && (
                                        <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden border border-purple-500 shrink-0 shadow-lg">
                                            <img
                                                src={leader.headshot}
                                                alt={leader.shortName}
                                                className="w-full h-full object-cover"
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                    <div className="flex flex-col justify-center">
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">{leader.category}</div>
                                        <div className="text-sm font-bold text-slate-200 leading-none mb-0.5">{leader.shortName}</div>
                                        <div className="text-xl font-black text-primary leading-none drop-shadow-sm">{leader.displayValue}</div>
                                    </div>
                                </div>
                                {i < game.leaders.length - 1 && i < 2 && (
                                    <div className="w-px h-10 bg-neutral-800/80 my-auto shrink-0"></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* Headline */}
            {game.headline && game.status === 'post' && (
                <div className="px-4 pb-3">
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{game.headline}</p>
                </div>
            )}
        </div>
    );
};

// ── Compact list-view row ──────────────────────────────────────────
const ESPNGameRow: React.FC<{ game: ESPNGame; onSelectGame?: (g: ESPNGame) => void }> = ({ game, onSelectGame }) => {
    const isLive = game.status === 'in';
    const isFinal = game.status === 'post';
    return (
        <div
            onClick={() => onSelectGame?.(game)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${isLive ? 'border-red-500/20 bg-red-500/5 hover:border-red-500/40' : 'border-neutral-800 bg-neutral-900 hover:border-primary/20'
                } ${onSelectGame ? 'cursor-pointer' : ''}`}
        >
            {/* Status */}
            <div className="w-14 shrink-0 text-center">
                {isLive ? (
                    <span className="text-[10px] font-black text-red-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>LIVE
                    </span>
                ) : isFinal ? (
                    <span className="text-[10px] text-slate-500 font-bold">Final</span>
                ) : (
                    <span className="text-[10px] text-primary font-bold">{game.statusDetail}</span>
                )}
            </div>

            {/* Away team */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <img src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} className="w-7 h-7 object-contain" onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${game.awayTeam.abbreviation}&background=1a1a2e&color=fff&rounded=true`; }} />
                <span className={`text-sm font-bold truncate ${isFinal && !game.awayTeam.winner ? 'text-text-muted' : 'text-text-main'}`}>{game.awayTeam.abbreviation}</span>
                <span className={`text-lg font-black tabular-nums ml-auto ${game.awayTeam.winner ? 'text-text-main' : 'text-text-muted'}`}>{game.awayTeam.score || '–'}</span>
            </div>

            <span className="text-slate-700 font-bold px-2">vs</span>

            {/* Home team */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-lg font-black tabular-nums mr-auto ${game.homeTeam.winner ? 'text-text-main' : 'text-text-muted'}`}>{game.homeTeam.score || '–'}</span>
                <span className={`text-sm font-bold truncate ${isFinal && !game.homeTeam.winner ? 'text-text-muted' : 'text-text-main'}`}>{game.homeTeam.abbreviation}</span>
                <img src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} className="w-7 h-7 object-contain" onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${game.homeTeam.abbreviation}&background=1a1a2e&color=fff&rounded=true`; }} />
            </div>

            <div className="flex items-center justify-between mt-3 flex-wrap">
                <StatusBadge game={game} />
                {game.broadcast && (
                    <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">tv</span>
                        {game.broadcast}
                    </span>
                )}
            </div>
        </div>
    );
};

export const ESPNScoreboardPanel: React.FC<ESPNScoreboardPanelProps> = ({ sport, selectedDate, onSelectGame, overrideSportKey, layoutMode = 'grid' }) => {
    const [games, setGames] = useState<ESPNGame[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (label: string) => {
        setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
    };

    // Use overrideSportKey when provided (soccer league sub-selection), otherwise look up from sport name
    const espnSport = overrideSportKey ?? APP_SPORT_TO_ESPN[sport];
    const todayStr = new Date().toISOString().split('T')[0];
    const dateToFetch = selectedDate || todayStr;

    const doFetch = useCallback(async () => {
        if (!espnSport) return;
        setLoading(true);
        setError(null);
        try {
            const data = await fetchESPNScoreboardByDate(espnSport, dateToFetch);
            setGames(data);
            setLastUpdated(new Date().toLocaleTimeString());
        } catch {
            setError(`Failed to load ${sport} games.`);
        } finally {
            setLoading(false);
        }
    }, [espnSport, sport, dateToFetch]);

    useEffect(() => {
        doFetch();
        // Only auto-refresh if viewing today
        if (dateToFetch === todayStr) {
            const interval = setInterval(doFetch, 60_000);
            return () => clearInterval(interval);
        }
    }, [doFetch, dateToFetch, todayStr]);

    if (!espnSport) return null; // No ESPN endpoint for this sport

    const liveCount = games.filter(g => g.status === 'in').length;

    // Build status-grouped sections for rendering
    const statusSections = [
        { label: 'LIVE NOW', games: games.filter(g => g.status === 'in'), dot: 'green' as const },
        { label: 'UPCOMING', games: games.filter(g => g.status === 'pre'), dot: 'yellow' as const },
        { label: 'FINAL', games: games.filter(g => g.status === 'post'), dot: 'grey' as const },
    ].filter(s => s.games.length > 0);

    return (
        <div className="mt-0">
            {/* Panel Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                        {games.length} GAMES · <span className={liveCount > 0 ? "text-red-400" : ""}>{liveCount} ON</span> · {games.length - liveCount} OFF
                    </span>
                </div>
                <div className="flex-1 h-px bg-neutral-800"></div>
                <div className="flex items-center gap-2">
                    {lastUpdated && (
                        <span className="text-[10px] text-slate-600">Updated {lastUpdated}</span>
                    )}
                    <button
                        onClick={doFetch}
                        disabled={loading}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                        title="Refresh data"
                    >
                        <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400 text-[16px]">error</span>
                    <span className="text-red-400 text-xs">{error}</span>
                </div>
            )}

            {/* Game Grid or List */}
            {loading && games.length === 0 ? (
                <div className={layoutMode === 'grid' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : 'flex flex-col gap-2'}>
                    {Array.from({ length: layoutMode === 'grid' ? 4 : 6 }).map((_, i) => (
                        <div key={i} className={`bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse ${layoutMode === 'grid' ? 'p-4' : 'p-3 flex items-center gap-3'}`}>
                            {layoutMode === 'grid' ? (
                                <>
                                    <div className="h-3 bg-neutral-800 rounded w-1/2 mb-4"></div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-9 h-9 rounded-full bg-neutral-800"></div>
                                        <div className="flex-1 h-4 bg-neutral-800 rounded"></div>
                                        <div className="w-8 h-6 bg-neutral-800 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-neutral-800"></div>
                                        <div className="flex-1 h-4 bg-neutral-800 rounded"></div>
                                        <div className="w-8 h-6 bg-neutral-800 rounded"></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-4 bg-neutral-800 rounded"></div>
                                    <div className="w-7 h-7 rounded-full bg-neutral-800"></div>
                                    <div className="flex-1 h-4 bg-neutral-800 rounded"></div>
                                    <div className="w-7 h-7 rounded-full bg-neutral-800"></div>
                                    <div className="flex-1 h-4 bg-neutral-800 rounded"></div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ) : games.length > 0 ? (
                <div className="space-y-8">
                    {statusSections.map(section => {
                        const isCollapsed = collapsedSections[section.label];
                        return (
                            <div key={section.label} className="space-y-3">
                                <div
                                    className="flex items-center gap-2.5 pb-1.5 border-b border-neutral-800 cursor-pointer group"
                                    onClick={() => toggleSection(section.label)}
                                >
                                    {section.dot === 'green' && (
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                        </span>
                                    )}
                                    {section.dot === 'yellow' && (
                                        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
                                    )}
                                    {section.dot === 'grey' && (
                                        <span className="inline-flex rounded-full h-2.5 w-2.5 bg-neutral-500"></span>
                                    )}
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${section.dot === 'green' ? 'text-green-400' :
                                        section.dot === 'yellow' ? 'text-yellow-400' :
                                            'text-neutral-500'
                                        }`}>{section.label}</span>
                                    <span className="text-[10px] text-neutral-600 font-bold">({section.games.length})</span>
                                    <div className="flex-1 h-px bg-neutral-800 transition-colors group-hover:bg-neutral-600"></div>
                                    <span className={`material-symbols-outlined text-slate-500 text-[16px] transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}>
                                        expand_more
                                    </span>
                                </div>
                                {!isCollapsed && (
                                    layoutMode === 'grid' ? (
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            {section.games.map(game => (
                                                <ESPNGameCard key={game.id} game={game} onSelectGame={onSelectGame} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {section.games.map(game => (
                                                <ESPNGameRow key={game.id} game={game} onSelectGame={onSelectGame} />
                                            ))}
                                        </div>
                                    )
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : !error ? (
                <div className="py-12 flex flex-col items-center text-center border border-dashed border-neutral-800 rounded-xl">
                    <span className="material-symbols-outlined text-3xl text-slate-600 mb-2">event_busy</span>
                    <p className="text-slate-500 text-sm font-medium">No {sport} games today. Check back later.</p>
                </div>
            ) : null}
        </div>
    );
};
