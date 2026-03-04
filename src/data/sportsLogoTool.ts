/**
 * SportsLogoTool — TypeScript port of the Python ESPN CDN logo helper.
 *
 * Mirrors Python AthleteImageTool:
 *   logos.getPlayerHeadshot('basketball', 'nba', 1966)               → LeBron headshot
 *   logos.getPlayerHeadshot('basketball', 'womens-college-basketball', 4433475) → NCAAW player
 *   logos.get_team_logo('basketball', 'nba', 'lal')  → Lakers logo URL
 *   logos.get_network_logo('espn')                    → ESPN network logo URL
 *
 * ESPN Combiner URL pattern (the correct production pattern):
 *   https://a.espncdn.com/combiner/i?img=/i/headshots/{league}/players/full/{id}.png&w=350&h=254
 */

const TEAM_BASE = 'https://a.espncdn.com/i/teamlogos';
const NETWORK_BASE = 'https://a.espncdn.com/i/networklogos';
// Using combiner endpoint — handles scaling, fallbacks, and CORS correctly
const HEADSHOT_COMBINER = 'https://a.espncdn.com/combiner/i?img=/i/headshots';

// ── Convenience maps ───────────────────────────────────────────────────────
// Maps our app's sport keys → [espn_sport_segment, espn_league_segment]
// so callers don't have to remember the ESPN path structure.

export const SPORT_LEAGUE_PATHS: Record<string, [string, string]> = {
    // Basketball
    NBA: ['basketball', 'nba'],
    WNBA: ['basketball', 'wnba'],
    NCAAB: ['basketball', 'mens-college-basketball'],
    NCAAW: ['basketball', 'womens-college-basketball'],
    // Football
    NFL: ['football', 'nfl'],
    CFB: ['football', 'college-football'],
    // Baseball
    MLB: ['baseball', 'mlb'],
    // Hockey
    NHL: ['hockey', 'nhl'],
    // Soccer
    Soccer: ['soccer', 'eng.1'],   // defaults to EPL; override league as needed
    // Racing
    NASCAR: ['racing', 'nascar'],
    // Combat sports (no standard ESPN team logos — use headshots)
    UFC: ['mma', 'ufc'],
    Boxing: ['boxing', 'boxing'],
};

// ── Team abbreviations by sport (ESPN canonical) ───────────────────────────

export const NBA_ABBREVS: Record<string, string> = {
    'Atlanta Hawks': 'atl', 'Boston Celtics': 'bos', 'Brooklyn Nets': 'bkn',
    'Charlotte Hornets': 'cha', 'Chicago Bulls': 'chi', 'Cleveland Cavaliers': 'cle',
    'Dallas Mavericks': 'dal', 'Denver Nuggets': 'den', 'Detroit Pistons': 'det',
    'Golden State Warriors': 'gs', 'Houston Rockets': 'hou', 'Indiana Pacers': 'ind',
    'Los Angeles Clippers': 'lac', 'Los Angeles Lakers': 'lal', 'Memphis Grizzlies': 'mem',
    'Miami Heat': 'mia', 'Milwaukee Bucks': 'mil', 'Minnesota Timberwolves': 'min',
    'New Orleans Pelicans': 'no', 'New York Knicks': 'ny', 'Oklahoma City Thunder': 'okc',
    'Orlando Magic': 'orl', 'Philadelphia 76ers': 'phi', 'Phoenix Suns': 'phx',
    'Portland Trail Blazers': 'por', 'Sacramento Kings': 'sac', 'San Antonio Spurs': 'sa',
    'Toronto Raptors': 'tor', 'Utah Jazz': 'utah', 'Washington Wizards': 'wsh',
};

export const NFL_ABBREVS: Record<string, string> = {
    'Arizona Cardinals': 'ari', 'Atlanta Falcons': 'atl', 'Baltimore Ravens': 'bal',
    'Buffalo Bills': 'buf', 'Carolina Panthers': 'car', 'Chicago Bears': 'chi',
    'Cincinnati Bengals': 'cin', 'Cleveland Browns': 'cle', 'Dallas Cowboys': 'dal',
    'Denver Broncos': 'den', 'Detroit Lions': 'det', 'Green Bay Packers': 'gb',
    'Houston Texans': 'hou', 'Indianapolis Colts': 'ind', 'Jacksonville Jaguars': 'jax',
    'Kansas City Chiefs': 'kc', 'Las Vegas Raiders': 'lv', 'Los Angeles Chargers': 'lac',
    'Los Angeles Rams': 'lar', 'Miami Dolphins': 'mia', 'Minnesota Vikings': 'min',
    'New England Patriots': 'ne', 'New Orleans Saints': 'no', 'New York Giants': 'nyg',
    'New York Jets': 'nyj', 'Philadelphia Eagles': 'phi', 'Pittsburgh Steelers': 'pit',
    'San Francisco 49ers': 'sf', 'Seattle Seahawks': 'sea', 'Tampa Bay Buccaneers': 'tb',
    'Tennessee Titans': 'ten', 'Washington Commanders': 'wsh',
};

