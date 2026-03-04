import React, { useEffect, useState, useCallback } from 'react';
import { ESPN_SCOREBOARD_URLS } from '../../data/espnScoreboard';
import { Game } from '../../data/mockGames';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawObj = Record<string, any>;

export interface BoxingNewsArticle {
    headline: string;
    description: string;
    link: string;
    published: string;
}

export interface BoxingFightOdds {
    id: string;
    fightName: string;
    homeTeam: string;
    awayTeam: string;
    commenceTime: string;
    books: {
        title: string;
        homeOdds: number;
        awayOdds: number;
    }[];
}

export interface BoxingBout {
    id: string;
    fighter1: {
        id: string;
        name: string;
        shortName: string;
        nationality: string;
        flagUrl: string;
        record: string;         // "40-2-1"
        ranking: string;        // "#1 WBC"
        headshot: string;
    };
    fighter2: {
        id: string;
        name: string;
        shortName: string;
        nationality: string;
        flagUrl: string;
        record: string;
        ranking: string;
        headshot: string;
    };
    weightClass: string;
    rounds: string;             // "12" or "10"
    result: string;             // "KO", "TKO", "Decision", "Upcoming"
    winner: 'home' | 'away' | 'none';
    winRound: string;
    winTime: string;
    status: 'LIVE' | 'FINAL' | 'SCHEDULED';
    bout: string;               // "Main Event" etc
}

export interface BoxingEvent {
    id: string;
    name: string;
    date: string;
    venue: string;
    location: string;
    bouts: BoxingBout[];
}

async function fetchMostRecentBoxingEvent(daysBack = 180): Promise<BoxingEvent | null> {
    const base = (ESPN_SCOREBOARD_URLS as any)['Boxing'] || 'https://site.api.espn.com/apis/site/v2/sports/boxing/match/scoreboard';
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
            const competitions: RawObj[] = ev?.competitions ?? [];

            const bouts: BoxingBout[] = competitions.map((comp: RawObj) => {
                const comps: RawObj[] = comp?.competitors ?? [];
                const home: RawObj = comps.find((c: RawObj) => c.homeAway === 'home') ?? comps[0] ?? {};
                const away: RawObj = comps.find((c: RawObj) => c.homeAway === 'away') ?? comps[1] ?? {};

                const parseF = (f: RawObj) => ({
                    id: f?.id ?? Math.random().toString(),
                    name: f?.athlete?.displayName ?? f?.displayName ?? 'Unknown',
                    shortName: f?.athlete?.shortName ?? '',
                    nationality: f?.athlete?.nationality ?? '',
                    flagUrl: f?.athlete?.flag?.href ?? '',
                    record: f?.records?.[0]?.summary ?? '',
                    ranking: f?.athlete?.rank ? `#${f.athlete.rank}` : '',
                    headshot: f?.athlete?.headshot?.href ?? '',
                });

                const statusType = comp?.status?.type?.name ?? '';
                const method = comp?.method?.text ?? comp?.status?.type?.description ?? '';
                const winnerId = comps.find((c: RawObj) => c.winner)?.id;

                return {
                    id: comp?.id ?? Math.random().toString(),
                    fighter1: parseF(home),
                    fighter2: parseF(away),
                    weightClass: comp?.weightClass?.text ?? comp?.notes?.[0]?.headline ?? 'Boxing',
                    rounds: String(comp?.laps ?? comp?.totalRounds ?? '12'),
                    result: statusType === 'STATUS_SCHEDULED' ? 'Upcoming' : method || 'Decision',
                    winner: winnerId ? (winnerId === home?.id ? 'home' : 'away') : 'none',
                    winRound: comp?.resultRound ? `R${comp.resultRound}` : '',
                    winTime: comp?.resultTime ?? '',
                    status: statusType === 'STATUS_IN_PROGRESS' ? 'LIVE' : statusType === 'STATUS_FINAL' ? 'FINAL' : 'SCHEDULED',
                    bout: comp?.notes?.[0]?.type === 'event' ? (comp?.notes?.[0]?.headline ?? '') : '',
                };
            });

            return {
                id: ev?.id ?? '',
                name: ev?.name ?? 'Boxing Event',
                date: ev?.date?.split('T')[0] ?? '',
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

function boutToGame(bout: BoxingBout, eventName: string): Game {
    return {
        id: bout.id,
        sport: 'Boxing',
        matchupId: bout.id,
        awayTeam: { name: bout.fighter2.name, abbr: bout.fighter2.shortName, logo: bout.fighter2.headshot || bout.fighter2.flagUrl, score: 0, winProb: 50 },
        homeTeam: { name: bout.fighter1.name, abbr: bout.fighter1.shortName, logo: bout.fighter1.headshot || bout.fighter1.flagUrl, score: 0, winProb: 50 },
        status: bout.status as 'LIVE' | 'FINAL' | 'SCHEDULED',
        timeLabel: bout.status === 'FINAL' ? `${bout.result}${bout.winRound ? ` ${bout.winRound}` : ''}` : bout.result,
        league: eventName,
        venue: { name: eventName, location: '' },
        sportLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/boxing.png',
        broadcast: '',
        odds: { spread: 'N/A', moneyline: { away: 0, home: 0 }, overUnder: { value: 0, pick: 'over' } },
        winProbability: { away: 50, home: 50 },
        streakLabel: '',
        date: new Date().toISOString().split('T')[0],
    } as unknown as Game;
}

interface BoxingBoutPanelProps {
    onSelectGame?: (game: Game) => void;
}

async function fetchBoxingNews(): Promise<BoxingNewsArticle[]> {
    try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/boxing/news', { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.articles || []).slice(0, 3).map((a: RawObj) => ({
            headline: a.headline,
            description: a.description,
            link: a.links?.web?.href || '',
            published: a.published,
        }));
    } catch {
        return [];
    }
}

