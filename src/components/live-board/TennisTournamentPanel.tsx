import React, { useEffect, useState, useCallback } from 'react';
import { SportKey, ESPN_SCOREBOARD_URLS } from '../../data/espnScoreboard';

// ---------- Raw ESPN shape (tennis/golf) ----------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawObj = Record<string, any>;

interface TennisPlayer {
    id: string;
    displayName: string;
    shortName: string;
    flagUrl: string;     // country flag image
    flagAlt: string;     // country name
    rank?: number;       // seeding if available
    homeAway: 'home' | 'away';
    winner: boolean;
    sets: number[];      // set scores e.g. [6,3,7,5]
    tiebreaks: (number | null)[];  // tiebreak points per set, null if no tiebreak
}

interface TennisMatch {
    id: string;
    player1: TennisPlayer;  // home
    player2: TennisPlayer;  // away
    tournament: string;
    round: string;
    court: string;
    status: string;
    completed: boolean;
    inProgress: boolean;
    notes: string;  // score summary from ESPN
}

// ---------- Parse raw ESPN tennis event → TennisMatch[] ----------
function parseTennisEvent(event: RawObj, sportKey: SportKey): TennisMatch[] {
    const tournamentName = (event.name as string) ?? 'Tournament';
    const matches: TennisMatch[] = [];

    const groupings: RawObj[] = (event.groupings as RawObj[]) ?? [];
    for (const g of groupings) {
        const competitions: RawObj[] = (g.grouping?.competitions ?? g.competitions ?? []) as RawObj[];
        const roundLabel = '';

        for (const comp of competitions) {
            const compId = comp.id as string;
            const venue = comp.venue as RawObj ?? {};
            const court = (venue.court as string) ?? '';
            const statusObj = (comp.status as RawObj) ?? {};
            const statusType = (statusObj.type as RawObj) ?? {};
            const statusName = (statusType.name as string) ?? '';
            const completed = (statusType.completed as boolean) ?? false;
            const inProgress = statusName === 'STATUS_IN_PROGRESS';
            const statusDisplay = (statusType.detail as string) ?? statusName;
            const round = (comp.round as RawObj)?.displayName ?? roundLabel;
            const notes = ((comp.notes as RawObj[]) ?? [])[0]?.text ?? '';

            const competitors: RawObj[] = (comp.competitors as RawObj[]) ?? [];
            if (competitors.length < 2) continue;

            const home = competitors.find((c: RawObj) => c.homeAway === 'home') ?? competitors[1];
            const away = competitors.find((c: RawObj) => c.homeAway === 'away') ?? competitors[0];

            function parsePlayer(c: RawObj): TennisPlayer {
                const athlete = (c.athlete as RawObj) ?? {};
                const flag = (athlete.flag as RawObj) ?? {};
                const linescores: RawObj[] = (c.linescores as RawObj[]) ?? [];
                const sets = linescores.map((ls: RawObj) => ls.value as number ?? 0);
                const tiebreaks = linescores.map((ls: RawObj) => {
                    const tb = ls.tiebreak;
                    return typeof tb === 'number' ? tb : null;
                });
                const rank = (c.curatedRank as RawObj)?.current as number | undefined;
                return {
                    id: c.id as string,
                    displayName: (athlete.displayName as string) ?? 'Unknown',
                    shortName: (athlete.shortName as string) ?? '',
                    flagUrl: (flag.href as string) ?? '',
                    flagAlt: (flag.alt as string) ?? '',
                    rank,
                    homeAway: c.homeAway as 'home' | 'away',
                    winner: (c.winner as boolean) ?? false,
                    sets,
                    tiebreaks,
                };
            }

            matches.push({
                id: `${compId}-${sportKey}`,
                player1: parsePlayer(home),
                player2: parsePlayer(away),
                tournament: tournamentName,
                round,
                court,
                status: statusDisplay,
                completed,
                inProgress,
                notes,
            });
        }
    }
    return matches;
}

// ---------- Set score display ----------
const SetScore: React.FC<{ sets: number[]; tiebreaks: (number | null)[]; winner: boolean }> = ({
    sets, tiebreaks, winner,
}) => {
    if (sets.length === 0) return <span className="text-slate-600 text-sm">—</span>;
    return (
        <div className="flex items-center gap-1">
            {sets.map((s, i) => {
                const tb = tiebreaks[i];
                const isWinningSet = winner; // simplified — could compare per-set
                return (
                    <span key={i} className={`text-xs font-bold tabular-nums ${isWinningSet ? 'text-text-main' : 'text-slate-500'}`}>
                        {s}{tb != null ? <sup className="text-[8px] ml-0.5 text-slate-500">{tb}</sup> : ''}
                    </span>
                );
            })}
        </div>
    );
};

