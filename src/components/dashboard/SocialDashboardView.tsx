import React, { useState, useMemo } from 'react';

// Enhanced Mock Profile Type
type UserProfile = {
    id: string;
    nickname: string;
    avatar: string;
    stateLocation: string;
    earnings: number;
    winPercent: number;
    isFollowing: boolean;
    recentParlay: string[];
};

// Generate 50+ Users
const states = ['NY', 'NJ', 'PA', 'OH', 'MI', 'IL', 'MA', 'CT', 'CO', 'NV', 'FL', 'MD', 'VA', 'AZ', 'TN', 'NC'];
const names = ['BetaKing', 'SharpShooter', 'ParlayPrince', 'ValueHunter', 'FadeThePublic', 'DogBettor', 'ClosingLineVP', 'ArbGod', 'TheLocksmith', 'StatHead', 'AlgoPro'];

const generateMockUsers = (count: number): UserProfile[] => {
    return Array.from({ length: count }).map((_, i) => {
        const id = `u${i + 1}`;
        const nameBase = names[Math.floor(Math.random() * names.length)];
        const nickname = `${nameBase}_${Math.floor(Math.random() * 999)}`;
        const stateLocation = states[Math.floor(Math.random() * states.length)];
        // Mix of highly profitable, break even, and heavy losses
        const performanceTier = Math.random();
        let earnings = 0;
        let winPercent = 0;

        if (performanceTier > 0.8) {
            // Hot Bettors
            earnings = Math.floor(Math.random() * 150000) + 10000;
            winPercent = 55 + (Math.random() * 15);
        } else if (performanceTier > 0.3) {
            // Average
            earnings = Math.floor(Math.random() * 10000) - 2000;
            winPercent = 48 + (Math.random() * 6);
        } else {
            // Cold Bettors
            earnings = -Math.floor(Math.random() * 20000) - 1000;
            winPercent = 35 + (Math.random() * 10);
        }

        return {
            id,
            nickname,
            avatar: `https://i.pravatar.cc/150?u=${id}`,
            stateLocation,
            earnings,
            winPercent: Number(winPercent.toFixed(1)),
            isFollowing: Math.random() > 0.8,
            recentParlay: ['LAL ML', 'Over 225.5 Pts', 'LeBron 25+ Pts'].slice(0, Math.floor(Math.random() * 3) + 1)
        };
    });
};

const allMockUsers = generateMockUsers(50);

