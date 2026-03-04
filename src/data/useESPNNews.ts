import { useEffect, useState } from 'react';
import { fetchMultiSportNews, ESPNNewsItem } from './espnNews';

const REFRESH_MS = 120_000;

export const useESPNNews = (sports: string[] = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer']) => {
    const [news, setNews] = useState<ESPNNewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            const data = await fetchMultiSportNews(sports);
            if (!cancelled) {
                setNews(data);
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, REFRESH_MS);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [sports.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

    return { news, loading };
};
