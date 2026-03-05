import React, { useState, useEffect, useRef } from 'react';

import { useESPNRoster } from '../../data/useESPNRoster';
import { ESPNRosterAthlete } from '../../data/espnService';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
    PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ZAxis
} from 'recharts';

interface PlayerPropsModuleProps {
    sport: string;
    team: { name: string; abbr: string; url?: string };
}

interface PropLine {
    id: string;
    player: string;
    photoUrl: string;
    position: string;
    propType: string;
    line: number;
    impliedProb: number;
    oppRank: { rank: number; team: string; color: 'green' | 'red' | 'yellow' };
    rank: number;
    team: string;
    color: 'green' | 'red' | 'yellow';
    l5Pct: number;
    l10Pct: number;
    l20Pct: number;
    h2hPct: number;
    season2025Pct: number;
    dkOdds: string;
    fdOdds: string;
    isTrending: boolean;
}

interface GameLog {
    date: string;      // "1/24"
    opp: string;       // "@ PHI"
    value: number;     // actual stat value
    isOver: boolean;
    score: string;     // "112-109"
    oppRank: number;
}

interface BookOffer {
    name: string; abbr: string; letter: string;
    bg: string; text: string; odds: string;
    logo?: string;
}
interface AltLineEntry {
    line: number;
    overBook: BookOffer | null;
    underBook: BookOffer | null;
}

const SPORTSBOOKS = [
    {
        name: 'DraftKings', abbr: 'DK', letter: 'K', bg: '#0a2e1a', text: '#4ade80',
        logo: 'https://www.google.com/s2/favicons?domain=draftkings.com&sz=64'
    },
    {
        name: 'FanDuel', abbr: 'FD', letter: 'F', bg: '#0a1e3a', text: '#60a5fa',
        logo: 'https://www.google.com/s2/favicons?domain=fanduel.com&sz=64'
    },
    {
        name: 'BetMGM', abbr: 'MGM', letter: 'M', bg: '#2d1500', text: '#fbbf24',
        logo: 'https://www.google.com/s2/favicons?domain=betmgm.com&sz=64'
    },
    {
        name: 'Caesars', abbr: 'CZR', letter: 'C', bg: '#1e0a2e', text: '#c084fc',
        logo: 'https://www.google.com/s2/favicons?domain=williamhill.com&sz=64'
    },
    {
        name: 'PrizePicks', abbr: 'PP', letter: 'P', bg: '#0a2020', text: '#2dd4bf',
        logo: 'https://www.google.com/s2/favicons?domain=prizepicks.com&sz=64'
    },
    {
        name: 'Underdog', abbr: 'UD', letter: 'U', bg: '#2e1000', text: '#fb923c',
        logo: 'https://www.google.com/s2/favicons?domain=underdogfantasy.com&sz=64'
    },
];

// ── Helpers ────────────────────────────────────────────────────────────────
const AVATAR = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111827&color=10b981&bold=true&size=128`;

const seededRand = (seed: string, offset: number): number => {
    let h = offset * 2654435761;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 2246822519);
    h = h ^ (h >>> 17);
    return (h >>> 0) / 4294967295;
};

const getTeamLogoUrl = (abbr: string, sport: string): string => {
    const league = sport === 'NBA' ? 'nba' : sport === 'NFL' ? 'nfl' : sport === 'MLB' ? 'mlb' : sport === 'NHL' ? 'nhl' : 'nba';
    return `https://a.espncdn.com/i/teamlogos/${league}/500/${abbr.toLowerCase()}.png`;
};

const seededInt = (seed: string, offset: number, min: number, max: number): number =>
    Math.floor(seededRand(seed, offset) * (max - min + 1)) + min;

const getPropTypes = (sport: string): string[] => {
    if (sport === 'NBA') return ['PTS', 'REB', 'AST', 'PTS+REB+AST', '3PM', 'BLK', 'STL'];
    if (sport === 'NFL') return ['Pass Yds', 'Rush Yds', 'Rec Yds', 'TDs', 'Completions'];
    if (sport === 'MLB') return ['Hits', 'Strikeouts', 'RBI', 'Total Bases'];
    if (sport === 'NHL') return ['Goals', 'Assists', 'Points', 'Shots'];
    return ['Points', 'Rebounds', 'Assists'];
};

const getPropLine = (sport: string, propType: string, seed: string): number => {
    const r = seededRand(seed, 99);
    if (sport === 'NBA') {
        if (propType === 'PTS') return Math.round((10 + r * 25) * 2) / 2;
        if (propType === 'REB') return Math.round((3 + r * 9) * 2) / 2;
        if (propType === 'AST') return Math.round((2 + r * 7) * 2) / 2;
        if (propType === 'PTS+REB+AST') return Math.round((18 + r * 28) * 2) / 2;
        if (propType === '3PM') return Math.round((0.5 + r * 3.5) * 2) / 2;
        return Math.round((0.5 + r * 2.5) * 2) / 2;
    }
    return Math.round((5 + r * 45) * 2) / 2;
};

const OrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

// ── Stat value ranges per prop type ────────────────────────────────────────
const getStatRange = (_sport: string, _propType: string, line: number) => {
    const spread = Math.max(line * 0.7, 2);
    return { min: Math.max(0, line - spread), max: line + spread };
};

