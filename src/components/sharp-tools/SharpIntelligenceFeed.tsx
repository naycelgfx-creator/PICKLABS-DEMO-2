import React, { useEffect, useState } from 'react';
import { fetchMultiSportNews, ESPNNewsItem, timeAgo, CATEGORY_CONFIG } from '../../data/espnNews';

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'CFB', 'NCAAW'];

export const SharpIntelligenceFeed: React.FC = () => {
    const [news, setNews] = useState<ESPNNewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            const data = await fetchMultiSportNews(SPORTS);
            if (!cancelled) {
                setNews(data.slice(0, 12));
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 120_000);
        return () => { cancelled = true; clearInterval(interval); };
    }, []);

    return (
        <div className="col-span-12 lg:col-span-4">
            <div className="terminal-panel h-full overflow-hidden flex flex-col border-accent-purple/20">
                {/* Header */}
                <div className="p-4 border-b border-border-muted bg-neutral-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-accent-purple">rss_feed</span>
                        <div>
                            <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em]">PickLabs Intelligence Feed</h3>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Live · Auto-refreshes every 2 min</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-slate-600' : 'bg-red-500 animate-pulse'}`}></span>
                        <span className="text-[8px] text-slate-600 font-bold uppercase">{loading ? 'Loading' : 'Live'}</span>
                    </div>
                </div>

                {/* Feed */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar max-h-[280px]">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="p-3 bg-neutral-800/30 rounded animate-pulse">
                                <div className="h-2 bg-neutral-700 rounded w-1/3 mb-2"></div>
                                <div className="h-3 bg-neutral-700 rounded w-full mb-1"></div>
                                <div className="h-3 bg-neutral-700 rounded w-4/5"></div>
                            </div>
                        ))
                    ) : news.length === 0 ? (
                        <div className="text-center py-6 text-slate-600 text-xs">No news available</div>
                    ) : (
                        news.map((item, i) => {
                            const cfg = CATEGORY_CONFIG[item.category];
                            const borderColor = item.category === 'injury' ? 'border-red-500' :
                                item.category === 'trade' ? 'border-blue-500' :
                                    item.category === 'game-preview' ? 'border-primary' : 'border-slate-600';

                            return (
                                <div
                                    key={item.id || i}
                                    className={`p-3 bg-neutral-800/30 border-l-2 ${borderColor} rounded-r flex gap-3 group hover:bg-neutral-800/50 transition-colors cursor-pointer`}
                                    onClick={() => item.link && window.open(item.link, '_blank', 'noopener')}
                                >
                                    <div className="flex-shrink-0 pt-0.5">
                                        <span className={`material-symbols-outlined text-base ${cfg.color.split(' ')[0]}`}>{cfg.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1 gap-2">
                                            <span className={`text-[8px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded border ${cfg.color}`}>
                                                {item.sport} · {cfg.label}
                                            </span>
                                            <span className="text-[8px] text-slate-600 font-bold shrink-0">{timeAgo(item.published)}</span>
                                        </div>
                                        <p className="text-[11px] text-text-main leading-snug font-medium line-clamp-2">
                                            {item.headline}
                                        </p>
                                        {item.description && (
                                            <p className="text-[9px] text-slate-600 mt-1 line-clamp-1">{item.description}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <a
                    href="https://www.espn.com/nba/news"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-neutral-800/80 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-colors border-t border-border-muted flex items-center justify-center gap-1"
                >
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    PickLabs News Coverage
                </a>
            </div>
        </div>
    );
};
