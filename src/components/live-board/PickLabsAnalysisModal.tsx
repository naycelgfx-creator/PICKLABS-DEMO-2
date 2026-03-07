import React, { useState } from 'react';
import { Game } from '../../data/mockGames';
import { IconBrandInstagram, IconBrandFacebook, IconBrandDiscord, IconBrandWhatsapp, IconBrandTelegram } from '@tabler/icons-react';

import { BetPick } from '../../App';

const InteractiveButton = ({
    icon,
    text,
    successIcon = 'check_circle',
    successText,
    className,
    successClassName,
    onClick
}: {
    icon: string;
    text: string;
    successIcon?: string;
    successText?: string;
    className?: string;
    successClassName?: string;
    onClick?: () => void;
}) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (status !== 'idle') return;
        setStatus('loading');

        // Simulate an action
        await new Promise(r => setTimeout(r, 600));

        setStatus('success');
        if (onClick) onClick();

        // Return to idle after 2 seconds
        setTimeout(() => setStatus('idle'), 2000);
    };

    const isSuccess = status === 'success';

    return (
        <button
            onClick={handleClick}
            className={`${className} ${isSuccess && successClassName ? successClassName : ''} transition-all duration-300`}
            disabled={status !== 'idle'}
        >
            {status === 'loading' ? (
                <>
                    <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                    {text}
                </>
            ) : isSuccess ? (
                <>
                    <span className="material-symbols-outlined text-sm">{successIcon}</span>
                    {successText || text}
                </>
            ) : (
                <>
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                    {text}
                </>
            )}
        </button>
    );
};

interface PickLabsAnalysisModalProps {
    game: Game;
    onClose: () => void;
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
}

