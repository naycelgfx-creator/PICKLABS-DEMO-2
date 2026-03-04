import React, { useEffect, useState, useCallback } from 'react';
import { ESPN_SCOREBOARD_URLS } from '../../data/espnScoreboard';
import { Game } from '../../data/mockGames';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawObj = Record<string, any>;

export interface NASCARDriver {
    id: string;
    position: number;
    name: string;
    shortName: string;
    number: string;
    manufacturer: string;
    headshot: string;
    teamName: string;
    teamLogo: string;
    status: string;       // 'Running' | 'Out' | 'Winner'
    laps: string;
    lapsLed: string;
    points: string;
    behind: string;       // laps/time behind leader
    isWinner: boolean;
}

export interface NASCARRace {
    id: string;
    name: string;
    shortName: string;
    date: string;
    track: string;
    location: string;
    lapTotal: string;
    status: string;
    drivers: NASCARDriver[];
}

// Walk back up to 30 days to find a recent NASCAR race
async function fetchMostRecentNASCARRace(daysBack = 30): Promise<NASCARRace | null> {
    const base = (ESPN_SCOREBOARD_URLS as any)['NASCAR'] || 'https://site.api.espn.com/apis/site/v2/sports/racing/nascar/scoreboard';
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

            const ev = events[0];
            const comp = ev?.competitions?.[0];
            const competitors: RawObj[] = comp?.competitors ?? [];

            const drivers: NASCARDriver[] = competitors.map((c: RawObj, idx: number) => {
                const athlete: RawObj = c?.athlete ?? {};
                const stats: RawObj[] = c?.statistics ?? [];
                const getStat = (name: string) => stats.find((s: RawObj) => s.name === name)?.displayValue ?? '';

                return {
                    id: c?.id ?? String(idx),
                    position: c?.position ?? idx + 1,
                    name: athlete?.displayName ?? c?.displayName ?? 'Unknown Driver',
                    shortName: athlete?.shortName ?? '',
                    number: athlete?.jersey ?? c?.jersey ?? String(idx + 1),
                    manufacturer: c?.car?.name ?? c?.make ?? '',
                    headshot: athlete?.headshot?.href ?? '',
                    teamName: c?.team?.name ?? '',
                    teamLogo: c?.team?.logo ?? '',
                    status: c?.status ?? 'Running',
                    laps: getStat('lapsCompleted') || getStat('laps') || '',
                    lapsLed: getStat('lapsLed') || '',
                    points: getStat('pointsEarned') || getStat('points') || '',
                    behind: c?.difftime ?? c?.gap ?? '',
                    isWinner: c?.winner === true || c?.position === 1,
                };
            }).sort((a, b) => a.position - b.position);

            return {
                id: ev?.id ?? '',
                name: ev?.name ?? 'NASCAR Race',
                shortName: ev?.shortName ?? '',
                date: ev?.date?.split('T')[0] ?? '',
                track: comp?.venue?.fullName ?? ev?.venue?.fullName ?? '',
                location: [comp?.venue?.address?.city, comp?.venue?.address?.state].filter(Boolean).join(', '),
                lapTotal: comp?.laps ?? '',
                status: comp?.status?.type?.name === 'STATUS_FINAL' ? 'FINAL'
                    : comp?.status?.type?.name === 'STATUS_IN_PROGRESS' ? 'LIVE' : 'SCHEDULED',
                drivers,
            };
        } catch {
            continue;
        }
    }
    return null;
}

function driverToGame(driver: NASCARDriver, race: NASCARRace): Game {
    const p2 = race.drivers[1];
    return {
        id: `${race.id}-${driver.id}`,
        sport: 'NASCAR',
        matchupId: `${race.id}-${driver.id}`,
        homeTeam: {
            name: driver.name,
            abbr: `#${driver.number}`,
            logo: driver.headshot || driver.teamLogo,
            score: parseInt(driver.laps) || 0,
            winProb: driver.position === 1 ? 75 : 50,
            record: `P${driver.position}`,
        },
        awayTeam: {
            name: p2?.name ?? 'Field',
            abbr: p2 ? `#${p2.number}` : 'FLD',
            logo: p2?.headshot || p2?.teamLogo || '',
            score: parseInt(p2?.laps ?? '0') || 0,
            winProb: 50,
            record: p2 ? `P${p2.position}` : '',
        },
        status: race.status as 'LIVE' | 'FINAL' | 'SCHEDULED',
        timeLabel: race.status === 'FINAL' ? `FINAL — ${race.lapTotal} Laps` : race.status,
        league: 'NASCAR Cup Series',
        venue: { name: race.track, location: race.location },
        sportLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nascar.png',
        broadcast: '',
        odds: { spread: 'N/A', moneyline: { away: 0, home: 0 }, overUnder: { value: 0, pick: 'over' } },
        winProbability: { home: driver.position === 1 ? 75 : 50, away: 50 },
        streakLabel: '',
        date: race.date,
    } as unknown as Game;
}

