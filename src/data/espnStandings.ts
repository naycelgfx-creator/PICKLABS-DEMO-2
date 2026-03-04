// espnStandings.ts

export interface ESPNStandingsStat {
    name: string;
    displayValue: string;
    value: number | null;
}

export interface ESPNStandingsTeam {
    id: string;
    uid: string;
    location: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    isActive: boolean;
    logos: { href: string }[];
}

export interface ESPNStandingsEntry {
    team: ESPNStandingsTeam;
    stats: ESPNStandingsStat[];
}

export interface ESPNStandingsGroup {
    id: string;
    name: string;
    standings: {
        entries: ESPNStandingsEntry[];
    };
}

export const fetchStandings = async (sport: string, league: string): Promise<ESPNStandingsGroup[]> => {
    try {
        const url = `https://site.api.espn.com/apis/v2/sports/${sport}/${league}/standings`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch standings for ${sport}/${league}`);
        const data = await res.json();

        // The exact path depends on the sport. Usually it's in data.children (conferences -> divisions).
        // Let's grab children if they exist, otherwise try to fall back.
        if (data.children && data.children.length > 0) {
            return data.children as ESPNStandingsGroup[];
        }

        // If there are no children, it might be a flat standings structure under data.standings
        if (data.standings && data.standings.entries) {
            return [{
                id: '0',
                name: 'Overall',
                standings: data.standings
            }];
        }

        return [];
    } catch (err) {
        console.error(`Error fetching standings for ${sport}/${league}:`, err);
        return [];
    }
};

// Helper function to pull a generic stat from the entry safely
export const getStatValue = (stats: ESPNStandingsStat[], statName: string): string => {
    const stat = stats.find(s => s.name === statName);
    return stat?.displayValue || '-';
};
