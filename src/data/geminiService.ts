/**
 * Gemini AI Service — powered by Google Gemini 1.5 Flash
 * Used to generate rich, natural language sports betting insights and predictions
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiPrediction {
    insight: string;          // 1-2 sentence analysis
    pick: string;             // e.g. "Lakers ML" or "Over 228.5"
    confidence: number;       // 55–90
    reasoning: string[];      // 3-4 bullet points
    keyFactors: string[];     // 2-3 key factors
    riskLevel: 'Low' | 'Medium' | 'High';
}

interface MatchupContext {
    homeTeam: string;
    awayTeam: string;
    sport: string;
    homeRecord: string;
    awayRecord: string;
    homeForm: string;       // e.g. "W W L W W"
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
 * Generate a rich AI-powered game prediction using Google Gemini.
 * Falls back gracefully if the API call fails.
 */
export async function getGeminiMatchupInsight(ctx: MatchupContext): Promise<GeminiPrediction | null> {
    if (!GEMINI_API_KEY) return null;

    const liveContext = ctx.isLive
        ? `The game is currently LIVE. Score: ${ctx.homeTeam} ${ctx.homeScore ?? 0} – ${ctx.awayTeam} ${ctx.awayScore ?? 0}.`
        : '';

    const prompt = `You are PickLabs AI, an expert sports betting analyst. Analyze this ${ctx.sport} matchup and provide a sharp, concise prediction.

MATCHUP: ${ctx.awayTeam} (${ctx.awayRecord}) @ ${ctx.homeTeam} (${ctx.homeRecord})
${liveContext}
RECENT FORM: ${ctx.homeTeam} last 5: ${ctx.homeForm} | ${ctx.awayTeam} last 5: ${ctx.awayForm}
CURRENT ODDS: Spread ${ctx.spread} | O/U ${ctx.overUnder}
MODEL WIN PROBABILITY: ${ctx.homeTeam} ${ctx.homeWinProb}% | ${ctx.awayTeam} ${ctx.awayWinProb}%
${ctx.homeInjuries ? `HOME INJURIES: ${ctx.homeInjuries}` : ''}
${ctx.awayInjuries ? `AWAY INJURIES: ${ctx.awayInjuries}` : ''}

Respond ONLY with a JSON object in this exact format (no markdown):
{
  "insight": "1-2 sentence sharp summary of this matchup",
  "pick": "Your top pick (e.g. 'Lakers -4.5' or 'Over 228.5')",
  "confidence": 72,
  "reasoning": ["Reason 1", "Reason 2", "Reason 3"],
  "keyFactors": ["Factor 1", "Factor 2"],
  "riskLevel": "Medium"
}`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 400,
                    topP: 0.9,
                }
            })
        });

        if (!response.ok) {
            console.warn('Gemini API error:', response.status, await response.text());
            return null;
        }

        const data = await response.json();
        const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        // Strip markdown fences if present
        const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned) as GeminiPrediction;

        // Validate and clamp
        parsed.confidence = Math.min(95, Math.max(50, parsed.confidence));
        return parsed;
    } catch (err) {
        console.warn('Gemini prediction failed, using local engine:', err);
        return null;
    }
}

/**
 * Generate a player prop analysis using Gemini
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
    if (!GEMINI_API_KEY) return null;

    const avg = recentStats.length > 0
        ? (recentStats.reduce((a, b) => a + b, 0) / recentStats.length).toFixed(1)
        : 'N/A';
    const last5 = recentStats.slice(-5).join(', ');

    const prompt = `You are PickLabs AI, an expert sports betting analyst. Analyze this ${sport} player prop.

PLAYER: ${playerName} (${team})
PROP: ${propType} — Line: ${line}
VS OPPONENT: ${opponent}
RECENT ${propType.toUpperCase()}: [${last5}] | 5-game avg: ${avg}

Respond ONLY with JSON (no markdown):
{
  "recommendation": "Over",
  "confidence": 68,
  "analysis": "1-2 sentence prop analysis",
  "keyStats": ["Stat 1", "Stat 2"]
}`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.6, maxOutputTokens: 200 }
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
 * Quick one-liner insight for bet slip / pick cards
 */
export async function getGeminiQuickInsight(
    homeTeam: string,
    awayTeam: string,
    sport: string,
    homeRecord: string,
    awayRecord: string
): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;

    const prompt = `PickLabs AI: Give ONE sharp, punchy sentence (max 15 words) betting insight for ${awayTeam} (${awayRecord}) @ ${homeTeam} (${homeRecord}) in ${sport}. No markdown. Just the sentence.`;

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.8, maxOutputTokens: 60 }
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        return (data?.candidates?.[0]?.content?.parts?.[0]?.text as string)?.trim() ?? null;
    } catch {
        return null;
    }
}
