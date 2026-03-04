import React, { useState, useEffect } from 'react';
import { getCurrentUser, applyVIPCode, logout, SessionData, recordUserSessionLogout } from '../../data/PickLabsAuthDB';
import { clearAuth } from '../../utils/auth';

interface AccountSettingsViewProps {
    onNavigate: (view: string) => void;
    onLogout: () => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ onLogout }) => {
    const [user, setUser] = useState<SessionData | null>(null);
    const [daysLeft, setDaysLeft] = useState<number>(0);
    const [vipCode, setVipCode] = useState('');
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = getCurrentUser();
        if (!session) {
            onLogout();
            return;
        }

        setUser(session);

        // Fetch full user record from DB strictly to calculate days remaining
        const usersRaw = localStorage.getItem('picklabs_users_db');
        if (usersRaw && session.isPremium) {
            const dbUsers = JSON.parse(usersRaw);
            const dbUser = dbUsers.find((u: any) => u.id === session.userId);
            if (dbUser && dbUser.premiumExpiresAt) {
                const diffMs = dbUser.premiumExpiresAt - Date.now();
                setDaysLeft(Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))));
            }
        }
        setLoading(false);
    }, [onLogout]);

    const handleApplyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setMsg('');

        const res = await applyVIPCode(user.email, vipCode);
        setIsError(!res.ok);
        setMsg(res.message);

        if (res.ok) {
            setVipCode('');
            // Optional: refresh user state
            const updated = getCurrentUser();
            if (updated) {
                setUser(updated);
                setDaysLeft(prev => prev + 30);
            }
        }
    };

    const handleLogout = () => {
        const currentUser = getCurrentUser();
        if (currentUser) {
            recordUserSessionLogout(currentUser.id);
        }
        clearAuth();
        onLogout();
        window.location.reload();
    };

    if (loading || !user) {
        return <div className="p-10 text-center text-white">Loading...</div>;
    }

    return (
        <div className="max-w-md mx-auto my-10 p-5">
            <div className="bg-surface border border-border rounded-xl p-8 text-center shadow-2xl">
                <h2 className="text-2xl font-black text-white mb-2">Account Portal</h2>
                <p className="text-text-muted mb-6">{user.email}</p>

                {user.isPremium ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-xl mb-8">
                        <h3 className="text-emerald-400 font-black text-lg m-0 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">stars</span> Premium Active
                        </h3>
                        <p className="text-3xl font-black text-white my-3">{daysLeft} Days Remaining</p>
                        <p className="text-text-muted text-xs">Your access will automatically downgrade when time expires.</p>
                    </div>
                ) : (
                    <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-xl mb-8">
                        <h3 className="text-red-400 font-black text-lg m-0 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">lock</span> Free Tier
                        </h3>
                        <p className="text-text-muted text-sm mt-3">Upgrade to unlock the DFS Arbitrage tools and True Win Probabilities.</p>
                    </div>
                )}

                <hr className="border-border my-8" />

                <h3 className="text-lg font-black text-white mb-3">Renew or Upgrade</h3>
                <p className="text-text-muted text-sm mb-5">
                    CashApp <span className="text-white font-bold">$15</span> to <strong className="text-primary">$PickLabsAdmin</strong> to get a new 30-Day VIP Code.
                </p>

                <form onSubmit={handleApplyCode} className="flex flex-col gap-4">
                    <input
                        type="text"
                        value={vipCode}
                        onChange={e => setVipCode(e.target.value.toUpperCase())}
                        placeholder="Enter VIP Code (e.g. EARLY_ADOPTER_100)"
                        required
                        className="p-3 rounded-lg border border-border bg-background text-white text-center font-black tracking-widest outline-none focus:border-primary/50 transition-colors uppercase placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                    />
                    <button
                        type="submit"
                        className="bg-primary text-black p-3 rounded-lg font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors shadow-lg shadow-primary/20"
                    >
                        Apply 30 Days to Account
                    </button>
                </form>

                {msg && (
                    <div className={`mt-4 p-3 rounded-lg text-sm font-black ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {msg}
                    </div>
                )}

                <div className="mt-10 flex items-center justify-center gap-6">
                    <button onClick={confirmLogout} className="text-text-muted hover:text-white transition-colors text-sm font-bold">
                        Log Out
                    </button>
                    <a href="mailto:support@picklabs.app" className="text-red-400/80 hover:text-red-400 transition-colors text-sm font-bold">
                        Request Account Deletion
                    </a>
                </div>
            </div>
        </div>
    );
};
