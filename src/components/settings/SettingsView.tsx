import { useSettings, AIRiskMode } from '../../contexts/SettingsContext';
import { getCurrentUser, getAllUsers } from '../../data/PickLabsAuthDB';
import { useState, useEffect } from 'react';

const AVAILABLE_SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF', 'Tennis', 'PGA'];

export const SettingsView = () => {
    const { settings, updateSettings, resetSettings } = useSettings();

    const toggleSport = (sport: string) => {
        const isEnabled = settings.enabledSports.includes(sport);
        const newSports = isEnabled
            ? settings.enabledSports.filter(s => s !== sport)
            : [...settings.enabledSports, sport];
        updateSettings({ enabledSports: newSports });
    };

    const handleRiskModeChange = (mode: AIRiskMode) => {
        updateSettings({ aiRiskMode: mode });
    };

    const session = getCurrentUser();
    const isPremium = session?.isPremium;
    const dbUser = session ? getAllUsers().find(u => u.id === session.userId) : null;

    // Calculate days remaining in 7-day trial
    const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(0);

    useEffect(() => {
        if (dbUser && !isPremium) {
            const createdAt = dbUser.createdAt;
            const now = Date.now();
            const elapsed = now - createdAt;
            const daysElapsed = Math.floor(elapsed / (1000 * 60 * 60 * 24));
            const remaining = Math.max(0, 7 - daysElapsed);
            setTrialDaysRemaining(remaining);
        }
    }, [dbUser, isPremium]);

    return (
        <div className="max-w-[1440px] mx-auto p-6 animate-fade-in pb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-3xl text-primary">settings</span>
                        <h1 className="m-0 text-3xl font-black text-text-main italic uppercase tracking-tight">Experience Settings</h1>
                    </div>
                    <p className="m-0 text-text-muted text-sm font-medium">Customize your PickLabs algorithm, risk parameters, and dashboard preferences.</p>
                </div>
                <button
                    onClick={resetSettings}
                    className="text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded uppercase hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                    Reset to Defaults
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Core Settings */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* 7-Day Trial Countdown (Only for Free Users) */}
                    {!isPremium && (
                        <div className="lab-card p-6 border-t-[3px] border-t-orange-500 bg-gradient-to-r from-neutral-900 to-orange-900/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black italic uppercase text-white tracking-widest flex items-center gap-2 mb-1">
                                        <span className="material-symbols-outlined text-orange-500">timer</span>
                                        Free Trial Period
                                    </h2>
                                    <p className="text-xs text-text-muted">Your PickLabs premium trial automatically counts down.</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-orange-500 font-mono leading-none">
                                        {trialDaysRemaining} <span className="text-sm text-orange-500/50 uppercase tracking-widest">Days</span>
                                    </div>
                                    <div className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-1">
                                        Remaining
                                    </div>
                                </div>
                            </div>
                            {trialDaysRemaining <= 0 && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                                    <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Trial Expired. Upgrade to access premium features.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Risk Mode */}
                    <div className="lab-card p-6 border-t-[3px] border-t-accent-purple">
                        <h2 className="text-xl font-black italic uppercase text-white tracking-widest flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-accent-purple">model_training</span>
                            AI Risk Mode
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Safe Mode */}
                            <button
                                onClick={() => handleRiskModeChange('safe')}
                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group
                  ${settings.aiRiskMode === 'safe' ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-neutral-800/50 border-white/5 hover:border-emerald-500/50'}
                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-black uppercase tracking-wider text-emerald-400">Safe</div>
                                    {settings.aiRiskMode === 'safe' && <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>}
                                </div>
                                <div className="text-xs text-text-muted font-medium mb-3">Focus on high confidence, lower edge picks. Better hit rates.</div>
                                <div className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-1 inline-block rounded">Low Volatility</div>
                            </button>

                            {/* Balanced Mode */}
                            <button
                                onClick={() => handleRiskModeChange('balanced')}
                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group
                  ${settings.aiRiskMode === 'balanced' ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(191,255,0,0.2)]' : 'bg-neutral-800/50 border-white/5 hover:border-primary/50'}
                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-black uppercase tracking-wider text-primary">Balanced</div>
                                    {settings.aiRiskMode === 'balanced' && <span className="material-symbols-outlined text-primary text-sm">check_circle</span>}
                                </div>
                                <div className="text-xs text-text-muted font-medium mb-3">Optimal mix of confidence and edge. Recommended for most.</div>
                                <div className="text-[10px] font-mono text-primary/80 bg-primary/10 px-2 py-1 inline-block rounded">Standard</div>
                            </button>

                            {/* Aggressive Mode */}
                            <button
                                title="Aggressive Risk Mode"
                                onClick={() => handleRiskModeChange('aggressive')}
                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group
                  ${settings.aiRiskMode === 'aggressive' ? 'bg-red-900/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-neutral-800/50 border-white/5 hover:border-red-500/50'}
                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-black uppercase tracking-wider text-red-400">Aggressive</div>
                                    {settings.aiRiskMode === 'aggressive' && <span className="material-symbols-outlined text-red-400 text-sm">check_circle</span>}
                                </div>
                                <div className="text-xs text-text-muted font-medium mb-3">Higher edge picks with lower confidence. Bigger risk, bigger reward.</div>
                                <div className="text-[10px] font-mono text-red-400/80 bg-red-500/10 px-2 py-1 inline-block rounded">High Volatility</div>
                            </button>
                        </div>
                    </div>

                    {/* Sport Selection */}
                    <div className="lab-card p-6 border-t-[3px] border-t-accent-blue">
                        <h2 className="text-xl font-black italic uppercase text-white tracking-widest flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-accent-blue">sports_basketball</span>
                            Active Sports
                        </h2>
                        <p className="text-xs text-text-muted mb-6">Select which sports you want the AI to analyze and display on your dashboard.</p>
                        <div className="flex flex-wrap gap-3">
                            {AVAILABLE_SPORTS.map(sport => {
                                const isActive = settings.enabledSports.includes(sport);
                                return (
                                    <button
                                        key={sport}
                                        onClick={() => toggleSport(sport)}
                                        className={`font-mono font-bold text-sm px-4 py-2 rounded transition-all border
                      ${isActive
                                                ? 'bg-accent-blue/10 text-accent-blue border-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                                : 'bg-neutral-800 text-text-muted border-white/5 hover:bg-neutral-700 hover:text-white'}
                    `}
                                    >
                                        {sport} {isActive && <span className="ml-1 text-[10px]">&times;</span>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Betting Defaults */}
                    <div className="lab-card p-6 border-t-[3px] border-t-Primary">
                        <h2 className="text-xl font-black italic uppercase text-white tracking-widest flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-primary">payments</span>
                            Betting Defaults
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-xs font-mono font-bold text-text-muted uppercase tracking-widest mb-2">Standard Bet Amount ($)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-mono">$</span>
                                    <input
                                        type="number"
                                        value={settings.defaultBetSize}
                                        onChange={(e) => updateSettings({ defaultBetSize: Number(e.target.value) || 0 })}
                                        className="w-full bg-neutral-900 border border-white/10 rounded-lg py-3 pl-8 pr-4 text-white font-mono focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                                <p className="text-[10px] text-text-muted mt-2">Used as the default stake when adding picks to the slip.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-mono font-bold text-text-muted uppercase tracking-widest mb-2">
                                    Min. Confidence Filter: <span className="text-primary">{settings.minConfidence}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={settings.minConfidence}
                                    onChange={(e) => updateSettings({ minConfidence: Number(e.target.value) })}
                                    className="w-full h-2 bg-neutral-900 rounded-lg appearance-none cursor-pointer mt-4 accent-primary"
                                />
                                <div className="flex justify-between text-[10px] text-text-muted mt-2 font-mono">
                                    <span>Any</span>
                                    <span>Locks Only</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column - Toggles & Educational */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* Preferences */}
                    <div className="lab-card p-6 border-t-[3px] border-t-yellow-400">
                        <h2 className="text-xl font-black italic uppercase text-white tracking-widest flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-yellow-400">tune</span>
                            Preferences
                        </h2>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-3 rounded bg-neutral-900 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                                <div>
                                    <div className="text-sm font-bold text-white mb-0.5">Push Notifications</div>
                                    <div className="text-[10px] text-text-muted">Receive alerts for sharp line movements.</div>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.notificationsEnabled ? 'bg-primary' : 'bg-neutral-700'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.notificationsEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                                </div>
                                {/* Hidden input to make label valid */}
                                <input type="checkbox" className="hidden" checked={settings.notificationsEnabled} onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })} />
                            </label>

                            <label className="flex items-center justify-between p-3 rounded bg-neutral-900 border border-white/5 cursor-pointer hover:border-white/10 transition-colors">
                                <div>
                                    <div className="text-sm font-bold text-white mb-0.5 flex items-center gap-1">Bug Mode <span className="material-symbols-outlined text-[14px] text-yellow-400">bug_report</span></div>
                                    <div className="text-[10px] text-text-muted">Show experimental or unstable features.</div>
                                </div>
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.bugModeEnabled ? 'bg-primary' : 'bg-neutral-700'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.bugModeEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                                </div>
                                {/* Hidden input to make label valid */}
                                <input type="checkbox" className="hidden" checked={settings.bugModeEnabled} onChange={(e) => updateSettings({ bugModeEnabled: e.target.checked })} />
                            </label>
                        </div>
                    </div>

                    {/* Glossary */}
                    <div className="lab-card p-6 flex-1 flex flex-col h-full bg-neutral-900/50">
                        <h2 className="text-lg font-black italic uppercase text-white tracking-widest flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-text-muted">school</span>
                            Betting Terms
                        </h2>
                        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            <GlossaryItem term="Spread" def="A point handicap given to the underdog to level the playing field." />
                            <GlossaryItem term="Moneyline" def="A bet on who will win the game outright, without point spreads." />
                            <GlossaryItem term="Over/Under" def="A bet on whether the total points scored will be higher or lower than a set number." />
                            <GlossaryItem term="Prop Bets" def="Wagers on specific events within a game (e.g., Player Points > 25.5)." />
                            <GlossaryItem term="Parlay" def="Combining multiple single bets into one for a higher payout. All legs must win." />
                            <GlossaryItem term="Edge" def="The mathematical advantage a bettor has over the implied sportsbook probability." />
                            <GlossaryItem term="Implied Odds" def="The probability of an outcome as suggested by the sportsbook's odds." />
                            <GlossaryItem term="Line Movement" def="How odds shift over time due to injuries, weather, or sharp money." />
                            <GlossaryItem term="Push" def="A tie against the spread or over/under. Your original stake is refunded." />
                            <GlossaryItem term="Juice/Vig" def="The cut or fee the sportsbook takes on a bet (typically built into -110 odds)." />
                        </div>
                    </div>

                </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 p-4 bg-neutral-900 border border-t-[3px] border-t-red-500/50 border-white/5 rounded-xl text-center">
                <span className="material-symbols-outlined text-red-400 text-3xl mb-2">warning</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-text-main mb-2">Important Disclaimer</h3>
                <p className="text-xs text-text-muted max-w-2xl mx-auto leading-relaxed">
                    PickLabs provides sports analytics for research and entertainment purposes only. This is not gambling advice. Always bet responsibly and never wager more than you can afford to lose. If you or someone you know has a gambling problem, please seek help at <a href="tel:18004262537" className="text-primary font-bold hover:underline">1-800-GAMBLER</a>.
                </p>
            </div>

        </div>
    );
};

const GlossaryItem = ({ term, def }: { term: string, def: string }) => (
    <div className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
        <div className="text-[11px] font-mono font-bold text-primary mb-1">{term}</div>
        <div className="text-[11px] text-text-muted leading-snug">{def}</div>
    </div>
);

export default SettingsView;
