export interface PlayerLog {
    id: string;
    date: string;
    opponent: string;
    result: 'W' | 'L';
    score: string;         // e.g. "112-109"
    stat1: number;
    stat2: number;
    stat3: number;
    minutes: string;
}

export interface PositionalMatchupRow {
    player: string;
    date: string;
    pos: string;
    result: 'Over' | 'Under';
    line: number;
    odds: string;
}

export interface AltLine {
    line: number;
    overOdds: string;
    underOdds: string;
}

export interface PlayerProp {
    id: string;
    type: string;
    line: number;
    overOdds: string;
    underOdds: string;
    impliedProb: number;
    oppRank: { rank: number; team: string; color: 'green' | 'red' | 'yellow' };
    l5: number[];
    l10: number[];
    l20: number[];
    h2h: number[];
    season2025: number[];
    dkOdds: string;
    fdOdds: string;
    mgmOdds: string;
    altLines: AltLine[];
    positionalMatchups: PositionalMatchupRow[];
}

export interface TeamRecord {
    home: string;        // e.g. "24-11"
    away: string;        // e.g. "18-17"
    conf: string;        // e.g. "10-6"
    div: string;         // e.g. "5-3"
    ats: string;         // e.g. "22-28-2"
    atsPct: number;      // e.g. 44
    confRank: number;
    divRank: number;
}

export interface PublicBetting {
    mlBetPct: number;
    mlMoneyPct: number;
    spreadBetPct: number;
    spreadMoneyPct: number;
    ouBetPct: number;     // Over bet %
    ouMoneyPct: number;   // Over money %
}

export interface Player {
    id: string;
    name: string;
    teamName: string;
    photoUrl: string;
    position: string;
    age: number;
    height: string;
    weight: number;
    college: string;
    salary: string;
    opponent: string;
    seasonAvg: {
        stat1: number;
        stat2: number;
        stat3: number;
        stat4: number;
    };
    // Shooting splits
    fgMade: number;
    fgAtt: number;
    fgPct: number;
    threeMade: number;
    threeAtt: number;
    threePct: number;
    ftMade: number;
    ftAtt: number;
    ftPct: number;
    foulsPerGame: number;
    // Team context
    teamRecord: TeamRecord;
    publicBetting: PublicBetting;
    recentLogs: PlayerLog[];
    props: PlayerProp[];
}

const FIRST_NAMES = ['James', 'Michael', 'Robert', 'David', 'William', 'John', 'Thomas', 'Kevin', 'Jason', 'Matthew', 'Alex', 'Chris'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const COLLEGES = [
    'Kentucky', 'Duke', 'Kansas', 'North Carolina', 'UCLA', 'Michigan', 'Gonzaga',
    'Indiana', 'Arizona', 'Louisville', 'Ohio State', 'Texas', 'Florida', 'Connecticut',
    'Syracuse', 'Georgetown', 'Villanova', 'Memphis', 'UNLV', 'Oklahoma'
];

const OPPONENTS = ['CLE', 'BOS', 'MIL', 'ATL', 'MIA', 'PHI', 'NYK', 'CHI', 'DEN', 'LAL', 'GSW', 'PHX', 'SAC'];

const SPORT_STATS: Record<string, { pos: string[], stat1: string, stat2: string, stat3: string, stat4: string, defaultLines: number[] }> = {
    NBA: { pos: ['PG', 'SG', 'SF', 'PF', 'C'], stat1: 'PTS', stat2: 'REB', stat3: 'AST', stat4: '3PM', defaultLines: [24.5, 8.5, 6.5, 2.5] },
    NFL: { pos: ['QB', 'RB', 'WR', 'TE'], stat1: 'YDS', stat2: 'REC', stat3: 'TD', stat4: 'TGT', defaultLines: [250.5, 5.5, 0.5, 8.5] },
    MLB: { pos: ['SP', '1B', 'OF', 'SS'], stat1: 'H', stat2: 'RBI', stat3: 'HR', stat4: 'OBP', defaultLines: [1.5, 0.5, 0.5, 0.350] },
    WBC: { pos: ['SP', '1B', 'OF', 'SS'], stat1: 'H', stat2: 'RBI', stat3: 'HR', stat4: 'OBP', defaultLines: [1.5, 0.5, 0.5, 0.350] },
    NHL: { pos: ['C', 'LW', 'RW', 'D'], stat1: 'G', stat2: 'A', stat3: 'SOG', stat4: 'HIT', defaultLines: [0.5, 0.5, 2.5, 3.5] },
    Soccer: { pos: ['ST', 'CAM', 'LW', 'RW'], stat1: 'G', stat2: 'A', stat3: 'SHT', stat4: 'SOT', defaultLines: [0.5, 0.5, 2.5, 1.5] },
    Tennis: { pos: ['Player'], stat1: 'ACES', stat2: 'DF', stat3: 'WIN%', stat4: 'BPS', defaultLines: [8.5, 3.5, 50.5, 4.5] },
    Golf: { pos: ['Golfer'], stat1: 'BIR', stat2: 'BOG', stat3: 'EAG', stat4: 'PAR', defaultLines: [4.5, 2.5, 0.5, 12.5] },
    UFC: { pos: ['Fighter'], stat1: 'SIG.STR', stat2: 'TD', stat3: 'SUB', stat4: 'KD', defaultLines: [55.5, 1.5, 0.5, 0.5] },
    Esports: { pos: ['Entry', 'IGL', 'AWP'], stat1: 'K', stat2: 'D', stat3: 'A', stat4: 'HS%', defaultLines: [18.5, 15.5, 5.5, 45.5] }
};

export const getSportStatLabels = (sport: string) => {
    return SPORT_STATS[sport] || SPORT_STATS['NBA'];
};

// Helper: random int in range [min, max]
const ri = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper: random float in range
const rf = (min: number, max: number, dp = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));

