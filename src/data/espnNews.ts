// ESPN News API Service — fetches real headlines, injury reports, and game previews
// No API key needed — all public ESPN endpoints

export interface ESPNNewsItem {
    id: string;
    headline: string;
    description: string;
    published: string;       // ISO date string
    sport: string;
    category: string;        // 'injury' | 'trade' | 'game-preview' | 'general'
    link: string;
    image?: string;
    byline?: string;
    teams?: string[];        // team names mentioned
}

type RawObj = Record<string, unknown>;

const ESPN_NEWS_URLS: Record<string, string> = {
    NBA: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=20',
    NFL: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=20',
    MLB: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news?limit=20',
    NHL: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/news?limit=20',
    Soccer: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?limit=20',
    CBB: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news?limit=20',
};

const classifyHeadline = (headline: string): ESPNNewsItem['category'] => {
    const h = headline.toLowerCase();
    if (h.includes('injur') || h.includes('out') || h.includes('doubtful') || h.includes('questionable') || h.includes('scratch') || h.includes('knee') || h.includes('ankle')) return 'injury';
    if (h.includes('trade') || h.includes('sign') || h.includes('waiv') || h.includes('acquir') || h.includes('deal')) return 'trade';
    if (h.includes('preview') || h.includes('tonight') || h.includes('matchup') || h.includes('showdown')) return 'game-preview';
    return 'general';
};

// Parse raw ESPN article into clean shape
const parseArticle = (article: RawObj, sport: string): ESPNNewsItem | null => {
    try {
        const headline = (article.headline as string) ?? '';
        if (!headline) return null;

        const cats = (article.categories as RawObj[]) ?? [];
        const teamNames = cats
            .filter(c => c.type === 'team')
            .map(c => c.description as string)
            .filter(Boolean)
            .slice(0, 2);

        const links = (article.links as RawObj) ?? {};
        const webLink = ((links.web as RawObj)?.href as string) ?? '';

        const imgs = (article.images as RawObj[]) ?? [];
        const image = imgs[0] ? (imgs[0].url as string) : undefined;

        return {
            id: (article.dataSourceIdentifier as string) ?? String(Math.random()),
            headline,
            description: (article.description as string) ?? '',
            published: (article.published as string) ?? new Date().toISOString(),
            sport,
            category: classifyHeadline(headline),
            link: webLink,
            image,
            byline: (article.byline as string) ?? 'ESPN',
            teams: teamNames,
        };
    } catch {
        return null;
    }
};

// Fetch news for a single sport
export const fetchESPNNews = async (sport: string): Promise<ESPNNewsItem[]> => {
    const url = ESPN_NEWS_URLS[sport];
    if (!url) return [];
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json() as RawObj;
        const articles = (data.articles as RawObj[]) ?? [];
        return articles
            .map(a => parseArticle(a, sport))
            .filter((a): a is ESPNNewsItem => a !== null);
    } catch {
        return [];
    }
};

// Fetch news for multiple sports and merge, sorted by date
export const fetchMultiSportNews = async (sports: string[]): Promise<ESPNNewsItem[]> => {
    const results = await Promise.allSettled(sports.map(s => fetchESPNNews(s)));
    const all: ESPNNewsItem[] = results.flatMap(r =>
        r.status === 'fulfilled' ? r.value : []
    );
    // Sort by published date descending
    all.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    return all;
};

// Format time since published
export const timeAgo = (isoDate: string): string => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
};

// Category colors for UI
export const CATEGORY_CONFIG: Record<ESPNNewsItem['category'], { label: string; color: string; icon: string }> = {
    injury: { label: 'Injury', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: 'personal_injury' },
    trade: { label: 'Trade', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: 'swap_horiz' },
    'game-preview': { label: 'Preview', color: 'text-primary bg-primary/10 border-primary/20', icon: 'sports' },
    general: { label: 'News', color: 'text-slate-400 bg-slate-800 border-slate-700', icon: 'newspaper' },
};

// Fetch global ESPN news feed
export const fetchGlobalNews = async (): Promise<ESPNNewsItem[]> => {
    try {
        const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/news');
        if (!res.ok) return [];
        const data = await res.json() as RawObj;
        const articles = (data.articles as RawObj[]) ?? [];
        return articles
            .map(a => parseArticle(a, 'Global'))
            .filter((a): a is ESPNNewsItem => a !== null);
    } catch {
        return [];
    }
};
