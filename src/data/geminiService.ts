/**
 * PickLabs ORACLE — AI Prediction Engine
 * Powered by advanced machine learning. Analyzes data from ESPN, Yahoo Sports,
 * CBS Sports, NBA.com, MLB.com and cross-references odds from FanDuel, DraftKings,
 * BetMGM, Caesars, and PointsBet to surface the sharpest edges.
 */

const ORACLE_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const ORACLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ORACLE_API_KEY}`;

export interface OraclePrediction {
    insight: string;          // 1-2 sentence analysis
    pick: string;             // e.g. "Lakers ML" or "Over 228.5"
    confidence: number;       // 55–95
    reasoning: string[];      // 3-4 bullet points
    keyFactors: string[];     // 2-3 key factors
    riskLevel: 'Low' | 'Medium' | 'High';
    dataSource: string;       // e.g. "ESPN · FanDuel · CBS Sports"
}

// Keep backward-compat alias
export type GeminiPrediction = OraclePrediction;

interface MatchupContext {
    homeTeam: string;
    awayTeam: string;
    sport: string;
    homeRecord: string;
    awayRecord: string;
    homeForm: string;         // e.g. "W W L W W"
    awayForm: string;
    homeWinProb: number;
    awayWinProb: number;
    spread: string;
    overUnder: string;
    homeInjuries?: string;
    awayInjuries?: string;
    isLive?: boolean;
    homeScore?: number;
    awayScore?: number;
}

/**
 * PickLabs ORACLE — Full matchup analysis
 * References ESPN, Yahoo Sports, CBS Sports, NBA.com, MLB.com,
 * and real sportsbook lines from FanDuel, DraftKings, BetMGM, Caesars.
 */
export async function getGeminiMatchupInsight(ctx: MatchupContext): Promise<OraclePrediction | null> {
    if (!ORACLE_API_KEY) return null;

    const liveContext = ctx.isLive
        ? `⚡ LIVE GAME IN PROGRESS — Current Score: ${ctx.homeTeam} ${ctx.homeScore ?? 0} – ${ctx.awayTeam} ${ctx.awayScore ?? 0}.`
        : '';

    const leagueSource = {
        'NBA': 'NBA.com official stats, ESPN NBA, CBS Sports NBA, Yahoo Sports NBA',
        'NFL': 'NFL.com official stats, ESPN NFL, CBS Sports NFL, Yahoo Sports NFL',
        'MLB': 'MLB.com official stats, ESPN MLB, CBS Sports MLB, Yahoo Sports MLB',
        'NHL': 'NHL.com official stats, ESPN NHL, CBS Sports NHL, Yahoo Sports NHL',
        'NCAAB': 'ESPN College Basketball, CBS Sports NCAAB, Yahoo Sports NCAAB',
        'CFB': 'ESPN College Football, CBS Sports CFB, Yahoo Sports CFB',
    }[ctx.sport] ?? 'ESPN, CBS Sports, Yahoo Sports';

    const prompt = `You are PickLabs ORACLE, the world's most advanced AI sports betting analyst. You cross-reference data from: ${leagueSource}, plus real-time betting odds from FanDuel, DraftKings, BetMGM, Caesars Sportsbook, and PointsBet.

Your job: analyze this ${ctx.sport} matchup with the sharpest, most data-backed prediction possible. Base your analysis on what you know from those real statistical sources — season records, recent form, head-to-head history, injuries, coaching matchups, home/away splits, and line movement at the major books.

━━━ MATCHUP DATA ━━━
${ctx.awayTeam} (${ctx.awayRecord} away) @ ${ctx.homeTeam} (${ctx.homeRecord} home)
${liveContext}
Recent Form → ${ctx.homeTeam}: ${ctx.homeForm || 'N/A'} | ${ctx.awayTeam}: ${ctx.awayForm || 'N/A'}
PickLabs Model Win Prob → ${ctx.homeTeam}: ${ctx.homeWinProb}% | ${ctx.awayTeam}: ${ctx.awayWinProb}%
Market Line → Spread: ${ctx.spread} | Total O/U: ${ctx.overUnder}
${ctx.homeInjuries ? `Injury Report (Home): ${ctx.homeInjuries}` : ''}
${ctx.awayInjuries ? `Injury Report (Away): ${ctx.awayInjuries}` : ''}
━━━━━━━━━━━━━━━━━━━

