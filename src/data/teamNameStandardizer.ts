/**
 * TeamNameStandardizer — TypeScript port of the Python rapidfuzz-based standardizer.
 *
 * Implements token_set_ratio scoring (same algorithm as `fuzz.token_set_ratio`)
 * without any external dependencies, so it runs in the browser.
 *
 * Usage:
 *   import { standardizer } from './teamNameStandardizer';
 *   standardizer.cleanName('NY Knicks')  // → "New York Knicks"
 *   standardizer.cleanName('GSW')        // → "Golden State Warriors"
 */

// ── Levenshtein distance ───────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

// ── Simple ratio (0–100) ───────────────────────────────────────────────────
function ratio(a: string, b: string): number {
    if (!a && !b) return 100;
    const dist = levenshtein(a, b);
    return Math.round((1 - dist / Math.max(a.length, b.length, 1)) * 100);
}

// ── token_set_ratio  (mirrors fuzz.token_set_ratio) ───────────────────────
// Splits strings into sorted token sets and scores all 3 set-intersection
// variants, returning the max. This makes "NY Knicks" ↔ "New York Knicks"
// score very high because the shared token "knicks" dominates.
function tokenSetRatio(a: string, b: string): number {
    const tokens = (s: string) =>
        [...new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean))].sort();

    const tA = tokens(a);
    const tB = tokens(b);

    const intersection = tA.filter(t => tB.includes(t));
    const diffA = tA.filter(t => !tB.includes(t));
    const diffB = tB.filter(t => !tA.includes(t));

    const s0 = intersection.join(' ');
    const s1 = [...intersection, ...diffA].join(' ');
    const s2 = [...intersection, ...diffB].join(' ');

    return Math.max(
        ratio(s0, s1),
        ratio(s0, s2),
        ratio(s1, s2),
    );
}

