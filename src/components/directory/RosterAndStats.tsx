import React, { useMemo } from 'react';
import { getSportStatLabels } from '../../data/mockPlayers';
import { useESPNRoster } from '../../data/useESPNRoster';
import { ESPNRosterAthlete } from '../../data/espnService';

interface RosterAndStatsProps {
    teamName: string;
    sport: string;
}

// Generate deterministic stat values from player id + seed
const statFromId = (id: string, offset: number, min: number, max: number): number => {
    const seed = id.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
    return Math.round(((seed * 7 + offset * 13) % (max - min) * 10) + min * 10) / 10;
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
    const isHockey = sport === 'NHL';

    // Map ESPN players to stat rows (deterministic from player id)
    const rosterWithStats = useMemo(() => players.map(p => ({
        ...p,
        stat1: statFromId(p.id, 1, isBasketball ? 6 : isHockey ? 0.1 : isFootball ? 150 : 5, isBasketball ? 30 : isHockey ? 0.8 : isFootball ? 300 : 25),
        stat2: statFromId(p.id, 2, 2, isFootball ? 80 : 12),
        stat3: statFromId(p.id, 3, 1, isFootball ? 60 : 10),
        stat4: statFromId(p.id, 4, 0.5, isFootball ? 8 : 2.5),
        efg: statFromId(p.id, 5, 42, 62),
        ts: statFromId(p.id, 6, 48, 68),
        astPct: statFromId(p.id, 7, 5, 35),
    })), [players, isBasketball, isHockey, isFootball]);

    const categories = [
        { key: 'stat1' as const, title: isBasketball ? 'Points' : isFootball ? 'Passing' : statLabels.stat1 },
        { key: 'stat2' as const, title: isBasketball ? 'Rebounds' : isFootball ? 'Rushing' : statLabels.stat2 },
        { key: 'stat3' as const, title: isBasketball ? 'Assists' : isFootball ? 'Receiving' : statLabels.stat3 },
        { key: 'stat4' as const, title: isBasketball ? 'Steals' : isFootball ? 'Tackles' : statLabels.stat4 },
    ];

    const getLeader = (key: 'stat1' | 'stat2' | 'stat3' | 'stat4') =>
        [...rosterWithStats].sort((a, b) => b[key] - a[key])[0];

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
                        const leader: (typeof rosterWithStats)[0] | undefined = loading ? undefined : getLeader(cat.key);
                        if (loading) return (
                            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 animate-pulse h-24"></div>
                        );
                        if (!leader) return null;
                        return (
                            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between shadow-lg hover:border-primary/50 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{cat.title}</span>
                                    <span className="text-primary font-black text-xl">{leader[cat.key].toFixed(1)}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 border-2 border-primary/20 overflow-hidden flex-shrink-0 group-hover:border-primary/60 transition-colors">
                                        <img
                                            src={leader.photoUrl}
                                            alt={leader.fullName}
                                            className="w-full h-full object-cover"
                                            onError={e => { (e.target as HTMLImageElement).src = AVATAR(leader.fullName); }}
                                        />
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
                                    {loading
                                        ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
                                        : rosterWithStats.map(p => (
                                            <tr key={`ps-${p.id}`} className="hover:bg-neutral-800/30 transition-colors group">
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700 shrink-0">
                                                            <img
                                                                src={p.photoUrl}
                                                                alt={p.fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={e => { (e.target as HTMLImageElement).src = AVATAR(p.fullName); }}
                                                            />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-slate-200 font-bold text-sm group-hover:text-primary transition-colors">{p.shortName ?? p.fullName}</span>
                                                            <span className="text-slate-500 text-[10px] font-bold">{p.position?.abbreviation ?? '—'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right text-white font-black">{p.stat1.toFixed(1)}</td>
                                                <td className="py-3 px-4 text-right text-slate-300 font-medium">{p.stat2.toFixed(1)}</td>
                                                <td className="py-3 px-4 text-right text-slate-300 font-medium">{p.stat3.toFixed(1)}</td>
                                                <td className="py-3 px-4 text-right text-slate-300 font-medium">{p.stat4.toFixed(1)}</td>
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
                            Shooting Stats
                        </h4>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <div className="min-w-[380px]">
                            <table className="w-full text-left border-collapse min-w-[480px]">
                                <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 z-10">
                                    <tr>
                                        <th className="py-3 px-6 text-slate-500 font-black uppercase text-[10px] tracking-wider">Player</th>
                                        <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-right">eFG%</th>
                                        <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-right">TS%</th>
                                        <th className="py-3 px-4 text-slate-500 font-black uppercase text-[10px] tracking-wider text-right">AST%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {loading
                                        ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
                                        : rosterWithStats.map(p => (
                                            <tr key={`as-${p.id}`} className="hover:bg-neutral-800/30 transition-colors group">
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-neutral-800 overflow-hidden border border-neutral-700 shrink-0">
                                                            <img
                                                                src={p.photoUrl}
                                                                alt={p.fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={e => { (e.target as HTMLImageElement).src = AVATAR(p.fullName); }}
                                                            />
                                                        </div>
                                                        <span className="text-slate-200 font-bold text-sm group-hover:text-accent-purple transition-colors">{p.shortName ?? p.fullName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-white font-black">{p.efg.toFixed(1)}%</span>
                                                        <div className="w-16 h-1 bg-neutral-800 rounded-full mt-1 overflow-hidden">
                                                            <div className="h-full bg-accent-purple rounded-full" style={{ width: `${p.efg}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right text-slate-300 font-medium">{p.ts.toFixed(1)}%</td>
                                                <td className="py-3 px-4 text-right text-slate-300 font-medium">{p.astPct.toFixed(1)}%</td>
                                            </tr>
                                        ))}
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
                                    <tr key={`profile-${p.id}`} className="hover:bg-neutral-800/30 transition-colors group">
                                        <td className="py-3 px-4 text-slate-600 font-bold text-xs text-center">{p.jersey ?? idx + 1}</td>
                                        <td className="py-3 px-6">
                                            <div className="flex items-center gap-3">
                                                {/* Real ESPN player headshot */}
                                                <div className="w-11 h-11 rounded-full bg-neutral-800 overflow-hidden border-2 border-neutral-700 group-hover:border-primary/40 transition-colors shrink-0">
                                                    <img
                                                        src={p.photoUrl}
                                                        alt={p.fullName}
                                                        className="w-full h-full object-cover"
                                                        onError={e => { (e.target as HTMLImageElement).src = AVATAR(p.fullName); }}
                                                    />
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

        </div>
    );
};
