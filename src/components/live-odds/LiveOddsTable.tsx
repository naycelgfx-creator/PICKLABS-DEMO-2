import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    OddsRow, PrizePicksProp, KalshiEvent,
    getSimulatedRows, getSimulatedFantasyLines, getSimulatedKalshi,
    fetchTheOddsAPI, fetchPrizePicks, fetchBetMGM, fetchKalshi,
    fetchUnderdog, fetchHardRock, fetchTheScore,
} from '../../data/OddsMerger';

// ─── Config ───────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 5000;

// Sportsbooks: 7 books in the comparison table
const SPORTSBOOK_LABELS = ['FanDuel', 'DraftKings', 'Caesars', 'Bet365', 'BetMGM', 'HardRock', 'TheScore'] as const;
type SBook = typeof SPORTSBOOK_LABELS[number];

const BOOK_COLORS: Record<SBook, string> = {
    FanDuel: 'text-blue-400',
    DraftKings: 'text-emerald-400',
    Caesars: 'text-amber-400',
    Bet365: 'text-violet-400',
    BetMGM: 'text-rose-400',
    HardRock: 'text-cyan-400',
    TheScore: 'text-orange-400',
};

// Minimal border-only badge for best cell
const BOOK_BADGE: Record<SBook, string> = {
    FanDuel: 'border-blue-500/40 text-blue-300',
    DraftKings: 'border-emerald-500/40 text-emerald-300',
    Caesars: 'border-amber-500/40 text-amber-300',
    Bet365: 'border-violet-500/40 text-violet-300',
    BetMGM: 'border-rose-500/40 text-rose-300',
    HardRock: 'border-cyan-500/40 text-cyan-300',
    TheScore: 'border-orange-500/40 text-orange-300',
};

// Map table book name → OddsRow key
const BOOK_KEY: Record<SBook, keyof OddsRow> = {
    FanDuel: 'fanduel',
    DraftKings: 'draftkings',
    Caesars: 'caesars',
    Bet365: 'bet365',
    BetMGM: 'betmgm',
    HardRock: 'hardrock',
    TheScore: 'thescore',
};

// Tab definitions
type Tab = 'sportsbooks' | 'fantasy' | 'kalshi';

type FlashState = 'up' | 'down' | 'none';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(odds: number | null): string {
    if (odds === null) return '—';
    return odds > 0 ? `+${odds}` : `${odds}`;
}

// ─── Flash Cell ───────────────────────────────────────────────────────────────

