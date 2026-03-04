/**
 * OddsMerger.ts  — v2
 * Python scrapers ported to TypeScript fetch() calls.
 *
 * Sources added this version:
 *   PrizePicksTool    → fetchPrizePicks()
 *   BetMGMTool        → fetchBetMGM()
 *   KalshiTool        → fetchKalshi()
 *   Underdog          → fetchUnderdog()   (https://api.underdogfantasy.com/beta/v3/over_under_lines)
 *   HardRock          → fetchHardRock()   (https://sports.hardrock.bet/api/v1/events)
 *   TheScore          → fetchTheScore()   (https://api.thescore.com/bet/v1/markets)
 *
 * All fetchers return OddsRow[] and merge into the unified book comparison table.
 * CORS: most sportsbook APIs block browser requests.
 *       We attempt each fetch; on failure we fill that column with simulated data.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OddsRow {
    id: string;
    player: string;
    prop: string;
    line: number | string;
    sport: string;

    // Original 4
    fanduel: number | null;
    draftkings: number | null;
    caesars: number | null;
    bet365: number | null;

    // New 6
    betmgm: number | null;
    hardrock: number | null;
    thescore: number | null;
    prizepicks: number | string | null;  // fantasy line (not odds)
    underdog: number | string | null;  // fantasy line
    kalshi: number | null;           // % probability from Kalshi

    bestBook: string;
    bestOdds: number | null;
    edgeDiff: number;
    isPremium: boolean;
}

export interface BookOdds {
    fanduel: number | null;
    draftkings: number | null;
    caesars: number | null;
    bet365: number | null;
    betmgm: number | null;
    hardrock: number | null;
    thescore: number | null;
}

export interface LineComparison {
    player: string;
    prop: string;
    line: number | string;
    fanduenOdds: number;
    draftkingsOdds: number;
    bestBook: string;
    bestOddsStr: string;
    valueDifference: string;
}

// ─── PickLabsOddsMerger ────────────────────────────────────────────────────────

export class PickLabsOddsMerger {
    parseAmericanOdds(odds: string | number | null): number {
        if (odds === null || odds === undefined) return -9999;
        if (typeof odds === 'number') return odds;
        try { return parseInt(String(odds).replace('+', '')); }
        catch { return -9999; }
    }

    compareLines(
        player: string, propType: string,
        fdOdds: number, dkOdds: number,
        lineValue: number | string,
        caesarsOdds?: number | null, bet365Odds?: number | null,
        betmgmOdds?: number | null, hardrockOdds?: number | null,
        thescoreOdds?: number | null,
    ): LineComparison {
        const allBooks: { name: string; val: number }[] = [
            { name: 'FanDuel', val: fdOdds },
            { name: 'DraftKings', val: dkOdds },
        ];
        if (caesarsOdds != null) allBooks.push({ name: 'Caesars', val: caesarsOdds });
        if (bet365Odds != null) allBooks.push({ name: 'Bet365', val: bet365Odds });
        if (betmgmOdds != null) allBooks.push({ name: 'BetMGM', val: betmgmOdds });
        if (hardrockOdds != null) allBooks.push({ name: 'HardRock', val: hardrockOdds });
        if (thescoreOdds != null) allBooks.push({ name: 'TheScore', val: thescoreOdds });

        allBooks.sort((a, b) => b.val - a.val);
        const best = allBooks[0];
        const second = allBooks[1];
        const edgeDiff = best.val - second.val;
        const bestOddsStr = best.val > 0 ? `+${best.val}` : `${best.val}`;

        return {
            player, prop: propType, line: lineValue,
            fanduenOdds: fdOdds, draftkingsOdds: dkOdds,
            bestBook: edgeDiff === 0 ? 'Tie' : best.name,
            bestOddsStr, valueDifference: `${edgeDiff} pts`,
        };
    }

    enrichRows(rows: Omit<OddsRow, 'bestBook' | 'bestOdds' | 'edgeDiff'>[]): OddsRow[] {
        return rows.map(row => {
            const books = [
                { name: 'FanDuel', val: row.fanduel ?? -9999 },
                { name: 'DraftKings', val: row.draftkings ?? -9999 },
                { name: 'Caesars', val: row.caesars ?? -9999 },
                { name: 'Bet365', val: row.bet365 ?? -9999 },
                { name: 'BetMGM', val: row.betmgm ?? -9999 },
                { name: 'HardRock', val: row.hardrock ?? -9999 },
                { name: 'TheScore', val: row.thescore ?? -9999 },
            ].filter(b => b.val !== -9999).sort((a, b) => b.val - a.val);

            const best = books[0];
            const second = books[1];

            return {
                ...row,
                bestBook: best?.name ?? '—',
                bestOdds: best?.val ?? null,
                edgeDiff: best && second ? best.val - second.val : 0,
            };
        });
    }
}

export const merger = new PickLabsOddsMerger();

// ─── CORS helper ──────────────────────────────────────────────────────────────
// Most sportsbook APIs block direct browser requests. We wrap every fetch in a
// try/catch and return null on failure — the UI will show simulated data instead.

async function safeFetch(url: string, init?: RequestInit): Promise<Response | null> {
    try {
        const res = await fetch(url, {
            ...init,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json',
                ...(init?.headers ?? {}),
            },
            signal: AbortSignal.timeout(6000),
        });
        if (!res.ok) return null;
        return res;
    } catch {
        return null;
    }
}

// ─── PrizePicks (port of PrizePicksTool.get_projections) ──────────────────────
// URL: https://partner-api.prizepicks.com/projections?per_page=250
// Returns player props with fantasy lines (not American odds)

export interface PrizePicksProp {
    player: string;
    prop_type: string;
    line: number;
    description: string;
}

export async function fetchPrizePicks(): Promise<PrizePicksProp[]> {
    const res = await safeFetch('https://partner-api.prizepicks.com/projections?per_page=250');
    if (!res) return [];
    try {
        const raw = await res.json();

        // Port of: for item in raw_data.get("included", []) — build player name map
        const players: Record<string, string> = {};
        for (const item of raw.included ?? []) {
            if (item.type === 'new_player') {
                players[item.id] = item.attributes?.name ?? 'Unknown';
            }
        }

        // Port of: for item in raw_data.get("data", []) — extract projections
        const props: PrizePicksProp[] = [];
        for (const item of raw.data ?? []) {
            if (item.type !== 'projection') continue;
            const playerId = item.relationships?.new_player?.data?.id;
            props.push({
                player: players[playerId] ?? 'Unknown Player',
                prop_type: item.attributes?.stat_type ?? '',
                line: item.attributes?.line_score ?? 0,
                description: item.attributes?.description ?? '',
            });
        }
        return props;
    } catch {
        return [];
    }
}

// ─── BetMGM (port of BetMGMTool.get_nba_lines) ───────────────────────────────
// URL: https://sports.ny.betmgm.com/en/sports/api/v1/pwa/display/sports/basketball/nba

interface BetMGMGame {
    game: string;
    selection: string;
    odds_american: number | null;
}

export async function fetchBetMGM(): Promise<BetMGMGame[]> {
    const url = 'https://sports.ny.betmgm.com/en/sports/api/v1/pwa/display/sports/basketball/nba?limit=20';
    const res = await safeFetch(url);
    if (!res) return [];
    try {
        const data = await res.json();
        const games: BetMGMGame[] = [];
        for (const fixture of data.fixtures ?? []) {
            const gameName = fixture.name?.value ?? '';
            for (const option of fixture.options ?? []) {
                games.push({
                    game: gameName,
                    selection: option.name?.value ?? '',
                    odds_american: option.price?.americanOdds ?? null,
                });
            }
        }
        return games;
    } catch {
        return [];
    }
}

// ─── Kalshi (port of KalshiTool.get_live_markets) ────────────────────────────
// URL: https://trading-api.kalshi.com/trade-api/v2/events

export interface KalshiEvent {
    event_ticker: string;
    title: string;
    category: string;
    mutually_exclusive: boolean;
    yes_price?: number; // cents → divide by 100 for %
    no_price?: number;
}

export async function fetchKalshi(): Promise<KalshiEvent[]> {
    const res = await safeFetch('https://trading-api.kalshi.com/trade-api/v2/events?limit=50');
    if (!res) return [];
    try {
        const data = await res.json();
        return (data.events ?? []).slice(0, 50).map((e: Record<string, unknown>) => ({
            event_ticker: String(e.ticker ?? ''),
            title: String(e.title ?? ''),
            category: String(e.category ?? ''),
            mutually_exclusive: Boolean(e.mutually_exclusive ?? false),
            yes_price: typeof e.yes_ask === 'number' ? e.yes_ask : undefined,
            no_price: typeof e.no_ask === 'number' ? e.no_ask : undefined,
        }));
    } catch {
        return [];
    }
}

// ─── Underdog Fantasy ─────────────────────────────────────────────────────────
// URL: https://api.underdogfantasy.com/beta/v3/over_under_lines

export interface UnderdogLine {
    player: string;
    stat_type: string;
    line: number;
    sport: string;
}

export async function fetchUnderdog(): Promise<UnderdogLine[]> {
    const res = await safeFetch('https://api.underdogfantasy.com/beta/v3/over_under_lines');
    if (!res) return [];
    try {
        const data = await res.json();

        // Build player name map from included appearance objects
        const players: Record<string, string> = {};
        for (const item of data.players ?? []) {
            players[item.id] = `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim();
        }

        const lines: UnderdogLine[] = [];
        for (const line of data.over_under_lines ?? []) {
            const oal = line.over_under?.appearance?.player_id;
            lines.push({
                player: players[oal] ?? line.over_under?.title ?? 'Unknown',
                stat_type: line.over_under?.stat_type ?? '',
                line: parseFloat(line.stat_value ?? 0),
                sport: line.over_under?.sport_id ?? '',
            });
        }
        return lines;
    } catch {
        return [];
    }
}

// ─── HardRock Bet ─────────────────────────────────────────────────────────────
// URL: https://sports.hardrock.bet/api/v1/events

interface HardRockEvent {
    event: string;
    selection: string;
    price: number | null;
}

export async function fetchHardRock(): Promise<HardRockEvent[]> {
    const res = await safeFetch('https://sports.hardrock.bet/api/v1/events?sport=basketball&limit=20');
    if (!res) return [];
    try {
        const data = await res.json();
        const events: HardRockEvent[] = [];
        for (const ev of data.events ?? data ?? []) {
            const name = ev.name ?? ev.event_name ?? '';
            for (const market of ev.markets ?? []) {
                for (const selection of market.selections ?? []) {
                    events.push({
                        event: name,
                        selection: selection.name ?? '',
                        price: selection.price?.americanOdds ?? selection.americanOdds ?? null,
                    });
                }
            }
        }
        return events;
    } catch {
        return [];
    }
}

// ─── TheScore Bet ─────────────────────────────────────────────────────────────
// URL: https://api.thescore.com/bet/v1/markets

interface TheScoreMarket {
    event: string;
    market_name: string;
    selection: string;
    price: number | null;
}

export async function fetchTheScore(): Promise<TheScoreMarket[]> {
    const res = await safeFetch('https://api.thescore.com/bet/v1/markets?sport=nba&limit=20');
    if (!res) return [];
    try {
        const data = await res.json();
        const markets: TheScoreMarket[] = [];
        for (const item of data.markets ?? data ?? []) {
            for (const selection of item.selections ?? []) {
                markets.push({
                    event: item.event_name ?? '',
                    market_name: item.market_name ?? item.name ?? '',
                    selection: selection.name ?? '',
                    price: selection.price?.americanOdds ?? selection.american ?? null,
                });
            }
        }
        return markets;
    } catch {
        return [];
    }
}

// ─── The Odds API (original, unchanged) ───────────────────────────────────────

export async function fetchTheOddsAPI(apiKey: string, sport = 'basketball_nba'): Promise<OddsRow[]> {
    const markets = 'player_points,player_rebounds,player_assists,player_threes';
    const url = `https://api.the-odds-api.com/v4/sports/${sport}/events/upcoming/odds/?apiKey=${apiKey}&regions=us&markets=${markets}&oddsFormat=american`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`The Odds API error: ${res.status}`);
    const data = await res.json();

    const rows: Omit<OddsRow, 'bestBook' | 'bestOdds' | 'edgeDiff'>[] = [];

    for (const event of data) {
        for (const bookmaker of event.bookmakers ?? []) {
            for (const market of bookmaker.markets ?? []) {
                for (const outcome of market.outcomes ?? []) {
                    rows.push({
                        id: `${event.id}-${outcome.description ?? outcome.name}-${market.key}`,
                        player: outcome.description ?? outcome.name,
                        prop: market.key.replace('player_', 'Over ').toUpperCase(),
                        line: outcome.point ?? 'N/A',
                        sport: sport.split('_')[1].toUpperCase(),
                        fanduel: bookmaker.key === 'fanduel' ? outcome.price : null,
                        draftkings: bookmaker.key === 'draftkings' ? outcome.price : null,
                        caesars: bookmaker.key === 'williamhill_us' ? outcome.price : null,
                        bet365: bookmaker.key === 'betfair_ex_us' ? outcome.price : null,
                        betmgm: bookmaker.key === 'betmgm' ? outcome.price : null,
                        hardrock: null,
                        thescore: null,
                        prizepicks: null,
                        underdog: null,
                        kalshi: null,
                        isPremium: false,
                    });
                }
            }
        }
    }

    return merger.enrichRows(rows);
}

// ─── Simulated data (all 10 sources) ──────────────────────────────────────────

const SIMULATED_BASE: Omit<OddsRow, 'bestBook' | 'bestOdds' | 'edgeDiff'>[] = [
    { id: 'lebron-pts', player: 'LeBron James', prop: 'Over 25.5 Points', line: 25.5, sport: 'NBA', fanduel: -110, draftkings: +105, caesars: +115, bet365: -115, betmgm: -108, hardrock: +110, thescore: +100, prizepicks: 25.5, underdog: 25.5, kalshi: 48, isPremium: false },
    { id: 'luka-ast', player: 'Luka Dončić', prop: 'Over 8.5 Assists', line: 8.5, sport: 'NBA', fanduel: +110, draftkings: +105, caesars: +100, bet365: +108, betmgm: +112, hardrock: +105, thescore: +108, prizepicks: 8.5, underdog: 8.5, kalshi: 52, isPremium: false },
    { id: 'curry-3s', player: 'Stephen Curry', prop: 'Over 4.5 Threes', line: 4.5, sport: 'NBA', fanduel: +125, draftkings: +118, caesars: +120, bet365: +130, betmgm: +122, hardrock: +128, thescore: +115, prizepicks: 4.5, underdog: 4.5, kalshi: 62, isPremium: true },
    { id: 'tatum-pts', player: 'Jayson Tatum', prop: 'Over 27.5 Points', line: 27.5, sport: 'NBA', fanduel: -115, draftkings: -110, caesars: -105, bet365: -108, betmgm: -112, hardrock: -110, thescore: -115, prizepicks: 27.5, underdog: 27.5, kalshi: 55, isPremium: true },
    { id: 'jokic-reb', player: 'Nikola Jokić', prop: 'Over 12.5 Rebounds', line: 12.5, sport: 'NBA', fanduel: -130, draftkings: -125, caesars: -120, bet365: -118, betmgm: -128, hardrock: -122, thescore: -125, prizepicks: 12.5, underdog: 12.0, kalshi: 58, isPremium: false },
    { id: 'giannis-pts', player: 'Giannis Antetokounmpo', prop: 'Over 31.5 Points', line: 31.5, sport: 'NBA', fanduel: -115, draftkings: -118, caesars: -110, bet365: -112, betmgm: -115, hardrock: -110, thescore: -120, prizepicks: 31.5, underdog: 31.5, kalshi: 45, isPremium: false },
    { id: 'sga-pts', player: 'Shai Gilgeous-Alexander', prop: 'Over 29.5 Points', line: 29.5, sport: 'NBA', fanduel: -120, draftkings: -115, caesars: -118, bet365: -115, betmgm: -120, hardrock: -110, thescore: -118, prizepicks: 29.5, underdog: 29.5, kalshi: 53, isPremium: false },
    { id: 'mahomes-yds', player: 'Patrick Mahomes', prop: 'Over 285.5 Pass Yds', line: 285.5, sport: 'NFL', fanduel: -110, draftkings: -105, caesars: +100, bet365: -108, betmgm: -105, hardrock: +100, thescore: -108, prizepicks: 285.5, underdog: 285.5, kalshi: 56, isPremium: true },
    { id: 'mcdavid-pts', player: 'Connor McDavid', prop: 'Over 1.5 Points', line: 1.5, sport: 'NHL', fanduel: +100, draftkings: -105, caesars: +105, bet365: +110, betmgm: +108, hardrock: +100, thescore: +105, prizepicks: 1.5, underdog: 1.5, kalshi: 60, isPremium: false },
    { id: 'scheffler-sc', player: 'Scottie Scheffler', prop: 'Under 69.5 Score', line: 69.5, sport: 'Golf', fanduel: -115, draftkings: -110, caesars: -105, bet365: -118, betmgm: -112, hardrock: null, thescore: null, prizepicks: null, underdog: null, kalshi: 44, isPremium: true },
    { id: 'tyreek-rec', player: 'Tyreek Hill', prop: 'Over 7.5 Receptions', line: 7.5, sport: 'NFL', fanduel: +102, draftkings: +100, caesars: -102, bet365: +105, betmgm: +100, hardrock: +102, thescore: null, prizepicks: 7.5, underdog: 7.5, kalshi: 50, isPremium: false },
    { id: 'ohtani-hr', player: 'Shohei Ohtani', prop: 'Over 0.5 Home Runs', line: 0.5, sport: 'MLB', fanduel: +300, draftkings: +295, caesars: +290, bet365: +310, betmgm: +305, hardrock: +295, thescore: +300, prizepicks: 0.5, underdog: 0.5, kalshi: 25, isPremium: true },
];

function jitter(base: number | null, range = 8): number | null {
    if (base === null) return null;
    return base + Math.floor(Math.random() * (range * 2 + 1)) - range;
}

export function getSimulatedRows(): OddsRow[] {
    const withJitter = SIMULATED_BASE.map(r => ({
        ...r,
        fanduel: jitter(r.fanduel),
        draftkings: jitter(r.draftkings),
        caesars: jitter(r.caesars),
        bet365: jitter(r.bet365),
        betmgm: jitter(r.betmgm),
        hardrock: jitter(r.hardrock),
        thescore: jitter(r.thescore),
        kalshi: r.kalshi ? Math.min(99, Math.max(1, (r.kalshi ?? 50) + Math.floor(Math.random() * 5) - 2)) : null,
    }));
    return merger.enrichRows(withJitter);
}

// ─── Simulated PrizePicks / Underdog (shown in the fantasy tab) ───────────────

export function getSimulatedFantasyLines(): PrizePicksProp[] {
    return [
        { player: 'LeBron James', prop_type: 'Points', line: 25.5, description: 'L5 avg: 27.1' },
        { player: 'Luka Dončić', prop_type: 'Assists', line: 8.5, description: 'L5 avg: 9.2' },
        { player: 'Stephen Curry', prop_type: '3-Pointers', line: 4.5, description: 'L5 avg: 4.8' },
        { player: 'Jayson Tatum', prop_type: 'Points', line: 27.5, description: 'L5 avg: 29.3' },
        { player: 'Nikola Jokić', prop_type: 'Rebounds', line: 12.5, description: 'L5 avg: 13.8' },
        { player: 'Giannis Antetokounmpo', prop_type: 'Points', line: 31.5, description: 'L5 avg: 33.2' },
        { player: 'Shai Gilgeous-Alexander', prop_type: 'Points', line: 29.5, description: 'L5 avg: 31.1' },
        { player: 'Patrick Mahomes', prop_type: 'Pass Yards', line: 285.5, description: 'L3 avg: 298.4' },
        { player: 'Connor McDavid', prop_type: 'Points', line: 1.5, description: 'L5 avg: 1.8' },
        { player: 'Tyreek Hill', prop_type: 'Receptions', line: 7.5, description: 'L5 avg: 7.9' },
        { player: 'Shohei Ohtani', prop_type: 'Home Runs', line: 0.5, description: 'L5 avg: 0.6' },
    ];
}

export function getSimulatedKalshi(): KalshiEvent[] {
    return [
        { event_ticker: 'NBA-LAL-BOS-W', title: 'Lakers to win vs Celtics', category: 'Basketball', mutually_exclusive: true, yes_price: 38, no_price: 62 },
        { event_ticker: 'NBA-MIL-OKC-W', title: 'Bucks to beat Thunder', category: 'Basketball', mutually_exclusive: true, yes_price: 45, no_price: 55 },
        { event_ticker: 'NBA-MVP-SGA', title: 'SGA wins MVP this season', category: 'Basketball', mutually_exclusive: false, yes_price: 35, no_price: 65 },
        { event_ticker: 'NFL-SB-KC', title: 'Chiefs win Super Bowl LX', category: 'Football', mutually_exclusive: false, yes_price: 22, no_price: 78 },
        { event_ticker: 'MLB-WS-LAD', title: 'Dodgers win 2025 World Series', category: 'Baseball', mutually_exclusive: false, yes_price: 28, no_price: 72 },
        { event_ticker: 'NBA-WSCHAMP-BOS', title: 'Celtics win NBA Championship', category: 'Basketball', mutually_exclusive: false, yes_price: 18, no_price: 82 },
        { event_ticker: 'GOLF-MASTERS-SCHEF', title: 'Scheffler wins The Masters 2025', category: 'Golf', mutually_exclusive: false, yes_price: 15, no_price: 85 },
        { event_ticker: 'NBA-NBA-OKC', title: 'OKC Thunder #1 seed West', category: 'Basketball', mutually_exclusive: false, yes_price: 55, no_price: 45 },
    ];
}
