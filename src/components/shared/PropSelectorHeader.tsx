import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import {
    Sparkles, Target, X, BarChart2,
    Cloud, Users, Star, Zap, MessageSquare, Search,
} from 'lucide-react';
import {
    masterPredictionEngine,
    generateMockGameLog,
    getMockOddsBooks,
    formatOdds,
    confidenceColor,
    PredictionResult,
} from '../../data/pickLabsEngine';

// ── Types ─────────────────────────────────────────────────────────────────────
interface StatTag { stat: string; confidence: 'HIGH' | 'MED' | 'LOW'; }
interface PropPill { entity: string; tags: StatTag[]; }
type TabId = 'full' | 'game' | 'props' | 'underdog' | 'custom' | 'weather' | 'expert';

interface AnalysisResult {
    type: TabId;
    content: React.ReactNode;
}

interface PropSelectorHeaderProps {
    pills?: PropPill[];
    className?: string;
    pageName?: string;
}

// ── Default demo data ─────────────────────────────────────────────────────────
const DEFAULT_PILLS: PropPill[] = [
    {
        entity: 'A. Edwards',
        tags: [
            { stat: 'PTS', confidence: 'HIGH' },
            { stat: 'AST', confidence: 'MED' },
        ],
    },
    {
        entity: 'LeBron James',
        tags: [{ stat: 'REB', confidence: 'MED' }],
    },
];

// ── Tab Config ────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: React.ReactNode; context?: string; badge?: boolean }[] = [
    {
        id: 'full',
        label: 'Full AI Analysis',
        icon: <Sparkles className="w-3.5 h-3.5" />,
        badge: true,
        context: 'Comprehensive macro-level report: player stats + team trends + external factors = bottom-line recommendation',
    },
    {
        id: 'game',
        label: 'AI Game Prediction',
        icon: <Target className="w-3.5 h-3.5" />,
        context: 'Moneyline · Point Spread · Over/Under — full game outcome model',
    },
    {
        id: 'props',
        label: 'AI Player Props',
        icon: <BarChart2 className="w-3.5 h-3.5" />,
        context: 'Individual player stat projections: points, rebounds, assists, touchdowns, strikeouts',
    },
    {
        id: 'underdog',
        label: 'Underdog Analysis',
        icon: <Zap className="w-3.5 h-3.5" />,
        context: 'Statistical anomalies and mismatches overlooked by oddsmakers — high-value upset opportunities',
    },
    {
        id: 'custom',
        label: 'Custom AI Analysis',
        icon: <MessageSquare className="w-3.5 h-3.5" />,
        context: 'Ask anything — situational, historical, matchup-specific deep dives',
    },
];

const CONTEXT_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'weather', label: 'Weather', icon: <Cloud className="w-3.5 h-3.5" /> },
    { id: 'expert', label: 'Expert', icon: <Users className="w-3.5 h-3.5" /> },
];

// ── Badge ─────────────────────────────────────────────────────────────────────
const ConfBadge = ({ c }: { c: 'HIGH' | 'MED' | 'LOW' }) => (
    <span className={cn('text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded border', confidenceColor(c))}>
        {c}
    </span>
);

// ── Stat Row Helper ───────────────────────────────────────────────────────────
const StatRow = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="bg-neutral-900 rounded-lg p-2.5 border border-neutral-800 flex flex-col gap-0.5">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{label}</div>
        <div className="text-sm font-black text-white">{value}</div>
        {sub && <div className="text-[9px] text-slate-600">{sub}</div>}
    </div>
);

