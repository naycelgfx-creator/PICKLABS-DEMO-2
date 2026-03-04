/**
 * BetSlipLinker — TypeScript port of the Python BetSlipLinker class.
 * Generates deep-link URLs that open a pre-filled bet slip on FanDuel or DraftKings.
 *
 * Usage:
 *   import { linker } from './betSlipLinker';
 *   linker.createFanDuelLink({ marketId: '701.12345', selectionId: '12345678', amount: 25 })
 */

const FD_BASE = 'https://sportsbook.fanduel.com/betslip/add?';
const DK_BASE = 'https://sportsbook.draftkings.com/betslip/add?';

// ── Types ──────────────────────────────────────────────────────────────────

export interface FanDuelBetOptions {
    marketId: string;     // e.g. "701.12345"
    selectionId: string;  // unique runner/player ID from FD API
    amount?: number;      // stake in dollars (default 10)
}

export interface DraftKingsBetOptions {
    eventId: string;      // DK event ID
    selectionId: string;  // DK outcome/selection ID ("outcomeIds")
}

// Multi-leg parlay options (FanDuel supports stacking multiple selectionIds)
export interface FanDuelParlayOptions {
    legs: Array<{ marketId: string; selectionId: string }>;
    amount?: number;
}

// ── Core class ─────────────────────────────────────────────────────────────
export class BetSlipLinker {
    /**
     * Generates a FanDuel deep link that opens the bet slip with one selection.
     * Mirrors Python: linker.create_fanduel_link(market_id, selection_id, amount)
     */
    createFanDuelLink({ marketId, selectionId, amount = 10 }: FanDuelBetOptions): string {
        const params = new URLSearchParams({
            selectionId,
            marketId,
            stake: String(amount),
        });
        return FD_BASE + params.toString();
    }

    /**
     * Generates a DraftKings deep link.
     * Mirrors Python: linker.create_draftkings_link(event_id, selection_id)
     */
    createDraftKingsLink({ eventId, selectionId }: DraftKingsBetOptions): string {
        const params = new URLSearchParams({
            eventIds: eventId,
            outcomeIds: selectionId,
        });
        return DK_BASE + params.toString();
    }

    /**
     * Bonus: multi-leg FanDuel parlay link.
     * Stacks multiple selectionIds/marketIds into one bet slip URL.
     */
    createFanDuelParlay({ legs, amount = 10 }: FanDuelParlayOptions): string {
        const params = new URLSearchParams({ stake: String(amount) });
        legs.forEach(({ marketId, selectionId }) => {
            params.append('selectionId', selectionId);
            params.append('marketId', marketId);
        });
        return FD_BASE + params.toString();
    }

    /**
     * Bonus: opens a DraftKings bet slip with multiple outcomes (same-game parlay style).
     */
    createDraftKingsMulti(eventId: string, selectionIds: string[]): string {
        const params = new URLSearchParams({
            eventIds: eventId,
            outcomeIds: selectionIds.join(','),
        });
        return DK_BASE + params.toString();
    }
}

// ── Singleton export ───────────────────────────────────────────────────────
export const linker = new BetSlipLinker();
