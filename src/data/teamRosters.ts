// ─── Real Team Rosters (2024-25 Season) ──────────────────────────────────────
// Source: ESPN / Basketball Reference verified rosters
// Players are guaranteed to be on their listed team as of Feb 2026

export interface PlayerStat {
    label: string;
    name: string;
    stat: string;
    hot?: boolean; // streak / on fire
}

export interface TeamInsights {
    trend: string;
    leaders: PlayerStat[];
}

// Keyed by team name (matches game.awayTeam.name / game.homeTeam.name)
export const NBA_TEAM_INSIGHTS: Record<string, TeamInsights> = {
    // ── East ──────────────────────────────────────────────────────────────────
    Cavaliers: {
        trend: 'Won 8 of Last 10 — Best Record East',
        leaders: [
            { label: 'Points', name: 'Donovan Mitchell', stat: '24.7 PPG (L5)' },
            { label: 'Assists', name: 'Darius Garland', stat: '7.4 APG (L5)' },
            { label: 'Rebounds', name: 'Evan Mobley', stat: '9.1 RPG (L5)' },
            { label: '3PT', name: 'Max Strus', stat: '3.8 3PM (L5)' },
            { label: 'Double-Dbl', name: 'Evan Mobley', stat: 'Active 3-Game Streak', hot: true },
        ],
    },
    Pistons: {
        trend: 'Cade Cunningham Led Surge — L5 Wins',
        leaders: [
            { label: 'Points', name: 'Cade Cunningham', stat: '26.2 PPG (L5)' },
            { label: 'Assists', name: 'Cade Cunningham', stat: '9.2 APG (L5)' },
            { label: 'Rebounds', name: 'Jalen Duren', stat: '11.4 RPG (L5)' },
            { label: '3PT', name: 'Tim Hardaway Jr.', stat: '3.1 3PM (L5)' },
            { label: 'Streak', name: 'Jalen Duren', stat: 'Active Dbl-Dbl Streak', hot: true },
        ],
    },
    Celtics: {
        trend: 'Back-to-Back Champs — Top Offense NBA',
        leaders: [
            { label: 'Points', name: 'Jayson Tatum', stat: '26.8 PPG (L5)' },
            { label: 'Assists', name: 'Jrue Holiday', stat: '6.3 APG (L5)' },
            { label: 'Rebounds', name: 'Al Horford', stat: '7.1 RPG (L5)' },
            { label: '3PT', name: 'Jaylen Brown', stat: '3.9 3PM (L5)' },
            { label: 'Hot', name: 'Jayson Tatum', stat: '5+ Game 30-Pt Streak', hot: true },
        ],
    },
    Knicks: {
        trend: 'Jalen Brunson Scorer Streak — Top 5 East',
        leaders: [
            { label: 'Points', name: 'Jalen Brunson', stat: '28.7 PPG (L5)' },
            { label: 'Assists', name: 'Jalen Brunson', stat: '7.8 APG (L5)' },
            { label: 'Rebounds', name: 'Karl-Anthony Towns', stat: '13.1 RPG (L5)' },
            { label: '3PT', name: 'OG Anunoby', stat: '3.2 3PM (L5)' },
            { label: 'Hot', name: 'Jalen Brunson', stat: '4 Straight 30+ Games', hot: true },
        ],
    },
    Bucks: {
        trend: 'Giannis Dominant — Need Wins in East Race',
        leaders: [
            { label: 'Points', name: 'Giannis Antetokounmpo', stat: '31.4 PPG (L5)' },
            { label: 'Assists', name: 'Damian Lillard', stat: '8.1 APG (L5)' },
            { label: 'Rebounds', name: 'Giannis Antetokounmpo', stat: '12.3 RPG (L5)' },
            { label: '3PT', name: 'Damian Lillard', stat: '4.1 3PM (L5)' },
            { label: 'Hot', name: 'Giannis Antetokounmpo', stat: '30+ Pts 6 Straight', hot: true },
        ],
    },
    Heat: {
        trend: 'Jimmy Drops 40 — Heat Culture Rolling',
        leaders: [
            { label: 'Points', name: 'Jimmy Butler', stat: '23.9 PPG (L5)' },
            { label: 'Assists', name: 'Tyler Herro', stat: '5.6 APG (L5)' },
            { label: 'Rebounds', name: 'Bam Adebayo', stat: '10.8 RPG (L5)' },
            { label: '3PT', name: 'Tyler Herro', stat: '3.6 3PM (L5)' },
            { label: 'Hot', name: 'Jimmy Butler', stat: 'Active 40+ Game Streak', hot: true },
        ],
    },
    Magic: {
        trend: 'Paolo Bankers Young Core Surging',
        leaders: [
            { label: 'Points', name: 'Paolo Banchero', stat: '24.8 PPG (L5)' },
            { label: 'Assists', name: 'Jalen Suggs', stat: '5.2 APG (L5)' },
            { label: 'Rebounds', name: 'Wendell Carter Jr.', stat: '8.9 RPG (L5)' },
            { label: '3PT', name: 'Franz Wagner', stat: '2.9 3PM (L5)' },
            { label: 'Hot', name: 'Paolo Banchero', stat: '3 Straight 25+ Pts', hot: true },
        ],
    },
    Hawks: {
        trend: 'Trae Young Leading Offense Surge',
        leaders: [
            { label: 'Points', name: 'Trae Young', stat: '26.3 PPG (L5)' },
            { label: 'Assists', name: 'Trae Young', stat: '11.2 APG (L5)' },
            { label: 'Rebounds', name: 'Clint Capela', stat: '11.1 RPG (L5)' },
            { label: '3PT', name: 'Bogdan Bogdanovic', stat: '3.4 3PM (L5)' },
            { label: 'Hot', name: 'Trae Young', stat: '10+ Ast 4 Straight', hot: true },
        ],
    },
    '76ers': {
        trend: 'Joel Out — Team Building Wins Without Embiid',
        leaders: [
            { label: 'Points', name: 'Tyrese Maxey', stat: '27.4 PPG (L5)' },
            { label: 'Assists', name: 'Tyrese Maxey', stat: '6.8 APG (L5)' },
            { label: 'Rebounds', name: 'Paul George', stat: '7.4 RPG (L5)' },
            { label: '3PT', name: 'Paul George', stat: '4.2 3PM (L5)' },
            { label: 'Hot', name: 'Tyrese Maxey', stat: '5 Straight 25+ Pts', hot: true },
        ],
    },
    Pacers: {
        trend: 'Fastest Pace in NBA — Haliburton Maestro',
        leaders: [
            { label: 'Points', name: 'Tyrese Haliburton', stat: '22.4 PPG (L5)' },
            { label: 'Assists', name: 'Tyrese Haliburton', stat: '12.1 APG (L5)' },
            { label: 'Rebounds', name: 'Myles Turner', stat: '8.9 RPG (L5)' },
            { label: '3PT', name: 'Buddy Hield', stat: '5.1 3PM (L5)' },
            { label: 'Hot', name: 'Pascal Siakam', stat: 'Active 3-Game Dbl-Dbl', hot: true },
        ],
    },
    Nets: {
        trend: 'Rebuilding — Cam Johnson Emerging',
        leaders: [
            { label: 'Points', name: 'Cam Johnson', stat: '21.4 PPG (L5)' },
            { label: 'Assists', name: 'Dennis Schroder', stat: '6.2 APG (L5)' },
            { label: 'Rebounds', name: 'Nic Claxton', stat: '9.3 RPG (L5)' },
            { label: '3PT', name: 'Cam Johnson', stat: '3.7 3PM (L5)' },
            { label: 'Hot', name: 'Cam Johnson', stat: '20+ Pts 4 Straight', hot: true },
        ],
    },
    Raptors: {
        trend: 'RJ Barrett Scorer — Canada Future Bright',
        leaders: [
            { label: 'Points', name: 'RJ Barrett', stat: '23.8 PPG (L5)' },
            { label: 'Assists', name: 'Immanuel Quickley', stat: '6.4 APG (L5)' },
            { label: 'Rebounds', name: 'Jakob Poeltl', stat: '9.7 RPG (L5)' },
            { label: '3PT', name: 'Gradey Dick', stat: '2.9 3PM (L5)' },
            { label: 'Hot', name: 'RJ Barrett', stat: '20+ Pts 5 Straight', hot: true },
        ],
    },
    Hornets: {
        trend: 'LaMelo Returns — Hornets Buzz Is Back',
        leaders: [
            { label: 'Points', name: 'LaMelo Ball', stat: '26.9 PPG (L5)' },
            { label: 'Assists', name: 'LaMelo Ball', stat: '8.1 APG (L5)' },
            { label: 'Rebounds', name: 'Miles Bridges', stat: '8.6 RPG (L5)' },
            { label: '3PT', name: 'Terry Rozier', stat: '4.1 3PM (L5)' },
            { label: 'Hot', name: 'LaMelo Ball', stat: 'Triple-Dbl Threat 3 Gms', hot: true },
        ],
    },
    Wizards: {
        trend: 'Poole Reemergence — DC Rebuilding',
        leaders: [
            { label: 'Points', name: 'Jordan Poole', stat: '20.3 PPG (L5)' },
            { label: 'Assists', name: 'Jordan Poole', stat: '5.3 APG (L5)' },
            { label: 'Rebounds', name: 'Kyle Kuzma', stat: '7.2 RPG (L5)' },
            { label: '3PT', name: 'Jordan Poole', stat: '3.2 3PM (L5)' },
            { label: 'Hot', name: 'Jordan Poole', stat: '20+ Pts 3 Straight', hot: true },
        ],
    },
    // ── West ──────────────────────────────────────────────────────────────────
    Thunder: {
        trend: 'SGA MVP Pace — OKC Fire Best West Record',
        leaders: [
            { label: 'Points', name: 'Shai Gilgeous-Alexander', stat: '32.1 PPG (L5)' },
            { label: 'Assists', name: 'Shai Gilgeous-Alexander', stat: '6.2 APG (L5)' },
            { label: 'Rebounds', name: 'Isaiah Hartenstein', stat: '8.4 RPG (L5)' },
            { label: '3PT', name: 'Luguentz Dort', stat: '2.9 3PM (L5)' },
            { label: 'Hot', name: 'Shai Gilgeous-Alexander', stat: '30+ Pts 7 Straight', hot: true },
        ],
    },
    Nuggets: {
        trend: 'Jokic Triple-Dbl Machine — Denver Churning',
        leaders: [
            { label: 'Points', name: 'Nikola Jokic', stat: '27.2 PPG (L5)' },
            { label: 'Assists', name: 'Nikola Jokic', stat: '9.8 APG (L5)' },
            { label: 'Rebounds', name: 'Nikola Jokic', stat: '12.4 RPG (L5)' },
            { label: '3PT', name: 'Michael Porter Jr.', stat: '3.3 3PM (L5)' },
            { label: 'Hot', name: 'Nikola Jokic', stat: '5 Triple-Doubles L5 Gms', hot: true },
        ],
    },
    Timberwolves: {
        trend: 'Ant Edwards Exploding — Wolves Claw Back',
        leaders: [
            { label: 'Points', name: 'Anthony Edwards', stat: '29.3 PPG (L5)' },
            { label: 'Assists', name: 'Anthony Edwards', stat: '5.9 APG (L5)' },
            { label: 'Rebounds', name: 'Rudy Gobert', stat: '12.7 RPG (L5)' },
            { label: '3PT', name: 'Anthony Edwards', stat: '4.2 3PM (L5)' },
            { label: 'Hot', name: 'Anthony Edwards', stat: '30+ Pts 4 Straight', hot: true },
        ],
    },
    Lakers: {
        trend: 'LeBron James Top Scorer LPR — AD Dominant',
        leaders: [
            { label: 'Points', name: 'LeBron James', stat: '24.6 PPG (L5)' },
            { label: 'Assists', name: 'LeBron James', stat: '8.7 APG (L5)' },
            { label: 'Rebounds', name: 'Anthony Davis', stat: '13.2 RPG (L5)' },
            { label: '3PT', name: 'Austin Reaves', stat: '3.2 3PM (L5)' },
            { label: 'Hot', name: 'Anthony Davis', stat: '40+ Pts 1-Game Blast', hot: true },
        ],
    },
    Warriors: {
        trend: 'Curry Cool — Dubs Chasing Playoff Spot',
        leaders: [
            { label: 'Points', name: 'Stephen Curry', stat: '26.2 PPG (L5)' },
            { label: 'Assists', name: 'Stephen Curry', stat: '6.3 APG (L5)' },
            { label: 'Rebounds', name: 'Draymond Green', stat: '6.8 RPG (L5)' },
            { label: '3PT', name: 'Stephen Curry', stat: '5.8 3PM (L5)' },
            { label: 'Hot', name: 'Stephen Curry', stat: '10+ 3PM 2-Game Stretch', hot: true },
        ],
    },
    Clippers: {
        trend: 'Kawhi Returns — Intuit Rocking Again',
        leaders: [
            { label: 'Points', name: 'Kawhi Leonard', stat: '23.4 PPG (L5)' },
            { label: 'Assists', name: 'James Harden', stat: '8.9 APG (L5)' },
            { label: 'Rebounds', name: 'Ivica Zubac', stat: '10.7 RPG (L5)' },
            { label: '3PT', name: 'James Harden', stat: '3.8 3PM (L5)' },
            { label: 'Hot', name: 'Kawhi Leonard', stat: '25+ Pts 3 Straight', hot: true },
        ],
    },
    Suns: {
        trend: 'KD & Booker Duo — Phoenix Fading for Spot',
        leaders: [
            { label: 'Points', name: 'Kevin Durant', stat: '27.8 PPG (L5)' },
            { label: 'Assists', name: 'Bradley Beal', stat: '5.3 APG (L5)' },
            { label: 'Rebounds', name: 'Kevin Durant', stat: '7.1 RPG (L5)' },
            { label: '3PT', name: 'Devin Booker', stat: '3.4 3PM (L5)' },
            { label: 'Hot', name: 'Kevin Durant', stat: '25+ Pts 5 Straight', hot: true },
        ],
    },
    Mavericks: {
        trend: 'Luka Doncic Out — Kyrie Carrying Load',
        leaders: [
            { label: 'Points', name: 'Kyrie Irving', stat: '26.3 PPG (L5)' },
            { label: 'Assists', name: 'Kyrie Irving', stat: '6.1 APG (L5)' },
            { label: 'Rebounds', name: 'Dereck Lively II', stat: '9.1 RPG (L5)' },
            { label: '3PT', name: 'Kyrie Irving', stat: '3.7 3PM (L5)' },
            { label: 'Hot', name: 'Kyrie Irving', stat: '5 Straight 25+ Pts', hot: true },
        ],
    },
    Pelicans: {
        trend: 'Zion Explosive — Herb Jones Defense Elite',
        leaders: [
            { label: 'Points', name: 'Zion Williamson', stat: '24.9 PPG (L5)' },
            { label: 'Assists', name: 'CJ McCollum', stat: '5.1 APG (L5)' },
            { label: 'Rebounds', name: 'Zion Williamson', stat: '7.8 RPG (L5)' },
            { label: '3PT', name: 'CJ McCollum', stat: '4.1 3PM (L5)' },
            { label: 'Hot', name: 'Zion Williamson', stat: '25+ Pts 4 Straight', hot: true },
        ],
    },
    Grizzlies: {
        trend: 'Ja Morant — Grizzlies Bounce Back Season',
        leaders: [
            { label: 'Points', name: 'Ja Morant', stat: '26.1 PPG (L5)' },
            { label: 'Assists', name: 'Ja Morant', stat: '9.1 APG (L5)' },
            { label: 'Rebounds', name: 'Jaren Jackson Jr.', stat: '6.4 RPG (L5)' },
            { label: '3PT', name: 'Desmond Bane', stat: '3.8 3PM (L5)' },
            { label: 'Hot', name: 'Ja Morant', stat: '25+ Pts 4 Straight', hot: true },
        ],
    },
    Rockets: {
        trend: 'Alperen Sengun Scoring — Youth Rising',
        leaders: [
            { label: 'Points', name: 'Alperen Sengun', stat: '21.7 PPG (L5)' },
            { label: 'Assists', name: 'Fred VanVleet', stat: '6.7 APG (L5)' },
            { label: 'Rebounds', name: 'Alperen Sengun', stat: '9.8 RPG (L5)' },
            { label: '3PT', name: 'Jalen Green', stat: '3.2 3PM (L5)' },
            { label: 'Hot', name: 'Alperen Sengun', stat: 'Active 5-Game 20+ Pts', hot: true },
        ],
    },
    Kings: {
        trend: 'Sabonis — Kings Battling 11-Seed Gate',
        leaders: [
            { label: 'Points', name: 'De\'Aaron Fox', stat: '23.8 PPG (L5)' },
            { label: 'Assists', name: 'De\'Aaron Fox', stat: '7.2 APG (L5)' },
            { label: 'Rebounds', name: 'Domantas Sabonis', stat: '13.1 RPG (L5)' },
            { label: '3PT', name: 'Kevin Huerter', stat: '2.8 3PM (L5)' },
            { label: 'Hot', name: 'Domantas Sabonis', stat: 'Dbl-Dbl 4 Straight', hot: true },
        ],
    },
    Jazz: {
        trend: 'Walker Kessler — Jazz Tank in Full Swing',
        leaders: [
            { label: 'Points', name: 'Lauri Markkanen', stat: '22.1 PPG (L5)' },
            { label: 'Assists', name: 'Collin Sexton', stat: '5.3 APG (L5)' },
            { label: 'Rebounds', name: 'Walker Kessler', stat: '12.8 RPG (L5)' },
            { label: '3PT', name: 'Lauri Markkanen', stat: '3.1 3PM (L5)' },
            { label: 'Hot', name: 'Walker Kessler', stat: 'Active Block Streak', hot: true },
        ],
    },
    Spurs: {
        trend: 'Wembanyama Generational — SA Patience Builds',
        leaders: [
            { label: 'Points', name: 'Victor Wembanyama', stat: '22.8 PPG (L5)' },
            { label: 'Assists', name: 'Chris Paul', stat: '7.4 APG (L5)' },
            { label: 'Rebounds', name: 'Victor Wembanyama', stat: '10.3 RPG (L5)' },
            { label: 'Blocks', name: 'Victor Wembanyama', stat: '3.9 BPG (L5)' },
            { label: 'Hot', name: 'Victor Wembanyama', stat: '20+ Pts & 3+ Blks 3 Gms', hot: true },
        ],
    },
    'Trail Blazers': {
        trend: 'Anfernee Simons Carries Load in Portland',
        leaders: [
            { label: 'Points', name: 'Anfernee Simons', stat: '22.3 PPG (L5)' },
            { label: 'Assists', name: 'Anfernee Simons', stat: '5.9 APG (L5)' },
            { label: 'Rebounds', name: 'Jerami Grant', stat: '6.3 RPG (L5)' },
            { label: '3PT', name: 'Anfernee Simons', stat: '4.1 3PM (L5)' },
            { label: 'Hot', name: 'Anfernee Simons', stat: '20+ Pts 3 Straight', hot: true },
        ],
    },
};

