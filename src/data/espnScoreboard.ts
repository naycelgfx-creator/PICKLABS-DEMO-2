// ESPN Scoreboard API Service
// Fetches real live/recent game data for 8 sports

export type SportKey =
    | 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'CFB' | 'CBB' | 'NCAAB' | 'UFC'
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
    | 'Golf.PGA' | 'Golf.LIV' | 'Golf.LPGA'
    | 'Racing.NASCAR.CUP' | 'Racing.NASCAR.XFINITY' | 'Racing.NASCAR.TRUCK'
    | 'Baseball.WBC'
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
    NCAAB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard',
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
    'Golf.LIV': 'https://site.api.espn.com/apis/site/v2/sports/golf/liv/scoreboard',
    'Golf.LPGA': 'https://site.api.espn.com/apis/site/v2/sports/golf/lpga/scoreboard',
    // ── Racing ──
    'Racing.NASCAR.CUP': 'https://site.api.espn.com/apis/site/v2/sports/racing/nascar/cup/scoreboard',
    'Racing.NASCAR.XFINITY': 'https://site.api.espn.com/apis/site/v2/sports/racing/nascar/xfinity/scoreboard',
    'Racing.NASCAR.TRUCK': 'https://site.api.espn.com/apis/site/v2/sports/racing/nascar/truck/scoreboard',
    // ── WBC ──
    'Baseball.WBC': 'https://site.api.espn.com/apis/site/v2/sports/baseball/wbc/scoreboard',
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

export interface NASCARSeries {
    key: SportKey;
    label: string;
    flag: string;
    description: string;
}

export const NASCAR_SERIES: NASCARSeries[] = [
    { key: 'Racing.NASCAR.CUP', label: 'Cup Series', flag: '🏁', description: 'NASCAR' },
    { key: 'Racing.NASCAR.XFINITY', label: 'Xfinity Series', flag: '🏎️', description: 'NASCAR' },
    { key: 'Racing.NASCAR.TRUCK', label: 'Truck Series', flag: '🛻', description: 'NASCAR' },
];

export interface GolfLeague {
    key: SportKey;
    label: string;
    flag: string;
    description: string;
}

