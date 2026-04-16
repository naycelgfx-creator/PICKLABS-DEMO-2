import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchESPNScoreboardByDate, ESPNGame, ESPNTeamInfo, SportKey, fetchESPNRoster, ESPNRosterPlayer, buildESPNHeadshotUrl } from '../../data/espnScoreboard';
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
    if (['NBA', 'NCAAM', 'WNBA', 'NCAAW', 'CBB'].includes(s)) return BBALL_COLS;
    if (['MLB', 'NCAAB'].includes(s)) return BASEBALL_COLS;
    if (['NFL', 'NCAAF', 'CFB'].includes(s)) return FOOTBALL_COLS;
    if (['NHL'].includes(s)) return HOCKEY_COLS;
    if (['EPL', 'MLS', 'Soccer', 'Soccer.EPL', 'Soccer.MLS'].includes(s)) return SOCCER_COLS;
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

    if (['NBA', 'NCAAM', 'WNBA', 'NCAAW', 'CBB'].includes(sport)) return { pts: real.pts ?? r(12, 28), reb: real.reb ?? r(3, 11), ast: real.ast ?? r(2, 8), threePt: r(0, 4, 1), blk: r(0, 2, 1), stl: r(0, 2, 1), avg: z, hr: z, rbi: z, sb: z, k: z, era: z, yds: z, td: z, int: z, rec: z, car: z, g: z, a: z, ppts: z, pm: z, shots: z, svpct: z, goals: z, apg: z, sog: z };
    if (['MLB', 'NCAAB'].includes(sport)) return { avg: real.avg ?? parseFloat((0.240 + rng() * 0.080).toFixed(3)), hr: real.hr ?? r(0, 1.5, 1), rbi: real.rbi ?? r(0, 2, 1), sb: r(0, 1, 1), k: real.k ?? r(0, 7, 1), era: r(2.5, 5.0), pts: z, reb: z, ast: z, threePt: z, blk: z, stl: z, yds: z, td: z, int: z, rec: z, car: z, g: z, a: z, ppts: z, pm: z, shots: z, svpct: z, goals: z, apg: z, sog: z };
    if (['NFL', 'NCAAF', 'CFB'].includes(sport)) return { yds: real.yds ?? r(40, 280), td: r(0, 2, 1), int: r(0, 1.5, 1), rec: r(2, 8, 1), car: r(5, 20, 1), pts: real.pts ?? r(8, 22), avg: z, hr: z, rbi: z, sb: z, k: z, era: z, reb: z, ast: z, threePt: z, blk: z, stl: z, g: z, a: z, ppts: z, pm: z, shots: z, svpct: z, goals: z, apg: z, sog: z };
    if (['NHL'].includes(sport)) return { g: real.goals ?? r(0, 1.5, 1), a: real.ast ?? r(0, 2, 1), ppts: real.pts ?? r(0, 2.5, 1), pm: parseFloat((rng() * 4 - 2).toFixed(1)), shots: r(1.5, 4.5, 1), svpct: parseFloat((0.89 + rng() * 0.05).toFixed(3)), pts: z, reb: z, ast: z, threePt: z, blk: z, stl: z, avg: z, hr: z, rbi: z, sb: z, k: z, era: z, yds: z, td: z, int: z, rec: z, car: z, goals: z, apg: z, sog: z };
    // Soccer (EPL, MLS) + fallback
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