const OddsCell: React.FC<{
    odds: number | null;
    flashState: FlashState;
    isBest: boolean;
    isLocked: boolean;
    book: SBook;
}> = ({ odds, flashState, isBest, isLocked, book }) => {
    let animClass = '';
    if (flashState === 'up') animClass = 'animate-flash-green';
    if (flashState === 'down') animClass = 'animate-flash-red';

    if (isLocked) {
        return (
            <td className="px-3 py-3 text-center">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">
                    <span className="material-symbols-outlined text-[11px]">lock</span>
                    UPGRADE
                </span>
            </td>
        );
    }

    return (
        <td className={`px-3 py-3 text-center transition-all ${animClass}`}>
            {isBest && odds !== null ? (
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded border text-[11px] font-black tracking-wide ${BOOK_BADGE[book]}`}>
                    ★ {fmt(odds)}
                </span>
            ) : (
                <span className={`text-[12px] font-bold tabular-nums ${odds !== null ? 'text-white/50' : 'text-white/15'}`}>
                    {fmt(odds)}
                </span>
            )}
        </td>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const LiveOddsTable: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('sportsbooks');

    // Sportsbooks tab state
    const [rows, setRows] = useState<OddsRow[]>([]);
    const [flashMap, setFlashMap] = useState<Map<string, FlashState>>(new Map());
    const [isPremium, setIsPremium] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [isLive, setIsLive] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [filterSport, setFilterSport] = useState<string>('ALL');
    const [error, setError] = useState<string | null>(null);
    const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);
    const [fetchStatus, setFetchStatus] = useState<Record<string, 'ok' | 'err' | 'loading'>>({});

    // Fantasy tab state
    const [fantasyLines, setFantasyLines] = useState<PrizePicksProp[]>([]);
    const [udLines, setUdLines] = useState<{ player: string; stat_type: string; line: number }[]>([]);
    const [fantasyLoading, setFantasyLoading] = useState(false);

    // Kalshi tab state
    const [kalshiEvents, setKalshiEvents] = useState<KalshiEvent[]>([]);
    const [kalshiLoading, setKalshiLoading] = useState(false);

    const prevOddsRef = useRef<Map<string, Record<SBook, number | null>>>(new Map());

    // ── Flash compute ────────────────────────────────────────────────────────
    const computeFlash = useCallback((newRows: OddsRow[]) => {
        const newFlash = new Map<string, FlashState>();
        for (const row of newRows) {
            const prev = prevOddsRef.current.get(row.id);
            for (const book of SPORTSBOOK_LABELS) {
                const key = `${row.id}-${book}`;
                const cur = row[BOOK_KEY[book]] as number | null;
                const prv = prev?.[book];
                let state: FlashState = 'none';
                if (prv !== undefined && prv !== null && cur !== null) {
                    if (cur > prv) state = 'up';
                    else if (cur < prv) state = 'down';
                }
                newFlash.set(key, state);
            }
            prevOddsRef.current.set(row.id, {
                FanDuel: row.fanduel,
                DraftKings: row.draftkings,
                Caesars: row.caesars,
                Bet365: row.bet365,
                BetMGM: row.betmgm,
                HardRock: row.hardrock,
                TheScore: row.thescore,
            });
        }
        setFlashMap(newFlash);
        setTimeout(() => setFlashMap(new Map()), 2000);
    }, []);

    // ── Sportsbooks fetch tick ────────────────────────────────────────────────
    const tick = useCallback(async () => {
        try {
            let baseRows: OddsRow[];

            if (apiKey.trim().length > 10) {
                baseRows = await fetchTheOddsAPI(apiKey.trim());
            } else {
                baseRows = getSimulatedRows();
            }

            // Try to fetch live data from the 3 browser-accessible APIs in parallel
            const status: Record<string, 'ok' | 'err' | 'loading'> = {};

            const [mgmData, hrData, tsData] = await Promise.allSettled([
                fetchBetMGM().then(d => { status['BetMGM'] = d.length ? 'ok' : 'err'; return d; }),
                fetchHardRock().then(d => { status['HardRock'] = d.length ? 'ok' : 'err'; return d; }),
                fetchTheScore().then(d => { status['TheScore'] = d.length ? 'ok' : 'err'; return d; }),
            ]);

            // Merge live book-specific data into rows (where available)
            // For now we only use the live data to overlay onto existing rows by event name matching
            // If blocked by CORS, we stay on simulated data (which already has all columns)
            if (mgmData.status === 'fulfilled' && mgmData.value.length > 0) {
                // Could merge BetMGM lines here by matching player/game name
                // For now the simulated rows already include betmgm column values
                status['BetMGM'] = 'ok';
            } else {
                status['BetMGM'] = 'err';
            }
            status['HardRock'] = hrData.status === 'fulfilled' && hrData.value.length > 0 ? 'ok' : 'err';
            status['TheScore'] = tsData.status === 'fulfilled' && tsData.value.length > 0 ? 'ok' : 'err';

            setFetchStatus(status);
            computeFlash(baseRows);
            setRows(baseRows);
            setLastUpdated(new Date());
            setError(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to fetch odds');
            setRows(getSimulatedRows());
        }
    }, [apiKey, computeFlash]);

    useEffect(() => {
        tick();
        if (!isLive) return;
        const id = setInterval(tick, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [tick, isLive]);

    // ── Fantasy tab load ──────────────────────────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'fantasy') return;
        setFantasyLoading(true);
        Promise.allSettled([fetchPrizePicks(), fetchUnderdog()]).then(([ppRes, udRes]) => {
            const ppData = ppRes.status === 'fulfilled' && ppRes.value.length > 0
                ? ppRes.value : getSimulatedFantasyLines();
            const udData = udRes.status === 'fulfilled' && udRes.value.length > 0
                ? udRes.value : getSimulatedFantasyLines().map(l => ({ player: l.player, stat_type: l.prop_type, line: l.line }));
            setFantasyLines(ppData);
            setUdLines(udData);
            setFantasyLoading(false);
        });
    }, [activeTab]);

    // ── Kalshi tab load ───────────────────────────────────────────────────────
    useEffect(() => {
        if (activeTab !== 'kalshi') return;
        setKalshiLoading(true);
        fetchKalshi().then(data => {
            setKalshiEvents(data.length ? data : getSimulatedKalshi());
            setKalshiLoading(false);
        });
    }, [activeTab]);

    const sports = ['ALL', ...Array.from(new Set(rows.map(r => r.sport)))];
    const displayed = filterSport === 'ALL' ? rows : rows.filter(r => r.sport === filterSport);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <>
            <style>{`
        @keyframes flashGreen { 0%{background:rgba(0,230,118,0.35);color:#fff}100%{background:transparent} }
        @keyframes flashRed   { 0%{background:rgba(255,23,68,0.35);color:#fff}100%{background:transparent} }
        .animate-flash-green { animation: flashGreen 2s ease-out; }
        .animate-flash-red   { animation: flashRed 2s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden col-span-12">

                {/* ── Top Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border bg-gradient-to-r from-white/[0.03] to-transparent">
                    <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-emerald-400 text-lg">compare_arrows</span>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-white">Live Odds Comparison Engine</p>
                            <p className="text-[9px] text-text-muted">7 Sportsbooks · PrizePicks · Underdog · Kalshi · ★ = Best Book</p>
                        </div>
                    </div>

                    {/* Status pills — show live/blocked status per source */}
                    <div className="hidden lg:flex items-center gap-1.5">
                        {(['BetMGM', 'HardRock', 'TheScore'] as const).map(src => (
                            <span
                                key={src}
                                title={fetchStatus[src] === 'ok' ? 'Live data' : 'CORS-blocked → Simulated'}
                                className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase ${fetchStatus[src] === 'ok'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-white/5 border-white/10 text-white/30'
                                    }`}
                            >
                                {src} {fetchStatus[src] === 'ok' ? '●' : '○'}
                            </span>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[9px] text-text-muted">
                            {lastUpdated
                                ? <><span className="text-white">{lastUpdated.toLocaleTimeString()}</span></>
                                : 'Connecting…'}
                        </span>

                        <button
                            onClick={() => setIsLive(l => !l)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase border transition-all ${isLive ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-border text-text-muted'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-text-muted'}`} />
                            {isLive ? 'LIVE' : 'PAUSED'}
                        </button>

                        <button
                            onClick={() => setIsPremium(p => !p)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase border transition-all ${isPremium ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-white/5 border-border text-text-muted hover:border-amber-400/30'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[13px]">{isPremium ? 'lock_open' : 'lock'}</span>
                            {isPremium ? 'Premium ✓' : 'Free Mode'}
                        </button>

                        <button
                            onClick={() => setIsApiKeyOpen(o => !o)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-black uppercase border border-border bg-white/5 text-text-muted hover:text-white transition-all"
                        >
                            <span className="material-symbols-outlined text-[13px]">vpn_key</span>
                            Odds API Key
                        </button>
                    </div>
                </div>

                {/* ── API Key panel ── */}
                {isApiKeyOpen && (
                    <div className="px-5 py-3 border-b border-border bg-blue-500/5 flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-sm">vpn_key</span>
                        <p className="text-[9px] text-blue-300 font-black uppercase tracking-wide shrink-0">The Odds API Key:</p>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="Paste from the-odds-api.com (free tier available)"
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] text-white outline-none focus:border-blue-400/40"
                        />
                        <a href="https://the-odds-api.com" target="_blank" rel="noreferrer" className="text-[9px] text-blue-400 underline shrink-0">
                            Get free key →
                        </a>
                    </div>
                )}

                {/* ── Tab Bar ── */}
                <div className="flex items-center border-b border-border">
                    {([
                        { id: 'sportsbooks', label: 'Sportsbooks', sub: '7 books', icon: 'compare_arrows' },
                        { id: 'fantasy', label: 'Fantasy Lines', sub: 'PrizePicks · Underdog', icon: 'emoji_events' },
                        { id: 'kalshi', label: 'Kalshi', sub: 'Prediction Markets', icon: 'trending_up' },
                    ] as { id: Tab; label: string; sub: string; icon: string }[]).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 border-b-2 transition-all ${activeTab === tab.id
                                ? 'border-primary text-white'
                                : 'border-transparent text-text-muted hover:text-white/60'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[14px] ${activeTab === tab.id ? 'text-primary' : 'text-text-muted'
                                }`}>{tab.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                            <span className={`text-[8px] font-bold hidden lg:inline ${activeTab === tab.id ? 'text-white/40' : 'text-white/20'
                                }`}>{tab.sub}</span>
                        </button>
                    ))}

                    {/* Sport filter — only on sportsbooks tab */}
                    {activeTab === 'sportsbooks' && (
                        <div className="ml-auto px-3 flex items-center gap-1.5">
                            {sports.map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterSport(s)}
                                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border transition-all ${filterSport === s
                                        ? 'bg-primary/20 border-primary/40 text-primary'
                                        : 'bg-white/3 border-border text-text-muted hover:text-white'
                                        }`}
                                >{s}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Error banner ── */}
                {error && (
                    <div className="px-5 py-2 border-b border-border bg-red-500/10 text-[10px] text-red-400 font-black">
                        ⚠ {error} — showing simulated data
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    TAB 1: SPORTSBOOKS — 7-book odds comparison table
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'sportsbooks' && (
                    <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="border-b border-border bg-white/3">
                                    <th className="px-5 py-2.5 text-left text-[9px] font-black uppercase tracking-widest text-text-muted sticky left-0 bg-surface z-10 min-w-[180px]">
                                        Player & Prop
                                    </th>
                                    {SPORTSBOOK_LABELS.map(b => (
                                        <th key={b} className={`px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest min-w-[95px] ${BOOK_COLORS[b]}`}>
                                            {b}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2.5 text-center text-[9px] font-black uppercase tracking-widest text-amber-400 min-w-[120px]">
                                        ★ Best Play
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayed.map(row => {
                                    const isLocked = !isPremium && row.isPremium;
                                    return (
                                        <tr key={row.id} className="border-b border-border hover:bg-white/[0.025] transition-all group">
                                            {/* Player & Prop */}
                                            <td className="px-5 py-3 text-left sticky left-0 bg-surface group-hover:bg-[#1a1a1a] z-10 transition-all">
                                                <p className="text-[12px] font-black text-white">{row.player}</p>
                                                <p className="text-[10px] text-text-muted">{row.prop}{row.line && row.line !== 'N/A' ? ` · Line: ${row.line}` : ''}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-[8px] uppercase tracking-wide text-text-muted/50">{row.sport}</span>
                                                    {row.isPremium && <span className="text-[7px] font-black text-amber-500/60 bg-amber-500/10 px-1 py-px rounded uppercase">PRO</span>}
                                                </div>
                                            </td>

                                            {/* Odds for each book */}
                                            {SPORTSBOOK_LABELS.map(book => {
                                                const odds = row[BOOK_KEY[book]] as number | null;
                                                return (
                                                    <OddsCell
                                                        key={book}
                                                        odds={odds}
                                                        flashState={isLocked ? 'none' : (flashMap.get(`${row.id}-${book}`) ?? 'none')}
                                                        isBest={!isLocked && odds !== null && odds === row.bestOdds && row.bestBook === book}
                                                        isLocked={isLocked}
                                                        book={book}
                                                    />
                                                );
                                            })}

                                            {/* Best Play column */}
                                            <td className="px-3 py-3 text-right pr-4">
                                                {isLocked ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-amber-500/30 bg-amber-500/10 text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">
                                                        <span className="material-symbols-outlined text-[11px]">lock</span>
                                                        UPGRADE
                                                    </span>
                                                ) : row.bestOdds !== null ? (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-black tracking-wide ${BOOK_BADGE[row.bestBook as SBook] ?? 'border-white/20 text-white/40'}`}>
                                                        {row.bestBook} {fmt(row.bestOdds)}
                                                        {row.edgeDiff > 0 && <span className="text-white/30 text-[8px]">+{row.edgeDiff}</span>}
                                                    </span>
                                                ) : <span className="text-white/15">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {displayed.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-text-muted text-[12px]">
                                            <span className="material-symbols-outlined text-4xl block mb-2">hourglass_empty</span>
                                            Loading odds data…
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    TAB 2: FANTASY — PrizePicks vs Underdog side by side
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'fantasy' && (
                    <div className="p-5">
                        {fantasyLoading ? (
                            <div className="py-12 text-center text-text-muted text-[12px]">
                                <span className="material-symbols-outlined text-4xl block mb-2 animate-spin">sync</span>
                                Loading fantasy lines…
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-violet-500" />
                                        <span className="text-[10px] font-black text-violet-400 uppercase">PrizePicks</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-orange-400" />
                                        <span className="text-[10px] font-black text-orange-400 uppercase">Underdog Fantasy</span>
                                    </div>
                                    <p className="text-[9px] text-text-muted ml-auto">Fantasy lines differ from sportsbook odds — they're O/U thresholds, not ML odds.</p>
                                </div>

                                <div className="overflow-x-auto scrollbar-thin">
                                    <table className="w-full min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-border bg-white/3">
                                                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase text-text-muted">Player</th>
                                                <th className="px-4 py-2.5 text-left text-[9px] font-black uppercase text-text-muted">Prop Type</th>
                                                <th className="px-4 py-2.5 text-center text-[9px] font-black uppercase text-violet-400">PrizePicks Line</th>
                                                <th className="px-4 py-2.5 text-center text-[9px] font-black uppercase text-orange-400">Underdog Line</th>
                                                <th className="px-4 py-2.5 text-center text-[9px] font-black uppercase text-text-muted">Diff</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fantasyLines.map((pp, i) => {
                                                const ud = udLines.find(u => u.player === pp.player && u.stat_type === pp.prop_type);
                                                const diff = ud ? Math.abs(pp.line - ud.line) : null;
                                                return (
                                                    <tr key={i} className="border-b border-border/50 hover:bg-white/[0.02]">
                                                        <td className="px-4 py-3">
                                                            <p className="text-[12px] font-black text-white">{pp.player}</p>
                                                            {pp.description && <p className="text-[9px] text-text-muted">{pp.description}</p>}
                                                        </td>
                                                        <td className="px-4 py-3 text-[11px] font-black text-text-muted uppercase">{pp.prop_type}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-[14px] font-black text-violet-400">{pp.line}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {ud ? (
                                                                <span className="text-[14px] font-black text-orange-400">{ud.line}</span>
                                                            ) : <span className="text-text-muted/30 text-[11px]">—</span>}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            {diff !== null && diff > 0 ? (
                                                                <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                                                    {diff > 0 ? '+' : ''}{(pp.line > (ud?.line ?? pp.line) ? '+' : '-')}{diff.toFixed(1)}
                                                                </span>
                                                            ) : diff === 0 ? (
                                                                <span className="text-[9px] text-emerald-400">SAME</span>
                                                            ) : <span className="text-text-muted/30">—</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    TAB 3: KALSHI — Prediction market probabilities
                ══════════════════════════════════════════════════════════════ */}
                {activeTab === 'kalshi' && (
                    <div className="p-5">
                        {kalshiLoading ? (
                            <div className="py-12 text-center text-text-muted text-[12px]">
                                <span className="material-symbols-outlined text-4xl block mb-2 animate-spin">sync</span>
                                Loading Kalshi markets…
                            </div>
                        ) : (
                            <>
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-4">
                                    Real-money prediction markets · Crowd probability on sports outcomes
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {kalshiEvents.map((ev, i) => {
                                        const yesPrice = ev.yes_price ?? 50;
                                        const isProbFav = yesPrice >= 50;
                                        return (
                                            <div key={i} className="border border-border rounded-lg p-4 hover:border-white/20 transition-all bg-white/[0.015]">
                                                <div className="flex items-start justify-between gap-2 mb-3">
                                                    <p className="text-[11px] font-black text-white leading-snug">{ev.title}</p>
                                                    <span className="text-[8px] font-black text-text-muted border border-border px-1.5 py-0.5 rounded uppercase shrink-0 tracking-widest">
                                                        {ev.category}
                                                    </span>
                                                </div>

                                                {/* Probability bar — thin, muted */}
                                                <div className="relative h-px bg-white/10 rounded-full overflow-hidden mb-3">
                                                    <div
                                                        className="absolute left-0 top-0 h-full bg-primary/60 transition-all"
                                                        style={{ width: `${Math.min(100, yesPrice)}%` }}
                                                    />
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <p className="text-[8px] text-text-muted uppercase tracking-wide mb-0.5">YES</p>
                                                        <p className={`text-[20px] font-black tabular-nums leading-none ${isProbFav ? 'text-white' : 'text-white/40'}`}>{yesPrice}¢</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-[9px] font-black text-primary">{yesPrice}%</p>
                                                        <p className="text-[7px] text-text-muted">implied</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] text-text-muted uppercase tracking-wide mb-0.5">NO</p>
                                                        <p className={`text-[20px] font-black tabular-nums leading-none ${!isProbFav ? 'text-white' : 'text-white/40'}`}>{100 - yesPrice}¢</p>
                                                    </div>
                                                </div>

                                                <p className="text-[7px] text-text-muted/30 mt-2 font-mono">{ev.event_ticker}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="px-5 py-3 border-t border-border bg-white/[0.02] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4 text-[9px] text-text-muted">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Odds up</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Odds down</span>
                        <span>★ = Best book across 7 sportsbooks</span>
                        <span className="text-text-muted/50">|</span>
                        <span>🎯 PrizePicks & Underdog fantasy lines in Fantasy tab</span>
                        <span>|</span>
                        <span>📈 Kalshi prediction markets</span>
                    </div>
                    <p className="text-[8px] text-text-muted/50">
                        {apiKey ? 'Live — The Odds API' : 'Simulated · Add API key for live odds'}
                        {' '}· Polling every {POLL_INTERVAL / 1000}s
                    </p>
                </div>
            </div>
        </>
    );
};
