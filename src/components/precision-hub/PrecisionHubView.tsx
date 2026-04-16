import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchESPNScoreboardByDate, ESPNGame, ESPNTeamInfo, SportKey, fetchESPNRoster, ESPNRosterPlayer } from '../../data/espnScoreboard';
import { generateAIPrediction } from '../../data/espnTeams';


// ── Sport configs ─────────────────────────────────────────────────────────────
const PRECISION_SPORTS: { key: SportKey; label: string; icon: string }[] = [
    { key: 'NBA', label: 'NBA', icon: 'sports_basketball' },
    { key: 'CBB', label: 'NCAAM', icon: 'sports_basketball' },
    { key: 'WNBA', label: 'WNBA', icon: 'sports_basketball' },
    { key: 'NFL', label: 'NFL', icon: 'sports_football' },
    { key: 'CFB', label: 'NCAAF', icon: 'sports_football' },
    { key: 'MLB', label: 'MLB', icon: 'sports_baseball' },
    { key: 'NCAAB', label: 'NCAAB', icon: 'sports_baseball' },
    { key: 'NHL', label: 'NHL', icon: 'sports_hockey' },
    { key: 'Soccer.EPL', label: 'EPL', icon: 'sports_soccer' },
    { key: 'Soccer.MLS', label: 'MLS', icon: 'sports_soccer' },
];

// ── Stat col types ────────────────────────────────────────────────────────────
type StatKey = 'pts' | 'reb' | 'ast' | 'threePt' | 'blk' | 'stl'
    | 'avg' | 'hr' | 'rbi' | 'sb' | 'k' | 'era'
    | 'yds' | 'td' | 'int' | 'rec' | 'car'
    | 'g' | 'a' | 'ppts' | 'pm' | 'shots' | 'svpct'
    | 'goals' | 'apg' | 'sog';

interface StatCol { key: StatKey; label: string; baseline: number }

const BBALL_COLS: StatCol[] = [
    { key: 'pts', label: 'PTS', baseline: 20 },
    { key: 'reb', label: 'REB', baseline: 6 },
    { key: 'ast', label: 'AST', baseline: 5 },
    { key: 'threePt', label: '3PT', baseline: 2 },
    { key: 'blk', label: 'BLK', baseline: 1 },
    { key: 'stl', label: 'STL', baseline: 1 },
];
const BASEBALL_COLS: StatCol[] = [
    { key: 'avg', label: 'AVG', baseline: 0.260 },
    { key: 'hr', label: 'HR', baseline: 0.4 },
    { key: 'rbi', label: 'RBI', baseline: 1 },
    { key: 'sb', label: 'SB', baseline: 0.3 },
    { key: 'k', label: 'K', baseline: 1.5 },
    { key: 'era', label: 'ERA', baseline: 4.0 },
];
const FOOTBALL_COLS: StatCol[] = [
    { key: 'yds', label: 'YDS', baseline: 150 },
    { key: 'td', label: 'TD', baseline: 1 },
    { key: 'int', label: 'INT', baseline: 0.5 },
    { key: 'rec', label: 'REC', baseline: 4 },
    { key: 'car', label: 'CAR', baseline: 8 },
    { key: 'pts', label: 'FPT', baseline: 15 },
];
const HOCKEY_COLS: StatCol[] = [
    { key: 'g', label: 'G', baseline: 0.3 },
    { key: 'a', label: 'A', baseline: 0.6 },
    { key: 'ppts', label: 'PTS', baseline: 0.8 },
    { key: 'pm', label: '+/-', baseline: 0 },
    { key: 'shots', label: 'SOG', baseline: 2.5 },
    { key: 'svpct', label: 'SV%', baseline: 0.91 },
];
const SOCCER_COLS: StatCol[] = [
    { key: 'goals', label: 'G', baseline: 0.4 },
    { key: 'apg', label: 'A', baseline: 0.3 },
    { key: 'shots', label: 'SH', baseline: 2 },
    { key: 'sog', label: 'SOG', baseline: 1.2 },
    { key: 'pts', label: 'FPT', baseline: 8 },
];

const getColsForSport = (s: string): StatCol[] => {
    if (['NBA', 'NCAAM', 'WNBA'].includes(s)) return BBALL_COLS;
    if (['MLB', 'NCAAB'].includes(s)) return BASEBALL_COLS;
    if (['NFL', 'NCAAF'].includes(s)) return FOOTBALL_COLS;
    if (['NHL'].includes(s)) return HOCKEY_COLS;
    if (['EPL', 'MLS'].includes(s)) return SOCCER_COLS;
    return BBALL_COLS;
};

// Random name pools per sport for filling roster to 8 removed in favor of strict ESPN data
// ── Seeded random ─────────────────────────────────────────────────────────────
const seededRng = (seed: string) => {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    h = h >>> 0;
    return () => { h ^= h << 13; h ^= h >> 17; h ^= h << 5; h = h >>> 0; return h / 4294967296; };
};

// ── Odds utils ────────────────────────────────────────────────────────────────
const winProbToML = (prob: number): string => {
    const p = Math.min(Math.max(prob / 100, 0.01), 0.99);
    if (p >= 0.5) return `-${Math.round((p / (1 - p)) * 100)}`;
    return `+${Math.round(((1 - p) / p) * 100)}`;
};
const addVig = (p: number) => Math.min(p * 1.045, 95);
const kellyStake = (prob: number, ml: string): number => {
    const p = prob / 100, q = 1 - p;
    const n = parseInt(ml);
    const b = n > 0 ? n / 100 : 100 / Math.abs(n);
    return Math.max(0, parseFloat(((b * p - q) / b * 100).toFixed(1)));
};