// ── Full AI Result Panel ──────────────────────────────────────────────────────
const FullAnalysisPanel = ({ result, playerName, statLabel }: { result: PredictionResult; playerName: string; statLabel: string }) => {
    if (!result.the_answer) return null;
    const { math_breakdown: mb, the_answer: ta, confidence } = result;

    return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn('text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border', confidenceColor(confidence))}>
                        {confidence} EDGE
                    </span>
                    <span className="text-xs font-bold text-white">✨ Full AI Report · {playerName}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">via {ta.recommended_book}</span>
            </div>

            {/* WMA Math Breakdown */}
            <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">📊 Multi-Timeframe Math</div>
                <div className="grid grid-cols-4 gap-2">
                    <StatRow label="WMA (5g)" value={mb.wma_5} sub="50% weight" />
                    <StatRow label="Avg (10g)" value={mb.avg_10} sub="30% weight" />
                    <StatRow label="Avg (20g)" value={mb.avg_20} sub="20% weight" />
                    <StatRow label="🎯 Projection" value={mb.final_projection} sub="Blended" />
                </div>
            </div>

            {/* Team Trend Summary */}
            <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-3">
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5">📈 Trend Summary</div>
                <div className="text-[11px] text-slate-300 leading-relaxed">
                    {playerName} is projecting <span className="text-primary font-black">{mb.final_projection} {statLabel}</span> — trending{' '}
                    {mb.wma_5 > mb.avg_20 ? (
                        <span className="text-primary font-black">UP ↑</span>
                    ) : (
                        <span className="text-red-400 font-black">DOWN ↓</span>
                    )} vs 20-game baseline.{' '}
                    Recent form ({mb.wma_5}) is {mb.wma_5 > mb.avg_10 ? 'outpacing' : 'lagging'} the 10-game average ({mb.avg_10}).
                </div>
            </div>

            {/* The Pick */}
            <div className="flex items-center justify-between bg-gradient-to-r from-neutral-900 to-neutral-950 border border-primary/30 rounded-xl p-3 shadow-[0_0_15px_rgba(13,242,13,0.08)]">
                <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">🏆 Best Play (Line Shop)</div>
                    <div className="text-base font-black text-white">
                        {ta.action} {ta.line} {statLabel}
                        <span className={cn('ml-2 text-sm', ta.action === 'OVER' ? 'text-primary' : 'text-accent-blue')}>
                            {formatOdds(ta.odds)}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">PickLabs Edge</div>
                    <div className="text-xl font-black text-primary">+{ta.picklabs_edge_score}</div>
                </div>
            </div>
        </div>
    );
};

// ── Game Prediction Panel ─────────────────────────────────────────────────────
const GamePredictionPanel = ({ team1 = 'Home Team', team2 = 'Away Team' }: { team1?: string; team2?: string }) => {
    const winProb1 = Math.floor(Math.random() * 25) + 38; // 38-62%
    const winProb2 = 100 - winProb1;
    const spread = (Math.random() * 8 + 1).toFixed(1);
    const total = (Math.floor(Math.random() * 40) + 180).toFixed(1);
    const moneyline1 = winProb1 > 50 ? `-${Math.floor(winProb1 * 1.6)}` : `+${Math.floor(winProb2 * 1.3)}`;
    const mlRecco = winProb1 >= winProb2 ? team1 : team2;
    const edge = (Math.random() * 3 + 0.5).toFixed(2);

    return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border bg-blue-500/10 border-blue-500/40 text-blue-400">AI Model</span>
                <span className="text-xs font-bold text-white">🎯 Game Outcome Prediction</span>
            </div>

            {/* Win Probability */}
            <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">Win Probability</div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-black text-white w-24 truncate">{team1}</span>
                    <div className="flex-1 h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-1000"
                            style={{ width: `${winProb1}%` }}
                        />
                    </div>
                    <span className="text-[11px] font-black text-primary w-8">{winProb1}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-white w-24 truncate">{team2}</span>
                    <div className="flex-1 h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full transition-all duration-1000"
                            style={{ width: `${winProb2}%` }}
                        />
                    </div>
                    <span className="text-[11px] font-black text-accent-blue w-8">{winProb2}%</span>
                </div>
            </div>

            {/* Market Predictions */}
            <div className="grid grid-cols-3 gap-2">
                <StatRow label="Moneyline" value={moneyline1} sub={`Lean: ${mlRecco}`} />
                <StatRow label="Spread" value={`${team1} -${spread}`} sub="Cover probability" />
                <StatRow label="Total (O/U)" value={total} sub="OVER lean" />
            </div>

            <div className="flex items-center justify-between bg-gradient-to-r from-neutral-900 to-neutral-950 border border-blue-500/30 rounded-xl p-3">
                <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">📋 Recommended Play</div>
                    <div className="text-sm font-black text-white">{mlRecco} ML · Spread -{spread}</div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">AI Edge</div>
                    <div className="text-xl font-black text-accent-blue">+{edge}</div>
                </div>
            </div>
        </div>
    );
};