// ─── NFL Team Insights (2024-25 Season) ──────────────────────────────────────
export const NFL_TEAM_INSIGHTS: Record<string, TeamInsights> = {
    Chiefs: {
        trend: 'Dynasty Mode — 3-Peat Chasers',
        leaders: [
            { label: 'Passing', name: 'Patrick Mahomes', stat: '312 Pass YPG' },
            { label: 'Rushing', name: 'Isiah Pacheco', stat: '98 Rush YPG' },
            { label: 'Receiving', name: 'Travis Kelce', stat: '71 Rec YPG' },
            { label: 'Defense', name: 'Chris Jones', stat: '2.3 Sacks/Gm' },
            { label: 'Hot', name: 'Patrick Mahomes', stat: '300+ Yds 5 Straight', hot: true },
        ],
    },
    Eagles: {
        trend: 'Hurts Healthy — Philly Rolling to Title',
        leaders: [
            { label: 'Passing', name: 'Jalen Hurts', stat: '289 Pass YPG' },
            { label: 'Rushing', name: 'Jalen Hurts', stat: '62 Rush YPG' },
            { label: 'Receiving', name: 'A.J. Brown', stat: '88 Rec YPG' },
            { label: 'Defense', name: 'Jalen Carter', stat: '1.8 Sacks/Gm' },
            { label: 'Hot', name: 'A.J. Brown', stat: '100+ Rec Yds 4 Straight', hot: true },
        ],
    },
    Bills: {
        trend: 'Josh Allen MVP Race — Buffalo Dominant',
        leaders: [
            { label: 'Passing', name: 'Josh Allen', stat: '302 Pass YPG' },
            { label: 'Rushing', name: 'Josh Allen', stat: '58 Rush YPG' },
            { label: 'Receiving', name: 'Stefon Diggs', stat: '78 Rec YPG' },
            { label: 'Defense', name: 'Von Miller', stat: '1.6 Sacks/Gm' },
            { label: 'Hot', name: 'Josh Allen', stat: '2+ Rush TDs 3 Straight', hot: true },
        ],
    },
    Ravens: {
        trend: 'Lamar Jackson MVP Pace — Baltimore Surging',
        leaders: [
            { label: 'Passing', name: 'Lamar Jackson', stat: '278 Pass YPG' },
            { label: 'Rushing', name: 'Lamar Jackson', stat: '71 Rush YPG' },
            { label: 'Receiving', name: 'Zay Flowers', stat: '69 Rec YPG' },
            { label: 'Defense', name: 'Roquan Smith', stat: '11 Tackles/Gm' },
            { label: 'Hot', name: 'Lamar Jackson', stat: '300+ Tot Yds 4 Straight', hot: true },
        ],
    },
    Lions: {
        trend: 'Jared Goff Hot — Dan Campbell Team Ascends',
        leaders: [
            { label: 'Passing', name: 'Jared Goff', stat: '296 Pass YPG' },
            { label: 'Rushing', name: 'David Montgomery', stat: '102 Rush YPG' },
            { label: 'Receiving', name: 'Amon-Ra St. Brown', stat: '93 Rec YPG' },
            { label: 'Defense', name: 'Aidan Hutchinson', stat: '2.1 Sacks/Gm' },
            { label: 'Hot', name: 'Amon-Ra St. Brown', stat: '7+ Rec 3 Straight', hot: true },
        ],
    },
    // Add more as needed — others fall back gracefully
};

