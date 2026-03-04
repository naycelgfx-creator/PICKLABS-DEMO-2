/**
 * PickLabsDFSEvEngine.ts
 * TypeScript port of the Python PickLabsDFSEvEngine class for analyzing DFS squares.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DFSAnalysis {
    player: string;
    stat: string;
    line: number;
    suggested_play: string;
    true_win_probability: string;
    trueProb: number;
    dfs_edge: string;
    action: string;
    isProfitable: boolean;
    sharpOver: number;
    sharpUnder: number;
}

// ─── PickLabsDFSEvEngine class ──────────────────────────────────────────────────

export class PickLabsDFSEvEngine {
    // The mathematically proven break-even point for a PrizePicks 5-Pick Flex
    private dfsBreakevenProb = 0.542;

    /**
     * Converts American odds to implied probability and removes the sportsbook's vig.
     */
    calculateTrueProb(overOdds: number, underOdds: number): { trueOver: number, trueUnder: number } {
        const getImplied = (odds: number) => {
            if (odds < 0) {
                return Math.abs(odds) / (Math.abs(odds) + 100);
            }
            return 100 / (odds + 100);
        };

        const overProb = getImplied(overOdds);
        const underProb = getImplied(underOdds);

        // Remove the vig (the tax the book charges)
        const totalProb = overProb + underProb;
        const trueOver = overProb / totalProb;
        const trueUnder = underProb / totalProb;

        return { trueOver, trueUnder };
    }

    /**
     * Determines if a DFS square is mathematically profitable (+EV).
     */
    analyzeDfsSquare(
        player: string,
        stat: string,
        dfsLine: number,
        sharpLine: number,
        sharpOver: number,
        sharpUnder: number
    ): DFSAnalysis | { error: string } {
        // If the lines don't match perfectly, skip
        if (dfsLine !== sharpLine) {
            return { error: "Lines do not match exactly. Skip or run Poisson simulation." };
        }

        const { trueOver, trueUnder } = this.calculateTrueProb(sharpOver, sharpUnder);

        // Determine which side the sharp book thinks will happen
        let bestPlay: string;
        let winChance: number;

        if (trueOver > trueUnder) {
            bestPlay = "OVER";
            winChance = trueOver;
        } else {
            bestPlay = "UNDER";
            winChance = trueUnder;
        }

        // Calculate the mathematical Edge over the DFS platform
        const isProfitable = winChance > this.dfsBreakevenProb;
        const edgePercentage = (winChance - this.dfsBreakevenProb) * 100;

        return {
            player: player,
            stat: stat,
            line: dfsLine,
            suggested_play: bestPlay,
            true_win_probability: `${(winChance * 100).toFixed(1)}%`,
            trueProb: winChance,
            dfs_edge: isProfitable ? `+${edgePercentage.toFixed(2)}%` : "Negative EV",
            action: isProfitable && edgePercentage >= 1.5 ? "<span class=\"material-symbols-outlined text-orange-500 text-[10px] align-middle\">local_fire_department</span> LOCK IT IN" : "Pass",
            isProfitable: isProfitable,
            sharpOver: sharpOver,
            sharpUnder: sharpUnder
        };
    }
}

export const dfsEvEngine = new PickLabsDFSEvEngine();

// ─── Example Props ────────────────────────────────────────────────────────────

export interface PropPreset {
    player: string;
    stat: string;
    dfsLine: number;
    sharpLine: number;
    sharpOver: number;
    sharpUnder: number;
    sport: string;
}

export const PROP_PRESETS: PropPreset[] = [
    { player: "Luka Dončić", stat: "Assists", dfsLine: 8.5, sharpLine: 8.5, sharpOver: -145, sharpUnder: +115, sport: "NBA" },
    { player: "Jayson Tatum", stat: "Points", dfsLine: 28.5, sharpLine: 28.5, sharpOver: -130, sharpUnder: +105, sport: "NBA" },
    { player: "Stephen Curry", stat: "Threes", dfsLine: 4.5, sharpLine: 4.5, sharpOver: -160, sharpUnder: +130, sport: "NBA" },
    { player: "Nikola Jokić", stat: "Rebounds", dfsLine: 12.5, sharpLine: 12.5, sharpOver: -140, sharpUnder: +110, sport: "NBA" },
    { player: "Patrick Mahomes", stat: "Pass Yds", dfsLine: 285.5, sharpLine: 285.5, sharpOver: -120, sharpUnder: +100, sport: "NFL" },
    { player: "Scottie Scheffler", stat: "Score", dfsLine: 69.5, sharpLine: 69.5, sharpOver: +110, sharpUnder: -130, sport: "Golf" },
];
