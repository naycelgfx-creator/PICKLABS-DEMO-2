import React, { useEffect, useState, useCallback } from 'react';
import { SportKey } from '../../data/espnScoreboard';
import { Game } from '../../data/mockGames';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawObj = Record<string, any>;

interface GolferEntry {
    id: string;
    position: number;        // leaderboard position (1st, 2nd, T3, etc.)
    displayName: string;
    shortName: string;
    flagUrl: string;
    flagAlt: string;
    score: string;           // e.g. "-8", "E", "+2"
    thru: string;            // "F", "12", "—"
    rounds: string[];        // per-round scores e.g. ["65","67","—","—"]
}

interface GolfTournament {
    name: string;
    round: string;
    status: string;
    broadcast: string;
    golfers: GolferEntry[];
}

// ── Parse ESPN golf scoreboard ──────────────────────────────────────
function parseGolfEvent(event: RawObj): GolfTournament | null {
    const name = (event.name as string) ?? 'PGA Tour Event';
    const comps: RawObj[] = (event.competitions as RawObj[]) ?? [];
    if (comps.length === 0) return null;

    const comp = comps[0];
    const statusObj = (comp.status as RawObj) ?? {};
    const statusType = (statusObj.type as RawObj) ?? {};
    const statusDetail = (statusType.detail as string) ?? '';
    const period = (statusObj.period as number) ?? 0;
    const roundLabel = period > 0 ? `Round ${period}` : 'Upcoming';
    const broadcast = (comp.broadcast as string) ?? '';

    const competitors: RawObj[] = (comp.competitors as RawObj[]) ?? [];

    const golfers: GolferEntry[] = competitors
        .map((c: RawObj) => {
            const athlete = (c.athlete as RawObj) ?? {};
            const flag = (athlete.flag as RawObj) ?? {};
            const linescores: RawObj[] = (c.linescores as RawObj[]) ?? [];
            const rounds = linescores.map((ls: RawObj) => {
                const v = ls.value;
                if (v == null || v === 0) return '—';
                return String(v);
            });
            const rawScore = (c.score as string) ?? 'E';
            return {
                id: (c.id as string) ?? String(Date.now()),
                position: (c.order as number) ?? 0,
                displayName: (athlete.displayName as string) ?? 'Unknown',
                shortName: (athlete.shortName as string) ?? '',
                flagUrl: (flag.href as string) ?? '',
                flagAlt: (flag.alt as string) ?? '',
                score: rawScore,
                thru: '—',
                rounds,
            };
        })
        // Show at most 40 golfers to avoid a massive list
        .slice(0, 40);

    return { name, round: roundLabel, status: statusDetail, broadcast, golfers };
}

// ── Score color helper ──────────────────────────────────────────────
function scoreColor(score: string): string {
    if (score === 'E') return 'text-slate-400';
    if (score.startsWith('-')) return 'text-red-400';   // under par = red (golf convention)
    if (score.startsWith('+')) return 'text-blue-400';  // over par = blue
    return 'text-slate-400';
}

// ── Main Panel ──────────────────────────────────────────────────────
interface GolfLeaderboardPanelProps {
    sportKey: SportKey;
    selectedDate?: string;
    onSelectGame?: (game: Game) => void;
}

function golfTournamentToGame(tournament: GolfTournament, golfer: GolferEntry, sportKey: SportKey): Game {
    return {
        id: `golf-${golfer.id}`,
        sport: sportKey as string,
        matchupId: `golf-${golfer.id}`,
        awayTeam: { name: tournament.name, abbr: 'PGA', logo: '', score: 0 },
        homeTeam: { name: golfer.displayName, abbr: golfer.shortName || golfer.displayName.split(' ').pop() || 'PLY', logo: golfer.flagUrl, score: 0 },
        status: 'LIVE' as const,
        timeLabel: `${tournament.round} · ${golfer.score}`,
        league: tournament.name,
        venue: { name: tournament.name, location: '' },
        sportLogo: 'https://a.espncdn.com/i/espn/misc_logos/500/golf_course.png',
        broadcast: tournament.broadcast,
        odds: { spread: 'N/A', moneyline: { away: 0, home: 0 }, overUnder: { value: 0, pick: 'over' } },
        winProbability: { away: 50, home: 50 },
        streakLabel: '',
        date: new Date().toISOString().split('T')[0],
    } as unknown as Game;
}

