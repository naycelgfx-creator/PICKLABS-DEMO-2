import { ESPNRosterAthlete } from './espnService';

// Master API Key for API-Sports
const API_SPORTS_KEY = "ce26ec6e742cfde529f6218e2a4c3ff6";

const HEADERS = {
    'x-apisports-key': API_SPORTS_KEY
};

// Map our internal app sport codes to API-Sports domains
const API_SPORTS_DOMAINS: Record<string, string> = {
    'NFL': 'https://v1.american-football.api-sports.io',
    'NBA': 'https://v2.nba.api-sports.io',
    'UFC': 'https://v1.mma.api-sports.io',
    'NHL': 'https://v1.hockey.api-sports.io',
    'NCAAB': 'https://v1.basketball.api-sports.io',
    'NCAAW': 'https://v1.basketball.api-sports.io',
    'MLB': 'https://v1.baseball.api-sports.io',
    'Soccer': 'https://v3.football.api-sports.io',
    'CFB': 'https://v1.american-football.api-sports.io', // Assuming CFB is under american-football
};

export const SPORTS_WITH_API_SPORTS = Object.keys(API_SPORTS_DOMAINS);

/**
 * The Universal Fetcher for API-Sports.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchApiSports(sport: string, endpoint: string, params: Record<string, string> = {}): Promise<any[]> {
    if (!API_SPORTS_DOMAINS[sport]) {
        console.error(`❌ Error: '${sport}' is not strictly mapped for API-Sports.`);
        return [];
    }

    const domain = API_SPORTS_DOMAINS[sport];
    const url = new URL(`${domain}${endpoint}`);

    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
    });

    try {
        const response = await fetch(url.toString(), { headers: HEADERS });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // API-Sports typically places results inside the 'response' array
        return data.response || [];
    } catch (error) {
        console.error(`❌ API Error for ${sport}:`, error);
        return [];
    }
}

/**
 * Search API-Sports for a team by name to get its internal API-Sports ID.
 */
async function getApiSportsTeamId(sport: string, teamName: string): Promise<string | null> {
    const rawData = await fetchApiSports(sport, '/teams', { search: teamName });
    if (rawData && rawData.length > 0) {
        // Typically the team object is wrapped in { team: {...}, venue: {...} } or just { id: ... }
        const teamObj = rawData[0].team || rawData[0];
        return String(teamObj.id);
    }
    return null;
}

/**
 * Fetch team rosters dynamically across sports from API-Sports.
 */
export async function getApiSportsRoster(sport: string, teamName: string, season: string = "2023"): Promise<ESPNRosterAthlete[]> {
    console.log(`🚀 Fetching ${sport} Roster for Team ${teamName} via API-Sports...`);

    // API-Sports uses different IDs than ESPN, so we search by name first. If it fails, fallback to passing the string in case it's actually an ID
    const teamId = await getApiSportsTeamId(sport, teamName) || teamName;

    const rawData = await fetchApiSports(sport, '/players', { team: teamId, season });

    return rawData.map((item: any) => {
        const playerInfo = item.player || item;

        // Standardize name formatting mapping differing field names
        const rawName = playerInfo.name || `${playerInfo.firstname || ''} ${playerInfo.lastname || ''}`.trim() || 'Unknown Player';
        const parts = rawName.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        // Handle variations in position mapping
        let positionName = 'Unknown';
        let positionAbbr = 'UNK';

        if (playerInfo.position) {
            if (typeof playerInfo.position === 'string') {
                positionName = playerInfo.position;
                positionAbbr = playerInfo.position;
            } else if (typeof playerInfo.position === 'object') {
                positionName = playerInfo.position.name || 'Unknown';
                positionAbbr = playerInfo.position.abbreviation || positionName;
            }
        }

        return {
            id: String(playerInfo.id || Math.random()),
            fullName: rawName,
            displayName: rawName,
            shortName: rawName,
            firstName,
            lastName,
            position: {
                displayName: positionName,
                abbreviation: positionAbbr
            },
            jersey: playerInfo.number ? String(playerInfo.number) : undefined,
            headshot: playerInfo.photo || 'https://via.placeholder.com/150',
            photoUrl: playerInfo.photo || 'https://via.placeholder.com/150',
            status: { type: 'active' },
            salaryFormatted: undefined,
            collegeName: 'N/A'
        } as unknown as ESPNRosterAthlete;
    });
}

/**
 * Fetch MMA Fighters from API-Sports.
 */
export async function getApiSportsMMAFighters(): Promise<ESPNRosterAthlete[]> {
    console.log(`🥊 Fetching MMA Fighters via API-Sports...`);

    const rawData = await fetchApiSports('UFC', '/fighters');

    return rawData.map((fighter: any) => {
        const rawName = fighter.name || `${fighter.firstname || ''} ${fighter.lastname || ''}`.trim() || 'Unknown Fighter';
        const parts = rawName.split(' ');

        return {
            id: String(fighter.id || Math.random()),
            fullName: rawName,
            displayName: rawName,
            shortName: rawName,
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || '',
            position: {
                displayName: fighter.weight_class || 'Fighter',
                abbreviation: fighter.weight_class || 'Fighter'
            },
            headshot: fighter.photo || 'https://via.placeholder.com/150',
            photoUrl: fighter.photo || 'https://via.placeholder.com/150',
            status: { type: 'active' },
            salaryFormatted: undefined,
            collegeName: 'N/A'
        } as unknown as ESPNRosterAthlete;
    });
}