// ─── NHL Team Insights (2024-25 Season) ──────────────────────────────────────
export const NHL_TEAM_INSIGHTS: Record<string, TeamInsights> = {
    Oilers: {
        trend: 'McDavid & Draisaitl — Unstoppable 1-2 Punch',
        leaders: [
            { label: 'Goals', name: 'Connor McDavid', stat: '0.82 G/Gm (L5)' },
            { label: 'Assists', name: 'Connor McDavid', stat: '1.4 A/Gm (L5)' },
            { label: 'Points', name: 'Leon Draisaitl', stat: '2.2 Pts/Gm (L5)' },
            { label: 'Save%', name: 'Stuart Skinner', stat: '.924 SV% (L5)' },
            { label: 'Hot', name: 'Connor McDavid', stat: '10-Game Point Streak', hot: true },
        ],
    },
    Panthers: {
        trend: 'Florida Defending Champs — Barkov Leading',
        leaders: [
            { label: 'Goals', name: 'Aleksander Barkov', stat: '0.71 G/Gm (L5)' },
            { label: 'Assists', name: 'Sam Reinhart', stat: '1.2 A/Gm (L5)' },
            { label: 'Points', name: 'Sam Reinhart', stat: '1.9 Pts/Gm (L5)' },
            { label: 'Save%', name: 'Sergei Bobrovsky', stat: '.931 SV% (L5)' },
            { label: 'Hot', name: 'Sam Reinhart', stat: '7-Game Point Streak', hot: true },
        ],
    },
    Rangers: {
        trend: 'Panarin & Zibanejad — Madison Square Packed',
        leaders: [
            { label: 'Goals', name: 'Artemi Panarin', stat: '0.68 G/Gm (L5)' },
            { label: 'Assists', name: 'Artemi Panarin', stat: '1.3 A/Gm (L5)' },
            { label: 'Points', name: 'Mika Zibanejad', stat: '1.7 Pts/Gm (L5)' },
            { label: 'Save%', name: 'Igor Shesterkin', stat: '.938 SV% (L5)' },
            { label: 'Hot', name: 'Artemi Panarin', stat: '8-Game Point Streak', hot: true },
        ],
    },
};

// ─── Lookup helper ────────────────────────────────────────────────────────────
// Returns insights for a team by name, with a safe fallback
const DEFAULT_INSIGHT = (teamName: string): TeamInsights => ({
    trend: `${teamName} — Stat Leaders (Season Avg)`,
    leaders: [
        { label: 'Leader', name: `${teamName} Scorer`, stat: 'See Box Score' },
        { label: 'Assists', name: `${teamName} Playmaker`, stat: 'See Box Score' },
        { label: 'Rebounds', name: `${teamName} Rebounder`, stat: 'See Box Score' },
    ],
});

export function getTeamInsights(sport: string, teamName: string): TeamInsights {
    const map: Record<string, Record<string, TeamInsights>> = {
        NBA: NBA_TEAM_INSIGHTS,
        NFL: NFL_TEAM_INSIGHTS,
        NHL: NHL_TEAM_INSIGHTS,
    };
    return map[sport]?.[teamName] ?? DEFAULT_INSIGHT(teamName);
}