function generatePositionalMatchups(pos: string[], line: number, _opponent: string): PositionalMatchupRow[] {
    void _opponent; // reserved for future opponent-specific logic
    const names = ['J. Brown', 'K. Durant', 'L. James', 'G. Antetokounmpo', 'P. George', 'D. Booker', 'B. Adebayo', 'Z. LaVine'];
    return Array.from({ length: 6 }).map((_, i) => ({
        player: names[i % names.length],
        date: new Date(Date.now() - (i + 1) * 4 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pos: pos[i % pos.length],
        result: Math.random() > 0.5 ? 'Over' : 'Under',
        line: parseFloat((line + (Math.random() * 4 - 2)).toFixed(1)),
        odds: Math.random() > 0.5 ? `-11${ri(0, 5)}` : `+10${ri(5, 20)}`
    }));
}

export const generateMockPlayers = (teamName: string, sport: string, count: number = 3): Player[] => {
    const config = SPORT_STATS[sport] || SPORT_STATS['NBA'];

    return Array.from({ length: count }).map((_, i) => {
        const id = `${teamName.replace(/\s+/g, '-').toLowerCase()}-player-${i + 1}`;
        let actualName = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;

        const avg1 = +(Math.random() * (config.defaultLines[0] * 1.5)).toFixed(1);
        const avg2 = +(Math.random() * (config.defaultLines[1] * 1.5)).toFixed(1);
        const avg3 = +(Math.random() * (config.defaultLines[2] * 1.5)).toFixed(1);
        const avg4 = +(Math.random() * (config.defaultLines[3] * 1.5)).toFixed(1);

        const oppTeam = OPPONENTS[ri(0, OPPONENTS.length - 1)];
        const scores = ['112-109', '98-103', '121-115', '89-95', '107-101', '118-112', '88-92', '103-98', '115-119', '101-107'];

        const recentLogs: PlayerLog[] = Array.from({ length: 10 }).map((_, j) => {
            const date = new Date();
            date.setDate(date.getDate() - (j * 3 + 1));
            return {
                id: `${id}-log-${j}`,
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                opponent: `@ ${OPPONENTS[(j + i) % OPPONENTS.length]}`,
                result: Math.random() > 0.5 ? 'W' : 'L',
                score: scores[j % scores.length],
                stat1: Math.max(0, Math.floor(avg1 + (Math.random() * 14 - 7))),
                stat2: Math.max(0, Math.floor(avg2 + (Math.random() * 4 - 2))),
                stat3: Math.max(0, Math.floor(avg3 + (Math.random() * 3 - 1))),
                minutes: `${ri(20, 38)}:${ri(0, 59).toString().padStart(2, '0')}`
            };
        });

        const generateTrend = (length: number) => Array.from({ length }).map(() => ri(0, 100));

        // Shooting splits
        const fgMade = ri(4, 12);
        const fgAtt = fgMade + ri(3, 9);
        const fgPct = parseFloat(((fgMade / fgAtt) * 100).toFixed(1));
        const threeMade = ri(0, 5);
        const threeAtt = threeMade + ri(1, 5);
        const threePct = parseFloat(((threeMade / threeAtt) * 100).toFixed(1));
        const ftMade = ri(2, 9);
        const ftAtt = ftMade + ri(0, 3);
        const ftPct = parseFloat(((ftMade / ftAtt) * 100).toFixed(1));

        // Positional matchups (last 6 players who recently played same opp at same pos)
        const generatePropAltLines = (baseLine: number): AltLine[] => {
            return [-3, -1.5, 0, 1.5, 3].map(delta => {
                const l = parseFloat((baseLine + delta).toFixed(1));
                const overOdds = delta < 0 ? `-${ri(140, 200)}` : `+${ri(110, 170)}`;
                const underOdds = delta < 0 ? `+${ri(110, 160)}` : `-${ri(130, 185)}`;
                return { line: l, overOdds, underOdds };
            });
        };

        const props: PlayerProp[] = [
            {
                id: `${id}-prop-1`,
                type: config.stat1,
                line: config.defaultLines[0],
                overOdds: `-1${ri(10, 30)}`,
                underOdds: `+1${ri(10, 30)}`,
                impliedProb: ri(40, 80),
                oppRank: { rank: ri(1, 30), team: oppTeam, color: Math.random() > 0.6 ? 'green' : Math.random() > 0.3 ? 'red' : 'yellow' },
                l5: generateTrend(5),
                l10: generateTrend(10),
                l20: generateTrend(20),
                h2h: generateTrend(5),
                season2025: generateTrend(5),
                dkOdds: `-1${ri(10, 30)}`,
                fdOdds: `-1${ri(10, 30)}`,
                mgmOdds: `-1${ri(10, 30)}`,
                altLines: generatePropAltLines(config.defaultLines[0]),
                positionalMatchups: generatePositionalMatchups(config.pos, config.defaultLines[0], oppTeam)
            },
            {
                id: `${id}-prop-2`,
                type: config.stat2,
                line: config.defaultLines[1],
                overOdds: `-110`,
                underOdds: `-110`,
                impliedProb: ri(40, 80),
                oppRank: { rank: ri(1, 30), team: oppTeam, color: Math.random() > 0.6 ? 'green' : Math.random() > 0.3 ? 'red' : 'yellow' },
                l5: generateTrend(5),
                l10: generateTrend(10),
                l20: generateTrend(20),
                h2h: generateTrend(5),
                season2025: generateTrend(5),
                dkOdds: `-110`,
                fdOdds: `-112`,
                mgmOdds: `-108`,
                altLines: generatePropAltLines(config.defaultLines[1]),
                positionalMatchups: generatePositionalMatchups(config.pos, config.defaultLines[1], oppTeam)
            },
            {
                id: `${id}-prop-3`,
                type: config.stat3,
                line: config.defaultLines[2],
                overOdds: `+1${ri(10, 50)}`,
                underOdds: `-1${ri(10, 50)}`,
                impliedProb: ri(40, 80),
                oppRank: { rank: ri(1, 30), team: oppTeam, color: Math.random() > 0.6 ? 'green' : Math.random() > 0.3 ? 'red' : 'yellow' },
                l5: generateTrend(5),
                l10: generateTrend(10),
                l20: generateTrend(20),
                h2h: generateTrend(5),
                season2025: generateTrend(5),
                dkOdds: `+1${ri(10, 50)}`,
                fdOdds: `+1${ri(10, 50)}`,
                mgmOdds: `+1${ri(10, 50)}`,
                altLines: generatePropAltLines(config.defaultLines[2]),
                positionalMatchups: generatePositionalMatchups(config.pos, config.defaultLines[2], oppTeam)
            },
            {
                id: `${id}-prop-4`,
                type: config.stat4,
                line: config.defaultLines[3],
                overOdds: `+1${ri(10, 60)}`,
                underOdds: `-1${ri(10, 60)}`,
                impliedProb: ri(35, 75),
                oppRank: { rank: ri(1, 30), team: oppTeam, color: Math.random() > 0.6 ? 'green' : Math.random() > 0.3 ? 'red' : 'yellow' },
                l5: generateTrend(5),
                l10: generateTrend(10),
                l20: generateTrend(20),
                h2h: generateTrend(5),
                season2025: generateTrend(5),
                dkOdds: `+1${ri(10, 60)}`,
                fdOdds: `+1${ri(10, 60)}`,
                mgmOdds: `+1${ri(10, 60)}`,
                altLines: generatePropAltLines(config.defaultLines[3]),
                positionalMatchups: generatePositionalMatchups(config.pos, config.defaultLines[3], oppTeam)
            }
        ];

        // ── NBA-ONLY unlocked extra props ──────────────────────────────
        if (sport === 'NBA') {
            const nbaSportExtras: Array<{ type: string; line: number; odds: [string, string] }> = [
                { type: 'DD2', line: 0.5, odds: ['+110', '-135'] },
                { type: '1Q PTS', line: parseFloat((avg1 * 0.27).toFixed(1)) || 7.5, odds: [`-1${ri(10, 25)}`, `+1${ri(10, 25)}`] },
                { type: '1Q AST', line: parseFloat((avg3 * 0.30).toFixed(1)) || 1.5, odds: ['+115', '-140'] },
                { type: 'BLK', line: 0.5, odds: [`+1${ri(15, 60)}`, `-1${ri(30, 80)}`] },
                { type: 'STL', line: 0.5, odds: [`+1${ri(10, 40)}`, `-1${ri(25, 65)}`] },
            ];
            nbaSportExtras.forEach((extra, ei) => {
                props.push({
                    id: `${id}-prop-extra-${ei}`,
                    type: extra.type,
                    line: extra.line,
                    overOdds: extra.odds[0],
                    underOdds: extra.odds[1],
                    impliedProb: ri(38, 72),
                    oppRank: { rank: ri(1, 30), team: oppTeam, color: Math.random() > 0.6 ? 'green' : Math.random() > 0.3 ? 'red' : 'yellow' },
                    l5: generateTrend(5),
                    l10: generateTrend(10),
                    l20: generateTrend(20),
                    h2h: generateTrend(5),
                    season2025: generateTrend(5),
                    dkOdds: extra.odds[0],
                    fdOdds: extra.odds[1],
                    mgmOdds: extra.odds[0],
                    altLines: generatePropAltLines(extra.line),
                    positionalMatchups: generatePositionalMatchups(config.pos, extra.line, oppTeam),
                });
            });
        }

        // Mock Headshots logic
        let photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(actualName)}&background=random&color=fff&rounded=true`;

        if (sport === 'NBA') {
            const REAL_NBA_PLAYERS: Record<string, { name: string, id: string }[]> = {
                'Lakers': [{ name: 'LeBron James', id: '1966' }, { name: 'Anthony Davis', id: '6583' }, { name: 'D\'Angelo Russell', id: '3136776' }, { name: 'Austin Reaves', id: '4397193' }, { name: 'Rui Hachimura', id: '4395651' }],
                'Celtics': [{ name: 'Jayson Tatum', id: '4065648' }, { name: 'Jaylen Brown', id: '3917376' }, { name: 'Jrue Holiday', id: '3995' }, { name: 'Derrick White', id: '4070232' }, { name: 'Kristaps Porzingis', id: '3102531' }],
                'Suns': [{ name: 'Devin Booker', id: '3136193' }, { name: 'Kevin Durant', id: '3202' }, { name: 'Bradley Beal', id: '6589' }, { name: 'Jusuf Nurkic', id: '3102530' }, { name: 'Grayson Allen', id: '3136198' }],
                'Nuggets': [{ name: 'Nikola Jokic', id: '3112335' }, { name: 'Jamal Murray', id: '3936299' }, { name: 'Michael Porter Jr.', id: '4239968' }, { name: 'Aaron Gordon', id: '3116743' }, { name: 'KCP', id: '2581' }],
                'Warriors': [{ name: 'Stephen Curry', id: '3975' }, { name: 'Draymond Green', id: '6589' }, { name: 'Andrew Wiggins', id: '3059319' }, { name: 'Klay Thompson', id: '6475' }, { name: 'Jonathan Kuminga', id: '4433247' }],
                'Heat': [{ name: 'Jimmy Butler', id: '6430' }, { name: 'Bam Adebayo', id: '4066261' }, { name: 'Tyler Herro', id: '4397011' }, { name: 'Terry Rozier', id: '3074752' }, { name: 'Duncan Robinson', id: '3157465' }],
                'Bulls': [{ name: 'Zach LaVine', id: '3064440' }, { name: 'DeMar DeRozan', id: '3978' }, { name: 'Nikola Vucevic', id: '6478' }, { name: 'Coby White', id: '4395651' }, { name: 'Alex Caruso', id: '3149673' }],
                'Knicks': [{ name: 'Jalen Brunson', id: '3934672' }, { name: 'Julius Randle', id: '3064514' }, { name: 'OG Anunoby', id: '3932223' }, { name: 'Josh Hart', id: '3136215' }, { name: 'Donte DiVincenzo', id: '3136195' }]
            };

            const knownTeamPlayers = REAL_NBA_PLAYERS[teamName];
            if (knownTeamPlayers && knownTeamPlayers[i]) {
                const player = knownTeamPlayers[i];
                actualName = player.name;
                photoUrl = `https://a.espncdn.com/i/headshots/nba/players/full/${player.id}.png`;
            }
        }

        const age = 20 + ((i * 3 + 2) % 17);
        const heightFeet = sport === 'NFL' ? (5 + ((i + 3) % 3)) : (6 + ((i + 1) % 3));
        const heightInches = (i * 7 + 3) % 12;
        const weight = sport === 'NFL' ? (220 + (i * 17) % 120) : sport === 'NBA' ? (190 + (i * 11) % 90) : (175 + (i * 9) % 80);
        const college = COLLEGES[(i + teamName.length) % COLLEGES.length];
        const salaryBase = 2 + (i % 30);
        const salary = salaryBase > 20 ? `$${salaryBase}.${(i * 3) % 10}M` : `$${salaryBase}.${(i * 7) % 10}M`;

        // Team record
        const homeW = ri(10, 28); const homeL = 35 - homeW;
        const awayW = ri(8, 22); const awayL = 30 - awayW;
        const confW = ri(6, 16); const confL = 20 - confW;
        const divW = ri(2, 8); const divL = 10 - divW;
        const atsW = ri(15, 30); const atsL = ri(15, 30); const atsP = ri(0, 3);
        const atsPct = Math.round((atsW / (atsW + atsL)) * 100);

        const teamRecord: TeamRecord = {
            home: `${homeW}-${homeL}`,
            away: `${awayW}-${awayL}`,
            conf: `${confW}-${confL}`,
            div: `${divW}-${divL}`,
            ats: `${atsW}-${atsL}-${atsP}`,
            atsPct,
            confRank: ri(1, 8),
            divRank: ri(1, 5)
        };

        // Public betting
        const mlBetPct = ri(30, 75);
        const mlMoneyPct = ri(25, 80);
        const spreadBetPct = ri(30, 70);
        const spreadMoneyPct = ri(25, 75);
        const ouBetPct = ri(35, 72);
        const ouMoneyPct = ri(30, 78);

        const publicBetting: PublicBetting = { mlBetPct, mlMoneyPct, spreadBetPct, spreadMoneyPct, ouBetPct, ouMoneyPct };

        return {
            id,
            name: actualName,
            teamName,
            photoUrl,
            position: config.pos[Math.floor(Math.random() * config.pos.length)],
            opponent: oppTeam,
            age,
            height: `${heightFeet}-${heightInches}`,
            weight,
            college,
            salary,
            seasonAvg: { stat1: avg1, stat2: avg2, stat3: avg3, stat4: avg4 },
            fgMade, fgAtt, fgPct,
            threeMade, threeAtt, threePct,
            ftMade, ftAtt, ftPct,
            foulsPerGame: rf(1.5, 4.5),
            teamRecord,
            publicBetting,
            recentLogs,
            props
        };
    });
};
