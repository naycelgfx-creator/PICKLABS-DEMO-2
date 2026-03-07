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
