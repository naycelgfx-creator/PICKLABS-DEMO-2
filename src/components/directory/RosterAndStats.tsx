import React, { useState } from 'react';
import { getSportStatLabels } from '../../data/mockPlayers';
import { useESPNRoster } from '../../data/useESPNRoster';
import { ESPNRosterAthlete } from '../../data/espnService';
import { ESPNAthleteListItem } from '../../data/espnScoreboard';
import { PlayerProfileModal, parseStats, ParsedStats } from './PlayerProfileModal';

interface RosterAndStatsProps {
    teamName: string;
    sport: string;
}

// Map sport to ESPN API strings
const SPORT_MAP: Record<string, { sport: string; league: string }> = {
    'NBA': { sport: 'basketball', league: 'nba' },
    'WNBA': { sport: 'basketball', league: 'wnba' },
    'NCAAM': { sport: 'basketball', league: 'mens-college-basketball' },
    'NCAAW': { sport: 'basketball', league: 'womens-college-basketball' },
    'NFL': { sport: 'football', league: 'nfl' },
    'CFB': { sport: 'football', league: 'college-football' },
    'MLB': { sport: 'baseball', league: 'mlb' },
    'NHL': { sport: 'hockey', league: 'nhl' },
};

// Skeleton placeholder row
const SkeletonRow = ({ cols }: { cols: number }) => (
    <tr className="border-b border-neutral-800/50">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="py-3 px-4">
                <div className={`h-4 bg-neutral-800 rounded animate-pulse ${i === 0 ? 'w-36' : 'w-10'}`}></div>
            </td>
        ))}
    </tr>
);