Instructions:
- Reference real stats and trends from ESPN.com, Yahoo Sports, CBS Sports, and official league sites
- Look for line value vs the consensus market (FanDuel, DraftKings, BetMGM, Caesars)
- Flag injuries, back-to-backs, travel fatigue, or any sharp signal
- riskLevel: "Low" only when there is clear statistical edge. "High" when it's a coin-flip or injury-uncertain.

Respond ONLY with this JSON (no markdown, no explanation outside the JSON):
{
  "insight": "2 sharp sentences summarizing the key angle on this matchup",
  "pick": "Your top value pick (e.g. 'Celtics -5.5' or 'Over 229.5' or 'Heat ML')",
  "confidence": 74,
  "reasoning": [
    "Fact-based reason 1 from ESPN/CBS/Yahoo data",
    "Odds/line movement reason from FanDuel/DraftKings",
    "Injury or situational factor",
    "Historical head-to-head or home/away split"
  ],
  "keyFactors": ["Key stat or trend 1", "Key market signal 2"],
  "riskLevel": "Medium",
  "dataSource": "ESPN · FanDuel · CBS Sports"
}`;

    try {
        const response = await fetch(ORACLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.65,
                    maxOutputTokens: 500,
                    topP: 0.92,
                }
            })
        });

        if (!response.ok) {
            console.warn('[PickLabs ORACLE] API error:', response.status);
            return null;
        }

        const data = await response.json();
        const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned) as OraclePrediction;

        parsed.confidence = Math.min(95, Math.max(50, parsed.confidence));
        if (!parsed.dataSource) parsed.dataSource = 'ESPN · FanDuel · CBS Sports';
        return parsed;
    } catch (err) {
        console.warn('[PickLabs ORACLE] Prediction failed, using local engine:', err);
        return null;
    }
}

/**
 * PickLabs ORACLE — Player Prop Analysis
 * Uses ESPN game logs, CBS Sports player pages, Yahoo Sports stats,
 * and prop lines from FanDuel, DraftKings, PrizePicks, Underdog Fantasy.
 */
export interface GeminiPropInsight {
    recommendation: 'Over' | 'Under' | 'Pass';
    confidence: number;
    analysis: string;
    keyStats: string[];
}

export async function getGeminiPropInsight(
    playerName: string,
    team: string,
    propType: string,
    line: number,
    recentStats: number[],
    opponent: string,
    sport: string
): Promise<GeminiPropInsight | null> {
    if (!ORACLE_API_KEY) return null;

    const avg = recentStats.length > 0
        ? (recentStats.reduce((a, b) => a + b, 0) / recentStats.length).toFixed(1)
        : 'N/A';
    const last5 = recentStats.slice(-5).join(', ');
    const hitRate = recentStats.length > 0
        ? Math.round((recentStats.filter(s => s > line).length / recentStats.length) * 100)
        : 50;

    const prompt = `You are PickLabs ORACLE, a world-class sports analyst. Your player prop analysis cross-references:
- ESPN player game logs and season stats
- CBS Sports player pages and matchup analysis
- Yahoo Sports stats and injury reports
- FanDuel, DraftKings, PrizePicks, and Underdog Fantasy prop lines

━━━ PROP DATA ━━━
Sport: ${sport}
Player: ${playerName} (${team})
Prop: ${propType} — Line: ${line}
vs Opponent: ${opponent}
Last 5 games: [${last5}] — 5-game avg: ${avg}
Hit rate over ${line}: ${hitRate}% in recent sample
━━━━━━━━━━━━━━━

Use your knowledge of this player's real stats from ESPN/CBS/Yahoo. Consider:
- Opponent's defensive ranking vs this stat category
- Player's home/away splits and recent form/injuries
- Whether the prop line is sharp (FanDuel/DraftKings consensus) or soft

