import React, { useState } from 'react';
import { getCurrentUser, getAllUsers } from '../../data/PickLabsAuthDB';

export const ReferralDashboardView: React.FC = () => {
    const session = getCurrentUser();
    const [copied, setCopied] = useState(false);

    // Fallbacks if not logged in (should usually be protected by App.tsx)
    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
                <h2 className="text-xl font-black text-text-main mb-2">Please login to view referrals.</h2>
            </div>
        );
    }

    // Get fresh user data to ensure referralsCount is up to date
    const allUsers = getAllUsers();
    const currentUser = allUsers.find(u => u.id === session.userId);

    const myCode = currentUser?.referralCode || 'N/A';
    const myCount = currentUser?.referralsCount || 0;
    const isPremium = currentUser?.isPremium || false;

    // Use window.location.origin to get the base domain dynamically instead of hardcoding
    const shareLink = `${window.location.origin}/signup?ref=${myCode}`;

    const friendsNeeded = Math.max(0, 3 - myCount);
    const statusMsg = isPremium
        ? "You are Premium! 👑"
        : `Invite ${friendsNeeded} more friends to unlock Premium for free.`;

    const progressPercent = Math.min(100, (myCount / 3) * 100);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 md:p-12 mb-20 animate-[fade-in_0.3s_ease-out]">
            <div className="flex flex-col mb-8 text-center">
                <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 transform -rotate-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                    <span className="material-symbols-outlined text-3xl text-emerald-400 font-bold">group_add</span>
                </div>
                <h1 className="text-3xl font-black italic uppercase text-text-main mb-2 tracking-tight">Referrals</h1>
                <p className="text-text-muted text-sm max-w-md mx-auto">
                    Share your unique link. When 3 friends sign up, you automatically unlock lifetime PickLabs Premium.
                </p>
            </div>

            <div className="terminal-panel p-6 md:p-10 border border-neutral-700/60 rounded-2xl shadow-xl flex flex-col items-center text-center">
                <h2 className="text-xl md:text-2xl font-black italic uppercase text-text-main mb-2">Invite Friends, Get Free Picks</h2>

                <p className={`text-sm font-bold ${isPremium ? 'text-amber-400' : 'text-slate-400'}`}>
                    {statusMsg}
                </p>

                {/* Progress Bar */}
                <div className="w-full max-w-sm mt-8 mb-4">
                    <div className="h-4 w-full bg-[#0a0f16] rounded-full overflow-hidden border border-neutral-700/50 shadow-inner relative">
                        <div
                            className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(13,242,13,0.5)]"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">
                    <span className="text-text-main">{myCount}</span> / 3 Friends Referred
                </p>

                <div className="w-full max-w-sm pt-8 border-t border-neutral-700/30">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 text-left">Your Unique Link</h3>
                    <div className="bg-[#0a0f16] border border-neutral-700/60 rounded-xl flex items-center p-1 font-mono text-xs shadow-inner focus-within:border-primary/50 transition-colors">
                        <input
                            type="text"
                            readOnly
                            value={shareLink}
                            className="bg-transparent border-none text-primary flex-1 py-3 px-4 outline-none selection:bg-primary/20"
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <button
                            onClick={handleCopy}
                            className={`shrink-0 h-full px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-neutral-800 text-slate-300 hover:bg-neutral-700 hover:text-white'}`}
                        >
                            {copied ? 'Copied! ✓' : 'Copy'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