const AVATAR = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=39ff14&rounded=true`;

export const RosterAndStats: React.FC<RosterAndStatsProps> = ({ teamName, sport }) => {
    const { players, loading } = useESPNRoster(teamName, sport);
    const statLabels = getSportStatLabels(sport);

    const isBasketball = ['NBA', 'WNBA', 'NCAAM', 'NCAAW'].includes(sport);
    const isFootball = ['NFL', 'CFB'].includes(sport);

    const [selectedAthlete, setSelectedAthlete] = useState<ESPNAthleteListItem | null>(null);

    const openPlayerModal = (p: ESPNRosterAthlete) => {
        setSelectedAthlete({
            id: p.id,
            uid: `s:${sport}~l:${sport}~a:${p.id}`,
            guid: p.id,
            alternateIds: {},
            firstName: p.firstName || p.fullName.split(' ')[0],
            lastName: p.lastName || p.fullName.split(' ').slice(1).join(' '),
            fullName: p.fullName,
            displayName: p.fullName,
            shortName: p.shortName || p.fullName,
            weight: 0,
            displayWeight: p.displayWeight || '',
            height: 0,
            displayHeight: p.displayHeight || '',
            age: p.age || 0,
            dateOfBirth: '',
            links: [],
            birthPlace: { city: '', state: '', country: '' },
            college: { id: '', name: p.collegeName },
            slug: p.fullName.toLowerCase().replace(/ /g, '-'),
            headshot: { href: p.photoUrl, alt: p.fullName },
            jersey: p.jersey || '',
            position: { id: '', name: p.position?.displayName || '', displayName: p.position?.displayName || '', abbreviation: p.position?.abbreviation || '' },
            team: { id: teamName },
            status: { id: '', name: 'Active', type: 'active', abbreviation: 'ACT' },
            active: p.active ?? true,
        });
    };

    const apiTarget = SPORT_MAP[sport] || { sport: sport.toLowerCase(), league: sport.toLowerCase() };

    const [playerStats, setPlayerStats] = useState<Record<string, ParsedStats>>({});
    const [statsLoading, setStatsLoading] = useState(true);

    React.useEffect(() => {
        if (!players.length) return;
        let isMounted = true;
        setStatsLoading(true);

        const fetchStats = async () => {
            const newStats: Record<string, ParsedStats> = {};

            // Fetch stats in chunks to avoid 429 Too Many Requests from ESPN API
            const chunkSize = 10;
            for (let i = 0; i < players.length; i += chunkSize) {
                if (!isMounted) break;

                const chunk = players.slice(i, i + chunkSize);
                const fetchPromises = chunk.map(async (p) => {
                    try {
                        const res = await fetch(`https://site.web.api.espn.com/apis/common/v3/sports/${apiTarget.sport}/${apiTarget.league}/athletes/${p.id}/stats`);
                        if (res.ok) {
                            const data = await res.json();
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const cats: any[] = data?.categories ?? [];
                            return { id: p.id, stats: parseStats(cats, apiTarget.sport, p.position?.abbreviation ?? '') };
                        }
                    } catch {
                        // fallthrough
                    }
                    return { id: p.id, stats: { items: [], seasonLabel: '' } };
                });

                const results = await Promise.allSettled(fetchPromises);
                results.forEach((r) => {
                    if (r.status === 'fulfilled' && r.value) {
                        newStats[r.value.id] = r.value.stats;
                    }
                });

                if (isMounted) {
                    setPlayerStats({ ...newStats });
                    if (i === 0) setStatsLoading(false); // Show UI after first chunk
                }

                // Small delay to let ESPN API breathe
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            if (isMounted) {
                setStatsLoading(false);
            }
        };

        fetchStats();

        return () => {
            isMounted = false;
        };
    }, [players, apiTarget.sport, apiTarget.league]);

    // Use dynamically generated stat labels if available, fallback to default structure
    const dynamicLabels = React.useMemo(() => {
        const firstWithStats = Object.values(playerStats).find(s => s.items.length >= 4);
        if (firstWithStats) {
            return firstWithStats.items.slice(0, 4).map(i => i.label);
        }
        return isBasketball ? ['PTS', 'REB', 'AST', 'STL'] : isFootball ? ['YDS', 'TD', 'INT', 'RTG'] : [statLabels.stat1, statLabels.stat2, statLabels.stat3, statLabels.stat4];
    }, [playerStats, isBasketball, isFootball, statLabels]);

    const categories = [
        { key: 0, title: dynamicLabels[0] },
        { key: 1, title: dynamicLabels[1] },
        { key: 2, title: dynamicLabels[2] },
        { key: 3, title: dynamicLabels[3] },
    ];

    const getPlayerStatObject = (playerId: string) => playerStats[playerId]?.items || [];

    const getStatValue = (playerId: string, index: number) => {
        const stats = getPlayerStatObject(playerId);
        const val = stats[index]?.value;
        return val ? parseFloat(val) : 0;
    };

    const getLeader = (index: number) => {
        if (!players.length) return undefined;
        let leader = players[0];
        let maxVal = -1;
        players.forEach(p => {
            const val = getStatValue(p.id, index);
            if (val > maxVal) {
                maxVal = val;
                leader = p;
            }
        });
        return { leader, val: maxVal };
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in mt-6">

            {/* ─── TEAM LEADERS ─── */}
            <div>
                <h3 className="text-white font-black text-lg tracking-widest uppercase mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">leaderboard</span>
                    Team Leaders
                    {loading && <span className="text-[10px] text-slate-600 font-normal animate-pulse ml-2">Loading ESPN data...</span>}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {categories.map((cat, i) => {
                        const leaderData = (loading || statsLoading) ? undefined : getLeader(i);
                        if (loading || statsLoading) return (
                            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 animate-pulse h-24"></div>
                        );
                        if (!leaderData || leaderData.val === 0) return null;
                        const { leader } = leaderData;
                        return (
                            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-lg hover:border-primary/50 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{cat.title}</span>
                                    <span className="text-primary font-black text-xl">{getPlayerStatObject(leader.id)[i]?.value || '0'}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="w-12 h-12 shrink-0 bg-neutral-800 rounded-lg overflow-visible flex items-end justify-center relative border border-white/5 group-hover:border-primary/30 transition-colors">
                                        <div className="w-full h-full rounded-lg overflow-hidden flex items-end justify-center">
                                            <img
                                                src={leader.photoUrl}
                                                alt={leader.fullName}
                                                className="w-[120%] h-[120%] object-cover object-top"
                                                onError={e => { (e.target as HTMLImageElement).src = AVATAR(leader.fullName); }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-sm truncate max-w-[120px]">{leader.shortName ?? leader.fullName}</span>
                                        <span className="text-slate-500 font-medium text-xs">{leader.position?.abbreviation ?? '—'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── PLAYER STATS / SHOOTING STATS ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Player Stats Table */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[400px] sm:h-[520px]">
                    <div className="bg-neutral-800 px-6 py-4 border-b border-neutral-700 flex justify-between items-center shrink-0">
                        <h4 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent-blue text-[18px]">group</span>
                            Player Stats
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            ESPN Live
                        </span>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <div className="min-w-[400px]">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 z-10">
                                    <tr>
                                        <th className="py-3 px-6 text-slate-500 font-black uppercase text-[10px] tracking-wider">Player</th>
                                        {categories.map(c => (
                                            <th key={c.key} className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-right">{c.title}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {loading || statsLoading
                                        ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                                        : [...players].sort((a, b) => getStatValue(b.id, 0) - getStatValue(a.id, 0)).slice(0, 15).map(p => (
                                            <tr key={`ps-${p.id}`} className="hover:bg-neutral-800/30 transition-colors group cursor-pointer" onClick={() => openPlayerModal(p)}>
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 shrink-0 bg-neutral-800 rounded-lg overflow-visible flex items-end justify-center relative border border-white/5 group-hover:border-primary/30 transition-colors">
                                                            <div className="w-full h-full rounded-lg overflow-hidden flex items-end justify-center">
                                                                <img
                                                                    src={p.photoUrl}
                                                                    alt={p.fullName}
                                                                    className="w-[120%] h-[120%] object-cover object-top"
                                                                    onError={e => { (e.target as HTMLImageElement).src = AVATAR(p.fullName); }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-200 font-bold text-sm group-hover:text-primary transition-colors">{p.shortName ?? p.fullName}</span>
                                                            <span className="text-slate-500 text-[10px] font-bold">{p.position?.abbreviation ?? '—'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right text-white font-black">{getPlayerStatObject(p.id)[0]?.value ?? '—'}</td>
                                                <td className="py-3 px-4 text-right text-slate-300 font-medium">{getPlayerStatObject(p.id)[1]?.value ?? '—'}</td>
                                                <td className="py-3 px-4 text-right text-slate-300 font-medium">{getPlayerStatObject(p.id)[2]?.value ?? '—'}</td>
                                                <td className="py-3 px-4 text-right text-slate-300 font-medium">{getPlayerStatObject(p.id)[3]?.value ?? '—'}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Shooting / Advanced Stats Table */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-[400px] sm:h-[520px]">
                    <div className="bg-neutral-800 px-6 py-4 border-b border-neutral-700 flex justify-between items-center shrink-0">
                        <h4 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-accent-purple text-[18px]">track_changes</span>
                            {isBasketball ? 'Shooting Stats' : 'Advanced Stats'}
                        </h4>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <div className="min-w-[380px]">
                            <table className="w-full text-left border-collapse min-w-[480px]">
                                <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 z-10">
                                    <tr>
                                        <th className="py-3 px-6 text-slate-500 font-black uppercase text-[10px] tracking-wider">Player</th>
                                        <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-right">{dynamicLabels[4] || 'STAT 5'}</th>
                                        <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-right">{dynamicLabels[5] || 'STAT 6'}</th>
                                        <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-right">{dynamicLabels[6] || 'STAT 7'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {loading || statsLoading
                                        ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                                        : [...players].sort((a, b) => getStatValue(b.id, 4) - getStatValue(a.id, 4)).slice(0, 15).map(p => {
                                            const stat5 = getPlayerStatObject(p.id)[4]?.value;
                                            const stat6 = getPlayerStatObject(p.id)[5]?.value;
                                            const stat7 = getPlayerStatObject(p.id)[6]?.value;
                                            const stat5Num = parseFloat(stat5 ?? '0');
                                            return (
                                                <tr key={`as-${p.id}`} className="hover:bg-neutral-800/30 transition-colors group cursor-pointer" onClick={() => openPlayerModal(p)}>
                                                    <td className="py-3 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 shrink-0 bg-neutral-800 rounded-lg overflow-visible flex items-end justify-center relative border border-white/5 group-hover:border-primary/30 transition-colors">
                                                                <div className="w-full h-full rounded-lg overflow-hidden flex items-end justify-center">
                                                                    <img
                                                                        src={p.photoUrl}
                                                                        alt={p.fullName}
                                                                        className="w-[120%] h-[120%] object-cover object-top"
                                                                        onError={e => { (e.target as HTMLImageElement).src = AVATAR(p.fullName); }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <span className="text-slate-200 font-bold text-sm group-hover:text-accent-purple transition-colors">{p.shortName ?? p.fullName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-white font-black">{stat5 ?? '—'}</span>
                                                            {(isBasketball && stat5Num > 0 && stat5Num <= 100) && (
                                                                <div className="w-16 h-1 bg-neutral-800 rounded-full mt-1 overflow-hidden">
                                                                    <div className="h-full bg-accent-purple rounded-full" style={{ width: `${stat5Num}%` }}></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-slate-300 font-medium">{stat6 ?? '—'}</td>
                                                    <td className="py-3 px-4 text-right text-slate-300 font-medium">{stat7 ?? '—'}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── FULL ROSTER (Player Profiles) ─── */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-neutral-800 px-6 py-4 border-b border-neutral-700 flex justify-between items-center">
                    <h4 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                        Full Roster — ESPN Data
                    </h4>
                    <div className="flex items-center gap-2">
                        {!loading && players.length > 0 && (
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{players.length} Players</span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-widest border border-primary/20 bg-primary/5 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            Live
                        </span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[820px]">
                        <thead>
                            <tr className="bg-black/40 border-b border-neutral-700">
                                <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider w-10">#</th>
                                <th className="py-3 px-6 text-slate-500 font-black uppercase text-[10px] tracking-wider">Name</th>
                                <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-center">POS</th>
                                <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-center">Age</th>
                                <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-center">HT</th>
                                <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-center">WT</th>
                                <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-center">EXP</th>
                                <th className="py-3 px-6 text-slate-500 font-black uppercase text-[10px] tracking-wider text-right">Salary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {loading
                                ? Array.from({ length: 15 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                                : players.map((p: ESPNRosterAthlete, idx: number) => (
                                    <tr key={`profile-${p.id}`} className="hover:bg-neutral-800/30 transition-colors group cursor-pointer" onClick={() => openPlayerModal(p)}>
                                        <td className="py-3 px-4 text-slate-600 font-bold text-xs text-center">{p.jersey ?? idx + 1}</td>
                                        <td className="py-3 px-6">
                                            <div className="flex items-center gap-3">
                                                {/* Real ESPN player headshot */}
                                                <div className="w-12 h-12 shrink-0 bg-neutral-800 rounded-lg overflow-visible flex items-end justify-center relative border border-white/5 group-hover:border-primary/30 transition-colors">
                                                    <div className="w-full h-full rounded-lg overflow-hidden flex items-end justify-center">
                                                        <img
                                                            src={p.photoUrl}
                                                            alt={p.fullName}
                                                            className="w-[120%] h-[120%] object-cover object-top"
                                                            onError={e => { (e.target as HTMLImageElement).src = AVATAR(p.fullName); }}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-slate-200 font-bold text-sm group-hover:text-primary transition-colors block whitespace-nowrap">{p.fullName}</span>
                                                    {p.shortName && p.shortName !== p.fullName && (
                                                        <span className="text-slate-600 text-[10px]">{p.shortName}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="bg-neutral-800 text-slate-300 font-black text-[10px] px-2 py-1 rounded uppercase tracking-wider">{p.position?.abbreviation ?? '—'}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center text-slate-300 font-medium text-sm">{p.age ?? '—'}</td>
                                        <td className="py-3 px-4 text-center text-slate-300 font-medium text-sm whitespace-nowrap">{p.displayHeight ?? '—'}</td>
                                        <td className="py-3 px-4 text-center text-slate-300 font-medium text-sm whitespace-nowrap">{p.displayWeight ?? '—'}</td>
                                        <td className="py-3 px-4 text-center text-slate-500 text-sm">
                                            {p.experience?.years !== undefined
                                                ? (p.experience.years === 0 ? 'Rookie' : `${p.experience.years} yr`)
                                                : '—'}
                                        </td>
                                        <td className="py-3 px-6 text-right">
                                            {p.salary
                                                ? <span className="text-primary font-black text-sm">{p.salaryFormatted}</span>
                                                : <span className="text-slate-600 text-sm">—</span>}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    {!loading && players.length === 0 && (
                        <div className="p-10 text-center text-slate-600 font-medium">No roster data available for this team.</div>
                    )}
                </div>
                {players.length > 0 && (
                    <div className="px-6 py-3 bg-black/20 border-t border-neutral-800/50 flex items-center justify-between">
                        <span className="text-[10px] text-slate-600 font-medium">{players.length} players · Source: ESPN Core API</span>
                        <a
                            href={`https://www.espn.com/${sport.toLowerCase()}/team/roster/_/name/${teamName.toLowerCase().replace(/\s/g, '-')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:text-white transition-colors font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                            View Full Roster on ESPN
                            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                        </a>
                    </div>
                )}
            </div>

            {selectedAthlete && (
                <PlayerProfileModal
                    athlete={selectedAthlete}
                    sport={sport}
                    league={sport.toLowerCase()}
                    onClose={() => setSelectedAthlete(null)}
                />
            )}
        </div>
    );
};
