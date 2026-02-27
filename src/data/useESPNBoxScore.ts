// useESPNBoxScore.ts
// Fetches real game leaders + full player box score from ESPN summary API
// Works for past games and live games

import { useState, useEffect } from 'react';

export interface GameLeader {
    name: string;
    shortName: string;
    value: string;
    label: string;
    headshot: string;
    position: string;
    summary: string;
}

// Parsed stats for the game
export interface PlayerGameStats {
    min: string;
    pts: number;
    fg: string;       // e.g. "7-18"
    fg3: string;      // e.g. "3-12"
    ft: string;       // e.g. "2-2"
    reb: number;
    ast: number;
    to: number;
    stl: number;
    blk: number;
    oreb: number;
    dreb: number;
    pf: number;
    plusMinus: string; // e.g. "+20"
    // Derived ratios
    fgPct: number;    // 0-100
    fg3Pct: number;
    ftPct: number;
}

export interface BoxScorePlayer {
    id: string;
    name: string;
    shortName: string;
    headshot: string;
    position: string;
    jersey: string;
    starter: boolean;
    active: boolean;
    didNotPlay: boolean;
    stats: PlayerGameStats | null;
    // Hot/cold indicator vs season average
    // pts > season avg PTS → hot, else cold
    hotScore: number; // positive = hot, negative = cold, 0 = neutral
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
    players: BoxScorePlayer[];
}

export interface BoxScoreData {
    home: TeamBoxLeaders;
    away: TeamBoxLeaders;
    finalScore?: { home: number; away: number };
    status: string;
}

const SPORT_PATH: Record<string, string> = {
    NBA: 'basketball/nba',
    NFL: 'football/nfl',
    MLB: 'baseball/mlb',
    NHL: 'hockey/nhl',
    NCAAB: 'basketball/mens-college-basketball',
    WNBA: 'basketball/wnba',
};

// NBA season averages by position (rough approximation for hot/cold threshold)
const NBA_AVG_BY_POS: Record<string, { pts: number; reb: number; ast: number }> = {
    G: { pts: 14, reb: 3.5, ast: 5 },
    F: { pts: 14, reb: 6, ast: 2.5 },
    C: { pts: 12, reb: 8, ast: 1.5 },
    SF: { pts: 14, reb: 5, ast: 2.5 },
    PF: { pts: 12, reb: 7, ast: 2 },
    SG: { pts: 14, reb: 3.5, ast: 3.5 },
    PG: { pts: 15, reb: 3.5, ast: 6.5 },
};

function parseStatStr(s: string): { makes: number; attempts: number; pct: number } {
    const parts = s.split('-').map(Number);
    const makes = parts[0] || 0;
    const attempts = parts[1] || 0;
    return { makes, attempts, pct: attempts > 0 ? (makes / attempts) * 100 : 0 };
}

function parsePlayerStats(stats: string[], labels: string[]): PlayerGameStats | null {
    if (!stats || stats.length === 0) return null;
    const idx = (name: string) => labels.indexOf(name);

    const fg = stats[idx('FG')] || '0-0';
    const fg3 = stats[idx('3PT')] || '0-0';
    const ft = stats[idx('FT')] || '0-0';

    return {
        min: stats[idx('MIN')] || '0',
        pts: parseInt(stats[idx('PTS')]) || 0,
        fg,
        fg3,
        ft,
        reb: parseInt(stats[idx('REB')]) || 0,
        ast: parseInt(stats[idx('AST')]) || 0,
        to: parseInt(stats[idx('TO')]) || 0,
        stl: parseInt(stats[idx('STL')]) || 0,
        blk: parseInt(stats[idx('BLK')]) || 0,
        oreb: parseInt(stats[idx('OREB')]) || 0,
        dreb: parseInt(stats[idx('DREB')]) || 0,
        pf: parseInt(stats[idx('PF')]) || 0,
        plusMinus: stats[idx('+/-')] || '0',
        fgPct: parseStatStr(fg).pct,
        fg3Pct: parseStatStr(fg3).pct,
        ftPct: parseStatStr(ft).pct,
    };
}

function calcHotScore(stats: PlayerGameStats, position: string): number {
    const pos = position.replace(/[0-9]/g, '') || 'F';
    const avg = NBA_AVG_BY_POS[pos] || NBA_AVG_BY_POS.F;
    const ptsDelta = stats.pts - avg.pts;
    const rebDelta = stats.reb - avg.reb;
    const astDelta = stats.ast - avg.ast;
    return ptsDelta * 1.5 + rebDelta + astDelta * 0.8;
}

function parseTeamPlayers(teamBlock: Record<string, unknown>): BoxScorePlayer[] {
    const statsArr = (teamBlock.statistics as Array<Record<string, unknown>> | undefined)?.[0];
    if (!statsArr) return [];

    const labels = (statsArr.labels as string[]) || [];
    const athletes = (statsArr.athletes as Array<Record<string, unknown>>) || [];

    return athletes.map((entry) => {
        const ath = (entry.athlete as Record<string, unknown>) || {};
        const headshot = (ath.headshot as Record<string, string> | undefined)?.href ?? '';
        const position = (ath.position as Record<string, string> | undefined)?.abbreviation ?? 'F';
        const rawStats = (entry.stats as string[]) || [];
        const parsedStats = parsePlayerStats(rawStats, labels);
        const hotScore = parsedStats ? calcHotScore(parsedStats, position) : 0;

        return {
            id: String(ath.id ?? Math.random()),
            name: String(ath.displayName ?? ath.fullName ?? ''),
            shortName: String(ath.shortName ?? ''),
            headshot,
            position,
            jersey: String(ath.jersey ?? ''),
            starter: Boolean(entry.starter),
            active: Boolean(entry.active),
            didNotPlay: Boolean(entry.didNotPlay),
            stats: parsedStats,
            hotScore,
        };
    });
}