export const GOLF_LEAGUES: GolfLeague[] = [
    { key: 'Golf.PGA', label: 'PGA Tour', flag: '⛳', description: "Men's" },
    { key: 'Golf.LIV', label: 'LIV Golf', flag: '🏌️', description: "Men's" },
    { key: 'Golf.LPGA', label: 'LPGA Tour', flag: '🏌️‍♀️', description: "Women's" },
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
            const entity = (c.team as RawObj) || (c.athlete as RawObj) || {};
            const records = c.records as RawObj[] | undefined;
            const linescores = c.linescores as RawObj[] | undefined;

            // For MMA/Tennis, athletes might have a 'flag' object instead of a direct 'logo'
            const flagObj = entity.flag as RawObj | undefined;
            let logoUrl = (entity.logo as string) || (flagObj?.href as string);
            if (!logoUrl) {
                const fallbackAbbr = ((entity.abbreviation as string) || (entity.shortName as string) || 'unk').toLowerCase();
                logoUrl = `https://a.espncdn.com/i/teamlogos/nba/500/${fallbackAbbr}.png`;
            }

            return {
                id: (entity.id as string) || String(Date.now()),
                displayName: (entity.displayName as string) || (entity.fullName as string) || 'Unknown',
                abbreviation: (entity.abbreviation as string) || (entity.shortName as string) || 'UNK',
                logo: logoUrl,
                color: (entity.color as string) ?? '1a1a2e',
                alternateColor: (entity.alternateColor as string) ?? 'ffffff',
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
        const leaderCategories = [
            // Basketball
            'points', 'rebounds', 'assists', 'pointsPerGame', 'reboundsPerGame', 'assistsPerGame',
            // Football
            'passingYards', 'rushingYards', 'receivingYards', 'completions',
            // Hockey / Soccer
            'goals', 'saves', 'goalsAgainstAverage', 'points',
            // Baseball
            'homeRuns', 'runsBattedIn', 'wins', 'strikeouts', 'battingAverage'
        ];
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
        let broadcast = '';
        if (typeof comp.broadcast === 'string') broadcast = comp.broadcast;
        else if (typeof event.broadcast === 'string') broadcast = event.broadcast;
        else {
            const broadcasts = (comp.broadcasts as RawObj[]) || (event.broadcasts as RawObj[]) || [];
            const broadcastNames = broadcasts.flatMap(b => (b.names as string[]) || (typeof b.name === 'string' ? [b.name] : []));
            if (broadcastNames.length > 0) broadcast = Array.from(new Set(broadcastNames)).join(', ');
        }
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
    'CFB': 'CFB',
    'NCAAM': 'CBB',      // College Basketball (Men's)
    'NCAAB': 'NCAAB',    // College Baseball
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
    // Golf
    'Golf': 'Golf.PGA',
    'Golf.PGA': 'Golf.PGA',
    'Golf.LIV': 'Golf.LIV',
    'Golf.LPGA': 'Golf.LPGA',
    // Racing
    'NASCAR': 'Racing.NASCAR.CUP',
    'Racing.NASCAR.CUP': 'Racing.NASCAR.CUP',
    'Racing.NASCAR.XFINITY': 'Racing.NASCAR.XFINITY',
    'Racing.NASCAR.TRUCK': 'Racing.NASCAR.TRUCK',
    // WBC
    'WBC': 'Baseball.WBC',
    'Baseball.WBC': 'Baseball.WBC',
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
        const isIntermittentSport = ['NFL', 'WNBA', 'UFC', 'CFB'].includes(sport);
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


export interface ESPNRosterPlayer {
    id: string;
    displayName: string;
    headshot?: string;
    position: string;
    jersey: string;
    status?: string;
}

export async function fetchESPNRoster(sport: string, teamId: string): Promise<ESPNRosterPlayer[]> {
    const ESPN_LEAGUE: Record<string, string> = {
        NBA: 'basketball/nba',
        NFL: 'football/nfl',
        MLB: 'baseball/mlb',
        NHL: 'hockey/nhl',
        // College Basketball (men)
        CBB: 'basketball/mens-college-basketball',
        NCAAM: 'basketball/mens-college-basketball',
        // College Basketball (women)
        NCAAW: 'basketball/womens-college-basketball',
        NCAAAW: 'basketball/womens-college-basketball',
        // College Baseball
        NCAAB: 'baseball/college-baseball',
        // College Football
        CFB: 'football/college-football',
        NCAAF: 'football/college-football',
        // WNBA
        WNBA: 'basketball/wnba',
        // Soccer leagues — keys match SportKey enum
        'Soccer.EPL': 'soccer/eng.1',
        'Soccer.MLS': 'soccer/usa.1',
        'Soccer.LaLiga': 'soccer/esp.1',
        'Soccer.Bundesliga': 'soccer/ger.1',
        'Soccer.SerieA': 'soccer/ita.1',
        'Soccer.Ligue1': 'soccer/fra.1',
        'Soccer.UCL': 'soccer/uefa.champions',
        'Soccer.LIGAMX': 'soccer/mex.1',
        // WBC
        WBC: 'baseball/wbc',
        'Baseball.WBC': 'baseball/wbc',
        // Plain fallbacks
        Soccer: 'soccer/eng.1',
    };
    const league = ESPN_LEAGUE[sport];
    if (!league) return [];
    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${league}/teams/${teamId}/roster`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        const athletes: ESPNRosterPlayer[] = [];
        const groups = json.athletes || [];
        for (const group of groups) {
            // Handle both flat array (NBA) and nested items array (MLB/NFL/NHL)
            const playerList = group.items ? group.items : [group];
            for (const item of playerList) {
                if (!item.id) continue;
                // ESPN CDN headshots use sport-level dirs like 'basketball', 'soccer', 'football'
                // NOT the league sub-path like 'eng.1' or 'nba'
                const headshotSportDir = league ? league.split('/')[0] : sport.toLowerCase();
                const photoUrl = item.headshot?.href || `https://a.espncdn.com/i/headshots/${headshotSportDir}/players/full/${item.id}.png`;

                athletes.push({
                    id: item.id,
                    displayName: item.displayName || item.fullName || '',
                    headshot: photoUrl,
                    position: item.position?.abbreviation || '',
                    jersey: item.jersey || '',
                    status: item.status?.type?.name,
                });
            }
        }
        return athletes.slice(0, 20); // top 20 per team
    } catch {
        return [];
    }
}

// ─── Mass Fetch All Athletes ──────────────────────────────────────────────────

