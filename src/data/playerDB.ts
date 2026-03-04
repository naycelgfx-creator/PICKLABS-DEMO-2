/**
 * playerDB.ts — ESPN Player Database
 *
 * 7,500+ players across NBA, NFL, MLB, NHL, NCAAW, NCAAB, CFB.
 * Built by PlayerDatabaseBuilder using ESPN's roster API:
 *   GET /apis/site/v2/sports/{sport}/{league}/teams/{team_id}/roster
 *
 * ESPN roster format handled:
 *   - NFL/NBA: athletes[].items[]  (position-grouped)
 *   - NCAA:    athletes[]          (flat list)
 *
 * Player headshot URL pattern (combiner CDN):
 *   https://a.espncdn.com/combiner/i?img=/i/headshots/{league}/players/full/{id}.png&w=350&h=254
 */

import RAW_DB from './player_db.json';

export interface Player {
    id: string;
    name: string;
    position: string;
    jersey: string;
    sport: string;
    league: string;
    teamId: string;
    teamName: string;
    headshot: string;
}

// Type-cast the JSON import
const ALL_PLAYERS: Player[] = RAW_DB as Player[];

// ── Indexes for O(1) lookups ─────────────────────────────────────────────────
const byId = new Map<string, Player>(ALL_PLAYERS.map(p => [p.id, p]));
const byLeague = new Map<string, Player[]>();
const byTeam = new Map<string, Player[]>();

for (const p of ALL_PLAYERS) {
    // By league
    if (!byLeague.has(p.league)) byLeague.set(p.league, []);
    byLeague.get(p.league)!.push(p);

    // By league+teamId composite key
    const teamKey = `${p.league}:${p.teamId}`;
    if (!byTeam.has(teamKey)) byTeam.set(teamKey, []);
    byTeam.get(teamKey)!.push(p);
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Total count of players in the database. */
export const playerCount = ALL_PLAYERS.length;

/** Get a player by their ESPN athlete ID. */
export function getPlayerById(id: string): Player | undefined {
    return byId.get(id);
}

/** Get all players in a league (e.g. 'nba', 'nfl', 'womens-college-basketball'). */
export function getPlayersByLeague(league: string): Player[] {
    return byLeague.get(league) ?? [];
}

/** Get all players on a specific team. */
export function getPlayersByTeam(league: string, teamId: string | number): Player[] {
    return byTeam.get(`${league}:${String(teamId)}`) ?? [];
}

/**
 * Search players by name (case-insensitive partial match).
 * Optionally filter by league.
 *
 * @param query  - Partial name string
 * @param league - Optional ESPN league key
 * @param limit  - Max results (default 20)
 */
export function searchPlayers(query: string, league?: string, limit = 20): Player[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const pool = league ? (byLeague.get(league) ?? []) : ALL_PLAYERS;
    const results: Player[] = [];
    for (const p of pool) {
        if (p.name.toLowerCase().includes(q)) {
            results.push(p);
            if (results.length >= limit) break;
        }
    }
    return results;
}

/**
 * Get the ESPN combiner headshot URL for any player ID + league.
 * Mirrors Python AthleteImageTool.get_player_headshot()
 */
export function getHeadshotUrl(
    playerId: string | number,
    league: string,
    size: 'full' | 'medium' = 'full'
): string {
    const dims = size === 'medium' ? 'w=110&h=80' : 'w=350&h=254';
    return `https://a.espncdn.com/combiner/i?img=/i/headshots/${league}/players/full/${playerId}.png&${dims}`;
}

/** All supported leagues in the database. */
export const SUPPORTED_LEAGUES = [
    'nba', 'nfl', 'mlb', 'nhl',
    'womens-college-basketball',
    'mens-college-basketball',
    'college-football',
] as const;

export type SupportedLeague = typeof SUPPORTED_LEAGUES[number];