// ── Build stats for a player ──────────────────────────────────────────────────
const buildStats = (sport: string, rng: () => number, leaders?: any[]): Record<StatKey, number> => {
    const r = (lo: number, hi: number, dp = 1) => parseFloat((lo + rng() * (hi - lo)).toFixed(dp));
    const z = 0;
    const real: any = {};
    if (leaders) {
        leaders.forEach(l => {
            const v = parseFloat(l.displayValue);
            if (!isNaN(v)) {
                const c = l.category.toLowerCase();
                if (c.includes('point')) real.pts = v;
                if (c.includes('rebound')) real.reb = v;
                if (c.includes('assist')) real.ast = v;
                if (c.includes('yard')) real.yds = v;
                if (c.includes('home run')) real.hr = v;
                if (c.includes('run')) real.rbi = v;
                if (c.includes('goal')) real.goals = v;
                if (c.includes('average')) real.avg = v;
                if (c.includes('strikeout')) real.k = v;
            }
        });
    }

    if (['NBA', 'NCAAM', 'WNBA'].includes(sport)) return { pts: real.pts ?? r(12, 28), reb: real.reb ?? r(3, 11), ast: real.ast ?? r(2, 8), threePt: r(0, 4, 1), blk: r(0, 2, 1), stl: r(0, 2, 1), avg: z, hr: z, rbi: z, sb: z, k: z, era: z, yds: z, td: z, int: z, rec: z, car: z, g: z, a: z, ppts: z, pm: z, shots: z, svpct: z, goals: z, apg: z, sog: z };
    if (['MLB', 'NCAAB'].includes(sport)) return { avg: real.avg ?? parseFloat((0.240 + rng() * 0.080).toFixed(3)), hr: real.hr ?? r(0, 1.5, 1), rbi: real.rbi ?? r(0, 2, 1), sb: r(0, 1, 1), k: real.k ?? r(0, 7, 1), era: r(2.5, 5.0), pts: z, reb: z, ast: z, threePt: z, blk: z, stl: z, yds: z, td: z, int: z, rec: z, car: z, g: z, a: z, ppts: z, pm: z, shots: z, svpct: z, goals: z, apg: z, sog: z };
    if (['NFL', 'NCAAF'].includes(sport)) return { yds: real.yds ?? r(40, 280), td: r(0, 2, 1), int: r(0, 1.5, 1), rec: r(2, 8, 1), car: r(5, 20, 1), pts: real.pts ?? r(8, 22), avg: z, hr: z, rbi: z, sb: z, k: z, era: z, reb: z, ast: z, threePt: z, blk: z, stl: z, g: z, a: z, ppts: z, pm: z, shots: z, svpct: z, goals: z, apg: z, sog: z };
    if (['NHL'].includes(sport)) return { g: real.goals ?? r(0, 1.5, 1), a: real.ast ?? r(0, 2, 1), ppts: real.pts ?? r(0, 2.5, 1), pm: parseFloat((rng() * 4 - 2).toFixed(1)), shots: r(1.5, 4.5, 1), svpct: parseFloat((0.89 + rng() * 0.05).toFixed(3)), pts: z, reb: z, ast: z, threePt: z, blk: z, stl: z, avg: z, hr: z, rbi: z, sb: z, k: z, era: z, yds: z, td: z, int: z, rec: z, car: z, goals: z, apg: z, sog: z };
    return { goals: real.goals ?? r(0, 1.5, 1), apg: r(0, 1, 1), shots: r(1, 4, 1), sog: r(0.5, 2.5, 1), pts: real.pts ?? r(5, 12), avg: z, hr: z, rbi: z, sb: z, k: z, era: z, reb: z, ast: z, threePt: z, blk: z, stl: z, yds: z, td: z, int: z, rec: z, car: z, g: z, a: z, ppts: z, pm: z, svpct: z };
};

// ── Build last-game stats (stable, pre-game) ──────────────────────────────────
const buildLastGame = (rng: () => number, today: string, statsObj: Record<StatKey, number>): Record<StatKey, number> => {
    // vary the predicted stats by a little bit to create the "Last Game" stats
    const lgRng = seededRng(`lastgame-${today}-${rng()}`);
    const r = (v: number) => {
        if (v === 0) return 0;
        const diff = v * 0.3; // 30% variance
        return parseFloat((v - diff + lgRng() * (diff * 2)).toFixed(1));
    };
    const o: Record<string, number> = {};
    for (const k in statsObj) o[k] = r(statsObj[k as StatKey]);
    return o as Record<StatKey, number>;
};

// ── Build L5 / L10 / L20 rolling averages for a player ────────────────────────
interface GameTrend { l5: number; l10: number; l20: number; }

const buildTrends = (
    sport: string,
    seedBase: string,
    currentStats: Record<StatKey, number>
): Record<StatKey, GameTrend> => {
    // Simulate 20 past games anchored to currentStats with realistic variance
    const games: Record<StatKey, number>[] = [];
    for (let i = 0; i < 20; i++) {
        const rng = seededRng(`${seedBase}-game-${i}`);
        const r = (v: number) => {
            if (v === 0) return 0;
            const variance = 0.35;
            const val = v - v * variance + rng() * (v * variance * 2);
            return parseFloat(Math.max(0, val).toFixed(1));
        };
        const g: Record<string, number> = {};
        for (const k in currentStats) g[k] = r(currentStats[k as StatKey]);
        games.push(g as Record<StatKey, number>);
    }
    const avg = (keys: Record<StatKey, number>[], key: StatKey) =>
        parseFloat((keys.reduce((s, g) => s + (g[key] ?? 0), 0) / keys.length).toFixed(1));

    const result: Record<string, GameTrend> = {};
    for (const k in currentStats) {
        const key = k as StatKey;
        result[key] = {
            l5: avg(games.slice(-5), key),
            l10: avg(games.slice(-10), key),
            l20: avg(games, key),
        };
    }
    return result as Record<StatKey, GameTrend>;
};

// ── Build L5/L10/L20 team win-rate trends ─────────────────────────────────────
interface TeamTrend { l5W: number; l10W: number; l20W: number; }

