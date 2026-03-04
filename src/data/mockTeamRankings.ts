export interface StatComparison {
    statName: string;
    awayAvg: string;
    awayRank: string;
    homeAvg: string;
    homeRank: string;
    isAwayAdvantage: boolean;
}

const generateRank = (baseRank: number, variance: number = 5): string => {
    let rank = baseRank + Math.floor(Math.random() * variance * 2) - variance;
    if (rank < 1) rank = 1;
    if (rank > 32) rank = 32;

    // Add ties randomly
    const isTie = Math.random() > 0.8;
    const prefix = isTie ? 'T' : '';

    let suffix = 'th';
    if (rank === 1 || rank === 21 || rank === 31) suffix = 'st';
    else if (rank === 2 || rank === 22 || rank === 32) suffix = 'nd';
    else if (rank === 3 || rank === 23) suffix = 'rd';

    return `${prefix}${rank}${suffix}`;
};

const compareRanks = (awayRankStr: string, homeRankStr: string): boolean => {
    const aNum = parseInt(awayRankStr.replace(/\D/g, ''));
    const hNum = parseInt(homeRankStr.replace(/\D/g, ''));
    return aNum < hNum; // Lower rank is better (advantage)
};

export const generateTeamRankings = (): StatComparison[] => {
    // Default metrics based on user's NBA sample
    return [
        {
            statName: "Effective Field Goal %",
            awayAvg: (52.0 + Math.random() * 6).toFixed(1),
            awayRank: generateRank(10),
            homeAvg: (52.0 + Math.random() * 6).toFixed(1),
            homeRank: generateRank(12),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Turnover %",
            awayAvg: (12.0 + Math.random() * 5).toFixed(1),
            awayRank: generateRank(8),
            homeAvg: (12.0 + Math.random() * 5).toFixed(1),
            homeRank: generateRank(15),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Offensive Rebound %",
            awayAvg: (25.0 + Math.random() * 8).toFixed(1),
            awayRank: generateRank(14),
            homeAvg: (25.0 + Math.random() * 8).toFixed(1),
            homeRank: generateRank(18),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Free Throw Rate",
            awayAvg: (0.220 + Math.random() * 0.08).toFixed(3),
            awayRank: generateRank(20),
            homeAvg: (0.220 + Math.random() * 0.08).toFixed(3),
            homeRank: generateRank(16),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Points",
            awayAvg: (110.0 + Math.random() * 12).toFixed(1),
            awayRank: generateRank(12),
            homeAvg: (110.0 + Math.random() * 12).toFixed(1),
            homeRank: generateRank(14),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Field Goal %",
            awayAvg: (45.0 + Math.random() * 5).toFixed(1),
            awayRank: generateRank(9),
            homeAvg: (45.0 + Math.random() * 5).toFixed(1),
            homeRank: generateRank(10),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "2-Point %",
            awayAvg: (51.0 + Math.random() * 6).toFixed(1),
            awayRank: generateRank(11),
            homeAvg: (51.0 + Math.random() * 6).toFixed(1),
            homeRank: generateRank(8),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "3-Point %",
            awayAvg: (34.0 + Math.random() * 6).toFixed(1),
            awayRank: generateRank(15),
            homeAvg: (34.0 + Math.random() * 6).toFixed(1),
            homeRank: generateRank(20),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Free Throws %",
            awayAvg: (75.0 + Math.random() * 8).toFixed(1),
            awayRank: generateRank(18),
            homeAvg: (75.0 + Math.random() * 8).toFixed(1),
            homeRank: generateRank(12),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Rebounds",
            awayAvg: (41.0 + Math.random() * 8).toFixed(1),
            awayRank: generateRank(14),
            homeAvg: (41.0 + Math.random() * 8).toFixed(1),
            homeRank: generateRank(14),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Blocks",
            awayAvg: (4.0 + Math.random() * 3).toFixed(1),
            awayRank: generateRank(10),
            homeAvg: (4.0 + Math.random() * 3).toFixed(1),
            homeRank: generateRank(16),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Steals",
            awayAvg: (6.5 + Math.random() * 3).toFixed(1),
            awayRank: generateRank(6),
            homeAvg: (6.5 + Math.random() * 3).toFixed(1),
            homeRank: generateRank(10),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Assist-to-Turnover Ratio",
            awayAvg: (1.5 + Math.random() * 1).toFixed(1),
            awayRank: generateRank(8),
            homeAvg: (1.5 + Math.random() * 1).toFixed(1),
            homeRank: generateRank(12),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Pace Factor",
            awayAvg: (96.0 + Math.random() * 6).toFixed(1),
            awayRank: generateRank(15),
            homeAvg: (96.0 + Math.random() * 6).toFixed(1),
            homeRank: generateRank(18),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Points in Paint",
            awayAvg: (42.0 + Math.random() * 10).toFixed(1),
            awayRank: generateRank(12),
            homeAvg: (42.0 + Math.random() * 10).toFixed(1),
            homeRank: generateRank(14),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "Fast Break Points",
            awayAvg: (12.0 + Math.random() * 6).toFixed(1),
            awayRank: generateRank(16),
            homeAvg: (12.0 + Math.random() * 6).toFixed(1),
            homeRank: generateRank(14),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "2nd Chance Pts",
            awayAvg: (12.0 + Math.random() * 5).toFixed(1),
            awayRank: generateRank(10),
            homeAvg: (12.0 + Math.random() * 5).toFixed(1),
            homeRank: generateRank(12),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        },
        {
            statName: "True Shooting %",
            awayAvg: (55.0 + Math.random() * 6).toFixed(1),
            awayRank: generateRank(11),
            homeAvg: (55.0 + Math.random() * 6).toFixed(1),
            homeRank: generateRank(13),
            get isAwayAdvantage() { return compareRanks(this.awayRank, this.homeRank); }
        }
    ];
};