async function fetchBoxingOdds(): Promise<BoxingFightOdds[]> {
    // Note: VITE_ODDS_API_KEY should be set in environment variables.
    // Without it, the API will fail gracefully and simply render nothing.
    const apiKey = import.meta.env.VITE_ODDS_API_KEY || 'YOUR_FREE_API_KEY';
    try {
        const res = await fetch(`https://api.the-odds-api.com/v4/sports/boxing_boxing/odds/?apiKey=${apiKey}&regions=us&markets=h2h&bookmakers=fanduel,draftkings,betmgm&oddsFormat=american`, { cache: 'no-store' });
        if (!res.ok) return [];
        const data = await res.json();
        return data.slice(0, 3).map((f: RawObj) => {
            const books = (f.bookmakers || []).map((b: RawObj) => {
                const market = b.markets?.[0];
                const home = market?.outcomes?.find((o: RawObj) => o.name === f.home_team)?.price || 0;
                const away = market?.outcomes?.find((o: RawObj) => o.name === f.away_team)?.price || 0;
                return { title: b.title, homeOdds: home, awayOdds: away };
            });
            return {
                id: f.id,
                fightName: `${f.home_team} vs ${f.away_team}`,
                homeTeam: f.home_team,
                awayTeam: f.away_team,
                commenceTime: f.commence_time,
                books,
            };
        });
    } catch {
        return [];
    }
}

