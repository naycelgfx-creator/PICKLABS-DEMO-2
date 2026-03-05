import React, { useState, useEffect } from 'react';
import { fetchStandings, ESPNStandingsGroup, getStatValue } from '../../data/espnStandings';

interface StandingsWidgetProps {
    sportKey: string;
}

const ESPN_LEAGUE_MAP: Record<string, string> = {
    NBA: 'basketball/nba',
    NFL: 'football/nfl',
    MLB: 'baseball/mlb',
    NHL: 'hockey/nhl',
    CBB: 'basketball/mens-college-basketball',
    NCAAW: 'basketball/womens-college-basketball',
    CFB: 'football/college-football',
    'Soccer.EPL': 'soccer/eng.1',
    'Soccer.LaLiga': 'soccer/esp.1',
    'Soccer.SerieA': 'soccer/ita.1',
    'Soccer.Bundesliga': 'soccer/ger.1',
    'Soccer.Ligue1': 'soccer/fra.1',
    'Soccer.MLS': 'soccer/usa.1',
    'Soccer.UCL': 'soccer/uefa.champions',
    'Soccer.LIGAMX': 'soccer/mex.1',
};

export const StandingsWidget: React.FC<StandingsWidgetProps> = ({ sportKey }) => {
    const [groups, setGroups] = useState<ESPNStandingsGroup[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const loadStandings = async () => {
            const mapped = ESPN_LEAGUE_MAP[sportKey] || sportKey.toLowerCase().replace('.', '/');
            const [sport, league] = mapped.split('/');

            if (!sport || !league) {
                if (isMounted) setGroups([]);
                return;
            }

            setLoading(true);
            try {
                const data = await fetchStandings(sport, league);
                if (isMounted) setGroups(data);
            } catch {
                if (isMounted) setGroups([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadStandings();
        return () => { isMounted = false; };
    }, [sportKey]);

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center border border-dashed border-border-muted rounded-xl bg-neutral-900/50">
                <span className="material-symbols-outlined text-4xl text-primary mb-2 animate-pulse">leaderboard</span>
                <h3 className="text-text-main font-black uppercase tracking-widest text-sm mb-1">Loading Standings</h3>
                <p className="text-text-muted text-xs">Fetching latest records and stats...</p>
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-center border border-dashed border-border-muted rounded-xl bg-neutral-900/50">
                <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">event_busy</span>
                <h3 className="text-text-main font-black uppercase tracking-widest text-sm mb-1">No Standings Available</h3>
                <p className="text-text-muted text-xs">Current standings could not be loaded for {sportKey}.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {groups.map((group) => (
                <div key={group.id} className="bg-neutral-900 border border-border-muted rounded-xl overflow-hidden shadow-lg">
                    {/* Header */}
                    <div className="bg-neutral-800 px-4 py-3 border-b border-border-muted flex gap-3 items-center">
                        <span className="material-symbols-outlined text-primary text-[18px]">format_list_numbered</span>
                        <h3 className="text-white font-black uppercase tracking-widest text-sm">
                            {group.name} Standings
                        </h3>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-neutral-900/60 text-text-muted font-bold text-xs uppercase tracking-wider">
                                <tr className="border-b border-border-muted border-dashed">
                                    <th className="px-4 py-3 w-10 text-center">#</th>
                                    <th className="px-4 py-3">Team</th>
                                    <th className="px-4 py-3 text-right">W</th>
                                    <th className="px-4 py-3 text-right">L</th>
                                    <th className="px-4 py-3 text-right">PCT</th>
                                    <th className="px-4 py-3 text-right">GB</th>
                                    <th className="px-4 py-3 text-right">STRK</th>
                                    <th className="px-4 py-3 text-right">L10</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-muted/30">
                                {(() => {
                                    // Explicitly sort teams from highest to lowest based on rank, points, or win percentage
                                    const sortedEntries = [...(group.standings?.entries || [])].sort((a, b) => {
                                        // 1. Sort by Win Percentage descending
                                        const pctA = a.stats.find(s => s.name === 'winPercent')?.value ?? undefined;
                                        const pctB = b.stats.find(s => s.name === 'winPercent')?.value ?? undefined;
                                        if (pctA !== undefined && pctB !== undefined && pctA !== pctB) {
                                            return pctB - pctA;
                                        }

                                        // 2. Sort by Points (Soccer, NHL) descending
                                        const ptsA = a.stats.find(s => s.name === 'points')?.value ?? undefined;
                                        const ptsB = b.stats.find(s => s.name === 'points')?.value ?? undefined;
                                        if (ptsA !== undefined && ptsB !== undefined && ptsA !== ptsB) {
                                            return ptsB - ptsA;
                                        }

                                        // 3. Sort by Wins descending
                                        const winsA = a.stats.find(s => s.name === 'wins')?.value ?? undefined;
                                        const winsB = b.stats.find(s => s.name === 'wins')?.value ?? undefined;
                                        if (winsA !== undefined && winsB !== undefined && winsA !== winsB) {
                                            return winsB - winsA;
                                        }

                                        return 0;
                                    });

                                    return sortedEntries.map((entry, idx) => {
                                        const team = entry.team;
                                        const stats = entry.stats;

                                        // Safely grab stats by name or fallback
                                        const wins = getStatValue(stats, 'wins');
                                        const losses = getStatValue(stats, 'losses');
                                        const pct = getStatValue(stats, 'winPercent');
                                        const gb = getStatValue(stats, 'gamesBehind');
                                        const streak = getStatValue(stats, 'streak');
                                        const l10 = getStatValue(stats, 'Last Ten Games') !== '-'
                                            ? getStatValue(stats, 'Last Ten Games')
                                            : getStatValue(stats, 'overall'); // Fallback to overall record if L10 missing

                                        // Sometimes Logo array is weird
                                        const logoHref = team.logos?.[0]?.href;

                                        return (
                                            <tr key={team.id} className="hover:bg-white/[0.02] transition-colors group cursor-default">
                                                <td className="px-4 py-3 text-center text-text-muted font-medium">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {logoHref && (
                                                            <img src={logoHref} alt={team.abbreviation} className="w-6 h-6 object-contain" />
                                                        )}
                                                        <span className="font-bold text-white group-hover:text-primary transition-colors">
                                                            {team.displayName || team.name}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted font-black bg-neutral-800 px-1.5 py-0.5 rounded ml-1">
                                                            {team.abbreviation}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right text-white font-medium">{wins}</td>
                                                <td className="px-4 py-3 text-right text-white font-medium">{losses}</td>
                                                <td className="px-4 py-3 text-right text-slate-400">{pct}</td>
                                                <td className="px-4 py-3 text-right text-slate-400">{gb}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${streak.startsWith('W') ? 'bg-green-500/10 text-green-400' :
                                                        streak.startsWith('L') ? 'bg-red-500/10 text-red-400' :
                                                            'bg-neutral-800 text-text-muted'
                                                        }`}>
                                                        {streak}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-400">{l10}</td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};
