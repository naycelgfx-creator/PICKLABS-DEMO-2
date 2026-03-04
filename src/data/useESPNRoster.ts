import { useEffect, useState, useCallback } from 'react';
import { fetchESPNRosterBySport, ESPNRosterAthlete } from './espnService';
import { getWBCRoster } from './mlbStatsService';
import { getApiSportsRoster, getApiSportsMMAFighters, SPORTS_WITH_API_SPORTS } from './apiSportsService';

export const useESPNRoster = (teamName: string, sport: string) => {
    const [players, setPlayers] = useState<ESPNRosterAthlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let data: ESPNRosterAthlete[] = [];

            if (sport === 'WBC') {
                const wbcData = await getWBCRoster(teamName);
                // Map WBC player to ESPNRosterAthlete format used by components
                data = wbcData.map(p => {
                    const parts = p.displayName.split(' ');
                    const firstName = parts[0] || '';
                    const lastName = parts.slice(1).join(' ') || '';

                    return {
                        id: String(p.id),
                        fullName: p.displayName,
                        displayName: p.displayName,
                        shortName: p.displayName,
                        firstName,
                        lastName,
                        position: { abbreviation: p.position, displayName: p.position },
                        jersey: p.jersey,
                        headshot: p.headshot,
                        photoUrl: p.headshot || '',
                        status: p.status,
                        collegeName: 'N/A', // Not supported in WBC
                        age: undefined,
                        displayHeight: undefined,
                        displayWeight: undefined,
                        experience: undefined,
                    };
                }) as unknown as ESPNRosterAthlete[];
            } else if (sport === 'UFC') {
                data = await getApiSportsMMAFighters();
            } else if (SPORTS_WITH_API_SPORTS.includes(sport)) {
                data = await getApiSportsRoster(sport, teamName);
            } else {
                data = await fetchESPNRosterBySport(teamName, sport);
            }

            if (data.length === 0) {
                setError('No roster data available');
            } else {
                setPlayers(data);
            }
        } catch {
            setError('Failed to load roster from ESPN');
        } finally {
            setLoading(false);
        }
    }, [teamName, sport]);

    useEffect(() => {
        load();
    }, [load]);

    return { players, loading, error, refetch: load };
};
