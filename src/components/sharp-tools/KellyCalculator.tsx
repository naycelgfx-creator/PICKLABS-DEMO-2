import React, { useState, useMemo } from 'react';

/**
 * Kelly Criterion bet sizing calculator
 * Direct port of the Python calculate_kelly_bet function
 *
 * odds: American odds (e.g. +150, -110)
 * probability: Model's predicted win chance (0.0 – 1.0)
 * bankroll: Total funds
 * fractionalKelly: Safety factor — 0.25 (Quarter-Kelly) recommended
 */
function calculateKellyBet(
    odds: number,
    probability: number,
    bankroll: number,
    fractionalKelly: number = 0.25
): {
    suggestedBet: number;
    kellyFraction: number;
    decimalOdds: number;
    edge: number;
    impliedProbability: number;
} {
    // Convert American odds → decimal for the math
    const b = odds > 0 ? odds / 100 : 100 / Math.abs(odds);

    const p = probability;
    const q = 1 - p;

    // Kelly Formula: f* = (b·p − q) / b
    const kelly_f = (b * p - q) / b;

    // Implied probability from the odds (break-even point)
    const impliedProb = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);

    // Edge = model probability − implied probability
    const edge = p - impliedProb;

    if (kelly_f <= 0) {
        return {
            suggestedBet: 0,
            kellyFraction: kelly_f,
            decimalOdds: b,
            edge,
            impliedProbability: impliedProb,
        };
    }

    const suggestedBet = Math.round(bankroll * kelly_f * fractionalKelly * 100) / 100;

    return {
        suggestedBet,
        kellyFraction: kelly_f,
        decimalOdds: b,
        edge,
        impliedProbability: impliedProb,
    };
}

const KELLY_PRESETS = [
    { label: 'Full Kelly', value: 1.0, color: 'text-red-400', desc: 'Max growth, high variance' },
    { label: 'Half Kelly', value: 0.5, color: 'text-amber-400', desc: 'Balanced risk' },
    { label: '¼ Kelly', value: 0.25, color: 'text-primary', desc: 'Recommended — conservative' },
    { label: '⅛ Kelly', value: 0.125, color: 'text-blue-400', desc: 'Ultra-conservative' },
];

const ODDS_PRESETS = [
    { label: '+100', value: 100 },
    { label: '+110', value: 110 },
    { label: '+150', value: 150 },
    { label: '+200', value: 200 },
    { label: '-110', value: -110 },
    { label: '-130', value: -130 },
    { label: '-150', value: -150 },
    { label: '-200', value: -200 },
];