// ── Master team lists ─────────────────────────────────────────────────────
export const MASTER_TEAMS: string[] = [
    // ── NBA ──────────────────────────────────────────────────────────────
    'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets',
    'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets',
    'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers',
    'Los Angeles Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat',
    'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks',
    'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns',
    'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors',
    'Utah Jazz', 'Washington Wizards',

    // ── WNBA ─────────────────────────────────────────────────────────────
    'Atlanta Dream', 'Chicago Sky', 'Connecticut Sun', 'Dallas Wings',
    'Indiana Fever', 'Las Vegas Aces', 'Los Angeles Sparks', 'Minnesota Lynx',
    'New York Liberty', 'Phoenix Mercury', 'Seattle Storm', 'Washington Mystics',

    // ── NFL ──────────────────────────────────────────────────────────────
    'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
    'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
    'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
    'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
    'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
    'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
    'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
    'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders',

    // ── MLB ──────────────────────────────────────────────────────────────
    'Arizona Diamondbacks', 'Atlanta Braves', 'Baltimore Orioles', 'Boston Red Sox',
    'Chicago Cubs', 'Chicago White Sox', 'Cincinnati Reds', 'Cleveland Guardians',
    'Colorado Rockies', 'Detroit Tigers', 'Houston Astros', 'Kansas City Royals',
    'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins', 'Milwaukee Brewers',
    'Minnesota Twins', 'New York Mets', 'New York Yankees', 'Oakland Athletics',
    'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres', 'San Francisco Giants',
    'Seattle Mariners', 'St. Louis Cardinals', 'Tampa Bay Rays', 'Texas Rangers',
    'Toronto Blue Jays', 'Washington Nationals',

    // ── NHL ──────────────────────────────────────────────────────────────
    'Anaheim Ducks', 'Arizona Coyotes', 'Boston Bruins', 'Buffalo Sabres',
    'Calgary Flames', 'Carolina Hurricanes', 'Chicago Blackhawks', 'Colorado Avalanche',
    'Columbus Blue Jackets', 'Dallas Stars', 'Detroit Red Wings', 'Edmonton Oilers',
    'Florida Panthers', 'Los Angeles Kings', 'Minnesota Wild', 'Montreal Canadiens',
    'Nashville Predators', 'New Jersey Devils', 'New York Islanders', 'New York Rangers',
    'Ottawa Senators', 'Philadelphia Flyers', 'Pittsburgh Penguins', 'San Jose Sharks',
    'Seattle Kraken', 'St. Louis Blues', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
    'Utah Hockey Club', 'Vancouver Canucks', 'Vegas Golden Knights', 'Washington Capitals',
    'Winnipeg Jets',

    // ── NASCAR Cup Series Drivers ─────────────────────────────────────────
    'Chase Elliott', 'Kyle Larson', 'Denny Hamlin', 'Martin Truex Jr', 'Joey Logano',
    'Brad Keselowski', 'Kevin Harvick', 'Aric Almirola', 'William Byron', 'Alex Bowman',
    'Tyler Reddick', 'Christopher Bell', 'Ryan Blaney', 'Austin Dillon', 'Ross Chastain',
    'Bubba Wallace', 'Michael McDowell', 'Cole Custer', 'Harrison Burton', 'Noah Gragson',
    'Todd Gilliland', 'Corey LaJoie', 'Justin Haley', 'BJ McLeod', 'Ricky Stenhouse Jr',
    'Chris Buescher', 'Erik Jones', 'Austin Cindric', 'Josh Bilicki',

    // ── UFC Fighter names (common matchups) ──────────────────────────────
    'Jon Jones', 'Stipe Miocic', 'Francis Ngannou', 'Ciryl Gane', 'Tom Aspinall',
    'Islam Makhachev', 'Alexander Volkanovski', 'Max Holloway', 'Dustin Poirier',
    'Charles Oliveira', 'Conor McGregor', 'Justin Gaethie', 'Khabib Nurmagomedov',
    'Leon Edwards', 'Kamaru Usman', 'Colby Covington', 'Sean Strickland', 'Dricus Du Plessis',
    'Alex Pereira', 'Israel Adesanya', 'Jan Blachowicz', 'Jiri Prochazka',

    // ── Boxing ────────────────────────────────────────────────────────────
    'Tyson Fury', 'Oleksandr Usyk', 'Anthony Joshua', 'Deontay Wilder',
    'Canelo Alvarez', 'Gennady Golovkin', 'Ryan Garcia', 'Gervonta Davis',
    'Terence Crawford', 'Errol Spence Jr', 'Devin Haney', 'Vasiliy Lomachenko',

    // ── CFB Top Programs ──────────────────────────────────────────────────
    'Alabama Crimson Tide', 'Georgia Bulldogs', 'Ohio State Buckeyes', 'Michigan Wolverines',
    'Texas Longhorns', 'Penn State Nittany Lions', 'Notre Dame Fighting Irish',
    'Florida State Seminoles', 'Clemson Tigers', 'Oregon Ducks', 'USC Trojans',
    'Oklahoma Sooners', 'Texas A&M Aggies', 'LSU Tigers', 'Miami Hurricanes',
    'Tennessee Volunteers', 'Washington Huskies', 'Utah Utes', 'TCU Horned Frogs',

    // ── Soccer (EPL) ──────────────────────────────────────────────────────
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
    'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
    'Leicester City', 'Liverpool', 'Manchester City', 'Manchester United',
    'Newcastle United', 'Nottingham Forest', 'Southampton', 'Tottenham Hotspur',
    'West Ham United', 'Wolverhampton Wanderers',
];

