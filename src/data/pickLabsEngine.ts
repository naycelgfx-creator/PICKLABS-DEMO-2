/**
 * PickLabs Master Prediction Engine
 * Converts the Python math engine to TypeScript for client-side use.
 *
 * Core algorithms:
 *  - Weighted Moving Average (WMA) — 5-4-3-2-1 weighting over last 5 games
 *  - American Odds → Implied Probability
 *  - Multi-timeframe blending (5/10/20 game windows)
 *  - Line shopping edge calculation across multiple sportsbooks
 */

import { getAdminMathWindow } from './PickLabsAuthDB';

export interface OddsBook {
    sportsbook: string;
    line: number;
    over_odds: number;
    under_odds: number;
}

export interface MathBreakdown {
    wma_5: number;
    avg_10: number;
    avg_20: number;
    final_projection: number;
}

export interface BestPlay {
    recommended_book: string;
    action: 'OVER' | 'UNDER';
    line: number;
    odds: number;
    picklabs_edge_score: number;
    implied_prob_pct: number;
}

export interface PredictionResult {
    player: string;
    stat_label: string;
    math_breakdown: MathBreakdown;
    the_answer: BestPlay | null;
    confidence: 'HIGH' | 'MED' | 'LOW';
}

/** Calculates a Weighted Moving Average for the most recent 5 games. */
export function calculateWMA(statsArray: number[]): number {
    if (statsArray.length === 0) return 0;
    if (statsArray.length < 5) return statsArray.reduce((a, b) => a + b, 0) / statsArray.length;
    const weights = [5, 4, 3, 2, 1];
    const recent5 = statsArray.slice(0, 5); // index 0 = most recent
    const weightedSum = recent5.reduce((sum, s, i) => sum + s * weights[i], 0);
    return weightedSum / weights.reduce((a, b) => a + b, 0);
}

