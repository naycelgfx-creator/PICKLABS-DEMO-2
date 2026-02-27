import React, { useEffect, useState, useCallback } from 'react';
import { fetchESPNRosterBySport, NBA_TEAM_IDS, NFL_TEAM_IDS, MLB_TEAM_IDS, NHL_TEAM_IDS, ESPNRosterAthlete } from '../../data/espnService';

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

    // Check if we have a known team ID for this sport
    const sportMap = SPORT_TEAM_ID_MAPS[sport] ?? NBA_TEAM_IDS;
    const hasTeamId = (() => {
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
            const data = await fetchESPNRosterBySport(teamName, sport);
            if (data.length === 0) {
                setError('No roster data returned from ESPN. The team page may not have live data right now.');
            } else {
                setPlayers(data);
                setLastFetched(new Date().toLocaleTimeString());
            }
        } catch {
            setError('Failed to load roster from ESPN API.');
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
                    <a
                        href={`https://www.espn.com/${sport.toLowerCase()}/team/roster/_/name/${teamName.toLowerCase().replace(/\s/g, '-')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:text-white transition-colors font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                        Full ESPN Roster
                        <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                </div>
            )}
        </div>
    );
};