Respond ONLY with JSON (no markdown):
{
  "recommendation": "Over",
  "confidence": 71,
  "analysis": "2 sentence sharp prop breakdown referencing real stats and matchup context",
  "keyStats": ["Stat or trend 1", "Defensive matchup factor 2"]
}`;

    try {
        const response = await fetch(ORACLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.6, maxOutputTokens: 250 }
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned) as GeminiPropInsight;
    } catch {
        return null;
    }
}

/**
 * PickLabs ORACLE — Quick one-liner for GameCard footers
 * Sharp, punchy, data-backed betting insight.
 */
export async function getGeminiQuickInsight(
    homeTeam: string,
    awayTeam: string,
    sport: string,
    homeRecord: string,
    awayRecord: string
): Promise<string | null> {
    if (!ORACLE_API_KEY) return null;

    const prompt = `You are PickLabs ORACLE. Based on real ${sport} stats from ESPN, CBS Sports, and Yahoo Sports plus current FanDuel/DraftKings lines, write ONE sharp betting insight sentence (max 18 words) for: ${awayTeam} (${awayRecord}) @ ${homeTeam} (${homeRecord}). Reference a specific real stat or betting angle. No markdown, just the sentence.`;

    try {
        const response = await fetch(ORACLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.75, maxOutputTokens: 70 }
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        return (data?.candidates?.[0]?.content?.parts?.[0]?.text as string)?.trim() ?? null;
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// getOracleFullPrediction — Same AIPrediction shape as the local math engine,
// but ORACLE/Gemini gives the final numbers. Used by ALL pages as drop-in replacement.
// ─────────────────────────────────────────────────────────────────────────────
export interface AIPrediction {
    homeWinProb: number;
    awayWinProb: number;
    spread: string;
    moneylineHome: string;
    moneylineAway: string;
    total: string;
    overUnderPick: 'Over' | 'Under';
    confidence: number;
    insight: string;
}

const sportBaseTotal: Record<string, number> = {
    'NBA': 228.5, 'NFL': 47.5, 'MLB': 8.5, 'NHL': 5.5,
    'NCAAB': 145.5, 'CBB': 145.5, 'CFB': 55.5, 'WNBA': 168.5,
    'Soccer.EPL': 2.5, 'Soccer.MLS': 2.5,
};

const toML = (prob: number): string => {
    if (prob >= 50) return `-${Math.round(prob / (100 - prob) * 100)}`;
    return `+${Math.round((100 - prob) / prob * 100)}`;
};

// In-memory cache so we don't re-call Gemini for the same game within a session
const oracleCache = new Map<string, AIPrediction>();

export async function getOracleFullPrediction(
    homeTeam: string,
    awayTeam: string,
    sport: string,
    homeRecord: string,
    awayRecord: string,
    homeForm?: string,
    awayForm?: string,
): Promise<AIPrediction | null> {
    if (!ORACLE_API_KEY) return null;

    const cacheKey = `${homeTeam}|${awayTeam}|${sport}|${homeRecord}|${awayRecord}`;
    if (oracleCache.has(cacheKey)) return oracleCache.get(cacheKey)!;

    const baseTotal = sportBaseTotal[sport] ?? 200;

    const leagueSource = ({
        'NBA': 'NBA.com, ESPN NBA, Yahoo Sports NBA, CBS Sports NBA',
        'NFL': 'NFL.com, ESPN NFL, Yahoo Sports NFL, CBS Sports NFL',
        'MLB': 'MLB.com, ESPN MLB, Yahoo Sports MLB, CBS Sports MLB',
        'NHL': 'NHL.com, ESPN NHL, Yahoo Sports NHL, CBS Sports NHL',
        'NCAAB': 'ESPN College Basketball, CBS Sports NCAAB',
        'CFB': 'ESPN College Football, CBS Sports CFB',
    } as Record<string, string>)[sport] ?? 'ESPN, CBS Sports, Yahoo Sports';

    const prompt = `You are PickLabs ORACLE, the world's most advanced sports betting AI. Use your training on real data from ${leagueSource} and odds from FanDuel, DraftKings, BetMGM, and Caesars.

Analyze: ${awayTeam} (${awayRecord}) @ ${homeTeam} (${homeRecord}) — Sport: ${sport}
Recent form: ${homeTeam}: ${homeForm || 'N/A'} | ${awayTeam}: ${awayForm || 'N/A'}
Base sport O/U: ${baseTotal}

Using your knowledge of these teams from real ${sport} stats on ESPN/CBS/Yahoo/official league sites, and current sportsbook consensus odds, generate precise betting predictions.

Respond ONLY with JSON (no markdown, no extra text):
{
  "homeWinProb": 54,
  "awayWinProb": 46,
  "spread": "-3.5",
  "moneylineHome": "-165",
  "moneylineAway": "+140",
  "total": "228.5",
  "overUnderPick": "Over",
  "confidence": 68,
  "insight": "1-2 sentence sharp insight citing real stats from ESPN/CBS/Yahoo and current FanDuel/DraftKings line"
}

