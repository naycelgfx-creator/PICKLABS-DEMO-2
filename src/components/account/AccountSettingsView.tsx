import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
    getCurrentUser, SessionData,
    has2FAEnabled, enable2FA, disable2FA,
    hasRecoveryCodesEnabled, enableRecoveryCodes, disableRecoveryCodes,
    TierKey, DurationKey,
} from '../../data/PickLabsAuthDB';
import { RecoveryVault } from './RecoveryVault';
import { clearAuth } from '../../utils/auth';

interface AccountSettingsViewProps {
    onNavigate: (view: string) => void;
    onLogout: () => void;
}

// Tier card config — prices and labels, matching Python TierEnum
const TIER_CARDS: {
    tier: TierKey;
    label: string;
    emoji: string;
    desc: string;
    monthlyPrice: number;
    yearlyPrice: number | null;
    accentClass: string;
    activeBg: string;
    btnClass: string;
}[] = [
        {
            tier: 'pro',
            label: 'Pro',
            emoji: '⚡',
            desc: 'Full access — all tools & analytics',
            monthlyPrice: 79.99,
            yearlyPrice: null,
            accentClass: 'text-primary',
            activeBg: 'bg-primary/10 border-primary/60 shadow-[0_0_25px_rgba(13,242,13,0.12)]',
            btnClass: 'bg-primary text-black shadow-[0_0_15px_rgba(13,242,13,0.25)] hover:bg-emerald-400',
        },
        {
            tier: 'premium_plus',
            label: 'Premium+',
            emoji: '⭐',
            desc: 'Premium with advanced analytics',
            monthlyPrice: 29.99,
            yearlyPrice: null,
            accentClass: 'text-fuchsia-400',
            activeBg: 'bg-fuchsia-500/10 border-fuchsia-500/60 shadow-[0_0_25px_rgba(232,121,249,0.12)]',
            btnClass: 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(232,121,249,0.25)] hover:bg-fuchsia-400',
        },
        {
            tier: 'premium',
            label: 'Premium',
            emoji: '💎',
            desc: 'Core tools unlocked',
            monthlyPrice: 19.99,
            yearlyPrice: null,
            accentClass: 'text-purple-400',
            activeBg: 'bg-purple-500/10 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.12)]',
            btnClass: 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:bg-purple-400',
        },
        {
            tier: 'basic',
            label: 'Basic',
            emoji: '🔹',
            desc: 'Entry level — great for beginners',
            monthlyPrice: 20,
            yearlyPrice: 200,
            accentClass: 'text-white',
            activeBg: 'bg-white/10 border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.06)]',
            btnClass: 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:bg-neutral-100',
        },
    ];

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ onNavigate, onLogout }) => {
    const [user, setUser] = useState<SessionData | null>(null);
    const [daysLeft, setDaysLeft] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    // 2FA State
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [isRecoveryEnabled, setIsRecoveryEnabled] = useState(false);
    const [showVault, setShowVault] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [qrUrl, setQrUrl] = useState('');
    const [secretText, setSecretText] = useState('');

    useEffect(() => {
        const session = getCurrentUser();
        if (!session) {
            onLogout();
            return;
        }
        setUser(session);

        const usersRaw = localStorage.getItem('picklabs_users_db');
        if (usersRaw && session.isPremium) {
            const dbUsers = JSON.parse(usersRaw);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dbUser = dbUsers.find((u: any) => u.id === session.userId);
            if (dbUser && dbUser.premiumExpiresAt) {
                const diffMs = dbUser.premiumExpiresAt - Date.now();
                setDaysLeft(Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
            }
        }
        setIs2FAEnabled(has2FAEnabled(session.email));
        setIsRecoveryEnabled(hasRecoveryCodesEnabled(session.email));
        setLoading(false);
    }, [onLogout]);

    const handleLogout = () => {
        clearAuth();
        onLogout();
        window.location.reload();
    };

    const handleToggle2FA = async () => {
        if (!user) return;
        if (is2FAEnabled) {
            if (window.confirm("Are you sure you want to disable 2FA? This decreases your account security.")) {
                disable2FA(user.email);
                setIs2FAEnabled(false);
                setIsRecoveryEnabled(false);
                setShowVault(false);
                setRecoveryCodes([]);
            }
        } else {
            const res = await enable2FA(user.email);
            if (res) {
                setIs2FAEnabled(true);
                setIsRecoveryEnabled(true);
                setSecretText(res.secret);
                setRecoveryCodes(res.recoveryCodes);
                if (res.qrCodeUrl) {
                    try {
                        const url = await QRCode.toDataURL(res.qrCodeUrl);
                        setQrUrl(url);
                    } catch (err) {
                        console.error("Failed to generate QR Code", err);
                    }
                }
                setShowVault(true);
            }
        }
    };

    const handleToggleRecoveryCodes = async () => {
        if (!user) return;
        if (isRecoveryEnabled) {
            if (window.confirm("Disable Emergency Recovery Codes? If you lose access to your authenticator, you will be locked out.")) {
                disableRecoveryCodes(user.email);
                setIsRecoveryEnabled(false);
                setShowVault(false);
                setRecoveryCodes([]);
            }
        } else {
            const codes = await enableRecoveryCodes(user.email);
            if (codes) {
                setIsRecoveryEnabled(true);
                setRecoveryCodes(codes);
                setShowVault(true);
                setQrUrl('');
                setSecretText('');
            }
        }
    };

    /** Navigate to checkout page for a given tier + duration via App.tsx bridge */
    const goToCheckout = (tier: TierKey, duration: DurationKey = 'month') => {
        const fn = (window as unknown as Record<string, unknown>).__pickLabsCheckout as ((t: TierKey, d: DurationKey) => void) | undefined;
        if (fn) {
            fn(tier, duration);
        } else {
            onNavigate('checkout');
        }
    };

    if (loading || !user) {
        return <div className="p-10 text-center text-white">Loading...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto my-10 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-6 lg:gap-8">

                {/* ── Left Column: Account & Security ── */}
                <div className="flex-1 space-y-6">
                    <div className="terminal-panel p-6 sm:p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 rounded-xl bg-neutral-900 border border-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(13,242,13,0.1)]">
                                <span className="material-symbols-outlined text-primary text-2xl">person</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-wide">Account Portal</h2>
                                <p className="text-sm font-bold text-text-muted">{user.email}</p>
                            </div>
                        </div>

                        {/* Premium Status */}
                        {user.isPremium ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-xl mb-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="material-symbols-outlined text-6xl text-emerald-500">verified</span>
                                </div>
                                <h3 className="text-emerald-400 font-black text-xs uppercase tracking-widest mb-1">Premium Active</h3>
                                <p className="text-4xl font-black text-white my-2">{daysLeft} <span className="text-lg text-emerald-500 tracking-widest uppercase">Days</span></p>
                                <p className="text-text-muted text-xs font-bold">Your access will automatically downgrade when time expires.</p>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-xl mb-6">
                                <h3 className="text-red-400 font-black text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">lock</span> Free Tier
                                </h3>
                                <p className="text-text-muted text-sm mt-2 font-bold">Upgrade to unlock DFS Arbitrage tools and True Win Probabilities.</p>
                            </div>
                        )}

                        <hr className="border-border/50 my-6" />

                        {/* Security */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-sm">shield</span>
                                Security Settings
                            </h3>
                            <div className="bg-neutral-900/80 border border-border-muted rounded-xl p-4 space-y-4">
                                {/* 2FA Toggle */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-0.5">Two-Factor Authentication</h4>
                                        <p className="text-xs font-bold text-text-muted">Secure your account with an authenticator app.</p>
                                    </div>
                                    <button
                                        onClick={handleToggle2FA}
                                        className={`shrink-0 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${is2FAEnabled
                                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                            : 'bg-primary text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(13,242,13,0.2)]'
                                            }`}
                                    >
                                        {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                    </button>
                                </div>

                                <hr className="border-border/40" />

                                {/* Recovery Codes Toggle */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-0.5">Emergency Recovery Codes</h4>
                                        <p className="text-xs font-bold text-text-muted">Backup codes if you lose your authenticator.</p>
                                    </div>
                                    <button
                                        onClick={handleToggleRecoveryCodes}
                                        className={`shrink-0 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isRecoveryEnabled
                                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                            : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 shadow-[0_0_15px_rgba(13,242,13,0.1)]'
                                            }`}
                                    >
                                        {isRecoveryEnabled ? 'Disable Codes' : 'Enable Codes'}
                                    </button>
                                </div>
                            </div>

                            {/* Vault / QR panel */}
                            {showVault && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {qrUrl && (
                                        <div className="bg-neutral-950 border border-primary/20 rounded-xl p-5 text-center">
                                            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-3">Scan with your authenticator app</p>
                                            <div className="bg-white p-2 rounded-xl inline-block">
                                                <img src={qrUrl} alt="2FA QR Code" className="w-36 h-36" />
                                            </div>
                                            <div className="mt-3 bg-black/60 py-2 px-3 rounded-lg border border-primary/10">
                                                <p className="text-primary font-mono font-black text-xs tracking-[0.15em] break-all">{secretText}</p>
                                            </div>
                                            <p className="text-[10px] text-text-muted mt-2 uppercase tracking-widest">Manual Entry Code</p>
                                        </div>
                                    )}
                                    <RecoveryVault codes={recoveryCodes} onClose={() => setShowVault(false)} />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-8 pt-5 border-t border-border/40 flex flex-wrap items-center justify-between gap-4">
                            <button onClick={handleLogout} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors text-xs font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10">
                                <span className="material-symbols-outlined text-sm">logout</span> Log Out
                            </button>
                            <a href="mailto:support@picklabs.app" className="text-red-400/60 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest">
                                Delete Account
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── Right Column: Plans ── */}
                <div className="flex-1 md:max-w-sm">
                    <div className="terminal-panel p-6 sm:p-8 flex flex-col gap-4 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500 text-sm">workspace_premium</span>
                            Choose Your Plan
                        </h3>

                        <p className="text-[10px] text-text-muted -mt-2">
                            Select a plan → pay via CashApp → we upgrade you within 24h.
                        </p>

                        {/* Tier cards */}
                        <div className="space-y-2">
                            {TIER_CARDS.map(card => (
                                <div
                                    key={card.tier}
                                    className="p-4 rounded-xl border bg-neutral-900 border-border-muted transition-all duration-300 hover:border-white/20"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className={`text-sm font-black uppercase tracking-widest ${card.accentClass}`}>
                                                {card.emoji} {card.label}
                                            </span>
                                            <p className="text-[10px] text-text-muted font-bold mt-0.5">{card.desc}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <p className={`text-base font-black italic ${card.accentClass}`}>
                                                ${card.monthlyPrice.toFixed(2)}<span className="text-[10px] text-text-muted font-normal">/mo</span>
                                            </p>
                                            {card.yearlyPrice && (
                                                <p className="text-[10px] text-text-muted">${card.yearlyPrice}/yr</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => goToCheckout(card.tier, 'month')}
                                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${card.btnClass}`}
                                        >
                                            Get {card.label}
                                        </button>
                                        {card.yearlyPrice && (
                                            <button
                                                onClick={() => goToCheckout(card.tier, 'year')}
                                                className="px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border border-border-muted text-text-muted hover:text-white hover:border-white/30 transition-all"
                                            >
                                                Yearly
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Free trial */}
                        <button
                            onClick={() => onNavigate('login-page')}
                            className="w-full py-3 border border-sky-500/30 text-sky-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-sky-500/10 transition-all"
                        >
                            🎁 Start 7-Day Free Trial
                        </button>

                        <p className="text-[9px] text-neutral-600 text-center">
                            Payments verified manually. Upgrades applied within 24h of confirmation.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};
