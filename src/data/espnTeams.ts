/* eslint-disable @typescript-eslint/no-explicit-any */
// ESPN Teams Service — live team stats, schedule, standings, last-5 form
// Supports NBA, NFL, MLB, NHL

import { NBA_TEAM_IDS, NFL_TEAM_IDS, MLB_TEAM_IDS, NHL_TEAM_IDS } from './espnService';

export interface ESPNTeamInfo {
    id: number;
    name: string;
    abbr: string;
    logo: string;
    record: string;         // "31-26"
    wins: number;
    losses: number;
    winPct: number;         // 0.00–1.00
    standing: string;       // "3rd in Atlantic"
    streak: string;         // "W3" or "L2"
    homeRecord: string;     // "18-10"
    awayRecord: string;     // "13-16"
    last10: string;         // "6-4"
    pointsFor: number;
    pointsAgainst: number;
    differential: number;
    headCoach: string;
    venue: string;
    founded: string;
    championships: number;
    recentForm: ('W' | 'L' | 'D')[];  // last 5 game results
    injuries: { player: string; status: string; injury: string }[];
}

export interface ESPNScheduleGame {
    id: string;
    date: string;
    isHome: boolean;
    opponentName: string;
    opponentAbbr: string;
    opponentLogo: string;
    result: 'W' | 'L' | 'D' | 'upcoming';
    teamScore: number | null;
    opponentScore: number | null;
    statusDetail: string;
}

// ─── Sport config ─────────────────────────────────────────────────────────────

interface SportCfg {
    sport: string;
    league: string;
    season: number;
    logoPath: string;   // ESPN CDN path part  e.g. "nba"
}

const SPORT_CFG: Record<string, SportCfg> = {
    'NBA': { sport: 'basketball', league: 'nba', season: 2026, logoPath: 'nba' },
    'NFL': { sport: 'football', league: 'nfl', season: 2025, logoPath: 'nfl' },
    'MLB': { sport: 'baseball', league: 'mlb', season: 2025, logoPath: 'mlb' },
    'NHL': { sport: 'hockey', league: 'nhl', season: 2026, logoPath: 'nhl' },
};

const SPORT_IDS: Record<string, Record<string, number>> = {
    'NBA': NBA_TEAM_IDS,
    'NFL': NFL_TEAM_IDS,
    'MLB': MLB_TEAM_IDS,
    'NHL': NHL_TEAM_IDS,
};

const resolveTeamId = (teamName: string, sport: string): number | null => {
    const ids = SPORT_IDS[sport];
    if (!ids) return null;
    if (ids[teamName]) return ids[teamName];
    const lastWord = (teamName.split(' ').pop() ?? '').toLowerCase();
    const key = Object.keys(ids).find(k =>
        teamName.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(lastWord)
    );
    return key ? ids[key] : null;
};

// ─── Team season info / record ─────────────────────────────────────────────────