// ── Generate realistic game logs ───────────────────────────────────────────
const NBA_OPPS = ['PHI', 'SAC', 'TOR', 'POR', 'LAL', 'WAS', 'DEN', 'DET', 'HOU', 'CHI', 'BOS', 'MIA', 'PHX', 'MIL', 'GSW', 'DAL', 'NYK', 'LAC', 'MEM', 'ORL'];
const NFL_OPPS = ['KC', 'BUF', 'SF', 'PHI', 'BAL', 'DAL', 'MIA', 'LAR', 'GB', 'CIN'];
const MLB_OPPS = ['NYY', 'LAD', 'HOU', 'ATL', 'PHI', 'BOS', 'SEA', 'SD', 'TOR', 'TEX'];
const NHL_OPPS = ['BOS', 'TBL', 'COL', 'EDM', 'NYR', 'CAR', 'VGK', 'FLA', 'TOR', 'DET'];

const SCORE_TEMPLATES = [
    '112-109', '98-94', '124-118', '107-103', '115-112', '89-87', '128-124', '101-99',
    '118-115', '95-91', '133-129', '106-102', '102-98', '119-116', '97-93', '110-107'
];

const generateGameDates = (count: number): string[] => {
    const now = new Date(2026, 1, 26); // Feb 26, 2026
    const dates: string[] = [];
    const d = new Date(now);
    for (let i = 0; i < count; i++) {
        d.setDate(d.getDate() - (i === 0 ? 0 : seededInt(`date-${i}`, i, 1, 5)));
        dates.unshift(`${d.getMonth() + 1}/${d.getDate()}`);
    }
    return dates;
};

const generateGameLogs = (
    seed: string,
    line: number,
    sport: string,
    propType: string,
    count: number
): GameLog[] => {
    const { min, max } = getStatRange(sport, propType, line);
    const opps = sport === 'NFL' ? NFL_OPPS : sport === 'MLB' ? MLB_OPPS : sport === 'NHL' ? NHL_OPPS : NBA_OPPS;
    const dates = generateGameDates(count);

    return dates.map((date, i) => {
        const r = seededRand(`${seed}-log-${i}`, i);
        const rawValue = min + r * (max - min);
        // Round to nearest integer or 0.5
        const value = Math.round(rawValue * 2) / 2;
        const isOver = value >= line;
        const oppIdx = seededInt(`${seed}-opp-${i}`, i + 100, 0, opps.length - 1);
        const isHome = seededRand(`${seed}-home-${i}`, i + 200) > 0.5;
        const scoreIdx = seededInt(`${seed}-score-${i}`, i + 300, 0, SCORE_TEMPLATES.length - 1);
        const oppRank = seededInt(`${seed}-or-${i}`, i + 400, 1, 30);

        return {
            date,
            opp: `${isHome ? 'vs' : '@'} ${opps[oppIdx]}`,
            value,
            isOver,
            score: SCORE_TEMPLATES[scoreIdx],
            oppRank,
        };
    });
};

const buildPropsFromRoster = (players: ESPNRosterAthlete[], sport: string, teamAbbr: string): PropLine[] => {
    const primaryPropType = getPropTypes(sport)[0];

    return players.map((player, playerIdx): PropLine => {
        const seed = `${player.fullName}-${teamAbbr}-${primaryPropType}`;
        const line = getPropLine(sport, primaryPropType, seed);
        const oppRankVal = seededInt(seed, 99, 1, 30);
        const oppColor: 'green' | 'red' | 'yellow' =
            oppRankVal <= 10 ? 'green' : oppRankVal <= 20 ? 'yellow' : 'red';
        const rawOdds = seededInt(seed, 20, -130, -95);

        // Pre-compute hit percentages from game logs
        const l5logs = generateGameLogs(seed, line, sport, primaryPropType, 5);
        const l10logs = generateGameLogs(seed, line, sport, primaryPropType, 10);
        const l20logs = generateGameLogs(seed, line, sport, primaryPropType, 20);
        const h2hlogs = generateGameLogs(`${seed}-h2h`, line, sport, primaryPropType, 6);
        const seasonlogs = generateGameLogs(`${seed}-season`, line, sport, primaryPropType, 30);

        const hitPct = (logs: GameLog[]) => Math.round(logs.filter(l => l.isOver).length / logs.length * 100);

        return {
            id: `${teamAbbr}-${playerIdx}`,
            player: player.fullName,
            photoUrl: player.photoUrl || AVATAR(player.fullName),
            position: player.position?.abbreviation ?? '—',
            propType: primaryPropType,
            line,
            impliedProb: seededInt(seed, 3, 45, 72),
            oppRank: { rank: oppRankVal, team: 'OPP', color: oppColor },
            rank: seededInt(seed, 1, 1, 30),
            team: teamAbbr,
            color: oppRankVal <= 10 ? 'green' : oppRankVal <= 20 ? 'yellow' : 'red',
            l5Pct: hitPct(l5logs),
            l10Pct: hitPct(l10logs),
            l20Pct: hitPct(l20logs),
            h2hPct: hitPct(h2hlogs),
            season2025Pct: hitPct(seasonlogs),
            dkOdds: rawOdds >= 0 ? `+${rawOdds}` : `${rawOdds}`,
            fdOdds: (() => { const v = rawOdds + seededInt(seed, 22, -5, 5); return v >= 0 ? `+${v}` : `${v}`; })(),
            isTrending: seededRand(seed, 88) > 0.75,
        };
    });
};

// ─────────────────────────────────────────────────────────────────────────────
//  UniversalPropChart — Renders 8 different chart types via Recharts
// ─────────────────────────────────────────────────────────────────────────────
export type ChartType = 'bar' | 'line' | 'area' | 'scatter' | 'heat' | 'bubble' | 'pie' | 'radar';

