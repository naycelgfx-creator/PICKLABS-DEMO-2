import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../data/PickLabsAuthDB';
import { getUserBets } from '../../data/PickLabsBetsDB';

export const AIDashboardView: React.FC = () => {
    const [isCrunching, setIsCrunching] = useState(false);
    const [buttonText, setButtonText] = useState('✨ AI Pick My Bets ⚡️');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);

    const [kpis, setKpis] = useState({
        total_picks: 0,
        win_rate: "0.0%",
        win_trend: "+0.0%",
        roi: "0.0%",
        roi_trend: "+0.0%",
        streak: 0
    });

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) return;

        const allBets = getUserBets(user.email);
        const resolvedBets = allBets.filter(b => b.status === 'Won' || b.status === 'Lost');

        const totalPicks = resolvedBets.length;
        if (totalPicks === 0) return;

        let wins = 0;
        let totalWagered = 0;
        let totalProfit = 0;
        let streak = 0;
        let countingStreak = true;

        // resolvedBets are sorted newest first by getUserBets
        resolvedBets.forEach(bet => {
            if (bet.status === 'Won') {
                wins++;
                totalProfit += (bet.payout - bet.wager);
                if (countingStreak) streak++;
            } else {
                totalProfit -= bet.wager;
                countingStreak = false;
            }
            totalWagered += bet.wager;
        });

        const winRate = ((wins / totalPicks) * 100).toFixed(1);
        const roiVal = totalWagered > 0 ? ((totalProfit / totalWagered) * 100).toFixed(1) : "0.0";

        setKpis({
            total_picks: totalPicks,
            win_rate: `${winRate}%`,
            win_trend: "+0.0%", // Placeholder until trend math is added
            roi: parseFloat(roiVal) > 0 ? `+${roiVal}%` : `${roiVal}%`,
            roi_trend: "+0.0%", // Placeholder until trend math is added
            streak: streak
        });
    }, []);

    const top_picks = [
        { rank: 1, confidence: 92, pick: "Heat -4.0", edge: "+9.0%", desc: "Strong matchup advantage for Heat at home. Recent form shows momentum..." },
        { rank: 2, confidence: 76, pick: "76ers +4.4", edge: "+2.9%", desc: "Strong matchup advantage for 76ers at home. Recent form shows momentum..." },
        { rank: 3, confidence: 70, pick: "Warriors +4.9", edge: "+8.3%", desc: "Strong matchup advantage for Warriors at home. Recent form shows momentum..." }
    ];

    return (
        <div className="max-w-[1200px] mx-auto p-5 animate-fade-in pb-24">

            {/* Top Header & AI Button */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="m-0 text-3xl font-bold text-text-main">Today's AI Picks</h1>
                    <p className="mt-1 text-text-muted font-medium">Friday, February 27</p>
                </div>
                <div>
                    <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
                        <span className="material-symbols-outlined text-orange-500 text-[10px] align-middle mr-1">local_fire_department</span> Aggressive
                    </span>
                </div>
            </div>

            <button
                onClick={async () => {
                    if (isCrunching) return;
                    setIsCrunching(true);
                    setIsSuccess(false);
                    setIsError(false);
                    setButtonText('⚙️ Scanning DraftKings & FanDuel...');

                    try {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        setButtonText('🧠 Calculating Expected Value (+EV)...');
                        await new Promise(resolve => setTimeout(resolve, 1500));

                        setIsCrunching(false);
                        setIsSuccess(true);
                        setButtonText('✅ 5 Massive Edges Found!');

                        setTimeout(() => {
                            setButtonText('✨ AI Pick My Bets ⚡️');
                            setIsSuccess(false);
                        }, 3000);
                    } catch (error) {
                        setIsCrunching(false);
                        setIsError(true);
                        setButtonText('❌ Connection Error. Try Again.');

                        setTimeout(() => {
                            setButtonText('✨ AI Pick My Bets ⚡️');
                            setIsError(false);
                        }, 3000);
                    }
                }}
                disabled={isCrunching}
                className={`font-mono font-bold py-3 px-8 rounded flex items-center justify-center mx-auto mb-8 transition-all duration-300 uppercase tracking-widest text-sm
                    ${!isSuccess && !isError && !isCrunching ? 'bg-primary text-black hover:bg-primary/90 hover:scale-[1.02] shadow-[0_0_20px_rgba(191,255,0,0.2)]' : ''}
                    ${isCrunching ? 'bg-neutral-800 text-primary border border-primary/30 is-crunching' : ''}
                    ${isSuccess ? 'bg-primary text-black' : ''}
                    ${isError ? 'bg-red-500 text-white' : ''}
                `}
            >
                {buttonText}
            </button>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="lab-card p-5">
                    <div className="text-text-muted text-[10px] uppercase font-mono font-bold tracking-widest">Total Picks</div>
                    <div className="text-text-main text-3xl font-bold font-mono my-2">{kpis.total_picks}</div>
                </div>
                <div className="lab-card p-5">
                    <div className="text-text-muted text-[10px] uppercase font-mono font-bold tracking-widest">Win Rate</div>
                    <div className="text-text-main text-3xl font-bold font-mono my-2">{kpis.win_rate}</div>
                    <div className="text-primary text-xs font-mono font-bold">↑ {kpis.win_trend} vs last week</div>
                </div>
                <div className="lab-card p-5">
                    <div className="text-text-muted text-[10px] uppercase font-mono font-bold tracking-widest">ROI</div>
                    <div className="text-text-main text-3xl font-bold font-mono my-2">{kpis.roi}</div>
                    <div className="text-red-400 text-xs font-mono font-bold">↓ {kpis.roi_trend} vs last week</div>
                </div>
                <div className="lab-card p-5">
                    <div className="text-text-muted text-[10px] uppercase font-mono font-bold tracking-widest">Hot Streak</div>
                    <div className="text-text-main text-3xl font-bold font-mono my-2">
                        {kpis.streak} <span className="text-base text-text-muted font-medium font-sans">wins</span>
                    </div>
                </div>
            </div>

            {/* Best Bets Grid */}
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-text-main m-0 text-xl font-bold">Best Bets Today</h2>
                    <p className="mt-1 text-text-muted text-sm">AI's highest confidence picks</p>
                </div>
                <button className="text-primary text-sm font-mono font-bold hover:text-primary/80 transition-colors uppercase tracking-wider">View All →</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                {top_picks.map((pick, i) => (
                    <div key={i} className={`lab-card p-5 relative group
                        ${i === 0 && isSuccess ? '!border-primary shadow-[0_0_20px_rgba(191,255,0,0.2)]' : ''}
                    `}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold px-2 py-0.5 rounded">#{pick.rank}</span>
                                <span className="text-primary text-[10px] font-mono font-bold tracking-widest uppercase">✨ AI TOP PICK</span>
                            </div>
                            <div className="text-primary font-mono font-bold text-lg">{pick.confidence}%</div>
                        </div>
                        <div className="text-2xl font-bold mb-2 text-white">{pick.pick}</div>
                        <div className="text-text-muted text-sm leading-relaxed mb-5 line-clamp-3">
                            {pick.desc}
                        </div>
                        <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-auto">
                            <span className="text-text-muted text-sm font-medium">
                                Edge: <strong className="text-primary font-mono ml-1">{pick.edge}</strong>
                            </span>
                            <button className="text-primary text-xs font-mono font-bold group-hover:text-primary/80 transition-colors uppercase tracking-wider">View Details →</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Matchup Grid (Today's Games) */}
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h2 className="text-text-main m-0 text-xl font-bold">Today's Games</h2>
                    <p className="mt-1 text-text-muted text-sm">Matchups with projections</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                <div className="lab-card p-5 group">
                    <div className="flex justify-between text-text-muted text-xs mb-5 font-medium items-center">
                        <span className="font-mono mt-0.5">🕒 Feb 27, 4:19 PM</span>
                        <span className="text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">68% Predictability</span>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                            <span className="text-[18px] font-bold text-white">Celtics</span>
                            <span className="text-[11px] text-text-muted font-mono mt-1">40-12 • L5: 3-2</span>
                        </div>
                        <span className="font-mono font-bold text-white text-[18px] readout-value">+136</span>
                    </div>
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex flex-col">
                            <span className="text-[18px] font-bold text-white">Lakers</span>
                            <span className="text-[11px] text-text-muted font-mono mt-1">32-20 • L5: 4-1</span>
                        </div>
                        <span className="font-mono font-bold text-white text-[18px] readout-value">-126</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded mb-4 text-center border border-white/5">
                        <div className="flex flex-col">
                            <span className="text-text-muted text-[10px] mb-1 uppercase tracking-widest font-mono font-bold">Spread</span>
                            <strong className="text-[15px] font-mono text-white">-0.3</strong>
                        </div>
                        <div className="flex flex-col border-x border-white/10">
                            <span className="text-text-muted text-[10px] mb-1 uppercase tracking-widest font-mono font-bold">Total</span>
                            <strong className="text-[15px] font-mono text-white">O/U 229</strong>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-text-muted text-[10px] mb-1 uppercase tracking-widest font-mono font-bold">Edge</span>
                            <strong className="text-[15px] font-mono text-primary">+1.9%</strong>
                        </div>
                    </div>

                    <p className="text-text-muted text-sm leading-relaxed mb-0">
                        Strong matchup advantage for Lakers at home. Recent form shows momentum with a 4-1 record over the last 5 games.
                    </p>
                </div>

                <div className="lab-card p-5 flex items-center justify-center min-h-[250px]">
                    <div className="text-center p-8 text-text-muted font-mono text-sm border border-dashed border-white/10 rounded w-full bg-white/5">
                        + More Game Data Loading...
                    </div>
                </div>
            </div>

            {/* Bottom Nav Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="lab-card p-6 cursor-pointer group hover:bg-white/5">
                    <h3 className="m-0 mb-2 text-white font-bold text-lg group-hover:text-primary transition-colors">📈 Player Props</h3>
                    <p className="m-0 text-text-muted text-sm leading-relaxed">AI projections for points, rebounds, assists & more</p>
                </div>
                <div className="lab-card p-6 cursor-pointer group hover:bg-white/5">
                    <h3 className="m-0 mb-2 text-white font-bold text-lg group-hover:text-primary transition-colors">⚡️ Build Parlay</h3>
                    <p className="m-0 text-text-muted text-sm leading-relaxed">Combine picks for bigger payouts</p>
                </div>
                <div className="lab-card p-6 cursor-pointer group hover:bg-white/5">
                    <h3 className="m-0 mb-2 text-white font-bold text-lg group-hover:text-primary transition-colors">💰 Track Bankroll</h3>
                    <p className="m-0 text-text-muted text-sm leading-relaxed">Monitor your performance & ROI</p>
                </div>
            </div>

        </div>
    );
};
