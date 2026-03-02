// ESPN Scoreboard API Service
// Fetches real live/recent game data for 8 sports

export type SportKey =
    | 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'CFB' | 'CBB' | 'UFC'
    | 'Soccer.EPL'
    | 'Soccer.UCL'
    | 'Soccer.LALIGA'
    | 'Soccer.BUNDESLIGA'
    | 'Soccer.SERIEA'
    | 'Soccer.LIGUE1'
    | 'Soccer.MLS'
    | 'Soccer.LIGAMX'
    | 'Tennis.ATP'
    | 'Tennis.WTA'
    | 'Golf.PGA'
    | 'WNBA'
    | 'NCAAW';

export const ESPN_SCOREBOARD_URLS: Record<SportKey, string> = {
    NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    WNBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
    NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
    NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    CFB: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
    CBB: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
    NCAAW: 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard',
    UFC: 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard',
    // ── Soccer leagues ──
    'Soccer.EPL': 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
    'Soccer.UCL': 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard',
    'Soccer.LALIGA': 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard',
    'Soccer.BUNDESLIGA': 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard',
    'Soccer.SERIEA': 'https://site.api.espn.com/apis/site/v2/sports/soccer/ita.1/scoreboard',
    'Soccer.LIGUE1': 'https://site.api.espn.com/apis/site/v2/sports/soccer/fra.1/scoreboard',
    'Soccer.MLS': 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
    'Soccer.LIGAMX': 'https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/scoreboard',
    // ── Tennis tours ──
    'Tennis.ATP': 'https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard',
    'Tennis.WTA': 'https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard',
    // ── Golf ──
    'Golf.PGA': 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard',
};

// Soccer league metadata for the sub-nav selector
export interface SoccerLeague {
    key: SportKey;
    label: string;
    flag: string;      // emoji flag
    logo: string;      // league crest URL
}

