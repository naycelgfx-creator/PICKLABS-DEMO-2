/**
 * mlbStatsService.ts
 *
 * Interfaces with the MLB Stats API (`https://statsapi.mlb.com/api/v1/`)
 * specifically for World Baseball Classic (WBC) data (sportId=51).
 */

export interface WBCTeam {
    id: number;
    name: string;
    abbreviation: string;
    logo: string;
    league: 'WBC';
    color?: string;
    alternateColor?: string;
    location?: string;
}

export interface WBCPlayer {
    id: number;
    displayName: string;
    position: string;
    jersey: string;
    headshot?: string;
    status?: string;
}

export interface WBCGame {
    id: number;
    homeTeam: { id: number; name: string; score?: number };
    awayTeam: { id: number; name: string; score?: number };
    status: string; // 'pre', 'in', 'post'
    date: string;
}

const WBC_SPORT_ID = 51;

/**
 * Fetch all WBC teams
 */
export async function getWBCTeams(): Promise<WBCTeam[]> {
    try {
        const url = `https://statsapi.mlb.com/api/v1/teams?sportId=${WBC_SPORT_ID}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.teams || []).map((team: any) => ({
            id: team.id,
            name: team.name,
            abbreviation: team.abbreviation || 'N/A',
            logo: `https://www.mlbstatic.com/team-logos/team-cap-on-light/${team.id}.svg`,
            league: 'WBC',
            color: '121a12',
            alternateColor: '0df20d',
            location: 'International'
        }));
    } catch (e) {
        console.error("Failed to fetch WBC teams:", e);
        return [];
    }
}

/**
 * Fetch the roster for a specific WBC team
 */
export async function getWBCRoster(teamId: number | string): Promise<WBCPlayer[]> {
    try {
        const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data.roster || []).map((item: any) => {
            const player = item.person;
            // Broadcast quality high-res headshot from MLB CDN
            const headshot = `https://img.mlbstatic.com/mlb-photos/image/upload/w_213,q_auto:best/v1/people/${player.id}/headshot/67/current`;

            return {
                id: player.id,
                displayName: player.fullName,
                position: item.position?.abbreviation || 'N/A',
                jersey: item.jerseyNumber || '',
                headshot: headshot,
                status: item.status?.description
            };
        });
    } catch (e) {
        console.error(`Failed to fetch WBC roster for team ${teamId}:`, e);
        return [];
    }
}

/**
 * Fetch WBC games for a specific date (YYYY-MM-DD or YYYYMMDD)
 */
export async function getWBCSchedule(dateStr: string): Promise<WBCGame[]> {
    try {
        // format date to YYYY-MM-DD if it's YYYYMMDD
        let formattedDate = dateStr;
        if (dateStr.length === 8 && !dateStr.includes('-')) {
            formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
        }

        const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=${WBC_SPORT_ID}&date=${formattedDate}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();

        const games: WBCGame[] = [];

        for (const dateObj of (data.dates || [])) {
            for (const game of (dateObj.games || [])) {

                let gameStatus = 'pre';
                if (game.status.statusCode === 'F' || game.status.statusCode === 'CO') {
                    gameStatus = 'post';
                } else if (game.status.abstractGameState === 'Live') {
                    gameStatus = 'in';
                }

                games.push({
                    id: game.gamePk,
                    date: game.gameDate,
                    status: gameStatus,
                    homeTeam: {
                        id: game.teams.home.team.id,
                        name: game.teams.home.team.name,
                        score: game.teams.home.score
                    },
                    awayTeam: {
                        id: game.teams.away.team.id,
                        name: game.teams.away.team.name,
                        score: game.teams.away.score
                    }
                });
            }
        }
        return games;

    } catch (e) {
        console.error("Failed to fetch WBC schedule:", e);
        return [];
    }
}

// ─── Regular MLB Stats API Integrations ──────────────────────────────────────

export const MLB_SPORT_ID = 1; // Major League Baseball

export interface MLBGame {
    gamePk: number;
    gameDate: string;
    status: {
        abstractGameState: string;
        codedGameState: string;
        detailedState: string;
        statusCode: string;
        startTimeTBD: boolean;
        abstractGameCode: string;
    };
    teams: {
        away: {
            leagueRecord: { wins: number; losses: number; pct: string };
            score?: number;
            team: { id: number; name: string; link: string };
            isWinner?: boolean;
            splitSquad: boolean;
            seriesNumber: number;
        };
        home: {
            leagueRecord: { wins: number; losses: number; pct: string };
            score?: number;
            team: { id: number; name: string; link: string };
            isWinner?: boolean;
            splitSquad: boolean;
            seriesNumber: number;
        };
    };
    venue: { id: number; name: string; link: string };
}

/**
 * Fetch MLB schedule (supports sportId, leagueId, season, date filters)
 */
export async function getMLBSchedule(season: number, leagueId?: number, dateStr?: string): Promise<MLBGame[]> {
    try {
        let url = `https://statsapi.mlb.com/api/v1/schedule?sportId=${MLB_SPORT_ID}&season=${season}`;
        if (leagueId) {
            url += `&leagueId=${leagueId}`;
        }
        if (dateStr) {
            // format date to YYYY-MM-DD if it's YYYYMMDD
            let formattedDate = dateStr;
            if (dateStr.length === 8 && !dateStr.includes('-')) {
                formattedDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
            }
            url += `&date=${formattedDate}`;
        }

        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();

        const games: MLBGame[] = [];
        for (const dateObj of (data.dates || [])) {
            for (const game of (dateObj.games || [])) {
                games.push(game);
            }
        }
        return games;
    } catch (e) {
        console.error("Failed to fetch MLB schedule:", e);
        return [];
    }
}

/**
 * Fetch MLB Standings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMLBStandings(season: number, leagueId?: number): Promise<any> {
    try {
        // usually 103 for AL, 104 for NL. Spring Training AL=114? Default to common MLB leagues or provided leagueId
        const leagues = leagueId ? leagueId : '103,104';
        const url = `https://statsapi.mlb.com/api/v1/standings?leagueId=${leagues}&season=${season}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch MLB standings:", e);
        return null;
    }
}

/**
 * Fetch completely detailed live feed for a specific MLB gamed
 * Includes play-by-play, boxscore, linescore, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMLBLiveFeed(gamePk: string | number): Promise<any> {
    try {
        const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
        const res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error(`Failed to fetch MLB live feed for gamePk ${gamePk}:`, e);
        return null;
    }
}
