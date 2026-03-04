import React, { useState } from 'react';

// ─── Mock leaderboard data (swap for Supabase/Firebase in production) ──────────

interface LeaderboardUser {
    rank: number;
    username: string;
    avatarInitials: string;
    avatarColor: string;
    winRate: number;     // 0–100
    totalProfit: number; // $ net profit
    bets: number;
    streak: number;      // current win streak
    sport: string;       // best sport
    activePicks: ActivePick[];
}

interface ActivePick {
    game: string;
    pick: string;
    odds: string;
    sport: string;
}

const MOCK_USERS: LeaderboardUser[] = [
    {
        rank: 1, username: 'SharpKing', avatarInitials: 'SK', avatarColor: 'bg-yellow-500',
        winRate: 71, totalProfit: 4820, bets: 183, streak: 7, sport: 'NBA',
        activePicks: [
            { game: 'BOS vs LAL', pick: 'Celtics -4.5', odds: '-110', sport: 'NBA' },
            { game: 'OKC vs SAC', pick: 'Thunder ML', odds: '-130', sport: 'NBA' },
        ],
    },
    {
        rank: 2, username: 'PropGod', avatarInitials: 'PG', avatarColor: 'bg-purple-500',
        winRate: 67, totalProfit: 3210, bets: 294, streak: 4, sport: 'Props',
        activePicks: [
            { game: 'Tatum Props', pick: 'Over 28.5 pts', odds: '-115', sport: 'NBA' },
        ],
    },
    {
        rank: 3, username: 'NascarNate', avatarInitials: 'NN', avatarColor: 'bg-red-500',
        winRate: 65, totalProfit: 2780, bets: 88, streak: 3, sport: 'NASCAR',
        activePicks: [
            { game: 'Daytona 500', pick: 'Kyle Larson Top 3', odds: '+200', sport: 'NASCAR' },
        ],
    },
    {
        rank: 4, username: 'GrindMode', avatarInitials: 'GM', avatarColor: 'bg-emerald-500',
        winRate: 63, totalProfit: 1940, bets: 412, streak: 2, sport: 'NFL',
        activePicks: [],
    },
    {
        rank: 5, username: 'IcePlay', avatarInitials: 'IP', avatarColor: 'bg-cyan-500',
        winRate: 62, totalProfit: 1670, bets: 156, streak: 1, sport: 'NHL',
        activePicks: [
            { game: 'BOS vs TOR', pick: 'Bruins -1.5', odds: '+125', sport: 'NHL' },
        ],
    },
    {
        rank: 6, username: 'EdgeFinder', avatarInitials: 'EF', avatarColor: 'bg-blue-500',
        winRate: 61, totalProfit: 1420, bets: 201, streak: 0, sport: 'MLB',
        activePicks: [],
    },
    {
        rank: 7, username: 'StatKing', avatarInitials: 'ST', avatarColor: 'bg-pink-500',
        winRate: 60, totalProfit: 1180, bets: 177, streak: 3, sport: 'NBA',
        activePicks: [
            { game: 'MIA vs NYK', pick: 'Knicks ML', odds: '+105', sport: 'NBA' },
        ],
    },
    {
        rank: 8, username: 'ValueHunt', avatarInitials: 'VH', avatarColor: 'bg-orange-500',
        winRate: 59, totalProfit: 960, bets: 334, streak: 2, sport: 'CFB',
        activePicks: [],
    },
    {
        rank: 9, username: 'LimeFade', avatarInitials: 'LF', avatarColor: 'bg-lime-500',
        winRate: 58, totalProfit: 810, bets: 98, streak: 1, sport: 'UFC',
        activePicks: [],
    },
    {
        rank: 10, username: 'SilentEdge', avatarInitials: 'SE', avatarColor: 'bg-teal-500',
        winRate: 57, totalProfit: 720, bets: 229, streak: 0, sport: 'Soccer',
        activePicks: [],
    },
];

