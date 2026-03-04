import React, { useState, useEffect } from 'react';
import { getAllUsers, DBUser, getCurrentUser, isAdminEmail } from '../../data/PickLabsAuthDB';

export const AdminAnalyticsView: React.FC = () => {
    const [users, setUsers] = useState<DBUser[]>([]);
    const currentUser = getCurrentUser();

    useEffect(() => {
        // Enforce Admin Only Access
        if (currentUser && isAdminEmail(currentUser.email)) {
            setUsers(getAllUsers());
        }
    }, [currentUser]);

    const formatDuration = (ms?: number) => {
        if (!ms) return '0m';
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        return `${minutes}m`;
    };

    if (!currentUser || !isAdminEmail(currentUser.email)) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <span className="material-symbols-outlined text-[48px] text-red-500 mb-4">gpp_maybe</span>
                <h2 className="text-xl font-black uppercase tracking-widest text-text-main mb-2">Access Denied</h2>
                <p className="text-sm font-bold text-text-muted">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 h-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                    <span className="material-symbols-outlined text-primary text-2xl animate-pulse">monitoring</span>
                </div>
                <div>
                    <h1 className="text-2xl font-black italic uppercase text-text-main tracking-widest">Admin Analytics</h1>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">User Tracking & Metrics</p>
                </div>
            </div>

            <div className="bg-neutral-900 border border-border-muted rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-950/80 border-b border-border-muted">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">User Email</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Tier</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Last IP Address</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Session Time</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Daily Bets</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Referrals</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-muted/50">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-neutral-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center border border-border-muted shrink-0">
                                                <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                            </div>
                                            <span className="text-sm font-bold text-text-main">{user.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${user.isPremium
                                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            : isAdminEmail(user.email)
                                                ? 'bg-primary/10 text-primary border-primary/20'
                                                : 'bg-neutral-800 text-slate-400 border-border-muted'
                                            }`}>
                                            {isAdminEmail(user.email) ? 'ADMIN' : user.isPremium ? 'PRO/PREM' : 'FREE'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.lastKnownIp ? (
                                            <div className="flex items-center gap-1.5 cursor-crosshair group" title="Mocked local IP">
                                                <span className="material-symbols-outlined text-[14px] text-slate-500 group-hover:text-primary transition-colors">router</span>
                                                <span className="text-xs font-mono text-slate-300 group-hover:text-text-main transition-colors">{user.lastKnownIp}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-600 italic">Never logged in</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 rounded-lg border border-border-muted">
                                            <span className="material-symbols-outlined text-[14px] text-slate-500">timer</span>
                                            <span className="text-xs font-bold text-text-main font-mono">{formatDuration(user.sessionDurationMs)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="inline-flex items-center justify-center min-w-[32px] h-8 bg-neutral-950 rounded-lg border border-border-muted">
                                            <span className={`text-sm font-black p-2 ${user.dailyBetsCount && user.dailyBetsCount > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                                                {user.dailyBetsCount || 0}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="inline-flex flex-col items-end">
                                            <span className="text-xs font-black text-white">{user.referralsCount || 0}</span>
                                            <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Invites</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center">
                                        <span className="text-slate-500 font-bold text-sm tracking-widest uppercase">No users found in database.</span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-6 text-center">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Showing all {users.length} registered accounts. Metrics reset daily at midnight GMT.
                </p>
            </div>
        </div>
    );
};
