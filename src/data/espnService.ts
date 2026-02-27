// ESPN Athletes API Service — supports NBA, NFL, MLB, NHL
// Uses site.api.espn.com (public CORS-friendly API) for roster data
// Falls back to headshot CDN for player photos

export interface ESPNAthlete {
    id: string;
    fullName: string;
    shortName: string;
    firstName: string;
    lastName: string;
    jersey?: string;
    age?: number;
    displayHeight?: string;
    displayWeight?: string;
    position?: {
        abbreviation: string;
        displayName: string;
    };
    headshot?: {
        href: string;
        alt: string;
    };
    college?: string;
    salary?: number;
    active?: boolean;
    experience?: { years: number };
    team?: string;
}

export interface ESPNRosterAthlete extends ESPNAthlete {
    photoUrl: string;
    salaryFormatted: string;
    collegeName: string;
}

// ─── Sport routing config ─────────────────────────────────────────────────────
// site.api.espn.com is publicly accessible with CORS headers

const ESPN_SITE_ROSTER: Record<string, string> = {
    NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/{id}/roster',
    NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{id}/roster',
    MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/{id}/roster',
    NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams/{id}/roster',
};

const ESPN_HEADSHOT_SPORT: Record<string, string> = {
    NBA: 'nba',
    NFL: 'nfl',
    MLB: 'mlb',
    NHL: 'nhl',
};

// ─── Team ID maps ─────────────────────────────────────────────────────────────

export const NBA_TEAM_IDS: Record<string, number> = {
    'Hawks': 1, 'Celtics': 2, 'Nets': 17, 'Hornets': 30, 'Bulls': 4,
    'Cavaliers': 5, 'Mavericks': 6, 'Nuggets': 7, 'Pistons': 8, 'Warriors': 9,
    'Rockets': 10, 'Pacers': 11, 'Clippers': 12, 'Lakers': 13, 'Heat': 14,
    'Bucks': 15, 'Timberwolves': 16, 'Pelicans': 3, 'Knicks': 18, 'Thunder': 25,
    'Magic': 19, '76ers': 20, 'Suns': 21, 'Trail Blazers': 22, 'Kings': 23,
    'Spurs': 24, 'Raptors': 28, 'Jazz': 26, 'Wizards': 27, 'Grizzlies': 29
};

export const NFL_TEAM_IDS: Record<string, number> = {
    'Bills': 2, 'Dolphins': 15, 'Patriots': 17, 'Jets': 20,
    'Ravens': 33, 'Bengals': 4, 'Browns': 5, 'Steelers': 23,
    'Texans': 34, 'Colts': 11, 'Jaguars': 30, 'Titans': 10,
    'Broncos': 7, 'Chiefs': 12, 'Raiders': 13, 'Chargers': 24,
    'Cowboys': 6, 'Giants': 19, 'Eagles': 21, 'Commanders': 28,
    'Bears': 3, 'Lions': 8, 'Packers': 9, 'Vikings': 16,
    'Falcons': 1, 'Panthers': 29, 'Saints': 18, 'Buccaneers': 27,
    'Cardinals': 22, 'Rams': 14, '49ers': 25, 'Seahawks': 26
};

export const MLB_TEAM_IDS: Record<string, number> = {
    'Yankees': 10, 'Red Sox': 2, 'Blue Jays': 14, 'Rays': 30, 'Orioles': 1,
    'White Sox': 4, 'Guardians': 5, 'Tigers': 6, 'Royals': 7, 'Twins': 9,
    'Astros': 18, 'Angels': 3, 'Athletics': 11, 'Mariners': 12, 'Rangers': 13,
    'Braves': 15, 'Marlins': 28, 'Mets': 21, 'Phillies': 22, 'Nationals': 20,
    'Cubs': 16, 'Reds': 17, 'Brewers': 8, 'Pirates': 23, 'Cardinals': 24,
    'Diamondbacks': 29, 'Rockies': 27, 'Dodgers': 19, 'Padres': 25, 'Giants': 26
};

export const NHL_TEAM_IDS: Record<string, number> = {
    'Bruins': 1, 'Sabres': 2, 'Red Wings': 3, 'Panthers': 13, 'Canadiens': 8,
    'Senators': 9, 'Lightning': 14, 'Maple Leafs': 10, 'Hurricanes': 12,
    'Blackhawks': 16, 'Avalanche': 17, 'Stars': 25, 'Wild': 30, 'Predators': 18,
    'Blues': 19, 'Jets': 52, 'Ducks': 24, 'Flames': 20, 'Oilers': 22,
    'Kings': 26, 'Sharks': 28, 'Kraken': 55, 'Canucks': 23, 'Golden Knights': 54,
    'Capitals': 15, 'Blue Jackets': 29, 'Devils': 1, 'Islanders': 6, 'Rangers': 7
};

