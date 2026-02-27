import React from 'react';
import { Game } from '../../data/mockGames';

interface PublicBettingProps {
    game: Game;
    onMatchDetailsClick?: () => void;
    isOpen: boolean;
    onToggle: () => void;
}

export const PublicBetting: React.FC<PublicBettingProps> = ({ game, onMatchDetailsClick, isOpen, onToggle }) => {
    // Simple deterministic PRNG based on string hash for stable random numbers per game
    const pseudoRandom = (seedStr: string) => {
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
        }
        hash = Math.imul(1597334677, hash);
        return ((hash ^ hash >>> 15) & 255) / 256;
    };

    const generateStats = (seed: string) => {
        const betPct = Math.floor(40 + pseudoRandom(seed + 'bets') * 40);
        const moneyPct = Math.floor(35 + pseudoRandom(seed + 'money') * 50);
        return { awayBets: betPct, homeBets: 100 - betPct, awayMoney: moneyPct, homeMoney: 100 - moneyPct };
    };

    const mlStats = generateStats(game.matchupId + 'ml');
    const spreadStats = generateStats(game.matchupId + 'spread');
    const ouStats = generateStats(game.matchupId + 'ou');

    const getWidthClass = (pct: number) => {
        const rounded = Math.round(pct / 5) * 5;
        const widthMap: Record<number, string> = {
            0: 'w-0', 5: 'w-[5%]', 10: 'w-[10%]', 15: 'w-[15%]', 20: 'w-[20%]',
            25: 'w-1/4', 30: 'w-[30%]', 35: 'w-[35%]', 40: 'w-[40%]', 45: 'w-[45%]',
            50: 'w-1/2', 55: 'w-[55%]', 60: 'w-[60%]', 65: 'w-[65%]', 70: 'w-[70%]',
            75: 'w-3/4', 80: 'w-[80%]', 85: 'w-[85%]', 90: 'w-[90%]', 95: 'w-[95%]', 100: 'w-full'
        };
        return widthMap[rounded] || 'w-1/2';
    };

    const renderBar = (leftPct: number, rightPct: number, lc: string, rc: string) => (
        <div className="flex w-full h-1 mt-1 gap-0.5">
            <div className={`h-full rounded-l-full ${lc} ${getWidthClass(leftPct)}`} />
            <div className={`h-full rounded-r-full ${rc} ${getWidthClass(rightPct)}`} />
        </div>
    );

    const StatBlock = ({ label, away, home, leftColor, rightColor }: { label: string; away: { bets: number; money: number }; home: { bets: number; money: number }; leftColor: string; rightColor: string }) => (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.src = game.sportLogo; }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.src = game.sportLogo; }} />
            </div>
            <div>
                <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-white">{away.bets}%</span>
                    <span className="text-slate-600">Bets</span>
                    <span className="text-white">{home.bets}%</span>
                </div>
                {renderBar(away.bets, home.bets, leftColor, rightColor)}
            </div>
            <div>
                <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-white">{away.money}%</span>
                    <span className="text-slate-600">Money</span>
                    <span className="text-white">{home.money}%</span>
                </div>
                {renderBar(away.money, home.money, leftColor, rightColor)}
            </div>
        </div>
    );

    return (
        <div className="w-full flex flex-col font-sans">
            {/* Toggle Header */}
            <div
                className="flex justify-between items-center bg-neutral-900/60 py-2 px-4 border-t border-border-muted cursor-pointer hover:bg-neutral-800/60 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-white transition-colors">
                        Public Betting
                    </span>
                    <span className={`material-symbols-outlined text-text-muted text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        expand_more
                    </span>
                </div>
                {onMatchDetailsClick && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onMatchDetailsClick(); }}
                        className="flex items-center gap-1 cursor-pointer group"
                    >
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest group-hover:text-white transition-colors">
                            Match Details
                        </span>
                        <span className="material-symbols-outlined text-text-muted text-sm group-hover:text-white transition-colors">
                            chevron_right
                        </span>
                    </div>
                )}
            </div>

            {/* Expanded Panel */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px]' : 'max-h-0'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 py-4 bg-neutral-900/40 border-t border-border-muted">
                    <StatBlock
                        label="Money Line"
                        away={{ bets: mlStats.awayBets, money: mlStats.awayMoney }}
                        home={{ bets: mlStats.homeBets, money: mlStats.homeMoney }}
                        leftColor="bg-blue-600"
                        rightColor="bg-yellow-500"
                    />
                    <StatBlock
                        label="Spread"
                        away={{ bets: spreadStats.awayBets, money: spreadStats.awayMoney }}
                        home={{ bets: spreadStats.homeBets, money: spreadStats.homeMoney }}
                        leftColor="bg-blue-600"
                        rightColor="bg-yellow-500"
                    />
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-300 uppercase">Over</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">O/U</span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase">Under</span>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-white">{ouStats.awayBets}%</span>
                                <span className="text-slate-600">Bets</span>
                                <span className="text-white">{ouStats.homeBets}%</span>
                            </div>
                            {renderBar(ouStats.awayBets, ouStats.homeBets, 'bg-emerald-500', 'bg-blue-600')}
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-white">{ouStats.awayMoney}%</span>
                                <span className="text-slate-600">Money</span>
                                <span className="text-white">{ouStats.homeMoney}%</span>
                            </div>
                            {renderBar(ouStats.awayMoney, ouStats.homeMoney, 'bg-emerald-500', 'bg-blue-600')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