export const MLB_ABBREVS: Record<string, string> = {
    'Arizona Diamondbacks': 'ari', 'Atlanta Braves': 'atl', 'Baltimore Orioles': 'bal',
    'Boston Red Sox': 'bos', 'Chicago Cubs': 'chc', 'Chicago White Sox': 'cws',
    'Cincinnati Reds': 'cin', 'Cleveland Guardians': 'cle', 'Colorado Rockies': 'col',
    'Detroit Tigers': 'det', 'Houston Astros': 'hou', 'Kansas City Royals': 'kc',
    'Los Angeles Angels': 'laa', 'Los Angeles Dodgers': 'lad', 'Miami Marlins': 'mia',
    'Milwaukee Brewers': 'mil', 'Minnesota Twins': 'min', 'New York Mets': 'nym',
    'New York Yankees': 'nyy', 'Oakland Athletics': 'oak', 'Philadelphia Phillies': 'phi',
    'Pittsburgh Pirates': 'pit', 'San Diego Padres': 'sd', 'San Francisco Giants': 'sf',
    'Seattle Mariners': 'sea', 'St. Louis Cardinals': 'stl', 'Tampa Bay Rays': 'tb',
    'Texas Rangers': 'tex', 'Toronto Blue Jays': 'tor', 'Washington Nationals': 'wsh',
};

export const NHL_ABBREVS: Record<string, string> = {
    'Anaheim Ducks': 'ana', 'Boston Bruins': 'bos', 'Buffalo Sabres': 'buf',
    'Calgary Flames': 'cgy', 'Carolina Hurricanes': 'car', 'Chicago Blackhawks': 'chi',
    'Colorado Avalanche': 'col', 'Columbus Blue Jackets': 'cbj', 'Dallas Stars': 'dal',
    'Detroit Red Wings': 'det', 'Edmonton Oilers': 'edm', 'Florida Panthers': 'fla',
    'Los Angeles Kings': 'la', 'Minnesota Wild': 'min', 'Montreal Canadiens': 'mtl',
    'Nashville Predators': 'nsh', 'New Jersey Devils': 'nj', 'New York Islanders': 'nyi',
    'New York Rangers': 'nyr', 'Ottawa Senators': 'ott', 'Philadelphia Flyers': 'phi',
    'Pittsburgh Penguins': 'pit', 'San Jose Sharks': 'sj', 'Seattle Kraken': 'sea',
    'St. Louis Blues': 'stl', 'Tampa Bay Lightning': 'tb', 'Toronto Maple Leafs': 'tor',
    'Utah Hockey Club': 'utah', 'Vancouver Canucks': 'van', 'Vegas Golden Knights': 'vgk',
    'Washington Capitals': 'wsh', 'Winnipeg Jets': 'wpg',
};

// NASCAR: espn uses car number as the "team" abbreviation for logos
// e.g. get_team_logo('racing', 'nascar', '5') → Larson's No. 5 Hendrick car logo
export const NASCAR_CAR_NUMBERS: Record<string, string> = {
    'Chase Elliott': '9', 'Kyle Larson': '5', 'Denny Hamlin': '11',
    'Martin Truex Jr': '19', 'Joey Logano': '22', 'Brad Keselowski': '6',
    'William Byron': '24', 'Alex Bowman': '48', 'Austin Dillon': '3',
    'Tyler Reddick': '45', 'Christopher Bell': '20', 'Ryan Blaney': '12',
    'Ross Chastain': '1', 'Bubba Wallace': '23', 'Ricky Stenhouse Jr': '47',
    'Chris Buescher': '17', 'Erik Jones': '43', 'Austin Cindric': '2',
    'Michael McDowell': '34', 'Noah Gragson': '42',
};