interface UniversalPropChartProps {
    logs: GameLog[];
    line: number;
    propType: string;
    playerName: string;
    chartType: ChartType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
        // payload[0].payload contains the `log` data we passed in
        const log = payload[0].payload.log || payload[0].payload;
        if (!log || !log.date) return null;
        return (
            <div className="bg-[#0f172a] border border-[#1e3a5f] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden min-w-[180px] animate-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#1e3a5f] bg-[#111827]">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {log.date}
                        </span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${log.isOver ? 'text-[#a3ff00] bg-[#a3ff00]/15' : 'text-orange-500 bg-orange-500/15'}`}>
                            {log.isOver ? 'OVER ✓' : 'UNDER ✗'}
                        </span>
                    </div>
                    <div className="text-sm font-black text-white mt-0.5">{log.opp}</div>
                </div>
                <div className="px-3 py-2 bg-[#0d1117]">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Score</span>
                        <span className="text-xs font-black text-slate-300">{log.score}</span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Value</span>
                        <span className={`text-lg font-black tabular-nums ${log.isOver ? 'text-[#a3ff00]' : 'text-orange-500'}`}>
                            {log.value % 1 === 0 ? log.value : log.value.toFixed(1)}
                        </span>
                    </div>
                    {log.oppRank && (
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Opp Rank</span>
                            <span className={`text-xs font-black px-1.5 py-0.5 rounded border ${log.oppRank <= 10 ? 'text-[#a3ff00] border-[#a3ff00]/30 bg-[#a3ff00]/10'
                                : log.oppRank <= 20 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                                    : 'text-orange-500 border-orange-500/30 bg-orange-500/10'
                                }`}>
                                {log.oppRank}{OrdinalSuffix(log.oppRank)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

const UniversalPropChart: React.FC<UniversalPropChartProps> = ({ logs, line, propType, playerName, chartType }) => {
    void playerName;
    void propType;

    if (!logs.length) return null;

    const data = logs.map((log, i) => ({
        name: log.date,
        value: log.value,
        isOver: log.isOver,
        opp: log.opp.replace(/^(vs|@) /, ''),
        log,
        index: i,
        fill: log.isOver ? '#a3ff00' : '#f97316'
    }));

    const pieData = [
        { name: 'OVER', value: logs.filter(l => l.isOver).length, fill: '#a3ff00' },
        { name: 'UNDER', value: logs.filter(l => !l.isOver).length, fill: '#f97316' }
    ];

    const maxVal = Math.max(...logs.map(l => l.value), line * 1.5) + 2;

    const renderChart = () => {
        switch (chartType) {
            case 'line':
            case 'area':
            case 'bar':
            case 'heat':
            case 'scatter':
            case 'bubble':
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        {chartType === 'line' ? (
                            <LineChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#475569" fontSize={11} domain={[0, maxVal]} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <ReferenceLine y={line} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} label={{ position: 'top', value: `LINE ${line}`, fill: '#f87171', fontSize: 10, fontWeight: 'bold' }} />
                                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#fff' }} />
                            </LineChart>
                        ) : chartType === 'area' ? (
                            <AreaChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#475569" fontSize={11} domain={[0, maxVal]} />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine y={line} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} />
                                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                            </AreaChart>
                        ) : chartType === 'scatter' ? (
                            <ScatterChart margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickMargin={10} />
                                <YAxis dataKey="value" stroke="#475569" fontSize={11} domain={[0, maxVal]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                <ReferenceLine y={line} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} />
                                <Scatter name="Logs" data={data}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isOver ? '#a3ff00' : '#f97316'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        ) : chartType === 'bubble' ? (
                            <ScatterChart margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickMargin={10} />
                                <YAxis dataKey="value" stroke="#475569" fontSize={11} domain={[0, maxVal]} />
                                <ZAxis dataKey="value" range={[50, 400]} name="Value" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                <ReferenceLine y={line} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} />
                                <Scatter name="Logs" data={data} opacity={0.7}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.isOver ? '#a3ff00' : '#f97316'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        ) : (
                            <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#475569" fontSize={11} domain={[0, maxVal]} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff', opacity: 0.05 }} />
                                <ReferenceLine y={line} stroke="#f87171" strokeDasharray="5 5" strokeWidth={2} />
                                <Bar dataKey="value" radius={chartType === 'heat' ? 0 : [4, 4, 0, 0]}>
                                    {data.map((entry, index) => {
                                        if (chartType === 'heat') {
                                            const intensity = Math.min(1, 0.4 + (entry.value / maxVal) * 0.6);
                                            return <Cell key={`cell-${index}`} fill={entry.isOver ? '#10b981' : '#ef4444'} fillOpacity={intensity} />;
                                        }
                                        return <Cell key={`cell-${index}`} fill={entry.isOver ? '#a3ff00' : '#f97316'} />;
                                    })}
                                </Bar>
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label>
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="#0d1117" strokeWidth={4} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e3a5f', color: '#fff' }} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'radar':
                return (
                    <ResponsiveContainer width="100%" height={260}>
                        <RadarChart cx="50%" cy="50%" outerRadius={80} data={data}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="opp" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, maxVal]} tick={{ fill: '#64748b', fontSize: 10 }} />
                            <Radar name={propType} dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                            <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full flex justify-center py-2 h-[260px] overflow-hidden select-none">
            {renderChart()}
        </div>
    );
};

// ── Alt Line generators ────────────────────────────────────────────────────
const generateAltLineEntries = (baseLine: number, seed: string): AltLineEntry[] => {
    const offsets = [-5, -4, -3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3, 5, 7];
    const results: AltLineEntry[] = [];
    offsets.forEach((offset, i) => {
        const altLine = Math.round((baseLine + offset) * 2) / 2;
        if (altLine <= 0) return;
        const bk = SPORTSBOOKS[seededInt(`${seed}-ob-${i}`, i, 0, SPORTSBOOKS.length - 1)];
        const overBase = Math.round(-110 - offset * 70);
        const overOdds = overBase >= 0 ? `+${overBase}` : `${overBase}`;
        const overBook: BookOffer = { ...bk, odds: overOdds };
        const hasUnder = seededRand(`${seed}-hu-${i}`, i + 50) > 0.35;
        if (!hasUnder) { results.push({ line: altLine, overBook, underBook: null }); return; }
        const ubk = SPORTSBOOKS[seededInt(`${seed}-ub-${i}`, i + 60, 0, SPORTSBOOKS.length - 1)];
        const underBase = Math.round(-110 + offset * 70);
        const underOdds = underBase >= 0 ? `+${underBase}` : `${underBase}`;
        const underBook: BookOffer = { ...ubk, odds: underOdds };
        results.push({ line: altLine, overBook, underBook });
    });
    return results;
};

const generateInsights = (player: string, line: number, propType: string, logs: GameLog[]): string[] => {
    const last = player.split(' ').slice(-1)[0];
    const hits = logs.filter(l => l.value >= line).length;
    const avg = (logs.reduce((s, l) => s + l.value, 0) / logs.length).toFixed(1);
    const awayLogs = logs.filter(l => l.opp.startsWith('@'));
    const awayHits = awayLogs.filter(l => l.value >= line).length;
    const homeLogs = logs.filter(l => l.opp.startsWith('vs'));
    const homeHits = homeLogs.filter(l => l.value >= line).length;
    return [
        `${last} has exceeded ${line} ${propType} in ${hits} of his last ${logs.length} games (${avg} avg/game).`,
        awayLogs.length > 1 ? `On the road, ${last} hits ${awayHits}/${awayLogs.length} games (${Math.round(awayHits / awayLogs.length * 100)}% hit rate).` : null,
        homeLogs.length > 1 ? `At home, ${last} hits ${homeHits}/${homeLogs.length} home games (${Math.round(homeHits / homeLogs.length * 100)}%).` : null,
        `Over the last ${logs.length} games, ${last} averages ${avg} ${propType} per game.`,
    ].filter(Boolean) as string[];
};

// ── BookBadge — shows real sportsbook logo + name ─────────────────────────
const LOGO_FALLBACKS: Record<string, string> = {
    DK: 'https://sportsbook.draftkings.com/favicon.ico',
    FD: 'https://www.fanduel.com/favicon.ico',
    MGM: 'https://sports.betmgm.com/favicon.ico',
    CZR: 'https://www.williamhill.com/favicon.ico',
    PP: 'https://app.prizepicks.com/favicon.ico',
    UD: 'https://underdogfantasy.com/favicon.ico',
};

const BookBadge: React.FC<{ book: Pick<BookOffer, 'letter' | 'bg' | 'text' | 'name' | 'abbr' | 'logo'>; size?: 'sm' | 'md' }> = ({ book, size = 'sm' }) => {
    const logoUrl = book.logo || LOGO_FALLBACKS[book.abbr];
    const imgSize = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
    return (
        <span className="flex items-center gap-1.5 shrink-0">
            {/* Logo circle */}
            <span
                className={`${imgSize} rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-white/10`}
                style={{ background: book.bg }}
                title={book.name}
            >
                <img
                    src={logoUrl}
                    alt={book.abbr}
                    className="w-full h-full object-contain p-0.5"
                    onError={e => {
                        const el = e.currentTarget;
                        el.style.display = 'none';
                        if (el.nextElementSibling) (el.nextElementSibling as HTMLElement).style.display = 'flex';
                    }}
                />
                {/* Fallback letter */}
                <span
                    className="hidden w-full h-full items-center justify-center text-[8px] font-black"
                    style={{ color: book.text }}
                >
                    {book.letter}
                </span>
            </span>
            {/* Sportsbook name */}
            <span className="text-[9px] font-bold text-slate-300 whitespace-nowrap leading-none">{book.name}</span>
        </span>
    );
};

// ── AltLinesPanel ─────────────────────────────────────────────────────────
const AltLinesPanel: React.FC<{
    altLines: AltLineEntry[]; baseLine: number;
    selectedLine: number; selectedDir: 'over' | 'under';
    onSelect: (line: number, dir: 'over' | 'under') => void; onClose: () => void;
}> = ({ altLines, selectedLine, selectedDir, onSelect, onClose }) => {
    const [dir, setDir] = useState<'over' | 'under'>(selectedDir);
    const [pendingLine, setPendingLine] = useState(selectedLine);
    const [pendingDir, setPendingDir] = useState(selectedDir);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-lg bg-[#0d1117] rounded-t-2xl border border-[#1e3a5f] border-b-0 shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1e293b]">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-widest">Alt Lines</span>
                        <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#111827] border border-[#1e3a5f] rounded-full px-3 py-1">
                        <span className="text-[10px] font-black text-emerald-400">⊕</span>
                        <span className="text-[10px] font-black text-white">{pendingDir === 'over' ? 'Over' : 'Under'} {pendingLine}</span>
                    </div>
                </div>
                {/* Tabs (Available odds only for now) */}
                <div className="flex border-b border-[#1e293b]">
                    <button className="flex-1 py-2.5 text-xs font-black text-white border-b-2 border-primary tracking-widest">Available odds</button>
                    <button className="flex-1 py-2.5 text-xs font-black text-slate-500 tracking-widest">Custom</button>
                </div>
                {/* Over/Under toggle — simple pill */}
                <div className="flex gap-2 px-4 py-3">
                    {(['over', 'under'] as const).map(d => (
                        <button key={d} onClick={() => setDir(d)}
                            className={`flex-1 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all cursor-pointer
                            ${dir === d ? 'bg-white text-black border-white' : 'bg-transparent text-slate-400 border-[#1e293b] hover:text-white'}`}>
                            {d === 'over' ? '▲ Over' : '▼ Under'}
                        </button>
                    ))}
                </div>
                {/* Lines */}
                <div className="overflow-y-auto max-h-[42vh] px-4 pb-2 space-y-2 custom-scrollbar">
                    {altLines.map((entry, i) => {
                        const offer = dir === 'over' ? entry.overBook : entry.underBook;
                        const isSelected = pendingLine === entry.line && pendingDir === dir;
                        return (
                            <button key={i} onClick={() => { if (offer) { setPendingLine(entry.line); setPendingDir(dir); } }}
                                disabled={!offer}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left cursor-pointer
                                ${isSelected ? 'bg-emerald-900/40 border-emerald-500/60' : offer ? 'bg-[#111827] border-[#1e293b] hover:border-[#2d3f5a]' : 'bg-[#0a0f1a] border-[#111827] opacity-40 cursor-not-allowed'}`}>
                                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'}`}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                                </div>
                                <span className="text-sm font-black text-white w-16 shrink-0">{dir === 'over' ? 'O' : 'U'} {entry.line}</span>
                                {offer ? (
                                    <>
                                        <span className={`text-sm font-black tabular-nums ${parseFloat(offer.odds) > 0 ? 'text-emerald-400' : parseFloat(offer.odds) < -150 ? 'text-red-400' : 'text-slate-300'}`}>{offer.odds}</span>
                                        <div className="ml-auto"><BookBadge book={offer} size="md" /></div>
                                    </>
                                ) : <span className="text-slate-600 text-sm ml-auto">—</span>}
                            </button>
                        );
                    })}
                </div>
                {/* Done */}
                <div className="p-4 border-t border-[#1e293b]">
                    <button onClick={() => { onSelect(pendingLine, pendingDir); onClose(); }}
                        className="w-full py-3.5 rounded-xl bg-primary text-black text-sm font-black uppercase tracking-widest cursor-pointer hover:opacity-90 transition-opacity">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── InsightsPanel ──────────────────────────────────────────────────────────