export const BoxingBoutPanel: React.FC<BoxingBoutPanelProps> = ({ onSelectGame }) => {
    const [event, setEvent] = useState<BoxingEvent | null>(null);
    const [news, setNews] = useState<BoxingNewsArticle[]>([]);
    const [odds, setOdds] = useState<BoxingFightOdds[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [ev, n, o] = await Promise.all([
                fetchMostRecentBoxingEvent(180),
                fetchBoxingNews(),
                fetchBoxingOdds()
            ]);
            if (ev) setEvent(ev);
            else setError('No recent boxing events found.');
            setNews(n);
            setOdds(o);
        } catch { setError('Failed to load boxing data.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-neutral-900/60 border border-neutral-800 rounded-xl animate-pulse" />)}
        </div>
    );

    if (error || !event) return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="text-5xl">🥊</div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No boxing events found</p>
        </div>
    );

    const statusColor = (s: string) => {
        if (s === 'LIVE') return 'text-green-400 bg-green-400/10 border-green-400/30';
        if (s === 'FINAL') return 'text-slate-400 bg-slate-400/10 border-slate-600/30';
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    };

    const winnerColor = (side: 'home' | 'away', winner: BoxingBout['winner']) => {
        if (winner === 'none') return 'text-text-main';
        return side === winner ? 'text-primary font-black' : 'text-slate-500';
    };

    const formatOdds = (val: number) => val > 0 ? `+${val}` : `${val}`;

    return (
        <div className="space-y-6">

            {/* 1. News Ticker */}
            {news.length > 0 && (
                <div className="news-ticker-container bg-[#0a0f16] border border-amber-500/30 p-2 rounded-lg mb-6 flex items-center shadow-inner">
                    <span className="text-amber-500 font-black text-[10px] uppercase tracking-widest px-3 border-r border-amber-500/20 shrink-0 z-10 bg-[#0a0f16]">LATEST NEWS</span>
                    <div className="animate-scroll-left text-amber-400/90 font-bold text-xs whitespace-nowrap overflow-hidden">
                        {news.map((n, i) => (
                            <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" className="mx-8 hover:text-white transition-colors cursor-pointer inline-block">
                                🥊 {n.headline}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Upcoming Odds (Tale of the Tape) */}
            {odds.length > 0 ? (
                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-amber-500 text-xl">scale</span>
                        <h2 className="text-sm font-black uppercase tracking-widest text-text-main">Tale of the Tape (Upcoming)</h2>
                        {!import.meta.env.VITE_ODDS_API_KEY && (
                            <span className="ml-auto text-[9px] text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded">Setup API Key in env</span>
                        )}
                    </div>

                    {odds.map((o) => {
                        let bestHome = -9999;
                        let bestAway = -9999;
                        o.books.forEach(b => {
                            if (b.homeOdds > bestHome) bestHome = b.homeOdds;
                            if (b.awayOdds > bestAway) bestAway = b.awayOdds;
                        });

                        return (
                            <div key={o.id} className="terminal-panel p-6 border border-neutral-700/60 bg-gradient-to-b from-neutral-900 to-neutral-800 rounded-2xl shadow-xl">
                                <div className="text-amber-500 font-black tracking-widest uppercase text-xs text-center mb-6">
                                    🥊 {o.fightName}
                                </div>

                                <div className="flex justify-between items-center mb-8 px-2 sm:px-6">
                                    <div className="flex-1 text-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full border-[3px] border-neutral-700 bg-neutral-800 flex items-center justify-center mb-3 overflow-hidden shadow-inner">
                                            <span className="text-xl sm:text-2xl font-black text-slate-500">{o.homeTeam.substring(0, 2).toUpperCase()}</span>
                                        </div>
                                        <h3 className="text-sm sm:text-lg font-black text-text-main leading-tight">{o.homeTeam}</h3>
                                        <div className="text-slate-500 text-[10px] font-bold mt-1 tracking-wider uppercase">Fighter A</div>
                                    </div>

                                    <div className="bg-[#0f172a] text-text-main px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-black italic border border-neutral-700 mx-2 sm:mx-4 shadow-sm text-sm sm:text-lg shrink-0">
                                        VS
                                    </div>

                                    <div className="flex-1 text-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full border-[3px] border-neutral-700 bg-neutral-800 flex items-center justify-center mb-3 overflow-hidden shadow-inner">
                                            <span className="text-xl sm:text-2xl font-black text-slate-500">{o.awayTeam.substring(0, 2).toUpperCase()}</span>
                                        </div>
                                        <h3 className="text-sm sm:text-lg font-black text-text-main leading-tight">{o.awayTeam}</h3>
                                        <div className="text-slate-500 text-[10px] font-bold mt-1 tracking-wider uppercase">Fighter B</div>
                                    </div>
                                </div>

                                {/* Odds Grid */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-[#0f172a] p-3 sm:p-4 rounded-xl border border-neutral-800/80">
                                    {['DraftKings', 'FanDuel', 'BetMGM'].map(bookName => {
                                        const book = o.books.find(b => b.title === bookName);
                                        const hOdds = book?.homeOdds;
                                        const aOdds = book?.awayOdds;

                                        const isBestHome = hOdds === bestHome && hOdds !== undefined;
                                        const isBestAway = aOdds === bestAway && aOdds !== undefined;

                                        return (
                                            <div key={bookName} className="flex flex-col gap-2 text-center">
                                                <div className="text-slate-500 font-bold uppercase text-[9px] sm:text-[10px] tracking-wider mb-1 px-1 truncate">{bookName}</div>

                                                <div className={`p-1.5 sm:p-2 rounded-lg border font-black text-xs sm:text-sm transition-colors ${isBestHome ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-neutral-800 border-neutral-700 text-text-main'}`}>
                                                    {isBestHome && <span className="material-symbols-outlined text-orange-500 text-[10px] align-middle mr-1">local_fire_department</span>}{hOdds !== undefined ? formatOdds(hOdds) : '-'}
                                                </div>

                                                <div className={`p-1.5 sm:p-2 rounded-lg border font-black text-xs sm:text-sm transition-colors ${isBestAway ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-neutral-800 border-neutral-700 text-text-main'}`}>
                                                    {isBestAway && <span className="material-symbols-outlined text-orange-500 text-[10px] align-middle mr-1">local_fire_department</span>}{aOdds !== undefined ? formatOdds(aOdds) : '-'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="text-center mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                                    {new Date(o.commenceTime).toLocaleDateString()} · Live Line Shopping
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-xs text-slate-500 terminal-panel p-4 mb-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-text-main mb-2">Upcoming Odds</h2>
                    Connect Odds API key or await line drops.
                </div>
            )}

            {/* Event header */}
            <div className="terminal-panel p-4 border border-neutral-700/60 bg-gradient-to-r from-neutral-900 to-neutral-800/60">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">🥊</span>
                            <h2 className="text-sm font-black uppercase tracking-widest text-text-main">{event.name}</h2>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {event.venue}{event.location ? ` · ${event.location}` : ''}
                        </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            {event.date ? new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border text-amber-400 border-amber-400/30 bg-amber-400/10">
                            Most Recent Event
                        </span>
                    </div>
                </div>
            </div>

            {/* Bout cards — same style as UFC */}
            {event.bouts.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">Bout details not yet available.</div>
            )}
            {event.bouts.map((bout, i) => (
                <div
                    key={bout.id}
                    onClick={() => onSelectGame && onSelectGame(boutToGame(bout, event.name))}
                    className={`terminal-panel border border-neutral-700/60 overflow-hidden transition-all duration-200 ${onSelectGame ? 'cursor-pointer hover:border-primary/50 hover:bg-neutral-800/60 hover:shadow-lg hover:shadow-primary/5' : ''}`}
                >
                    {/* Bout label */}
                    <div className="px-4 py-1.5 bg-neutral-800/80 border-b border-neutral-700/40 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {i === 0 ? 'Main Event' : i === 1 ? 'Co-Main Event' : `Bout ${i + 1}`}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{bout.weightClass} · {bout.rounds} Rds</span>
                    </div>

                    <div className="p-4 flex items-center gap-4">
                        {/* Fighter 2 (Away) */}
                        <div className="flex-1 flex flex-col items-start gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                                {bout.fighter2.headshot && (
                                    <img src={bout.fighter2.headshot} alt={bout.fighter2.shortName} className="w-10 h-10 rounded-full object-cover border border-neutral-700 bg-neutral-800" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                {!bout.fighter2.headshot && bout.fighter2.flagUrl && (
                                    <img src={bout.fighter2.flagUrl} alt="" className="h-5 w-7 object-cover rounded-sm border border-neutral-700/40" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <div>
                                    <span className={`text-sm font-black uppercase tracking-widest truncate ${winnerColor('away', bout.winner)}`}>
                                        {bout.fighter2.name}
                                        {bout.winner === 'away' && <span className="ml-2 text-[9px] text-primary">W</span>}
                                    </span>
                                    {bout.fighter2.record && <div className="text-[10px] text-slate-500 font-bold">{bout.fighter2.record}</div>}
                                    {bout.fighter2.ranking && <div className="text-[9px] text-amber-400 font-black">{bout.fighter2.ranking}</div>}
                                </div>
                            </div>
                        </div>

                        {/* VS / Result */}
                        <div className="flex flex-col items-center gap-1 shrink-0 px-2">
                            <span className="text-xs font-black text-slate-600">VS</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor(bout.status)}`}>
                                {bout.status}
                            </span>
                            {bout.status === 'FINAL' && bout.result && (
                                <span className="text-[9px] text-slate-400 font-bold text-center">{bout.result}{bout.winRound ? ` · ${bout.winRound}` : ''}</span>
                            )}
                            {onSelectGame && <span className="text-[9px] text-slate-600 font-bold uppercase mt-1">Tap →</span>}
                        </div>

                        {/* Fighter 1 (Home) */}
                        <div className="flex-1 flex flex-col items-end gap-1 min-w-0">
                            <div className="flex items-center gap-2 flex-row-reverse">
                                {bout.fighter1.headshot && (
                                    <img src={bout.fighter1.headshot} alt={bout.fighter1.shortName} className="w-10 h-10 rounded-full object-cover border border-neutral-700 bg-neutral-800" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                {!bout.fighter1.headshot && bout.fighter1.flagUrl && (
                                    <img src={bout.fighter1.flagUrl} alt="" className="h-5 w-7 object-cover rounded-sm border border-neutral-700/40" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                <div className="text-right">
                                    <span className={`text-sm font-black uppercase tracking-widest truncate ${winnerColor('home', bout.winner)}`}>
                                        {bout.winner === 'home' && <span className="mr-2 text-[9px] text-primary">W</span>}
                                        {bout.fighter1.name}
                                    </span>
                                    {bout.fighter1.record && <div className="text-[10px] text-slate-500 font-bold">{bout.fighter1.record}</div>}
                                    {bout.fighter1.ranking && <div className="text-[9px] text-amber-400 font-black">{bout.fighter1.ranking}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
