import React from 'react';

export type ViewType = 'live-board' | 'matchup-terminal' | 'sharp-tools' | 'bankroll' | 'teams-directory' | 'popular-bets' | 'saved-picks' | 'value-finder' | 'landing-page' | 'login-page' | 'sportsbook' | 'ai-dashboard' | 'social-dashboard' | 'player-props' | 'trends' | 'live-odds' | 'leaderboard' | 'referrals' | 'account' | 'settings' | '3d-board';

export const PremiumLockView: React.FC<{ featureName: string; onNavigate: (v: ViewType) => void }> = ({ featureName, onNavigate }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <span className="material-symbols-outlined text-4xl text-amber-500">lock</span>
            </div>
            <h2 className="text-3xl font-black italic uppercase text-text-main mb-3 tracking-tight">
                Premium Feature
            </h2>
            <p className="text-sm text-text-muted max-w-md mb-8 leading-relaxed">
                <span className="text-amber-500 font-bold">{featureName}</span> is exclusive to PickLabs Premium members. Upgrade your account to unlock advanced analytics and AI-driven insights.
            </p>
            <button
                onClick={() => onNavigate('landing-page')}
                className="px-8 py-4 bg-amber-500 text-neutral-900 font-black uppercase tracking-[0.2em] italic rounded-xl hover:bg-amber-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center gap-2"
            >
                <span className="material-symbols-outlined">workspace_premium</span>
                Upgrade to Premium
            </button>
        </div>
    );
};
