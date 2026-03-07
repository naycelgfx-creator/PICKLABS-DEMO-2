import React, { useState, useEffect, useCallback } from 'react';
import {
    getAllUsers, DBUser,
    adminUpgrade, adminDowngrade, adminDelete, adminToggleActive,
    applyVIPCode, generateVIPCode,
    isAdminEmail, signup,
    TierKey, DurationKey,
    getAllPendingPayments, approvePendingPayment, rejectPendingPayment, PendingPayment,
    getAdminMathWindow, setAdminMathWindow
} from '../../data/PickLabsAuthDB';

// ─── AdminPanel ───────────────────────────────────────────────────────────────
// Port of Flask /admin_panel route + /admin_action buttons + admin_logout.

interface AdminPanelProps {
    currentUserEmail: string;
    onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUserEmail, onClose }) => {
    const [users, setUsers] = useState<DBUser[]>([]);
    const [adminPass, setAdminPass] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(isAdminEmail(currentUserEmail));
    const [error, setError] = useState('');
    const [toast, setToast] = useState<string | null>(null);
    // VIP Code Generator state
    const [genTier, setGenTier] = useState<TierKey>('pro');
    const [genDuration, setGenDuration] = useState<DurationKey>('month');
    const [lastCode, setLastCode] = useState<string | null>(null);
    // Math Prediction Window
    const [mathWindow, setMathWindow] = useState<number>(getAdminMathWindow());
    // Payment queue
    const [payments, setPayments] = useState<PendingPayment[]>([]);
    const [showAll, setShowAll] = useState(false);

    // Port of: ADMIN_PASSWORD = "picklabs_master_2026"
    const ADMIN_PASSWORD = 'picklabs_master_2026';

    const refresh = useCallback(() => {
        setUsers(getAllUsers());
        setPayments(getAllPendingPayments());
    }, []);
    useEffect(() => { if (isUnlocked) refresh(); }, [isUnlocked, refresh]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminPass === ADMIN_PASSWORD) {
            setIsUnlocked(true);
        } else {
            setError('🛑 Wrong master password.');
        }
    };

    const handleAction = (userId: string, action: 'upgrade' | 'downgrade' | 'delete' | 'toggleActive') => {
        if (action === 'upgrade') adminUpgrade(userId);
        if (action === 'downgrade') adminDowngrade(userId);
        if (action === 'delete') adminDelete(userId);
        if (action === 'toggleActive') adminToggleActive(userId);
        refresh();
        showToast(
            action === 'delete' ? '🗑 User deleted.' :
                action === 'upgrade' ? '⭐ Upgraded to Premium!' :
                    action === 'downgrade' ? '↓ Downgraded to Free.' :
                        '🔄 User active status toggled.'
        );
    };

    // ── Lock screen ──────────────────────────────────────────────────────────
    if (!isUnlocked) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="bg-[#121212] border border-border rounded-2xl p-8 w-full max-w-sm space-y-5 shadow-2xl">
                    <div className="text-center space-y-1">
                        <span className="material-symbols-outlined text-5xl text-red-400">gpp_bad</span>
                        <h2 className="text-xl font-black uppercase text-white">🛑 Restricted Area</h2>
                        <p className="text-[10px] text-text-muted">PickLabs Admin Command Center</p>
                    </div>
                    <form onSubmit={handleUnlock} className="space-y-3">
                        <input
                            type="password"
                            value={adminPass}
                            onChange={e => { setAdminPass(e.target.value); setError(''); }}
                            placeholder="Master Password"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] text-white outline-none focus:border-red-400/40"
                        />
                        {error && <p className="text-red-400 text-[11px] font-black">{error}</p>}
                        <button
                            type="submit"
                            className="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
                        >
                            Enter God Mode
                        </button>
                    </form>
                    <button onClick={onClose} className="w-full text-[10px] text-text-muted hover:text-white transition-colors">Cancel</button>
                </div>
            </div>
        );
    }

    const premiumCount = users.filter(u => u.isPremium).length;
    const mrr = premiumCount * 15;

    const handleDownloadCSV = () => {
        const headers = ['User ID', 'Email', 'Is Premium', 'Premium Expires', 'Referrals', 'Sign Up Date'];
        const rows = users.map(user => [
            user.id,
            user.email,
            user.isPremium ? 'True' : 'False',
            user.premiumExpiresAt ? new Date(user.premiumExpiresAt).toLocaleDateString() : 'N/A',
            user.referralsCount || 0,
            new Date(user.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `PickLabs_Backup_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('💾 Database backup downloaded successfully.');
    };

    // ── Main dashboard ───────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 backdrop-blur-md overflow-y-auto p-4 pt-8">
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[12px] font-black">
                    {toast}
                </div>
            )}
            <div className="w-full max-w-4xl space-y-5">
                {/* Header */}
                <div className="bg-[#121212] border border-border rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-amber-400 text-2xl">admin_panel_settings</span>
                        <div>
                            <h2 className="text-[15px] font-black uppercase text-white tracking-wide">👑 PickLabs Admin Command Center</h2>
                            <p className="text-[9px] text-text-muted">Port of Flask /admin_panel · Data persists in localStorage</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[9px] text-text-muted uppercase tracking-widest">MRR</p>
                            <p className="text-2xl font-black text-amber-400">${mrr}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-text-muted uppercase tracking-widest">Total Users</p>
                            <p className="text-2xl font-black text-white">{users.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-text-muted uppercase tracking-widest">Premium</p>
                            <p className="text-2xl font-black text-emerald-400">{premiumCount}</p>
                        </div>
                        <div className="flex flex-col gap-2 border-l border-white/10 pl-4 ml-2">
                            <button
                                onClick={handleDownloadCSV}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 hover:bg-indigo-500/20 transition-all uppercase tracking-wide"
                            >
                                <span className="material-symbols-outlined text-[12px]">download</span>
                                Download DB Backup
                            </button>
                            <button
                                onClick={() => { setIsUnlocked(false); onClose(); }}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white/5 text-[9px] font-black uppercase text-text-muted hover:text-white transition-all tracking-wide"
                            >
                                <span className="material-symbols-outlined text-[13px]">lock</span>
                                Lock
                            </button>
                        </div>
                    </div>
                </div>

                {/* Math Prediction Settings */}
                <div className="bg-[#121212] border border-blue-500/20 rounded-2xl p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">calculate</span>
                        Math Prediction Logic
                    </p>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-text-muted uppercase tracking-widest">Prediction Window Frame</label>
                            <p className="text-[10px] text-text-muted mb-1">
                                Controls the number of previous games the AI studies app-wide.
                            </p>
                            <div className="flex gap-2">
                                {[5, 10, 20].map(w => (
                                    <button
                                        key={w}
                                        onClick={() => {
                                            setMathWindow(w);
                                            setAdminMathWindow(w);
                                            showToast(`🔄 Global AI math window set tracking last ${w} games.`);
                                        }}
                                        className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${mathWindow === w
                                            ? 'bg-blue-500/20 border-blue-500/60 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                            : 'bg-[#1e1e1e] border-border-muted text-text-muted hover:border-blue-500/30 hover:text-white'}`}
                                    >
                                        {w} Games
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* VIP Code Generator */}
                <div className="bg-[#121212] border border-amber-500/20 rounded-2xl p-5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">confirmation_number</span>
                        VIP Code Generator
                    </p>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-text-muted uppercase tracking-widest">Tier</label>
                            <div className="flex gap-1">
                                {(['basic', 'premium', 'pro'] as TierKey[]).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setGenTier(t)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${genTier === t
                                            ? t === 'pro' ? 'bg-primary/20 border-primary/60 text-primary'
                                                : t === 'premium' ? 'bg-purple-500/20 border-purple-500/60 text-purple-400'
                                                    : 'bg-white/20 border-white/40 text-white'
                                            : 'border-border-muted text-text-muted hover:border-white/20'}`}
                                    >
                                        {t === 'pro' ? '⚡ Pro' : t === 'premium' ? '💎 Premium' : '🔹 Basic'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-text-muted uppercase tracking-widest">Duration</label>
                            <div className="flex gap-1">
                                {(['month', 'year'] as DurationKey[]).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setGenDuration(d)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${genDuration === d ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'border-border-muted text-text-muted hover:border-amber-500/30'}`}
                                    >
                                        {d === 'month' ? '1 Month' : '1 Year'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const code = generateVIPCode('admin', genTier, genDuration);
                                setLastCode(code);
                                showToast(`✅ Code generated: ${code}`);
                            }}
                            className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all"
                        >
                            Generate Code
                        </button>
                    </div>
                    {lastCode && (
                        <div className="flex items-center gap-3 bg-black/50 rounded-xl border border-amber-500/20 p-3">
                            <span className="font-mono text-amber-300 text-sm font-black tracking-[2px] flex-1">{lastCode}</span>
                            <button
                                onClick={() => { navigator.clipboard.writeText(lastCode); showToast('📋 Code copied!'); }}
                                className="text-text-muted hover:text-amber-400 transition-colors"
                                title="Copy"
                            >
                                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            </button>
                        </div>
                    )}
                    <p className="text-[9px] text-text-muted">
                        Codes are stored in localStorage under <code className="text-amber-400">picklabs_vip_codes</code>. Send the generated code to the user after they CashApp you.
                    </p>
                </div>

                {/* Payment Queue */}
                {(() => {
                    const pendingPayments = showAll ? payments : payments.filter(p => p.status === 'pending');
                    const pendingCount = payments.filter(p => p.status === 'pending').length;
                    return (
                        <div className="bg-[#121212] border border-emerald-500/20 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">payments</span>
                                    CashApp Payment Queue
                                    {pendingCount > 0 && (
                                        <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full">
                                            {pendingCount} PENDING
                                        </span>
                                    )}
                                </p>
                                <button
                                    onClick={() => setShowAll(p => !p)}
                                    className="text-[9px] text-text-muted hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    {showAll ? 'Show Pending Only' : 'Show All'}
                                </button>
                            </div>

                            {pendingPayments.length === 0 ? (
                                <p className="text-[11px] text-text-muted text-center py-4">
                                    {showAll ? 'No payment records yet.' : '✅ No pending payments.'}
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-border mt-3">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-border bg-[#1e1e1e]">
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Date Submitted</th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">User ID</th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Requested Tier</th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted">Cash App $Cashtag</th>
                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingPayments.map(pmt => (
                                                <tr key={pmt.id} className={`border-b border-border/50 transition-all ${pmt.status === 'approved' ? 'bg-emerald-500/5' : pmt.status === 'rejected' ? 'bg-red-500/5 opacity-60' : 'bg-neutral-900 hover:bg-white/[0.02]'}`}>
                                                    <td className="px-4 py-3 text-[10px] text-text-muted whitespace-nowrap">
                                                        {new Date(pmt.submittedAt).toLocaleDateString()} {new Date(pmt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-4 py-3 text-[11px] font-bold text-white">
                                                        {pmt.userEmail}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${pmt.tier === 'pro' ? 'bg-primary/10 text-primary border border-primary/20' : pmt.tier === 'premium_plus' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : pmt.tier === 'premium' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-white/10 text-white/80 border border-white/20'}`}>
                                                            {pmt.tier === 'pro' ? '⚡ Pro' : pmt.tier === 'premium_plus' ? '⭐ Premium+' : pmt.tier === 'premium' ? '💎 Premium' : '🔹 Basic'}
                                                            <span className="opacity-50 ml-1 text-[8px]">({pmt.duration})</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-[12px] font-mono font-black text-primary">
                                                        {pmt.cashappCashtag}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {pmt.status === 'pending' ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            const res = approvePendingPayment(pmt.id, 'admin');
                                                                            showToast(res.message);
                                                                            refresh();
                                                                        }}
                                                                        className="px-4 py-2 rounded-lg bg-emerald-500 border border-emerald-400 text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const res = rejectPendingPayment(pmt.id);
                                                                            showToast(res.message);
                                                                            refresh();
                                                                        }}
                                                                        className="px-4 py-2 rounded-lg bg-red-600 border border-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${pmt.status === 'approved' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                    {pmt.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* Users table — port of Flask HTML <table> */}
                <div className="bg-[#121212] border border-border rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-[#1e1e1e]">
                                {['ID', 'Email', 'Status', 'Joined', 'Actions'].map(h => (
                                    <th key={h} className={`px-4 py-3 text-[9px] font-black uppercase tracking-widest text-text-muted ${h === 'Actions' ? 'text-center' : 'text-left'}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-all">
                                    <td className="px-4 py-3 text-[10px] text-text-muted font-mono">{u.id.slice(0, 8)}…</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[12px] font-black text-white">{u.email}</span>
                                            {isAdminEmail(u.email) && (
                                                <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">Admin</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[11px] font-black ${u.isActive === false ? 'text-red-400' : (u.isPremium ? 'text-emerald-400' : 'text-text-muted')}`}>
                                            {u.isActive === false ? '⛔ DEACTIVATED' : (u.isPremium ? '⭐ PREMIUM' : 'Free User')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[10px] text-text-muted">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {/* Port of: <button name="action" value="upgrade"> */}
                                            <button
                                                onClick={() => handleAction(u.id, 'upgrade')}
                                                disabled={u.isPremium}
                                                className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >Upgrade</button>
                                            {/* Port of: <button name="action" value="downgrade"> */}
                                            <button
                                                onClick={() => handleAction(u.id, 'downgrade')}
                                                disabled={!u.isPremium || isAdminEmail(u.email)}
                                                className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >Downgrade</button>
                                            {/* Port of: <button name="action" value="delete"> */}
                                            <button
                                                onClick={() => { if (window.confirm(`Delete ${u.email}?`)) handleAction(u.id, 'delete'); }}
                                                disabled={isAdminEmail(u.email)}
                                                className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >Delete</button>
                                            <button
                                                onClick={() => handleAction(u.id, 'toggleActive')}
                                                disabled={isAdminEmail(u.email)}
                                                className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase bg-stone-500/15 border border-stone-500/30 text-stone-400 hover:bg-stone-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            >{u.isActive === false ? 'Activate' : 'Deactivate'}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-text-muted text-[12px]">No users yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ─── VIPUpgradeModal (port of Flask /upgrade route) ──────────────────────────

interface VIPUpgradeModalProps {
    currentEmail: string;
    onClose: () => void;
    onUpgraded: () => void;
}

export const VIPUpgradeModal: React.FC<VIPUpgradeModalProps> = ({ currentEmail, onClose, onUpgraded }) => {
    const [email, setEmail] = useState(currentEmail);
    const [code, setCode] = useState('');
    const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Fire Google Analytics Event for Paywall Conversion Attempt
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window !== 'undefined' && (window as any).gtag) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).gtag('event', 'clicked_upgrade_paywall', {
                'event_category': 'monetization',
                'event_label': 'Dashboard Paywall Button',
                'value': 15.00
            });
        }

        setTimeout(() => {
            const res = applyVIPCode(email, code.trim().toUpperCase());
            setResult(res);
            setLoading(false);
            if (res.ok) setTimeout(onUpgraded, 1500);
        }, 600);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-[#121212] border border-border rounded-2xl p-8 w-full max-w-sm space-y-5 shadow-2xl">
                <div className="text-center space-y-1">
                    <span className="material-symbols-outlined text-4xl text-amber-400">workspace_premium</span>
                    <h2 className="text-xl font-black uppercase text-white">Unlock PickLabs Premium</h2>
                    <p className="text-[11px] text-text-muted">
                        CashApp $15 to <span className="text-amber-400 font-black">$PickLabsAdmin</span> to get your Secret VIP Code.
                    </p>
                </div>
                {result ? (
                    <div className={`rounded-xl border p-4 text-center ${result.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <p className={`font-black text-[13px] ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>{result.message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <p className="text-[9px] font-black uppercase text-text-muted mb-1">Account Email</p>
                            <input
                                title="Account Email"
                                placeholder="Enter email"
                                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-white outline-none focus:border-amber-400/40"
                            />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase text-text-muted mb-1">Secret VIP Code</p>
                            <input
                                type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                                placeholder="e.g. CASHAPP_VIP_2026" required
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-white font-mono uppercase placeholder:normal-case placeholder:text-text-muted outline-none focus:border-amber-400/40"
                            />
                        </div>
                        <button
                            type="submit" disabled={loading}
                            className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-widest hover:bg-amber-500/30 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Verifying…' : 'Unlock Premium'}
                        </button>
                    </form>
                )}
                <button onClick={onClose} className="w-full text-[10px] text-text-muted hover:text-white transition-colors text-center">Cancel</button>
            </div>
        </div>
    );
};

// ─── SignupModal (port of Flask /signup route) ────────────────────────────────

interface SignupModalProps {
    onClose: () => void;
    onSuccess: (email: string) => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({ onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Check for referral code in the URL
            const urlParams = new URLSearchParams(window.location.search);
            const refCode = urlParams.get('ref') || undefined;

            const res = await signup(email, password, refCode);
            setResult(res);
            if (res.ok) setTimeout(() => onSuccess(email), 1500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-[#121212] border border-border rounded-2xl p-8 w-full max-w-sm space-y-5 shadow-2xl">
                <div className="text-center space-y-1">
                    <span className="material-symbols-outlined text-4xl text-primary">person_add</span>
                    <h2 className="text-xl font-black uppercase text-white">Create PickLabs Account</h2>
                    <p className="text-[11px] text-text-muted">Free tier · Upgrade anytime with a VIP code</p>
                </div>
                {result ? (
                    <div className={`rounded-xl border p-4 text-center ${result.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <p className={`font-black text-[13px] ${result.ok ? 'text-emerald-400' : 'text-red-400'}`}>{result.message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="name@example.com" required
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-white outline-none focus:border-primary/40"
                        />
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="Password (min 6 chars)" minLength={6} required
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-white outline-none focus:border-primary/40"
                        />
                        <button
                            type="submit" disabled={loading}
                            className="w-full py-2.5 rounded-xl bg-primary/20 border border-primary/40 text-primary text-[11px] font-black uppercase tracking-widest hover:bg-primary/30 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Creating account…' : 'Sign Up for Free'}
                        </button>
                    </form>
                )}
                <button onClick={onClose} className="w-full text-[10px] text-text-muted hover:text-white transition-colors text-center">Cancel</button>
            </div>
        </div>
    );
};
