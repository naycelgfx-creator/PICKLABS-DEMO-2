import React, { useEffect, useState, useCallback } from 'react';
import { fetchESPNRosterBySport, NBA_TEAM_IDS, NFL_TEAM_IDS, MLB_TEAM_IDS, NHL_TEAM_IDS, ESPNRosterAthlete } from '../../data/espnService';
import { getWBCRoster } from '../../data/mlbStatsService';
import { getApiSportsRoster, getApiSportsMMAFighters, SPORTS_WITH_API_SPORTS } from '../../data/apiSportsService';
import { useTicketCart } from '../../contexts/TicketCartContext';

interface LiveRosterProps {
    teamName: string;
    sport: string;
}

const SPORT_TEAM_ID_MAPS: Record<string, Record<string, number>> = {
    NBA: NBA_TEAM_IDS,
    NFL: NFL_TEAM_IDS,
    MLB: MLB_TEAM_IDS,
    NHL: NHL_TEAM_IDS,
};

const SkeletonRow = () => (
    <tr className="border-b border-neutral-800/50">
        {Array.from({ length: 8 }).map((_, i) => (
            <td key={i} className="py-3 px-4">
                <div className={`h-4 bg-neutral-800 rounded animate-pulse ${i === 1 ? 'w-36' : 'w-14'}`}></div>
            </td>
        ))}
    </tr>
);

