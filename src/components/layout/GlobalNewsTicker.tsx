import React, { useEffect, useState, useRef } from 'react';
import { fetchMultiSportNews, ESPNNewsItem } from '../../data/espnNews';

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer'];
const REFRESH_MS = 120_000;

const CATEGORY_TAG_COLORS: Record<string, string> = {
    injury: 'text-red-400',
    trade: 'text-blue-400',
    'game-preview': 'text-primary',
    general: 'text-slate-400',
};

export const GlobalNewsTicker: React.FC = () => {
    const [items, setItems] = useState<ESPNNewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchNews = async () => {
        try {
            const news = await fetchMultiSportNews(SPORTS);
            if (news.length > 0) setItems(news);
        } catch {
            // keep existing items on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
        intervalRef.current = setInterval(fetchNews, REFRESH_MS);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const tickerItems: { sport: string; category: string; text: string }[] = items.slice(0, 30).map(item => ({
        sport: item.sport,
        category: item.category,
        text: item.headline,
    }));

    const fallback = [
        { sport: 'PickLabs', category: 'general', text: 'Loading live sports news feed...' },
    ];

    const displayItems = loading || tickerItems.length === 0 ? fallback : tickerItems;

    return (
        <div className="w-full bg-neutral-900/90 border-t border-border-muted overflow-hidden h-9 flex items-center">
            {/* PickLabs Tag */}
            <div className="flex items-center shrink-0 px-3 h-full border-r border-border-muted bg-primary/90">
                <span className="text-black text-[10px] font-black tracking-widest uppercase">PickLabs News</span>
            </div>

            <div className="relative flex-1 h-full overflow-hidden flex items-center group">
                <div className={`w-max flex ${loading ? '' : 'animate-news-ticker'} group-hover:[animation-play-state:paused]`}>
                    {/* First pass */}
                    <div className="flex shrink-0 items-center">
                        {displayItems.map((item, i) => (
                            <React.Fragment key={i}>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 ${CATEGORY_TAG_COLORS[item.category] ?? 'text-slate-400'}`}>
                                    [{item.sport}]
                                </span>
                                <span className="text-xs text-text-muted font-medium px-4 whitespace-nowrap">{item.text}</span>
                                <span className="text-[10px] text-primary font-black shrink-0 flex items-center">•</span>
                            </React.Fragment>
                        ))}
                    </div>
                    {/* Duplicate for seamless loop */}
                    <div className="flex shrink-0 items-center">
                        {displayItems.map((item, i) => (
                            <React.Fragment key={`d-${i}`}>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 ${CATEGORY_TAG_COLORS[item.category] ?? 'text-slate-400'}`}>
                                    [{item.sport}]
                                </span>
                                <span className="text-xs text-text-muted font-medium px-4 whitespace-nowrap">{item.text}</span>
                                <span className="text-[10px] text-primary font-black shrink-0 flex items-center">•</span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-3 shrink-0 border-l border-border-muted h-full">
                <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-slate-600' : 'bg-red-500 animate-pulse'}`}></span>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{loading ? 'Loading' : 'Live'}</span>
            </div>
        </div>
    );
};