export const PickLabsAnalysisModal: React.FC<PickLabsAnalysisModalProps> = ({ game, onClose, onAddBet }) => {
    const [activeTab, setActiveTab] = useState<'Game Analysis' | 'Analytics' | 'Vegas Edge Analysis' | 'Value Edge Analysis'>('Game Analysis');
    const [activeOverlay, setActiveOverlay] = useState<'none' | 'share' | 'matchup' | 'ai' | 'shop' | 'alert' | 'track'>('none');

    // Make up some values for the UI
    const aiHomeProb = game.aiData?.ai_probability ?? game.homeTeam.winProb;
    const aiAwayProb = 100 - aiHomeProb;
    const aiFavoredTeam = aiHomeProb >= 50 ? game.homeTeam.name : game.awayTeam.name;
    const aiFavoredScore = aiHomeProb >= 50 ? 112 : 108;
    const aiUnderdogScore = aiHomeProb >= 50 ? 104 : 105;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-[#0a0f16] border border-border-muted rounded-xl w-full max-w-4xl max-h-full flex flex-col shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>

                {/* Share Overlay */}
                <div className={`absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center transition-opacity duration-300 backdrop-blur-md ${activeOverlay === 'share' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={() => setActiveOverlay('none')}
                        className="absolute top-4 right-4 w-10 h-10 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:border-red-500 hover:text-white transition-all shadow-lg hover:scale-110 z-50"
                        title="Close Share"
                    >
                        <span className="material-symbols-outlined text-xl font-black">close</span>
                    </button>
                    <h4 className="text-white font-black uppercase tracking-widest text-lg mb-8">Share PickLabs Analysis</h4>
                    <div className="flex gap-6">
                        <button title="Share on Instagram" className="w-14 h-14 rounded-full bg-[#E1306C]/10 border border-[#E1306C]/50 flex items-center justify-center text-[#E1306C] hover:bg-[#E1306C] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(225,48,108,0.3)]">
                            <IconBrandInstagram size={28} stroke={2} />
                        </button>
                        <button title="Share on Facebook" className="w-14 h-14 rounded-full bg-[#1877F2]/10 border border-[#1877F2]/50 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(24,119,242,0.3)]">
                            <IconBrandFacebook size={28} stroke={2} />
                        </button>
                        <button title="Share on Discord" className="w-14 h-14 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/50 flex items-center justify-center text-[#5865F2] hover:bg-[#5865F2] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(88,101,242,0.3)]">
                            <IconBrandDiscord size={28} stroke={2} />
                        </button>
                        <button title="Share on Telegram" className="w-14 h-14 rounded-full bg-[#229ED9]/10 border border-[#229ED9]/50 flex items-center justify-center text-[#229ED9] hover:bg-[#229ED9] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(34,158,217,0.3)]">
                            <IconBrandTelegram size={28} stroke={2} />
                        </button>
                        <button title="Share on WhatsApp" className="w-14 h-14 rounded-full bg-[#25D366]/10 border border-[#25D366]/50 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white hover:scale-110 transition-all shadow-[0_0_15px_rgba(37,211,102,0.3)]">
                            <IconBrandWhatsapp size={28} stroke={2} />
                        </button>
                    </div>
                </div>

                {/* Matchup Stats Overlay */}
                <div className={`absolute inset-0 bg-black/95 z-50 p-6 flex flex-col transition-opacity duration-300 backdrop-blur-md ${activeOverlay === 'matchup' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={() => setActiveOverlay('none')} className="absolute top-4 right-4 w-10 h-10 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-neutral-700 transition-all z-50">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <h4 className="text-white font-black uppercase tracking-widest text-lg border-b border-border-muted pb-4 mb-6">Matchup Stats: {game.awayTeam.name} @ {game.homeTeam.name}</h4>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-center items-center">
                            <div className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Offensive Rating</div>
                            <div className="text-2xl font-black text-[#A3FF00]">114.2 <span className="text-sm text-slate-500">vs</span> 109.8</div>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-center items-center">
                            <div className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Pace</div>
                            <div className="text-2xl font-black text-white">99.5 <span className="text-sm text-slate-500">vs</span> 97.2</div>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-center items-center">
                            <div className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Defensive Rebound %</div>
                            <div className="text-2xl font-black text-white">72.1% <span className="text-sm text-slate-500">vs</span> 70.8%</div>
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col justify-center items-center">
                            <div className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">True Shooting %</div>
                            <div className="text-2xl font-black text-accent-cyan">58.4% <span className="text-sm text-slate-500">vs</span> 55.9%</div>
                        </div>
                    </div>
                </div>

                {/* AI / Custom Analysis Overlay */}
                <div className={`absolute inset-0 bg-black/95 z-50 p-6 flex flex-col transition-opacity duration-300 backdrop-blur-md ${activeOverlay === 'ai' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={() => setActiveOverlay('none')} className="absolute top-4 right-4 w-10 h-10 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-neutral-700 transition-all z-50">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <h4 className="text-accent-purple font-black uppercase tracking-widest text-lg border-b border-border-muted pb-4 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">smart_toy</span>
                        Ask Custom AI
                    </h4>
                    <div className="flex-1 bg-neutral-900/50 rounded-xl border border-accent-purple/30 p-4 flex flex-col text-center justify-center space-y-4">
                        <span className="material-symbols-outlined text-4xl text-accent-purple mb-2">auto_awesome</span>
                        <h5 className="text-white font-bold text-lg">PickLabs Custom AI</h5>
                        <p className="text-slate-400 text-sm max-w-md mx-auto">Ask about situational trends, historical performance, weather impacts, or matchup specific deep dives.</p>
                        <div className="flex gap-2 mx-auto mt-4 w-full max-w-md">
                            <input type="text" placeholder="e.g. How does LeBron perform on back-to-backs?" className="flex-1 bg-black border border-neutral-700 text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-accent-purple/50" />
                            <button className="px-4 py-3 bg-accent-purple text-white font-bold rounded-xl hover:bg-purple-500 transition-colors">Ask</button>
                        </div>
                    </div>
                </div>

                {/* Shop Best Odds Overlay */}
                <div className={`absolute inset-0 bg-black/95 z-50 p-6 flex flex-col transition-opacity duration-300 backdrop-blur-md ${activeOverlay === 'shop' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={() => setActiveOverlay('none')} className="absolute top-4 right-4 w-10 h-10 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-neutral-700 transition-all z-50">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <h4 className="text-[#A3FF00] font-black uppercase tracking-widest text-lg border-b border-border-muted pb-4 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">shopping_cart</span>
                        Shop Best Odds
                    </h4>
                    <div className="flex-1 space-y-3 mt-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-900 border border-[#A3FF00]/50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs">FD</div>
                                <span className="text-white font-bold">FanDuel</span>
                            </div>
                            <span className="text-[#A3FF00] font-black text-xl">+115</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-black text-xs">DK</div>
                                <span className="text-white font-bold">DraftKings</span>
                            </div>
                            <span className="text-white font-black text-xl">+105</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl opacity-60">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-xs">MGM</div>
                                <span className="text-white font-bold">BetMGM</span>
                            </div>
                            <span className="text-white font-black text-xl">+100</span>
                        </div>
                    </div>
                </div>

                {/* Set Alert Overlay */}
                <div className={`absolute inset-0 bg-black/95 z-50 p-6 flex flex-col transition-opacity duration-300 backdrop-blur-md ${activeOverlay === 'alert' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={() => setActiveOverlay('none')} className="absolute top-4 right-4 w-10 h-10 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-neutral-700 transition-all z-50">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <h4 className="text-yellow-500 font-black uppercase tracking-widest text-lg border-b border-border-muted pb-4 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">notifications_active</span>
                        Set Odds Alert
                    </h4>
                    <div className="flex-1 bg-neutral-900 rounded-xl border border-yellow-500/30 p-6 flex flex-col text-center justify-center space-y-4">
                        <span className="material-symbols-outlined text-4xl text-yellow-500 mb-2">notifications</span>
                        <h5 className="text-white font-bold text-lg">Alert Me When Odds Move</h5>
                        <p className="text-slate-400 text-sm max-w-md mx-auto">We'll send you a push notification if the line moves to your target value.</p>
                        <div className="flex flex-col gap-4 mx-auto mt-4 w-full max-w-sm">
                            <div className="flex justify-between items-center bg-black border border-neutral-800 rounded-lg p-3">
                                <span className="text-white font-bold text-sm">Target Odds</span>
                                <input type="text" placeholder="+150" className="bg-transparent text-yellow-500 font-black text-right outline-none w-20 text-lg" />
                            </div>
                            <button className="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(234,179,8,0.3)]">Create Alert</button>
                        </div>
                    </div>
                </div>

                {/* Track Edge Overlay */}
                <div className={`absolute inset-0 bg-black/95 z-50 p-6 flex flex-col transition-opacity duration-300 backdrop-blur-md ${activeOverlay === 'track' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <button onClick={() => setActiveOverlay('none')} className="absolute top-4 right-4 w-10 h-10 bg-neutral-800 border border-neutral-600 rounded-full flex items-center justify-center text-white hover:bg-neutral-700 transition-all z-50">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                    <h4 className="text-primary font-black uppercase tracking-widest text-lg border-b border-border-muted pb-4 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">track_changes</span>
                        Track Edge
                    </h4>
                    <div className="flex-1 bg-neutral-900 rounded-xl border border-primary/30 p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <span className="material-symbols-outlined text-4xl text-primary animate-pulse mb-2">radar</span>
                        <h5 className="text-white font-bold text-lg">Edge Tracking Activated</h5>
                        <p className="text-slate-400 text-sm max-w-md">Our AI is now continuously monitoring this line across 15+ sharp books. You'll be notified of any sudden sharp money movements or EV shifts.</p>
                        <button onClick={() => setActiveOverlay('none')} className="mt-4 px-8 py-3 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-colors">Done</button>
                    </div>
                </div>

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-border-muted bg-neutral-900/50">
                    <div>
                        <h2 className="text-lg font-black text-white italic uppercase flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                            PickLabs <span className="text-primary">Analysis</span>
                        </h2>
                        <p className="text-xs text-text-muted mt-0.5">
                            {game.awayTeam.name} @ {game.homeTeam.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-slate-400 hover:text-white">
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border-muted overflow-x-auto scrollbar-hide shrink-0">
                    {['Game Analysis', 'Analytics', 'Vegas Edge Analysis', 'Value Edge Analysis'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'Game Analysis' | 'Analytics' | 'Vegas Edge Analysis' | 'Value Edge Analysis')}
                            className={`whitespace-nowrap px-4 sm:px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-widest transition-colors border-b-2 ${activeTab === tab
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-neutral-800/50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {activeTab === 'Game Analysis' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Our Picks Summary */}
                                <div className="terminal-panel p-4 space-y-3">
                                    <h3 className="text-xs font-black text-text-muted uppercase tracking-widest border-b border-border-muted pb-2">Our Picks Summary</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-sm text-white">
                                            <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                            <span className="font-bold">Game Winner:</span> {aiFavoredTeam} ML
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-white">
                                            <span className="material-symbols-outlined text-accent-purple text-sm">check_circle</span>
                                            <span className="font-bold">Total:</span> OVER {game.odds.overUnder.value}
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-white">
                                            <span className="material-symbols-outlined text-accent-blue text-sm">check_circle</span>
                                            <span className="font-bold">Top Prop:</span> {aiFavoredTeam} Star Player Over 24.5 Pts
                                        </li>
                                    </ul>
                                </div>

                                {/* Score Projection Table */}
                                <div className="terminal-panel p-4 space-y-3">
                                    <h3 className="text-xs font-black text-text-muted uppercase tracking-widest border-b border-border-muted pb-2">Score Projection</h3>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="p-3 bg-neutral-900 rounded-lg">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">{game.awayTeam.name}</div>
                                            <div className="text-2xl font-black text-white">{aiHomeProb >= 50 ? aiUnderdogScore : aiFavoredScore}</div>
                                        </div>
                                        <div className="p-3 bg-neutral-900 rounded-lg border border-primary/20 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">{game.homeTeam.name}</div>
                                            <div className="text-2xl font-black text-primary">{aiHomeProb >= 50 ? aiFavoredScore : aiUnderdogScore}</div>
                                        </div>
                                    </div>
                                    <div className="text-center text-[10px] text-slate-400 font-medium">
                                        Projected Margin: <span className="text-primary font-bold">{Math.abs(aiFavoredScore - aiUnderdogScore)} points</span>
                                    </div>
                                </div>
                            </div>

                            {/* The Breakdown */}
                            <div className="terminal-panel p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
                                <h3 className="text-sm font-black text-white italic uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">menu_book</span>
                                    The Breakdown (Why We Like This Pick)
                                </h3>
                                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                                    The model identifies a strong narrative supporting {aiFavoredTeam} in this matchup. Based on recent form and underlying efficiency metrics, {aiFavoredTeam} generates significantly more high-quality scoring opportunities, especially when facing defenses with similar statistical profiles. Expect them to dictate the pace early and cover the spread comfortably by capitalizing on transition points and second-chance opportunities.
                                </p>

                                <div className="border-t border-border-muted pt-4 mb-4">
                                    <h4 className="text-xs font-black text-text-muted uppercase tracking-widest mb-2">Risk Factors to Consider</h4>
                                    <p className="text-xs text-slate-400 italic">
                                        • Potential for late rotations heavily skewing 4th quarter scoring.<br />
                                        • Underdog team has a historically high variance 3-point shooting rate when playing on the road.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                        onClick={() => setActiveOverlay('ai')}
                                        className="flex-[1_1_45%] sm:flex-none flex justify-center items-center gap-2 px-3 py-2 bg-neutral-800/80 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-neutral-700 border border-border-muted"
                                    >
                                        <span className="material-symbols-outlined text-sm">smart_toy</span>
                                        Ask Custom AI
                                    </button>
                                    <button
                                        onClick={() => setActiveOverlay('matchup')}
                                        className="flex-[1_1_45%] sm:flex-none flex justify-center items-center gap-2 px-3 py-2 bg-neutral-800/80 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-neutral-700 border border-border-muted"
                                    >
                                        <span className="material-symbols-outlined text-sm">analytics</span>
                                        Matchup Stats
                                    </button>
                                    <button
                                        onClick={() => setActiveOverlay('shop')}
                                        className="flex-[1_1_45%] sm:flex-none flex justify-center items-center gap-2 px-3 py-2 bg-neutral-800/80 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-neutral-700 border border-border-muted"
                                    >
                                        <span className="material-symbols-outlined text-sm">shopping_cart</span>
                                        Shop Best Odds
                                    </button>
                                    <button
                                        onClick={() => setActiveOverlay('alert')}
                                        className="flex-[1_1_45%] sm:flex-none flex justify-center items-center gap-2 px-3 py-2 bg-neutral-800/80 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-neutral-700 border border-border-muted"
                                    >
                                        <span className="material-symbols-outlined text-sm">notifications_active</span>
                                        Set Alert
                                    </button>
                                    <button
                                        onClick={() => setActiveOverlay('track')}
                                        className="flex-[1_1_45%] sm:flex-none flex justify-center items-center gap-2 px-3 py-2 bg-neutral-800/80 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-neutral-700 border border-border-muted"
                                    >
                                        <span className="material-symbols-outlined text-sm">track_changes</span>
                                        Track Edge
                                    </button>
                                    <button
                                        onClick={() => setActiveOverlay('share')}
                                        className="flex-[1_1_45%] sm:flex-none flex justify-center items-center gap-2 px-3 py-2 bg-neutral-800/80 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-neutral-700 border border-border-muted transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">ios_share</span>
                                        Share Pick
                                    </button>
                                    <InteractiveButton
                                        onClick={() => onAddBet({
                                            gameId: game.id,
                                            type: 'ML',
                                            team: aiFavoredTeam,
                                            odds: game.odds.moneyline,
                                            matchupStr: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
                                            stake: 10,
                                            gameStatus: game.status,
                                            gameDate: game.date
                                        })}
                                        icon="add_circle"
                                        text="Add to Slip"
                                        successText="Added"
                                        className="flex-1 sm:flex-[0_0_auto] flex justify-center items-center gap-2 px-6 py-2 bg-primary text-black text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-white ml-auto shadow-[0_0_15px_rgba(163,255,0,0.2)]"
                                        successClassName="bg-primary/20 text-primary border border-primary/50 shadow-none ml-auto"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Analytics' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Confidence Details */}
                                <div className="terminal-panel p-5 md:col-span-1 flex flex-col items-center justify-center text-center">
                                    <h3 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4 w-full text-left">Projection Confidence</h3>

                                    <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle className="text-neutral-800" cx="50%" cy="50%" fill="transparent" r="44%" stroke="currentColor" strokeWidth="8"></circle>
                                            <circle
                                                className="transition-all duration-1000 ease-out text-primary"
                                                cx="50%" cy="50%" fill="transparent" r="44%"
                                                stroke="currentColor"
                                                strokeDasharray="276"
                                                strokeDashoffset={276 - (276 * (Math.max(aiHomeProb, aiAwayProb) / 100))}
                                                strokeLinecap="round" strokeWidth="8"
                                            ></circle>
                                        </svg>
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-3xl font-black text-white">{Math.max(aiHomeProb, aiAwayProb).toFixed(1)}<span className="text-lg">%</span></span>
                                        </div>
                                    </div>

                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-xs">verified</span>
                                        High Confidence
                                    </div>
                                </div>

                                {/* Player Projections */}
                                <div className="terminal-panel p-5 md:col-span-2 space-y-4">
                                    <h3 className="text-xs font-black text-text-muted uppercase tracking-widest border-b border-border-muted pb-2 flex justify-between items-end">
                                        <span>Key Player Projections</span>
                                        <span className="text-[9px] text-slate-500 font-medium normal-case tracking-normal">Based on simulation medians</span>
                                    </h3>

                                    <div className="space-y-2">
                                        {[
                                            { player: "Star Point Guard", line: "24.5 Pts", proj: "26.8", pick: "OVER", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
                                            { player: "Starting Center", line: "11.5 Reb", proj: "12.4", pick: "OVER", color: "text-accent-blue", bg: "bg-accent-blue/10", border: "border-accent-blue/30" },
                                            { player: "Shooting Guard", line: "3.5 Threes", proj: "2.1", pick: "UNDER", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
                                        ].map((p, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                                                <div>
                                                    <div className="text-sm font-bold text-white">{p.player}</div>
                                                    <div className="text-[10px] text-slate-400">Line: <span className="font-mono text-slate-300">{p.line}</span></div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="hidden sm:block text-right">
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest">Model Proj</div>
                                                        <div className="font-mono font-bold text-white">{p.proj}</div>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded border ${p.bg} ${p.border} ${p.color} text-[10px] font-black tracking-widest w-16 text-center`}>
                                                        {p.pick}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Vegas Edge Analysis' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="terminal-panel p-5">
                                <h3 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4 border-b border-border-muted pb-2">Odds Comparison & Edge</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                                    <div className="p-3 bg-neutral-900 rounded-lg text-center">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Vegas Implied (ML)</div>
                                        <div className="text-lg font-mono text-white">47.6%</div>
                                    </div>
                                    <div className="hidden sm:flex items-center justify-center text-slate-600">
                                        <span className="material-symbols-outlined shrink-0 text-3xl">compare_arrows</span>
                                    </div>
                                    <div className="p-3 bg-neutral-900 rounded-lg text-center border border-primary/20">
                                        <div className="text-[10px] text-primary uppercase font-bold mb-1">PickLabs True (ML)</div>
                                        <div className="text-lg font-mono text-primary">{Math.max(aiHomeProb, aiAwayProb).toFixed(1)}%</div>
                                    </div>
                                    <div className="p-3 bg-primary/10 rounded-lg text-center flex flex-col justify-center border border-primary/30">
                                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Calculated Edge</div>
                                        <div className="text-xl font-black text-primary italic">+{game.aiData?.edge || 5.2}%</div>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                                    <strong>Verdict:</strong> There is a significant discrepancy between the market's expectation and our model's median outcome, presenting a profitable edge on the Moneyline for {aiFavoredTeam}. The market underestimates their offensive rebounding advantage.
                                </p>

                                <div className="flex flex-wrap gap-2">
                                    <InteractiveButton
                                        icon="shopping_cart"
                                        text="Shop Best Odds"
                                        successText="Finding Odds"
                                        successIcon="search"
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-neutral-800 text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-neutral-700 border border-border-muted"
                                        successClassName="bg-accent-blue/20 text-accent-blue border-accent-blue/40"
                                    />
                                    <InteractiveButton
                                        icon="notifications_active"
                                        text="Set Line Alert"
                                        successText="Alert Set"
                                        successIcon="notifications_active"
                                        className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/20"
                                        successClassName="bg-primary/30 text-primary border-primary/50"
                                    />
                                    <InteractiveButton
                                        icon="check_circle"
                                        text="Track This Edge"
                                        successText="Tracking"
                                        successIcon="verified"
                                        className="flex-1 sm:flex-none ml-auto flex justify-center items-center gap-2 px-4 py-2 bg-primary text-black text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-white"
                                        successClassName="bg-primary/20 text-primary border border-primary/50 shadow-none ml-auto"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Value Edge Analysis' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="terminal-panel p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <span className="material-symbols-outlined text-9xl">library_add_check</span>
                                </div>
                                <h3 className="text-sm font-black text-white italic uppercase tracking-widest mb-1">Parlay Builder (Correlated value)</h3>
                                <p className="text-xs text-text-muted mb-5">AI-constructed 3-leg parlay maximizing correlated outcomes for this specific matchup.</p>

                                <div className="space-y-3 mb-6 relative z-10">
                                    {[
                                        { label: "Leg 1 (Game Pick)", desc: `${aiFavoredTeam} Moneyline`, odds: game.odds.moneyline },
                                        { label: "Leg 2 (Total)", desc: `OVER ${game.odds.overUnder.value}`, odds: "-110" },
                                        { label: "Leg 3 (Prop)", desc: "Star PG Over 6.5 Assists", odds: "+105" },
                                    ].map((leg, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border-l-2 border-primary">
                                            <div>
                                                <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-0.5">{leg.label}</div>
                                                <div className="text-sm font-bold text-white">{leg.desc}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm text-slate-300">{leg.odds}</span>
                                                <button className="p-1.5 rounded bg-neutral-800 text-slate-400 hover:text-white hover:bg-neutral-700 transition-colors" title="Swap Leg">
                                                    <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6">
                                    <div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">Implied Parlay Odds</div>
                                        <div className="text-xl font-black text-white">+580</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-primary uppercase tracking-widest font-bold mb-0.5">PickLabs Expected Value</div>
                                        <div className="text-xl font-black text-primary">+14.2% EV</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <InteractiveButton
                                        onClick={() => {
                                            onAddBet({
                                                gameId: game.id,
                                                type: 'ML',
                                                team: aiFavoredTeam,
                                                odds: game.odds.moneyline,
                                                matchupStr: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
                                                stake: 10,
                                                gameStatus: game.status,
                                                gameDate: game.date
                                            });
                                        }}
                                        icon="rocket_launch"
                                        text="Add Full Parlay to Slip"
                                        successText="Parlay Added"
                                        className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-primary text-black text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-white border border-transparent shadow-[0_0_15px_rgba(163,255,0,0.25)]"
                                        successClassName="bg-primary/20 text-primary border-primary shadow-none"
                                    />
                                    <button
                                        onClick={() => setActiveOverlay('share')}
                                        className="flex-1 md:flex-none flex justify-center items-center gap-2 px-5 py-3 bg-neutral-800 text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-neutral-700 border border-border-muted transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">ios_share</span>
                                        Share Parlay
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
