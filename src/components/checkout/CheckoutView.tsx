import React, { useState } from 'react';
import {
    getCurrentUser,
    submitCashAppPayment,
    TIER_META,
    TierKey,
    DurationKey,
} from '../../data/PickLabsAuthDB';

interface CheckoutViewProps {
    /** The tier the user is trying to purchase — passed from the pricing card that was clicked */
    tier: TierKey;
    /** Duration: 'month' or 'year'. Defaults to 'month' for plans that only have monthly pricing */
    duration: DurationKey;
    /** Navigate back / to signup */
    onNavigate: (view: string) => void;
}

/**
 * CheckoutView — mirrors the dynamic /checkout?tier=...&price=... page described in the Python prompt.
 *
 * Flow (mirrors POST /api/checkout/submit):
 *   1. User arrives here after clicking "Get Pro", "Get Premium+", etc.
 *   2. Page shows the selected tier, exact price, CashApp QR code, and payment instructions.
 *   3. User enters their $cashtag and submits → submitCashAppPayment() records a PendingPayment.
 *   4. Admin sees it in the Payment Queue → Approve auto-upgrades the account.
 */
export const CheckoutView: React.FC<CheckoutViewProps> = ({ tier, duration, onNavigate }) => {
    const meta = TIER_META[tier];
    const price = duration === 'year' ? meta.yearlyPrice : meta.monthlyPrice;
    const priceLabel = price != null ? `$${price.toFixed(2)}/${duration === 'year' ? 'yr' : 'mo'}` : 'Free';

    const [cashtag, setCashtag] = useState('');
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Tier-specific accent colours
    const accentClass =
        tier === 'pro' ? 'text-primary' :
            tier === 'premium_plus' ? 'text-fuchsia-400' :
                tier === 'premium' ? 'text-purple-400' :
                    tier === 'basic' ? 'text-white' :
                        'text-sky-400';

    const btnClass =
        tier === 'pro' ? 'bg-primary text-black shadow-[0_0_30px_rgba(13,242,13,0.25)]' :
            tier === 'premium_plus' ? 'bg-fuchsia-500 text-white shadow-[0_0_30px_rgba(232,121,249,0.25)]' :
                tier === 'premium' ? 'bg-purple-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.25)]' :
                    tier === 'basic' ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)]' :
                        'bg-sky-500 text-white shadow-[0_0_30px_rgba(14,165,233,0.25)]';

    const glowBorder =
        tier === 'pro' ? 'border-primary/40 shadow-[0_0_60px_rgba(13,242,13,0.08)]' :
            tier === 'premium_plus' ? 'border-fuchsia-500/40 shadow-[0_0_60px_rgba(232,121,249,0.08)]' :
                tier === 'premium' ? 'border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.08)]' :
                    tier === 'basic' ? 'border-white/20' :
                        'border-sky-500/40';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) {
            onNavigate('login-page');
            return;
        }
        setMsg('');
        const res = submitCashAppPayment(user.email, tier, duration, cashtag);
        setIsError(!res.ok);
        setMsg(res.message);
        if (res.ok) {
            setCashtag('');
            setSubmitted(true);
        }
    };

    return (
        <div className="min-h-screen flex items-start justify-center px-4 pt-10 pb-20">
            <div className="w-full max-w-lg space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Back */}
                <button
                    onClick={() => onNavigate('account-settings')}
                    className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs uppercase tracking-widest font-black"
                >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Back to Plans
                </button>

                {/* Header card */}
                <div className={`terminal-panel border ${glowBorder} p-8 text-center relative overflow-hidden`}>
                    {/* Background glow */}
                    <div className={`absolute inset-0 blur-[120px] opacity-20 pointer-events-none ${tier === 'pro' ? 'bg-primary' :
                            tier === 'premium_plus' ? 'bg-fuchsia-500' :
                                tier === 'premium' ? 'bg-purple-500' :
                                    'bg-sky-500'
                        }`} />

                    <div className={`text-5xl mb-3`}>{meta.emoji}</div>
                    <h1 className={`text-3xl font-black uppercase tracking-tight italic ${accentClass}`}>
                        Upgrade to {meta.label}
                    </h1>
                    <p className="text-text-muted text-sm mt-1">{meta.description}</p>
                    <div className={`text-5xl font-black italic mt-5 ${accentClass}`}>
                        {priceLabel}
                    </div>
                    <p className="text-[10px] text-neutral-600 uppercase tracking-widest mt-2">
                        {duration === 'month' ? 'Billed monthly · Cancel anytime' : 'Billed annually · Best value'}
                    </p>
                </div>

                {submitted ? (
                    /* ── Success state ── */
                    <div className="terminal-panel border border-emerald-500/30 p-8 text-center space-y-4 animate-in fade-in zoom-in duration-300">
                        <span className="material-symbols-outlined text-5xl text-emerald-400">check_circle</span>
                        <h2 className="text-emerald-400 font-black uppercase tracking-widest text-lg">Payment Submitted!</h2>
                        <p className="text-text-muted text-sm max-w-sm mx-auto">
                            We received your payment request. Our team will verify your CashApp transaction and upgrade your account within <strong className="text-white">24 hours</strong>.
                        </p>
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={() => onNavigate('live-board')}
                                className="px-6 py-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
                            >
                                Go to Live Board
                            </button>
                            <button
                                onClick={() => { setSubmitted(false); setMsg(''); }}
                                className="px-6 py-2.5 border border-border-muted text-text-muted rounded-xl text-xs font-black uppercase tracking-widest hover:text-white transition-all"
                            >
                                Submit Another
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── QR + Instructions ── */}
                        <div className="terminal-panel p-6 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                How to pay
                            </p>
                            <ol className="space-y-3">
                                {[
                                    { n: '1', text: `Open CashApp and send exactly ${priceLabel !== 'Free' ? `$${price?.toFixed(2)}` : '$0.00'} to $PickLabs` },
                                    { n: '2', text: 'In the memo/note, write your email address' },
                                    { n: '3', text: 'Enter your $cashtag below and click "Submit Payment"' },
                                    { n: '4', text: 'We verify & upgrade your account within 24h' },
                                ].map(({ n, text }) => (
                                    <li key={n} className="flex gap-3 items-start">
                                        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${tier === 'pro' ? 'border-primary/40 text-primary bg-primary/10' :
                                                tier === 'premium_plus' ? 'border-fuchsia-500/40 text-fuchsia-400 bg-fuchsia-500/10' :
                                                    tier === 'premium' ? 'border-purple-500/40 text-purple-400 bg-purple-500/10' :
                                                        'border-white/20 text-white/60 bg-white/5'
                                            }`}>{n}</span>
                                        <span className="text-sm text-text-muted leading-relaxed">{text}</span>
                                    </li>
                                ))}
                            </ol>

                            {/* QR Code */}
                            <div className="flex flex-col items-center gap-3 pt-2">
                                <p className="text-[10px] text-text-muted uppercase tracking-widest">Scan to open CashApp</p>
                                <div className="relative inline-block group">
                                    <div className={`absolute inset-0 blur-2xl rounded-2xl opacity-40 transition-opacity duration-500 group-hover:opacity-70 ${tier === 'pro' ? 'bg-primary' : tier === 'premium_plus' ? 'bg-fuchsia-500' :
                                            tier === 'premium' ? 'bg-purple-500' : 'bg-white'
                                        }`} />
                                    <img
                                        src="/cashapp-qr.png"
                                        alt="CashApp QR Code — $PickLabs"
                                        className={`relative w-44 h-auto rounded-2xl border-2 shadow-2xl transition-transform duration-300 group-hover:scale-105 ${tier === 'pro' ? 'border-primary/50' :
                                                tier === 'premium_plus' ? 'border-fuchsia-500/50' :
                                                    tier === 'premium' ? 'border-purple-500/50' :
                                                        'border-white/30'
                                            }`}
                                    />
                                </div>
                                <p className={`text-sm font-black uppercase tracking-wider ${accentClass}`}>
                                    Send to <span className="font-mono">$PickLabs</span>
                                </p>
                                {price != null && (
                                    <div className={`px-4 py-2 rounded-full border text-sm font-black tracking-wide ${tier === 'pro' ? 'bg-primary/10 border-primary/30 text-primary' :
                                            tier === 'premium_plus' ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400' :
                                                tier === 'premium' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                                                    'bg-white/10 border-white/20 text-white'
                                        }`}>
                                        Send exactly ${price.toFixed(2)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Cashtag Form ── */}
                        <form onSubmit={handleSubmit} className="terminal-panel p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-2">
                                    Your CashApp $Cashtag
                                </label>
                                <input
                                    type="text"
                                    value={cashtag}
                                    onChange={e => setCashtag(e.target.value)}
                                    placeholder="$YourCashTag"
                                    required
                                    className="w-full bg-black/60 border border-border-muted text-center text-lg tracking-[0.15em] font-black text-primary rounded-xl py-4 focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-neutral-700"
                                />
                            </div>
                            <p className="text-[10px] text-text-muted text-center">
                                Make sure your $cashtag matches the one you sent payment from.
                            </p>
                            <button
                                type="submit"
                                className={`w-full py-4 font-black uppercase tracking-[0.2em] italic rounded-xl hover:scale-[1.02] transition-all active:scale-95 text-base ${btnClass}`}
                            >
                                Submit Payment Verification
                            </button>
                        </form>
                    </>
                )}

                {msg && (
                    <div className={`p-4 rounded-xl text-sm text-center font-black uppercase tracking-widest animate-in fade-in zoom-in duration-300 ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                        {msg}
                    </div>
                )}
            </div>
        </div>
    );
};
