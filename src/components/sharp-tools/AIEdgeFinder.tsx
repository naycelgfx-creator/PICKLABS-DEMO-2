import React, { useState, useMemo } from 'react';
import { PickLabsAI, SIMULATED_MARKET, AI_PROJECTIONS, MarketEntry, AIPick } from '../../data/PickLabsAI';

// ─── Instantiate engine (same as Python: ai = PickLabsAI()) ──────────────────
const ai = new PickLabsAI();

// ─── Custom market entry row ──────────────────────────────────────────────────

const SPORTS = ['NBA', 'NFL', 'NHL', 'MLB', 'NCAAW', 'CFB', 'WBC'];
const GRADE_CONFIG = {
    'A+': { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]' },
    'A': { color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', glow: '' },
};

function formatOdds(odds: number): string {
    return odds > 0 ? `+${odds}` : `${odds}`;
}

function AmericanOddsToImplied(odds: number): number {
    return Math.round(ai.convertAmericanToProb(odds) * 100);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const AIEdgeFinder: React.FC = () => {
    const [market, setMarket] = useState<MarketEntry[]>(SIMULATED_MARKET);
    const [filterSport, setFilterSport] = useState<string>('ALL');
    const [minEdge, setMinEdge] = useState<number>(8);
    const [showAddRow, setShowAddRow] = useState(false);

    // New entry form state
    const [newTeam, setNewTeam] = useState('');
    const [newOpponent, setNewOpponent] = useState('');
    const [newSport, setNewSport] = useState('NBA');
    const [newOdds, setNewOdds] = useState('');

    // Run the AI engine — same as: ai.get_top_ai_picks(market)
    const picks: AIPick[] = useMemo(() => {
        const filtered = filterSport === 'ALL' ? market : market.filter(m => m.sport === filterSport);
        return ai.getTopAIPicks(filtered).filter(p => p.edgeRaw * 100 >= minEdge);
    }, [market, filterSport, minEdge]);

    const handleAddEntry = () => {
        const oddsNum = parseInt(newOdds);
        if (!newTeam || !newOpponent || isNaN(oddsNum)) return;
        const entry: MarketEntry = {
            team: newTeam,
            opponent: newOpponent,
            sport: newSport,
            fdOdds: oddsNum,
            game: `${newTeam} vs ${newOpponent}`,
        };
        setMarket(prev => [...prev, entry]);
        setNewTeam(''); setNewOpponent(''); setNewOdds('');
        setShowAddRow(false);
    };

    return (
        <div className="terminal-panel overflow-hidden col-span-12">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white">AI Edge Finder</p>
                        <p className="text-[10px] text-text-muted">PickLabsAI · Edge = AI Win% − Market Implied%</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Min edge slider */}
                    <div className="hidden xl:flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wide text-text-muted">Min Edge:</span>
                        <input
                            type="range" min={4} max={20} step={1} value={minEdge}
                            onChange={e => setMinEdge(Number(e.target.value))}
                            className="w-20 accent-emerald-500"
                            title="Minimum Edge Slider"
                        />
                        <span className="text-[10px] font-black text-emerald-400 w-6">{minEdge}%</span>
                    </div>

                    {/* Sport filter */}
                    <div className="flex gap-1">
                        {['ALL', ...SPORTS].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterSport(s)}
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border transition-all ${filterSport === s
                                    ? 'bg-primary/20 border-primary/40 text-primary'
                                    : 'bg-white/3 border-border text-text-muted hover:text-white'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowAddRow(r => !r)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-border text-text-muted hover:text-white text-[9px] font-black uppercase tracking-wide transition-all"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Add Line
                    </button>
                </div>
            </div>

            {/* Add custom line row */}
            {showAddRow && (
                <div className="px-5 py-3 border-b border-border bg-blue-500/5 flex flex-wrap items-center gap-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 w-full">Custom Market Entry</p>
                    {[
                        { placeholder: 'Team (e.g. Lakers)', value: newTeam, set: setNewTeam, w: 'w-36' },
                        { placeholder: 'Opponent', value: newOpponent, set: setNewOpponent, w: 'w-36' },
                    ].map(({ placeholder, value, set, w }) => (
                        <input
                            key={placeholder}
                            type="text"
                            placeholder={placeholder}
                            title={placeholder}
                            value={value}
                            onChange={e => set(e.target.value)}
                            className={`${w} rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] text-white outline-none focus:border-primary/40 transition-colors`}
                        />
                    ))}
                    <select
                        value={newSport}
                        onChange={e => setNewSport(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] text-white outline-none focus:border-primary/40"
                        title="Select Sport"
                    >
                        {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                        type="number"
                        placeholder="FD Odds (e.g. +110)"
                        title="FanDuel Odds"
                        value={newOdds}
                        onChange={e => setNewOdds(e.target.value)}
                        className="w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] text-white outline-none focus:border-primary/40 transition-colors"
                    />
                    <button
                        onClick={handleAddEntry}
                        className="px-4 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-primary text-[10px] font-black uppercase tracking-wide"
                    >
                        Run AI
                    </button>
                    <p className="text-[9px] text-text-muted">
                        💡 AI needs a projection for the team in <code className="text-text-muted bg-white/5 px-1 rounded">AI_PROJECTIONS</code> — or add your own in <code className="text-text-muted bg-white/5 px-1 rounded">PickLabsAI.ts</code>
                    </p>
                </div>
            )}

            {/* Picks found banner */}
            <div className="px-5 py-2 border-b border-border bg-white/3 flex items-center justify-between">
                <p className="text-[10px] font-black text-white">
                    {picks.length > 0
                        ? <><span className="text-emerald-400">{picks.length}</span> picks found with ≥{minEdge}% edge</>
                        : <span className="text-text-muted">No picks above {minEdge}% edge threshold</span>
                    }
                </p>
                <p className="text-[9px] text-text-muted">
                    Scanning {filterSport === 'ALL' ? market.length : market.filter(m => m.sport === filterSport).length} market lines
                </p>
            </div>

            {/* Picks grid */}
            {picks.length > 0 ? (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {picks.map((pick, i) => {
                        const cfg = GRADE_CONFIG[pick.grade];
                        return (
                            <div
                                key={`${pick.pick}-${i}`}
                                className={`rounded-xl border p-4 space-y-3 transition-all ${cfg.bg} ${cfg.border} ${cfg.glow}`}
                            >
                                {/* Top row */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-white/8 text-text-muted tracking-widest">{pick.sport}</span>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-white/8 text-text-muted tracking-widest">{pick.type}</span>
                                        </div>
                                        <p className="text-base font-black text-white truncate">{pick.pick}</p>
                                        <p className="text-[10px] text-text-muted">vs {pick.opponent}</p>
                                    </div>
                                    <div className={`flex flex-col items-center px-3 py-2 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                                        <span className={`text-2xl font-black leading-none ${cfg.color}`}>{pick.grade}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-text-muted mt-0.5">Grade</span>
                                    </div>
                                </div>

                                {/* Probability bar comparison */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[9px] font-black">
                                        <span className="text-text-muted uppercase tracking-wide">AI Model</span>
                                        <span className={cfg.color}>{pick.aiProb}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-emerald-500 transition-all`}
                                            style={{ width: `${pick.aiProb}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-[9px] font-black">
                                        <span className="text-text-muted uppercase tracking-wide">FD Implied</span>
                                        <span className="text-text-muted">{pick.marketProb}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-white/8 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-white/25"
                                            style={{ width: `${pick.marketProb}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Edge + odds row */}
                                <div className="flex items-center justify-between pt-1 border-t border-white/8">
                                    <div>
                                        <p className="text-[9px] text-text-muted font-black uppercase tracking-wide">Edge</p>
                                        <p className={`text-lg font-black leading-none ${cfg.color}`}>+{pick.edge}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-text-muted font-black uppercase tracking-wide">FD Odds</p>
                                        <p className="text-lg font-black text-white">{formatOdds(pick.fdOdds)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-text-muted font-black uppercase tracking-wide">Implied</p>
                                        <p className="text-sm font-black text-text-muted">{AmericanOddsToImplied(pick.fdOdds)}%</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-12 text-center text-text-muted">
                    <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                    <p className="text-[12px] font-black uppercase tracking-widest">No Edges Found</p>
                    <p className="text-[10px] mt-1">Lower the min-edge threshold or add more market lines</p>
                </div>
            )}

            {/* Footer — show projections source note */}
            <div className="px-5 py-3 border-t border-border bg-white/3">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(AI_PROJECTIONS).map(([sport, teams]) => (
                        <div key={sport} className="flex items-center gap-1 text-[9px] text-text-muted">
                            <span className="font-black text-white">{sport}:</span>
                            {Object.entries(teams).map(([team, prob]) => (
                                <span key={team} className="mr-1">{team} <span className="text-emerald-400">{Math.round(prob * 100)}%</span></span>
                            ))}
                        </div>
                    ))}
                </div>
                <p className="text-[8px] text-text-muted/50 mt-1">AI projections from PickLabsAI simulation engine · Edge threshold: ≥8% = pick, ≥12% = A+</p>
            </div>
        </div>
    );
};