export const SocialDashboardView: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>(allMockUsers);

    // Sort all users by earnings (highest to lowest)
    const sortedLeaderboard = useMemo(() => {
        return [...users].sort((a, b) => b.earnings - a.earnings);
    }, [users]);

    // Initial featured spots are the top 4
    const [featuredIds, setFeaturedIds] = useState<string[]>(() => sortedLeaderboard.slice(0, 4).map(u => u.id));

    const featuredUsers = useMemo(() => {
        // Map over the featuredIds array to return the user objects, maintaining the order
        const mapped = featuredIds.map(fid => users.find(u => u.id === fid)).filter(Boolean) as UserProfile[];
        // Pad with nulls if we somehow have fewer than 4 features, though we shouldn't
        return mapped.slice(0, 4);
    }, [featuredIds, users]);

    const toggleFollow = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setUsers(users.map(u => u.id === id ? { ...u, isFollowing: !u.isFollowing } : u));
    };

    const copyParlay = (parlay: string[], e?: React.MouseEvent | React.MouseEvent<HTMLTableRowElement>) => {
        if (e) e.stopPropagation();
        alert(`Copied ${parlay.length}-Leg Parlay to clipboard! (Feature Simulation)`);
    };

    const addToFeatured = (userId: string, e?: React.MouseEvent | React.MouseEvent<HTMLButtonElement>) => {
        if (e) e.stopPropagation();
        if (featuredIds.includes(userId)) return; // Already featured

        setFeaturedIds(prev => {
            // Push new ID to the front, remove the last one (oldest) from the 4-slot roster
            const newFeatured = [userId, ...prev];
            return newFeatured.slice(0, 4);
        });
    };

    return (
        <div className="w-full bg-[#121212] min-h-[calc(100vh-144px)] flex justify-center py-8 px-4 font-sans text-white">
            <div className="max-w-[1536px] w-full flex flex-col gap-10 animate-fade-in pb-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-4 border-b border-border-muted pb-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_rgba(163,255,0,0.15)]">
                            <span className="material-symbols-outlined text-primary text-4xl">travel_explore</span>
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Global Leaderboard</h2>
                            <p className="text-white/50 text-sm font-medium mt-1 uppercase tracking-widest">Discover & tail top sharp bettors</p>
                        </div>
                    </div>
                    {/* Metrics Summary Top Right */}
                    <div className="flex gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-white/50 font-bold tracking-widest uppercase">Active Bettors</span>
                            <span className="text-xl font-black text-white">{users.length}</span>
                        </div>
                        <div className="w-px bg-white/10 h-10"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-white/50 font-bold tracking-widest uppercase">Live Tickets</span>
                            <span className="text-xl font-black text-white">1,402</span>
                        </div>
                    </div>
                </div>

                {/* ── Featured Top 4 Row ── */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-xl">star</span>
                        <h3 className="text-xl font-black text-white italic tracking-widest uppercase">Featured Bettors</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredUsers.map(user => (
                            <div key={user.id} className="terminal-panel border-primary/20 hover:shadow-[0_0_15px_rgba(13,242,13,0.1)] transition-shadow overflow-hidden group flex flex-col">

                                {/* Card Edge Glow */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="p-5 flex flex-col gap-4 flex-1">
                                    {/* Top: Identity & Stats */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img src={user.avatar} alt={user.nickname} className="w-12 h-12 rounded border border-border-muted object-cover" />
                                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-900/40 border border-border-muted text-slate-500 text-[8px] font-black px-1 rounded uppercase tracking-widest">{user.stateLocation}</div>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-base text-white truncate max-w-[120px]">{user.nickname}</span>
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${user.earnings >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                    {user.earnings >= 0 ? '+' : '-'}${Math.abs(user.earnings).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Heat/Win Meter */}
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                            <span className="flex items-center gap-1">
                                                Win Rate
                                                {user.winPercent >= 55 && <span className="text-orange-500 text-[10px]">🔥</span>}
                                                {user.winPercent <= 45 && <span className="text-blue-400 text-[10px]">❄️</span>}
                                            </span>
                                            <span className={user.winPercent >= 55 ? 'text-primary' : user.winPercent <= 45 ? 'text-red-400' : 'text-yellow-400'}>{user.winPercent}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${user.winPercent >= 55 ? 'bg-primary' : user.winPercent <= 45 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                                style={{ width: `${user.winPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Recent Play */}
                                    <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-neutral-800">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Live Slip / Picks</span>
                                            <span className="text-[9px] text-primary font-bold uppercase tracking-widest">{user.recentParlay.length} Legs</span>
                                        </div>
                                        <div className="bg-[#0a0a0c] border border-neutral-800 rounded-sm p-2 flex flex-col gap-1">
                                            {user.recentParlay.map((leg, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs text-white/80 font-mono">
                                                    <span>{leg}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                                {/* Full Width Actions Bottom */}
                                <div className="flex w-full mt-auto">
                                    <button
                                        onClick={(e) => copyParlay(user.recentParlay, e)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-neutral-900/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-main text-[10px] font-black uppercase tracking-widest transition-colors border-t border-r border-border-muted"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                        Tail Picks
                                    </button>
                                    <button
                                        onClick={(e) => toggleFollow(user.id, e)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${user.isFollowing ? 'bg-primary/10 text-primary border-t border-border-muted' : 'bg-primary text-black hover:bg-[#8aea00]'}`}
                                    >
                                        {user.isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                {/* ── Leaderboard Table ── */}
                <div className="flex flex-col mt-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-white/50 text-xl">leaderboard</span>
                            <h3 className="text-xl font-black text-white italic tracking-widest uppercase">Global Standings</h3>
                        </div>
                    </div>

                    <div className="w-full terminal-panel overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-border-muted bg-white dark:bg-neutral-900/40 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    <th className="p-4 w-16 text-center">Rank</th>
                                    <th className="p-4">Bettor</th>
                                    <th className="p-4">Location</th>
                                    <th className="p-4 w-48">Win Rate</th>
                                    <th className="p-4 text-right">Profit</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-muted">
                                {sortedLeaderboard.map((user, idx) => {
                                    const isFeatured = featuredIds.includes(user.id);
                                    const isHot = user.winPercent >= 55;
                                    const isCold = user.winPercent <= 45;

                                    return (
                                        <tr key={user.id} onClick={(e) => copyParlay(user.recentParlay, e)} className="cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors group">
                                            <td className="p-4 text-center">
                                                <span className={`text-sm font-bold font-mono ${idx < 4 ? 'text-primary' : 'text-slate-400'}`}>
                                                    #{idx + 1}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={user.avatar} className="w-8 h-8 rounded shrink-0 border border-border-muted" alt="" />
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-text-main text-sm">{user.nickname}</span>
                                                        {isHot && <span className="text-orange-500 text-xs" title="Hot Streak">🔥</span>}
                                                        {isCold && <span className="text-blue-400 text-xs" title="Ice Cold">❄️</span>}
                                                        {isFeatured && <span className="material-symbols-outlined text-primary text-[14px]" title="Currently Featured">star</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-white dark:bg-neutral-900/40 border border-border-muted rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    {user.stateLocation}
                                                </span>
                                            </td>
                                            <td className="p-4 w-48">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold w-10 text-right">{user.winPercent}%</span>
                                                    <div className="h-1.5 flex-1 bg-neutral-900 rounded-full overflow-hidden shrink-0 min-w-[60px]">
                                                        <div
                                                            className={`h-full ${isHot ? 'bg-primary' : isCold ? 'bg-red-500' : 'bg-yellow-500'}`}
                                                            style={{ width: `${user.winPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`text-sm font-black font-mono tracking-wider ${user.earnings >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                    {user.earnings >= 0 ? '+' : '-'}${Math.abs(user.earnings).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => copyParlay(user.recentParlay, e)}
                                                        className="text-slate-400 hover:text-text-main p-1 transition-colors"
                                                        title="Tail Parlay"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => addToFeatured(user.id, e)}
                                                        className={`${isFeatured ? 'text-primary' : 'text-slate-400 hover:text-primary'} p-1 disabled:opacity-50 transition-colors`}
                                                        title={isFeatured ? "Already Featured" : "Pin to Featured"}
                                                        disabled={isFeatured}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">push_pin</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};