// ── Player Props Panel ────────────────────────────────────────────────────────
const PlayerPropsPanel = ({ result, playerName }: { result: PredictionResult; playerName: string }) => {
    if (!result.the_answer) return null;
    const { math_breakdown: mb, the_answer: ta, confidence } = result;
    const statsToShow = [
        { stat: 'PTS', proj: mb.final_projection, line: ta.line, action: ta.action, edge: ta.picklabs_edge_score, conf: confidence },
        { stat: 'AST', proj: +(mb.final_projection * 0.26).toFixed(1), line: +(mb.final_projection * 0.24).toFixed(1), action: 'OVER', edge: +(ta.picklabs_edge_score * 0.7).toFixed(2), conf: 'MED' as const },
        { stat: 'REB', proj: +(mb.final_projection * 0.32).toFixed(1), line: +(mb.final_projection * 0.35).toFixed(1), action: 'UNDER', edge: +(ta.picklabs_edge_score * 0.5).toFixed(2), conf: 'LOW' as const },
    ];

    return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
                <span className={cn('text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border', confidenceColor(confidence))}>
                    {confidence} EDGE
                </span>
                <span className="text-xs font-bold text-white">📈 Player Props · {playerName}</span>
            </div>

            <div className="space-y-2">
                {statsToShow.map((s) => (
                    <div key={s.stat} className={cn(
                        'flex items-center justify-between rounded-lg border p-3 transition-all',
                        s.action === 'OVER' ? 'border-primary/30 bg-primary/5' : 'border-blue-500/30 bg-blue-500/5'
                    )}>
                        <div className="flex items-center gap-3">
                            <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border', confidenceColor(s.conf))}>
                                {s.conf}
                            </span>
                            <div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">{playerName} {s.stat}</div>
                                <div className={cn('text-sm font-black', s.action === 'OVER' ? 'text-primary' : 'text-accent-blue')}>
                                    {s.action} {s.line}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] text-slate-500 font-bold uppercase">Projection</div>
                            <div className="text-sm font-black text-white">{s.proj}</div>
                            <div className="text-[9px] text-primary font-bold">+{s.edge} edge</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Underdog Panel ────────────────────────────────────────────────────────────
const UnderdogPanel = ({ team = 'Underdog Team' }: { team?: string }) => {
    const udEdge = (Math.random() * 4 + 1.5).toFixed(2);
    const coverProb = Math.floor(Math.random() * 20) + 42;
    const atsRecord = `${Math.floor(Math.random() * 5) + 7}-${Math.floor(Math.random() * 4) + 3}`;
    const reasons = [
        'Vegas line moved 2+ points since open — sharp money indicator',
        'Average matchup: opponent ranks 22nd defending vs this position',
        `${team} covers ATS at ${atsRecord} as double-digit underdog (L10)`,
        'Key injuries to opposition reported 3h before tip — line hasn\'t adjusted',
        'Public bet split 68% AGAINST — but sharp action 72% ON the dog',
    ];

    return (
        <div className="rounded-xl border border-yellow-500/30 bg-neutral-950 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-[0_0_20px_rgba(234,179,8,0.08)]">
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border bg-yellow-500/10 border-yellow-500/40 text-yellow-400">
                    ⚡ Upset Alert
                </span>
                <span className="text-xs font-bold text-white">Underdog Analysis · {team}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <StatRow label="Upset Edge" value={`+${udEdge}`} sub="Statistical deviation" />
                <StatRow label="Cover Prob." value={`${coverProb}%`} sub="vs implied odds" />
                <StatRow label="ATS Record" value={atsRecord} sub="as underdog L10" />
            </div>

            <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-2">📡 Edge Signals Detected</div>
                <div className="space-y-1.5">
                    {reasons.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                            <span className="text-yellow-400 font-black shrink-0 mt-0.5">→</span>
                            {r}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">💡 PickLabs Play</div>
                    <div className="text-sm font-black text-white">{team} +Spread · Live Line Value</div>
                </div>
                <div className="text-right">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Upset Edge</div>
                    <div className="text-xl font-black text-yellow-400">+{udEdge}</div>
                </div>
            </div>
        </div>
    );
};

// ── Custom AI Chat Panel ──────────────────────────────────────────────────────
const CustomAIPanel = () => {
    const [query, setQuery] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const endRef = useRef<HTMLDivElement>(null);

    const CANNED_ANSWERS: Record<string, string> = {
        default: '📊 Based on historical data, I\'m detecting a statistically significant edge in current market conditions. The line appears to have moved beyond fair value given recent injury reports and sharp action shifts.',
        lebron: '👑 LeBron averages 26.4 PPG on back-to-backs (L3 seasons). However, on road back-to-backs specifically, efficiency dips to 44.2% FG. Sharp money currently fading his points line at 25.5.',
        mahomes: '🏈 Mahomes throws for 285+ yards in 71% of games with over 38°F weather. In cold weather (<35°F), that drops to 58%. Check game-time temp before placing passing yardage props.',
        weather: '🌧️ Current forecast shows 18mph wind gusts at the stadium. Historically, every 5mph of wind reduces total scoring ~1.4 pts in NFL games. Consider the UNDER.',
        spread: '📉 The spread opened at -3.5 and has moved to -6.5 — that\'s a significant 3-point steam move. Sharp books (Pinnacle) are still at -5.5, indicating the square public is inflating the favorite side.',
    };

    const getAnswer = (q: string) => {
        const lower = q.toLowerCase();
        if (lower.includes('lebron')) return CANNED_ANSWERS.lebron;
        if (lower.includes('mahomes')) return CANNED_ANSWERS.mahomes;
        if (lower.includes('weather') || lower.includes('wind') || lower.includes('rain')) return CANNED_ANSWERS.weather;
        if (lower.includes('spread') || lower.includes('line') || lower.includes('steam')) return CANNED_ANSWERS.spread;
        return CANNED_ANSWERS.default;
    };

    const handleSend = async () => {
        if (!query.trim() || isThinking) return;
        const userMsg = query.trim();
        setChatHistory(h => [...h, { role: 'user', text: userMsg }]);
        setQuery('');
        setIsThinking(true);
        await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
        setChatHistory(h => [...h, { role: 'ai', text: getAnswer(userMsg) }]);
        setIsThinking(false);
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isThinking]);

    return (
        <div className="rounded-xl border border-accent-purple/30 bg-neutral-950 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border bg-accent-purple/10 border-accent-purple/40 text-accent-purple">
                    💬 Chat AI
                </span>
                <span className="text-xs font-bold text-white">Custom Analysis — ask anything</span>
            </div>

            {/* Suggestion chips */}
            {chatHistory.length === 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {[
                        'LeBron on back-to-backs?',
                        'Mahomes in cold weather?',
                        'Weather impact on totals?',
                        'How to read line movement?',
                    ].map(s => (
                        <button
                            key={s}
                            onClick={() => setQuery(s)}
                            className="text-[10px] font-bold text-slate-400 bg-neutral-900 border border-neutral-700 px-2.5 py-1 rounded-full hover:border-accent-purple/50 hover:text-white transition-all"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Chat history */}
            {chatHistory.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                            <div className={cn(
                                'text-[11px] leading-relaxed rounded-xl px-3 py-2 max-w-[85%]',
                                msg.role === 'user'
                                    ? 'bg-accent-purple/20 text-white border border-accent-purple/30'
                                    : 'bg-neutral-900 text-slate-300 border border-neutral-800'
                            )}>
                                {msg.role === 'ai' && <span className="text-accent-purple font-black mr-1">AI</span>}
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px] animate-spin text-accent-purple">sync</span>
                                PickLabs AI is thinking...
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="How does LeBron perform on back-to-backs?"
                    className="flex-1 bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent-purple/50 transition-colors"
                />
                <button
                    onClick={handleSend}
                    disabled={!query.trim() || isThinking}
                    className="px-3 py-2.5 bg-accent-purple text-white rounded-xl hover:bg-purple-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Search className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// ── Weather Panel ─────────────────────────────────────────────────────────────
const WeatherPanel = () => {
    const conditions = [
        { venue: 'Highmark Stadium (NFl)', temp: '28°F', wind: '22 mph NW', precip: '15%', impact: 'HIGH', note: 'Passing props hit at 54% in 20+ mph wind — fade WR yardage, target TEs and Rushed Yards.' },
        { venue: 'Wrigley Field (MLB)', temp: '52°F', wind: '12 mph OUT', precip: '5%', impact: 'MED', note: 'Wind blowing OUT boosts OVER-hitting. Ball carries 6–8% further — lean OVER on totals.' },
        { venue: 'Lambeau Field (NFL)', temp: '18°F', wind: '8 mph', precip: '60% Snow', impact: 'HIGH', note: 'Snow games average 4.2 fewer total points. Strong UNDER lean. Fade passing props.' },
        { venue: 'Fenway Park (MLB)', temp: '67°F', wind: '4 mph IN', precip: '0%', impact: 'LOW', note: 'Ideal conditions — no weather edge. Focus on matchup stats.' },
    ];

    return (
        <div className="rounded-xl border border-blue-400/30 bg-neutral-950 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border bg-blue-500/10 border-blue-400/40 text-blue-400">
                    ☁️ Live Weather
                </span>
                <span className="text-xs font-bold text-white">Outdoor Game Conditions</span>
            </div>
            <div className="space-y-2">
                {conditions.map((c) => (
                    <div key={c.venue} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-white">{c.venue}</span>
                            <span className={cn(
                                'text-[8px] font-black uppercase px-1.5 py-0.5 rounded border',
                                c.impact === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-400/30' :
                                    c.impact === 'MED' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30' :
                                        'bg-neutral-800 text-slate-500 border-neutral-700'
                            )}>
                                {c.impact} impact
                            </span>
                        </div>
                        <div className="flex gap-3 text-[10px] text-slate-400">
                            <span>🌡️ {c.temp}</span>
                            <span>💨 {c.wind}</span>
                            <span>🌧️ {c.precip}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 italic">{c.note}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Expert Panel ──────────────────────────────────────────────────────────────
const ExpertPanel = () => {
    const experts = [
        { name: 'Sharp Report', handle: '@VegasInsider', pick: 'Chiefs -3.5', confidence: 75, note: 'Steam move from -2 → -3.5. Sharp books took heavy action on KC ML in last 2 hours.' },
        { name: 'Pro Handicapper', handle: '@RJ_Bell', pick: 'OVER 224.5 NBA', confidence: 68, note: 'Both teams rank T-3 in pace, T-7 in 3PA. High-tempo matchup — expect 230+.' },
        { name: 'Injury Intel', handle: '@FantasyLabs', pick: 'Fade Tatum PTS', confidence: 82, note: 'Tatum listed Q with sore knee. Started 2 of last 3 then logged <28 min. Fade 26.5+ props.' },
        { name: 'Line Movement', handle: '@SportsbookSpy', pick: 'Nuggets +5.5', confidence: 71, note: 'Public 61% on Lakers but line moved from -7 to -5.5. Classic reverse line movement — sharps on Denver.' },
    ];

    return (
        <div className="rounded-xl border border-orange-400/30 bg-neutral-950 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-full border bg-orange-500/10 border-orange-400/40 text-orange-400">
                    📰 Expert Intel
                </span>
                <span className="text-xs font-bold text-white">Sharp Money · Injury Reports · Consensus</span>
            </div>
            <div className="space-y-2">
                {experts.map((e) => (
                    <div key={e.handle} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[11px] font-black text-white">{e.name}</span>
                                <span className="text-[10px] text-slate-500 ml-1.5">{e.handle}</span>
                            </div>
                            <span className="text-[9px] font-black text-primary">{e.confidence}% conf</span>
                        </div>
                        <div className="text-[11px] font-black text-orange-300">✔ {e.pick}</div>
                        <div className="text-[10px] text-slate-400">{e.note}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const PropSelectorHeader: React.FC<PropSelectorHeaderProps> = ({
    pills = DEFAULT_PILLS,
    className,
}) => {
    const [activePills, setActivePills] = useState<PropPill[]>(pills);
    const [activeTab, setActiveTab] = useState<TabId>('full');
    const [loading, setLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const removeTag = (pillIdx: number, tagStat: string) => {
        setActivePills(prev =>
            prev
                .map((p, i) => i !== pillIdx ? p : { ...p, tags: p.tags.filter(t => t.stat !== tagStat) })
                .filter(p => p.tags.length > 0)
        );
    };

    const removePill = (pillIdx: number) => {
        setActivePills(prev => prev.filter((_, i) => i !== pillIdx));
    };

    const handleGenerate = async () => {
        setLoading(true);
        setAnalysisResult(null);
        await new Promise(r => setTimeout(r, 900 + Math.random() * 600));

        const playerName = activePills[0]?.entity ?? 'Anthony Edwards';
        const stat = activePills[0]?.tags[0]?.stat ?? 'PTS';
        const baseline = stat === 'PTS' ? 24 : stat === 'AST' ? 6 : stat === 'REB' ? 8 : 20;
        const gameLogs = generateMockGameLog(playerName, baseline);
        const books = getMockOddsBooks(baseline - 0.5);
        const engineResult = masterPredictionEngine(playerName, stat, gameLogs, books);

        let content: React.ReactNode;

        switch (activeTab) {
            case 'full':
                content = <FullAnalysisPanel result={engineResult} playerName={playerName} statLabel={stat} />;
                break;
            case 'game':
                content = <GamePredictionPanel team1={activePills[0]?.entity ?? 'Home'} team2={activePills[1]?.entity ?? 'Away'} />;
                break;
            case 'props':
                content = <PlayerPropsPanel result={engineResult} playerName={playerName} />;
                break;
            case 'underdog':
                content = <UnderdogPanel team={activePills[1]?.entity ?? activePills[0]?.entity ?? 'Underdog'} />;
                break;
            case 'custom':
                content = <CustomAIPanel />;
                break;
            case 'weather':
                content = <WeatherPanel />;
                break;
            case 'expert':
                content = <ExpertPanel />;
                break;
            default:
                content = null;
        }

        setAnalysisResult({ type: activeTab, content });
        setLoading(false);
    };

    // For custom/weather/expert — auto-generate immediately on tab click
    const handleTabClick = (id: TabId) => {
        setActiveTab(id);
        setAnalysisResult(null);
        if (id === 'custom') {
            setAnalysisResult({ type: 'custom', content: <CustomAIPanel /> });
        }
    };

    const activeTabMeta = [...TABS, ...CONTEXT_TABS].find(t => t.id === activeTab);

    const ctaLabel = {
        full: 'Generate Full AI Analysis',
        game: 'Generate Game Prediction',
        props: 'Analyze Player Props',
        underdog: 'Find Underdog Edges',
        custom: 'Open AI Chat',
        weather: 'Load Weather Report',
        expert: 'Load Expert Intel',
    }[activeTab];

    const ctaColor = {
        full: 'from-primary/80 via-accent-blue/60 to-accent-purple/80 text-black shadow-[0_0_25px_rgba(13,242,13,0.25)] hover:shadow-[0_0_35px_rgba(13,242,13,0.4)]',
        game: 'from-accent-blue/80 via-blue-500/60 to-blue-600/80 text-white shadow-[0_0_25px_rgba(59,130,246,0.25)]',
        props: 'from-accent-blue/80 via-accent-purple/60 to-accent-purple/80 text-white shadow-[0_0_25px_rgba(168,85,247,0.2)]',
        underdog: 'from-yellow-500/80 via-orange-500/60 to-yellow-600/80 text-black shadow-[0_0_25px_rgba(234,179,8,0.25)]',
        custom: 'from-accent-purple/80 via-purple-600/60 to-purple-700/80 text-white shadow-[0_0_25px_rgba(168,85,247,0.3)]',
        weather: 'from-blue-500/80 via-sky-500/60 to-blue-600/80 text-white shadow-[0_0_25px_rgba(59,130,246,0.25)]',
        expert: 'from-orange-500/80 via-amber-500/60 to-orange-600/80 text-black shadow-[0_0_25px_rgba(251,146,60,0.25)]',
    }[activeTab];

    return (
        <div className={cn('space-y-3 mb-6', className)}>
            {/* ── Row 1: Entity Filter Pills ── */}
            <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {activePills.length === 0 && (
                    <span className="text-[11px] text-slate-500 italic">No props selected — click a player or team below to add</span>
                )}
                {activePills.map((pill, pi) => (
                    <div
                        key={`${pill.entity}-${pi}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded-full text-xs font-bold text-white shrink-0 hover:border-neutral-600 transition-colors"
                    >
                        <span className="text-slate-300 font-black">{pill.entity}</span>
                        <span className="text-slate-700">·</span>
                        {pill.tags.slice(0, 2).map(tag => (
                            <span key={tag.stat} className="flex items-center gap-1 bg-neutral-800 rounded-full px-1.5 py-0.5 border border-neutral-700">
                                <ConfBadge c={tag.confidence} />
                                <span className="text-[10px] font-black text-white">{tag.stat}</span>
                                <button
                                    title={`Remove ${tag.stat}`}
                                    onClick={() => removeTag(pi, tag.stat)}
                                    className="text-slate-600 hover:text-red-400 transition-colors ml-0.5"
                                >
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </span>
                        ))}
                        {pill.tags.length > 2 && (
                            <span className="text-[9px] font-black text-slate-500 bg-neutral-800 rounded-full px-1.5 py-0.5">
                                +{pill.tags.length - 2}
                            </span>
                        )}
                        <button title="Remove player" onClick={() => removePill(pi)} className="text-slate-600 hover:text-red-400 transition-colors ml-0.5">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>

            {/* ── Row 2: Analysis Tabs ── */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                            'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shrink-0 border',
                            activeTab === tab.id
                                ? 'bg-primary/10 border-primary text-primary shadow-[0_0_12px_rgba(13,242,13,0.15)]'
                                : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:border-neutral-700 hover:text-white',
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.badge && activeTab === tab.id && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_6px_rgba(13,242,13,0.6)]" />
                        )}
                    </button>
                ))}

                <div className="w-px h-5 bg-neutral-800 mx-1 shrink-0" />

                {CONTEXT_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shrink-0 border',
                            activeTab === tab.id
                                ? 'bg-blue-500/10 border-blue-400/50 text-blue-400'
                                : 'bg-neutral-900 border-neutral-800 text-slate-400 hover:text-white hover:border-neutral-700',
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Context hint ── */}
            {activeTabMeta && 'context' in activeTabMeta && activeTabMeta.context && (
                <div className="text-[10px] text-slate-500 italic px-1">
                    {activeTabMeta.context}
                </div>
            )}

            {/* ── Row 3: CTA Button ── */}
            {activeTab !== 'custom' && (
                <button
                    onClick={handleGenerate}
                    disabled={loading || (activePills.length === 0 && !['weather', 'expert'].includes(activeTab))}
                    className={cn(
                        'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black uppercase tracking-[0.15em] italic transition-all duration-300',
                        'bg-gradient-to-r',
                        ctaColor,
                        'hover:scale-[1.01]',
                        loading && 'opacity-80 cursor-wait',
                        (activePills.length === 0 && !['weather', 'expert'].includes(activeTab)) && 'opacity-40 cursor-not-allowed',
                    )}
                >
                    {loading ? (
                        <>
                            <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                            Running Analysis...
                        </>
                    ) : (
                        <>
                            {activeTab === 'full' && <Sparkles className="w-4 h-4" />}
                            {activeTab === 'game' && <Target className="w-4 h-4" />}
                            {activeTab === 'props' && <BarChart2 className="w-4 h-4" />}
                            {activeTab === 'underdog' && <Zap className="w-4 h-4" />}
                            {activeTab === 'weather' && <Cloud className="w-4 h-4" />}
                            {activeTab === 'expert' && <Users className="w-4 h-4" />}
                            {ctaLabel}
                            <Star className="w-3 h-3 opacity-60" />
                        </>
                    )}
                </button>
            )}

            {/* ── Result Panel ── */}
            {analysisResult && (
                <div>{analysisResult.content}</div>
            )}
        </div>
    );
};
