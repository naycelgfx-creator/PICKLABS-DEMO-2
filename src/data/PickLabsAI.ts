/**
 * PickLabsAI.ts
 * Direct TypeScript port of the Python PickLabsAI class.
 *
 * Python original:
 *   class PickLabsAI:
 *     def convert_american_to_prob(self, odds): ...
 *     def get_top_ai_picks(self, live_market_data): ...
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketEntry {
    team: string;
    sport: string;        // "NBA", "NCAAW", "NFL", etc.
    opponent: string;
    fdOdds: number;       // FanDuel American odds e.g. +110, -130
    game: string;         // "Lakers vs Warriors"
}

export interface AIPick {
    pick: string;
    opponent: string;
    game: string;
    type: 'MONEYLINE';
    sport: string;
    edge: string;         // e.g. "15.2%"
    edgeRaw: number;      // 0–1
    grade: 'A+' | 'A';
    aiProb: number;       // 0–100
    marketProb: number;   // 0–100
    fdOdds: number;
}

// ─── AI Win Probability Projections ──────────────────────────────────────────
// In a real setup these stream from the simulation engine.
// Format: sport → team → win probability (0–1)

export const AI_PROJECTIONS: Record<string, Record<string, number>> = {
    NBA: {
        Lakers: 0.62,
        Warriors: 0.38,
        Celtics: 0.71,
        Heat: 0.45,
        Nuggets: 0.67,
        Thunder: 0.64,
        Bucks: 0.53,
        Knicks: 0.49,
        Suns: 0.44,
        Clippers: 0.51,
    },
    NCAAW: {
        'South Carolina': 0.88,
        Iowa: 0.12,
        UConn: 0.79,
        LSU: 0.61,
    },
    NFL: {
        Chiefs: 0.72,
        Eagles: 0.61,
        Bills: 0.58,
        Ravens: 0.55,
        '49ers': 0.53,
    },
    NHL: {
        Bruins: 0.60,
        Avalanche: 0.65,
        Panthers: 0.58,
        Rangers: 0.52,
    },
    MLB: {
        Dodgers: 0.68,
        Braves: 0.59,
        Astros: 0.57,
        Yankees: 0.54,
    },
    WBC: {
        Japan: 0.66,
        USA: 0.63,
        'Dominican Republic': 0.58,
        Venezuela: 0.54,
        Mexico: 0.51,
        'Puerto Rico': 0.49,
    },
};

// ─── PickLabsAI Engine (port of Python class) ─────────────────────────────────

export class PickLabsAI {
    private projections: Record<string, Record<string, number>>;

    constructor(projections = AI_PROJECTIONS) {
        this.projections = projections;
    }

    /**
     * Port of Python convert_american_to_prob()
     * Converts American odds → implied win probability
     */
    convertAmericanToProb(odds: number): number {
        if (odds > 0) {
            return 100 / (odds + 100);
        }
        return Math.abs(odds) / (Math.abs(odds) + 100);
    }

    /**
     * Port of Python get_top_ai_picks()
     * Edge threshold: 8% → pick, 12% → A+
     */
    getTopAIPicks(liveMarketData: MarketEntry[]): AIPick[] {
        const aiPicks: AIPick[] = [];

        for (const game of liveMarketData) {
            const marketProb = this.convertAmericanToProb(game.fdOdds);
            const sportProjections = this.projections[game.sport] ?? {};
            const aiProb = sportProjections[game.team] ?? 0;

            const edge = aiProb - marketProb;

            if (edge > 0.08) { // 8% edge threshold
                aiPicks.push({
                    pick: game.team,
                    opponent: game.opponent,
                    game: game.game,
                    type: 'MONEYLINE',
                    sport: game.sport,
                    edge: `${(edge * 100).toFixed(1)}%`,
                    edgeRaw: edge,
                    grade: edge > 0.12 ? 'A+' : 'A',
                    aiProb: Math.round(aiProb * 100),
                    marketProb: Math.round(marketProb * 100),
                    fdOdds: game.fdOdds,
                });
            }
        }

        // Sort by edge descending
        return aiPicks.sort((a, b) => b.edgeRaw - a.edgeRaw);
    }
}

// ─── Default market simulation data ──────────────────────────────────────────
// Mirrors: market = [{"team": "Lakers", "fd_odds": +110}]

export const SIMULATED_MARKET: MarketEntry[] = [
    { team: 'Lakers', opponent: 'Warriors', sport: 'NBA', fdOdds: +110, game: 'Lakers vs Warriors' },
    { team: 'Warriors', opponent: 'Lakers', sport: 'NBA', fdOdds: +120, game: 'Lakers vs Warriors' },
    { team: 'Celtics', opponent: 'Heat', sport: 'NBA', fdOdds: -150, game: 'Celtics vs Heat' },
    { team: 'Heat', opponent: 'Celtics', sport: 'NBA', fdOdds: +190, game: 'Celtics vs Heat' },
    { team: 'Nuggets', opponent: 'Suns', sport: 'NBA', fdOdds: -140, game: 'Nuggets vs Suns' },
    { team: 'Thunder', opponent: 'Knicks', sport: 'NBA', fdOdds: -115, game: 'Thunder vs Knicks' },
    { team: 'South Carolina', opponent: 'Iowa', sport: 'NCAAW', fdOdds: -400, game: 'South Carolina vs Iowa' },
    { team: 'Iowa', opponent: 'South Carolina', sport: 'NCAAW', fdOdds: +300, game: 'South Carolina vs Iowa' },
    { team: 'Chiefs', opponent: 'Eagles', sport: 'NFL', fdOdds: -140, game: 'Chiefs vs Eagles' },
    { team: 'Bruins', opponent: 'Rangers', sport: 'NHL', fdOdds: -120, game: 'Bruins vs Rangers' },
    { team: 'Dodgers', opponent: 'Braves', sport: 'MLB', fdOdds: -155, game: 'Dodgers vs Braves' },
    { team: 'Japan', opponent: 'USA', sport: 'WBC', fdOdds: -110, game: 'Japan vs USA' },
    { team: 'USA', opponent: 'Japan', sport: 'WBC', fdOdds: -110, game: 'Japan vs USA' },
];
