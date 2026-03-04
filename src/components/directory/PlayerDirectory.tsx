import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchTeamsWithRosters, ESPNAthleteListItem } from '../../data/espnScoreboard';

const SPORT_OPTIONS = [
    { label: 'NFL', sport: 'football', league: 'nfl', icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png' },
    { label: 'NBA', sport: 'basketball', league: 'nba', icon: 'https://cdn.nba.com/logos/nba/nba-logoman-word-white.svg' },
    { label: 'MLB', sport: 'baseball', league: 'mlb', icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png' },
    { label: 'NHL', sport: 'hockey', league: 'nhl', icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png' },
    { label: 'WNBA', sport: 'basketball', league: 'wnba', icon: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png' },
];

export const PlayerDirectory: React.FC = () => {
    const [activeSport, setActiveSport] = useState(SPORT_OPTIONS[0]);
    const [page, setPage] = useState(1);
    const [allAthletes, setAllAthletes] = useState<ESPNAthleteListItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const ITEMS_PER_PAGE = 40;

    const loadAthletes = useCallback(async (sport: typeof SPORT_OPTIONS[0]) => {
        setLoading(true);
        try {
            const data = await fetchTeamsWithRosters(sport.sport, sport.league);
            setAllAthletes(data);
            setTotalCount(data.length);
        } catch {
            setAllAthletes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAthletes(activeSport);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSport]);

    // Reset pagination when sport changes
    const handleSportChange = (opt: typeof SPORT_OPTIONS[0]) => {
        setActiveSport(opt);
        setPage(1);
        setSearchQuery('');
    };

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return allAthletes;
        const q = searchQuery.toLowerCase();
        return allAthletes.filter(a =>
            a.displayName?.toLowerCase().includes(q) ||
            (a.position?.abbreviation || '').toLowerCase().includes(q)
        );
    }, [allAthletes, searchQuery]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    const paginatedAthletes = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return (
        <div className="w-full flex justify-center py-6 sm:py-8 px-4 bg-background-dark min-h-screen">
            <div className="w-full max-w-[1536px] flex flex-col gap-6">

                {/* ── Header & Search ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">
                            Player Directory
                        </h2>
                        <p className="text-text-muted text-sm mt-1">
                            {loading ? 'Loading athletes...' : `Found ${totalCount.toLocaleString()} athletes · Page ${page} of ${totalPages}`}
                        </p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Filter current page..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-800 border border-border-muted rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/60"
                        />
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="bg-neutral-900 border border-border-muted p-1.5 flex gap-1 overflow-x-auto no-scrollbar rounded-xl">
                    {SPORT_OPTIONS.map(opt => (
                        <button
                            key={opt.label}
                            onClick={() => handleSportChange(opt)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-xs uppercase transition-all whitespace-nowrap ${activeSport.label === opt.label
                                ? 'bg-primary text-black shadow-[0_0_15px_rgba(13,242,13,0.3)]'
                                : 'text-text-muted hover:bg-neutral-800 hover:text-white'
                                }`}
                        >
                            <img
                                src={opt.icon}
                                alt={opt.label}
                                className={`w-4 h-4 object-contain ${activeSport.label === opt.label ? 'brightness-0' : 'brightness-200 opacity-60'}`}
                            />
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* ── Grid ── */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="bg-neutral-900 rounded-xl h-28 border border-neutral-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedAthletes.map(athlete => {
                            const headshot = athlete.headshot?.href;
                            const pos = athlete.position?.abbreviation || 'N/A';

                            return (
                                <div key={athlete.id} className="bg-neutral-900 border border-border-muted rounded-xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors group cursor-pointer relative overflow-hidden">
                                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />

                                    <div className="w-16 h-16 shrink-0 bg-neutral-800 rounded-lg overflow-hidden flex items-end justify-center relative border border-white/5 group-hover:border-primary/30 transition-colors">
                                        {headshot ? (
                                            <img src={headshot} alt={athlete.shortName} className="w-[120%] h-[120%] object-cover object-top" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-neutral-700 pb-1">person</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h3 className="text-white font-bold truncate group-hover:text-primary transition-colors text-base leading-tight">
                                            {athlete.displayName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs font-black text-black bg-primary px-1.5 py-0.5 rounded shadow-sm">
                                                {pos}
                                            </span>
                                            {athlete.displayHeight && athlete.displayWeight && (
                                                <span className="text-xs text-text-muted truncate">
                                                    {athlete.displayHeight} • {athlete.displayWeight}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {athlete.jersey && (
                                        <div className="absolute right-3 top-2 text-2xl font-black italic text-white/5 select-none uppercase transition-opacity group-hover:text-white/10">
                                            #{athlete.jersey}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Pagination ── */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 bg-neutral-900 border border-border-muted rounded-xl mt-4">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="bg-neutral-800 text-white px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-bold border border-neutral-700 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            Prev Page
                        </button>
                        <span className="text-sm font-bold text-text-muted">
                            Page <span className="text-white">{page}</span> of {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="bg-neutral-800 text-white px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-bold border border-neutral-700 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                            Next Page
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};