interface NASCARRacePanelProps {
    onSelectGame?: (game: Game) => void;
}

export const NASCARRacePanel: React.FC<NASCARRacePanelProps> = ({ onSelectGame }) => {
    const [race, setRace] = useState<NASCARRace | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const r = await fetchMostRecentNASCARRace(30);
            if (r) setRace(r);
            else setError('No recent NASCAR races found.');
        } catch { setError('Failed to load NASCAR data.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return (
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-neutral-900/60 border border-neutral-800 rounded-xl animate-pulse" />)}
        </div>
    );

    if (error || !race) return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="text-5xl">🏁</div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No NASCAR races found</p>
        </div>
    );

    const statusColor = (s: string) => {
        if (s === 'LIVE') return 'text-green-400 bg-green-400/10 border-green-400/30';
        if (s === 'FINAL') return 'text-slate-400 bg-slate-400/10 border-slate-600/30';
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    };

    // NASCAR team colors palette by position tier
    const posColor = (pos: number) => {
        if (pos === 1) return 'text-yellow-400';
        if (pos <= 3) return 'text-primary';
        if (pos <= 10) return 'text-text-main';
        return 'text-slate-500';
    };

    return (
        <div className="space-y-4">
            {/* Race header */}
            <div className="terminal-panel p-4 border border-neutral-700/60 bg-gradient-to-r from-neutral-900 to-neutral-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">🏁</span>
                            <h2 className="text-sm font-black uppercase tracking-widest text-text-main">{race.name}</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {race.track}{race.location ? ` · ${race.location}` : ''}{race.lapTotal ? ` · ${race.lapTotal} Laps` : ''}
                        </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {race.date ? new Date(race.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${statusColor(race.status)}`}>
                            {race.status}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border text-amber-400 border-amber-400/30 bg-amber-400/10">
                            Most Recent Race
                        </span>
                    </div>
                </div>
            </div>

            {/* Driver standings table */}
            <div className="terminal-panel border border-neutral-700/60 overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[40px_1fr_60px_80px_80px_80px] gap-2 px-4 py-2 bg-neutral-800/80 border-b border-neutral-700/40 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <span className="text-center">POS</span>
                    <span>DRIVER</span>
                    <span className="text-center">#CAR</span>
                    <span className="text-center">LAPS</span>
                    <span className="text-center">LAPS LED</span>
                    <span className="text-center">STATUS</span>
                </div>

                {race.drivers.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">Race results not yet available.</div>
                ) : null}

                {race.drivers.slice(0, 30).map((driver, i) => (
                    <div
                        key={driver.id}
                        onClick={() => onSelectGame && onSelectGame(driverToGame(driver, race))}
                        className={`grid grid-cols-[40px_1fr_60px_80px_80px_80px] gap-2 px-4 py-3 items-center border-b border-neutral-800/40 last:border-0 transition-all duration-150 ${onSelectGame ? 'cursor-pointer hover:bg-neutral-800/40' : ''} ${driver.isWinner ? 'bg-yellow-500/5 border-yellow-500/20' : ''}`}
                    >
                        {/* Position */}
                        <span className={`text-sm font-black text-center tabular-nums ${posColor(driver.position)}`}>
                            {driver.isWinner ? '🏆' : driver.position}
                        </span>

                        {/* Driver */}
                        <div className="flex items-center gap-2 min-w-0">
                            {driver.headshot ? (
                                <img src={driver.headshot} alt={driver.shortName} className="w-8 h-8 rounded-full object-cover border border-neutral-700 shrink-0 bg-neutral-800" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                                    <span className="text-[9px] font-black text-slate-400">{driver.number}</span>
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className={`text-sm font-black truncate ${driver.isWinner ? 'text-yellow-400' : 'text-text-main'}`}>
                                    {driver.name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold truncate">{driver.teamName || driver.manufacturer}</div>
                            </div>
                        </div>

                        {/* Car # */}
                        <span className="text-center text-[11px] font-black text-slate-300 tabular-nums">#{driver.number}</span>

                        {/* Laps */}
                        <span className="text-center text-[11px] text-slate-400 font-bold tabular-nums">{driver.laps || '—'}</span>

                        {/* Laps Led */}
                        <span className={`text-center text-[11px] font-bold tabular-nums ${parseInt(driver.lapsLed) > 0 ? 'text-primary' : 'text-slate-600'}`}>
                            {driver.lapsLed || '—'}
                        </span>

                        {/* Status */}
                        <div className="flex justify-center">
                            {i < 3 ? (
                                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border text-primary border-primary/30 bg-primary/10">
                                    Top {driver.position}
                                </span>
                            ) : (
                                <span className="text-[9px] text-slate-600 font-bold">{driver.behind ? `+${driver.behind}` : '—'}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
