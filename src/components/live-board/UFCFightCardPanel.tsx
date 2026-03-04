import React, { useEffect, useState, useCallback } from 'react';
import { ESPN_SCOREBOARD_URLS } from '../../data/espnScoreboard';
import { Game } from '../../data/mockGames';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawObj = Record<string, any>;

interface Fighter {
    id: string;
    displayName: string;
    shortName: string;
    flagUrl: string;
    record: string;       // e.g. "23-6"
    ranking: string;      // e.g. "#3" or "C" for champion
}

interface UFCBout {
    id: string;
    fighter1: Fighter;    // home / red corner
    fighter2: Fighter;    // away / blue corner
    weightClass: string;
    result: string;       // "KO/TKO" | "Submission" | "Decision" | "Upcoming"
    winner: 'home' | 'away' | 'none';
    round: string;        // "R2" or ""
    time: string;         // "4:23" or ""
    bout: string;         // "Main Event" or "Prelim"
    status: string;       // "FINAL" | "LIVE" | "SCHEDULED"
}

interface UFCEvent {
    id: string;
    name: string;
    date: string;
    venue: string;
    location: string;
    bouts: UFCBout[];
}

// Walk back up to 14 days to find recent UFC events
async function fetchMostRecentUFCEvent(daysBack = 14): Promise<UFCEvent | null> {
    const base = ESPN_SCOREBOARD_URLS['UFC'];
    for (let d = 0; d <= daysBack; d++) {
        const dt = new Date();
        dt.setDate(dt.getDate() - d);
        const dateStr = dt.toISOString().split('T')[0].replace(/-/g, '');
        try {
            const res = await fetch(`${base}?dates=${dateStr}`, { cache: 'no-store' });
            if (!res.ok) continue;
            const json: RawObj = await res.json();
            const events: RawObj[] = json?.events ?? [];
            if (events.length === 0) continue;

            // Grab the most recent event
            const ev = events[0];
            const competitions: RawObj[] = ev?.competitions ?? [];
            const bouts: UFCBout[] = competitions.map((comp: RawObj) => {
                const comps: RawObj[] = comp?.competitors ?? [];
                const home: RawObj = comps.find((c: RawObj) => c.homeAway === 'home') ?? comps[0] ?? {};
                const away: RawObj = comps.find((c: RawObj) => c.homeAway === 'away') ?? comps[1] ?? {};

                const parseF = (f: RawObj): Fighter => ({
                    id: f?.id ?? Math.random().toString(),
                    displayName: f?.athlete?.displayName ?? 'Unknown',
                    shortName: f?.athlete?.shortName ?? '???',
                    flagUrl: f?.athlete?.flag?.href ?? (f?.athlete?.country?.flag?.href) ?? '',
                    record: f?.records?.[0]?.summary ?? f?.records?.find((r: RawObj) => r.type === 'total')?.summary ?? '',
                    ranking: f?.athlete?.rank ? `#${f.athlete.rank}` : '',
                });

                const statusType = comp?.status?.type?.name ?? '';
                const statusShort = comp?.status?.type?.shortDetail ?? '';
                const note: string = comp?.notes?.[0]?.headline ?? '';
                const method = comp?.method?.text ?? comp?.status?.type?.description ?? statusShort;
                const winnerId = comps.find((c: RawObj) => c.winner)?.id;
                const homeId = home?.id;

                return {
                    id: comp?.id ?? Math.random().toString(),
                    fighter1: parseF(home),
                    fighter2: parseF(away),
                    weightClass: comp?.weightClass?.text ?? note ?? 'MMA',
                    result: statusType === 'STATUS_SCHEDULED' ? 'Upcoming' : method,
                    winner: winnerId ? (winnerId === homeId ? 'home' : 'away') : 'none',
                    round: comp?.status?.type?.name === 'STATUS_FINAL' ? String(comp?.status?.period ?? '') : '',
                    time: comp?.status?.displayClock ?? '',
                    bout: comp?.notes?.[0]?.type === 'event' ? comp?.notes?.[0]?.headline ?? '' : '',
                    status: statusType === 'STATUS_IN_PROGRESS' ? 'LIVE' : statusType === 'STATUS_FINAL' ? 'FINAL' : 'SCHEDULED',
                };
            });

            return {
                id: ev?.id ?? '',
                name: ev?.name ?? ev?.shortName ?? 'UFC Event',
                date: ev?.date?.split('T')[0] ?? dateStr,
                venue: ev?.competitions?.[0]?.venue?.fullName ?? '',
                location: [ev?.competitions?.[0]?.venue?.address?.city, ev?.competitions?.[0]?.venue?.address?.state].filter(Boolean).join(', '),
                bouts,
            };
        } catch {
            continue;
        }
    }
    return null;
}

function boutToGame(bout: UFCBout, eventName: string): Game {
    return {
        id: bout.id,
        sport: 'UFC',
        matchupId: bout.id,
        awayTeam: { name: bout.fighter2.displayName, abbr: bout.fighter2.shortName, logo: bout.fighter2.flagUrl, score: 0, winProb: 50 },
        homeTeam: { name: bout.fighter1.displayName, abbr: bout.fighter1.shortName, logo: bout.fighter1.flagUrl, score: 0, winProb: 50 },
        status: bout.status as 'LIVE' | 'FINAL' | 'SCHEDULED',
        timeLabel: bout.status === 'FINAL' ? `${bout.result}${bout.round ? ` R${bout.round}` : ''}` : bout.result,
        league: eventName,
        venue: { name: eventName, location: '' },
        sportLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png',
        broadcast: '',
        odds: { spread: 'N/A', moneyline: { away: 0, home: 0 }, overUnder: { value: 0, pick: 'over' } },
        winProbability: { away: 50, home: 50 },
        streakLabel: '',
        date: new Date().toISOString().split('T')[0],
    } as unknown as Game;
}

