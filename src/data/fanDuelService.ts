/**
 * FanDuel Dev Tool — TypeScript port
 * Mirrors the Python FanDuelDevTool class.
 * Uses the NJ (New Jersey) data center, which is the gold standard for FanDuel data.
 */

export interface FanDuelSelection {
    name: string;
    price: string | null; // American odds, e.g. "+150" or "-110"
}

export interface FanDuelMarket {
    marketName: string;
    selections: FanDuelSelection[];
}

export interface FanDuelEvent {
    game_name: string;
    start_time: string; // ISO date string
    markets: FanDuelMarket[];
}

// ── Sport ID Map (updated 2026) ────────────────────────────────────────────
export const FANDUEL_SPORT_IDS: Record<string, number> = {
    nascar: 1045237,
    boxing: 503525,
    ncaaw: 92483,
    ncaab: 63747,
    nba: 2274,
    nfl: 1174,
    mlb: 7522,
    nhl: 436621,
    mma: 2642038,
    soccer: 1,
};

const BASE_URL = 'https://sb-api.nj.sportsbook.fanduel.com/api/event-list';

const HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json',
};

// FanDuel raw event shape (partial)
interface FDRawEvent {
    name: string;
    openDate: string;
}

interface FDRunner {
    runnerName: string;
    winRunnerOdds?: {
        americanDisplayOdds?: {
            americanDisplayOdds?: string;
        };
    };
}

interface FDMarket {
    eventId: number;
    marketName: string;
    runners: FDRunner[];
}

interface FDRawResponse {
    attachments?: {
        events?: Record<string, FDRawEvent>;
        markets?: Record<string, FDMarket>;
    };
}

// ── Parser ─────────────────────────────────────────────────────────────────
function parseData(raw: FDRawResponse): FanDuelEvent[] {
    const events = raw.attachments?.events ?? {};
    const markets = raw.attachments?.markets ?? {};
    const marketList = Object.values(markets);

    return Object.entries(events).map(([eventId, info]) => {
        const eventMarkets = marketList.filter(m => m.eventId === Number(eventId));

        return {
            game_name: info.name ?? 'Unknown Event',
            start_time: info.openDate ?? '',
            markets: eventMarkets.map(m => ({
                marketName: m.marketName ?? '',
                selections: (m.runners ?? []).map(runner => ({
                    name: runner.runnerName ?? '',
                    price:
                        runner.winRunnerOdds?.americanDisplayOdds?.americanDisplayOdds ?? null,
                })),
            })),
        };
    });
}

// ── Main fetcher ───────────────────────────────────────────────────────────
export async function fetchFanDuelSport(
    sport: string,
    pageSize = 50,
    pageIndex = 0,
): Promise<FanDuelEvent[] | string> {
    const sportId = FANDUEL_SPORT_IDS[sport.toLowerCase()];
    if (!sportId) return `Sport '${sport}' not found.`;

    const params = new URLSearchParams({
        _ak: 'FhMFpcPWXMeyZxOx',  // FanDuel public web app access key
        eventTypeId: String(sportId),
        pageSize: String(pageSize),
        pageIndex: String(pageIndex),
    });

    const url = `${BASE_URL}?${params.toString()}`;

    try {
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const raw: FDRawResponse = await response.json();
        return parseData(raw);
    } catch (e) {
        return `Failed to fetch ${sport}: ${e instanceof Error ? e.message : String(e)}`;
    }
}

// ── Convenience hooks / helpers ────────────────────────────────────────────

/** Extract moneyline (head-to-head) markets from an event list */
export function getMoneylines(events: FanDuelEvent[]): {
    game: string;
    time: string;
    home: FanDuelSelection | null;
    away: FanDuelSelection | null;
}[] {
    return events.flatMap(ev => {
        const ml = ev.markets.find(
            m =>
                m.marketName.toLowerCase().includes('money line') ||
                m.marketName.toLowerCase().includes('moneyline') ||
                m.marketName.toLowerCase().includes('match winner'),
        );
        if (!ml) return [];
        return [{
            game: ev.game_name,
            time: ev.start_time,
            home: ml.selections[0] ?? null,
            away: ml.selections[1] ?? null,
        }];
    });
}