export const SOCCER_LEAGUES: SoccerLeague[] = [
    { key: 'Soccer.EPL', label: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/23.png' },
    { key: 'Soccer.UCL', label: 'Champions League', flag: '🇪🇺', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/2.png' },
    { key: 'Soccer.LALIGA', label: 'La Liga', flag: '🇪🇸', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/15.png' },
    { key: 'Soccer.BUNDESLIGA', label: 'Bundesliga', flag: '🇩🇪', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/19.png' },
    { key: 'Soccer.SERIEA', label: 'Serie A', flag: '🇮🇹', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/12.png' },
    { key: 'Soccer.LIGUE1', label: 'Ligue 1', flag: '🇫🇷', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/9.png' },
    { key: 'Soccer.MLS', label: 'MLS', flag: '🇺🇸', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/775.png' },
    { key: 'Soccer.LIGAMX', label: 'Liga MX', flag: '🇲🇽', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/341.png' },
];

// Tennis tour metadata for the sub-nav selector
export interface TennisTour {
    key: SportKey;
    label: string;
    flag: string;
    description: string;
}

export const TENNIS_TOURS: TennisTour[] = [
    { key: 'Tennis.ATP', label: 'ATP Tour', flag: '🎾', description: "Men's" },
    { key: 'Tennis.WTA', label: 'WTA Tour', flag: '🎾', description: "Women's" },
];

export interface ESPNTeamInfo {
    id: string;
    displayName: string;
    abbreviation: string;
    logo: string;
    color: string;          // primary hex (no #)
    alternateColor: string;
    score: string;
    record: string;         // e.g. "42-14"
    homeAway: 'home' | 'away';
    winner: boolean;
    linescores: { period: number; value: number; displayValue: string }[];
}

export interface ESPNGameLeader {
    category: string;       // "Points", "Rebounds", "Assists"
    name: string;
    shortName: string;
    displayValue: string;   // "25"
    headshot: string;
    position: string;
    teamId: string;
}

export interface ESPNGame {
    id: string;
    sport: SportKey;
    name: string;           // "San Antonio Spurs at Detroit Pistons"
    shortName: string;      // "SA @ DET"
    date: string;           // ISO string
    status: 'pre' | 'in' | 'post';
    statusDetail: string;   // "Final" | "Q3 4:23" | "7:30 PM ET"
    statusName: string;     // "STATUS_SCHEDULED", "STATUS_IN_PROGRESS", "STATUS_FINAL"
    statusClock?: string;
    period?: number;
    venue: string;
    city: string;
    broadcast: string;
    homeTeam: ESPNTeamInfo;
    awayTeam: ESPNTeamInfo;
    leaders: ESPNGameLeader[];
    headline?: string;      // Game recap headline
}

// Internal raw ESPN API shapes (loose typed for JSON deserialization)
type RawObj = Record<string, unknown>;

// Parse a raw ESPN competition into our ESPNGame shape
const parseCompetition = (event: RawObj, sport: SportKey): ESPNGame | null => {
    try {
        const comp = (event.competitions as RawObj[])?.[0];
        if (!comp) return null;

        const competitors: ESPNTeamInfo[] = (comp.competitors as RawObj[]).map((c: RawObj) => {
            const team = c.team as RawObj;
            const records = c.records as RawObj[] | undefined;
            const linescores = c.linescores as RawObj[] | undefined;
            return {
                id: team.id as string,
                displayName: team.displayName as string,
                abbreviation: team.abbreviation as string,
                logo: (team.logo as string) ?? `https://a.espncdn.com/i/teamlogos/nba/500/${(team.abbreviation as string)?.toLowerCase()}.png`,
                color: (team.color as string) ?? '1a1a2e',
                alternateColor: (team.alternateColor as string) ?? 'ffffff',
                score: (c.score as string) ?? '0',
                record: (records?.[0]?.summary as string) ?? '',
                homeAway: c.homeAway as 'home' | 'away',
                winner: (c.winner as boolean) ?? false,
                linescores: (linescores ?? []).map((ls: RawObj) => ({
                    period: ls.period as number,
                    value: ls.value as number,
                    displayValue: ls.displayValue as string,
                })),
            };
        });

        const homeTeam = competitors.find(c => c.homeAway === 'home')!;
        const awayTeam = competitors.find(c => c.homeAway === 'away')!;
        if (!homeTeam || !awayTeam) return null;

        // Extract leaders
        const leaders: ESPNGameLeader[] = [];
        const leaderCategories = ['points', 'rebounds', 'assists', 'completions', 'rushingYards', 'receivingYards', 'saves'];
        for (const cat of leaderCategories) {
            const catData = (comp.competitors as RawObj[]).flatMap((c: RawObj) =>
                ((c.leaders as RawObj[]) ?? []).filter((l: RawObj) => l.name === cat).flatMap((l: RawObj) =>
                    ((l.leaders as RawObj[]) ?? []).map((pl: RawObj) => {
                        const athlete = pl.athlete as RawObj | undefined;
                        const pos = athlete?.position as RawObj | undefined;
                        const team = pl.team as RawObj | undefined;
                        return {
                            category: l.displayName as string,
                            name: (athlete?.fullName as string) ?? '',
                            shortName: (athlete?.shortName as string) ?? '',
                            displayValue: (pl.displayValue as string) ?? '',
                            headshot: (athlete?.headshot as string) ?? '',
                            position: (pos?.abbreviation as string) ?? '',
                            teamId: (team?.id as string) ?? '',
                        };
                    })
                )
            );
            leaders.push(...catData.slice(0, 1));
        }

        const statusType = (event.status as RawObj)?.type as RawObj | undefined;
        let status: 'pre' | 'in' | 'post' = 'pre';
        if (statusType?.state === 'in') status = 'in';
        else if (statusType?.state === 'post') status = 'post';

        const venue = comp.venue as RawObj | undefined;
        const venueAddress = venue?.address as RawObj | undefined;
        const broadcast = (comp.broadcast as string) || (event.broadcast as string) || '';
        const headlines = comp.headlines as RawObj[] | undefined;
        const headline = (headlines?.[0]?.shortLinkText as string) ?? (event.name as string);

        return {
            id: event.id as string,
            sport,
            name: event.name as string,
            shortName: event.shortName as string,
            date: event.date as string,
            status,
            statusDetail: (statusType?.detail as string) ?? (statusType?.description as string) ?? '',
            statusName: (statusType?.name as string) ?? 'STATUS_SCHEDULED',
            statusClock: (event.status as RawObj)?.displayClock as string | undefined,
            period: (event.status as RawObj)?.period as number | undefined,
            venue: (venue?.fullName as string) ?? '',
            city: (venueAddress?.city as string) ?? '',
            broadcast,
            homeTeam,
            awayTeam,
            leaders,
            headline,
        };
    } catch {
        return null;
    }
};

// Fetch scoreboard for a given sport
export const fetchESPNScoreboard = async (sport: SportKey): Promise<ESPNGame[]> => {
    const url = ESPN_SCOREBOARD_URLS[sport];
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`ESPN ${sport} scoreboard failed: ${res.status}`);
        const data = await res.json() as RawObj;

        const events: ESPNGame[] = ((data.events as RawObj[]) ?? [])
            .map((e: RawObj) => parseCompetition(e, sport))
            .filter((g): g is ESPNGame => g !== null);

        return events;
    } catch (err) {
        console.warn(`ESPN Scoreboard [${sport}] error:`, err);
        return [];
    }
};

// Fetch multiple sports in parallel
export const fetchMultiSportScoreboard = async (sports: SportKey[]): Promise<Record<SportKey, ESPNGame[]>> => {
    const results = await Promise.allSettled(sports.map(s => fetchESPNScoreboard(s)));
    const out = {} as Record<SportKey, ESPNGame[]>;
    sports.forEach((sport, i) => {
        const r = results[i];
        out[sport] = r.status === 'fulfilled' ? r.value : [];
    });
    return out;
};

// Map app sport names to ESPN sport keys
export const APP_SPORT_TO_ESPN: Record<string, SportKey | null> = {
    'NBA': 'NBA',
    'NFL': 'NFL',
    'MLB': 'MLB',
    'NHL': 'NHL',
    'NCAAB': 'CBB',
    'NCAAW': 'NCAAW',
    'WNBA': 'WNBA',
    // Soccer: default to EPL; LiveBoard overrides with sub-league selection
    'Soccer': 'Soccer.EPL',
    'Soccer.EPL': 'Soccer.EPL',
    'Soccer.UCL': 'Soccer.UCL',
    'Soccer.LALIGA': 'Soccer.LALIGA',
    'Soccer.BUNDESLIGA': 'Soccer.BUNDESLIGA',
    'Soccer.SERIEA': 'Soccer.SERIEA',
    'Soccer.LIGUE1': 'Soccer.LIGUE1',
    'Soccer.MLS': 'Soccer.MLS',
    'Soccer.LIGAMX': 'Soccer.LIGAMX',
    'UFC': 'UFC',
    // Tennis: default to ATP; LiveBoard overrides with sub-tour selection
    'Tennis': 'Tennis.ATP',
    'Tennis.ATP': 'Tennis.ATP',
    'Tennis.WTA': 'Tennis.WTA',
    // Golf: PGA only for now
    'Golf': 'Golf.PGA',
    'Golf.PGA': 'Golf.PGA',
    'Esports': null,
};

// Fetch scoreboard for a specific date (YYYY-MM-DD)
export const fetchESPNScoreboardByDate = async (sport: SportKey, dateStr: string): Promise<ESPNGame[]> => {
    const baseUrl = ESPN_SCOREBOARD_URLS[sport];
    // ESPN uses dates= param with format YYYYMMDD
    const espnDate = dateStr.replace(/-/g, '');
    const url = `${baseUrl}?dates=${espnDate}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json() as RawObj;
        let events: ESPNGame[] = ((data.events as RawObj[]) ?? [])
            .map((e: RawObj) => parseCompetition(e, sport))
            .filter((g): g is ESPNGame => g !== null);

        // Fallback: If no events found for today, fetch the most recent final games (for out-of-season sports)
        const todayStr = new Date().toISOString().split('T')[0];
        const isIntermittentSport = ['NFL', 'WNBA', 'UFC'].includes(sport);
        if (events.length === 0 && dateStr === todayStr && isIntermittentSport) {
            const fallbackRes = await fetch(baseUrl);
            if (fallbackRes.ok) {
                const fallbackData = await fallbackRes.json() as RawObj;
                events = ((fallbackData.events as RawObj[]) ?? [])
                    .map((e: RawObj) => parseCompetition(e, sport))
                    .filter((g): g is ESPNGame => g !== null)
                    // Hardcode status to 'post' as these are past games fallback
                    .map(g => ({ ...g, status: g.status === 'in' ? 'in' : 'post', statusDetail: g.statusDetail || 'Final' }));
            }
        }

        return events;
    } catch {
        return [];
    }
};

// For a given sport, fetch the next N days' game counts for calendar display
export const fetchGameCountsByDate = async (
    sport: SportKey,
    dates: string[]  // YYYY-MM-DD strings
): Promise<Record<string, number>> => {
    const results = await Promise.allSettled(
        dates.map(d => fetchESPNScoreboardByDate(sport, d))
    );
    const counts: Record<string, number> = {};
    dates.forEach((d, i) => {
        const r = results[i];
        counts[d] = r.status === 'fulfilled' ? r.value.length : 0;
    });
    return counts;
};