interface UFCFightCardPanelProps {
    onSelectGame?: (game: Game) => void;
}

export const UFCFightCardPanel: React.FC<UFCFightCardPanelProps> = ({ onSelectGame }) => {
    const [event, setEvent] = useState<UFCEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const ev = await fetchMostRecentUFCEvent(21);
            if (ev) {
                setEvent(ev);
            } else {
                setError('No recent UFC events found.');
            }
        } catch {
            setError('Failed to load UFC data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-neutral-900/60 border border-neutral-800/60 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="text-5xl">🥊</div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No UFC events found</p>
            </div>
        );
    }

    const statusColor = (s: string) => {
        if (s === 'LIVE') return 'text-green-400 bg-green-400/10 border-green-400/30';
        if (s === 'FINAL') return 'text-slate-400 bg-slate-400/10 border-slate-600/30';
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    };

    const winnerColor = (side: 'home' | 'away', winner: UFCBout['winner']) => {
        if (winner === 'none') return 'text-text-main';
        return side === winner ? 'text-primary font-black' : 'text-slate-500';
    };

    return (
        <div className="space-y-4">
            {/* Event header */}
            <div className="terminal-panel p-4 border border-neutral-700/60 bg-gradient-to-r from-neutral-900 to-neutral-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <img src="https://a.espncdn.com/i/teamlogos/leagues/500/ufc.png" alt="UFC" className="h-6 w-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <h2 className="text-sm font-black uppercase tracking-widest text-text-main">{event.name}</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{event.venue}{event.location ? ` · ${event.location}` : ''}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <div className="mt-1">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border text-amber-400 border-amber-400/30 bg-amber-400/10">
                                Most Recent Event
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fight card */}
            {event.bouts.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">Fight card details not yet available.</div>
            )}
            {event.bouts.map((bout, i) => (
                <div
                    key={bout.id}
                    onClick={() => onSelectGame && onSelectGame(boutToGame(bout, event.name))}
                    className={`terminal-panel border border-neutral-700/60 overflow-hidden transition-all duration-200 ${onSelectGame ? 'cursor-pointer hover:border-primary/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-primary/5' : ''}`}
                >
                    {/* Bout label */}
                    {(bout.bout || i === 0) && (
                        <div className="px-4 py-1.5 bg-neutral-800/80 border-b border-neutral-700/40 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                                {i === 0 ? 'Main Event' : i === 1 ? 'Co-Main Event' : `Bout ${i + 1}`}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">{bout.weightClass}</span>
                        </div>
                    )}

                    <div className="p-4 flex items-center gap-4">
                        {/* Fighter 2 (Blue / Away) */}
                        <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                                {bout.fighter2.flagUrl && (
                                    <img src={bout.fighter2.flagUrl} alt="" className="h-5 w-7 object-cover rounded-sm border border-neutral-700/40" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <span className={`text-sm font-black uppercase tracking-widest truncate ${winnerColor('away', bout.winner)}`}>
                                    {bout.fighter2.displayName}
                                    {bout.winner === 'away' && <span className="ml-2 text-[9px] text-primary">W</span>}
                                </span>
                            </div>
                            {bout.fighter2.record && <span className="text-[10px] text-slate-500 font-bold">{bout.fighter2.record}</span>}
                            {bout.fighter2.ranking && <span className="text-[9px] text-amber-400 font-black">{bout.fighter2.ranking}</span>}
                        </div>

                        {/* VS / Result */}
                        <div className="flex flex-col items-center gap-1 shrink-0 px-2">
                            <span className="text-xs font-black text-slate-600">VS</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor(bout.status)}`}>
                                {bout.status}
                            </span>
                            {bout.status === 'FINAL' && bout.result && bout.result !== 'Upcoming' && (
                                <span className="text-[9px] text-slate-400 font-bold text-center">{bout.result}</span>
                            )}
                            {onSelectGame && (
                                <span className="text-[9px] text-slate-600 font-bold uppercase mt-1">Tap →</span>
                            )}
                        </div>

                        {/* Fighter 1 (Red / Home) */}
                        <div className="flex-1 flex flex-col items-end gap-1 min-w-0">
                            <div className="flex items-center gap-2 flex-row-reverse">
                                {bout.fighter1.flagUrl && (
                                    <img src={bout.fighter1.flagUrl} alt="" className="h-5 w-7 object-cover rounded-sm border border-neutral-700/40" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <span className={`text-sm font-black uppercase tracking-widest truncate text-right ${winnerColor('home', bout.winner)}`}>
                                    {bout.winner === 'home' && <span className="mr-2 text-[9px] text-primary">W</span>}
                                    {bout.fighter1.displayName}
                                </span>
                            </div>
                            {bout.fighter1.record && <span className="text-[10px] text-slate-500 font-bold">{bout.fighter1.record}</span>}
                            {bout.fighter1.ranking && <span className="text-[9px] text-amber-400 font-black">{bout.fighter1.ranking}</span>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
