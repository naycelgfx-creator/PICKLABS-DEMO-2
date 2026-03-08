import React, { useState, useEffect } from 'react';
import {
    getCurrentUser, SessionData,
} from '../../data/PickLabsAuthDB';
import { clearAuth } from '../../utils/auth';

interface AccountSettingsViewProps {
    onLogout: () => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ onLogout }) => {
    const [user, setUser] = useState<SessionData | null>(null);
    const [daysLeft, setDaysLeft] = useState<number>(0);
    const [loading, setLoading] = useState(true);



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

        setLoading(false);
    }, [onLogout]);

    const handleLogout = () => {
        clearAuth();
        onLogout();
        window.location.reload();
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



            </div>
        </div>
    );
};
