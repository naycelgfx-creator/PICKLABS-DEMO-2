import React from 'react';
import { useESPNRoster } from '../../data/useESPNRoster';
import { ESPNRosterAthlete } from '../../data/espnService';

interface DepthChartProps {
    teamName: string;
    sport: string;
}

// Sport-specific position display order
const getPositionOrder = (sport: string): string[] => {
    switch (sport) {
        case 'NBA': case 'NCAAM': case 'WNBA': return ['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F', 'G-F', 'F-C'];
        case 'NFL': return ['QB', 'RB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT', 'DE', 'DT', 'LB', 'CB', 'S', 'K', 'P'];
        case 'MLB': return ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
        case 'NHL': return ['C', 'LW', 'RW', 'LD', 'RD', 'D', 'G'];
        case 'Soccer': return ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
        default: return [];
    }
};

const AVATAR = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a1a2e&color=39ff14&rounded=true`;

const SkeletonRow = () => (
    <tr className="border-b border-neutral-800/50">
        <td className="py-4 px-6"><div className="w-12 h-5 bg-neutral-800 rounded animate-pulse"></div></td>
        <td className="py-4 px-6"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse"></div><div className="w-32 h-4 bg-neutral-800 rounded animate-pulse"></div></div></td>
        <td className="py-4 px-6"><div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-neutral-800 animate-pulse"></div><div className="w-28 h-4 bg-neutral-800 rounded animate-pulse"></div></div></td>
        <td className="py-4 px-6"><div className="w-40 h-4 bg-neutral-800 rounded animate-pulse"></div></td>
    </tr>
);

export const DepthChart: React.FC<DepthChartProps> = ({ teamName, sport }) => {
    const { players, loading } = useESPNRoster(teamName, sport);

    // Group ESPN players by position
    const groupedRoster = React.useMemo(() => {
        const groups: Record<string, ESPNRosterAthlete[]> = {};
        players.forEach(p => {
            const pos = p.position?.abbreviation ?? 'UTIL';
            if (!groups[pos]) groups[pos] = [];
            groups[pos].push(p);
        });
        // Sort within each group by jersey number (ascending = more likely starter)
        Object.values(groups).forEach(g => g.sort((a, b) => (Number(a.jersey) || 99) - (Number(b.jersey) || 99)));
        return groups;
    }, [players]);

    // Build ordered positions list
    const orderedPositions = React.useMemo(() => {
        const order = getPositionOrder(sport);
        const active = order.filter(pos => groupedRoster[pos] && groupedRoster[pos].length > 0);
        // Append any positions not in the standard order
        Object.keys(groupedRoster).forEach(pos => {
            if (!active.includes(pos)) active.push(pos);
        });
        return active;
    }, [groupedRoster, sport]);

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg animate-fade-in">
            <div className="bg-neutral-800 px-6 py-4 flex items-center justify-between border-b border-neutral-700">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-accent-purple">account_tree</span>
                    <h3 className="font-black text-white uppercase tracking-widest text-lg">Depth Chart</h3>
                    {!loading && players.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">PickLabs Roster · {players.length} players</span>
                    )}
                </div>
                <span className="flex items-center gap-1 text-[10px] text-accent-purple font-bold uppercase tracking-widest border border-accent-purple/20 bg-accent-purple/5 px-2 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse"></span>
                    PickLabs Live
                </span>
            </div>

            <div className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-black/40 border-b border-neutral-700">
                                <th className="py-4 px-6 text-slate-500 font-black uppercase text-xs tracking-[0.2em] w-24">POS</th>
                                <th className="py-4 px-6 text-slate-300 font-bold uppercase text-xs tracking-wider">Starter (1st)</th>
                                <th className="py-4 px-6 text-slate-400 font-bold uppercase text-xs tracking-wider">2nd String</th>
                                <th className="py-4 px-6 text-slate-500 font-bold uppercase text-xs tracking-wider">3rd / Reserve</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {loading
                                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                                : orderedPositions.map(pos => {
                                    const posPlayers = groupedRoster[pos];
                                    const starter = posPlayers[0];
                                    const second = posPlayers.length > 1 ? posPlayers[1] : null;
                                    const reserves = posPlayers.length > 2 ? posPlayers.slice(2, 5) : [];

                                    return (
                                        <tr key={pos} className="hover:bg-neutral-800/30 transition-colors group">
                                            {/* Position */}
                                            <td className="py-4 px-6 font-black text-white text-lg border-r border-neutral-800/50 bg-black/20 group-hover:bg-transparent transition-colors">
                                                <span className="bg-neutral-800 px-2 py-1 rounded text-sm">{pos}</span>
                                            </td>

                                            {/* Starter */}
                                            <td className="py-4 px-6">
                                                {starter && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-neutral-800 border-2 border-primary/50 overflow-hidden shrink-0">
                                                            <img
                                                                src={starter.photoUrl}
                                                                alt={starter.fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={e => { (e.target as HTMLImageElement).src = AVATAR(starter.fullName); }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-bold text-sm group-hover:text-primary transition-colors">{starter.fullName}</div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[9px] text-primary font-bold">STARTER</span>
                                                                {starter.jersey && (
                                                                    <span className="text-[9px] text-slate-600 font-medium">· #{starter.jersey}</span>
                                                                )}
                                                                {starter.experience?.years === 0 && (
                                                                    <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1 rounded font-bold">ROOKIE</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* 2nd String */}
                                            <td className="py-4 px-6">
                                                {second ? (
                                                    <div className="flex items-center gap-3 opacity-90">
                                                        <div className="w-7 h-7 rounded-full bg-neutral-800 border border-slate-600 overflow-hidden shrink-0">
                                                            <img
                                                                src={second.photoUrl}
                                                                alt={second.fullName}
                                                                className="w-full h-full object-cover"
                                                                onError={e => { (e.target as HTMLImageElement).src = AVATAR(second.fullName); }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-300 font-bold text-[13px]">{second.fullName}</div>
                                                            {second.jersey && (
                                                                <span className="text-[9px] text-slate-600">#{second.jersey}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-700 text-xs italic">–</span>
                                                )}
                                            </td>

                                            {/* Reserves */}
                                            <td className="py-4 px-6">
                                                {reserves.length > 0 ? (
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                        {reserves.map((res) => (
                                                            <div key={res.id} className="flex items-center gap-1.5">
                                                                <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700 shrink-0">
                                                                    <img
                                                                        src={res.photoUrl}
                                                                        alt={res.fullName}
                                                                        className="w-full h-full object-cover"
                                                                        onError={e => { (e.target as HTMLImageElement).src = AVATAR(res.fullName); }}
                                                                    />
                                                                </div>
                                                                <span className="text-slate-500 text-[12px] font-medium hover:text-slate-300 cursor-pointer transition-colors">
                                                                    {res.shortName ?? res.fullName}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {posPlayers.length > 5 && (
                                                            <span className="text-slate-600 text-[11px]">+{posPlayers.length - 5} more</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-700 text-xs italic">–</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                    {!loading && players.length === 0 && (
                        <div className="p-10 text-center text-slate-600 font-medium">No depth chart data available for this team.</div>
                    )}
                </div>
            </div>

            {players.length > 0 && !loading && (
                <div className="px-6 py-3 bg-black/20 border-t border-neutral-800/50 flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-medium">{orderedPositions.length} positions · {players.length} players · Source: PickLabs Data</span>
                    <span className="text-[10px] text-slate-600 font-medium">Sorted by jersey number (lower = likely starter)</span>
                </div>
            )}
        </div>
    );
};
