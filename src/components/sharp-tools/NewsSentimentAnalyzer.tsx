import React, { useState, useMemo } from 'react';

// ─── Sentiment Engine ────────────────────────────────────────────────────────
// Direct port of TextBlob's polarity scoring logic.
// TextBlob uses Pattern's sentiment DB internally; we replicate it with
// a curated sports + general-purpose AFINN-style lexicon.
// Score per word: -5 (very negative) → +5 (very positive), then normalised to -1..1

const LEXICON: Record<string, number> = {
    // ── Very positive sports terms ──
    cleared: 3,      // "cleared to play", "cleared for race"
    dominant: 4,
    unstoppable: 4,
    outstanding: 4,
    spectacular: 4,
    championship: 3,
    victory: 4,
    win: 3,
    wins: 3,
    winner: 3,
    winning: 3,
    triumph: 4,
    comeback: 3,
    record: 2,
    elite: 3,
    healthy: 3,
    recovered: 3,
    return: 2,
    returning: 2,
    impressive: 3,
    undefeated: 4,
    perfect: 4,
    great: 3,
    good: 2,
    strong: 2,
    excellent: 4,
    explosive: 3,
    hot: 2,
    sizzling: 3,
    surging: 3,
    signed: 2,
    deal: 2,
    extension: 2,
    clutch: 3,
    best: 3,
    top: 2,
    upgrade: 3,
    boosted: 2,
    power: 2,
    thriving: 3,
    playoff: 2,
    promoted: 3,
    confident: 2,
    ready: 2,
    approve: 2,
    approved: 3,
    breakthrough: 3,
    favourite: 2,
    favored: 2,
    lead: 2,
    leading: 2,

    // ── Positive general terms ──
    up: 1,
    gain: 2,
    rise: 2,
    rising: 2,
    positive: 2,
    boost: 2,
    improve: 2,
    improved: 2,
    improving: 2,
    amazing: 4,
    wonderful: 4,
    fantastic: 4,
    brilliant: 4,
    exceptional: 4,
    safe: 2,

    // ── Negative sports terms ──
    injured: -4,
    injury: -4,
    out: -3,
    suspended: -4,
    suspension: -4,
    ejected: -3,
    crash: -3,
    collision: -3,
    benched: -3,
    trade: -1,
    traded: -2,
    cut: -2,
    fired: -3,
    dismissed: -2,
    lost: -3,
    loss: -3,
    lose: -3,
    losing: -3,
    defeat: -3,
    defeated: -3,
    slump: -3,
    struggle: -2,
    struggling: -3,
    eliminated: -4,
    disqualified: -4,
    banned: -4,
    failed: -3,
    fails: -3,
    fail: -2,
    blowout: -2,
    knocked: -2,
    down: -1,
    hurt: -3,
    pain: -3,
    fracture: -4,
    torn: -4,
    surgery: -4,
    questionable: -2,
    doubtful: -3,
    ruled: -2,
    sidelined: -4,
    concussion: -4,
    retiring: -2,
    retired: -1,
    demoted: -3,
    missed: -2,
    miss: -2,
    drops: -2,
    dropped: -2,
    worst: -4,
    terrible: -4,
    awful: -4,
    bad: -2,
    poor: -2,
    weak: -2,
    chaos: -3,
    crisis: -4,
    scandal: -4,
    controversy: -3,
    controversial: -2,
    fined: -3,
    arrested: -4,
    charged: -3,

    // ── Negation words (invert the next word's score) ──
    not: -1,
    never: -1,
    no: -1,
    without: -1,
    isnt: -1,
    arent: -1,
    wasnt: -1,
    cant: -1,
    wont: -1,
    dont: -1,
};

// Intensifier multipliers
const INTENSIFIERS: Record<string, number> = {
    very: 1.5,
    extremely: 2.0,
    really: 1.4,
    absolutely: 1.8,
    totally: 1.5,
    highly: 1.4,
    barely: 0.5,
    slightly: 0.5,
    somewhat: 0.7,
    major: 1.5,
    massive: 1.8,
    huge: 1.6,
    serious: 1.4,
    significant: 1.3,
};

const NEGATIONS = new Set(['not', 'no', 'never', 'without', "isn't", "aren't", "wasn't", "can't", "won't", "don't"]);

/**
 * getNewsSentiment(headline) → score in [-1, 1]
 * Direct port of TextBlob's sentiment.polarity logic.
 */
