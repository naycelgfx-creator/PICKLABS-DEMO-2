export interface ShotData {
    id: string;
    x: number; // 0-100 percentage for court width
    y: number; // 0-100 percentage for court height
    isMade: boolean;
    quarter: number;
    playType: 'Jump Shot' | 'Layup' | 'Dunk' | 'Three Pointer';
    teamId: 'home' | 'away';
}

export interface NbaNews {
    id: string;
    headline: string;
    date: string;
    source: string;
}

export interface NbaStanding {
    rank: number;
    team: string;
    wins: number;
    losses: number;
    gb: string;
}

export const generateMockShotData = (shotCount: number): ShotData[] => {
    return Array.from({ length: shotCount }).map((_, i) => {
        const teamId: 'home' | 'away' = Math.random() > 0.5 ? 'home' : 'away';
        const isPaint = Math.random() > 0.6;
        let x, y, playType: ShotData['playType'];

        if (isPaint) {
            x = 40 + Math.random() * 20;
            if (teamId === 'home') {
                // Home shoots at top hoop (y: 0-30 approximately in court percentage)
                y = 5 + Math.random() * 15;
            } else {
                // Away shoots at bottom hoop (y: 70-100 approximately)
                y = 80 + Math.random() * 15;
            }
            playType = Math.random() > 0.5 ? 'Layup' : 'Dunk';
        } else {
            x = 10 + Math.random() * 80;
            if (teamId === 'home') {
                // Home perimeter (y: 20-45)
                y = 20 + Math.random() * 25;
            } else {
                // Away perimeter (y: 55-80)
                y = 55 + Math.random() * 25;
            }

            // Just roughly guess playType based on distance
            if (teamId === 'home') {
                playType = y > 35 || x < 15 || x > 85 ? 'Three Pointer' : 'Jump Shot';
            } else {
                playType = y < 65 || x < 15 || x > 85 ? 'Three Pointer' : 'Jump Shot';
            }
        }

        return {
            id: `shot-${i}`,
            x,
            y,
            isMade: Math.random() > (playType === 'Three Pointer' ? 0.65 : 0.4),
            quarter: Math.floor(Math.random() * 4) + 1,
            playType,
            teamId
        };
    });
};

export const getMockNbaNews = (awayTeam: string, homeTeam: string): NbaNews[] => {
    return [
        { id: '1', headline: `${homeTeam} look to extend their dominant home win streak tonight.`, date: '2h ago', source: 'NBA.com/News' },
        { id: '2', headline: `Injury Report: Star player for ${awayTeam} listed as questionable.`, date: '4h ago', source: 'NBA.com/Injuries' },
        { id: '3', headline: `Breaking down the massive playoff implications for ${homeTeam} vs ${awayTeam}.`, date: '5h ago', source: 'NBA.com/Analysis' },
        { id: '4', headline: `League sources say ${awayTeam} exploring trade options before deadline.`, date: '1d ago', source: 'NBA.com/Rumors' },
        { id: '5', headline: `How the 2025-2026 rule changes are impacting the ${homeTeam} offense.`, date: '1d ago', source: 'NBA.com/Features' }
    ];
};

export const generateMockStandings = (activeTeam1: string, activeTeam2: string): NbaStanding[] => {
    const teams = [activeTeam1, activeTeam2, 'Thunder', 'Timberwolves', 'Clippers', 'Mavericks', 'Pelicans', 'Kings', 'Pacers', 'Bucks'];
    let wins = 45;

    return teams.map((team, idx) => {
        wins -= Math.floor(Math.random() * 3);
        const losses = 82 - wins;
        return {
            rank: idx + 1,
            team,
            wins,
            losses,
            gb: idx === 0 ? '-' : (teams[0] !== team ? (Math.random() * 5 + 1).toFixed(1) : '-')
        };
    }).sort((a, b) => b.wins - a.wins).map((t, idx) => ({ ...t, rank: idx + 1 }));
};