// ---------- Single match card ----------
const TennisMatchCard: React.FC<{ match: TennisMatch }> = ({ match }) => {
    const { player1, player2, round, court, status, inProgress, completed, notes } = match;

    const statusColor = inProgress
        ? 'text-green-400 bg-green-400/10 border-green-400/30'
        : completed
            ? 'text-slate-500 bg-neutral-800/50 border-neutral-700/50'
            : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';

    function PlayerRow({ player, opponent }: { player: TennisPlayer; opponent: TennisPlayer }) {
        const isWinner = player.winner && completed;
        const isLoser = opponent.winner && completed && !inProgress;
        return (
            <div className={`flex items-center gap-3 py-2 ${isLoser ? 'opacity-50' : ''}`}>
                {/* Flag */}
                <img
                    src={player.flagUrl}
                    alt={player.flagAlt}
                    className="w-6 h-4 object-cover rounded-sm border border-neutral-700/50 shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {/* Name */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        {player.rank && (
                            <span className="text-[9px] font-bold text-primary/70 bg-primary/10 rounded px-1 py-0.5 shrink-0">
                                #{player.rank}
                            </span>
                        )}
                        <span className={`text-sm font-bold truncate ${isWinner ? 'text-text-main' : 'text-slate-300'}`}>
                            {player.displayName}
                        </span>
                        {isWinner && (
                            <span className="material-symbols-outlined text-primary text-[14px] shrink-0">check_circle</span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-600">{player.flagAlt}</span>
                </div>
                {/* Set scores */}
                <SetScore
                    sets={player.sets}
                    tiebreaks={player.tiebreaks}
                    winner={player.winner}
                />
            </div>
        );
    }

    return (
        <div className="bg-neutral-900/60 border border-neutral-800/60 rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-800/30 border-b border-neutral-800/50">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{round}</span>
                    {court && (
                        <>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] text-slate-600">{court}</span>
                        </>
                    )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusColor}`}>
                    {inProgress ? '● Live' : status}
                </span>
            </div>

            {/* Players */}
            <div className="px-4 divide-y divide-neutral-800/30">
                <PlayerRow player={player1} opponent={player2} />
                <PlayerRow player={player2} opponent={player1} />
            </div>

            {/* Score summary note (from ESPN) */}
            {notes && completed && (
                <div className="px-4 py-2 bg-neutral-950/40 border-t border-neutral-800/30">
                    <p className="text-[10px] text-slate-600 italic leading-snug">{notes}</p>
                </div>
            )}
        </div>
    );
};

// ---------- Main Panel ----------
interface TennisTournamentPanelProps {
    sportKey: SportKey;
    selectedDate?: string;
}

export const TennisTournamentPanel: React.FC<TennisTournamentPanelProps> = ({ sportKey, selectedDate }) => {
    const [matches, setMatches] = useState<TennisMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tournamentName, setTournamentName] = useState<string>('');
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const dateToFetch = selectedDate || today;

    const fetchMatches = useCallback(async () => {
        const baseUrl = ESPN_SCOREBOARD_URLS[sportKey];
        if (!baseUrl) return;
        setLoading(true);
        setError(null);
        try {
            const espnDate = dateToFetch.replace(/-/g, '');
            const url = `${baseUrl}?dates=${espnDate}`;
            const res = await fetch(url);
            if (!res.ok) {
                setError('Unable to reach ESPN.');
                setMatches([]);
                return;
            }
            const data = await res.json() as RawObj;
            const events: RawObj[] = (data.events as RawObj[]) ?? [];
            // For tennis, there's typically one event (tournament) per request
            const allMatches: TennisMatch[] = events.flatMap(e => parseTennisEvent(e, sportKey));
            if (events.length > 0) setTournamentName((events[0].name as string) ?? '');
            setMatches(allMatches);
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch {
            setError('Failed to fetch data.');
            setMatches([]);
        } finally {
            setLoading(false);
        }
    }, [sportKey, dateToFetch]);

    useEffect(() => {
        fetchMatches();
        // Auto-refresh every 60s (tennis matches can be long)
        const interval = setInterval(fetchMatches, 60_000);
        return () => clearInterval(interval);
    }, [fetchMatches]);

    const tourLabel = sportKey === 'Tennis.ATP' ? 'ATP' : sportKey === 'Tennis.WTA' ? 'WTA' : 'Golf';

    // ── Loading ──
    if (loading && matches.length === 0) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-28 bg-neutral-900/60 border border-neutral-800/60 rounded-xl animate-pulse" />
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

    // ── No matches ──
    if (matches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">sports_tennis</span>
                <h3 className="text-slate-400 font-bold text-lg mb-1">No {tourLabel} matches today</h3>
                <p className="text-slate-600 text-sm max-w-xs">
                    Try a different date — {tourLabel} tournaments run throughout the week.
                </p>
            </div>
        );
    }

    // ── Matches ──
    return (
        <div className="space-y-4">
            {/* Header bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">PickLabs · {tourLabel}</span>
                    <span className="text-xs text-slate-600">· {matches.length} Match{matches.length !== 1 ? 'es' : ''}</span>
                    {tournamentName && (
                        <span className="text-xs text-slate-500 italic">— {tournamentName}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {lastUpdated && (
                        <span className="text-[10px] text-slate-600">Updated {lastUpdated}</span>
                    )}
                    <button
                        onClick={fetchMatches}
                        disabled={loading}
                        className="text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-30"
                        aria-label="Refresh"
                    >
                        <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
                    </button>
                </div>
            </div>

            {/* Match cards */}
            <div className="space-y-3">
                {matches.map(match => (
                    <TennisMatchCard key={match.id} match={match} />
                ))}
            </div>
        </div>
    );
};
