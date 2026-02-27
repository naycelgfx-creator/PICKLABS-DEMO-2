// useESPNBoxScore.ts
// Fetches real game leaders (top scorer, rebounder, assist, 3PT) from ESPN summary API
// Works for past games, live games, and upcoming games (returns null for upcoming)

import { useState, useEffect } from 'react';

export interface GameLeader {
    name: string;           // full display name
    shortName: string;
    value: string;          // display value e.g. "34"
    label: string;          // stat label e.g. "PTS"
    headshot: string;
    position: string;
    summary: string;        // e.g. "13/22 FG"
}

export interface TeamBoxLeaders {
    teamName: string;
    teamLogo: string;
    teamAbbr: string;
    points: GameLeader | null;
    rebounds: GameLeader | null;
    assists: GameLeader | null;
    threePointers: GameLeader | null;
    steals: GameLeader | null;
    blocks: GameLeader | null;
}

export interface BoxScoreData {
    home: TeamBoxLeaders;
    away: TeamBoxLeaders;
    finalScore?: { home: number; away: number };
    status: string;
}

// ESPN sport path mapping
const SPORT_PATH: Record<string, string> = {
    NBA: 'basketball/nba',
    NFL: 'football/nfl',
    MLB: 'baseball/mlb',
    NHL: 'hockey/nhl',
    NCAAB: 'basketball/mens-college-basketball',
    WNBA: 'basketball/wnba',
};

function extractLeader(leaders: Record<string, GameLeader | null>, catName: string, catLeaders: unknown[]): void {
    if (!Array.isArray(catLeaders) || catLeaders.length === 0) return;
    const entry = catLeaders[0] as Record<string, unknown>;
    const ath = entry.athlete as Record<string, unknown> | undefined;
    if (!ath) return;

    const headshot = (ath.headshot as Record<string, string> | undefined)?.href ?? '';
    const position = (ath.position as Record<string, string> | undefined)?.abbreviation ?? '';
    const mainStat = entry.mainStat as Record<string, string> | undefined;

    leaders[catName] = {
        name: String(ath.displayName ?? ath.fullName ?? ''),
        shortName: String(ath.shortName ?? ''),
        value: mainStat?.value ?? String(entry.displayValue ?? ''),
        label: mainStat?.label ?? catName.toUpperCase(),
        headshot,
        position,
        summary: String(entry.summary ?? ''),
    };
}

function parseTeamLeaders(teamBlock: Record<string, unknown>): Omit<TeamBoxLeaders, 'teamName' | 'teamLogo' | 'teamAbbr'> {
    const result: Omit<TeamBoxLeaders, 'teamName' | 'teamLogo' | 'teamAbbr'> = {
        points: null, rebounds: null, assists: null,
        threePointers: null, steals: null, blocks: null,
    };

    const ledrs = teamBlock.leaders as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(ledrs)) return result;

    for (const cat of ledrs) {
        const catName = String(cat.name ?? '');
        const catLeaders = cat.leaders as unknown[];

        if (catName === 'points') extractLeader(result as unknown as Record<string, GameLeader | null>, 'points', catLeaders);
        else if (catName === 'rebounds') extractLeader(result as unknown as Record<string, GameLeader | null>, 'rebounds', catLeaders);
        else if (catName === 'assists') extractLeader(result as unknown as Record<string, GameLeader | null>, 'assists', catLeaders);
        else if (catName === 'threePointersMade' || catName === 'threePointers') extractLeader(result as unknown as Record<string, GameLeader | null>, 'threePointers', catLeaders);
        else if (catName === 'steals') extractLeader(result as unknown as Record<string, GameLeader | null>, 'steals', catLeaders);
        else if (catName === 'blocks') extractLeader(result as unknown as Record<string, GameLeader | null>, 'blocks', catLeaders);
    }

    return result;
}

export function useESPNBoxScore(sport: string, matchupId: string): {
    data: BoxScoreData | null;
    loading: boolean;
    error: string | null;
} {
    const [data, setData] = useState<BoxScoreData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // matchupId is stored as "#PL-{espnId}" — extract the numeric part
    const espnId = matchupId.replace(/^#PL-/, '').replace(/\D/g, '');
    const sportPath = SPORT_PATH[sport] ?? SPORT_PATH.NBA;

    useEffect(() => {
        if (!espnId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/summary?event=${espnId}`;

        fetch(url)
            .then(r => r.json())
            .then((d: Record<string, unknown>) => {
                if (cancelled) return;

                const rawLeaders = d.leaders as Array<Record<string, unknown>> | undefined;

                if (!rawLeaders || rawLeaders.length < 1) {
                    setData(null);
                    return;
                }

                // ESPN leaders array index 0 = away, 1 = home (normal scoreboard order)
                const awayBlock = rawLeaders[0] ?? {};
                const homeBlock = rawLeaders[1] ?? {};

                const awayTeamInfo = awayBlock.team as Record<string, string> | undefined;
                const homeTeamInfo = homeBlock.team as Record<string, string> | undefined;

                // Header for final score
                const header = d.header as Record<string, unknown> | undefined;
                const comps = (header?.competitions as Array<Record<string, unknown>>)?.[0];
                const competitors = comps?.competitors as Array<Record<string, unknown>> | undefined;

                let finalScore: { home: number; away: number } | undefined;
                if (competitors) {
                    const homeComp = competitors.find(c => (c.homeAway as string) === 'home');
                    const awayComp = competitors.find(c => (c.homeAway as string) === 'away');
                    if (homeComp && awayComp) {
                        finalScore = {
                            home: Number(homeComp.score ?? 0),
                            away: Number(awayComp.score ?? 0),
                        };
                    }
                }

                const status = (comps?.status as Record<string, unknown> | undefined)
                    ?.type as Record<string, string> | undefined;

                setData({
                    away: {
                        teamName: awayTeamInfo?.displayName ?? 'Away',
                        teamLogo: awayTeamInfo?.logo ?? '',
                        teamAbbr: awayTeamInfo?.abbreviation ?? '',
                        ...parseTeamLeaders(awayBlock),
                    },
                    home: {
                        teamName: homeTeamInfo?.displayName ?? 'Home',
                        teamLogo: homeTeamInfo?.logo ?? '',
                        teamAbbr: homeTeamInfo?.abbreviation ?? '',
                        ...parseTeamLeaders(homeBlock),
                    },
                    finalScore,
                    status: status?.description ?? 'Final',
                });
            })
            .catch(e => { if (!cancelled) setError(String(e)); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [espnId, sportPath]);

    return { data, loading, error };
}
