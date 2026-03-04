import { useEffect, useState, useCallback } from 'react';
import { fetchESPNTeamInfo, ESPNTeamInfo } from './espnTeams';

export const useESPNTeamInfo = (teamName: string, sport: string) => {
    const [info, setInfo] = useState<ESPNTeamInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchESPNTeamInfo(teamName, sport);
            setInfo(data);
            if (!data) setError('No team info found');
        } catch {
            setError('Failed to load team info');
        } finally {
            setLoading(false);
        }
    }, [teamName, sport]);

    useEffect(() => { load(); }, [load]);

    return { info, loading, error, refetch: load };
};