export interface ESPNAthleteListItem {
    id: string;
    uid: string;
    guid: string;
    alternateIds: Record<string, string>;
    firstName: string;
    lastName: string;
    fullName: string;
    displayName: string;
    shortName: string;
    weight: number;
    displayWeight: string;
    height: number;
    displayHeight: string;
    age: number;
    dateOfBirth: string;
    links: { rel: string[]; href: string; text: string }[];
    birthPlace: { city: string; state: string; country: string };
    college: { id: string; name: string };
    slug: string;
    headshot: { href: string; alt: string };
    jersey: string;
    position: { id: string; name: string; displayName: string; abbreviation: string };
    team: { id: string };
    status: { id: string; name: string; type: string; abbreviation: string };
    active: boolean;
    // Enriched client-side — not from ESPN directly
    teamLogo?: string;
    teamAbbr?: string;
    teamColor?: string;    // hex, no '#'
    teamAltColor?: string; // hex, no '#'
}

export const fetchAllAthletes = async (sport: string, league: string, page = 1): Promise<{ athletes: ESPNAthleteListItem[], count: number, pageIndex: number, pageCount: number }> => {
    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/athletes?page=${page}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch athletes for ${sport}/${league}`);
        const data = await res.json();

        // ESPN returns { sports: [ { leagues: [ { athletes: [ {...} ] } ] } ] }
        const athletesRaw = data.sports?.[0]?.leagues?.[0]?.athletes || [];

        // Extract pagination info
        const pagination = data.sports?.[0]?.leagues?.[0]?.pagination || { count: athletesRaw.length, pageIndex: 1, limit: 50, pages: 1 };

        return {
            athletes: athletesRaw as ESPNAthleteListItem[],
            count: pagination.count || athletesRaw.length,
            pageIndex: pagination.pageIndex || 1,
            pageCount: pagination.pages || 1
        };
    } catch (err) {
        console.error(`Error fetching athletes for ${sport}/${league}:`, err);
        return { athletes: [], count: 0, pageIndex: 1, pageCount: 1 };
    }
};

export const fetchTeamsWithRosters = async (sport: string, league: string): Promise<ESPNAthleteListItem[]> => {
    try {
        const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams?limit=200`;
        const res = await fetch(teamsUrl);
        if (!res.ok) throw new Error(`Failed to fetch teams for ${sport}/${league}`);
        const data = await res.json();

        const teams = data.sports?.[0]?.leagues?.[0]?.teams || [];

        // Build a team logo + abbr + color lookup map from the teams response
        const teamMeta: Record<string, { logo: string; abbr: string; color: string; altColor: string }> = {};
        for (const t of teams) {
            const raw = t.team || t;
            const id = (raw as { id?: string }).id;
            if (!id) continue;
            const logos: { href?: string }[] = (raw as { logos?: { href?: string }[] }).logos || [];
            const logo = logos[0]?.href || '';
            const abbr = (raw as { abbreviation?: string }).abbreviation || '';
            const color = (raw as { color?: string }).color || '';
            const altColor = (raw as { alternateColor?: string }).alternateColor || '';
            teamMeta[id] = { logo, abbr, color, altColor };
        }

        const rosterPromises = teams.map(async (t: { team?: { id: string } }) => {
            try {
                const teamId = t.team?.id;
                if (!teamId) return [];
                const rRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/roster`);
                if (!rRes.ok) return [];
                const rData = await rRes.json();

                const rostersRaw = rData.athletes || [];
                let athletes: ESPNAthleteListItem[];
                // The ESPN `/teams/{id}/roster` endpoint can return nested groups like: `{ athletes: [ { items: [ ...athletes... ] } ] }`
                if (rostersRaw.length > 0 && rostersRaw[0].items) {
                    const flatAthletes: ESPNAthleteListItem[] = [];
                    rostersRaw.forEach((group: { items?: ESPNAthleteListItem[] }) => {
                        if (group.items && Array.isArray(group.items)) {
                            flatAthletes.push(...group.items);
                        }
                    });
                    athletes = flatAthletes;
                } else {
                    athletes = rostersRaw as ESPNAthleteListItem[];
                }

                // Enrich each athlete with the team logo, abbr, and colors
                const meta = teamMeta[teamId];
                if (meta) {
                    athletes = athletes.map(a => ({
                        ...a,
                        teamLogo: meta.logo,
                        teamAbbr: meta.abbr,
                        teamColor: meta.color,
                        teamAltColor: meta.altColor,
                    }));
                }
                return athletes;
            } catch {
                return [];
            }
        });

        const rostersNested = await Promise.all(rosterPromises);
        return rostersNested.flat();
    } catch (err) {
        console.error(`Error fetching rosters for ${sport}/${league}:`, err);
        return [];
    }
};