const SPORT_TEAM_IDS: Record<string, Record<string, number>> = {
    'NBA': NBA_TEAM_IDS,
    'NFL': NFL_TEAM_IDS,
    'MLB': MLB_TEAM_IDS,
    'NHL': NHL_TEAM_IDS,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const formatSalary = (salary?: number): string => {
    if (!salary) return 'N/A';
    if (salary >= 1_000_000) return `$${(salary / 1_000_000).toFixed(1)}M`;
    if (salary >= 1_000) return `$${(salary / 1_000).toFixed(0)}K`;
    return `$${salary}`;
};

// ─── Parse athlete from site.api ESPN roster response ────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseAthleteFromRoster = (athlete: Record<string, any>, sport: string): ESPNRosterAthlete => {
    const id = String(athlete.id ?? '');
    const headshotSport = ESPN_HEADSHOT_SPORT[sport] ?? sport.toLowerCase();
    const photoUrl = athlete.headshot?.href
        ?? `https://a.espncdn.com/i/headshots/${headshotSport}/players/full/${id}.png`;
    const pos = athlete.position as { abbreviation?: string; displayName?: string } | undefined;

    return {
        id,
        fullName: String(athlete.fullName ?? athlete.displayName ?? ''),
        shortName: String(athlete.shortName ?? athlete.fullName ?? ''),
        firstName: String(athlete.firstName ?? ''),
        lastName: String(athlete.lastName ?? ''),
        jersey: athlete.jersey as string | undefined,
        age: athlete.age as number | undefined,
        displayHeight: athlete.displayHeight as string | undefined,
        displayWeight: athlete.displayWeight as string | undefined,
        position: pos ? { abbreviation: pos.abbreviation ?? '', displayName: pos.displayName ?? '' } : undefined,
        headshot: athlete.headshot ? { href: athlete.headshot.href, alt: athlete.headshot.alt ?? '' } : undefined,
        salary: undefined, // salary not available in site.api roster
        active: athlete.active !== false,
        experience: athlete.experience ? { years: Number(athlete.experience.years ?? 0) } : undefined,
        photoUrl,
        salaryFormatted: 'N/A',
        collegeName: athlete.college?.name ?? 'N/A',
    };
};

// ─── Resolve team ID from team name ──────────────────────────────────────────
const resolveTeamId = (teamName: string, sport: string): number | null => {
    const teamIds = SPORT_TEAM_IDS[sport];
    if (!teamIds) return null;

    // Exact match
    if (teamIds[teamName]) return teamIds[teamName];

    // Case-insensitive partial match
    const lower = teamName.toLowerCase();
    const key = Object.keys(teamIds).find(k =>
        lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower.split(' ').pop() ?? '')
    );
    return key ? teamIds[key] : null;
};

// ─── PRIMARY: site.api ESPN roster (CORS-friendly) ────────────────────────────
const fetchRosterViaSiteAPI = async (teamId: number, sport: string): Promise<ESPNRosterAthlete[]> => {
    const urlTemplate = ESPN_SITE_ROSTER[sport];
    if (!urlTemplate) return [];

    const url = urlTemplate.replace('{id}', String(teamId));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ESPN site API ${res.status}`);
    const data = await res.json();

    // site.api returns { athletes: [...] } where each entry has { position, items: [...athletes] }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allAthletes: Record<string, any>[] = [];

    if (Array.isArray(data.athletes)) {
        // Format: [{ position: "...", items: [athlete, ...] }]
        for (const group of data.athletes) {
            if (Array.isArray(group.items)) {
                for (const athlete of group.items) {
                    if (athlete.id) allAthletes.push(athlete);
                }
            } else if (group.id) {
                // Direct athlete object
                allAthletes.push(group);
            }
        }
    }

    return allAthletes.map(a => parseAthleteFromRoster(a, sport));
};

// ─── Generic multi-sport roster fetch ────────────────────────────────────────

export const fetchESPNRosterBySport = async (teamName: string, sport: string): Promise<ESPNRosterAthlete[]> => {
    const teamId = resolveTeamId(teamName, sport);
    if (!teamId) {
        console.warn(`No team ID found for "${teamName}" in ${sport}`);
        return [];
    }

    try {
        const players = await fetchRosterViaSiteAPI(teamId, sport);
        if (players.length > 0) return players;
        throw new Error('Empty roster from site API');
    } catch (err) {
        console.warn(`ESPN ${sport} roster fetch failed for ${teamName}:`, err);
        return [];
    }
};

// Backward-compat: used by LiveRoster component (NBA only)
export const fetchESPNTeamRoster = async (teamName: string): Promise<ESPNRosterAthlete[]> => {
    return fetchESPNRosterBySport(teamName, 'NBA');
};

// ─── All active NBA athletes via teams loop ───────────────────────────────────
// (Used by discovery/search — fetches top teams)
export const fetchAllNBAAthetes = async (_limit = 100): Promise<ESPNRosterAthlete[]> => {
    // Fetch from first 5 NBA teams as a representative sample
    const sampleTeamIds = [1, 2, 13, 14, 15]; // Hawks, Celtics, Lakers, Heat, Bucks
    try {
        const results = await Promise.allSettled(
            sampleTeamIds.map(id => fetchRosterViaSiteAPI(id, 'NBA'))
        );
        return results
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => (r as PromiseFulfilledResult<ESPNRosterAthlete[]>).value)
            .slice(0, _limit);
    } catch (err) {
        console.error('ESPN athletes fetch failed:', err);
        return [];
    }
};