export const GolfLeaderboardPanel: React.FC<GolfLeaderboardPanelProps> = ({ sportKey, selectedDate, onSelectGame }) => {
    const [tournament, setTournament] = useState<GolfTournament | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Golf PGA endpoint returns the active/next event (dates= param passed but usually ignored by API)
            const dateParam = selectedDate ? `?dates=${selectedDate.replace(/-/g, '')}` : '';
            const url = `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard${dateParam}`;
            const res = await fetch(url);
            if (!res.ok) {
                setError(`ESPN returned ${res.status}.`);
                setTournament(null);
                return;
            }
            const data = await res.json() as RawObj;
            const events: RawObj[] = (data.events as RawObj[]) ?? [];
            if (events.length === 0) {
                setTournament(null);
                setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                return;
            }
            const parsed = parseGolfEvent(events[0]);
            setTournament(parsed);
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch {
            setError('Failed to reach ESPN.');
            setTournament(null);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 90_000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // ── Loading ──
    if (loading && !tournament) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-neutral-900/60 border border-neutral-800/60 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-4xl text-red-500/50 mb-3">wifi_off</span>
                <p className="text-sm text-slate-500">{error}</p>
            </div>
        );
    }

    // ── No event ──
    if (!tournament) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="text-5xl mb-4">⛳</span>
                <h3 className="text-slate-400 font-bold text-lg mb-1">No PGA Tournament Active</h3>
                <p className="text-slate-600 text-sm max-w-xs">
                    PGA Tour events typically run Thursday–Sunday. Check back during tournament week.
                </p>
            </div>
        );
    }

    const { name, round, status, broadcast, golfers } = tournament;

    return (
        <div className="space-y-4">
            {/* Tournament banner */}
            <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-neutral-800/40 border-b border-neutral-800/50">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⛳</span>
                        <div>
                            <h3 className="text-base font-black text-text-main">{name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-slate-500">{round}</span>
                                {status && (
                                    <>
                                        <span className="text-slate-700">·</span>
                                        <span className="text-xs text-slate-600">{status}</span>
                                    </>
                                )}
                                {broadcast && (
                                    <>
                                        <span className="text-slate-700">·</span>
                                        <span className="text-[10px] font-bold text-primary/70 bg-primary/10 rounded px-1.5 py-0.5">{broadcast}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {lastUpdated && (
                            <span className="text-[10px] text-slate-600">Updated {lastUpdated}</span>
                        )}
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-30"
                            aria-label="Refresh"
                        >
                            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        </button>
                    </div>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 px-4 py-1.5 bg-neutral-950/40 border-b border-neutral-800/30">
                    <div className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">Pos</div>
                    <div className="col-span-5 text-[10px] font-bold uppercase tracking-wider text-slate-600">Player</div>
                    <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-right">Score</div>
                    <div className="col-span-4 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-right">Rounds</div>
                </div>

                {/* Golfer rows */}
                <div className="divide-y divide-neutral-800/20">
                    {golfers.map((g) => {
                        const isTop3 = g.position <= 3;
                        return (
                            <div
                                key={g.id}
                                className={`grid grid-cols-12 px-4 py-2.5 items-center hover:bg-neutral-800/30 transition-colors ${isTop3 ? 'bg-primary/[0.03]' : ''} ${onSelectGame ? 'cursor-pointer' : ''}`}
                                onClick={onSelectGame ? () => onSelectGame(golfTournamentToGame(tournament!, g, sportKey)) : undefined}
                            >
                                {/* Position */}
                                <div className="col-span-1">
                                    <span className={`text-xs font-black tabular-nums ${isTop3 ? 'text-primary' : 'text-slate-600'}`}>
                                        {g.position <= 1 ? '🥇' : g.position === 2 ? '🥈' : g.position === 3 ? '🥉' : `${g.position}`}
                                    </span>
                                </div>

                                {/* Player */}
                                <div className="col-span-5 flex items-center gap-2 min-w-0">
                                    <img
                                        src={g.flagUrl}
                                        alt={g.flagAlt}
                                        className="w-5 h-3.5 object-cover rounded-sm border border-neutral-700/40 shrink-0"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span className={`text-sm truncate font-medium ${isTop3 ? 'text-text-main font-bold' : 'text-slate-300'}`}>
                                        {g.displayName}
                                    </span>
                                </div>

                                {/* Score */}
                                <div className={`col-span-2 text-right text-sm font-black tabular-nums ${scoreColor(g.score)}`}>
                                    {g.score}
                                </div>

                                {/* Round scores */}
                                <div className="col-span-4 flex justify-end gap-1.5">
                                    {g.rounds.length > 0 ? g.rounds.map((r, ri) => (
                                        <span key={ri} className="text-[11px] tabular-nums text-slate-600 w-5 text-center">{r}</span>
                                    )) : (
                                        <span className="text-[11px] text-slate-700">Scheduled</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {golfers.length === 40 && (
                <p className="text-center text-[10px] text-slate-700">Showing top 40 · PickLabs Live Leaderboard</p>
            )}
        </div>
    );
};