// ── Network logos (Where to Watch) ────────────────────────────────────────
export const COMMON_NETWORKS = [
    'espn', 'espn2', 'espn3', 'espnu', 'espnews',
    'abc', 'tnt', 'nba-tv', 'nfl-network', 'mlb-network',
    'nhl-network', 'fs1', 'fs2', 'cbs', 'nbc', 'peacock',
    'amazon-prime', 'apple-tv', 'max', 'fubo', 'directv',
] as const;

export type NetworkName = typeof COMMON_NETWORKS[number] | string;

// ── Core class ─────────────────────────────────────────────────────────────
export class SportsLogoTool {
    /**
     * Returns an ESPN team logo URL.
     * Mirrors Python: logos.get_team_logo(sport, league, team_abbreviation)
     *
     * @param sport  - ESPN sport path, e.g. 'basketball'
     * @param league - ESPN league path, e.g. 'nba'
     * @param abbrev - ESPN team abbreviation, e.g. 'lal'
     * @param size   - image size in px (default 500)
     */
    getTeamLogo(sport: string, league: string, abbrev: string, size = 500): string {
        return `${TEAM_BASE}/${sport.toLowerCase()}/${league.toLowerCase()}/${size}/scoreboard/${abbrev.toLowerCase()}.png`;
    }

    /**
     * Returns a team logo URL using our app's sport key.
     * Automatically resolves the sport + league path segments.
     *
     * @param sportKey - e.g. 'NBA', 'NFL', 'MLB', 'NASCAR'
     * @param abbrev   - ESPN team abbreviation (e.g. 'lal') or car number for NASCAR
     */
    getTeamLogoByKey(sportKey: string, abbrev: string, size = 500): string {
        const paths = SPORT_LEAGUE_PATHS[sportKey.toUpperCase()];
        if (!paths) return '';
        return this.getTeamLogo(paths[0], paths[1], abbrev, size);
    }

    /**
     * Returns a team logo for a full team name using the built-in abbreviation maps.
     *
     * @param sportKey  - 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'NASCAR'
     * @param teamName  - Full team name, e.g. 'Los Angeles Lakers'
     */
    getTeamLogoByName(sportKey: string, teamName: string, size = 500): string | null {
        const maps: Record<string, Record<string, string>> = {
            NBA: NBA_ABBREVS,
            NFL: NFL_ABBREVS,
            MLB: MLB_ABBREVS,
            NHL: NHL_ABBREVS,
            NASCAR: NASCAR_CAR_NUMBERS,
        };
        const map = maps[sportKey.toUpperCase()];
        if (!map) return null;
        const abbrev = map[teamName];
        if (!abbrev) return null;
        return this.getTeamLogoByKey(sportKey, abbrev, size);
    }

    /**
     * Returns a broadcast network logo URL.
     * Mirrors Python: logos.get_network_logo('espn')
     */
    getNetworkLogo(networkName: NetworkName): string {
        return `${NETWORK_BASE}/${String(networkName).toLowerCase()}.png`;
    }

    /**
     * Returns an ESPN athlete headshot via the combiner endpoint (correct production URL).
     * Matches Python AthleteImageTool.get_player_headshot() exactly.
     *
     * @param sport    - ESPN sport segment, e.g. 'basketball', 'football', 'racing'
     * @param league   - ESPN league segment, e.g. 'nba', 'nfl', 'womens-college-basketball'
     * @param playerId - ESPN athlete ID (integer), found in ESPN API's competitor.id
     * @param size     - 'full' (350×254) | 'medium' (110×80)
     *
     * Examples:
     *   getPlayerHeadshot('basketball', 'nba', 1966)               // LeBron James
     *   getPlayerHeadshot('basketball', 'womens-college-basketball', 4433475) // NCAAW star
     *   getPlayerHeadshot('racing', 'nascar', 581)                 // Kyle Busch
     */
    getPlayerHeadshot(
        _sport: string,
        league: string,
        playerId: string | number,
        size: 'full' | 'medium' = 'full'
    ): string {
        const dims = size === 'medium' ? 'w=110&h=80' : 'w=350&h=254';
        return `${HEADSHOT_COMBINER}/${league.toLowerCase()}/players/full/${playerId}.png&${dims}`;
    }

    /**
     * Legacy alias — kept for backward compatibility.
     * Prefer getPlayerHeadshot() for more accurate results.
     */
    /** @deprecated Use getPlayerHeadshot() */
    getAthleteHeadshot(athleteId: string | number, league = 'nba'): string {
        return this.getPlayerHeadshot('basketball', league, athleteId);
    }
}

// ── Singleton ──────────────────────────────────────────────────────────────
export const logos = new SportsLogoTool();