// ── Alias overrides (exact shortcuts → canonical name) ────────────────────
const ALIASES: Record<string, string> = {
    // NBA shortcuts
    'knicks': 'New York Knicks', 'ny knicks': 'New York Knicks',
    'lakers': 'Los Angeles Lakers', 'la lakers': 'Los Angeles Lakers',
    'warriors': 'Golden State Warriors', 'gsw': 'Golden State Warriors', 'golden state': 'Golden State Warriors',
    'celtics': 'Boston Celtics',
    'bulls': 'Chicago Bulls',
    'heat': 'Miami Heat',
    'nets': 'Brooklyn Nets', 'bk nets': 'Brooklyn Nets',
    'bucks': 'Milwaukee Bucks',
    'nuggets': 'Denver Nuggets',
    'suns': 'Phoenix Suns',
    'sixers': 'Philadelphia 76ers', 'philly': 'Philadelphia 76ers', '76ers': 'Philadelphia 76ers',
    'clippers': 'Los Angeles Clippers', 'la clippers': 'Los Angeles Clippers',
    'raptors': 'Toronto Raptors',
    'hawks': 'Atlanta Hawks',
    'cavs': 'Cleveland Cavaliers', 'cavaliers': 'Cleveland Cavaliers',
    'mavs': 'Dallas Mavericks', 'mavericks': 'Dallas Mavericks',
    'grizzlies': 'Memphis Grizzlies',
    'wolves': 'Minnesota Timberwolves', 't-wolves': 'Minnesota Timberwolves',
    'pelicans': 'New Orleans Pelicans',
    'thunder': 'Oklahoma City Thunder', 'okc': 'Oklahoma City Thunder',
    'magic': 'Orlando Magic',
    'blazers': 'Portland Trail Blazers',
    'kings': 'Sacramento Kings',
    'spurs': 'San Antonio Spurs',
    'jazz': 'Utah Jazz',
    'wizards': 'Washington Wizards',
    'pacers': 'Indiana Pacers',
    'rockets': 'Houston Rockets',
    'pistons': 'Detroit Pistons',
    'hornets': 'Charlotte Hornets',
    // NFL shortcuts
    'cowboys': 'Dallas Cowboys', 'dak': 'Dallas Cowboys',
    'patriots': 'New England Patriots', 'pats': 'New England Patriots',
    'chiefs': 'Kansas City Chiefs', 'kc chiefs': 'Kansas City Chiefs',
    'eagles': 'Philadelphia Eagles',
    'bills': 'Buffalo Bills',
    'Ravens': 'Baltimore Ravens',
    '49ers': 'San Francisco 49ers', 'niners': 'San Francisco 49ers', 'sf': 'San Francisco 49ers',
    'rams': 'Los Angeles Rams', 'la rams': 'Los Angeles Rams',
    'bengals': 'Cincinnati Bengals',
    'steelers': 'Pittsburgh Steelers',
    'packers': 'Green Bay Packers', 'gb': 'Green Bay Packers',
    'seahawks': 'Seattle Seahawks',
    // MLB shortcuts
    'yankees': 'New York Yankees', 'ny yankees': 'New York Yankees',
    'dodgers': 'Los Angeles Dodgers', 'la dodgers': 'Los Angeles Dodgers',
    'red sox': 'Boston Red Sox',
    'cubs': 'Chicago Cubs',
    'mets': 'New York Mets',
    'astros': 'Houston Astros',
    'braves': 'Atlanta Braves',
    // NHL shortcuts
    'bruins': 'Boston Bruins',
    'lightning': 'Tampa Bay Lightning', 'tb lightning': 'Tampa Bay Lightning',
    'maple leafs': 'Toronto Maple Leafs', 'leafs': 'Toronto Maple Leafs',
    'oilers': 'Edmonton Oilers',
    'golden knights': 'Vegas Golden Knights', 'vgk': 'Vegas Golden Knights',
    'rangers': 'New York Rangers', 'ny rangers': 'New York Rangers',
    'penguins': 'Pittsburgh Penguins', 'pens': 'Pittsburgh Penguins',
    // Soccer
    'man city': 'Manchester City', 'city': 'Manchester City',
    'man utd': 'Manchester United', 'man united': 'Manchester United',
    'spurs fc': 'Tottenham Hotspur',
    'wolves fc': 'Wolverhampton Wanderers',
    'villa': 'Aston Villa',
};

// ── Core class ─────────────────────────────────────────────────────────────
export class TeamNameStandardizer {
    private masterTeams: string[];
    private scoreCutoff: number;

    constructor(masterTeams: string[] = MASTER_TEAMS, scoreCutoff = 70) {
        this.masterTeams = masterTeams;
        this.scoreCutoff = scoreCutoff;
    }

    /**
     * Converts 'NY Knicks' → 'New York Knicks'
     * Mirrors Python: standardizer.clean_name(raw_name)
     */
    cleanName(rawName: string): string {
        const cleaned = rawName.toLowerCase().trim();

        // 1. Check alias map first (instant, O(1))
        if (ALIASES[cleaned]) return ALIASES[cleaned];

        // 2. Fuzzy match against master list
        let bestScore = -1;
        let bestMatch = '';
        for (const candidate of this.masterTeams) {
            const score = tokenSetRatio(cleaned, candidate);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = candidate;
            }
        }

        if (bestScore >= this.scoreCutoff) return bestMatch;

        // 3. No confident match — return original (title-cased)
        return rawName.trim();
    }

    /** Checks if two raw names refer to the same team */
    isSameTeam(nameA: string, nameB: string): boolean {
        return this.cleanName(nameA) === this.cleanName(nameB);
    }

    /** Returns the match score (0–100) between two raw names */
    matchScore(nameA: string, nameB: string): number {
        return tokenSetRatio(nameA.toLowerCase(), nameB.toLowerCase());
    }

    /** Add extra teams to the master list at runtime */
    addTeams(...teams: string[]): void {
        this.masterTeams.push(...teams);
    }
}

// ── Singleton export (drop-in equivalent of Python's `standardizer`) ──────
export const standardizer = new TeamNameStandardizer();