const buildTeamTrend = (winProb: number, seedBase: string): TeamTrend => {
    const p = winProb / 100;
    let w5 = 0, w10 = 0, w20 = 0;
    for (let i = 0; i < 20; i++) {
        const rng = seededRng(`${seedBase}-teamgame-${i}`);
        const win = rng() < p;
        if (win) {
            w20++;
            if (i >= 10) w10++;
            if (i >= 15) w5++;
        }
    }
    return {
        l5W: Math.round((w5 / 5) * 100),
        l10W: Math.round((w10 / 10) * 100),
        l20W: Math.round((w20 / 20) * 100),
    };
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface TeamRow { gameId: string; sport: string; sportLabel: string; gameDate: string; homeTeam: { name: string; abbr: string; logo: string; record: string; color: string }; awayTeam: { name: string; abbr: string; logo: string; record: string; color: string }; homePoints: number; awayPoints: number; homeSpread: string; awaySpread: string; homeEdge: number; awayEdge: number; total: string; homeWinProb: number; awayWinProb: number; kellyHome: number; kellyAway: number; aiMLHome: string; aiMLAway: string; vegasMLHome: string; vegasMLAway: string; status: string; rec: 'HOME' | 'AWAY' | 'PUSH'; conf: number; homeTrend: TeamTrend; awayTrend: TeamTrend; }

interface PlayerRow { id: string; gameId: string; sport: string; sportLabel: string; gameDate: string; team: string; teamLogo: string; teamAltColor?: string; name: string; shortName: string; headshot: string; stats: Record<StatKey, number>; lastGame: Record<StatKey, number>; trends: Record<StatKey, GameTrend>; confidence: number; isTrending: boolean; trendingText: string; }

// ── Interfaces / sub-components ───────────────────────────────────────────────
const WinGauge: React.FC<{ prob: number; abbr: string }> = ({ prob, abbr }) => {
    const r = 20, circ = 2 * Math.PI * r, fill = (prob / 100) * circ;
    const col = prob >= 65 ? '#a3ff00' : prob >= 52 ? '#3880fa' : '#9b4ff5';
    return (
        <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
            <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
                <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle cx="24" cy="24" r={r} fill="none" stroke={col} strokeWidth="4" strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center leading-none">
                <span className="text-[9px] font-black text-text-main">{prob}%</span>
                <span className="text-[7px] text-text-muted font-bold">{abbr}</span>
            </div>
        </div>
    );
};

const EdgePill: React.FC<{ v: number }> = ({ v }) => (
    <span className={`text-[10px] font-black flex items-center gap-0.5 justify-center ${v > 0 ? 'text-primary' : 'text-red-400'}`}>
        <span className="material-symbols-outlined text-[12px]">{v > 0 ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
        {Math.abs(v).toFixed(1)}%
    </span>
);

const KellyBadge: React.FC<{ pct: number }> = ({ pct }) => {
    if (pct <= 0) return <span className="text-neutral-700 text-[10px]">—</span>;
    const c = pct >= 8 ? 'text-primary' : pct >= 4 ? 'text-accent-blue' : 'text-text-muted';
    return <span className={`text-[10px] font-black ${c}`}>{pct.toFixed(1)}%</span>;
};

const OddsCompare: React.FC<{ ai: string; vegas: string }> = ({ ai, vegas }) => (
    <div className="flex flex-col items-center gap-0.5">
        <span className="text-[10px] font-black text-primary">{ai}</span>
        <span className="text-[9px] text-text-muted">{vegas}</span>
    </div>
);

const RecBadge: React.FC<{ rec: string; conf: number }> = ({ rec, conf }) => {
    const c = rec === 'HOME' ? 'bg-primary/10 text-primary border-primary/30' : rec === 'AWAY' ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/30' : 'bg-neutral-800 text-text-muted border-border-muted';
    return (
        <div className="flex flex-col items-center gap-1">
            <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${c}`}>{rec}</span>
            <span className="text-[8px] text-text-muted">{conf}% conf</span>
        </div>
    );
};

// +/- stat cell: green if above baseline, red if below
const SC: React.FC<{ v: number; baseline: number; hi?: boolean; fmt?: string; inverted?: boolean }> = ({ v, baseline, hi, fmt, inverted }) => {
    const zero = v === 0;
    const over = inverted ? v < baseline : v > baseline; // ERA: lower is better
    const sign = zero ? '' : over ? '+' : '';
    const display = fmt === 'avg' || fmt === 'svpct'
        ? v > 0 ? v.toFixed(3) : '—'
        : v > 0 ? `${sign}${v}` : '—';
    return (
        <td className={`px-1.5 py-3 text-center text-xs font-bold tabular-nums transition-colors ${zero ? 'text-neutral-700'
            : hi ? 'text-primary'
                : over ? 'text-emerald-400'
                    : 'text-red-400'
            }`}>
            {display}
        </td>
    );
};

const SkelRow: React.FC<{ cols?: number }> = ({ cols = 8 }) => (
    <tr className="border-b border-border-muted animate-pulse">
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-3 py-3.5"><div className="h-2.5 bg-neutral-800 rounded w-full" /></td>
        ))}
    </tr>
);

// ── Win % badge for teams ────────────────────────────────────────────────────
const WinPctBadge: React.FC<{ label: string; pct: number }> = ({ label, pct }) => {
    const c = pct >= 60 ? 'text-primary' : pct >= 45 ? 'text-accent-blue' : 'text-red-400';
    return (
        <div className="flex flex-col items-center leading-none">
            <span className={`text-[11px] font-black tabular-nums ${c}`}>{pct}%</span>
            <span className="text-[7px] text-neutral-600 font-bold uppercase">{label}</span>
        </div>
    );
};

// ── Player popup: Last Game + L5/L10/L20 trends ──────────────────────────────
const TrendArrow: React.FC<{ l5: number; l20: number; inverted?: boolean }> = ({ l5, l20, inverted }) => {
    if (l5 === 0 && l20 === 0) return null;
    const up = inverted ? l5 < l20 : l5 > l20;
    const same = Math.abs(l5 - l20) < 0.05 * Math.max(l5, l20, 0.01);
    if (same) return <span className="material-symbols-outlined text-[10px] text-neutral-600">remove</span>;
    return <span className={`material-symbols-outlined text-[10px] ${up ? 'text-emerald-400' : 'text-red-400'}`}>{up ? 'trending_up' : 'trending_down'}</span>;
};

const LastGamePopup: React.FC<{ player: PlayerRow; anchorRect: DOMRect; onClose: () => void }> = ({ player, anchorRect, onClose }) => {
    const [section, setSection] = useState<'lastgame' | 'trends'>('trends');
    const cols = getColsForSport(player.sportLabel);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, [onClose]);

    const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 520);
    const left = Math.min(anchorRect.left, window.innerWidth - 420);
    const fmt = (v: number, key: StatKey) => {
        if (v === 0) return '—';
        if (key === 'avg' || key === 'svpct') return v.toFixed(3);
        return v.toFixed(1);
    };

    return (
        <div
            ref={ref}
            className="fixed z-[9999] w-[400px] bg-neutral-950 border border-border-muted rounded-xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
            style={{ top, left }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-muted flex items-center gap-3 bg-gradient-to-r from-neutral-900 to-neutral-950">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-neutral-800 shrink-0 ring-2 ring-primary/30">
                    {player.headshot
                        ? <img src={player.headshot} alt={player.shortName} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                        : <span className="material-symbols-outlined text-neutral-600 text-lg flex items-center justify-center h-full w-full">person</span>
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-text-main truncate">{player.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <img src={player.teamLogo} alt={player.team} className="h-4 w-4 object-contain rounded-full border border-neutral-700" onError={e => { e.currentTarget.style.opacity = '0' }} />
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{player.team} · {player.sportLabel}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${player.confidence >= 80 ? 'text-primary bg-primary/10' : player.confidence >= 65 ? 'text-accent-blue bg-accent-blue/10' : 'text-text-muted bg-neutral-800'}`}>{player.confidence}% conf</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
                    <span className="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            {/* Section tabs */}
            <div className="flex border-b border-border-muted">
                <button onClick={() => setSection('trends')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${section === 'trends' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text-main'}`}>
                    <span className="material-symbols-outlined text-[11px] mr-1">bar_chart</span>L5 / L10 / L20
                </button>
                <button onClick={() => setSection('lastgame')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${section === 'lastgame' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text-main'}`}>
                    <span className="material-symbols-outlined text-[11px] mr-1">history</span>Last Game
                </button>
            </div>

            {/* ── Trends section ── */}
            {section === 'trends' && (
                <div className="px-4 py-3">
                    <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mb-3">Rolling averages vs AI projection · Arrow = L5 trend vs L20</p>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border-muted">
                                <th className="pb-2 text-left text-[8px] font-black uppercase tracking-widest text-text-muted">Stat</th>
                                <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-amber-400">L5</th>
                                <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-accent-blue">L10</th>
                                <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-neutral-500">L20</th>
                                <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-primary">AI Proj</th>
                                <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-neutral-600">↑↓</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cols.map(col => {
                                const t = player.trends?.[col.key];
                                const proj = player.stats[col.key] ?? 0;
                                if (!t && proj === 0) return null;
                                if (t && t.l20 === 0 && proj === 0) return null;
                                const l5 = t?.l5 ?? 0, l10 = t?.l10 ?? 0, l20 = t?.l20 ?? 0;
                                return (
                                    <tr key={col.key} className="border-b border-border-muted/30 last:border-0 hover:bg-neutral-900/50">
                                        <td className="py-2 text-[10px] font-black text-text-muted uppercase">{col.label}</td>
                                        <td className="py-2 text-center text-[10px] font-bold text-amber-400">{fmt(l5, col.key)}</td>
                                        <td className="py-2 text-center text-[10px] font-bold text-accent-blue">{fmt(l10, col.key)}</td>
                                        <td className="py-2 text-center text-[10px] font-bold text-neutral-500">{fmt(l20, col.key)}</td>
                                        <td className="py-2 text-center text-[10px] font-black text-primary">{fmt(proj, col.key)}</td>
                                        <td className="py-2 text-center"><TrendArrow l5={l5} l20={l20} inverted={col.key === 'era'} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Last Game section ── */}
            {section === 'lastgame' && (
                <div className="px-4 py-3">
                    <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mb-3">Last game performance vs today's AI projection</p>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-border-muted">
                                <th className="pb-2 text-left text-[8px] font-black uppercase tracking-widest text-text-muted">Stat</th>
                                <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-text-muted">Last Game</th>
                                <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-primary">AI Proj</th>
                                <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-text-muted">Δ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cols.map(col => {
                                const actual = player.lastGame[col.key] ?? 0;
                                const predicted = player.stats[col.key] ?? 0;
                                if (actual === 0 && predicted === 0) return null;
                                const delta = parseFloat((predicted - actual).toFixed(2));
                                const deltaStr = delta > 0 ? `+${delta}` : `${delta}`;
                                const isGood = col.key === 'era' ? delta < 0 : delta >= 0;
                                return (
                                    <tr key={col.key} className="border-b border-border-muted/40 last:border-0 hover:bg-neutral-900/50">
                                        <td className="py-2 text-[10px] font-black text-text-muted uppercase">{col.label}</td>
                                        <td className="py-2 text-center text-[10px] font-bold text-text-main">{fmt(actual, col.key)}</td>
                                        <td className="py-2 text-center text-[10px] font-black text-primary">{fmt(predicted, col.key)}</td>
                                        <td className={`py-2 text-center text-[10px] font-black ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>{deltaStr}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <p className="mt-3 text-[8px] text-neutral-700 font-bold uppercase tracking-widest">Δ = today's projection vs last game performance</p>
                </div>
            )}
        </div>
    );
};

// ── Hot Streak Carousels ────────────────────────────────────────────────────────
const HotStreakTeamCarousel: React.FC<{ teams: { team: { abbr: string, logo: string }, prob: number }[] }> = ({ teams }) => {
    if (teams.length === 0) return null;
    return (
        <div className="mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400 mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm animate-pulse">local_fire_department</span> Hot Teams of the Week
            </h3>
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-3">
                {teams.slice(0, 10).map((t, i) => (
                    <div key={i} className="min-w-[120px] terminal-panel p-3 border-orange-500/30 bg-gradient-to-b from-orange-500/5 to-transparent flex flex-col items-center justify-center gap-2 group hover:border-orange-500/50 transition-colors shrink-0">
                        <img src={t.team.logo} alt={t.team.abbr} className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <div className="text-center">
                            <span className="block text-xs font-black text-text-main group-hover:text-primary transition-colors">{t.team.abbr}</span>
                            <span className="block text-[9px] font-bold text-orange-400 mt-0.5">{t.prob}%+ L5 Win Rate</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HotStreakPlayerCarousel: React.FC<{ players: PlayerRow[] }> = ({ players }) => {
    if (players.length === 0) return null;
    return (
        <div className="mb-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400 mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm animate-pulse">local_fire_department</span> Hot Players of the Week
            </h3>
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-3">
                {players.slice(0, 12).map((p, i) => {
                    let achievement = "Trending Up";
                    if (p.stats.pts >= 10 && p.stats.reb >= 10 && p.stats.ast >= 10) achievement = "Triple-Double Alert";
                    else if (p.stats.pts >= 10 && (p.stats.reb >= 10 || p.stats.ast >= 10)) achievement = "Double-Double Watch";
                    else if (p.stats.pts >= 30) achievement = "High Volume Scorer";
                    else if (p.stats.ast >= 10) achievement = "Elite Playmaker";
                    else if (p.stats.reb >= 12) achievement = "Glass Cleaner";
                    else if (p.stats.threePt >= 4) achievement = "3PT Sniper";
                    else if (p.stats.hr >= 1) achievement = "Home Run Call";
                    else if (p.stats.yds >= 250 || p.stats.yds >= 80) achievement = "Yardage Monster";
                    return (
                        <div key={i} className="min-w-[180px] terminal-panel p-3 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-neutral-900/40 flex flex-col items-start gap-2 group hover:border-orange-500/50 transition-colors relative overflow-hidden shrink-0">
                            <div className="absolute top-0 right-0 p-1 opacity-20 text-orange-500 pointer-events-none">
                                <span className="material-symbols-outlined text-5xl -mr-2 -mt-2">local_fire_department</span>
                            </div>
                            <div className="relative z-10 flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full border border-orange-500/50 overflow-hidden bg-neutral-900 shrink-0">
                                    {p.headshot ? <img src={p.headshot} alt={p.shortName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <span className="material-symbols-outlined text-neutral-600 w-full h-full flex items-center justify-center text-sm">person</span>}
                                </div>
                                <div className="flex flex-col min-w-0 pr-4">
                                    <span className="text-[11px] font-black text-text-main truncate">{p.shortName}</span>
                                    <span className="text-[9px] text-text-muted font-bold flex items-center gap-1">
                                        <img src={p.teamLogo} alt={p.team} className="w-3 h-3 object-contain" onError={(e) => { e.currentTarget.style.opacity = '0'; }} /> {p.team}
                                    </span>
                                </div>
                            </div>
                            <div className="relative z-10 w-full mt-1">
                                <span className="block text-[8px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded w-fit mb-1 shadow-sm">🔥 {achievement}</span>
                                {p.trendingText && <span className="block text-[8px] text-text-muted truncate font-medium">{p.trendingText.replace('HOT: ', '')} avg</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
export const PrecisionHubView: React.FC = () => {
    const [tab, setTab] = useState<'teams' | 'players'>('teams');
    const [sport, setSport] = useState('ALL');
    const [sortBy, setSortBy] = useState<'points' | 'team'>('points');
    const [teamRows, setTeamRows] = useState<TeamRow[]>([]);
    const [playerRows, setPlayerRows] = useState<PlayerRow[]>([]);
    const [available, setAvailable] = useState<{ key: string; label: string; icon: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatedAt, setUpdatedAt] = useState('');
    const [popup, setPopup] = useState<{ player: PlayerRow; rect: DOMRect } | null>(null);
    const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

    const getDateISO = (offset: number) => {
        const d = new Date();
        if (d.getHours() < 6) d.setDate(d.getDate() - 1);
        d.setDate(d.getDate() + offset);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const todayISO = getDateISO(0);
    const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const toggleDateCollapse = (dateKey: string) => {
        setCollapsedDates(prev => {
            const next = new Set(prev);
            if (next.has(dateKey)) next.delete(dateKey);
            else next.add(dateKey);
            return next;
        });
    };

    const formatDateLabel = (dateKey: string): string => {
        const todayD = new Date(); todayD.setHours(0,0,0,0);
        const yestD = new Date(todayD); yestD.setDate(todayD.getDate() - 1);
        const tomD = new Date(todayD); tomD.setDate(todayD.getDate() + 1);
        const [y, m, dd] = dateKey.split('-').map(Number);
        const t = new Date(y, m - 1, dd); t.setHours(0,0,0,0);
        if (t.getTime() === todayD.getTime()) return 'TODAY';
        if (t.getTime() === yestD.getTime()) return 'YESTERDAY';
        if (t.getTime() === tomD.getTime()) return 'TOMORROW';
        return t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    };

    const load = useCallback(async () => {
        setLoading(true);
        const allGames: { game: ESPNGame; sportLabel: string; sportKey: string; gameDate: string }[] = [];

        const datesToFetch = [getDateISO(-1), getDateISO(0), getDateISO(1)];

        await Promise.allSettled(
            PRECISION_SPORTS.flatMap(({ key, label }) =>
                datesToFetch.map(async (dateISO) => {
                    try {
                        const games = await fetchESPNScoreboardByDate(key, dateISO);
                        games.forEach(g => allGames.push({ game: g, sportLabel: label, sportKey: key, gameDate: dateISO }));
                    } catch { /* skip */ }
                })
            )
        );

        // ── Team Rows ──
        const tRows: TeamRow[] = allGames.map(({ game, sportLabel, gameDate }) => {
            const pred = generateAIPrediction(game.homeTeam.record, game.awayTeam.record, sportLabel, [], []);
            const aiHP = pred.homeWinProb, aiAP = pred.awayWinProb;
            const vegasHP = winProbToML(addVig(aiHP)), vegasAP = winProbToML(addVig(aiAP));
            const aiHML = winProbToML(aiHP), aiAML = winProbToML(aiAP);
            const kH = kellyStake(aiHP, aiHML), kA = kellyStake(aiAP, aiAML);
            const base = parseFloat(pred.total);
            const sv = parseFloat(pred.spread.replace('+', ''));
            const homeEdge = parseFloat((aiHP - 52.4).toFixed(1));
            const rec: TeamRow['rec'] = Math.abs(homeEdge) < 1 ? 'PUSH' : homeEdge > 0 ? 'HOME' : 'AWAY';
            return {
                gameId: game.id, sport: game.sport, sportLabel, gameDate,
                homeTrend: buildTeamTrend(aiHP, `home-${game.id}-${gameDate}`),
                awayTrend: buildTeamTrend(aiAP, `away-${game.id}-${gameDate}`),
                homeTeam: { name: game.homeTeam.displayName, abbr: game.homeTeam.abbreviation, logo: game.homeTeam.logo, record: game.homeTeam.record, color: game.homeTeam.color },
                awayTeam: { name: game.awayTeam.displayName, abbr: game.awayTeam.abbreviation, logo: game.awayTeam.logo, record: game.awayTeam.record, color: game.awayTeam.color },
                homePoints: parseFloat(((base - sv) / 2).toFixed(1)),
                awayPoints: parseFloat(((base + sv) / 2).toFixed(1)),
                homeSpread: pred.spread,
                awaySpread: sv >= 0 ? `-${Math.abs(sv).toFixed(1)}` : `+${Math.abs(sv).toFixed(1)}`,
                homeEdge, awayEdge: -homeEdge,
                total: pred.total,
                homeWinProb: aiHP, awayWinProb: aiAP,
                kellyHome: kH, kellyAway: kA,
                aiMLHome: aiHML, aiMLAway: aiAML,
                vegasMLHome: vegasHP, vegasMLAway: vegasAP,
                status: game.statusDetail,
                rec, conf: pred.confidence,
            };
        });

        // ── Player Rows: ESPN game leaders + top 6 roster players ──
        const pRows: PlayerRow[] = [];

        const fetchedRosters = new Map<string, ESPNRosterPlayer[]>();
        const rosterPromises: Promise<void>[] = [];
        for (const { game, sportKey } of allGames) {
            if (!fetchedRosters.has(game.homeTeam.id)) {
                fetchedRosters.set(game.homeTeam.id, []);
                rosterPromises.push(fetchESPNRoster(sportKey, game.homeTeam.id).then(r => { fetchedRosters.set(game.homeTeam.id, r); }));
            }
            if (!fetchedRosters.has(game.awayTeam.id)) {
                fetchedRosters.set(game.awayTeam.id, []);
                rosterPromises.push(fetchESPNRoster(sportKey, game.awayTeam.id).then(r => { fetchedRosters.set(game.awayTeam.id, r); }));
            }
        }
        await Promise.allSettled(rosterPromises);

        // De-duplicate leaders by name so we don't show the same player twice
        // (ESPN sometimes lists the same player under multiple stat categories)
        const seenPlayerKey = new Set<string>();

        for (const { game, sportLabel, gameDate } of allGames) {
            const teamMap: Record<string, ESPNTeamInfo> = {
                [game.homeTeam.id]: game.homeTeam,
                [game.awayTeam.id]: game.awayTeam,
            };

            const homePlayers = fetchedRosters.get(game.homeTeam.id)?.slice(0, 6) || [];
            const awayPlayers = fetchedRosters.get(game.awayTeam.id)?.slice(0, 6) || [];
            const combinedPlayers = [
                ...game.leaders,
                ...homePlayers.map(p => ({
                    name: p.displayName, shortName: p.displayName, headshot: p.headshot, teamId: game.homeTeam.id
                })),
                ...awayPlayers.map(p => ({
                    name: p.displayName, shortName: p.displayName, headshot: p.headshot, teamId: game.awayTeam.id
                }))
            ];

            for (const leader of combinedPlayers) {
                if (!leader.name || !leader.teamId) continue;
                const dedupKey = `${game.id}-${leader.teamId}-${leader.name}`;
                if (seenPlayerKey.has(dedupKey)) continue;
                seenPlayerKey.add(dedupKey);

                const t = teamMap[leader.teamId];
                if (!t) continue;

                // Grab all categories for this player to fuel realistic projections
                const playerRealStats = game.leaders.filter(l => l.name === leader.name);

                const rng = seededRng(`${leader.name}-${leader.teamId}-${gameDate}-${sportLabel}`);
                const stats = buildStats(sportLabel, rng, playerRealStats);
                const trends = buildTrends(sportLabel, `${leader.name}-${leader.teamId}-${gameDate}-${sportLabel}`, stats);
                const isTrending = rng() > 0.75;
                const topKey = Object.keys(stats).filter(k => stats[k as StatKey] > 0)[0] as StatKey;
                const trendVal = topKey && trends[topKey] ? trends[topKey].l5 : 0;
                const trendingText = trendVal > 0 ? `HOT: ${trendVal} avg / L5` : '';
                
                pRows.push({
                    id: dedupKey,
                    gameId: game.id, sport: game.sport, sportLabel, gameDate,
                    team: t.abbreviation, teamLogo: t.logo,
                    name: leader.name, shortName: leader.shortName || leader.name,
                    headshot: leader.headshot || '',
                    stats,
                    lastGame: buildLastGame(rng, gameDate, stats),
                    trends,
                    confidence: Math.round(55 + rng() * 35),
                    isTrending,
                    trendingText
                });
            }
        }

        const sportSet = new Set(tRows.map(r => r.sportLabel));
        setAvailable(PRECISION_SPORTS.filter(s => sportSet.has(s.label)).map(s => ({ key: s.label, label: s.label, icon: s.icon })));
        setTeamRows(tRows);
        setPlayerRows(pRows);
        setUpdatedAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
        setLoading(false);
    }, [todayISO]);

    useEffect(() => { load(); }, [load]);

    const filtTeams = sport === 'ALL' ? teamRows : teamRows.filter(r => r.sportLabel === sport);
    const filtPlayers = sport === 'ALL' ? playerRows : playerRows.filter(r => r.sportLabel === sport);

    // Sort players
    const sortedPlayers = [...filtPlayers].sort((a, b) => {
        if (sortBy === 'team') return a.team.localeCompare(b.team);
        const getStat = (p: PlayerRow) => {
            const s = p.sportLabel;
            if (['NBA', 'NCAAM', 'WNBA'].includes(s)) return p.stats.pts;
            if (['MLB', 'NCAAB'].includes(s)) return p.stats.rbi;
            if (['NFL', 'NCAAF'].includes(s)) return p.stats.yds;
            if (['NHL'].includes(s)) return p.stats.ppts;
            return p.stats.goals;
        };
        return getStat(b) - getStat(a);
    });

    // Group sorted players by sport
    const groupedPlayers = sport === 'ALL'
        ? PRECISION_SPORTS
            .map(s => ({ label: s.label, icon: s.icon, rows: sortedPlayers.filter(p => p.sportLabel === s.label) }))
            .filter(g => g.rows.length > 0)
        : [{ label: sport, icon: PRECISION_SPORTS.find(s => s.label === sport)?.icon ?? 'sports', rows: sortedPlayers }];

    // Group team rows by date
    const teamDateGroups: { dateKey: string; rows: TeamRow[] }[] = useMemo(() => {
        const map = new Map<string, TeamRow[]>();
        filtTeams.forEach(r => {
            if (!map.has(r.gameDate)) map.set(r.gameDate, []);
            map.get(r.gameDate)!.push(r);
        });
        return Array.from(map.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([dateKey, rows]) => ({ dateKey, rows }));
    }, [filtTeams]);

    // Group player rows by date
    const playerDateGroups: { dateKey: string; groups: { label: string; icon: string; rows: PlayerRow[] }[] }[] = useMemo(() => {
        const dateMap = new Map<string, PlayerRow[]>();
        sortedPlayers.forEach(p => {
            if (!dateMap.has(p.gameDate)) dateMap.set(p.gameDate, []);
            dateMap.get(p.gameDate)!.push(p);
        });
        return Array.from(dateMap.entries()).sort(([a],[b]) => a.localeCompare(b)).map(([dateKey, players]) => {
            const groups = (sport === 'ALL' ? PRECISION_SPORTS : [PRECISION_SPORTS.find(s => s.label === sport)!])
                .map(s => ({ label: s.label, icon: s.icon, rows: players.filter(p => p.sportLabel === s.label) }))
                .filter(g => g.rows.length > 0);
            return { dateKey, groups };
        }).filter(d => d.groups.length > 0);
    }, [sortedPlayers, sport]);

    const openPopup = (player: PlayerRow, e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPopup({ player, rect });
    };

    const topHotTeams: { team: { abbr: string, logo: string }, prob: number }[] = [];
    filtTeams.forEach(t => {
        if (t.homeTrend.l5W >= 75) topHotTeams.push({ team: { abbr: t.homeTeam.abbr, logo: t.homeTeam.logo }, prob: t.homeTrend.l5W });
        if (t.awayTrend.l5W >= 75) topHotTeams.push({ team: { abbr: t.awayTeam.abbr, logo: t.awayTeam.logo }, prob: t.awayTrend.l5W });
    });
    // Sort highest win prob first
    topHotTeams.sort((a, b) => b.prob - a.prob);

    const topHotPlayers: PlayerRow[] = useMemo(() => {
        // filter players who are trending, sort them by confidence and then stat leaders
        return filtPlayers.filter(p => p.isTrending).sort((a,b) => b.confidence - a.confidence);
    }, [filtPlayers]);

    return (
        <div className="min-h-screen bg-background-dark text-text-main">

            {/* ── Header ── */}
            <div className="border-b border-border-muted bg-neutral-900/40 backdrop-blur-sm">
                <div className="max-w-[1536px] mx-auto px-4 sm:px-6 py-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="flex items-center justify-center w-7 h-7 rounded bg-primary/10 border border-primary/20">
                                    <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                                </div>
                                <h1 className="text-lg font-black uppercase tracking-[0.15em] text-text-main">Precision Hub</h1>
                                <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-accent-purple/10 text-accent-purple border border-accent-purple/20 rounded">AI Predictions</span>
                            </div>
                            <p className="text-[11px] text-text-muted font-medium">{todayDisplay}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" style={{ boxShadow: '0 0 6px rgba(163,255,0,0.7)' }} />
                                    {filtTeams.length} matchups · {filtPlayers.length} players
                                </span>
                                {updatedAt && <span className="text-[10px] text-neutral-700">Updated {updatedAt}</span>}
                            </div>
                        </div>
                        <button onClick={load} className="flex items-center gap-2 px-4 py-2 border border-border-muted bg-neutral-900 hover:border-primary/40 hover:text-primary text-text-muted rounded text-[10px] font-black uppercase tracking-widest transition-all">
                            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1536px] mx-auto px-4 sm:px-6 py-5">

                {/* ── Tabs ── */}
                <div className="flex items-center gap-0 mb-5 border-b border-border-muted">
                    {(['teams', 'players'] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${tab === t ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text-main'}`}
                        >
                            <span className="material-symbols-outlined text-sm">{t === 'teams' ? 'emoji_events' : 'person'}</span>
                            {t === 'teams' ? 'Teams' : 'Players'}
                        </button>
                    ))}
                    {tab === 'players' && (
                        <div className="ml-auto flex items-center gap-2 pb-2">
                            <span className="text-[8px] text-text-muted font-bold uppercase tracking-widest">Sort:</span>
                            <button onClick={() => setSortBy('points')} className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded border transition-all ${sortBy === 'points' ? 'bg-primary/10 text-primary border-primary/40' : 'border-border-muted text-text-muted hover:text-text-main'}`}>
                                <span className="material-symbols-outlined text-[11px] mr-1">arrow_downward</span>
                                Points
                            </button>
                            <button onClick={() => setSortBy('team')} className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded border transition-all ${sortBy === 'team' ? 'bg-primary/10 text-primary border-primary/40' : 'border-border-muted text-text-muted hover:text-text-main'}`}>
                                <span className="material-symbols-outlined text-[11px] mr-1">group</span>
                                Team
                            </button>
                        </div>
                    )}
                    {tab === 'teams' && (
                        <div className="ml-auto flex items-center gap-3 pb-2 text-[9px] text-text-muted font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />AI ML</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-600" />Vegas</span>
                            <span className="text-accent-purple">Kelly%</span>
                        </div>
                    )}
                </div>

                {/* ── Sport Filter Chips ── */}
                {/* Mobile: 5-per-row equal grid — Desktop: flex-wrap */}
                <div className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 mb-5">
                    <button onClick={() => setSport('ALL')} className={`sport-chip justify-center text-center !text-[9px] sm:!text-[10px] ${sport === 'ALL' ? 'active' : ''}`}>All</button>
                    {available.map(s => (
                        <button key={s.key} onClick={() => setSport(s.key)} className={`sport-chip flex items-center justify-center gap-1 !text-[9px] sm:!text-[10px] ${sport === s.key ? 'active' : ''}`}>
                            <span className="material-symbols-outlined text-[10px] sm:text-[12px]">{s.icon}</span>
                            <span className="truncate">{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* ══ TEAMS ══ */}
                {tab === 'teams' && (
                    <div className="flex flex-col gap-6">
                        {!loading && topHotTeams.length > 0 && <HotStreakTeamCarousel teams={topHotTeams} />}
                        {loading
                            ? <div className="terminal-panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><tbody>{Array.from({ length: 6 }).map((_, i) => <SkelRow key={i} cols={13} />)}</tbody></table></div></div>
                            : teamDateGroups.length === 0
                                ? <div className="terminal-panel py-20 text-center"><span className="material-symbols-outlined text-4xl text-neutral-700 block mb-3">sports_score</span><p className="text-text-muted text-sm font-bold">No games found.</p></div>
                                : teamDateGroups.map(({ dateKey, rows: dateRows }) => {
                                    const isCollapsed = collapsedDates.has(dateKey);
                                    const label = formatDateLabel(dateKey);
                                    const fullDate = (() => { const [y,m,d] = dateKey.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); })();
                                    return (
                                        <div key={dateKey}>
                                            <button onClick={() => toggleDateCollapse(dateKey)} className="w-full flex items-center gap-3 mb-3 group">
                                                <div className="flex items-center gap-2.5 flex-1">
                                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">{label}</span>
                                                    <span className="text-[10px] text-neutral-600 font-medium">{fullDate}</span>
                                                    <span className="text-[9px] font-black text-neutral-500 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">{dateRows.length} games</span>
                                                </div>
                                                <span className={`material-symbols-outlined text-neutral-500 group-hover:text-primary transition-all text-[18px] ${isCollapsed ? 'rotate-180' : ''}`}>expand_less</span>
                                            </button>
                                            <div className="h-px bg-neutral-800 mb-3" />
                                            {!isCollapsed && (
                                                <div className="terminal-panel overflow-hidden">
                                                    <div className="overflow-x-auto custom-scrollbar">
                                                        <table className="w-full min-w-[900px]">
                                                            <thead>
                                                                <tr className="border-b border-border-muted bg-neutral-900/80">
                                                                    {['#','Teams','Proj Pts','Spread','Edge','Total','AI ML / Vegas','Kelly%','Win Prob','L5','L10','L20','Pick'].map((h,i) => (
                                                                        <th key={i} className={`px-3 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted ${i===0?'w-12 text-center':i>=6&&i<=8?'text-center':i===1?'text-left':'text-center'}`}>{h}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {dateRows.map((row, idx) => (
                                                                    <React.Fragment key={row.gameId}>
                                                                        <tr className="stat-grid-row border-b border-border-muted/50">
                                                                            <td className="px-3 py-3 text-center" rowSpan={2}><div className="flex flex-col items-center gap-0.5"><span className="text-[10px] font-black text-text-muted">{idx+1}</span><span className="text-[7px] text-neutral-700 font-bold uppercase">{row.sportLabel}</span></div></td>
                                                                            <td className="px-3 py-3"><div className="flex items-center gap-2"><img src={row.awayTeam.logo} alt={row.awayTeam.abbr} className="h-6 w-6 object-contain rounded" onError={e=>{e.currentTarget.style.opacity='0'}} /><div><p className="text-xs font-black text-text-main">{row.awayTeam.abbr}</p>{row.awayTeam.record&&<p className="text-[8px] text-text-muted">{row.awayTeam.record}</p>}</div><span className="text-[8px] text-text-muted opacity-50">@</span></div></td>
                                                                            <td className="px-3 py-3 text-center text-xs font-black text-text-main tabular-nums">{row.awayPoints}</td>
                                                                            <td className="px-3 py-3 text-center text-xs font-bold text-text-muted tabular-nums">{row.awaySpread}</td>
                                                                            <td className="px-3 py-3 text-center"><EdgePill v={row.awayEdge} /></td>
                                                                            <td className="px-3 py-3 text-center" rowSpan={2}><div className="flex flex-col items-center"><span className="text-sm font-black text-text-main tabular-nums">{row.total}</span><span className="text-[7px] text-text-muted font-bold uppercase">O/U</span></div></td>
                                                                            <td className="px-3 py-3 text-center"><OddsCompare ai={row.aiMLAway} vegas={row.vegasMLAway} /></td>
                                                                            <td className="px-3 py-3 text-center"><KellyBadge pct={row.kellyAway} /></td>
                                                                            <td className="px-3 py-3 text-center" rowSpan={2}><WinGauge prob={row.homeWinProb>=row.awayWinProb?row.homeWinProb:row.awayWinProb} abbr={row.homeWinProb>=row.awayWinProb?row.homeTeam.abbr:row.awayTeam.abbr} /></td>
                                                                            <td className="px-3 py-3 text-center" rowSpan={2}>
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    <WinPctBadge label="L5" pct={row.homeTrend.l5W} />
                                                                                    <span className="text-[7px] text-neutral-700">HM</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-3 py-3 text-center" rowSpan={2}>
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    <WinPctBadge label="L10" pct={row.homeTrend.l10W} />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-3 py-3 text-center" rowSpan={2}>
                                                                                <div className="flex flex-col items-center gap-1">
                                                                                    <WinPctBadge label="L20" pct={row.homeTrend.l20W} />
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-3 py-3 text-center" rowSpan={2}><RecBadge rec={row.rec} conf={row.conf} /></td>
                                                                        </tr>
                                                                        <tr className="border-b border-border-muted">
                                                                            <td className="px-3 py-3"><div className="flex items-center gap-2"><img src={row.homeTeam.logo} alt={row.homeTeam.abbr} className="h-6 w-6 object-contain rounded" onError={e=>{e.currentTarget.style.opacity='0'}} /><div><p className="text-xs font-black text-text-muted">{row.homeTeam.abbr}</p>{row.homeTeam.record&&<p className="text-[8px] text-text-muted">{row.homeTeam.record}</p>}</div><span className="text-[7px] text-primary/30 font-bold uppercase">HM</span></div></td>
                                                                            <td className="px-3 py-3 text-center text-xs font-black text-text-muted tabular-nums">{row.homePoints}</td>
                                                                            <td className="px-3 py-3 text-center text-xs font-bold text-text-muted tabular-nums">{row.homeSpread}</td>
                                                                            <td className="px-3 py-3 text-center"><EdgePill v={row.homeEdge} /></td>
                                                                            <td className="px-3 py-3 text-center"><OddsCompare ai={row.aiMLHome} vegas={row.vegasMLHome} /></td>
                                                                            <td className="px-3 py-3 text-center"><KellyBadge pct={row.kellyHome} /></td>
                                                                        </tr>
                                                                    </React.Fragment>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="px-4 py-2.5 border-t border-border-muted flex flex-wrap items-center gap-4 text-[8px] text-text-muted font-bold uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-xs text-primary">smart_toy</span>AI ML = PickLabs no-vig line</span>
                                                        <span className="text-neutral-700">·</span><span>Vegas = FanDuel/DraftKings est. (4.5% vig)</span>
                                                        <span className="text-neutral-700">·</span><span className="text-accent-purple">Kelly% = recommended stake per unit</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        }
                    </div>
                )}

                {/* ══ PLAYERS ══ */}
                {tab === 'players' && (
                    <div className="flex flex-col gap-6">
                        {!loading && topHotPlayers.length > 0 && <HotStreakPlayerCarousel players={topHotPlayers} />}
                        {loading
                            ? <div className="terminal-panel overflow-hidden"><table className="w-full"><tbody>{Array.from({ length: 8 }).map((_, i) => <SkelRow key={i} />)}</tbody></table></div>
                            : playerDateGroups.length === 0
                                ? <div className="terminal-panel py-20 text-center"><span className="material-symbols-outlined text-4xl text-neutral-700 block mb-3">person_off</span><p className="text-text-muted text-sm font-bold">No player data available.</p></div>
                                : playerDateGroups.map(({ dateKey, groups }) => {
                                    const isCollapsedP = collapsedDates.has(dateKey);
                                    const labelP = formatDateLabel(dateKey);
                                    const fullDateP = (() => { const [y,m,d] = dateKey.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); })();
                                    const totalPlayers = groups.reduce((s, g) => s + g.rows.length, 0);
                                    return (
                                        <div key={dateKey}>
                                            <button onClick={() => toggleDateCollapse(dateKey)} className="w-full flex items-center gap-3 mb-3 group">
                                                <div className="flex items-center gap-2.5 flex-1">
                                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">{labelP}</span>
                                                    <span className="text-[10px] text-neutral-600 font-medium">{fullDateP}</span>
                                                    <span className="text-[9px] font-black text-neutral-500 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">{totalPlayers} players</span>
                                                </div>
                                                <span className={`material-symbols-outlined text-neutral-500 group-hover:text-primary transition-all text-[18px] ${isCollapsedP ? 'rotate-180' : ''}`}>expand_less</span>
                                            </button>
                                            <div className="h-px bg-neutral-800 mb-3" />
                                            {!isCollapsedP && (
                                                <div className="flex flex-col gap-5">
                                                    {groups.map(group => {
                                                        const gCols = getColsForSport(group.label);
                                                        return (
                                                            <div key={group.label} className="terminal-panel overflow-hidden">
                                                                <div className="px-4 py-2.5 border-b border-border-muted flex items-center gap-2 bg-neutral-900/60">
                                                                    <span className="material-symbols-outlined text-primary text-sm">{group.icon}</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-text-main">{group.label}</span>
                                                                    <span className="text-[8px] text-text-muted font-bold ml-1">· {group.rows.length} players · click name for last game</span>
                                                                    <div className="ml-auto flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest">
                                                                        <span className="text-emerald-400">▲ = over baseline</span>
                                                                        <span className="text-red-400">▼ = under baseline</span>
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-x-auto custom-scrollbar">
                                                                    <table className="w-full min-w-[600px]">
                                                                        <thead>
                                                                            <tr className="border-b border-border-muted bg-neutral-900/40">
                                                                                <th className="px-4 py-2.5 text-left text-[8px] font-black uppercase tracking-widest text-text-muted">Team</th>
                                                                                <th className="px-4 py-2.5 text-left text-[8px] font-black uppercase tracking-widest text-text-muted">Player</th>
                                                                                {gCols.map(c => (<th key={c.key} className="px-2 py-2.5 text-center text-[8px] font-black uppercase tracking-widest text-text-muted">{c.label}</th>))}
                                                                                <th className="px-3 py-2.5 text-center text-[8px] font-black uppercase tracking-widest text-accent-purple">CONF</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {group.rows.map((row) => {
                                                                                const topKey = gCols[0]?.key;
                                                                                const maxTop = topKey ? Math.max(...group.rows.map(p => p.stats[topKey] ?? 0)) : 0;
                                                                                return (
                                                                                    <tr key={row.id} className="stat-grid-row border-b border-border-muted/50">
                                                                                        <td className="px-4 py-3"><div className="flex items-center gap-1.5"><img src={row.teamLogo} alt={row.team} className="h-7 w-7 object-contain" onError={e=>{e.currentTarget.style.opacity='0'}} /><span className="text-[10px] font-black text-text-muted">{row.team}</span></div></td>
                                                                                        <td className="px-4 py-3 min-w-[150px]">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className="relative shrink-0">
                                                                                                    <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-800">
                                                                                                        {row.headshot?<img src={row.headshot} alt={row.shortName} className="h-full w-full object-cover" onError={e=>{e.currentTarget.style.display='none'}} />:<span className="material-symbols-outlined text-neutral-600 text-sm flex items-center justify-center h-full w-full">person</span>}
                                                                                                    </div>
                                                                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full p-[2px] z-10 flex items-center justify-center shadow-sm border border-neutral-800/80">
                                                                                                        <img src={row.teamLogo} alt={row.team} className="w-full h-full object-contain drop-shadow-md" onError={e=>{e.currentTarget.style.opacity='0'}} />
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex flex-col gap-0.5 mt-0.5">
                                                                                                    <button onClick={(e)=>openPopup(row,e)} className="text-xs font-black text-text-main hover:text-primary transition-colors text-left leading-none underline-offset-2 hover:underline">{row.shortName}</button>
                                                                                                    {row.isTrending && row.trendingText && <span className="text-[7.5px] font-black text-orange-400 bg-orange-500/10 px-1 py-0.5 rounded flex items-center gap-0.5 w-fit"><span className="material-symbols-outlined text-[9px] animate-pulse">local_fire_department</span>{row.trendingText}</span>}
                                                                                                </div>
                                                                                            </div>
                                                                                        </td>
                                                                                        {gCols.map(c=>(<SC key={c.key} v={row.stats[c.key]??0} baseline={c.baseline} hi={topKey===c.key&&(row.stats[c.key]??0)===maxTop} fmt={c.key==='avg'||c.key==='svpct'?c.key:undefined} inverted={c.key==='era'} />))}
                                                                                        <td className="px-3 py-3 text-center"><span className={`text-[10px] font-black ${row.confidence>=80?'text-primary':row.confidence>=65?'text-accent-blue':'text-text-muted'}`}>{row.confidence}%</span></td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                        }
                        {!loading && (
                            <p className="text-[8px] text-text-muted text-center font-bold uppercase tracking-widest pb-4">
                                AI projected stats seeded daily · Green = above baseline · Red = below baseline · Click player name for last game
                            </p>
                        )}
                    </div>
                )}

            </div>{/* end max-w content wrapper */}

            {/* ── Player Popup (portal-style fixed) ── */}
            {popup && (
                <LastGamePopup
                    player={popup.player}
                    anchorRect={popup.rect}
                    onClose={() => setPopup(null)}
                />
            )}
        </div>
    );
};
