import React, { useEffect, useState, useCallback } from 'react';
import { fetchESPNTeamSchedule, ESPNScheduleGame } from '../../data/espnTeams';

interface TeamScheduleProps {
    teamName: string;
    sport: string;
}

const SkeletonRow = () => (
    <tr className="border-b border-neutral-800/50">
        {Array.from({ length: 6 }).map((_, i) => (
            <td key={i} className="py-4 px-6">
                <div className={`h-4 bg-neutral-800 rounded animate-pulse ${i === 0 ? 'w-28' : i === 1 ? 'w-40' : 'w-20'}`}></div>
            </td>
        ))}
    </tr>
);

export const TeamSchedule: React.FC<TeamScheduleProps> = ({ teamName, sport }) => {
    const [schedule, setSchedule] = useState<ESPNScheduleGame[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchESPNTeamSchedule(teamName, sport);
            setSchedule(data);
            if (data.length === 0) setError('No schedule data available');
        } catch {
            setError('Failed to load schedule from ESPN');
        } finally {
            setLoading(false);
        }
    }, [teamName, sport]);

    useEffect(() => { load(); }, [load]);

    const sportLabel = sport === 'NBA' ? 'basketball/nba'
        : sport === 'NFL' ? 'football/nfl'
            : sport === 'MLB' ? 'baseball/mlb'
                : sport === 'NHL' ? 'hockey/nhl'
                    : 'basketball/nba';

    const completed = schedule.filter(g => g.result !== 'upcoming');
    const upcoming = schedule.filter(g => g.result === 'upcoming');
    const wins = completed.filter(g => g.result === 'W').length;
    const losses = completed.filter(g => g.result !== 'W' && g.result !== 'upcoming').length;

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg animate-fade-in mt-6">
            <div className="bg-neutral-800 px-6 py-4 flex items-center justify-between border-b border-neutral-700">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    <h3 className="font-black text-white uppercase tracking-widest text-lg">Season Schedule</h3>
                    {!loading && schedule.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {completed.length} games played · <span className="text-primary">{wins}W</span>–<span className="text-red-500">{losses}L</span> · {upcoming.length} remaining
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-widest border border-primary/20 bg-primary/5 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        PickLabs Live
                    </span>
                </div>
            </div>

            <div className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-black/40 border-b border-neutral-700">
                                <th className="py-4 px-6 text-slate-500 font-black uppercase text-xs tracking-wider">Date</th>
                                <th className="py-4 px-6 text-slate-500 font-black uppercase text-xs tracking-wider">Opponent</th>
                                <th className="py-4 px-6 text-slate-500 font-black uppercase text-xs tracking-wider">Home / Away</th>
                                <th className="py-4 px-6 text-slate-500 font-black uppercase text-xs tracking-wider">Result</th>
                                <th className="py-4 px-6 text-slate-500 font-black uppercase text-xs tracking-wider text-right">Score</th>
                                <th className="py-4 px-6 text-slate-500 font-black uppercase text-xs tracking-wider text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {loading
                                ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} />)
                                : schedule.map(game => {
                                    const gameDate = game.date ? new Date(game.date) : null;
                                    const isPast = game.result !== 'upcoming';
                                    return (
                                        <tr key={game.id} className={`hover:bg-neutral-800/30 transition-colors group ${!isPast ? 'opacity-70' : ''}`}>
                                            {/* Date */}
                                            <td className="py-4 px-6 text-slate-300 font-medium whitespace-nowrap text-sm">
                                                {gameDate
                                                    ? gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                                    : '—'}
                                            </td>

                                            {/* Opponent */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    {game.opponentLogo ? (
                                                        <div className="w-7 h-7 rounded-full bg-white/5 border border-neutral-700 overflow-hidden flex items-center justify-center shrink-0">
                                                            <img
                                                                src={game.opponentLogo}
                                                                alt={game.opponentAbbr}
                                                                className="w-5 h-5 object-contain"
                                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                                                            <span className="text-[9px] font-black text-slate-500">{game.opponentAbbr}</span>
                                                        </div>
                                                    )}
                                                    <span className="text-white font-bold text-sm group-hover:text-primary transition-colors">{game.opponentName}</span>
                                                </div>
                                            </td>

                                            {/* Home / Away */}
                                            <td className="py-4 px-6">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${game.isHome
                                                    ? 'text-primary border-primary/30 bg-primary/10'
                                                    : 'text-slate-400 border-slate-700 bg-neutral-800'}`}>
                                                    {game.isHome ? 'HOME' : 'AWAY'}
                                                </span>
                                            </td>

                                            {/* Result */}
                                            <td className="py-4 px-6">
                                                {isPast ? (
                                                    <span className={`w-7 h-7 inline-flex items-center justify-center rounded font-black text-xs border ${game.result === 'W'
                                                        ? 'bg-primary/20 text-primary border-primary/30'
                                                        : game.result === 'D'
                                                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                            : 'bg-red-500/20 text-red-500 border-red-500/30'}`}>
                                                        {game.result}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 text-sm italic">–</span>
                                                )}
                                            </td>

                                            {/* Score */}
                                            <td className="py-4 px-6 text-right">
                                                {isPast && game.teamScore !== null && game.opponentScore !== null ? (
                                                    <span className={`font-black text-sm ${game.result === 'W' ? 'text-primary' : 'text-red-400'}`}>
                                                        {game.teamScore}–{game.opponentScore}
                                                    </span>
                                                ) : !isPast ? (
                                                    <span className="text-slate-600 text-xs uppercase tracking-wider font-bold">Upcoming</span>
                                                ) : (
                                                    <span className="text-slate-600 text-sm">—</span>
                                                )}
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-6 text-center">
                                                {!isPast ? (
                                                    <a
                                                        href={`https://www.espn.com/${sportLabel}/game/_/gameId/${game.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-wider flex items-center gap-1 justify-center"
                                                    >
                                                        PickLabs <span className="material-symbols-outlined text-[10px]">sports</span>
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-slate-600 font-bold uppercase">Final</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            }
                        </tbody>
                    </table>
                    {!loading && (error || schedule.length === 0) && (
                        <div className="p-10 text-center text-slate-600 font-medium">
                            {error ?? 'No schedule data available.'}
                        </div>
                    )}
                </div>
            </div>

            {schedule.length > 0 && !loading && (
                <div className="px-6 py-3 bg-black/20 border-t border-neutral-800/50 flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-medium">{schedule.length} games total · Source: PickLabs Data</span>
                    <button onClick={load} className="text-[10px] text-primary hover:text-white transition-colors font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">refresh</span>
                        Refresh
                    </button>
                </div>
            )}
        </div>
    );
};