export const KellyCalculator: React.FC = () => {
    const [odds, setOdds] = useState<string>('+150');
    const [probability, setProbability] = useState<number>(45);
    const [bankroll, setBankroll] = useState<string>('1000');
    const [fractionalKelly, setFractionalKelly] = useState<number>(0.25);
    const [oddsSign, setOddsSign] = useState<'+' | '-'>('+');

    const parsedOdds = useMemo(() => {
        const raw = odds.replace(/[^0-9]/g, '');
        const n = parseInt(raw, 10) || 100;
        return oddsSign === '+' ? n : -n;
    }, [odds, oddsSign]);

    const parsedBankroll = useMemo(() => parseFloat(bankroll.replace(/[^0-9.]/g, '')) || 0, [bankroll]);

    const result = useMemo(
        () => calculateKellyBet(parsedOdds, probability / 100, parsedBankroll, fractionalKelly),
        [parsedOdds, probability, parsedBankroll, fractionalKelly]
    );

    const hasValue = result.edge > 0;
    const edgePct = (result.edge * 100).toFixed(1);
    const impliedPct = (result.impliedProbability * 100).toFixed(1);

    // Gauge: what % of bankroll is suggested?
    const betPct = parsedBankroll > 0 ? (result.suggestedBet / parsedBankroll) * 100 : 0;

    return (
        <div className="col-span-12 lg:col-span-6 terminal-panel overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white/5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">calculate</span>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-white">Kelly Criterion</p>
                        <p className="text-[10px] text-text-muted">Optimal bet sizing · Quarter-Kelly recommended</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 border border-primary/30">
                    <span className="material-symbols-outlined text-primary text-[11px]">science</span>
                    <span className="text-[9px] text-primary font-black uppercase tracking-wide">Mathematical Edge</span>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Inputs row */}
                <div className="grid grid-cols-3 gap-3">
                    {/* American Odds */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">American Odds</label>
                        <div className="flex rounded-lg overflow-hidden border border-border bg-background focus-within:border-primary transition-colors">
                            {/* +/- toggle */}
                            <button
                                onClick={() => setOddsSign(s => s === '+' ? '-' : '+')}
                                className={`w-9 flex-none text-sm font-black transition-colors ${oddsSign === '+' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}
                            >
                                {oddsSign}
                            </button>
                            <input
                                type="number"
                                min="100"
                                value={odds.replace(/[^0-9]/g, '')}
                                onChange={e => setOdds(e.target.value)}
                                className="flex-1 bg-transparent px-2 py-2 text-sm font-bold text-white outline-none min-w-0"
                                placeholder="150"
                            />
                        </div>
                        {/* Quick presets */}
                        <div className="flex flex-wrap gap-1">
                            {ODDS_PRESETS.map(p => (
                                <button
                                    key={p.label}
                                    onClick={() => {
                                        setOddsSign(p.value > 0 ? '+' : '-');
                                        setOdds(String(Math.abs(p.value)));
                                    }}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-black transition-colors ${parsedOdds === p.value
                                        ? 'bg-primary text-black'
                                        : 'bg-white/5 text-text-muted hover:text-white'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Win Probability */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                            Model Win % <span className="text-primary">{probability}%</span>
                        </label>
                        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background focus-within:border-primary transition-colors">
                            <input
                                type="range"
                                min={1}
                                max={99}
                                value={probability}
                                onChange={e => setProbability(Number(e.target.value))}
                                className="flex-1 accent-[#0df20d] h-1"
                            />
                            <span className="text-sm font-black text-primary w-8 text-right">{probability}</span>
                        </div>
                        <div className="flex justify-between text-[9px] text-text-muted font-bold">
                            <span>1%</span>
                            <span>50%</span>
                            <span>99%</span>
                        </div>
                    </div>

                    {/* Bankroll */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Bankroll</label>
                        <div className="flex items-center gap-1 rounded-lg border border-border bg-background focus-within:border-primary transition-colors px-3 py-2">
                            <span className="text-text-muted text-sm font-black">$</span>
                            <input
                                type="number"
                                min="0"
                                value={bankroll}
                                onChange={e => setBankroll(e.target.value)}
                                className="flex-1 bg-transparent text-sm font-bold text-white outline-none min-w-0"
                                placeholder="1000"
                            />
                        </div>
                        {/* Quick bankroll presets */}
                        <div className="flex gap-1">
                            {['500', '1000', '2500', '5000'].map(v => (
                                <button
                                    key={v}
                                    onClick={() => setBankroll(v)}
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-black flex-1 transition-colors ${bankroll === v ? 'bg-primary text-black' : 'bg-white/5 text-text-muted hover:text-white'
                                        }`}
                                >
                                    ${parseInt(v).toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Fractional Kelly selector */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Kelly Fraction — Safety Multiplier
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {KELLY_PRESETS.map(preset => (
                            <button
                                key={preset.label}
                                onClick={() => setFractionalKelly(preset.value)}
                                className={`px-2 py-2 rounded-lg border text-left transition-all ${fractionalKelly === preset.value
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-white/3 hover:border-white/30'
                                    }`}
                            >
                                <p className={`text-[11px] font-black ${fractionalKelly === preset.value ? 'text-primary' : preset.color}`}>
                                    {preset.label}
                                </p>
                                <p className="text-[9px] text-text-muted mt-0.5">{preset.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Result */}
                <div className={`rounded-xl border p-4 transition-all ${!hasValue
                    ? 'border-red-500/30 bg-red-500/5'
                    : result.suggestedBet > parsedBankroll * 0.1
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-primary/30 bg-primary/5'
                    }`}>
                    {!hasValue ? (
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-400 text-2xl">block</span>
                            <div>
                                <p className="text-sm font-black text-red-400">NO VALUE — DO NOT BET</p>
                                <p className="text-[11px] text-text-muted mt-0.5">
                                    Kelly fraction is {(result.kellyFraction * 100).toFixed(1)}% — the implied probability ({impliedPct}%)
                                    {' '}exceeds your model's estimate ({probability}%). No positive edge.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Suggested Bet</p>
                                    <p className={`text-3xl font-black ${result.suggestedBet > parsedBankroll * 0.1 ? 'text-amber-400' : 'text-primary'
                                        }`}>
                                        ${result.suggestedBet.toFixed(2)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">of Bankroll</p>
                                    <p className="text-xl font-black text-white">{betPct.toFixed(2)}%</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${betPct > 10 ? 'bg-amber-400' : 'bg-primary'
                                        }`}
                                    style={{ width: `${Math.min(betPct * 5, 100)}%` }}
                                />
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <div className="text-center">
                                    <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Your Edge</p>
                                    <p className={`text-sm font-black ${parseFloat(edgePct) > 0 ? 'text-primary' : 'text-red-400'}`}>
                                        +{edgePct}%
                                    </p>
                                </div>
                                <div className="text-center border-x border-border">
                                    <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Kelly f*</p>
                                    <p className="text-sm font-black text-white">
                                        {(result.kellyFraction * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Book Implied</p>
                                    <p className="text-sm font-black text-white">{impliedPct}%</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Math breakdown — collapsible style */}
                <details className="group">
                    <summary className="cursor-pointer flex items-center gap-2 text-[10px] text-text-muted font-black uppercase tracking-widest select-none">
                        <span className="material-symbols-outlined text-sm group-open:rotate-90 transition-transform">chevron_right</span>
                        Show Formula Breakdown
                    </summary>
                    <div className="mt-3 rounded-lg bg-background border border-border p-3 font-mono text-[10px] space-y-1 text-text-muted">
                        <p className="text-white font-bold"># Kelly Criterion</p>
                        <p>b = {parsedOdds > 0 ? `${parsedOdds} / 100` : `100 / ${Math.abs(parsedOdds)}`} = {result.decimalOdds.toFixed(4)}</p>
                        <p>p = {probability} / 100 = {(probability / 100).toFixed(4)}</p>
                        <p>q = 1 - p = {(1 - probability / 100).toFixed(4)}</p>
                        <p className="text-primary/80">kelly_f = (b * p - q) / b</p>
                        <p>       = ({result.decimalOdds.toFixed(4)} × {(probability / 100).toFixed(4)} - {(1 - probability / 100).toFixed(4)}) / {result.decimalOdds.toFixed(4)}</p>
                        <p>       = <span className="text-white">{(result.kellyFraction * 100).toFixed(4)}%</span></p>
                        <p className="text-primary/80 mt-2">suggested_bet = bankroll × kelly_f × fractional_kelly</p>
                        <p>             = ${parsedBankroll.toFixed(2)} × {(result.kellyFraction).toFixed(4)} × {fractionalKelly}</p>
                        <p>             = <span className="text-primary font-bold">${result.suggestedBet.toFixed(2)}</span></p>
                    </div>
                </details>
            </div>
        </div>
    );
};