function extractLeader(result: Record<string, GameLeader | null>, catName: string, catLeaders: unknown[]): void {
    if (!Array.isArray(catLeaders) || catLeaders.length === 0) return;
    const entry = catLeaders[0] as Record<string, unknown>;
    const ath = entry.athlete as Record<string, unknown> | undefined;
    if (!ath) return;

    const headshot = (ath.headshot as Record<string, string> | undefined)?.href ?? '';
    const position = (ath.position as Record<string, string> | undefined)?.abbreviation ?? '';
    const mainStat = entry.mainStat as Record<string, string> | undefined;

    result[catName] = {
        name: String(ath.displayName ?? ath.fullName ?? ''),
        shortName: String(ath.shortName ?? ''),
        value: mainStat?.value ?? String(entry.displayValue ?? ''),
        label: mainStat?.label ?? catName.toUpperCase(),
        headshot,
        position,
        summary: String(entry.summary ?? ''),
    };
}

function parseTeamLeaders(teamBlock: Record<string, unknown>): Omit<TeamBoxLeaders, 'teamName' | 'teamLogo' | 'teamAbbr' | 'players'> {
    const result: Omit<TeamBoxLeaders, 'teamName' | 'teamLogo' | 'teamAbbr' | 'players'> = {
        points: null, rebounds: null, assists: null,
        threePointers: null, steals: null, blocks: null,
    };

    const ledrs = teamBlock.leaders as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(ledrs)) return result;

    for (const cat of ledrs) {
        const catName = String(cat.name ?? '');
        const catLeaders = cat.leaders as unknown[];
        const r = result as Record<string, GameLeader | null>;
        if (catName === 'points') extractLeader(r, 'points', catLeaders);
        else if (catName === 'rebounds') extractLeader(r, 'rebounds', catLeaders);
        else if (catName === 'assists') extractLeader(r, 'assists', catLeaders);
        else if (catName === 'threePointersMade' || catName === 'threePointers') extractLeader(r, 'threePointers', catLeaders);
        else if (catName === 'steals') extractLeader(r, 'steals', catLeaders);
        else if (catName === 'blocks') extractLeader(r, 'blocks', catLeaders);
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
                const boxscore = d.boxscore as Record<string, unknown> | undefined;
                const rawPlayers = boxscore?.players as Array<Record<string, unknown>> | undefined;

                if ((!rawLeaders || rawLeaders.length < 1) && !rawPlayers) {
                    setData(null);
                    return;
                }

                const awayLeaderBlock = rawLeaders?.[0] ?? {};
                const homeLeaderBlock = rawLeaders?.[1] ?? {};

                // ESPN boxscore players: index 0 = home or away? Let's match by team id
                const awayLeaderTeamId = (awayLeaderBlock.team as Record<string, string> | undefined)?.id ?? '';
                const homeLeaderTeamId = (homeLeaderBlock.team as Record<string, string> | undefined)?.id ?? '';

                let awayPlayers: BoxScorePlayer[] = [];
                let homePlayers: BoxScorePlayer[] = [];

                if (rawPlayers) {
                    for (const block of rawPlayers) {
                        const teamId = (block.team as Record<string, string> | undefined)?.id ?? '';
                        const parsed = parseTeamPlayers(block);
                        if (teamId === awayLeaderTeamId) awayPlayers = parsed;
                        else if (teamId === homeLeaderTeamId) homePlayers = parsed;
                        else if (awayPlayers.length === 0) awayPlayers = parsed;
                        else homePlayers = parsed;
                    }
                }

                const awayTeamInfo = awayLeaderBlock.team as Record<string, string> | undefined;
                const homeTeamInfo = homeLeaderBlock.team as Record<string, string> | undefined;

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

                const statusType = (comps?.status as Record<string, unknown> | undefined)
                    ?.type as Record<string, string> | undefined;

                setData({
                    away: {
                        teamName: awayTeamInfo?.displayName ?? 'Away',
                        teamLogo: awayTeamInfo?.logo ?? '',
                        teamAbbr: awayTeamInfo?.abbreviation ?? '',
                        players: awayPlayers,
                        ...parseTeamLeaders(awayLeaderBlock),
                    },
                    home: {
                        teamName: homeTeamInfo?.displayName ?? 'Home',
                        teamLogo: homeTeamInfo?.logo ?? '',
                        teamAbbr: homeTeamInfo?.abbreviation ?? '',
                        players: homePlayers,
                        ...parseTeamLeaders(homeLeaderBlock),
                    },
                    finalScore,
                    status: statusType?.description ?? 'Final',
                });
            })
            .catch(e => { if (!cancelled) setError(String(e)); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [espnId, sportPath]);

    return { data, loading, error };
}
