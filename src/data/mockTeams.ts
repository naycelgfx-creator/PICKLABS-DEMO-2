export interface TeamInsight {
    record: string;
    standing: string;
    streak: string;
    last10: string;
    homeRecord: string;
    awayRecord: string;
    pointsFor: number;
    pointsAgainst: number;
    differential: number;
    headCoach: string;
    stadium: string;
    championships: number;
    founded: number;
    injuries: { player: string; status: string; returnDate: string }[];
    recentForm: ('W' | 'L' | 'D')[];
}

const FIRST_NAMES = ['James', 'Michael', 'Robert', 'David', 'William', 'John', 'Thomas', 'Kevin', 'Jason', 'Matthew', 'Alex', 'Chris'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

export const generateMockTeamInsight = (teamName: string, sport: string): TeamInsight => {
    // Generate logical mock data based on sport
    const isSoccer = sport === 'Soccer';
    const isFootball = sport === 'NFL';
    const isBaseball = sport === 'MLB';
    const isHockey = sport === 'NHL';

    const maxGames = isBaseball ? 162 : isHockey || sport === 'NBA' ? 82 : isFootball ? 17 : 38;
    const gamesPlayed = Math.floor(Math.random() * (maxGames / 2)) + (maxGames / 3);

    const wins = Math.floor(Math.random() * gamesPlayed);
    let losses = Math.floor(gamesPlayed - wins);
    let draws = 0;

    if (isSoccer || isHockey) {
        draws = Math.floor(Math.random() * (losses / 2));
        losses = Math.floor(losses - draws);
    }

    const record = isSoccer || isHockey ? `${wins}-${losses}-${draws}` : `${wins}-${losses}`;
    const winPct = wins / gamesPlayed;

    let standingRank = Math.floor(Math.random() * 15) + 1;
    if (winPct > 0.6) standingRank = Math.floor(Math.random() * 3) + 1;
    if (winPct < 0.4) standingRank = Math.floor(Math.random() * 5) + 10;

    const standing = `${standingRank}${standingRank === 1 ? 'st' : standingRank === 2 ? 'nd' : standingRank === 3 ? 'rd' : 'th'} in ${isSoccer ? 'League' : 'Conference'}`;

    const currentStreakCount = Math.floor(Math.random() * 5) + 1;
    const streakType = Math.random() > 0.5 ? 'W' : 'L';
    const streak = `${streakType}${currentStreakCount}`;

    const l10Wins = Math.floor(Math.random() * 10);
    const l10Losses = 10 - l10Wins;
    const last10 = `${l10Wins}-${l10Losses}`;

    const homeWins = Math.floor(wins * 0.6);
    const homeLosses = Math.floor(losses * 0.4);
    const homeRecord = `${homeWins}-${homeLosses}`;

    const awayWins = Math.floor(wins - homeWins);
    const awayLosses = Math.floor(losses - homeLosses);
    const awayRecord = `${awayWins}-${awayLosses}`;

    // Scoring parameters
    const ptsBase = sport === 'NBA' ? 110 : isFootball ? 22 : isBaseball ? 4.5 : isHockey || isSoccer ? 2.5 : 75;
    const ptsVar = ptsBase * 0.15;

    const pointsFor = +(ptsBase + (Math.random() * ptsVar * 2 - ptsVar)).toFixed(1);
    const pointsAgainst = +(ptsBase + (Math.random() * ptsVar * 2 - ptsVar)).toFixed(1);
    const differential = +(pointsFor - pointsAgainst).toFixed(1);

    const coachName = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
    const stadium = `${teamName} ${isSoccer ? 'Stadium' : isBaseball ? 'Park' : 'Arena'}`;

    const injuries = Array.from({ length: Math.floor(Math.random() * 4) }).map(() => ({
        player: `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)].charAt(0)}. ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`,
        status: Math.random() > 0.5 ? 'Day-to-Day' : Math.random() > 0.5 ? 'Questionable' : 'Out',
        returnDate: Math.random() > 0.5 ? 'Next Game' : '1-2 Weeks'
    }));

    const recentForm: ('W' | 'L' | 'D')[] = Array.from({ length: 5 }).map(() => {
        const rand = Math.random();
        if (isSoccer || isHockey) return rand > 0.5 ? 'W' : rand > 0.8 ? 'D' : 'L';
        return rand > 0.5 ? 'W' : 'L';
    });

    return {
        record,
        standing,
        streak,
        last10,
        homeRecord,
        awayRecord,
        pointsFor,
        pointsAgainst,
        differential,
        headCoach: coachName,
        stadium,
        championships: Math.floor(Math.random() * 6),
        founded: Math.floor(Math.random() * 60) + 1920,
        injuries,
        recentForm
    };
};