/** Extract over/under (totals) markets */
export function getTotals(events: FanDuelEvent[]): {
    game: string;
    over: FanDuelSelection | null;
    under: FanDuelSelection | null;
}[] {
    return events.flatMap(ev => {
        const tot = ev.markets.find(m => m.marketName.toLowerCase().includes('total'));
        if (!tot) return [];
        const over = tot.selections.find(s => s.name.toLowerCase().includes('over')) ?? null;
        const under = tot.selections.find(s => s.name.toLowerCase().includes('under')) ?? null;
        return [{ game: ev.game_name, over, under }];
    });
}

// ── FanDuelPropsTool port ──────────────────────────────────────────────────
// Mirrors Python FanDuelPropsTool.get_player_props()

export interface FanDuelPropPlayer {
    name: string;
    line: number | null;  // Over/Under number e.g. 22.5  (Python: runner.handicap)
    odds: string | null;  // American odds e.g. "-115"
}

export interface FanDuelProp {
    prop_type: string;
    players: FanDuelPropPlayer[];
}

/** Prop name substrings to include. Mirrors the Python `if any(prop in name …)` check. */
export const DEFAULT_PROP_FILTERS = [
    'Points', 'Rebounds', 'Assists', 'Threes',      // NBA
    'Strikeouts', 'Home Runs', 'Hits',               // MLB
    'Touchdowns', 'Passing Yards', 'Rushing Yards',  // NFL
    'Goals', 'Saves', 'Shots',                       // NHL / Soccer
    'Kills', 'Aces',                                 // Tennis / esports
];

/**
 * Fetches FanDuel player props for a sport.
 * Mirrors Python: tool.get_player_props(sport_id)
 *
 * @param sport  - sport key matching FANDUEL_SPORT_IDS, e.g. 'nba'
 * @param filter - prop name substrings to include (default: DEFAULT_PROP_FILTERS)
 *
 * Example:
 *   const props = await fetchPlayerProps('nba');
 *   // [{ prop_type: "Player Points", players: [{ name: "LeBron James", line: 25.5, odds: "-115" }] }]
 */
export async function fetchPlayerProps(
    sport: string,
    filter: string[] = DEFAULT_PROP_FILTERS,
): Promise<FanDuelProp[] | string> {
    const sportId = FANDUEL_SPORT_IDS[sport.toLowerCase()];
    if (!sportId) return `Sport '${sport}' not found.`;

    const params = new URLSearchParams({
        _ak: 'FhMFpcPWXMeyZxOx',
        eventTypeId: String(sportId),
        tab: 'player-props',   // magic key from Python version
        pageSize: '100',
    });

    const url = `${BASE_URL}?${params.toString()}`;

    try {
        const response = await fetch(url, { headers: HEADERS });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const raw = await response.json() as {
            attachments?: {
                markets?: Record<string, {
                    marketName?: string;
                    runners?: Array<{
                        runnerName?: string;
                        handicap?: number;
                        winRunnerOdds?: {
                            americanDisplayOdds?: { americanDisplayOdds?: string };
                        };
                    }>;
                }>;
            };
        };

        const markets = raw.attachments?.markets ?? {};
        const parsed: FanDuelProp[] = [];

        for (const m of Object.values(markets)) {
            const name = m.marketName ?? '';
            if (!filter.some(f => name.includes(f))) continue;

            parsed.push({
                prop_type: name,
                players: (m.runners ?? []).map(runner => ({
                    name: runner.runnerName ?? '',
                    line: runner.handicap ?? null,
                    odds: runner.winRunnerOdds?.americanDisplayOdds?.americanDisplayOdds ?? null,
                })),
            });
        }

        return parsed;
    } catch (e) {
        return `Failed to fetch ${sport} props: ${e instanceof Error ? e.message : String(e)}`;
    }
}
