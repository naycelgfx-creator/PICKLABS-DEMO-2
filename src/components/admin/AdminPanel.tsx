import React, { useState, useEffect, useCallback } from 'react';
import {
    getAllUsers, DBUser,
    adminUpgrade, adminDowngrade, adminDelete, adminToggleActive,
    applyVIPCode, VALID_UPGRADE_CODES,
    isAdminEmail, signup,
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

    // Port of: ADMIN_PASSWORD = "picklabs_master_2026"
    const ADMIN_PASSWORD = 'picklabs_master_2026';

    const refresh = useCallback(() => setUsers(getAllUsers()), []);
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

                {/* VIP Code panel */}
                <div className="bg-[#121212] border border-border rounded-2xl p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                        Active VIP Codes — Give out when people CashApp you
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {VALID_UPGRADE_CODES.map(code => (
                            <span
                                key={code}
                                className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-black text-amber-300 tracking-wide font-mono"
                            >
                                {code}
                            </span>
                        ))}
                    </div>
                    <p className="text-[9px] text-text-muted mt-2">
                        To add codes: edit <code className="text-amber-400">VALID_UPGRADE_CODES</code> in{' '}
                        <code className="text-white/50">src/data/PickLabsAuthDB.ts</code>
                    </p>
                </div>

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
        if (typeof window !== 'undefined' && (window as any).gtag) {
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