const RANK_BADGES: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
    React.useEffect(() => {
        const id = setTimeout(onDone, 3000);
        return () => clearTimeout(id);
    }, [onDone]);
    return (
        <div className="fixed bottom-6 right-6 z-[300] flex items-center gap-2 bg-surface border border-emerald-500/40 rounded-xl px-4 py-3 shadow-xl animate-pulse-once">
            <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
            <p className="text-[11px] font-black text-white">{message}</p>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const LeaderboardView: React.FC = () => {
    const [following, setFollowing] = useState<Set<number>>(new Set());
    const [toast, setToast] = useState<string | null>(null);
    const [expandedUser, setExpandedUser] = useState<number | null>(null);

    const handleFollow = (user: LeaderboardUser) => {
        setFollowing(prev => {
            const next = new Set(prev);
            if (next.has(user.rank)) {
                next.delete(user.rank);
                setToast(`Unfollowed @${user.username}`);
            } else {
                next.add(user.rank);
                setToast(`Now following @${user.username}!`);
            }
            return next;
        });
    };

    const handleCopyPicks = (user: LeaderboardUser) => {
        if (user.activePicks.length === 0) {
            setToast(`@${user.username} has no active picks right now`);
            return;
        }
        // In production: dispatch these picks to BetSlip
        setToast(`Copied ${user.activePicks.length} pick${user.activePicks.length > 1 ? 's' : ''} from @${user.username} ✓`);
    };

    return (
        <div className="max-w-[1440px] mx-auto p-6 space-y-6">
            {/* ── Lab Research Header ── */}
            <div className="relative p-5 overflow-hidden" style={{ background: 'rgba(6,8,14,0.95)', border: '1px solid rgba(12,168,16,0.18)', borderRadius: '4px' }}>
                {/* Corner ticks */}
                <div className="absolute top-0 left-0 w-4 h-4" style={{ borderTop: '2px solid rgba(12,168,16,0.7)', borderLeft: '2px solid rgba(12,168,16,0.7)' }} />
                <div className="absolute top-0 right-0 w-4 h-4" style={{ borderTop: '2px solid rgba(12,168,16,0.7)', borderRight: '2px solid rgba(12,168,16,0.7)' }} />
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center flex-none" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '2px' }}>
                        <span className="material-symbols-outlined text-[18px]" style={{ color: 'rgba(212,175,55,0.8)' }}>science</span>
                    </div>
                    <div>
                        <p className="lab-label" style={{ color: 'rgba(12,168,16,0.5)', marginBottom: '2px' }}>[ RESEARCH RANKINGS — CURRENT CYCLE ]</p>
                        <h1 className="text-[15px] font-black text-text-main uppercase tracking-wider">Community Leaderboard</h1>
                        <p className="lab-label mt-0.5">Top 10 most profitable analysts · Updates daily at midnight ET</p>
                    </div>
                    <div className="ml-auto flex gap-6 text-center">
                        {[['183', 'AVG BETS'], ['64%', 'AVG WIN'], ['$1.8K', 'AVG PROFIT']].map(([val, label]) => (
                            <div key={label}>
                                <p className="readout-value text-base" style={{ color: 'rgb(212,175,55)' }}>{val}</p>
                                <p className="lab-label mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Research Data Table ── */}
            <div className="terminal-panel overflow-hidden">
                {/* Table column headers */}
                <div className="grid grid-cols-12 px-5 py-2.5" style={{ borderBottom: '1px solid rgba(12,168,16,0.1)', background: 'rgba(12,168,16,0.025)' }}>
                    {[['#', 1], ['ANALYST', 3], ['ACCURACY', 1], ['P/L', 1], ['SAMPLES', 1], ['SERIES', 1], ['FIELD', 1], ['ACTIONS', 2]].map(([h, span]) => (
                        <div key={h} className={`col-span-${span} lab-label`}>
                            {h}
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {MOCK_USERS.map(user => (
                    <React.Fragment key={user.rank}>
                        <div
                            className={`grid grid-cols-12 px-5 py-3.5 items-center cursor-pointer transition-all ${user.rank === 1 ? 'hover:bg-yellow-500/[0.04] bg-yellow-500/[0.015]' :
                                    user.rank === 2 ? 'hover:bg-white/[0.02]' :
                                        user.rank === 3 ? 'hover:bg-orange-500/[0.02]' :
                                            'hover:bg-white/[0.015]'
                                } ${expandedUser === user.rank ? 'bg-white/[0.03]' : ''}`}
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                            onClick={() => setExpandedUser(expandedUser === user.rank ? null : user.rank)}
                        >
                            {/* Rank */}
                            <div className="col-span-1 flex items-center">
                                {RANK_BADGES[user.rank]
                                    ? <span className="text-lg leading-none">{RANK_BADGES[user.rank]}</span>
                                    : <span className="readout-value text-[11px] text-slate-600">#{String(user.rank).padStart(2, '0')}</span>
                                }
                            </div>

                            {/* Analyst */}
                            <div className="col-span-3 flex items-center gap-2">
                                <div className={`w-8 h-8 flex-none flex items-center justify-center text-[10px] font-black text-white ${user.avatarColor}`} style={{ borderRadius: '2px' }}>
                                    {user.avatarInitials}
                                </div>
                                <div>
                                    <p className="readout-value text-[11px] text-white">@{user.username}</p>
                                    {following.has(user.rank) && (
                                        <p className="lab-label" style={{ color: 'rgba(12,168,16,0.7)' }}>◈ TRACKING</p>
                                    )}
                                </div>
                            </div>

                            {/* Accuracy */}
                            <div className="col-span-1">
                                <p className="readout-value text-[12px] text-primary">{user.winRate}%</p>
                            </div>

                            {/* P/L */}
                            <div className="col-span-1">
                                <p className="readout-value text-[12px] text-text-main">+${user.totalProfit.toLocaleString()}</p>
                            </div>

                            {/* Samples */}
                            <div className="col-span-1">
                                <p className="readout-value text-[12px] text-text-muted">{user.bets}</p>
                            </div>

                            {/* Streak — series indicator */}
                            <div className="col-span-1">
                                {user.streak > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 lab-label" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '2px', color: 'rgb(251,146,60)' }}>
                                        ▶ {user.streak}W
                                    </span>
                                ) : (
                                    <span className="readout-value text-[11px] text-slate-700">—</span>
                                )}
                            </div>

                            {/* Field */}
                            <div className="col-span-1">
                                <span className="lab-label inline-block px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px' }}>{user.sport}</span>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex gap-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                    onClick={() => handleFollow(user)}
                                    className={`px-2 py-1 lab-label transition-all`}
                                    style={{
                                        background: following.has(user.rank) ? 'rgba(12,168,16,0.1)' : 'rgba(255,255,255,0.03)',
                                        border: following.has(user.rank) ? '1px solid rgba(12,168,16,0.35)' : '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: '2px',
                                        color: following.has(user.rank) ? 'rgb(12,168,16)' : 'rgba(100,120,155,0.8)'
                                    }}
                                >
                                    {following.has(user.rank) ? '[✓ TRACK]' : '[+ TRACK]'}
                                </button>
                                <button
                                    onClick={() => handleCopyPicks(user)}
                                    disabled={user.activePicks.length === 0}
                                    className="px-2 py-1 lab-label transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '2px' }}
                                >
                                    [COPY]
                                </button>
                            </div>
                        </div>

                        {/* Expanded picks row — lab specimen data */}
                        {expandedUser === user.rank && user.activePicks.length > 0 && (
                            <div className="px-5 py-3" style={{ background: 'rgba(12,168,16,0.025)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <p className="lab-label mb-3" style={{ color: 'rgba(12,168,16,0.5)' }}>
                                    [ ACTIVE SPECIMENS — @{user.username} ]
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {user.activePicks.map((pick, i) => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2" style={{ background: 'rgba(4,6,10,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                                            <div>
                                                <p className="readout-value text-[11px] text-white">{pick.pick}</p>
                                                <p className="lab-label mt-0.5">{pick.game} · {pick.odds}</p>
                                            </div>
                                            <button
                                                onClick={() => handleCopyPicks(user)}
                                                className="ml-2 px-2 py-1 lab-label transition-all"
                                                style={{ background: 'rgba(12,168,16,0.1)', border: '1px solid rgba(12,168,16,0.3)', borderRadius: '2px', color: 'rgb(12,168,16)' }}
                                            >
                                                [ADD]
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {expandedUser === user.rank && user.activePicks.length === 0 && (
                            <div className="px-5 py-3 bg-white/3 border-b border-border text-center text-[10px] text-text-muted font-black">
                                @{user.username} has no active picks right now
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Toast */}
            {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </div>
    );
};