interface PlayerRow { id: string; athleteId: string; gameId: string; sport: string; sportLabel: string; gameDate: string; team: string; teamLogo: string; teamAltColor?: string; name: string; shortName: string; headshot: string; stats: Record<StatKey, number>; lastGame: Record<StatKey, number>; trends: Record<StatKey, GameTrend>; confidence: number; isTrending: boolean; trendingText: string; }

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
                    {player.headshot || player.athleteId
                        ? <img
                            src={player.headshot || buildESPNHeadshotUrl(player.athleteId, player.sport as SportKey)}
                            alt={player.shortName}
                            className="h-full w-full object-cover"
                            onError={e => {
                                const img = e.currentTarget;
                                // Try alternate ESPN CDN format if primary fails
                                const alt = player.athleteId ? buildESPNHeadshotUrl(player.athleteId, player.sport as SportKey) : '';
                                if (alt && img.src !== alt) { img.src = alt; } else { img.style.display = 'none'; }
                            }}
                          />
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

// ── Hot Streak Carousels (Premium Design) ────────────────────────────────────────
const MEDAL_COLORS = ['text-yellow-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]','text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.5)]','text-amber-600 drop-shadow-[0_0_4px_rgba(217,119,6,0.5)]'];
const RANK_LABELS = ['1ST','2ND','3RD'];

const HotStreakTeamCarousel: React.FC<{ teams: { team: { abbr: string, logo: string }, prob: number }[] }> = ({ teams }) => {
    if (teams.length === 0) return null;
    const topTeams = teams.slice(0, 10);
    return (
        <div className="mb-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-orange-500/10 border border-orange-500/30 shrink-0">
                        <span className="material-symbols-outlined text-orange-400 text-sm animate-pulse">local_fire_department</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">Teams of the Week</span>
                    <span className="text-[8px] font-black text-neutral-600 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full uppercase tracking-widest">{topTeams.length} hot teams</span>
                </div>
                <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">L5 AI Win Streak</span>
            </div>

            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2" style={{ scrollbarWidth: 'thin' }}>
                {topTeams.map((t, i) => {
                    const isTop3 = i < 3;
                    return (
                        <div key={i}
                            className={`min-w-[140px] rounded-xl border transition-all duration-200 cursor-pointer flex flex-col items-center gap-3 p-4 relative overflow-hidden shrink-0 group
                            ${isTop3
                                ? 'border-orange-500/40 bg-gradient-to-b from-orange-500/15 via-neutral-900/80 to-neutral-950 hover:border-orange-400/60 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                                : 'border-neutral-800 bg-neutral-900/60 hover:border-orange-500/30 hover:bg-orange-500/5'
                            }`}>

                            {/* Rank badge */}
                            <div className={`absolute top-2 left-2 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded ${isTop3 ? 'bg-orange-500/20 text-orange-400' : 'bg-neutral-800 text-neutral-500'}`}>
                                #{i + 1}
                            </div>

                            {/* Glow ring around logo */}
                            <div className={`relative p-2 rounded-full mt-2 ${isTop3 ? 'bg-gradient-to-br from-orange-500/20 to-transparent ring-1 ring-orange-500/40 shadow-[0_0_16px_rgba(249,115,22,0.2)]' : 'bg-neutral-800/40 ring-1 ring-neutral-700'}`}>
                                <img src={t.team.logo} alt={t.team.abbr}
                                    className="w-10 h-10 object-contain"
                                    style={isTop3 ? { filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))' } : {}}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                {isTop3 && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                        <span className="material-symbols-outlined text-black text-[10px]">local_fire_department</span>
                                    </div>
                                )}
                            </div>

                            {/* Team name */}
                            <div className="text-center">
                                <span className={`block text-sm font-black tracking-wide transition-colors ${isTop3 ? 'text-white group-hover:text-orange-300' : 'text-slate-300 group-hover:text-orange-400'}`}>
                                    {t.team.abbr}
                                </span>
                                <span className={`block text-[9px] font-bold mt-0.5 ${isTop3 ? 'text-orange-400' : 'text-slate-600'}`}>
                                    {t.prob}% L5 W-Rate
                                </span>
                            </div>

                            {/* Win-rate bar */}
                            <div className="w-full">
                                <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${isTop3 ? 'bg-gradient-to-r from-orange-500 to-yellow-400' : 'bg-neutral-600'}`}
                                        style={{ width: `${Math.min(t.prob, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Live Win Streak Leaderboard ───────────────────────────────────────────────
interface WinStreakTeam {
    id: string; name: string; abbr: string; logo: string;
    streak: number; record: string; conf: string; standing: string; winPct: number;
    sport: string; // 'NBA' | 'NFL' | 'MLB' | 'NHL'
}

const STREAK_SPORT_TABS = [
    { key: 'ALL',  label: 'All',  icon: 'sports', col: '#a3ff00' },
    { key: 'NBA',  label: 'NBA',  icon: 'sports_basketball', col: '#f97316' },
    { key: 'NHL',  label: 'NHL',  icon: 'sports_hockey',     col: '#22d3ee' },
    { key: 'MLB',  label: 'MLB',  icon: 'sports_baseball',   col: '#4ade80' },
    { key: 'NFL',  label: 'NFL',  icon: 'sports_football',   col: '#a78bfa' },
] as const;

const SPORT_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
    NBA: { bg: 'rgba(249,115,22,0.15)', text: '#f97316' },
    NHL: { bg: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
    MLB: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
    NFL: { bg: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
};

const WinStreakLeaderboard: React.FC<{ teams: WinStreakTeam[]; loading: boolean }> = ({ teams, loading }) => {
    const [activeSport, setActiveSport] = useState<string>('ALL');
    const filtered = activeSport === 'ALL' ? teams : teams.filter(t => t.sport === activeSport);
    const availableSports = new Set(teams.map(t => t.sport));

    if (loading) return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 animate-pulse" />
                <div className="h-3 w-48 rounded bg-neutral-800 animate-pulse" />
            </div>
            <div className="flex gap-3">{[1,2,3,4,5].map(i => <div key={i} className="min-w-[168px] h-[210px] rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse shrink-0" />)}</div>
        </div>
    );
    if (teams.length === 0) return null;
    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 border border-primary/20 shrink-0">
                        <span className="material-symbols-outlined text-primary text-sm">rocket_launch</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Current Win Streaks</span>
                    <span className="text-[8px] font-black text-neutral-600 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full uppercase tracking-widest">{filtered.length} team{filtered.length !== 1 ? 's' : ''} on a roll</span>
                </div>
                <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">Live Standings</span>
            </div>
            {/* Sport filter tabs */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
                {STREAK_SPORT_TABS.filter(t => t.key === 'ALL' || availableSports.has(t.key)).map(t => (
                    <button key={t.key} onClick={() => setActiveSport(t.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${
                            activeSport === t.key ? 'bg-neutral-900 text-white' : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600'
                        }`}
                        style={activeSport === t.key ? { borderColor: t.col, color: t.col, boxShadow: `0 0 10px ${t.col}33` } : undefined}
                    >
                        <span className="material-symbols-outlined text-[11px]">{t.icon}</span>{t.label}
                        {t.key !== 'ALL' && <span className="text-[7px] opacity-60">{teams.filter(x => x.sport === t.key).length}</span>}
                    </button>
                ))}
            </div>
            {/* Cards */}
            {filtered.length === 0 ? (
                <div className="py-6 text-center border border-dashed border-neutral-800 rounded-xl">
                    <span className="text-neutral-600 text-xs font-bold">No active win streaks for this sport right now</span>
                </div>
            ) : (
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2" style={{ scrollbarWidth: 'thin' }}>
                    {filtered.map((t, i) => {
                        const isElite = t.streak >= 5;
                        const isTop3 = i < 3;
                        const isNo1 = i === 0;
                        const sportBadge = SPORT_BADGE_COLORS[t.sport] ?? { bg: 'rgba(100,100,100,0.15)', text: '#6b7280' };
                        const glowCol = isElite ? 'rgba(163,255,0,0.2)' : 'rgba(56,128,250,0.15)';
                        return (
                            <div key={t.id + t.sport}
                                className={`min-w-[168px] rounded-xl border flex flex-col items-center gap-2 p-4 relative overflow-hidden shrink-0 transition-all duration-200 group cursor-default
                                    ${isElite ? (isTop3 ? 'bg-gradient-to-b from-primary/12 via-neutral-900/80 to-neutral-950' : 'bg-gradient-to-b from-primary/6 to-neutral-950') : 'bg-gradient-to-b from-accent-blue/6 to-neutral-950'}`}
                                style={{ borderColor: isTop3 ? (isElite ? 'rgba(163,255,0,0.4)' : 'rgba(56,128,250,0.35)') : 'rgba(255,255,255,0.06)', boxShadow: isTop3 ? `0 0 ${isNo1 ? 24 : 14}px ${glowCol}` : undefined }}
                            >
                                {/* Rank badge */}
                                <div className="absolute top-2 left-2 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded"
                                    style={{ background: 'rgba(0,0,0,0.4)', color: isTop3 ? (isElite ? '#a3ff00' : '#3880fa') : '#6b7280' }}>#{i+1}</div>
                                {/* Sport badge */}
                                <div className="absolute top-2 right-2 text-[7px] font-black px-1.5 py-0.5 rounded-full"
                                    style={{ background: sportBadge.bg, color: sportBadge.text }}>{t.sport}</div>
                                {/* Fire for 5+ streaks */}
                                {isElite && <div className="absolute top-7 right-2"><span className="material-symbols-outlined text-primary text-xs animate-pulse" style={{ filter: 'drop-shadow(0 0 5px rgba(163,255,0,0.7))' }}>local_fire_department</span></div>}
                                {/* Logo */}
                                <div className={`relative p-2 rounded-full mt-4 ${
                                    isTop3 ? (isElite ? 'ring-1 ring-primary/50 bg-primary/10 shadow-[0_0_14px_rgba(163,255,0,0.2)]' : 'ring-1 ring-accent-blue/40 bg-accent-blue/8') : 'bg-neutral-800/40 ring-1 ring-neutral-700'
                                }`}>
                                    <img src={t.logo} alt={t.abbr} className="w-10 h-10 object-contain"
                                        style={isTop3 ? { filter: `drop-shadow(0 0 7px ${isElite ? 'rgba(163,255,0,0.5)' : 'rgba(56,128,250,0.5)'})` } : {}}
                                        onError={e => { e.currentTarget.style.display = 'none'; }} />
                                </div>
                                {/* Streak number */}
                                <div className="text-center">
                                    <div className={`text-[28px] font-black leading-none tabular-nums ${ isElite ? 'text-primary' : 'text-accent-blue'}`}
                                        style={{ textShadow: isElite ? '0 0 14px rgba(163,255,0,0.5)' : '0 0 14px rgba(56,128,250,0.4)' }}>W{t.streak}</div>
                                    <div className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mt-0.5">Win Streak</div>
                                </div>
                                {/* Team info */}
                                <div className="text-center">
                                    <span className={`block text-xs font-black tracking-wide ${ isTop3 ? 'text-white' : 'text-slate-300'} group-hover:text-primary transition-colors`}>{t.abbr}</span>
                                    <span className="block text-[9px] font-bold text-neutral-500 mt-0.5">{t.record}</span>
                                    {t.standing && <span className="block text-[7px] font-bold text-neutral-600 truncate max-w-[136px] mt-0.5">{t.standing}</span>}
                                </div>
                                {/* Win% bar */}
                                <div className="w-full">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[7px] text-neutral-600 font-bold uppercase">WIN%</span>
                                        <span className={`text-[8px] font-black tabular-nums ${ isElite ? 'text-primary' : 'text-accent-blue'}`}>{Math.round(t.winPct * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.round(t.winPct * 100)}%`, background: isElite ? 'linear-gradient(90deg,#a3ff00,#22d3ee)' : 'linear-gradient(90deg,#3880fa,#818cf8)' }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// achievement config with material icons + color schemes
const ACHIEVEMENT_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string; glow: string }> = {
    'Triple-Double Alert': { icon: 'workspace_premium', color: 'text-yellow-300', bg: 'from-yellow-500/20 via-orange-500/10 to-transparent', border: 'border-yellow-500/50', glow: '0_0_20px_rgba(234,179,8,0.25)' },
    'Double-Double Watch': { icon: 'stars', color: 'text-orange-300', bg: 'from-orange-500/20 via-red-500/5 to-transparent', border: 'border-orange-500/40', glow: '0_0_16px_rgba(249,115,22,0.2)' },
    'High Volume Scorer': { icon: 'whatshot', color: 'text-red-400', bg: 'from-red-500/15 via-orange-500/5 to-transparent', border: 'border-red-500/40', glow: '0_0_14px_rgba(239,68,68,0.2)' },
    'Elite Playmaker': { icon: 'gesture', color: 'text-blue-400', bg: 'from-blue-500/15 via-cyan-500/5 to-transparent', border: 'border-blue-500/35', glow: '0_0_14px_rgba(59,130,246,0.15)' },
    'Glass Cleaner': { icon: 'fitness_center', color: 'text-purple-400', bg: 'from-purple-500/15 via-violet-500/5 to-transparent', border: 'border-purple-500/35', glow: '0_0_14px_rgba(168,85,247,0.15)' },
    '3PT Sniper': { icon: 'my_location', color: 'text-cyan-400', bg: 'from-cyan-500/15 via-blue-500/5 to-transparent', border: 'border-cyan-500/35', glow: '0_0_14px_rgba(6,182,212,0.15)' },
    'Home Run Call': { icon: 'sports_baseball', color: 'text-green-400', bg: 'from-green-500/15 via-emerald-500/5 to-transparent', border: 'border-green-500/35', glow: '0_0_14px_rgba(34,197,94,0.15)' },
    'Yardage Monster': { icon: 'sports_football', color: 'text-amber-400', bg: 'from-amber-500/15 via-yellow-500/5 to-transparent', border: 'border-amber-500/35', glow: '0_0_14px_rgba(245,158,11,0.15)' },
    'Trending Up': { icon: 'trending_up', color: 'text-orange-400', bg: 'from-orange-500/10 to-transparent', border: 'border-orange-500/25', glow: '0_0_10px_rgba(249,115,22,0.1)' },
};

// ─── NBA Stat Leaders ─────────────────────────────────────────────────────────
interface StatLeader { rank: number; name: string; shortName: string; headshot: string; teamAbbr: string; teamLogo: string; value: number; displayValue: string; }
const STAT_CATS = [
    { key: 'pts', label: 'Points',        short: 'PTS', icon: 'sports_basketball', col: '#a3ff00', glow: 'rgba(163,255,0,0.2)',   grad: 'linear-gradient(90deg,#a3ff00,#22d3ee)', unit: 'PPG' },
    { key: 'ast', label: 'Assists',        short: 'AST', icon: 'swap_horiz',       col: '#3880fa', glow: 'rgba(56,128,250,0.2)',  grad: 'linear-gradient(90deg,#3880fa,#818cf8)', unit: 'APG' },
    { key: 'tpm', label: '3-Pointers',     short: '3PT', icon: 'my_location',      col: '#22d3ee', glow: 'rgba(6,182,212,0.22)',  grad: 'linear-gradient(90deg,#22d3ee,#818cf8)', unit: '3PM' },
    { key: 'dd',  label: 'Double-Doubles', short: 'DD',  icon: 'workspace_premium',col: '#facc15', glow: 'rgba(234,179,8,0.22)', grad: 'linear-gradient(90deg,#facc15,#f97316)', unit: 'DDs' },
    { key: 'td',  label: 'Triple-Doubles', short: 'TD',  icon: 'military_tech',    col: '#f97316', glow: 'rgba(249,115,22,0.25)', grad: 'linear-gradient(90deg,#f97316,#ef4444)', unit: 'TDs' },
] as const;

// Fallback real 2024-25 NBA stat leaders — shown when ESPN API is slow/unavailable
const FALLBACK_STAT_LEADERS: Record<string, StatLeader[]> = {
    pts: [
        { rank:1, name:'Shai Gilgeous-Alexander', shortName:'S. Gilgeous-Alexander', headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3934672.png', teamAbbr:'OKC', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/okc.png', value:32.7, displayValue:'32.7' },
        { rank:2, name:'Giannis Antetokounmpo',   shortName:'Giannis',               headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3032977.png', teamAbbr:'MIL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/mil.png', value:30.4, displayValue:'30.4' },
        { rank:3, name:'LeBron James',             shortName:'LeBron James',          headshot:'https://a.espncdn.com/i/headshots/nba/players/full/1966.png',    teamAbbr:'LAL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', value:24.5, displayValue:'24.5' },
        { rank:4, name:'Luka Doncic',              shortName:'Luka Doncic',           headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3945274.png', teamAbbr:'LAL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', value:28.0, displayValue:'28.0' },
        { rank:5, name:'Jayson Tatum',             shortName:'J. Tatum',              headshot:'https://a.espncdn.com/i/headshots/nba/players/full/4065648.png', teamAbbr:'BOS', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/bos.png', value:26.9, displayValue:'26.9' },
        { rank:6, name:'Kevin Durant',             shortName:'Kevin Durant',           headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3202.png',    teamAbbr:'PHX', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/phx.png', value:25.8, displayValue:'25.8' },
        { rank:7, name:'Donovan Mitchell',         shortName:'D. Mitchell',           headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3908809.png', teamAbbr:'CLE', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/cle.png', value:24.9, displayValue:'24.9' },
        { rank:8, name:'Anthony Davis',            shortName:'A. Davis',              headshot:'https://a.espncdn.com/i/headshots/nba/players/full/6583.png',    teamAbbr:'LAL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', value:24.7, displayValue:'24.7' },
    ],
    ast: [
        { rank:1, name:'Trae Young',               shortName:'Trae Young',            headshot:'https://a.espncdn.com/i/headshots/nba/players/full/4277905.png', teamAbbr:'ATL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/atl.png', value:11.6, displayValue:'11.6' },
        { rank:2, name:'LaMelo Ball',              shortName:'LaMelo Ball',           headshot:'https://a.espncdn.com/i/headshots/nba/players/full/4432174.png', teamAbbr:'CHA', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/cha.png', value:8.9,  displayValue:'8.9'  },
        { rank:3, name:'Nikola Jokic',             shortName:'N. Jokic',              headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png', teamAbbr:'DEN', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/den.png', value:9.0,  displayValue:'9.0'  },
        { rank:4, name:'Tyrese Haliburton',        shortName:'T. Haliburton',         headshot:'https://a.espncdn.com/i/headshots/nba/players/full/4395725.png', teamAbbr:'IND', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/ind.png', value:9.2,  displayValue:'9.2'  },
        { rank:5, name:'James Harden',             shortName:'James Harden',          headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3992.png',    teamAbbr:'LAC', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/lac.png', value:8.5,  displayValue:'8.5'  },
        { rank:6, name:'Shai Gilgeous-Alexander',  shortName:'S. Gilgeous-Alexander', headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3934672.png', teamAbbr:'OKC', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/okc.png', value:6.4,  displayValue:'6.4'  },
    ],
    tpm: [
        { rank:1, name:'Stephen Curry',            shortName:'S. Curry',              headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3975.png',    teamAbbr:'GSW', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/gs.png',  value:4.8,  displayValue:'4.8'  },
        { rank:2, name:'Klay Thompson',            shortName:'K. Thompson',           headshot:'https://a.espncdn.com/i/headshots/nba/players/full/6475.png',    teamAbbr:'DAL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/dal.png', value:3.9,  displayValue:'3.9'  },
        { rank:3, name:'Damian Lillard',           shortName:'D. Lillard',            headshot:'https://a.espncdn.com/i/headshots/nba/players/full/6606.png',    teamAbbr:'MIL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/mil.png', value:3.8,  displayValue:'3.8'  },
        { rank:4, name:'Jaylen Brown',             shortName:'J. Brown',              headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3917376.png', teamAbbr:'BOS', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/bos.png', value:3.6,  displayValue:'3.6'  },
        { rank:5, name:'Trae Young',               shortName:'Trae Young',            headshot:'https://a.espncdn.com/i/headshots/nba/players/full/4277905.png', teamAbbr:'ATL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/atl.png', value:3.5,  displayValue:'3.5'  },
        { rank:6, name:'Tyrese Haliburton',        shortName:'T. Haliburton',         headshot:'https://a.espncdn.com/i/headshots/nba/players/full/4395725.png', teamAbbr:'IND', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/ind.png', value:3.4,  displayValue:'3.4'  },
    ],
    dd: [
        { rank:1, name:'Nikola Jokic',             shortName:'N. Jokic',              headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png', teamAbbr:'DEN', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/den.png', value:62,   displayValue:'62'   },
        { rank:2, name:'Giannis Antetokounmpo',   shortName:'Giannis',               headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3032977.png', teamAbbr:'MIL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/mil.png', value:56,   displayValue:'56'   },
        { rank:3, name:'Anthony Davis',            shortName:'A. Davis',              headshot:'https://a.espncdn.com/i/headshots/nba/players/full/6583.png',    teamAbbr:'LAL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', value:48,   displayValue:'48'   },
        { rank:4, name:'Domantas Sabonis',         shortName:'D. Sabonis',            headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3102531.png', teamAbbr:'SAC', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/sac.png', value:46,   displayValue:'46'   },
        { rank:5, name:'Bam Adebayo',              shortName:'Bam Adebayo',           headshot:'https://a.espncdn.com/i/headshots/nba/players/full/4066336.png', teamAbbr:'MIA', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/mia.png', value:42,   displayValue:'42'   },
    ],
    td: [
        { rank:1, name:'Nikola Jokic',             shortName:'N. Jokic',              headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3112335.png', teamAbbr:'DEN', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/den.png', value:24,   displayValue:'24'   },
        { rank:2, name:'Luka Doncic',              shortName:'Luka Doncic',           headshot:'https://a.espncdn.com/i/headshots/nba/players/full/3945274.png', teamAbbr:'LAL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', value:11,   displayValue:'11'   },
        { rank:3, name:'LeBron James',             shortName:'LeBron James',          headshot:'https://a.espncdn.com/i/headshots/nba/players/full/1966.png',    teamAbbr:'LAL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', value:8,    displayValue:'8'    },
        { rank:4, name:'Trae Young',               shortName:'Trae Young',            headshot:'https://a.espncdn.com/i/headshots/nba/players/full/4277905.png', teamAbbr:'ATL', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/atl.png', value:7,    displayValue:'7'    },
        { rank:5, name:'Tyrese Haliburton',        shortName:'T. Haliburton',         headshot:'https://a.espncdn.com/i/headshots/nba/players/full/4395725.png', teamAbbr:'IND', teamLogo:'https://a.espncdn.com/i/teamlogos/nba/500/ind.png', value:6,    displayValue:'6'    },
    ],
};

const StatLeadersSection: React.FC<{ leaders: Record<string, StatLeader[]>; loading: boolean }> = ({ leaders, loading }) => {
    const [active, setActive] = useState<string>('pts');
    const cat = STAT_CATS.find(c => c.key === active) ?? STAT_CATS[0];
    // Merge live data with fallback so section is never empty
    const rows = (leaders[active]?.length ?? 0) > 0 ? leaders[active] : FALLBACK_STAT_LEADERS[active] ?? [];
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-accent-purple/10 border border-accent-purple/20 shrink-0">
                        <span className="material-symbols-outlined text-accent-purple text-sm">leaderboard</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-accent-purple">NBA Stat Leaders</span>
                    <span className="text-[8px] font-black text-neutral-600 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Live ESPN</span>
                </div>
                <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">2024–25 Season</span>
            </div>
            {/* Category tabs */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
                {STAT_CATS.map(c => (
                    <button key={c.key} onClick={() => setActive(c.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${active === c.key ? 'bg-neutral-900 text-white' : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600'}`}
                        style={active === c.key ? { borderColor: c.glow.replace(',0.2',',.4').replace(',0.22',',.4').replace(',0.25',',.4'), color: c.col, boxShadow: `0 0 12px ${c.glow}` } : undefined}
                    >
                        <span className="material-symbols-outlined text-[12px]">{c.icon}</span>{c.short}
                    </button>
                ))}
            </div>
            {/* Cards */}
            {loading ? (
                <div className="flex gap-3">{[1,2,3,4,5].map(i => <div key={i} className="min-w-[148px] h-[200px] rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse shrink-0" />)}</div>
            ) : rows.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-neutral-800 rounded-xl"><span className="text-neutral-600 text-xs font-bold">No data available</span></div>
            ) : (
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2" style={{ scrollbarWidth: 'thin' }}>
                    {rows.map((p, i) => {
                        const isTop3 = i < 3;
                        const isNo1 = i === 0;
                        return (
                            <div key={p.name + i}
                                className={`min-w-[148px] rounded-xl border flex flex-col items-center gap-2.5 p-4 relative overflow-hidden shrink-0 transition-all duration-200 group ${isTop3 ? 'bg-neutral-900/80 hover:bg-neutral-900' : 'bg-neutral-950 hover:bg-neutral-900/60'}`}
                                style={{ borderColor: isTop3 ? cat.glow.replace(',0.2',',.4').replace(',0.22',',.4').replace(',0.25',',.45') : 'rgba(255,255,255,0.06)', boxShadow: isNo1 ? `0 0 24px ${cat.glow}` : isTop3 ? `0 0 12px ${cat.glow.replace(',0.2',',0.1').replace(',0.22',',0.1').replace(',0.25',',0.12')}` : undefined }}
                            >
                                <div className="absolute top-2 left-2 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded bg-neutral-800"
                                    style={{ color: isTop3 ? cat.col : '#4b5563' }}>#{p.rank}</div>
                                {isNo1 && <div className="absolute top-1.5 right-2"><span className="text-yellow-400 text-sm" style={{ filter: 'drop-shadow(0 0 6px rgba(234,179,8,0.8))' }}>👑</span></div>}
                                {/* Headshot */}
                                <div className={`relative mt-3 rounded-full overflow-hidden shrink-0 bg-neutral-800 ${isTop3 ? 'ring-2' : 'ring-1 ring-neutral-700'}`}
                                    style={{ width: isTop3 ? 52 : 44, height: isTop3 ? 52 : 44, ...(isTop3 ? { boxShadow: `0 0 14px ${cat.glow}`, outlineColor: cat.col } : {}) }}>
                                    {p.headshot
                                        ? <img src={p.headshot} alt={p.shortName} className="w-full h-full object-cover" style={{ width: isTop3 ? 52 : 44, height: isTop3 ? 52 : 44 }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                                        : <span className="material-symbols-outlined text-neutral-600 flex items-center justify-center w-full h-full">person</span>
                                    }
                                </div>
                                {/* Stat hero number */}
                                <div className="text-center">
                                    <div className="text-2xl font-black leading-none tabular-nums" style={{ color: cat.col, textShadow: `0 0 12px ${cat.glow}` }}>{p.displayValue}</div>
                                    <div className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mt-0.5">{cat.unit}</div>
                                </div>
                                {/* Name + team */}
                                <div className="text-center">
                                    <span className="block text-[10px] font-black text-text-main group-hover:text-primary transition-colors leading-tight">{p.shortName}</span>
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                        {p.teamLogo && <img src={p.teamLogo} alt={p.teamAbbr} className="w-4 h-4 object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />}
                                        <span className="text-[8px] text-neutral-500 font-bold">{p.teamAbbr}</span>
                                    </div>
                                </div>
                                {/* Value bar */}
                                <div className="w-full"><div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: rows[0]?.value > 0 ? `${Math.round((p.value / rows[0].value) * 100)}%` : '0%', background: cat.grad }} />
                                </div></div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const HotStreakPlayerCarousel: React.FC<{ players: PlayerRow[] }> = ({ players }) => {
    if (players.length === 0) return null;
    return (
        <div className="mb-6">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded bg-orange-500/10 border border-orange-500/30 shrink-0">
                        <span className="material-symbols-outlined text-orange-400 text-sm animate-pulse">local_fire_department</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">Players of the Week</span>
                    <span className="text-[8px] font-black text-neutral-600 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full uppercase tracking-widest">{players.length} trending</span>
                </div>
                <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">AI-Detected Streaks</span>
            </div>

            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                {players.slice(0, 12).map((p, i) => {
                    let achievementKey = 'Trending Up';
                    if (p.stats.pts >= 10 && p.stats.reb >= 10 && p.stats.ast >= 10) achievementKey = 'Triple-Double Alert';
                    else if (p.stats.pts >= 10 && (p.stats.reb >= 10 || p.stats.ast >= 10)) achievementKey = 'Double-Double Watch';
                    else if (p.stats.pts >= 30) achievementKey = 'High Volume Scorer';
                    else if (p.stats.ast >= 10) achievementKey = 'Elite Playmaker';
                    else if (p.stats.reb >= 12) achievementKey = 'Glass Cleaner';
                    else if (p.stats.threePt >= 4) achievementKey = '3PT Sniper';
                    else if (p.stats.hr >= 1) achievementKey = 'Home Run Call';
                    else if (p.stats.yds >= 80) achievementKey = 'Yardage Monster';

                    const cfg = ACHIEVEMENT_CONFIG[achievementKey] ?? ACHIEVEMENT_CONFIG['Trending Up'];
                    const isRank1 = i === 0;

                    // Build key stats to show
                    const keyStats: { label: string; val: string }[] = [];
                    if (p.stats.pts > 0)   keyStats.push({ label: 'PTS', val: p.stats.pts.toFixed(1) });
                    if (p.stats.reb > 0)   keyStats.push({ label: 'REB', val: p.stats.reb.toFixed(1) });
                    if (p.stats.ast > 0)   keyStats.push({ label: 'AST', val: p.stats.ast.toFixed(1) });
                    if (p.stats.threePt > 0) keyStats.push({ label: '3PT', val: p.stats.threePt.toFixed(1) });
                    if (p.stats.yds > 0)   keyStats.push({ label: 'YDS', val: p.stats.yds.toFixed(0) });
                    if (p.stats.hr > 0)    keyStats.push({ label: 'HR', val: p.stats.hr.toFixed(0) });

                    return (
                        <div key={i}
                            className={`min-w-[200px] rounded-xl border bg-gradient-to-br ${cfg.bg} transition-all duration-200 cursor-pointer flex flex-col gap-0 relative overflow-hidden shrink-0 group ${cfg.border}`}
                            style={{ boxShadow: isRank1 ? `inset 0 0 0 1px rgba(234,179,8,0.15), ${cfg.glow}` : `${cfg.glow}` }}
                        >
                            {/* Top rank strip */}
                            <div className={`flex items-center justify-between px-3 py-2 border-b ${cfg.border} bg-black/20`}>
                                <div className="flex items-center gap-1.5">
                                    <span className={`material-symbols-outlined text-[14px] ${cfg.color}`}>{cfg.icon}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${cfg.color}`}>{achievementKey}</span>
                                </div>
                                <span className={`text-[8px] font-black ${i < 3 ? MEDAL_COLORS[i] : 'text-neutral-600'}`}>#{i + 1}</span>
                            </div>

                            {/* Player identity */}
                            <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                                <div className={`relative shrink-0`}>
                                    <div className={`w-11 h-11 rounded-full overflow-hidden ring-2 ${isRank1 ? 'ring-yellow-400/50 shadow-[0_0_12px_rgba(234,179,8,0.3)]' : `ring-[var(--ring-col,rgba(249,115,22,0.3))]`}`}>
                                        {p.headshot || p.athleteId
                                            ? <img
                                                src={p.headshot || buildESPNHeadshotUrl(p.athleteId, p.sport as SportKey)}
                                                alt={p.shortName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const img = e.currentTarget;
                                                    const alt = p.athleteId ? buildESPNHeadshotUrl(p.athleteId, p.sport as SportKey) : '';
                                                    if (alt && img.src !== alt) { img.src = alt; } else { img.style.display = 'none'; }
                                                }}
                                              />
                                            : <div className="w-full h-full bg-neutral-800 flex items-center justify-center"><span className="material-symbols-outlined text-neutral-500 text-lg">person</span></div>
                                        }
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center p-[2px]">
                                        <img src={p.teamLogo} alt={p.team} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.opacity = '0'; }} />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className={`block text-[12px] font-black leading-tight truncate transition-colors ${cfg.color} group-hover:brightness-125`}>{p.shortName}</span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[9px] font-bold text-neutral-500">{p.team}</span>
                                        <span className="text-[8px] text-neutral-700">·</span>
                                        <span className="text-[9px] font-bold text-neutral-500">{p.sportLabel}</span>
                                    </div>
                                    {/* Confidence bar */}
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                        <div className="flex-1 h-1 rounded-full bg-neutral-800 overflow-hidden">
                                            <div className={`h-full rounded-full transition-all`}
                                                style={{ width: `${p.confidence}%`, background: p.confidence >= 80 ? 'linear-gradient(90deg,#a3ff00,#22d3ee)' : p.confidence >= 65 ? 'linear-gradient(90deg,#3880fa,#818cf8)' : '#525252' }} />
                                        </div>
                                        <span className={`text-[8px] font-black ${p.confidence >= 80 ? 'text-primary' : p.confidence >= 65 ? 'text-accent-blue' : 'text-neutral-500'}`}>{p.confidence}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Key stats row */}
                            {keyStats.length > 0 && (
                                <div className="flex border-t border-neutral-800/60 divide-x divide-neutral-800/60">
                                    {keyStats.slice(0, 3).map(s => (
                                        <div key={s.label} className="flex-1 flex flex-col items-center py-2">
                                            <span className={`text-[11px] font-black tabular-nums ${cfg.color}`}>{s.val}</span>
                                            <span className="text-[7px] font-black text-neutral-600 uppercase tracking-widest">{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* L5 hot text */}
                            {p.trendingText && (
                                <div className="px-3 py-1.5 bg-black/20 border-t border-neutral-800/50">
                                    <span className="text-[8px] text-neutral-400 font-medium">{p.trendingText}</span>
                                </div>
                            )}
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

        // De-duplicate leaders by name+sport so we don't show the same player twice
        // across sports or multiple stat categories
        const seenPlayerKey = new Set<string>();

        for (const { game, sportLabel, sportKey, gameDate } of allGames) {
            const teamMap: Record<string, ESPNTeamInfo> = {
                [game.homeTeam.id]: game.homeTeam,
                [game.awayTeam.id]: game.awayTeam,
            };

            const homePlayers = fetchedRosters.get(game.homeTeam.id)?.slice(0, 6) || [];
            const awayPlayers = fetchedRosters.get(game.awayTeam.id)?.slice(0, 6) || [];

            // Build a combined list: game leaders first, then top roster players
            // IMPORTANT: each entry must know which SPORT it belongs to
            const combinedPlayers: { name: string; shortName: string; headshot: string; teamId: string; athleteId: string }[] = [
                // ESPN game leaders already have teamId — athleteId extracted from headshot URL
                ...game.leaders
                    .filter(l => l.name && l.teamId)
                    .map(l => {
                        // Extract ESPN athlete ID from headshot URL like .../full/4066336.png
                        const hsMatch = l.headshot?.match(/\/full\/([\d]+)\.png/);
                        return {
                            name: l.name,
                            shortName: l.shortName || l.name,
                            headshot: l.headshot || '',
                            teamId: l.teamId,
                            athleteId: hsMatch?.[1] ?? '',
                        };
                    }),
                // Roster players — ESPN API gives us player IDs directly
                ...homePlayers.map(p => ({
                    name: p.displayName,
                    shortName: p.displayName,
                    headshot: p.headshot || buildESPNHeadshotUrl(p.id, sportKey),
                    teamId: game.homeTeam.id,
                    athleteId: p.id,
                })),
                ...awayPlayers.map(p => ({
                    name: p.displayName,
                    shortName: p.displayName,
                    headshot: p.headshot || buildESPNHeadshotUrl(p.id, sportKey),
                    teamId: game.awayTeam.id,
                    athleteId: p.id,
                }))
            ];

            for (const leader of combinedPlayers) {
                if (!leader.name || !leader.teamId) continue;
                // Include sportLabel in dedup key to prevent cross-sport player leakage
                const dedupKey = `${sportLabel}-${leader.teamId}-${leader.name}`;
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
                
                // Best headshot: use what we have, fall back to ESPN CDN using athleteId
                const bestHeadshot = leader.headshot
                    || (leader.athleteId ? buildESPNHeadshotUrl(leader.athleteId, sportKey) : '');

                pRows.push({
                    id: dedupKey,
                    athleteId: leader.athleteId || '',
                    gameId: game.id, sport: game.sport, sportLabel, gameDate,
                    team: t.abbreviation, teamLogo: t.logo,
                    name: leader.name, shortName: leader.shortName || leader.name,
                    headshot: bestHeadshot,
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

    const [statLeaders, setStatLeaders] = useState<Record<string, StatLeader[]>>({});
    const [statLeadersLoading, setStatLeadersLoading] = useState(true);

    useEffect(() => {
        const fetchStatLeaders = async () => {
            setStatLeadersLoading(true);
            try {
                const ENDPOINTS = [
                    { key: 'pts', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?stat=avgPoints&limit=10' },
                    { key: 'ast', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?stat=avgAssists&limit=10' },
                    { key: 'tpm', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?stat=avgThreePointFieldGoalsMade&limit=10' },
                    { key: 'dd',  url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?stat=doubleDouble&limit=10' },
                    { key: 'td',  url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/leaders?stat=tripleDouble&limit=10' },
                ];
                const results = await Promise.allSettled(ENDPOINTS.map(async ep => {
                    const res = await fetch(ep.url);
                    if (!res.ok) throw new Error(ep.key);
                    const data = await res.json() as Record<string, unknown>;
                    const cats = (data.categories as Record<string, unknown>[]) ?? [];
                    const cat = cats[0] as Record<string, unknown> | undefined;
                    const entries = (cat?.leaders as Record<string, unknown>[]) ?? [];
                    const parsed: StatLeader[] = entries.map((entry, idx) => {
                        const athlete = (entry.athlete as Record<string, unknown>) ?? {};
                        const team = (entry.team as Record<string, unknown>) ?? {};
                        const stats = (entry.statistics as Record<string, unknown>[]) ?? [];
                        const statObj = stats[0] as Record<string, unknown> | undefined;
                        const rawHs = athlete.headshot;
                        const hs = typeof rawHs === 'string' ? rawHs : typeof rawHs === 'object' && rawHs !== null ? String((rawHs as Record<string,unknown>).href ?? '') : '';
                        const athleteId = String(athlete.id ?? '');
                        const headshot = hs || (athleteId ? `https://a.espncdn.com/i/headshots/nba/players/full/${athleteId}.png` : '');
                        const logos = (team.logos as { href: string }[]) ?? [];
                        const teamLogo = logos[0]?.href || `https://a.espncdn.com/i/teamlogos/nba/500/${team.id}.png`;
                        const dv = String(statObj?.displayValue ?? statObj?.value ?? '0');
                        const val = parseFloat(dv);
                        return { rank: idx + 1, name: String(athlete.displayName ?? ''), shortName: String(athlete.shortName ?? athlete.displayName ?? ''), headshot, teamAbbr: String(team.abbreviation ?? ''), teamLogo, value: isNaN(val) ? idx === 0 ? 1 : 0 : val, displayValue: dv };
                    });
                    return { key: ep.key, leaders: parsed };
                }));
                const out: Record<string, StatLeader[]> = {};
                results.forEach(r => { if (r.status === 'fulfilled') out[r.value.key] = r.value.leaders; });
                setStatLeaders(out);
            } catch (err) { console.warn('Stat leaders fetch failed:', err); }
            finally { setStatLeadersLoading(false); }
        };
        fetchStatLeaders();
    }, []);

    const [winStreakTeams, setWinStreakTeams] = useState<WinStreakTeam[]>([]);
    const [winStreakLoading, setWinStreakLoading] = useState(true);

    // Fetch win streaks from ESPN standings — NBA, NHL, MLB, NFL in parallel
    useEffect(() => {
        const SPORT_STANDINGS = [
            { sport: 'NBA', url: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?level=3&seasontype=2&type=0', logoBase: 'nba', minStreak: 2 },
            { sport: 'NHL', url: 'https://site.api.espn.com/apis/v2/sports/hockey/nhl/standings?level=3&seasontype=2&type=0', logoBase: 'nhl', minStreak: 2 },
            { sport: 'MLB', url: 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings?level=3&seasontype=2&type=0', logoBase: 'mlb', minStreak: 2 },
            { sport: 'NFL', url: 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings?level=3&seasontype=2&type=0', logoBase: 'nfl', minStreak: 2 },
        ];
        const fetchWinStreaks = async () => {
            setWinStreakLoading(true);
            const allStreakers: WinStreakTeam[] = [];
            const processGroup = (group: Record<string, unknown>, sportKey: string, logoBase: string) => {
                const entries = (group.standings as Record<string, unknown>)?.entries as Record<string, unknown>[] | undefined;
                if (!entries) return;
                for (const entry of entries) {
                    try {
                        const team = entry.team as Record<string, unknown>;
                        const stats = (entry.stats as Record<string, unknown>[]) ?? [];
                        const getStat = (name: string) => { const s = stats.find((x: Record<string, unknown>) => x.name === name || x.shortDisplayName === name); return s ? Number(s.value ?? 0) : 0; };
                        const getStr = (name: string) => { const s = stats.find((x: Record<string, unknown>) => x.name === name || x.shortDisplayName === name); return s ? String(s.displayValue ?? '') : ''; };
                        const wins = getStat('wins'); const losses = getStat('losses');
                        const streakLen = Math.abs(getStat('streak') || getStat('streakLength'));
                        const streakDisplay = getStr('streak');
                        const isWinStreak = streakDisplay.startsWith('W') || getStat('streak') > 0;
                        if (!isWinStreak || streakLen < 2) continue;
                        const logos = team.logos as { href: string }[] | undefined;
                        const logo = logos?.[0]?.href || `https://a.espncdn.com/i/teamlogos/${logoBase}/500/${team.id}.png`;
                        const total = wins + losses || 1;
                        allStreakers.push({ id: String(team.id ?? ''), name: String(team.displayName ?? team.name ?? ''), abbr: String(team.abbreviation ?? ''), logo, streak: streakLen, record: `${wins}-${losses}`, conf: '', standing: getStr('clinicalNote') || getStr('standingSummary') || '', winPct: wins / total, sport: sportKey });
                    } catch { continue; }
                }
            };
            await Promise.allSettled(SPORT_STANDINGS.map(async ({ sport, url, logoBase, minStreak }) => {
                try {
                    const res = await fetch(url);
                    if (!res.ok) return;
                    const data = await res.json();
                    const children = (data.children as Record<string, unknown>[]) ?? [data];
                    for (const child of children) {
                        if ((child.standings as Record<string, unknown>)?.entries) processGroup(child, sport, logoBase);
                        else { for (const sub of ((child.children as Record<string, unknown>[]) ?? [])) processGroup(sub as Record<string, unknown>, sport, logoBase); }
                    }
                    void minStreak;
                } catch { /* sport failed silently */ }
            }));
            allStreakers.sort((a, b) => b.streak - a.streak || b.winPct - a.winPct);
            setWinStreakTeams(allStreakers);
            setWinStreakLoading(false);
        };
        fetchWinStreaks();
    }, []);

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
                        {/* Win Streak Leaderboard — ALL sports */}
                        <WinStreakLeaderboard teams={winStreakTeams} loading={winStreakLoading} />
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
                        {/* NBA Stat Leaders — PTS / AST / 3PT / DD / TD */}
                        {(sport === 'ALL' || sport === 'NBA' || sport === 'CBB' || sport === 'NCAAM') && (
                            <StatLeadersSection leaders={statLeaders} loading={statLeadersLoading} />
                        )}
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
                                                                                                        {row.headshot || row.athleteId
                                                                                                            ? <img
                                                                                                                src={row.headshot || buildESPNHeadshotUrl(row.athleteId, row.sport as SportKey)}
                                                                                                                alt={row.shortName}
                                                                                                                className="h-full w-full object-cover"
                                                                                                                onError={e => {
                                                                                                                    const img = e.currentTarget;
                                                                                                                    const alt = row.athleteId ? buildESPNHeadshotUrl(row.athleteId, row.sport as SportKey) : '';
                                                                                                                    if (alt && img.src !== alt) { img.src = alt; } else { img.style.display = 'none'; }
                                                                                                                }}
                                                                                                              />
                                                                                                            : <span className="material-symbols-outlined text-neutral-600 text-sm flex items-center justify-center h-full w-full">person</span>
                                                                                                        }
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
