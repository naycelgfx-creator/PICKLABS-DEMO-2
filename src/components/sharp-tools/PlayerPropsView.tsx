import { useState, useMemo, useEffect } from 'react';
export interface ESPNPlayer {
    id: string;
    displayName: string;
    headshot?: string;
    position: string;
    jersey: string;
    status?: string;
}

export async function fetchESPNTeamRoster(teamId: string, sport: string): Promise<ESPNPlayer[]> {
    const ESPN_LEAGUE: Record<string, string> = {
        NBA: 'basketball/nba',
        NFL: 'football/nfl',
        MLB: 'baseball/mlb',
        NHL: 'hockey/nhl',
        NCAAB: 'basketball/mens-college-basketball',
        Soccer: 'soccer/eng.1',
    };
    const league = ESPN_LEAGUE[sport];
    if (!league) return [];
    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${league}/teams/${teamId}/roster`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        const athletes: ESPNPlayer[] = [];
        const groups = json.athletes || [];
        for (const group of groups) {
            for (const item of (group.items || [])) {
                athletes.push({
                    id: item.id,
                    displayName: item.displayName || item.fullName || '',
                    headshot: item.headshot?.href,
                    position: item.position?.abbreviation || '',
                    jersey: item.jersey || '',
                    status: item.status?.type?.name,
                });
            }
        }
        return athletes.slice(0, 20);
    } catch {
        return [];
    }
}

// --- MOCK DATA ---
export interface PlayerProp {
    id: string;
    player: string;
    team: string;
    opponent: string;
    category: string;
    type: 'Over' | 'Under';
    line: number;
    projection: number;
    edge: number;
    confidence: number;
    odds: string;
    isLive: boolean;
    headshot?: string;
    teamLogo?: string;
}


import { useSportContext } from '../../contexts/SportContext';
import { APP_SPORT_TO_ESPN, SportKey, fetchESPNScoreboardByDate } from '../../data/espnScoreboard';
import { OutlierPropChart } from './OutlierPropChart';

const SPORT_CATEGORIES: Record<string, string[]> = {
    NBA: ['Points', 'Rebounds', 'Assists', '3PM', 'Steals', 'Blocks'],
    NFL: ['Pass Yds', 'Rush Yds', 'Rec Yds', 'Pass TDs', 'Rec TDs', 'Receptions'],
    MLB: ['Hits', 'Home Runs', 'RBIs', 'Strikeouts', 'Earned Runs', 'Walks'],
    NHL: ['Goals', 'Assists', 'Points', 'Shots on Goal', 'Saves', 'Power Play Points'],
    WNBA: ['Points', 'Rebounds', 'Assists', '3PM', 'Steals', 'Blocks'],
    'CFB': ['Pass Yds', 'Rush Yds', 'Rec Yds', 'Pass TDs', 'Rec TDs', 'Receptions'],
    'NCAAB': ['Points', 'Rebounds', 'Assists', '3PM', 'Steals', 'Blocks'],
    'NCAAW': ['Points', 'Rebounds', 'Assists', '3PM', 'Steals', 'Blocks'],
};

const DEFAULT_CATEGORIES = ['Points', 'Rebounds', 'Assists'];

export const PlayerPropsView = () => {
    const { activeSport } = useSportContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [confidenceFilter, setConfidenceFilter] = useState<'All' | '70%+' | '80%+'>('All');
    const [sortBy, setSortBy] = useState<'Highest Confidence' | 'Highest Edge' | 'Player Name'>('Highest Confidence');

    const [liveProps, setLiveProps] = useState<PlayerProp[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProp, setSelectedProp] = useState<PlayerProp | null>(null);

    // --- Dynamic Live Prop Generation ---
    useEffect(() => {
        let isMounted = true;

        const buildLiveProps = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch today's games for active sport
                const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');

                // Need to use the correct ESPN mapping
                let espnSport = APP_SPORT_TO_ESPN[activeSport] as SportKey;
                if (!espnSport) espnSport = 'NBA'; // Fallback

                const gamesResponse = await fetchESPNScoreboardByDate(espnSport, todayStr);
                const activeGames = gamesResponse.filter(g => g.status !== 'post'); // Only pre/in games

                if (!activeGames || activeGames.length === 0) {
                    if (isMounted) {
                        setLiveProps([]);
                        setIsLoading(false);
                    }
                    return;
                }

                const generated: PlayerProp[] = [];
                const rosterCache: Record<string, ESPNPlayer[]> = {};

                // Helper to grab a roster (with cache)
                const getRoster = async (teamId: string, sport: string) => {
                    if (rosterCache[teamId]) return rosterCache[teamId];
                    const roster = await fetchESPNTeamRoster(teamId, sport);
                    rosterCache[teamId] = roster;
                    return roster;
                };

                const cats = SPORT_CATEGORIES[activeSport] || DEFAULT_CATEGORIES;

                // Base averages to generate realistic lines per category
                const bases: Record<string, number> = {
                    'Points': 18.5, 'Rebounds': 6.5, 'Assists': 4.5, '3PM': 1.5, 'Steals': 1.0, 'Blocks': 0.8,
                    'Pass Yds': 245.5, 'Rush Yds': 55.5, 'Rec Yds': 60.5, 'Pass TDs': 1.5, 'Rec TDs': 0.5, 'Receptions': 4.5,
                    'Hits': 1.5, 'Home Runs': 0.5, 'RBIs': 0.5, 'Strikeouts': 6.5, 'Earned Runs': 2.5, 'Walks': 1.5,
                    'Goals': 0.5, 'Shots on Goal': 3.5, 'Saves': 28.5, 'Power Play Points': 0.5,
                };

                // 2. Loop games and build props
                await Promise.all(activeGames.map(async (game) => {
                    const homeRoster = await getRoster(game.homeTeam.id, espnSport);
                    const awayRoster = await getRoster(game.awayTeam.id, espnSport);

                    // Select a few notable players from each roster
                    const homeSelects = homeRoster.slice(0, 3);
                    const awaySelects = awayRoster.slice(0, 3);

                    const processPlayer = (p: ESPNPlayer, tm: string, opp: string) => {
                        // Pick a random category based on player id hash mapped to category length
                        const cStr = String(p.id) || p.displayName;
                        const hash = Array.from(cStr).reduce((acc, char: string) => acc + char.charCodeAt(0), 0);

                        // Assign 2 props per player
                        [0, 1].forEach(seed => {
                            const cat = cats[(hash + seed) % cats.length];
                            const base = bases[cat] || 10.5;

                            // Add some flavor variance based on hash
                            const lineShift = (hash % 50) / 10 - 2.5;
                            let line = Math.floor(Math.max(0.5, base + lineShift) * 10) / 10;

                            // Standardize lines to .5 hooks
                            line = Math.floor(line) + 0.5;

                            const isOver = (hash + seed) % 2 === 0;
                            const edgeSeed = ((hash * (seed + 1)) % 400) / 10; // 0 to 40%

                            // Set projection to reflect the edge
                            const edgeDec = edgeSeed / 100;
                            let proj = 0;
                            if (isOver) {
                                proj = line * (1 + edgeDec + 0.05); // slightly above
                            } else {
                                proj = line * (1 - edgeDec - 0.05); // slightly below
                            }

                            proj = Number(proj.toFixed(1));

                            const conf = 50 + Math.floor(edgeSeed);

                            generated.push({
                                id: `${p.id}-${cat}-${game.id}-${seed}`, // Added seed to make ID unique for 2 props per player
                                player: p.displayName, // Use fullName for display
                                team: tm,
                                teamLogo: `https://a.espncdn.com/i/teamlogos/${espnSport.split('.')[0].toLowerCase()}/500/${tm.toLowerCase()}.png`,
                                opponent: opp,
                                category: cat,
                                type: isOver ? 'Over' : 'Under',
                                line,
                                projection: proj,
                                edge: Number(edgeSeed.toFixed(1)),
                                confidence: conf,
                                odds: isOver ? '-110' : '-115',
                                isLive: true
                            });
                        });
                    };

                    homeSelects.forEach(p => processPlayer(p, game.homeTeam.abbreviation, game.awayTeam.abbreviation));
                    awaySelects.forEach(p => processPlayer(p, game.awayTeam.abbreviation, game.homeTeam.abbreviation));
                }));

                if (isMounted) {
                    setLiveProps(generated);
                    setIsLoading(false);
                }

            } catch (e) {
                console.error("Failed to load live props: ", e);
                if (isMounted) setIsLoading(false);
            }
        };

        buildLiveProps();

        return () => { isMounted = false; };
    }, [activeSport]); // Re-run when sport changes

    // Reset category filter if sport changes
    useEffect(() => {
        setActiveCategory('All');
    }, [activeSport]);

    // Filter and Sort Logic
    const filteredProps = useMemo(() => {
        return liveProps.filter(prop => {
            // 1. Search (Player or Team)
            const query = searchQuery.toLowerCase();
            const matchesSearch = prop.player.toLowerCase().includes(query) || prop.team.toLowerCase().includes(query) || prop.opponent.toLowerCase().includes(query);
            if (!matchesSearch) return false;

            // 2. Category
            if (activeCategory !== 'All' && prop.category !== activeCategory) return false;

            // 3. Confidence
            if (confidenceFilter === '70%+' && prop.confidence < 70) return false;
            if (confidenceFilter === '80%+' && prop.confidence < 80) return false;

            return true;
        }).sort((a, b) => {
            if (sortBy === 'Highest Confidence') return b.confidence - a.confidence;
            if (sortBy === 'Highest Edge') return b.edge - a.edge;
            if (sortBy === 'Player Name') return a.player.localeCompare(b.player);
            return 0;
        });
    }, [searchQuery, activeCategory, confidenceFilter, sortBy, liveProps]);

    const categories = ['All', ...(SPORT_CATEGORIES[activeSport] || DEFAULT_CATEGORIES)];

    // Auto-select first prop if none selected or if filtered list changes
    useEffect(() => {
        if (filteredProps.length > 0) {
            if (!selectedProp || !filteredProps.find(p => p.id === selectedProp.id)) {
                setSelectedProp(filteredProps[0]);
            }
        } else {
            setSelectedProp(null);
        }
    }, [filteredProps, selectedProp]);

    return (
        <div className="max-w-[1440px] mx-auto p-4 md:p-6 animate-fade-in pb-24">

            {/* ── Page Header & Instructional Banner ── */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-3xl text-primary">person_play</span>
                        <h1 className="m-0 text-3xl font-black text-text-main italic uppercase tracking-tight">Player Props</h1>
                    </div>
                    <p className="m-0 text-text-muted text-sm font-medium">AI-driven projections for individual player statistics.</p>
                </div>

                <div className="relative w-full lg:w-96 shrink-0">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                    <input
                        type="text"
                        placeholder="Search team or player..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white font-mono text-sm focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* ── Filters Bar ── */}
            <div className="lab-card p-4 mb-8 flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">

                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-all border
                ${activeCategory === cat
                                    ? 'bg-primary/20 text-primary border-primary shadow-[0_0_10px_rgba(191,255,0,0.2)]'
                                    : 'bg-neutral-800 text-text-muted border-white/5 hover:bg-neutral-700 hover:text-white'}
              `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    {/* Confidence Filter */}
                    <div className="flex bg-neutral-800 rounded p-1 border border-white/5">
                        {['All', '70%+', '80%+'].map(conf => (
                            <button
                                key={conf}
                                onClick={() => setConfidenceFilter(conf as 'All' | '70%+' | '80%+')}
                                className={`px-3 py-1 text-xs font-mono font-bold tracking-wider uppercase rounded transition-colors
                  ${confidenceFilter === conf ? 'bg-neutral-700 text-white shadow' : 'text-text-muted hover:text-white'}
                `}
                            >
                                {conf === 'All' ? 'All Conf' : conf}
                            </button>
                        ))}
                    </div>

                    {/* Sort By Dropdown - Mocked as button group for simplicity and styling matching */}
                    <div className="flex bg-neutral-800 rounded p-1 border border-white/5">
                        {['Highest Confidence', 'Highest Edge', 'Player Name'].map(sort => (
                            <button
                                key={sort}
                                onClick={() => setSortBy(sort as 'Highest Confidence' | 'Highest Edge' | 'Player Name')}
                                className={`flex items-center gap-1 px-3 py-1 text-[10px] font-mono font-bold tracking-wider uppercase rounded transition-colors
                  ${sortBy === sort ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-white'}
                `}
                            >
                                {sort === 'Highest Confidence' && <span className="material-symbols-outlined text-[14px]">psychology</span>}
                                {sort === 'Highest Edge' && <span className="material-symbols-outlined text-[14px]">trending_up</span>}
                                {sort === 'Player Name' && <span className="material-symbols-outlined text-[14px]">sort_by_alpha</span>}
                                {sort.replace('Highest ', '')}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* ── Master / Detail Layout ── */}
            <div className="grid lg:grid-cols-12 gap-6">

                {/* Left Panel: Select Player List */}
                <div className="lg:col-span-4 bg-[#1e1e1e] border border-white/5 rounded-xl flex flex-col overflow-hidden max-h-[800px] shadow-sm">
                    <div className="p-4 border-b border-white/5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-sm">person_pin_circle</span>
                        <h3 className="text-white font-mono font-bold text-xs tracking-widest leading-none mt-0.5">Select Player</h3>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar p-0 flex flex-col">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 border-b border-white/5 animate-pulse">
                                    <div className="w-10 h-10 rounded-full bg-white/5"></div>
                                    <div className="flex-1">
                                        <div className="h-4 w-24 bg-white/5 rounded mb-1"></div>
                                        <div className="h-3 w-16 bg-white/5 rounded"></div>
                                    </div>
                                </div>
                            ))
                        ) : filteredProps.length > 0 ? (
                            filteredProps.map(prop => {
                                const isSelected = selectedProp?.id === prop.id;
                                return (
                                    <div
                                        key={prop.id}
                                        onClick={() => setSelectedProp(prop)}
                                        className={`flex items-center justify-between p-4 cursor-pointer transition-colors border-b border-white/5 last:border-0 relative
                                            ${isSelected ? 'bg-white/5 border-l-4 border-l-primary/80 pr-3' : 'hover:bg-neutral-900 border-l-4 border-l-transparent pr-4 pl-4'}
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-[#121212] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                                {prop.headshot ? (
                                                    <img src={prop.headshot} alt={prop.player} className="w-full h-full object-cover object-top scale-110" />
                                                ) : (
                                                    <span className="text-sm font-black text-white/50 font-mono">{prop.player.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[13px] font-bold text-white font-mono tracking-tighter truncate max-w-[120px] sm:max-w-none">{prop.player}</div>
                                                <div className="text-[10px] text-text-muted mt-0.5">{prop.team} &bull; SF</div> {/* Mocked Position for now */}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className={`font-black font-mono text-[13px] leading-none mb-0.5 ${isSelected ? 'text-primary' : 'text-primary'}`}>{prop.line}</div>
                                            <div className="text-[9px] text-text-muted lowercase">{prop.category.substring(0, 3)}</div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center text-text-muted text-sm font-mono">
                                No players found matching filters.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Player Details & Lines */}
                <div className="lg:col-span-8 bg-[#1e1e1e] border border-white/5 rounded-xl overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
                    {selectedProp ? (
                        <>
                            {/* Selected Player Header */}
                            <div className="p-6 pb-4 border-b border-white/5 flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-6 relative">
                                <div className="flex items-center gap-4">
                                    <div className="relative shrink-0">
                                        <div className={`w-14 h-14 rounded-full bg-[#121212] overflow-hidden flex items-center justify-center shadow-md ${selectedProp.type === 'Over' ? 'border-primary' : 'border-primary'}`}>
                                            {selectedProp.headshot ? (
                                                <img src={selectedProp.headshot} alt={selectedProp.player} className="w-full h-full object-cover object-top scale-110" />
                                            ) : (
                                                <span className="text-xl font-black text-white/50 font-mono">{selectedProp.player.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <h2 className="text-[17px] font-black text-white mb-0.5">{selectedProp.player}</h2>
                                        <div className="text-[11px] text-text-muted">{selectedProp.team} &bull; SF</div>
                                    </div>
                                </div>

                                <div className="text-center sm:text-right mt-4 sm:mt-0 flex gap-2">
                                    <div className="bg-[#121212] border border-white/5 rounded px-3 py-1.5 flex items-center justify-center min-w-[120px]">
                                        <div className="flex flex-col items-center">
                                            <div className="text-[9px] uppercase text-text-muted mb-0.5 tracking-wide">Model Projection</div>
                                            <div className="text-xs font-bold text-primary">{selectedProp.projection} <span className="font-normal lowercase text-text-muted ml-0.5">{selectedProp.category.substring(0, 3)}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lines Content */}
                            <div className="p-4 flex-1 bg-[#121212]/30 flex flex-col">
                                <div className="flex items-center gap-2 mb-4">
                                    <button className="bg-[#1e1e1e] border border-white/10 rounded-full pl-3 pr-2 py-1.5 flex items-center gap-2 hover:bg-neutral-800 transition-colors text-white font-bold text-[11px]">
                                        <span className="text-orange-500 mr-1">&#x25cf;</span>
                                        {selectedProp.category}
                                        <span className="material-symbols-outlined text-[14px] text-text-muted ml-1">expand_more</span>
                                    </button>
                                </div>

                                {/* Alternate Lines List */}
                                <div className="flex flex-col gap-2">
                                    {[-2, -1, 0, 1, 2].map((offset, idx) => {
                                        // Generate fake alternate line data
                                        const altLine = Math.max(0.5, selectedProp.line + offset);

                                        // Fake probabilities mapped closely to the user's mockup image
                                        let overProb = Math.min(99, Math.max(1, Math.round(50 + (selectedProp.projection - altLine) * (15 - Math.abs(offset)))));
                                        let underProb = 100 - overProb;

                                        // Force one realistic example based on the selected prop projection vs alt line
                                        if (altLine < selectedProp.projection - 1) { overProb = 72; underProb = 28; }
                                        else if (altLine < selectedProp.projection) { overProb = 62; underProb = 38; }
                                        else if (altLine === Math.floor(selectedProp.projection) + 0.5) { overProb = 52; underProb = 48; }
                                        else if (altLine > selectedProp.projection && altLine <= selectedProp.projection + 1) { overProb = 42; underProb = 58; }
                                        else if (altLine > selectedProp.projection + 1) { overProb = 32; underProb = 68; }

                                        let recommendation: 'OVER' | 'UNDER' | 'SKIP' = 'SKIP';
                                        if (overProb > 55) recommendation = 'OVER';
                                        else if (underProb > 55) recommendation = 'UNDER';

                                        return (
                                            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border border-transparent bg-[#1e1e1e] hover:border-white/10 transition-colors`}>

                                                <div className="flex-1 w-24 shrink-0 pl-1">
                                                    <span className="text-[13px] font-bold text-white">{altLine.toFixed(1)}</span>
                                                    <span className="text-[11px] text-text-muted ml-1 lowercase">{selectedProp.category.substring(0, 3)}</span>
                                                </div>

                                                <div className="flex items-center justify-end w-full max-w-[200px] pr-2">
                                                    <div className="grid grid-cols-2 gap-4 w-full text-right pr-6">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] text-text-muted mb-0.5">Over</span>
                                                            <span className={`text-[11px] font-bold ${recommendation === 'OVER' ? 'text-primary' : 'text-text-muted'}`}>{overProb}%</span>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] text-text-muted mb-0.5">Under</span>
                                                            <span className={`text-[11px] font-bold ${recommendation === 'UNDER' ? 'text-text-muted' : 'text-text-muted'}`}>{underProb}%</span>
                                                        </div>
                                                    </div>

                                                    {/* Badge / Button */}
                                                    <div className="flex items-center justify-end w-[85px] shrink-0">
                                                        {recommendation === 'OVER' && (
                                                            <button className="flex items-center justify-center gap-1 w-full bg-primary/20 text-primary border border-primary/40 rounded-full py-1 text-[9px] font-bold tracking-widest uppercase hover:bg-primary/30 transition-colors whitespace-nowrap px-1">
                                                                <span className="material-symbols-outlined text-[10px]">trending_up</span>
                                                                Over
                                                            </button>
                                                        )}
                                                        {recommendation === 'UNDER' && (
                                                            <button className="flex items-center justify-center gap-1 w-full bg-red-500/20 text-red-500 border border-red-500/40 rounded-full py-1 text-[9px] font-bold tracking-widest uppercase hover:bg-red-500/30 transition-colors whitespace-nowrap px-1">
                                                                <span className="material-symbols-outlined text-[10px]">trending_down</span>
                                                                Under
                                                            </button>
                                                        )}
                                                        {recommendation === 'SKIP' && (
                                                            <button className="flex items-center justify-center w-full bg-transparent text-text-muted/60 border border-white/5 rounded-full py-1 text-[9px] font-bold tracking-widest uppercase hover:bg-white/5 transition-colors whitespace-nowrap px-1">
                                                                Skip
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center text-text-muted bg-[#121212]/20">
                            <span className="material-symbols-outlined text-4xl mb-3 opacity-30">touch_app</span>
                            <div className="text-sm tracking-widest font-bold text-white mb-2 uppercase">Select a Player</div>
                            <p className="text-xs max-w-[250px] mx-auto opacity-70">Click on any player from the list to view model projections and alternate lines.</p>
                        </div>
                    )}
                </div>

            </div>

            {
                selectedProp && (
                    <OutlierPropChart
                        prop={selectedProp}
                        onClose={() => setSelectedProp(null)}
                        onAddBet={(odds) => {
                            console.log('Add bet with odds', odds);
                            setSelectedProp(null);
                        }}
                    />
                )
            }
        </div >
    );
};

export default PlayerPropsView;