export const LiveRoster: React.FC<LiveRosterProps> = ({ teamName, sport }) => {
    const [players, setPlayers] = useState<ESPNRosterAthlete[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<string | null>(null);

    const { addToCart } = useTicketCart();

    // Check if we have a known team ID for this sport
    const sportMap = SPORT_TEAM_ID_MAPS[sport] ?? NBA_TEAM_IDS;
    const hasTeamId = (() => {
        if (sport === 'WBC' || sport === 'UFC' || sport === 'CFB' || sport === 'NCAAF' || SPORTS_WITH_API_SPORTS.includes(sport)) return true;
        if (sportMap[teamName]) return true;
        const lower = teamName.toLowerCase();
        return Object.keys(sportMap).some(k =>
            lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower.split(' ').pop() ?? '')
        );
    })();

    const fetchRoster = useCallback(async () => {
        if (!hasTeamId) return;
        setLoading(true);
        setError(null);
        try {
            let data: ESPNRosterAthlete[] = [];

            if (sport === 'WBC') {
                const wbcData = await getWBCRoster(teamName);
                // Map WBC player to ESPNRosterAthlete format used by components
                data = wbcData.map(p => {
                    const parts = p.displayName.split(' ');
                    const firstName = parts[0] || '';
                    const lastName = parts.slice(1).join(' ') || '';

                    return {
                        id: String(p.id),
                        fullName: p.displayName,
                        displayName: p.displayName,
                        shortName: p.displayName,
                        firstName,
                        lastName,
                        position: { abbreviation: p.position, displayName: p.position },
                        jersey: p.jersey,
                        headshot: p.headshot,
                        photoUrl: p.headshot || '',
                        status: p.status,
                        collegeName: 'N/A', // Not supported in WBC
                        age: undefined,
                        displayHeight: undefined,
                        displayWeight: undefined,
                        experience: undefined,
                    };
                }) as unknown as ESPNRosterAthlete[]; // Type assertion for mapping ease
            } else if (sport === 'UFC') {
                data = await getApiSportsMMAFighters();
            } else if (SPORTS_WITH_API_SPORTS.includes(sport)) {
                data = await getApiSportsRoster(sport, teamName);
            } else {
                data = await fetchESPNRosterBySport(teamName, sport);
            }

            if (data.length === 0) {
                setError('No roster data returned. The team page may not have live data right now.');
            } else {
                setPlayers(data);
                setLastFetched(new Date().toLocaleTimeString());
            }
        } catch {
            setError('Failed to load roster from API.');
        } finally {
            setLoading(false);
        }
    }, [teamName, sport, hasTeamId]);

    useEffect(() => {
        fetchRoster();
    }, [fetchRoster]);

    if (!hasTeamId) {
        return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center mt-6">
                <span className="material-symbols-outlined text-slate-600 text-4xl block mb-3">sports</span>
                <p className="text-slate-500 font-medium">Live roster data is available for NBA, NFL, MLB, and NHL teams.</p>
                <p className="text-slate-600 text-sm mt-1">"{teamName}" was not found in our team database for {sport}.</p>
            </div>
        );
    }

    if (sport === 'UFC') {
        return (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg mt-6">
                <div className="bg-neutral-800 px-6 py-4 border-b border-neutral-700 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <h4 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">wifi</span>
                        UFC Ranked Fighters — Live Data
                    </h4>
                    <div className="ml-auto flex items-center gap-3">
                        {lastFetched && (
                            <span className="text-[10px] text-slate-500 font-medium">Updated {lastFetched}</span>
                        )}
                        <button
                            onClick={fetchRoster}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-[10px] bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                            <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-400 text-[16px]">error</span>
                        <span className="text-red-400 text-xs font-medium">{error}</span>
                        <button onClick={fetchRoster} className="ml-auto text-[10px] text-red-400 underline">Retry</button>
                    </div>
                )}

                <div className="p-6">
                    {loading && players.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="bg-neutral-800/50 rounded-xl h-[160px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : players.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {players.map((p) => (
                                <div key={p.id} className="bet-card group transition-transform hover:-translate-y-1" style={{ background: 'linear-gradient(145deg, #151518, #222226)', position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>

                                    <img
                                        src={p.photoUrl}
                                        alt={p.fullName}
                                        className="transition-transform group-hover:scale-110 duration-500 origin-bottom"
                                        style={{ height: '160px', position: 'absolute', right: '-10px', bottom: '0', opacity: 0.9, objectFit: 'contain', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.5))' }}
                                        onError={e => (e.currentTarget.style.display = 'none')}
                                    />

                                    <div style={{ position: 'relative', zIndex: 10, padding: '20px' }} className="flex flex-col h-full min-h-[160px] justify-between">
                                        <div>
                                            <span style={{ color: '#2EFA6B', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {p.position?.displayName ?? 'Fighter'}
                                            </span>
                                            <h3 style={{ margin: '5px 0 0', fontSize: '20px', fontWeight: '900', color: 'white', lineHeight: '1.1', maxWidth: '65%' }}>
                                                {p.fullName}
                                            </h3>
                                        </div>
                                        <div className="z-10 relative px-4 pb-4">
                                            <button
                                                className="w-full bg-accent-green hover:bg-green-400 text-neutral-900 font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(46,250,107,0.3)] mt-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    addToCart({
                                                        id: p.id,
                                                        name: p.shortName || p.fullName,
                                                        league: sport,
                                                        logo: p.headshot || p.photoUrl || 'https://via.placeholder.com/150'
                                                    });
                                                }}
                                            >
                                                Add to Ticket
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !error && (
                        <div className="text-center text-slate-600 py-8">No fighters available.</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg mt-6">
            {/* Header */}
            <div className="bg-neutral-800 px-6 py-4 border-b border-neutral-700 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <h4 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">wifi</span>
                    Live Roster — {sport} · ESPN Data
                </h4>
                <div className="ml-auto flex items-center gap-3">
                    {lastFetched && (
                        <span className="text-[10px] text-slate-500 font-medium">Updated {lastFetched}</span>
                    )}
                    <button
                        onClick={fetchRoster}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-[10px] bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1.5 rounded font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400 text-[16px]">error</span>
                    <span className="text-red-400 text-xs font-medium">{error}</span>
                    <button onClick={fetchRoster} className="ml-auto text-[10px] text-red-400 underline">Retry</button>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px]">
                    <thead>
                        <tr className="bg-black/40 border-b border-neutral-700">
                            <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider w-10">#</th>
                            <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider">Name</th>
                            <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-center">POS</th>
                            <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-center">Age</th>
                            <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-center">HT</th>
                            <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-center">WT</th>
                            <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider">EXP</th>
                            <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider">College</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                        {loading && players.length === 0
                            ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} />)
                            : players.map((p, idx) => (
                                <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors group">
                                    {/* Jersey # */}
                                    <td className="py-3 px-4 text-slate-600 font-bold text-xs text-center">
                                        {p.jersey ?? idx + 1}
                                    </td>

                                    {/* Name + Photo */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 shrink-0">
                                                <img
                                                    src={p.photoUrl}
                                                    alt={p.fullName}
                                                    className="w-full h-full object-cover"
                                                    onError={e => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.fullName)}&background=111827&color=39ff14&rounded=true`;
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <span className="text-slate-100 font-bold text-sm group-hover:text-primary transition-colors block whitespace-nowrap">
                                                    {p.fullName}
                                                </span>
                                                <span className="text-slate-600 text-[10px]">{p.position?.displayName ?? '—'}</span>
                                            </div>
                                            <div className="flex justify-between items-center px-4 pb-4 mt-auto z-10 relative">
                                                <div className="text-[10px] text-neutral-400 font-medium tracking-wide">
                                                    {p.experience ? `EXP: ${p.experience.years} YRS` : 'ROOKIE'}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addToCart({
                                                            id: p.id,
                                                            name: p.shortName || p.fullName,
                                                            league: sport,
                                                            logo: p.headshot || p.photoUrl || 'https://via.placeholder.com/150'
                                                        });
                                                    }}
                                                    className="bg-accent-blue/10 text-accent-blue text-[10px] font-bold px-3 py-1.5 rounded-full border border-accent-blue/30 hover:bg-accent-blue hover:text-white transition-colors"
                                                >
                                                    + TICKET
                                                </button>
                                            </div>
                                        </div>
                                    </td>

                                    {/* POS */}
                                    <td className="py-3 px-4 text-center">
                                        <span className="bg-neutral-800 text-slate-300 font-black text-[10px] px-2 py-1 rounded uppercase tracking-wider">
                                            {p.position?.abbreviation ?? '—'}
                                        </span>
                                    </td>

                                    {/* Age */}
                                    <td className="py-3 px-4 text-center text-slate-300 text-sm font-medium">
                                        {p.age ?? '—'}
                                    </td>

                                    {/* Height */}
                                    <td className="py-3 px-4 text-center text-slate-300 text-sm font-medium whitespace-nowrap">
                                        {p.displayHeight ?? '—'}
                                    </td>

                                    {/* Weight */}
                                    <td className="py-3 px-4 text-center text-slate-300 text-sm font-medium whitespace-nowrap">
                                        {p.displayWeight ?? '—'}
                                    </td>

                                    {/* Experience */}
                                    <td className="py-3 px-4 text-slate-500 text-sm">
                                        {p.experience?.years !== undefined
                                            ? (p.experience.years === 0 ? 'Rookie' : `${p.experience.years} yr`)
                                            : '—'}
                                    </td>

                                    {/* College */}
                                    <td className="py-3 px-4 text-slate-500 text-sm">
                                        {p.collegeName !== 'N/A' ? p.collegeName : '—'}
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>

                {!loading && players.length === 0 && !error && (
                    <div className="p-8 text-center text-slate-600">No player data available.</div>
                )}
            </div>

            {/* Footer */}
            {players.length > 0 && (
                <div className="px-6 py-3 bg-black/20 border-t border-neutral-800/50 flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-medium">{players.length} players · Source: ESPN</span>
                    {sport !== 'CFB' && sport !== 'NCAAF' && (
                        <a
                            href={`https://www.espn.com/${sport.toLowerCase()}/team/roster/_/name/${teamName.toLowerCase().replace(/\s/g, '-')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:text-white transition-colors font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                            Full ESPN Roster
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};
