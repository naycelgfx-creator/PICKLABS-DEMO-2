export interface RecordSplit {
    category: string;
    awayRecord: string;
    homeRecord: string;
    awayWinPct: number;
    homeWinPct: number;
}

const generateRecord = (gamesToPlay: number, drawChance: number = 0): { record: string, winPct: number } => {
    const draws = Math.floor(Math.random() * (gamesToPlay * drawChance));
    const remainingGames = gamesToPlay - draws;
    const wins = Math.floor(Math.random() * remainingGames * 0.8) + Math.floor(remainingGames * 0.1); // Avoid 0 wins or all wins usually
    const losses = remainingGames - wins;

    let recordStr = `${wins}-${losses}`;
    if (drawChance > 0) {
        recordStr += `-${draws}`;
    }

    const winPct = gamesToPlay > 0 ? wins / gamesToPlay : 0;

    return { record: recordStr, winPct };
};

export const generateMatchupRecords = (sport: string): RecordSplit[] => {
    const isBasketball = sport === 'NBA' || sport === 'NCAAM' || sport === 'WNBA';
    const isFootball = sport === 'NFL' || sport === 'NCAAF';
    const isSoccer = sport === 'Soccer';
    const isHockey = sport === 'NHL';

    const drawChance = isSoccer ? 0.3 : isHockey || isFootball ? 0.05 : 0;
    const totalGames = isBasketball && sport === 'NBA' ? 82 : isFootball && sport === 'NFL' ? 17 : isSoccer ? 38 : 162;
    const playedGames = Math.max(10, Math.floor(Math.random() * (totalGames * 0.8)));

    const createSplit = (category: string, awayGames: number, homeGames: number, dChance: number = drawChance): RecordSplit => {
        const away = generateRecord(awayGames, dChance);
        const home = generateRecord(homeGames, dChance);
        return {
            category,
            awayRecord: away.record,
            awayWinPct: away.winPct,
            homeRecord: home.record,
            homeWinPct: home.winPct
        };
    };

    const records: RecordSplit[] = [
        createSplit('Overall', playedGames, playedGames),
        createSplit('Home', Math.floor(playedGames / 2), Math.floor(playedGames / 2)),
        createSplit('Away', Math.floor(playedGames / 2), Math.floor(playedGames / 2)),
        createSplit(isSoccer ? 'League' : 'Conference', Math.floor(playedGames * 0.6), Math.floor(playedGames * 0.6)),
        createSplit(isSoccer ? 'Cup' : 'Division', Math.floor(playedGames * 0.3), Math.floor(playedGames * 0.3)),
    ];

    if (isBasketball || isFootball || isHockey) {
        records.push(
            createSplit('Atlantic', Math.floor(playedGames * 0.15), Math.floor(playedGames * 0.15)),
            createSplit('Central', Math.floor(playedGames * 0.15), Math.floor(playedGames * 0.15)),
            createSplit('Northwest', Math.floor(playedGames * 0.15), Math.floor(playedGames * 0.15)),
            createSplit('Pacific', Math.floor(playedGames * 0.15), Math.floor(playedGames * 0.15)),
            createSplit('Southeast', Math.floor(playedGames * 0.15), Math.floor(playedGames * 0.15)),
            createSplit('Southwest', Math.floor(playedGames * 0.15), Math.floor(playedGames * 0.15)),
        );
    }

    if (isBasketball || isFootball) {
        records.push(
            createSplit('1Q', playedGames, playedGames, isBasketball ? 0.05 : 0.1), // Quarter betting often has ties (pushes)
            createSplit('2Q', playedGames, playedGames, isBasketball ? 0.05 : 0.1),
            createSplit('1H', playedGames, playedGames, isBasketball ? 0.02 : 0.05),
            createSplit('3Q', playedGames, playedGames, isBasketball ? 0.05 : 0.1),
            createSplit('4Q', playedGames, playedGames, isBasketball ? 0.05 : 0.1),
            createSplit('2H', playedGames, playedGames, isBasketball ? 0.02 : 0.05)
        );
    }

    if (isHockey) {
        records.push(
            createSplit('1st Period', playedGames, playedGames, 0.2),
            createSplit('2nd Period', playedGames, playedGames, 0.2),
            createSplit('3rd Period', playedGames, playedGames, 0.2),
        );
    }

    return records;
};