/** Converts American odds to implied probability (0–1). */
export function convertToImpliedProb(americanOdds: number): number {
    if (americanOdds < 0) {
        return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
    return 100 / (americanOdds + 100);
}

/** Formats American odds as a readable string. */
export function formatOdds(odds: number): string {
    return odds >= 0 ? `+${odds}` : `${odds}`;
}

/** Returns a human-readable confidence tier from an edge score. */
function edgeToConfidence(edgeScore: number): 'HIGH' | 'MED' | 'LOW' {
    if (edgeScore >= 1.5) return 'HIGH';
    if (edgeScore >= 0.5) return 'MED';
    return 'LOW';
}

/**
 * Master Prediction Engine
 * 1. Analyses 5/10/20 game windows with WMA blending
 * 2. Shops lines across multiple sportsbooks
 * 3. Outputs the best mathematical play
 */
export function masterPredictionEngine(
    playerName: string,
    statLabel: string,
    last20Games: number[],
    liveOddsData: OddsBook[],
): PredictionResult {
    const games = last20Games.slice(0, 20);
    const last5 = games.slice(0, 5);
    const last10 = games.slice(0, 10);

    // --- STEP 1: MULTI-TIMEFRAME MATH ---
    const wma5 = calculateWMA(last5);
    const avg10 = last10.length > 0 ? last10.reduce((a, b) => a + b, 0) / last10.length : wma5;
    const avg20 = games.length > 0 ? games.reduce((a, b) => a + b, 0) / games.length : wma5;

    const windowSize = getAdminMathWindow();
    let picklabsProjection = wma5;

    if (windowSize === 5) {
        picklabsProjection = wma5;
    } else if (windowSize === 10) {
        // 50% recent form, 50% 10-game
        picklabsProjection = (wma5 * 0.5) + (avg10 * 0.5);
    } else {
        // 50% recent form, 30% 10-game, 20% 20-game anchor
        picklabsProjection = (wma5 * 0.5) + (avg10 * 0.3) + (avg20 * 0.2);
    }

    // --- STEP 2: LINE SHOPPING & EDGE CALCULATION ---
    let bestPlay: BestPlay | null = null;
    let highestEdge = -Infinity;

    for (const book of liveOddsData) {
        const isOver = picklabsProjection > book.line;
        const stance: 'OVER' | 'UNDER' = isOver ? 'OVER' : 'UNDER';
        const bookOdds = isOver ? book.over_odds : book.under_odds;
        const margin = Math.abs(picklabsProjection - book.line);
        const impliedProb = convertToImpliedProb(bookOdds);

        // PickLabs edge = stat projection margin + payout value vs vig-neutral 50%
        const edgeScore = margin + (0.50 - impliedProb);

        if (edgeScore > highestEdge) {
            highestEdge = edgeScore;
            bestPlay = {
                recommended_book: book.sportsbook,
                action: stance,
                line: book.line,
                odds: bookOdds,
                picklabs_edge_score: Math.round(edgeScore * 100) / 100,
                implied_prob_pct: Math.round(impliedProb * 1000) / 10,
            };
        }
    }

    return {
        player: playerName,
        stat_label: statLabel,
        math_breakdown: {
            wma_5: Math.round(wma5 * 10) / 10,
            avg_10: Math.round(avg10 * 10) / 10,
            avg_20: Math.round(avg20 * 10) / 10,
            final_projection: Math.round(picklabsProjection * 100) / 100,
        },
        the_answer: bestPlay,
        confidence: bestPlay ? edgeToConfidence(bestPlay.picklabs_edge_score) : 'LOW',
    };
}

/** Generates seeded mock game-log stats for a player (20 games, realistic variation). */
export function generateMockGameLog(seed: string, baseline: number, variance = 0.3): number[] {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    const rng = () => { h ^= h << 13; h ^= h >> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    return Array.from({ length: 20 }, () => {
        const v = baseline * (1 + (rng() - 0.5) * 2 * variance);
        return Math.max(0, Math.round(v * 10) / 10);
    });
}

/** Standard mock sportsbook odds payload for demo use. */
export function getMockOddsBooks(line: number): OddsBook[] {
    return [
        { sportsbook: 'Vegas Consensus', line, over_odds: -110, under_odds: -110 },
        { sportsbook: 'DraftKings', line, over_odds: -115, under_odds: -105 },
        { sportsbook: 'FanDuel', line: line - 1, over_odds: -130, under_odds: 100 },
        { sportsbook: 'BetMGM', line: line + 1, over_odds: 110, under_odds: -140 },
    ];
}

/** Confidence badge color class. */
export function confidenceColor(c: 'HIGH' | 'MED' | 'LOW'): string {
    return c === 'HIGH' ? 'bg-primary/20 text-primary border-primary/40'
        : c === 'MED' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/40'
            : 'bg-red-500/20 text-red-400 border-red-400/40';
}

// ─── NEW: PickLabsEngine (translated from Python) ──────────────────────────────

export interface GameLog {
    game_id: string;
    date: string;
    player_id: string;
    opp_id?: string;
    pos?: string;
    days_rest?: number;
    status?: string;
    pts?: number;
    reb?: number;
    ast?: number;
    stl?: number;
    blk?: number;
    pra?: number; // pts+reb+ast combined
    [key: string]: number | string | undefined;
}

export interface PropLine {
    id: string;
    name: string;
    stat: string;
    line: number;
}

export interface PlayerAnalysis {
    L5_hit: number;
    L10_hit: number;
    Season_hit: number;
    b2b_hit: number;
    home_hit: number;
    away_hit: number;
    prop_type: string;
    line: number;
}

export interface MarketMover {
    name: string;
    stat: string;
    line: number;
    avg_l5: number;
    diff: number; // % above/below the line
    direction: 'OVER' | 'UNDER';
}

export type MatchupGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface GradedMatchup {
    grade: MatchupGrade;
    opp_def_avg: number;
    league_avg: number;
    score: number;
}

/**
 * Calculates what percentage of the time a player exceeded a given line.
 * Equivalent to PickLabsEngine.calculate_hit_rate() in Python.
 */
export function calculateHitRate(logs: GameLog[], stat: string, line: number): number {
    if (logs.length === 0) return 0;
    const hits = logs.filter(g => {
        const val = g[stat];
        return typeof val === 'number' && val > line;
    }).length;
    return Math.round((hits / logs.length) * 1000) / 10;
}

/**
 * Full player prop analysis across multiple timeframes and situational splits.
 * Mirrors PickLabsEngine.get_player_analysis() from Python.
 */
export function getPlayerAnalysis(
    gameLog: GameLog[],
    playerId: string,
    propType: string,
    line: number
): PlayerAnalysis {
    const playerGames = gameLog
        .filter(g => g.player_id === playerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const b2bGames = playerGames.filter(g => g.days_rest === 0);
    const homeGames = playerGames.filter(g => g.is_home === 1);
    const awayGames = playerGames.filter(g => g.is_home === 0);

    return {
        L5_hit: calculateHitRate(playerGames.slice(0, 5), propType, line),
        L10_hit: calculateHitRate(playerGames.slice(0, 10), propType, line),
        Season_hit: calculateHitRate(playerGames, propType, line),
        b2b_hit: calculateHitRate(b2bGames, propType, line),
        home_hit: calculateHitRate(homeGames, propType, line),
        away_hit: calculateHitRate(awayGames, propType, line),
        prop_type: propType,
        line,
    };
}

/**
 * Finds overperformers vs their prop line based on L5 average.
 * Mirrors PickLabsEngine.get_market_movers() from Python.
 */
export function getMarketMovers(gameLog: GameLog[], props: PropLine[]): MarketMover[] {
    return props.map(p => {
        const playerLast5 = gameLog
            .filter(g => g.player_id === p.id)
            .slice(0, 5);
        const avg = playerLast5.length > 0
            ? playerLast5.reduce((sum, g) => sum + ((g[p.stat] as number) || 0), 0) / playerLast5.length
            : 0;
        const diff = p.line > 0 ? Math.round(((avg - p.line) / p.line) * 1000) / 10 : 0;
        return {
            name: p.name,
            stat: p.stat,
            line: p.line,
            avg_l5: Math.round(avg * 10) / 10,
            diff,
            direction: diff >= 0 ? 'OVER' : 'UNDER',
        } as MarketMover;
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

/**
 * Grades a matchup from A+ (great for the player) to F (terrible).
 * Mirrors PickLabsEngine.generate_matchup_grade() from Python.
 */
export function generateMatchupGrade(
    gameLog: GameLog[],
    playerPos: string,
    opponentId: string,
    propType: string
): GradedMatchup {
    const oppDefGames = gameLog.filter(g => g.opp_id === opponentId && g.pos === playerPos);
    const leagueGames = gameLog.filter(g => g.pos === playerPos);

    const avg = (arr: GameLog[]) => {
        if (arr.length === 0) return 0;
        return arr.reduce((s, g) => s + ((g[propType] as number) || 0), 0) / arr.length;
    };

    const oppDefAvg = avg(oppDefGames);
    const leagueAvg = avg(leagueGames) || 1;
    const score = oppDefAvg / leagueAvg;

    let grade: MatchupGrade = 'C';
    if (score >= 1.25) grade = 'A+';
    else if (score >= 1.10) grade = 'A';
    else if (score >= 1.00) grade = 'B';
    else if (score >= 0.90) grade = 'C';
    else if (score >= 0.80) grade = 'D';
    else grade = 'F';

    return {
        grade,
        opp_def_avg: Math.round(oppDefAvg * 10) / 10,
        league_avg: Math.round(leagueAvg * 10) / 10,
        score: Math.round(score * 100) / 100,
    };
}

/** Returns the CSS color classes for a matchup grade badge. */
export function gradeColor(grade: MatchupGrade): string {
    if (grade === 'A+' || grade === 'A') return 'bg-primary/20 text-primary border-primary/40';
    if (grade === 'B') return 'bg-blue-500/20 text-blue-400 border-blue-400/40';
    if (grade === 'C') return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/40';
    if (grade === 'D') return 'bg-orange-500/20 text-orange-400 border-orange-400/40';
    return 'bg-red-500/20 text-red-400 border-red-400/40'; // F
}

/**
 * Generates a seeded mock game log for a player (20 games).
 * Used for demo rendering of the Analytics tab when real data isn't available.
 */
export function generateMockGameLogFull(
    playerId: string,
    opponentId = 'OPP',
    baseline: { pts?: number; reb?: number; ast?: number } = { pts: 22, reb: 6, ast: 4 }
): GameLog[] {
    let h = 0;
    for (let i = 0; i < playerId.length; i++) h = Math.imul(31, h) + playerId.charCodeAt(i) | 0;
    const rng = () => { h ^= h << 13; h ^= h >> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    const now = new Date();
    return Array.from({ length: 20 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 3));
        const pts = Math.max(0, Math.round((baseline.pts ?? 20) * (0.7 + rng() * 0.6)));
        const reb = Math.max(0, Math.round((baseline.reb ?? 5) * (0.7 + rng() * 0.6)));
        const ast = Math.max(0, Math.round((baseline.ast ?? 4) * (0.7 + rng() * 0.6)));
        return {
            game_id: `g-${playerId}-${i}`,
            date: d.toISOString().split('T')[0],
            player_id: playerId,
            opp_id: opponentId,
            pos: 'PG',
            days_rest: i % 3 === 0 ? 0 : 1,
            is_home: rng() > 0.5 ? 1 : 0,
            pts,
            reb,
            ast,
            pra: pts + reb + ast,
        };
    });
}
