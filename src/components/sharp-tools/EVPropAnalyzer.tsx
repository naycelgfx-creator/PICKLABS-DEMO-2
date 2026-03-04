import React, { useState, useMemo, useEffect } from 'react';
import { dfsEvEngine, PROP_PRESETS, PropPreset, DFSAnalysis } from '../../data/PickLabsEVEngine';
import { PickLabsAlertEngine } from '../../data/PickLabsAlertEngine';
import { getAllUsers, getCurrentUser, isAdminEmail } from '../../data/PickLabsAuthDB';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatOdds(odds: number): string {
    return odds > 0 ? `+${odds}` : `${odds}`;
}

const EV_CONFIG = {
    high: { label: <><span className="material-symbols-outlined text-orange-500 text-[10px] align-middle mr-1">local_fire_department</span> ACTION</>, color: 'text-emerald-400', bg: 'bg-emerald-500/12', border: 'border-emerald-500/35', glow: 'shadow-[0_0_14px_rgba(16,185,129,0.25)]' },
    low: { label: 'PASS', color: 'text-text-muted', bg: 'bg-white/3', border: 'border-border', glow: '' },
};

// ─── Single Pick Result Card ───────────────────────────────────────────────────

const PropCard: React.FC<{ analysis: DFSAnalysis }> = ({ analysis }) => {
    const isPremiumUser = getCurrentUser()?.isPremium || isAdminEmail(getCurrentUser()?.email || '');
    const cfg = analysis.isProfitable ? EV_CONFIG.high : EV_CONFIG.low;

    return (
        <div className={`rounded-xl border p-4 space-y-3 transition-all ${cfg.bg} ${cfg.border} ${cfg.glow}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{analysis.player}</p>
                    <p className="text-[10px] text-text-muted truncate uppercase tracking-widest">{analysis.stat} <span className="text-white ml-1">[{analysis.line}]</span></p>
                </div>
                <div className={`flex flex-col items-center px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border} shrink-0`}>
                    <span className={`text-[10px] font-black uppercase tracking-wide leading-tight ${cfg.color}`}>
                        {analysis.action}
                    </span>
                    <span className={`text-xl font-black leading-none ${analysis.isProfitable ? 'text-primary' : 'text-text-muted'}`}>
                        {analysis.dfs_edge}
                    </span>
                    <span className="text-[8px] text-text-muted uppercase tracking-widest">DFS Edge</span>
                </div>
            </div>

            {/* Play Direction */}
            <div className="bg-black/20 p-2 rounded border border-border-muted relative overflow-hidden flex items-center justify-between">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/50"></div>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest ml-2">Suggested Play</p>
                <p className={`text-sm font-black text-white ${analysis.suggested_play === 'OVER' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {analysis.suggested_play}
                </p>
            </div>

            {/* True Win Probability */}
            <div className="flex justify-between items-center text-[11px] font-black pt-1">
                <span className="text-text-muted uppercase tracking-wide flex items-center gap-1">
                    {!isPremiumUser && <span className="material-symbols-outlined text-[10px]">lock</span>} True Win Prob
                </span>
                <span className={`text-white ${!isPremiumUser ? 'blur-sm select-none pointer-events-none' : ''}`}>{isPremiumUser ? analysis.true_win_probability : '88.8%'}</span>
            </div>

            <div className="relative w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div className="absolute h-full rounded-full bg-primary transition-all duration-500" style={{ width: analysis.true_win_probability }} />
            </div>

            {/* Footer odds row */}
            <div className="flex items-center justify-between pt-2 border-t border-white/8 text-[9px] font-black">
                <div>
                    <p className="text-text-muted uppercase tracking-wide">Sharp Over</p>
                    <p className="text-white text-sm">{formatOdds(analysis.sharpOver)}</p>
                </div>
                <div className="text-right">
                    <p className="text-text-muted uppercase tracking-wide">Sharp Under</p>
                    <p className="text-white text-sm">{formatOdds(analysis.sharpUnder)}</p>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const EVPropAnalyzer: React.FC = () => {
    const isPremiumUser = getCurrentUser()?.isPremium || isAdminEmail(getCurrentUser()?.email || '');
    // Custom form state
    const [player, setPlayer] = useState('Luka Dončić');
    const [stat, setStat] = useState('Assists');
    const [dfsLine, setDfsLine] = useState('8.5');
    const [sharpLine, setSharpLine] = useState('8.5');
    const [sharpOver, setSharpOver] = useState('-145');
    const [sharpUnder, setSharpUnder] = useState('+115');
    const [customResult, setCustomResult] = useState<DFSAnalysis | { error: string } | null>(null);
    const [alertedProps, setAlertedProps] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Batch analysis of all presets
    const presetResults: DFSAnalysis[] = useMemo(
        () => {
            const results = PROP_PRESETS.map(p => dfsEvEngine.analyzeDfsSquare(p.player, p.stat, p.dfsLine, p.sharpLine, p.sharpOver, p.sharpUnder));
            return results.filter(r => !('error' in r)) as DFSAnalysis[];
        },
        [],
    );

    const highValueCount = presetResults.filter(r => r.isProfitable).length;

    const handleAnalyze = () => {
        const result = dfsEvEngine.analyzeDfsSquare(
            player,
            stat,
            parseFloat(dfsLine),
            parseFloat(sharpLine),
            parseInt(sharpOver),
            parseInt(sharpUnder)
        );
        setCustomResult(result);
    };

    const loadPreset = (p: PropPreset) => {
        setPlayer(p.player);
        setStat(p.stat);
        setDfsLine(p.dfsLine.toString());
        setSharpLine(p.sharpLine.toString());
        setSharpOver(formatOdds(p.sharpOver));
        setSharpUnder(formatOdds(p.sharpUnder));
        setCustomResult(null);
    };

    // ── Alert Engine Trigger ────────────────────────────────────────────────
    useEffect(() => {
        const checkAndAlert = (result: DFSAnalysis) => {
            const edgeVal = parseFloat(result.dfs_edge);
            const propId = `${result.player}-${result.stat}-${result.line}`;

            if (!isNaN(edgeVal) && edgeVal >= 5.0 && !alertedProps.has(propId)) {
                // 1. Fire Discord Webhook
                PickLabsAlertEngine.sendDiscordVIPAlert({
                    player: result.player,
                    stat: result.stat,
                    line: result.line.toString(),
                    true_prob: result.true_win_probability,
                    edge: edgeVal.toString(),
                    bookmaker: 'Sharp Consensus'
                });

                // 2. Loop through premium users and send SMS
                const premiumUsers = getAllUsers().filter(u => u.isPremium);
                let smsCount = 0;
                for (const user of premiumUsers) {
                    if (user.phoneNumber) {
                        PickLabsAlertEngine.sendSMSAlert(user.phoneNumber, {
                            player: result.player,
                            stat: result.stat,
                            line: result.line.toString(),
                            true_prob: result.true_win_probability,
                            edge: edgeVal.toString(),
                            bookmaker: 'Sharp Consensus'
                        });
                        smsCount++;
                    }
                }

                setToastMessage(`🚨 MASSIVE EDGE DETECTED! Triggered Discord Webhook and sent ${smsCount} SMS alerts to Premium Users.`);
                setTimeout(() => setToastMessage(null), 5000);

                setAlertedProps(prev => {
                    const newSet = new Set(prev);
                    newSet.add(propId);
                    return newSet;
                });
            }
        };

        // Check presets
        presetResults.forEach(checkAndAlert);

        // Check custom customResult
        if (customResult && !('error' in customResult)) {
            checkAndAlert(customResult);
        }

    }, [presetResults, customResult, alertedProps]);

    return (
        <div className="terminal-panel overflow-hidden col-span-12 relative">

            {/* Toast Notification Container */}
            {toastMessage && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
                    <div className="bg-red-500/90 backdrop-blur-md border border-red-400 text-white px-4 py-2 rounded-lg text-xs font-black shadow-lg shadow-red-500/20 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">campaign</span>
                        {toastMessage}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-lg">calculate</span>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white">DFS EV Engine</p>
                        <p className="text-[10px] text-text-muted">Calculates mathematical edge against static DFS lines using sharp book odds</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-wide">
                        {highValueCount} Value Plays
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-border text-[9px] font-black text-text-muted uppercase tracking-wide">
                        Breakeven: 54.2% (5-Pick Flex)
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-12 divide-x divide-border">

                {/* ── Left: Custom Analyzer ── */}
                <div className="col-span-12 xl:col-span-4 p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Analyze DFS Square</p>

                    {/* Player + prop */}
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={player}
                            onChange={e => setPlayer(e.target.value)}
                            placeholder="Player name"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-white outline-none focus:border-amber-400/40 transition-colors"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={stat}
                                onChange={e => setStat(e.target.value)}
                                placeholder="Stat (e.g. Assists)"
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-white outline-none focus:border-amber-400/40 transition-colors"
                            />
                            <input
                                type="number"
                                step="0.5"
                                value={dfsLine}
                                onChange={e => setDfsLine(e.target.value)}
                                placeholder="DFS Line"
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-white outline-none focus:border-amber-400/40 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Odds inputs */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Sharp Line', val: sharpLine, set: setSharpLine },
                            { label: 'Sharp Over', val: sharpOver, set: setSharpOver },
                            { label: 'Sharp Under', val: sharpUnder, set: setSharpUnder },
                        ].map(({ label, val, set }) => (
                            <div key={label}>
                                <p className="text-[9px] font-black uppercase tracking-wide text-text-muted mb-1">{label}</p>
                                <input
                                    type="text"
                                    value={val}
                                    onChange={e => set(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] text-white text-center outline-none focus:border-amber-400/40 transition-colors font-black"
                                />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all cursor-pointer"
                    >
                        Analyze Square
                    </button>

                    {/* Result */}
                    {customResult && (
                        'error' in customResult ? (
                            <div className="rounded-xl border p-4 bg-red-500/10 border-red-500/30">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest text-center">{customResult.error}</p>
                            </div>
                        ) : (
                            <div className={`rounded-xl border p-4 space-y-3 ${customResult.isProfitable
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-white/3 border-border'
                                }`}>
                                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{customResult.player} - {customResult.stat}</p>
                                    <p className={`text-[11px] font-black ${customResult.isProfitable ? 'text-primary' : 'text-text-muted'}`}>
                                        {customResult.action}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[9px] text-text-muted font-black uppercase tracking-wide">Suggested Play</p>
                                        <p className={`text-xl font-black ${customResult.suggested_play === 'OVER' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {customResult.suggested_play}
                                        </p>
                                        <p className="text-[9px] text-text-muted font-black mt-1 flex items-center gap-0.5">
                                            {!isPremiumUser && <span className="material-symbols-outlined text-[8px]">lock</span>} WIN PROB: <span className={`text-white ${!isPremiumUser ? 'blur-sm select-none pointer-events-none' : ''}`}>{isPremiumUser ? customResult.true_win_probability : '88.8%'}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-text-muted font-black uppercase tracking-wide">DFS Edge</p>
                                        <p className={`text-xl font-black ${customResult.dfs_edge.includes('+') ? 'text-primary' : 'text-red-400'}`}>
                                            {customResult.dfs_edge}
                                        </p>
                                        <p className="text-[9px] text-text-muted font-black mt-1">&gt; 54.2% BRK EVEN</p>
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {/* Presets */}
                    <div className="border-t border-border pt-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">Load Preset</p>
                        <div className="flex flex-wrap gap-1.5">
                            {PROP_PRESETS.map(p => (
                                <button
                                    key={p.player + p.stat}
                                    onClick={() => loadPreset(p)}
                                    className="px-2 py-1 rounded-md bg-white/5 border border-border text-[9px] font-black text-text-muted hover:text-white hover:border-amber-400/30 transition-all cursor-pointer"
                                >
                                    {p.player.split(' ')[0]} · {p.sport}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right: Batch Results ── */}
                <div className="col-span-12 xl:col-span-8 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                        Batch Scan — {presetResults.length} Squares Analyzed
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {presetResults.map((r, i) => (
                            <PropCard key={i} analysis={r} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer — formula explanation */}
            <div className="px-5 py-3 border-t border-border bg-white/3">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-[9px] text-text-muted">
                    <span><span className="text-white font-black">①</span> Parse Sharp Odds (Pinnacle/Circa)</span>
                    <span><span className="text-white font-black">②</span> Remove Vig → True Probability</span>
                    <span><span className="text-white font-black">③</span> Compare against DFS Breakeven (54.2%)</span>
                    <span className="text-white/30">Target edge: &gt; 1.5%</span>
                </div>
            </div>
        </div>
    );
};
