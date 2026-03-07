import { useState, useEffect } from 'react';
import { SPORTS } from '../data/mockGames';
import { APP_SPORT_TO_ESPN, ESPN_SCOREBOARD_URLS, SportKey } from '../data/espnScoreboard';

// Cache to prevent re-fetching the same date multiple times across remounts
const cache: Record<string, Record<string, boolean>> = {};

export const useActiveSports = (date: string) => {
    const [activeSports, setActiveSports] = useState<Record<string, boolean>>(cache[date] || {});
    const [loading, setLoading] = useState(!cache[date]);

    useEffect(() => {
        if (cache[date]) {
            setActiveSports(cache[date]);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const checkSports = async () => {
            setLoading(true);
            const statusMap: Record<string, boolean> = {};

            // Default all to true just in case they fail, so we don't accidentally hide them
            SPORTS.forEach(s => statusMap[s] = true);

            const fetchPromises = SPORTS.map(async (sport) => {
                const espnKey = APP_SPORT_TO_ESPN[sport] as SportKey | undefined;
                if (!espnKey) return;

                const urlBase = ESPN_SCOREBOARD_URLS[espnKey] || ESPN_SCOREBOARD_URLS[sport as SportKey];
                if (!urlBase) return;

                const formattedDate = date.replace(/-/g, '');
                const url = `${urlBase}?dates=${formattedDate}`;

                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error('Failed');
                    const data = await res.json();

                    // Consider a sport active if it has events scheduled for the day
                    const hasGames = data.events && data.events.length > 0;
                    statusMap[sport] = hasGames;
                } catch {
                    // On error, assume active so we don't accidentally hide it
                    statusMap[sport] = true;
                }
            });

            await Promise.allSettled(fetchPromises);

            if (!cancelled) {
                cache[date] = statusMap;
                setActiveSports(statusMap);
                setLoading(false);
            }
        };

        checkSports();

        return () => {
            cancelled = true;
        };
    }, [date]);

    return { activeSports, loading };
};
