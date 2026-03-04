import { BetPick } from '../App';

// Mirroring the Python SQLAlchemy BetTracker model
export interface BetTracker {
    id: string;             // Primary Key
    userEmail: string;      // Foreign Key-ish
    gameType: string;       // e.g., Moneyline, Spread
    propType: string;       // e.g., Over 25.5 Points, Under 8.5 Assists
    wager: number;
    odds: number;
    status: 'Pending' | 'Won' | 'Lost';
    payout: number;
    createdAt: number;      // Epoch timestamp for sorting
    matchup: string;        // Added to match TransactionHistory UI needs
}

const DB_KEY = 'picklabs_bets_db';

/** Initialize the DB with an empty array if it doesn't exist */
export function initBetsDB(): void {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify([]));
    }
}

/** Retrieve all bets from localStorage */
export function getAllBets(): BetTracker[] {
    const data = localStorage.getItem(DB_KEY);
    if (!data) return [];
    try {
        return JSON.parse(data) as BetTracker[];
    } catch {
        return [];
    }
}

/** Save all bets to localStorage */
export function saveAllBets(bets: BetTracker[]): void {
    localStorage.setItem(DB_KEY, JSON.stringify(bets));
}

/** Get bets for a specific user, sorted newest first */
export function getUserBets(email: string): BetTracker[] {
    const allBets = getAllBets();
    return allBets
        .filter(b => b.userEmail === email)
        .sort((a, b) => b.createdAt - a.createdAt);
}

/** Calculate potential payout based on stake and American odds */
function calculatePayout(wager: number, odds: number): number {
    if (odds > 0) {
        return wager + (wager * (odds / 100)); // Win amount + original stake returned
    } else {
        return wager + (wager / (Math.abs(odds) / 100)); // Win amount + original stake returned
    }
}

/** Convert a UI BetPick to a DB BetTracker and save it */
export function logBet(email: string, betPick: BetPick): BetTracker {
    const allBets = getAllBets();

    // Parse odds directly from the string, default to -110 if unparseable
    let numOdds = -110;
    try {
        const parsed = parseInt(betPick.odds.replace('+', ''), 10);
        if (!isNaN(parsed)) numOdds = parsed;
    } catch (e) {
        // use default -110
    }

    const payout = calculatePayout(betPick.stake, numOdds);

    const newBet: BetTracker = {
        id: crypto.randomUUID(),
        userEmail: email,
        gameType: betPick.type === 'Prop' ? 'Player Prop' : (betPick.type as any) === 'Value' ? 'Value Pick' : betPick.type,
        propType: betPick.team,
        matchup: betPick.matchupStr,
        wager: betPick.stake,
        odds: numOdds,
        status: 'Pending',
        payout: payout,
        createdAt: Date.now()
    };

    allBets.push(newBet);
    saveAllBets(allBets);
    return newBet;
}

/** Convert manual inputs to a DB BetTracker and save it */
export function logManualBet(email: string, matchup: string, wager: number, odds: number, status: 'Pending' | 'Won' | 'Lost'): BetTracker {
    const allBets = getAllBets();
    const payout = calculatePayout(wager, odds);

    const newBet: BetTracker = {
        id: crypto.randomUUID(),
        userEmail: email,
        gameType: 'Manual Entry',
        propType: 'Manual',
        matchup: matchup,
        wager: wager,
        odds: odds,
        status: status,
        payout: payout,
        createdAt: Date.now()
    };

    allBets.push(newBet);
    saveAllBets(allBets);
    return newBet;
}

/** Example function to simulate bet settlement */
export function settleBet(betId: string, status: 'Won' | 'Lost'): boolean {
    const allBets = getAllBets();
    const idx = allBets.findIndex(b => b.id === betId);
    if (idx === -1) return false;

    allBets[idx].status = status;
    saveAllBets(allBets);
    return true;
}

/** Delete all bets for a specific user when their account is banned by admin */
export function adminDeleteUserBets(email: string): void {
    const allBets = getAllBets();
    const remaining = allBets.filter(b => b.userEmail !== email);
    saveAllBets(remaining);
}
