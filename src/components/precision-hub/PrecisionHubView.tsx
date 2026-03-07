import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchESPNScoreboardByDate, ESPNGame, ESPNTeamInfo, SportKey } from '../../data/espnScoreboard';
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
const buildStats = (sport: string, rng: () => number): Record<StatKey, number> => {
    const r = (lo: number, hi: number, dp = 1) => parseFloat((lo + rng() * (hi - lo)).toFixed(dp));
    const z = 0;
    if (['NBA', 'NCAAM', 'WNBA'].includes(sport)) return { pts: r(6, 40), reb: r(1, 14), ast: r(0.5, 11), threePt: r(0, 5, 1), blk: r(0, 3, 1), stl: r(0, 2.5, 1), avg: z, hr: z, rbi: z, sb: z, k: z, era: z, yds: z, td: z, int: z, rec: z, car: z, g: z, a: z, ppts: z, pm: z, shots: z, svpct: z, goals: z, apg: z, sog: z };
    if (['MLB', 'NCAAB'].includes(sport)) return { avg: parseFloat((0.17 + rng() * 0.22).toFixed(3)), hr: r(0, 1.5, 1), rbi: r(0, 3, 1), sb: r(0, 1.2, 1), k: r(0, 4, 1), era: r(1.5, 6.5), pts: z, reb: z, ast: z, threePt: z, blk: z, stl: z, yds: z, td: z, int: z, rec: z, car: z, g: z, a: z, ppts: z, pm: z, shots: z, svpct: z, goals: z, apg: z, sog: z };
    if (['NFL', 'NCAAF'].includes(sport)) return { yds: r(10, 340), td: r(0, 3, 1), int: r(0, 2, 1), rec: r(0, 10, 1), car: r(0, 22, 1), pts: r(4, 30), avg: z, hr: z, rbi: z, sb: z, k: z, era: z, reb: z, ast: z, threePt: z, blk: z, stl: z, g: z, a: z, ppts: z, pm: z, shots: z, svpct: z, goals: z, apg: z, sog: z };
    if (['NHL'].includes(sport)) return { g: r(0, 1.5, 1), a: r(0, 2, 1), ppts: r(0, 3, 1), pm: parseFloat((rng() * 6 - 3).toFixed(1)), shots: r(0, 5.5, 1), svpct: parseFloat((0.88 + rng() * 0.1).toFixed(3)), pts: z, reb: z, ast: z, threePt: z, blk: z, stl: z, avg: z, hr: z, rbi: z, sb: z, k: z, era: z, yds: z, td: z, int: z, rec: z, car: z, goals: z, apg: z, sog: z };
    return { goals: r(0, 2, 1), apg: r(0, 1.5, 1), shots: r(0, 5, 1), sog: r(0, 3, 1), pts: r(3, 15), avg: z, hr: z, rbi: z, sb: z, k: z, era: z, reb: z, ast: z, threePt: z, blk: z, stl: z, yds: z, td: z, int: z, rec: z, car: z, g: z, a: z, ppts: z, pm: z, svpct: z };
};