const InsightsPanel: React.FC<{
    insights: string[]; hitPct: number; count: number; onClose: () => void;
}> = ({ insights, hitPct, count, onClose }) => {
    const [selected, setSelected] = useState(0);
    const pctColor = hitPct >= 70 ? 'text-[#a3ff00]' : hitPct >= 50 ? 'text-yellow-400' : 'text-orange-500';
    useEffect(() => {
        const h = (e: MouseEvent) => { if (!(e.target as Element).closest('.insights-panel')) onClose(); };
        window.addEventListener('mousedown', h); return () => window.removeEventListener('mousedown', h);
    }, [onClose]);
    return (
        <div className="insights-panel absolute top-full left-0 z-40 mt-1 w-80 bg-[#0d1117] border border-[#1e3a5f] rounded-xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-[#1e293b]">
                <span className="text-sm font-black text-white">Choose insight</span>
            </div>
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {insights.map((insight, i) => (
                    <button key={i} onClick={() => setSelected(i)}
                        className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${selected === i ? 'bg-[#111827] border-[#1e3a5f]' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                        <div className="flex items-start gap-2">
                            <div className="flex-1">
                                <p className="text-[13px] font-bold text-white leading-relaxed">{insight}</p>
                                <p className={`text-[11px] font-black mt-1 ${pctColor}`}>{hitPct}% in the last {count} games</p>
                            </div>
                            <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${selected === i ? 'border-primary bg-primary/20' : 'border-slate-600'}`}>
                                {selected === i && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  PlayerHero — Top zone with all game/stat info
// ─────────────────────────────────────────────────────────────────────────────
type ChartWindow = 'L5' | 'L10' | 'L20' | 'H2H' | '2025';

interface PlayerHeroProps {
    prop: PropLine;
    onClose: () => void;
    sport: string;
}

const PlayerHero: React.FC<PlayerHeroProps> = ({ prop, onClose, sport }) => {
    const [activePropType, setActivePropType] = useState(prop.propType);
    const [chartWindow, setChartWindow] = useState<ChartWindow>('L10');
    const [altLinesOpen, setAltLinesOpen] = useState(false);
    const [insightsOpen, setInsightsOpen] = useState(false);
    const [selectedAltLine, setSelectedAltLine] = useState<{ line: number; dir: 'over' | 'under' } | null>(null);
    const [chartType, setChartType] = useState<ChartType>('bar');

    const allPropTypes = getPropTypes(sport);
    const seed = `${prop.player}-${prop.team}-${activePropType}-hero`;
    const baseLine = getPropLine(sport, activePropType, seed);
    const effectiveLine = selectedAltLine?.line ?? baseLine;

    const logCounts: Record<ChartWindow, number> = { L5: 5, L10: 10, L20: 20, H2H: 8, '2025': 15 };
    const logSeed = chartWindow === 'H2H' ? `${seed}-h2h` : chartWindow === '2025' ? `${seed}-2025` : seed;
    const logs = generateGameLogs(logSeed, baseLine, sport, activePropType, logCounts[chartWindow]);

    const hits = logs.filter(l => l.value >= effectiveLine).length;
    const hitPct = Math.round(hits / logs.length * 100);

    const getWindowPct = (win: ChartWindow) => {
        const cnt = logCounts[win];
        const ws = win === 'H2H' ? `${seed}-h2h` : win === '2025' ? `${seed}-2025` : seed;
        const wl = generateGameLogs(ws, baseLine, sport, activePropType, cnt);
        return Math.round(wl.filter(l => l.value >= effectiveLine).length / wl.length * 100);
    };
    const pctColor = (pct: number) => pct >= 70 ? 'text-[#a3ff00]' : pct >= 50 ? 'text-yellow-400' : 'text-orange-500';
    const windows: ChartWindow[] = ['L5', 'L10', 'L20', 'H2H', '2025'];
    const windowPcts = Object.fromEntries(windows.map(w => [w, getWindowPct(w)])) as Record<ChartWindow, number>;
    const altLines = generateAltLineEntries(baseLine, seed);
    const insights = generateInsights(prop.player, effectiveLine, activePropType, logs);

    // Active sportsbook for the selected alt line
    const activeAlt = selectedAltLine ? altLines.find(al => al.line === selectedAltLine.line) : null;
    const activeBook = activeAlt ? (selectedAltLine?.dir === 'over' ? activeAlt.overBook : activeAlt.underBook) : null;

    return (
        <div className="terminal-panel border border-border-muted rounded-2xl overflow-hidden animate-fade-in bg-[#0a0a0f]">

            {/* ── Row 1: Identity + Odds ── */}
            <div className="flex items-center gap-4 px-5 pt-5 pb-3 border-b border-border-muted">
                {/* Photo + bigger team logo badge */}
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-border-muted shadow-lg">
                        <img src={prop.photoUrl} alt={prop.player}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = AVATAR(prop.player); }} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full overflow-hidden border-2 border-[#0a0a0f] bg-neutral-900 shadow-lg">
                        <img src={getTeamLogoUrl(prop.team, sport)} alt={prop.team}
                            className="w-full h-full object-contain p-0.5"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                    {prop.isTrending && <span className="absolute -top-1 -left-1 text-sm material-symbols-outlined text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">local_fire_department</span>}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tight">{prop.player}</h2>
                        <span className="text-[9px] font-black text-slate-500 bg-neutral-800 border border-border-muted px-1.5 py-0.5 rounded">{prop.position}</span>
                        <div className="flex flex-wrap gap-1 ml-1">
                            {allPropTypes.map(pt => (
                                <button key={pt} onClick={() => { setActivePropType(pt); setSelectedAltLine(null); }}
                                    className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all cursor-pointer whitespace-nowrap
                                    ${activePropType === pt ? 'bg-primary text-black border-primary shadow-[0_0_6px_rgba(10,242,10,0.3)]' : 'bg-neutral-900 text-slate-500 border-border-muted hover:text-primary hover:border-primary/40'}`}>
                                    {pt}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400">Over <span className="text-white">{effectiveLine}</span> {activePropType}</span>
                        <span className="text-[9px] text-slate-600">·</span>
                        <span className="text-[10px] font-black text-slate-400">DK: <span className="text-white">{prop.dkOdds}</span></span>
                        <span className="text-[10px] font-black text-slate-400">FD: <span className="text-white">{prop.fdOdds}</span></span>
                        <span className="text-[10px] font-black text-slate-400">IP: <span className="text-primary">{prop.impliedProb}%</span></span>
                    </div>
                </div>

                <button onClick={onClose}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-border-muted text-slate-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>

            {/* ── Row 2: Window tabs + lightbulb + % summary ── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border-muted">
                <div className="flex items-center gap-1">
                    {/* 💡 Insights button */}
                    <div className="relative mr-1">
                        <button onClick={() => setInsightsOpen(o => !o)}
                            onMouseDown={e => e.stopPropagation()}
                            className={`w-7 h-7 flex items-center justify-center rounded border transition-all cursor-pointer
                            ${insightsOpen ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-400' : 'border-border-muted text-slate-500 hover:text-yellow-400 hover:border-yellow-400/30'}`}
                            title="Choose Insights">
                            <span className="material-symbols-outlined text-sm">lightbulb</span>
                        </button>
                        {insightsOpen && (
                            <InsightsPanel insights={insights} hitPct={hitPct} count={logs.length} onClose={() => setInsightsOpen(false)} />
                        )}
                    </div>
                    {windows.map(w => (
                        <button key={w} onClick={() => setChartWindow(w)}
                            className={`relative px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer
                            ${chartWindow === w ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            {w}
                            {chartWindow === w && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[10px] font-bold">
                        <span className="text-slate-500">L5</span><span className={pctColor(windowPcts['L5'])}>{windowPcts['L5']}%</span>
                        <span className="text-slate-500">L20</span><span className={pctColor(windowPcts['L20'])}>{windowPcts['L20']}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[10px] font-bold">
                        <span className="text-slate-500">H2H</span><span className={pctColor(windowPcts['H2H'])}>{windowPcts['H2H']}%</span>
                        <span className="text-slate-500">2025</span><span className={pctColor(windowPcts['2025'])}>{windowPcts['2025']}%</span>
                    </div>
                </div>
            </div>

            {/* ── Row 3: Chart Header + ALT LINES pill ── */}
            <div className="flex items-center justify-between px-5 pt-3 pb-1">
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">% {prop.player} · {activePropType}</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Alt Lines bookie button — like image 5 */}
                    <button onClick={() => setAltLinesOpen(true)}
                        className="flex items-center gap-1.5 bg-[#111827] border border-dashed border-[#2d3f5a] rounded-lg px-2.5 py-1.5 hover:border-primary/40 hover:bg-white/5 transition-all cursor-pointer group">
                        {activeBook
                            ? <BookBadge book={activeBook} size="sm" />
                            : <>
                                <BookBadge book={{ letter: 'K', abbr: 'DK', name: 'DraftKings', bg: '#0a2e1a', text: '#4ade80' }} size="sm" />
                                <BookBadge book={{ letter: 'F', abbr: 'FD', name: 'FanDuel', bg: '#0a1e3a', text: '#60a5fa' }} size="sm" />
                            </>}
                        <span className="text-[9px] font-black text-slate-300 group-hover:text-white">
                            {selectedAltLine ? `${selectedAltLine.dir === 'over' ? 'Over' : 'Under'} ${selectedAltLine.line}` : `Over ${baseLine}`}
                        </span>
                        <span className="material-symbols-outlined text-slate-500 text-sm">expand_more</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-bold">{chartWindow}</span>
                    <span className={`text-lg font-black tabular-nums ${pctColor(hitPct)}`}>{hitPct}%</span>
                    <span className="text-[10px] text-slate-500 font-medium">{hits} of {logs.length}</span>
                </div>
            </div>

            {/* ── Opp Rank pill ── */}
            <div className="flex items-center gap-2 px-5 pb-1">
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Opp Rank vs {activePropType}:</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${prop.oppRank.color === 'green' ? 'text-[#a3ff00] border-[#a3ff00]/30 bg-[#a3ff00]/10' : prop.oppRank.color === 'red' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'}`}>
                    {prop.oppRank.rank}{OrdinalSuffix(prop.oppRank.rank)} in league
                </span>
            </div>

            {/* ── Chart Type Selectors ── */}
            <div className="px-5 py-2 flex flex-wrap gap-2 items-center border-b border-neutral-800/60 bg-black/20">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-2">Chart Type:</span>
                {(['bar', 'line', 'area', 'scatter', 'bubble', 'heat', 'pie', 'radar'] as const).map(ct => (
                    <button
                        key={ct}
                        onClick={() => setChartType(ct)}
                        className={`text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest transition-colors ${chartType === ct ? 'bg-primary text-black' : 'bg-neutral-800 text-slate-400 hover:text-white border border-transparent hover:border-slate-700'}`}
                    >
                        {ct}
                    </button>
                ))}
            </div>

            {/* ── Chart Rendering ── */}
            <div className="px-4 pb-4">
                <UniversalPropChart logs={logs} line={effectiveLine} propType={activePropType} playerName={prop.player} chartType={chartType} />
            </div>

            {/* ── AltLines Modal ── */}
            {altLinesOpen && (
                <AltLinesPanel
                    altLines={altLines}
                    baseLine={baseLine}
                    selectedLine={selectedAltLine?.line ?? baseLine}
                    selectedDir={selectedAltLine?.dir ?? 'over'}
                    onSelect={(line, dir) => setSelectedAltLine({ line, dir })}
                    onClose={() => setAltLinesOpen(false)}
                />
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────────────────────────────────────
export const PlayerPropsModule: React.FC<PlayerPropsModuleProps> = ({ sport, team }) => {
    const { players, loading: rosterLoading } = useESPNRoster(team.name, sport);
    const [propsData, setPropsData] = useState<PropLine[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [propTypeFilter, setPropTypeFilter] = useState<string>('');
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!rosterLoading && players.length > 0) {
            const data = buildPropsFromRoster(players, sport, team.abbr);
            setPropsData(data);
            if (data.length > 0) setSelectedId(data[0].id);
        }
    }, [players, rosterLoading, sport, team.abbr]);

    const isLoading = rosterLoading || (players.length > 0 && propsData.length === 0);
    const selectedProp = propsData.find(p => p.id === selectedId);
    const propTypes = getPropTypes(sport);
    const filteredProps = propTypeFilter ? propsData.filter(p => p.propType === propTypeFilter) : propsData;

    const handleSelect = (id: string) => {
        setSelectedId(id);
        setTimeout(() => heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    };

    const pctColor = (pct: number) => pct >= 70 ? 'text-[#a3ff00]' : pct >= 50 ? 'text-yellow-400' : 'text-orange-500';

    return (
        <div className="flex flex-col gap-5 w-full animate-fade-in">

            {/* ── Zone A: Player Hero ── */}
            <div ref={heroRef}>
                {selectedProp && !isLoading && (
                    <PlayerHero prop={selectedProp} onClose={() => setSelectedId(null)} sport={sport} />
                )}
            </div>

            {/* ── Zone B: Props Table ── */}
            <div className="terminal-panel rounded-xl overflow-hidden">

                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border-muted bg-neutral-900/40 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                        <span className="text-[10px] text-slate-500 font-medium">
                            {!rosterLoading && players.length > 0
                                ? <><span className="text-primary font-bold">{players.length} {team.name}</span> · ESPN Roster</>
                                : 'Loading roster…'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button onClick={() => setPropTypeFilter('')}
                            className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer
                            ${!propTypeFilter ? 'bg-primary text-black border-primary' : 'bg-neutral-800 text-slate-500 border-border-muted hover:text-text-main'}`}>
                            All
                        </button>
                        {propTypes.map(pt => (
                            <button key={pt} onClick={() => setPropTypeFilter(pt === propTypeFilter ? '' : pt)}
                                className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer whitespace-nowrap
                                ${propTypeFilter === pt ? 'bg-primary text-black border-primary' : 'bg-neutral-800 text-slate-500 border-border-muted hover:text-text-main'}`}>
                                {pt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-2.5 border-b border-border-muted bg-neutral-900/60 sticky top-0 z-10 min-w-[800px]">
                    {[
                        'Player', 'Line',
                        'DK / FD Odds', 'IP', 'Opp Rank',
                        'L5', 'L10', 'Season'
                    ].map(label => (
                        <div key={label} className="text-[9px] font-black text-slate-500 tracking-widest uppercase whitespace-nowrap">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Skeleton */}
                {isLoading && (
                    <div className="flex flex-col min-w-[800px]">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-b border-border-muted/30 items-center animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-neutral-800 shrink-0" />
                                    <div className="w-28 h-3 bg-neutral-800 rounded" />
                                </div>
                                {Array.from({ length: 7 }).map((_, j) => (
                                    <div key={j} className="h-3 bg-neutral-800 rounded mx-auto w-10" />
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Rows */}
                {!isLoading && (
                    <div className="flex flex-col min-w-[800px] max-h-[580px] overflow-y-auto custom-scrollbar">
                        {filteredProps.map((prop, idx) => {
                            const isSelected = selectedId === prop.id;
                            return (
                                <div key={prop.id}
                                    onClick={() => handleSelect(prop.id)}
                                    className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-4 py-3 border-b border-border-muted/30 items-center cursor-pointer transition-all group
                                    ${isSelected
                                            ? 'bg-primary/8 border-l-2 border-l-primary'
                                            : idx % 2 === 0 ? 'bg-neutral-900/20 hover:bg-white/5' : 'bg-neutral-900/40 hover:bg-white/5'}`}>

                                    {/* Player */}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full overflow-hidden border shrink-0 transition-all ${isSelected ? 'border-primary/60 shadow-[0_0_8px_rgba(10,242,10,0.25)]' : 'border-border-muted/50'}`}>
                                            <img src={prop.photoUrl} alt={prop.player}
                                                className="w-full h-full object-cover"
                                                onError={e => { (e.target as HTMLImageElement).src = AVATAR(prop.player); }} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-xs font-bold truncate ${isSelected ? 'text-primary' : 'text-text-main group-hover:text-primary'}`}>
                                                    {prop.player}
                                                </span>
                                                {prop.position !== '—' && (
                                                    <span className="text-[8px] font-black text-slate-600 bg-neutral-800 px-1 rounded uppercase">{prop.position}</span>
                                                )}
                                                {prop.isTrending && <span className="text-[12px] material-symbols-outlined text-orange-500">local_fire_department</span>}
                                            </div>
                                            <span className="text-[9px] text-slate-600 font-bold">{prop.propType}</span>
                                        </div>
                                    </div>

                                    {/* Line */}
                                    <div className="text-sm font-black text-text-muted text-center">{prop.line}</div>

                                    {/* Odds */}
                                    <div className="flex flex-col items-center gap-0.5">
                                        <div className="flex items-center gap-1">
                                            <img src="https://sportsbook.draftkings.com/favicon.ico" alt="DK" className="w-2.5 h-2.5 rounded-sm opacity-60" />
                                            <span className="text-[10px] font-bold text-text-muted">{prop.dkOdds}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <img src="https://cdn.wagerwire.com/sportsbooks/fanduel.png" alt="FD" className="w-2.5 h-2.5 rounded-sm opacity-60" />
                                            <span className="text-[10px] font-bold text-text-muted">{prop.fdOdds}</span>
                                        </div>
                                    </div>

                                    {/* IP */}
                                    <div className="text-xs font-bold text-text-muted text-center">{prop.impliedProb}%</div>

                                    {/* Opp Rank */}
                                    <div className="flex items-center justify-center">
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${prop.oppRank.color === 'green' ? 'text-[#a3ff00] border-[#a3ff00]/30 bg-[#a3ff00]/10'
                                            : prop.oppRank.color === 'red' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10'
                                                : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'}`}>
                                            {prop.oppRank.rank}{OrdinalSuffix(prop.oppRank.rank)}
                                        </span>
                                    </div>

                                    {/* L5 */}
                                    <div className={`text-sm font-black text-center tabular-nums ${pctColor(prop.l5Pct)}`}>{prop.l5Pct}%</div>

                                    {/* L10 */}
                                    <div className={`text-sm font-black text-center tabular-nums ${pctColor(prop.l10Pct)}`}>{prop.l10Pct}%</div>

                                    {/* Season */}
                                    <div className={`text-sm font-black text-center tabular-nums ${pctColor(prop.season2025Pct)}`}>{prop.season2025Pct}%</div>
                                </div>
                            );
                        })}

                        {filteredProps.length === 0 && !isLoading && (
                            <div className="p-12 text-center text-slate-600 font-medium">No prop data available.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