export const fetchESPNTeamInfo = async (teamName: string, sport: string, providedTeamId?: string): Promise<ESPNTeamInfo | null> => {
    const cfg = SPORT_CFG[sport];
    const teamId = providedTeamId || resolveTeamId(teamName, sport);
    if (!cfg || !teamId) return null;

    try {
        // Site API gives record, coach, venue in one call
        const url = `https://site.api.espn.com/apis/site/v2/sports/${cfg.sport}/${cfg.league}/teams/${teamId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const t = data.team as Record<string, unknown>;

        // Record parsing
        const record = (t.record as Record<string, unknown>)?.items as { summary: string; stats?: { name: string; value: number }[] }[] | undefined;
        let wins = 0, losses = 0, homeW = 0, homeL = 0, awayW = 0, awayL = 0, l10W = 0, l10L = 0;
        let streak = '';

        if (record) {
            const overall = record.find(r => !r.summary?.includes('-') || r.summary === record[0]?.summary);
            const findStat = (items: typeof record, name: string) => {
                for (const item of items) {
                    const s = item.stats?.find((x) => x.name === name);
                    if (s !== undefined) return s.value;
                }
                return 0;
            };
            wins = findStat(record, 'wins');
            losses = findStat(record, 'losses');
            homeW = findStat(record, 'homeWins');
            homeL = findStat(record, 'homeLosses');
            awayW = findStat(record, 'roadWins');
            awayL = findStat(record, 'roadLosses');
            l10W = findStat(record, 'last10Wins');
            l10L = findStat(record, 'last10Losses');
            const streakLen = findStat(record, 'streakLength');
            const streakType = record[0]?.stats?.find(s => s.name === 'streak')?.value ?? 0;
            streak = `${streakType > 0 ? 'W' : 'L'}${Math.abs(streakLen) || Math.abs(streakType as number) || 1}`;
            void overall;
        }

        const logo = (t.logos as { href: string }[])?.[0]?.href ?? `https://a.espncdn.com/i/teamlogos/${cfg.logoPath}/500/${teamId}.png`;
        const coach = (t.coaches as { firstName: string; lastName: string }[])?.[0];
        const franchiseInfo = t.franchise as Record<string, unknown> | undefined;
        const venue = t.venue as Record<string, unknown> | undefined;
        const winPct = (wins + losses) > 0 ? wins / (wins + losses) : 0.5;

        // Recent form from last 5 schedule games
        const recentForm = await fetchTeamLastFive(teamName, sport);

        // Injuries from ESPN news
        let injuries: { player: string; status: string; injury: string }[] = [];
        try {
            const injRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${cfg.sport}/${cfg.league}/teams/${teamId}/injuries`);
            if (injRes.ok) {
                const injData = await injRes.json();
                injuries = ((injData.injuries ?? []) as Record<string, unknown>[]).slice(0, 6).map(inj => {
                    const details = inj.details as Record<string, unknown> | undefined;
                    return {
                        player: String((inj.athlete as Record<string, string>)?.displayName ?? 'Unknown'),
                        status: String(inj.status ?? 'Day-To-Day'),
                        injury: String(details?.['type'] ?? 'Injury'),
                    };
                });
            }
        } catch {/* no injuries endpoint for this sport */ }

        return {
            id: teamId,
            name: String(t.displayName ?? teamName),
            abbr: String(t.abbreviation ?? ''),
            logo,
            record: `${wins}-${losses}`,
            wins, losses, winPct,
            standing: String((t.standingSummary as string) ?? ''),
            streak,
            homeRecord: `${homeW}-${homeL}`,
            awayRecord: `${awayW}-${awayL}`,
            last10: `${l10W}-${l10L}`,
            pointsFor: 0,   // filled separately if needed
            pointsAgainst: 0,
            differential: 0,
            headCoach: coach ? `${coach.firstName} ${coach.lastName}` : 'Head Coach',
            venue: String(venue?.fullName ?? ''),
            founded: String(franchiseInfo?.location ?? ''),
            championships: 0,
            recentForm,
            injuries,
        };
    } catch (err) {
        console.warn(`ESPN team info failed for ${teamName} (${sport}):`, err);
        return null;
    }
};

// ─── Team schedule ─────────────────────────────────────────────────────────────

export const fetchESPNTeamSchedule = async (teamName: string, sport: string): Promise<ESPNScheduleGame[]> => {
    const cfg = SPORT_CFG[sport];
    const teamId = resolveTeamId(teamName, sport);
    if (!cfg || !teamId) return [];

    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${cfg.sport}/${cfg.league}/teams/${teamId}/schedule?season=${cfg.season}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();

        const events = (data.events ?? []) as Record<string, unknown>[];
        const games: ESPNScheduleGame[] = [];

        for (const ev of events) {
            try {
                const comp = ((ev.competitions ?? []) as Record<string, unknown>[])[0];
                if (!comp) continue;
                const competitors = (comp.competitors ?? []) as Record<string, unknown>[];
                const home = competitors.find(c => c.homeAway === 'home');
                const away = competitors.find(c => c.homeAway === 'away');
                const isTeamHome = home && (home.team as Record<string, unknown>)?.id === String(teamId);
                const opponent = isTeamHome ? away : home;
                const myComp = isTeamHome ? home : away;

                const oppTeam = (opponent?.team ?? {}) as Record<string, unknown>;
                const statusState = (ev.status as Record<string, unknown>)?.type as Record<string, unknown> | undefined;
                const completed = statusState?.completed as boolean | undefined;
                const inProgress = statusState?.state === 'in';

                let result: 'W' | 'L' | 'D' | 'upcoming' = 'upcoming';
                if (completed || inProgress) {
                    const myScore = Number(myComp?.score ?? 0);
                    const oppScore = Number(opponent?.score ?? 0);
                    if (myScore > oppScore) result = 'W';
                    else if (myScore < oppScore) result = 'L';
                    else result = 'D';
                }

                games.push({
                    id: String(ev.id ?? ''),
                    date: String(ev.date ?? ''),
                    isHome: !!isTeamHome,
                    opponentName: String(oppTeam.displayName ?? oppTeam.shortDisplayName ?? 'Opponent'),
                    opponentAbbr: String(oppTeam.abbreviation ?? 'OPP'),
                    opponentLogo: String(oppTeam.logo ?? (oppTeam.logos as { href: string }[])?.[0]?.href ?? ''),
                    result,
                    teamScore: completed || inProgress ? Number(myComp?.score ?? null) : null,
                    opponentScore: completed || inProgress ? Number(opponent?.score ?? null) : null,
                    statusDetail: String((ev.status as Record<string, unknown>)?.type ?? '')
                });
            } catch { continue; }
        }

        return games;
    } catch (err) {
        console.warn(`ESPN team schedule failed for ${teamName} (${sport}):`, err);
        return [];
    }
};

// ─── Last 5 game results (W/L form) ───────────────────────────────────────────

export const fetchTeamLastFive = async (teamName: string, sport: string): Promise<('W' | 'L' | 'D')[]> => {
    try {
        const games = await fetchESPNTeamSchedule(teamName, sport);
        const completed = games.filter(g => g.result !== 'upcoming').slice(-5);
        return completed.map(g => g.result as 'W' | 'L' | 'D');
    } catch {
        return [];
    }
};

// ─── AI Prediction — win probability via Elo-like formula ────────────────────

export interface AIPrediction {
    homeWinProb: number;     // 0–100
    awayWinProb: number;
    spread: string;          // e.g. "-4.5"
    moneylineHome: string;   // e.g. "-165"
    moneylineAway: string;   // e.g. "+140"
    total: string;           // e.g. "228.5"
    overUnderPick: 'Over' | 'Under';
    confidence: number;      // 0–100
    insight: string;
}

const sportTotal: Record<string, number> = {
    'NBA': 228.5, 'NFL': 47.5, 'MLB': 8.5, 'NHL': 5.5, 'Soccer': 2.5, 'NCAAB': 145.5
};

export const generateAIPrediction = (
    homeRecord: string,
    awayRecord: string,
    sport: string,
    homeLastFive: ('W' | 'L' | 'D')[],
    awayLastFive: ('W' | 'L' | 'D')[],
    isNeutral = false
): AIPrediction => {
    const parseRecord = (rec: string) => {
        const [w, l] = rec.split('-').map(Number);
        return { w: w || 0, l: l || 0 };
    };
    const home = parseRecord(homeRecord);
    const away = parseRecord(awayRecord);

    const homeGP = home.w + home.l || 1;
    const awayGP = away.w + away.l || 1;
    const homeWinPct = home.w / homeGP;
    const awayWinPct = away.w / awayGP;

    // Last-5 form bonus
    const formScore = (form: ('W' | 'L' | 'D')[]) =>
        form.reduce((acc, r) => acc + (r === 'W' ? 1 : r === 'D' ? 0.5 : 0), 0) / Math.max(form.length, 1);

    const homeForm = formScore(homeLastFive);
    const awayForm = formScore(awayLastFive);

    // Simple Elo-like probability
    const homeAdv = isNeutral ? 0 : 0.04;
    const homeRating = homeWinPct * 0.7 + homeForm * 0.3 + homeAdv;
    const awayRating = awayWinPct * 0.7 + awayForm * 0.3;
    const total_rating = homeRating + awayRating || 1;

    let homeWinProb = Math.round((homeRating / total_rating) * 100);
    homeWinProb = Math.min(Math.max(homeWinProb, 25), 75); // clamp 25–75%
    const awayWinProb = 100 - homeWinProb;

    // Spread (points handicap based on win prob delta)
    const probDelta = homeWinProb - 50;
    const spreadNum = parseFloat((-(probDelta * 0.28)).toFixed(1));
    const spread = spreadNum >= 0 ? `+${spreadNum.toFixed(1)}` : `${spreadNum.toFixed(1)}`;

    // Moneyline from probability
    const toML = (prob: number): string => {
        if (prob >= 50) return `-${Math.round(prob / (100 - prob) * 100)}`;
        return `+${Math.round((100 - prob) / prob * 100)}`;
    };

    const baseTotal = sportTotal[sport] ?? 200;
    // Nudge total slightly based on form
    const totalAdj = baseTotal + (homeForm + awayForm - 1) * (sport === 'NBA' ? 4 : 1);

    const confidence = Math.min(95, 50 + Math.abs(probDelta) * 1.2 + (homeForm + awayForm - 1) * 10);
    const spreadPct = Math.abs(probDelta);

    const insights = [
        `${homeWinProb}% home win probability based on season records and recent form.`,
        `${awayWinProb > homeWinProb ? 'Away' : 'Home'} team hot — ${(Math.max(homeForm, awayForm) * 5).toFixed(0)}/5 in last five.`,
        `Total set at ${totalAdj.toFixed(1)} — both offenses trending ${homeForm + awayForm > 1 ? 'up' : 'down'}.`,
        `Spread of ${String(spread)} reflects ${spreadPct.toFixed(1)}pt home advantage.`,
    ];

    return {
        homeWinProb,
        awayWinProb,
        spread: String(spread),
        moneylineHome: toML(homeWinProb),
        moneylineAway: toML(awayWinProb),
        total: totalAdj.toFixed(1),
        overUnderPick: (totalAdj > baseTotal ? 'Over' : 'Under') as 'Over' | 'Under',
        confidence: Math.round(confidence),
        insight: insights[Math.floor(Math.random() * insights.length)],
    };
};

// ─── Mass Fetch All Teams ───────────────────────────────────────────────────

export interface ESPNTeamListItem {
    id: string;
    uid: string;
    slug: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    name: string;
    nickname: string;
    location: string;
    color: string;
    alternateColor: string;
    isActive: boolean;
    isAllStar: boolean;
    logos: {
        href: string;
        alt: string;
        rel: string[];
        width: number;
        height: number;
    }[];
}

export const fetchAllTeams = async (sport: string, league: string): Promise<ESPNTeamListItem[]> => {
    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch teams for ${sport}/${league}`);
        const data = await res.json();

        // ESPN returns { sports: [ { leagues: [ { teams: [ { team: {...} } ] } ] } ] }
        const teamsRaw = data.sports?.[0]?.leagues?.[0]?.teams || [];
        return teamsRaw.map((t: any) => t.team as ESPNTeamListItem);
    } catch (err) {
        console.error(`Error fetching all teams for ${sport}/${league}:`, err);
        return [];
    }
};
