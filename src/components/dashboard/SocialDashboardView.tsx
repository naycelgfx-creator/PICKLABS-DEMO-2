import React, { useState } from 'react';

// Mock profiles
type UserProfile = {
    id: string;
    nickname: string;
    avatar: string; // url or generic icon class
    earnings: number;
    winPercent: number;
    isFollowing: boolean;
    recentParlay: string[]; // dummy desc
};

const initialUsers: UserProfile[] = [
    { id: 'u1', nickname: 'BetaKing_99', avatar: 'https://i.pravatar.cc/150?u=u1', earnings: 14250, winPercent: 58.4, isFollowing: true, recentParlay: ['LAL ML', 'Over 225.5 Pts'] },
    { id: 'u2', nickname: 'SharpShooter', avatar: 'https://i.pravatar.cc/150?u=u2', earnings: 104200, winPercent: 64.1, isFollowing: false, recentParlay: ['KC -3.5', 'Mahomes 2+ TDs', 'Kelce Anytime TD'] },
    { id: 'u3', nickname: 'ParlayPrince', avatar: 'https://i.pravatar.cc/150?u=u3', earnings: 450, winPercent: 12.2, isFollowing: false, recentParlay: ['10-Leg Hail Mary'] },
    { id: 'u4', nickname: 'ValueHunter', avatar: 'https://i.pravatar.cc/150?u=u4', earnings: 38900, winPercent: 55.8, isFollowing: true, recentParlay: ['BOS ML', 'NYK +4.5'] }
];

export const SocialDashboardView: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>(initialUsers);

    const toggleFollow = (id: string) => {
        setUsers(users.map(u => u.id === id ? { ...u, isFollowing: !u.isFollowing } : u));
    };

    const copyParlay = (parlay: string[]) => {
        alert(`Copied ${parlay.length}-Leg Parlay to clipboard! (Feature Simulation)`);
    };

    return (
        <div className="w-full bg-[#121212] min-h-[calc(100vh-144px)] flex justify-center py-8 px-4 font-sans text-white">
            <div className="max-w-[1200px] w-full flex flex-col gap-6 animate-fade-in">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-border-muted pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                            <span className="material-symbols-outlined text-accent-blue text-3xl">groups</span>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Social Dashboard</h2>
                            <p className="text-text-muted text-sm font-medium mt-1">Discover sharp bettors, tail their parlays, and track performance.</p>
                        </div>
                    </div>
                </div>

                {/* Main Feed / Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map(user => (
                        <div key={user.id} className="relative bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-600 transition-colors shadow-lg group">

                            {/* Card Background Accent */}
                            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-accent-blue via-primary to-accent-purple opacity-70"></div>

                            <div className="p-5 flex flex-col gap-4">
                                {/* Top: Identity & Stats */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatar} alt={user.nickname} className="w-12 h-12 rounded-full border-2 border-neutral-700 shadow-md" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base text-white tracking-wide">{user.nickname}</span>
                                            <span className="text-xs text-primary font-black uppercase tracking-widest">${user.earnings.toLocaleString()} Profit</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleFollow(user.id)}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors border ${user.isFollowing ? 'bg-white/10 text-white border-white/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30' : 'bg-primary text-black border-primary hover:bg-[#85e600]'}`}
                                    >
                                        {user.isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                </div>

                                {/* Heat/Win Meter */}
                                <div className="flex flex-col gap-1.5 bg-black/40 p-3 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Accuracy</span>
                                        <span className={user.winPercent >= 55 ? 'text-primary' : user.winPercent <= 45 ? 'text-red-400' : 'text-yellow-400'}>{user.winPercent.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${user.winPercent >= 55 ? 'bg-primary' : user.winPercent <= 45 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                            style={{ width: `${user.winPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Recent Play */}
                                <div className="flex flex-col gap-3 mt-1">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Recent Parlay</span>
                                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col gap-2">
                                        <ul className="text-sm text-white/80 font-medium space-y-1">
                                            {user.recentParlay.map((leg, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <div className="w-1 h-1 rounded-full bg-white/30" />
                                                    {leg}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-2 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => copyParlay(user.recentParlay)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors border border-white/5"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                        Copy Parlay
                                    </button>
                                    <button
                                        onClick={() => alert('Shared Profile!')}
                                        className="w-10 h-10 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-white/5"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">share</span>
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};