// ── Build last-game stats (stable, pre-game) ──────────────────────────────────
const buildLastGame = (sport: string, rng: () => number, today: string): Record<StatKey, number> => {
    // use yesterday's seed so it's different from today's prediction
    const lgRng = seededRng(`lastgame-${today}-${rng()}`);
    return buildStats(sport, lgRng);
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface TeamRow { gameId: string; sport: string; sportLabel: string; homeTeam: { name: string; abbr: string; logo: string; record: string; color: string }; awayTeam: { name: string; abbr: string; logo: string; record: string; color: string }; homePoints: number; awayPoints: number; homeSpread: string; awaySpread: string; homeEdge: number; awayEdge: number; total: string; homeWinProb: number; awayWinProb: number; kellyHome: number; kellyAway: number; aiMLHome: string; aiMLAway: string; vegasMLHome: string; vegasMLAway: string; status: string; rec: 'HOME' | 'AWAY' | 'PUSH'; conf: number }

interface PlayerRow { id: string; gameId: string; sport: string; sportLabel: string; team: string; teamLogo: string; teamAltColor?: string; name: string; shortName: string; headshot: string; stats: Record<StatKey, number>; lastGame: Record<StatKey, number>; confidence: number }

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

// ── Player last-game popup ────────────────────────────────────────────────────
const LastGamePopup: React.FC<{ player: PlayerRow; anchorRect: DOMRect; onClose: () => void }> = ({ player, anchorRect, onClose }) => {
    const cols = getColsForSport(player.sportLabel);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
        document.addEventListener('mousedown', fn);
        return () => document.removeEventListener('mousedown', fn);
    }, [onClose]);

    const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 320);
    const left = Math.min(anchorRect.left, window.innerWidth - 360);

    return (
        <div
            ref={ref}
            className="fixed z-[9999] w-80 bg-neutral-900 border border-border-muted rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            style={{ top, left }}
        >
            {/* Popup header */}
            <div className="px-4 py-3 border-b border-border-muted flex items-center gap-3 bg-neutral-900/90">
                <div className="h-9 w-9 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                    {player.headshot
                        ? <img src={player.headshot} alt={player.shortName} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                        : <span className="material-symbols-outlined text-neutral-600 text-base flex items-center justify-center h-full w-full">person</span>
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-text-main truncate">{player.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <img src={player.teamLogo} alt={player.team} className="h-4 w-4 object-contain bg-neutral-900 rounded-full border border-neutral-800" onError={e => { e.currentTarget.style.opacity = '0' }} />
                        <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest">{player.team} · {player.sportLabel}</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
                    <span className="material-symbols-outlined text-base">close</span>
                </button>
            </div>

            {/* Comparison table */}
            <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-sm text-primary">history</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Last Game vs Today's Prediction</span>
                </div>
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border-muted">
                            <th className="pb-2 text-left text-[8px] font-black uppercase tracking-widest text-text-muted">Stat</th>
                            <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-text-muted">Last Game</th>
                            <th className="pb-2 text-center text-[8px] font-black uppercase tracking-widest text-primary">AI Prediction</th>
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
                                <tr key={col.key} className="border-b border-border-muted/40 last:border-0">
                                    <td className="py-2 text-[10px] font-black text-text-muted uppercase">{col.label}</td>
                                    <td className="py-2 text-center text-[10px] font-bold text-text-main">
                                        {col.key === 'avg' || col.key === 'svpct' ? actual.toFixed(3) : actual}
                                    </td>
                                    <td className="py-2 text-center text-[10px] font-black text-primary">
                                        {col.key === 'avg' || col.key === 'svpct' ? predicted.toFixed(3) : predicted}
                                    </td>
                                    <td className={`py-2 text-center text-[10px] font-black ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {deltaStr}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <p className="mt-3 text-[8px] text-neutral-700 font-bold uppercase tracking-widest">
                    Δ = today's projection vs last game performance
                </p>
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

    const getBettingDate = () => {
        const d = new Date();
        if (d.getHours() < 6) {
            d.setDate(d.getDate() - 1);
        }
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const todayISO = getBettingDate();
    const todayDisplay = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const load = useCallback(async () => {
        setLoading(true);
        const allGames: { game: ESPNGame; sportLabel: string; sportKey: string }[] = [];

        await Promise.allSettled(
            PRECISION_SPORTS.map(async ({ key, label }) => {
                try {
                    const games = await fetchESPNScoreboardByDate(key, todayISO);
                    games.forEach(g => allGames.push({ game: g, sportLabel: label, sportKey: key }));
                } catch { /* skip */ }
            })
        );

        // ── Team Rows ──
        const tRows: TeamRow[] = allGames.map(({ game, sportLabel }) => {
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
                gameId: game.id, sport: game.sport, sportLabel,
                homeTeam: { name: game.homeTeam.displayName, abbr: game.homeTeam.abbreviation, logo: game.homeTeam.logo, record: game.homeTeam.record, color: game.homeTeam.color },
                awayTeam: { name: game.awayTeam.displayName, abbr: game.awayTeam.abbreviation, logo: game.awayTeam.logo, record: game.awayTeam.record, color: game.awayTeam.color },
                homePoints: parseFloat((base * (aiHP / 100)).toFixed(1)),
                awayPoints: parseFloat((base * (aiAP / 100)).toFixed(1)),
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

        // ── Player Rows: ESPN game leaders only (correct names + headshots guaranteed) ──
        const pRows: PlayerRow[] = [];

        // De-duplicate leaders by name so we don't show the same player twice
        // (ESPN sometimes lists the same player under multiple stat categories)
        const seenPlayerKey = new Set<string>();

        for (const { game, sportLabel } of allGames) {
            const teamMap: Record<string, ESPNTeamInfo> = {
                [game.homeTeam.id]: game.homeTeam,
                [game.awayTeam.id]: game.awayTeam,
            };

            for (const leader of game.leaders) {
                if (!leader.name || !leader.teamId) continue;
                const dedupKey = `${game.id}-${leader.teamId}-${leader.name}`;
                if (seenPlayerKey.has(dedupKey)) continue;
                seenPlayerKey.add(dedupKey);

                const t = teamMap[leader.teamId];
                if (!t) continue;

                const rng = seededRng(`${leader.name}-${leader.teamId}-${todayISO}-${sportLabel}`);
                pRows.push({
                    id: dedupKey,
                    gameId: game.id, sport: game.sport, sportLabel,
                    team: t.abbreviation, teamLogo: t.logo,
                    name: leader.name, shortName: leader.shortName || leader.name,
                    headshot: leader.headshot || '',
                    stats: buildStats(sportLabel, rng),
                    lastGame: buildLastGame(sportLabel, rng, todayISO),
                    confidence: Math.round(55 + rng() * 35),
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

    const openPopup = (player: PlayerRow, e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPopup({ player, rect });
    };

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
                    <div className="terminal-panel overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-border-muted bg-neutral-900/80">
                                        {['#', 'Teams', 'Proj Pts', 'Spread', 'Edge', 'Total', 'AI ML / Vegas', 'Kelly%', 'Win Prob', 'Pick'].map((h, i) => (
                                            <th key={i} className={`px-3 py-3 text-[8px] font-black uppercase tracking-widest text-text-muted ${i === 0 ? 'w-12 text-center' : i >= 6 && i <= 8 ? 'text-center' : i === 1 ? 'text-left' : 'text-center'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading
                                        ? Array.from({ length: 6 }).map((_, i) => <SkelRow key={i} cols={10} />)
                                        : filtTeams.length === 0
                                            ? <tr><td colSpan={10} className="py-20 text-center"><span className="material-symbols-outlined text-4xl text-neutral-700 block mb-3">sports_score</span><p className="text-text-muted text-sm font-bold">No games today for this sport.</p></td></tr>
                                            : filtTeams.map((row, idx) => (
                                                <React.Fragment key={row.gameId}>
                                                    {/* Away */}
                                                    <tr className="stat-grid-row border-b border-border-muted/50">
                                                        <td className="px-3 py-3 text-center" rowSpan={2}>
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <span className="text-[10px] font-black text-text-muted">{idx + 1}</span>
                                                                <span className="text-[7px] text-neutral-700 font-bold uppercase">{row.sportLabel}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <img src={row.awayTeam.logo} alt={row.awayTeam.abbr} className="h-6 w-6 object-contain rounded" onError={e => { e.currentTarget.style.opacity = '0' }} />
                                                                <div>
                                                                    <p className="text-xs font-black text-text-main">{row.awayTeam.abbr}</p>
                                                                    {row.awayTeam.record && <p className="text-[8px] text-text-muted">{row.awayTeam.record}</p>}
                                                                </div>
                                                                <span className="text-[8px] text-text-muted opacity-50">@</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-center text-xs font-black text-text-main tabular-nums">{row.awayPoints}</td>
                                                        <td className="px-3 py-3 text-center text-xs font-bold text-text-muted tabular-nums">{row.awaySpread}</td>
                                                        <td className="px-3 py-3 text-center"><EdgePill v={row.awayEdge} /></td>
                                                        <td className="px-3 py-3 text-center" rowSpan={2}>
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-sm font-black text-text-main tabular-nums">{row.total}</span>
                                                                <span className="text-[7px] text-text-muted font-bold uppercase">O/U</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-center"><OddsCompare ai={row.aiMLAway} vegas={row.vegasMLAway} /></td>
                                                        <td className="px-3 py-3 text-center"><KellyBadge pct={row.kellyAway} /></td>
                                                        <td className="px-3 py-3 text-center" rowSpan={2}><WinGauge prob={row.homeWinProb >= row.awayWinProb ? row.homeWinProb : row.awayWinProb} abbr={row.homeWinProb >= row.awayWinProb ? row.homeTeam.abbr : row.awayTeam.abbr} /></td>
                                                        <td className="px-3 py-3 text-center" rowSpan={2}><RecBadge rec={row.rec} conf={row.conf} /></td>
                                                    </tr>
                                                    {/* Home */}
                                                    <tr className="border-b border-border-muted">
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <img src={row.homeTeam.logo} alt={row.homeTeam.abbr} className="h-6 w-6 object-contain rounded" onError={e => { e.currentTarget.style.opacity = '0' }} />
                                                                <div>
                                                                    <p className="text-xs font-black text-text-muted">{row.homeTeam.abbr}</p>
                                                                    {row.homeTeam.record && <p className="text-[8px] text-text-muted">{row.homeTeam.record}</p>}
                                                                </div>
                                                                <span className="text-[7px] text-primary/30 font-bold uppercase">HM</span>
                                                            </div>
                                                        </td>
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
                        {!loading && filtTeams.length > 0 && (
                            <div className="px-4 py-2.5 border-t border-border-muted flex flex-wrap items-center gap-4 text-[8px] text-text-muted font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-xs text-primary">smart_toy</span>AI ML = PickLabs no-vig line</span>
                                <span className="text-neutral-700">·</span>
                                <span>Vegas = FanDuel/DraftKings est. (4.5% vig)</span>
                                <span className="text-neutral-700">·</span>
                                <span className="text-accent-purple">Kelly% = recommended stake per unit</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ══ PLAYERS ══ */}
                {tab === 'players' && (
                    <div className="flex flex-col gap-5">
                        {loading
                            ? <div className="terminal-panel overflow-hidden"><table className="w-full"><tbody>{Array.from({ length: 8 }).map((_, i) => <SkelRow key={i} />)}</tbody></table></div>
                            : groupedPlayers.length === 0
                                ? <div className="terminal-panel py-20 text-center"><span className="material-symbols-outlined text-4xl text-neutral-700 block mb-3">person_off</span><p className="text-text-muted text-sm font-bold">No player data available.</p></div>
                                : groupedPlayers.map(group => {
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
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <img src={row.teamLogo} alt={row.team} className="h-7 w-7 object-contain" onError={e => { e.currentTarget.style.opacity = '0' }} />
                                                                            <span className="text-[10px] font-black text-text-muted">{row.team}</span>
                                                                        </div>
                                                                    </td>
                                                                    {/* Player cell — clickable */}
                                                                    <td className="px-4 py-3 min-w-[150px]">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="relative shrink-0">
                                                                                <div className="h-8 w-8 rounded-full overflow-hidden bg-neutral-800">
                                                                                    {row.headshot
                                                                                        ? <img src={row.headshot} alt={row.shortName} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = 'none' }} />
                                                                                        : <span className="material-symbols-outlined text-neutral-600 text-sm flex items-center justify-center h-full w-full">person</span>
                                                                                    }
                                                                                </div>
                                                                                {/* Team Logo Badge */}
                                                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black rounded-full p-[2px] z-10 flex items-center justify-center shadow-sm border border-neutral-800/80">
                                                                                    <img src={row.teamLogo} alt={row.team} className="w-full h-full object-contain drop-shadow-md" onError={e => { e.currentTarget.style.opacity = '0' }} />
                                                                                </div>
                                                                            </div>
                                                                            <button
                                                                                onClick={(e) => openPopup(row, e)}
                                                                                className="text-xs font-black text-text-main hover:text-primary transition-colors text-left leading-none underline-offset-2 hover:underline"
                                                                            >
                                                                                {row.shortName}
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                    {/* Stat cells */}
                                                                    {gCols.map(c => (
                                                                        <SC
                                                                            key={c.key}
                                                                            v={row.stats[c.key] ?? 0}
                                                                            baseline={c.baseline}
                                                                            hi={topKey === c.key && (row.stats[c.key] ?? 0) === maxTop}
                                                                            fmt={c.key === 'avg' || c.key === 'svpct' ? c.key : undefined}
                                                                            inverted={c.key === 'era'}
                                                                        />
                                                                    ))}
                                                                    <td className="px-3 py-3 text-center">
                                                                        <span className={`text-[10px] font-black ${row.confidence >= 80 ? 'text-primary' : row.confidence >= 65 ? 'text-accent-blue' : 'text-text-muted'}`}>
                                                                            {row.confidence}%
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
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
            </div>

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