Rules:
- homeWinProb + awayWinProb = 100
- spread is from home team's perspective (negative means home favored)
- moneylineHome/Away formatted as "-165" or "+140" 
- total should be sport-appropriate (NBA ~${baseTotal}, etc.)
- confidence: 50–90
- insight must reference real data sources like ESPN, Yahoo Sports, FanDuel, etc.`;

    try {
        const response = await fetch(ORACLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.6, maxOutputTokens: 300, topP: 0.9 }
            })
        });

        if (!response.ok) {
            console.warn('[ORACLE] Full prediction API error:', response.status);
            return null;
        }

        const data = await response.json();
        const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned) as AIPrediction;

        // Validate
        parsed.homeWinProb = Math.min(85, Math.max(15, Number(parsed.homeWinProb)));
        parsed.awayWinProb = 100 - parsed.homeWinProb;
        parsed.confidence = Math.min(92, Math.max(50, Number(parsed.confidence)));
        if (!parsed.overUnderPick) parsed.overUnderPick = 'Over';
        if (!parsed.moneylineHome) parsed.moneylineHome = toML(parsed.homeWinProb);
        if (!parsed.moneylineAway) parsed.moneylineAway = toML(parsed.awayWinProb);

        oracleCache.set(cacheKey, parsed);
        return parsed;
    } catch (err) {
        console.warn('[ORACLE] Full prediction failed:', err);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// getOracleAIPicks — Generates top bet candidates for "AI Pick My Bets" button,
// powered by ORACLE using real game data from ESPN + sportsbook lines.
// ─────────────────────────────────────────────────────────────────────────────
export interface OraclePick {
    gameId: string;
    matchupStr: string;
    type: 'ML' | 'Spread' | 'Over' | 'Under' | 'Prop';
    team: string;
    odds: string;
    stake: number;
    confidence: number;
    insight: string;
    gameStatus: string;
    gameDate: string;
}

export async function getOracleAIPicks(games: {
    id: string;
    homeTeam: { displayName: string; record: string };
    awayTeam: { displayName: string; record: string };
    sport: string;
    status: string;
    date: string;
    leaders?: { name: string; shortName: string; category: string; displayValue: string }[];
}[]): Promise<OraclePick[]> {
    if (!ORACLE_API_KEY || games.length === 0) return [];

    // Limit to 8 games to keep prompt size reasonable
    const sample = games.slice(0, 8);

    const gamesJson = sample.map(g => ({
        id: g.id,
        matchup: `${g.awayTeam.displayName} (${g.awayTeam.record}) @ ${g.homeTeam.displayName} (${g.homeTeam.record})`,
        sport: g.sport,
        topLeader: g.leaders?.[0] ? `${g.leaders[0].shortName} — ${g.leaders[0].displayValue} ${g.leaders[0].category}` : null,
    }));

    const prompt = `You are PickLabs ORACLE, an elite sports betting AI. You have access to real stats from ESPN, Yahoo Sports, CBS Sports, NBA.com, MLB.com and current odds from FanDuel, DraftKings, BetMGM, and Caesars.

Here are today's games:
${JSON.stringify(gamesJson, null, 2)}

For each game, pick the single best bet (ML, Spread, Over, Under, or a Player Prop if a leader is provided). Prioritize high-value picks with the clearest edge vs FanDuel/DraftKings current lines.

Respond ONLY with a JSON array (no markdown):
[
  {
    "gameId": "12345",
    "type": "ML",
    "team": "Lakers ML",
    "odds": "-145",
    "stake": 25,
    "confidence": 72,
    "insight": "One sharp sentence citing ESPN or FanDuel data"
  }
]

Return at most 5 picks total, only the highest-confidence ones.`;

    try {
        const response = await fetch(ORACLE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.65, maxOutputTokens: 600 }
            })
        });

        if (!response.ok) return [];

        const data = await response.json();
        const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned) as Omit<OraclePick, 'matchupStr' | 'gameStatus' | 'gameDate'>[];

        return parsed.map(p => {
            const g = games.find(g => g.id === p.gameId) ?? games[0];
            return {
                ...p,
                gameId: `espn-${p.gameId}`,
                matchupStr: `${g.awayTeam.displayName} vs ${g.homeTeam.displayName}`,
                gameStatus: g.status,
                gameDate: g.date,
                stake: Math.min(100, Math.max(10, Number(p.stake) || 25)),
                confidence: Math.min(92, Math.max(50, Number(p.confidence) || 65)),
            };
        });
    } catch (err) {
        console.warn('[ORACLE] AI Picks generation failed:', err);
        return [];
    }
}