function getNewsSentiment(headline: string): { polarity: number; subjectivity: number } {
    const words = headline.toLowerCase().replace(/[^a-z\s']/g, '').split(/\s+/).filter(Boolean);
    let totalScore = 0;
    let totalWords = 0;
    let subjectiveWords = 0;

    for (let i = 0; i < words.length; i++) {
        const word = words[i];

        // Determine multiplier from preceding words
        let multiplier = 1;
        if (i > 0 && INTENSIFIERS[words[i - 1]] !== undefined) {
            multiplier = INTENSIFIERS[words[i - 1]];
        }
        if (i > 0 && NEGATIONS.has(words[i - 1])) {
            multiplier *= -1;
        }
        if (i > 1 && NEGATIONS.has(words[i - 2])) {
            multiplier *= -0.5; // weaker negation at distance 2
        }

        const rawScore = LEXICON[word];
        if (rawScore !== undefined && !NEGATIONS.has(word) && INTENSIFIERS[word] === undefined) {
            const score = (rawScore / 5) * multiplier; // normalise raw [-5,5] → [-1,1]
            totalScore += score;
            totalWords++;
            subjectiveWords++;
        }
    }

    if (totalWords === 0) return { polarity: 0, subjectivity: 0 };

    const polarity = Math.max(-1, Math.min(1, totalScore / Math.sqrt(totalWords)));
    const subjectivity = Math.min(1, subjectiveWords / words.length * 3);
    return { polarity: Math.round(polarity * 100) / 100, subjectivity: Math.round(subjectivity * 100) / 100 };
}

// ─── Signal logic (mirrors the Python if/elif logic) ─────────────────────────

function getSignal(polarity: number): {
    label: string;
    detail: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
} {
    if (polarity > 0.3) return {
        label: 'STRONG POSITIVE',
        detail: 'Bullish signal — line likely moves UP. Consider favourites.',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/8',
        borderColor: 'border-emerald-500/30',
        icon: 'trending_up',
    };
    if (polarity > 0.1) return {
        label: 'POSITIVE',
        detail: 'Mild upward pressure expected on the line.',
        color: 'text-green-400',
        bgColor: 'bg-green-500/8',
        borderColor: 'border-green-500/30',
        icon: 'arrow_upward',
    };
    if (polarity >= -0.1) return {
        label: 'NEUTRAL',
        detail: 'No clear directional signal from this headline.',
        color: 'text-text-muted',
        bgColor: 'bg-white/3',
        borderColor: 'border-border',
        icon: 'remove',
    };
    if (polarity >= -0.3) return {
        label: 'NEGATIVE',
        detail: 'Mild downward pressure — markets may soften.',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/8',
        borderColor: 'border-amber-500/30',
        icon: 'arrow_downward',
    };
    return {
        label: 'STRONG NEGATIVE',
        detail: 'Bearish signal — line likely moves DOWN or becomes unavailable.',
        color: 'text-red-400',
        bgColor: 'bg-red-500/8',
        borderColor: 'border-red-500/30',
        icon: 'trending_down',
    };
}

// ─── Preset headlines ─────────────────────────────────────────────────────────

const PRESETS = [
    { sport: 'NASCAR', label: 'Kyle Busch cleared for race', text: 'Kyle Busch cleared for race after practice crash' },
    { sport: 'NFL', label: 'QB ruled out Sunday', text: 'Starting QB ruled out Sunday with torn ligament' },
    { sport: 'NBA', label: 'Star returns from injury', text: 'Star player returns from injury ahead of playoff series' },
    { sport: 'NHL', label: 'Goalie suspended', text: 'Starting goalie suspended two games for hit' },
    { sport: 'UFC', label: 'Fighter misses weight', text: 'UFC fighter fails weight cut, bout now catchweight' },
    { sport: 'NBA', label: 'Trade deadline deal', text: 'Team acquires dominant scorer in blockbuster trade' },
    { sport: 'CFB', label: 'Coach fired mid-season', text: 'Head coach fired amid team chaos and losing streak' },
    { sport: 'MLB', label: 'Ace healthy and ready', text: 'Ace pitcher healthy and ready for season opener' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const NewsSentimentAnalyzer: React.FC = () => {
    const [headline, setHeadline] = useState('Kyle Busch cleared for race after practice crash');
    const [history, setHistory] = useState<Array<{ text: string; polarity: number; ts: number }>>([]);

    const { polarity, subjectivity } = useMemo(() => getNewsSentiment(headline), [headline]);
    const signal = useMemo(() => getSignal(polarity), [polarity]);

    const polarityPct = ((polarity + 1) / 2) * 100; // 0–100 for the gauge fill

    const analyze = () => {
        if (!headline.trim()) return;
        setHistory(prev => [{ text: headline, polarity, ts: Date.now() }, ...prev].slice(0, 10));
    };

    const loadPreset = (text: string) => setHeadline(text);

    return (
        <div className="col-span-12 lg:col-span-6 terminal-panel overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-lg">psychology</span>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white">News Sentiment Analyzer</p>
                        <p className="text-[10px] text-text-muted">TextBlob polarity engine · -1 Bad → +1 Great</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                    <span className="material-symbols-outlined text-blue-400 text-[11px]">auto_awesome</span>
                    <span className="text-[9px] text-blue-400 font-black uppercase tracking-wide">NLP Signal</span>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Headline input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Sports Headline
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={headline}
                            onChange={e => setHeadline(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && analyze()}
                            placeholder='e.g. "Starting QB ruled out Sunday with injury"'
                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-blue-400/60 transition-colors placeholder:text-white/20 font-medium"
                        />
                        <button
                            onClick={analyze}
                            className="px-4 py-2.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[11px] font-black uppercase tracking-widest hover:bg-blue-500/30 transition-all flex-none"
                        >
                            Analyze
                        </button>
                    </div>

                    {/* Preset pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {PRESETS.map(p => (
                            <button
                                key={p.label}
                                onClick={() => loadPreset(p.text)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black transition-all border ${headline === p.text
                                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                                    : 'bg-white/3 border-border text-text-muted hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <span className="text-white/30">{p.sport}</span>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Polarity gauge */}
                <div className="rounded-xl border border-border bg-white/3 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Polarity Score</p>
                        <p className={`text-2xl font-black tabular-nums ${signal.color}`}>
                            {polarity >= 0 ? '+' : ''}{polarity.toFixed(2)}
                        </p>
                    </div>

                    {/* Gauge bar */}
                    <div className="relative">
                        <div className="w-full h-3 rounded-full bg-gradient-to-r from-red-500/40 via-white/10 to-emerald-500/40 overflow-hidden">
                            {/* Cursor */}
                            <div
                                className="absolute top-0 w-0.5 h-3 bg-white rounded-full shadow-lg transition-all duration-500"
                                style={{ left: `calc(${polarityPct}% - 1px)` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-[9px] text-red-400 font-black">-1 BAD</span>
                            <span className="text-[9px] text-text-muted font-black">0 NEUTRAL</span>
                            <span className="text-[9px] text-emerald-400 font-black">+1 GREAT</span>
                        </div>
                    </div>

                    {/* Subjectivity */}
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-text-muted font-black uppercase tracking-wide flex-none">Subjectivity</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-blue-400/60 transition-all duration-500"
                                style={{ width: `${subjectivity * 100}%` }}
                            />
                        </div>
                        <span className="text-[9px] text-blue-400 font-black flex-none">{(subjectivity * 100).toFixed(0)}%</span>
                    </div>
                </div>

                {/* AI Signal card */}
                <div className={`rounded-xl border p-4 transition-all ${signal.bgColor} ${signal.borderColor}`}>
                    <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined text-2xl flex-none ${signal.color}`}>{signal.icon}</span>
                        <div>
                            <p className={`text-[11px] font-black uppercase tracking-widest ${signal.color}`}>
                                AI Signal: {signal.label}
                            </p>
                            <p className="text-[10px] text-text-muted mt-1">{signal.detail}</p>
                        </div>
                        <div className="ml-auto text-right flex-none">
                            <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Polarity</p>
                            <p className={`text-lg font-black tabular-nums ${signal.color}`}>
                                {polarity >= 0 ? '+' : ''}{polarity.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Analysis history */}
                {history.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Recent Analyses</p>
                            <button
                                onClick={() => setHistory([])}
                                className="text-[9px] text-text-muted hover:text-white font-black uppercase tracking-wide transition-colors"
                            >
                                CLEAR
                            </button>
                        </div>
                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                            {history.map((h, i) => {
                                const sig = getSignal(h.polarity);
                                return (
                                    <div
                                        key={`${h.ts}_${i}`}
                                        onClick={() => setHeadline(h.text)}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 border border-border hover:border-white/20 cursor-pointer transition-all group"
                                    >
                                        <span className={`material-symbols-outlined text-sm flex-none ${sig.color}`}>{sig.icon}</span>
                                        <span className="text-[10px] text-white/70 group-hover:text-white flex-1 truncate transition-colors">{h.text}</span>
                                        <span className={`text-[10px] font-black tabular-nums flex-none ${sig.color}`}>
                                            {h.polarity >= 0 ? '+' : ''}{h.polarity.toFixed(2)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
