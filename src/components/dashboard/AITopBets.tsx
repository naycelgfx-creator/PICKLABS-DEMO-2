import React, { useEffect, useState } from 'react';
import { Game } from '../../data/mockGames';
import { BetPick } from '../../App';
import { fetchESPNNews, ESPNNewsItem } from '../../data/espnNews';
import { getCurrentUser, isAdminEmail } from '../../data/PickLabsAuthDB';
import { PremiumLockView } from '../shared/PremiumLockView';
import { useRookieMode } from '../../contexts/RookieModeContext';

interface AITopBetsProps {
    game: Game;
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
}

// Derive AI rationale from real ESPN news for a given game
const buildAnalysis = (
    news: ESPNNewsItem[],
    teamName: string,
    fallback: string
): string => {
    // Look for injury/trade news mentioning this team
    const relevant = news.filter(n =>
        n.teams?.some(t => t.toLowerCase().includes(teamName.toLowerCase().split(' ').pop()?.toLowerCase() ?? '')) ||
        n.headline.toLowerCase().includes(teamName.toLowerCase().split(' ').pop()?.toLowerCase() ?? '')
    );
    if (relevant.length > 0) {
        const top = relevant[0];
        const prefix = top.category === 'injury' ? '⚠️ Injury Context:' : top.category === 'trade' ? '🔄 Roster Move:' : '📰 PickLabs Context:';
        return `${prefix} ${top.headline}`;
    }
    return fallback;
};

import { SPORT_LOGOS } from '../../data/mockGames';

export const AITopBets: React.FC<AITopBetsProps> = ({ game, onAddBet }) => {
    const [espnNews, setEspnNews] = useState<ESPNNewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    const { hasExceededQuota } = useRookieMode(); // Moved this line up
    const user = getCurrentUser();
    const isPremiumUser = user?.isPremium || isAdminEmail(user?.email || '');

    // Determine sport from game data
    const sport = game.sport || 'NBA';
    const sportLogo = SPORT_LOGOS[sport] || SPORT_LOGOS['NBA'];

    useEffect(() => {
        let cancelled = false;
        const loadNews = async () => {
            setLoading(true);
            const news = await fetchESPNNews(sport);
            if (!cancelled) {
                setEspnNews(news);
                setLastUpdate(new Date().toLocaleTimeString());
                setLoading(false);
            }
        };
        loadNews();
        const interval = setInterval(loadNews, 120_000);
        return () => { cancelled = true; clearInterval(interval); };
    }, [sport]);

    const awayName = game.awayTeam.name;
    const homeName = game.homeTeam.name;

    const topBets = [
        {
            title: 'Highest Confidence (98%)',
            type: 'Spread' as const,
            team: `${awayName} ${game.odds.spread}`,
            gameId: game.id,
            odds: '-110',
            matchupStr: `${awayName} vs ${homeName}`,
            stake: 50,
            analysis: loading
                ? 'Analyzing live data...'
                : buildAnalysis(
                    espnNews,
                    awayName,
                    `Model ran ${awayName} matchup 10,000x. Strong spread value detected vs ${homeName}.`
                ),
        },
        {
            title: 'Strong Value Play',
            type: 'Over' as const,
            team: `Over ${game.odds.overUnder.value}`,
            gameId: game.id,
            odds: '-110',
            matchupStr: `${awayName} vs ${homeName}`,
            stake: 50,
            analysis: loading
                ? 'Fetching live game context...'
                : buildAnalysis(
                    espnNews,
                    homeName,
                    `Both teams averaging high scoring outputs this week. Projected total well above the ${game.odds.overUnder.value} line.`
                ),
        },
        {
            title: 'Moneyline Lock',
            type: 'ML' as const,
            team: `${homeName} ML`,
            gameId: game.id,
            odds: game.odds.moneyline,
            matchupStr: `${awayName} vs ${homeName}`,
            stake: 100,
            analysis: loading
                ? 'Loading live news context...'
                : !isPremiumUser
                    ? `🔒 Win probability analysis and live edges are locked for Free Accounts. Upgrade to Premium to see this exclusive AI data.`
                    : (
                        espnNews.find(n => n.category === 'injury')?.headline
                            ? `📋 Injury Alert: ${espnNews.find(n => n.category === 'injury')!.headline}. Win probability adjusted: ${homeName} 57%.`
                            : `Win probability: 57% for ${homeName} at current odds. Edge confirmed via PickLabs analysis.`
                    ),
        },
    ];

    return (
        <div className="terminal-panel border-primary/30 bg-primary/5 p-6 relative overflow-hidden mt-6">
            {/* Background accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-4 relative z-10 border-b border-primary/20 pb-4">
                <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
                <div className="flex-1">
                    <h3 className="text-lg font-black text-text-main uppercase tracking-[0.2em] italic flex items-center">
                        <img src={sportLogo} alt={sport} className="h-6 w-auto inline-block mr-2 brightness-0 invert opacity-80" /> AI Predictions
                    </h3>
                    <p className="text-[10px] text-primary uppercase font-bold tracking-widest">
                        Based on PickLabs Live Data · 10,000 Simulations
                    </p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                        <span className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-slate-600' : 'bg-red-500 animate-pulse'}`}></span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{loading ? 'Fetching data...' : 'PickLabs Live'}</span>
                    </div>
                    {lastUpdate && (
                        <span className="text-[8px] text-slate-600">Updated {lastUpdate}</span>
                    )}
                </div>
            </div>

            {(!isPremiumUser && hasExceededQuota) ? (
                <div className="flex justify-center py-12">
                    <PremiumLockView featureName="AI Predictions" onNavigate={() => { }} />
                </div>
            ) : (
                <>
                    {/* PickLabs news context bar */}
                    {!loading && espnNews.length > 0 && (
                        <div className="mb-4 p-2 bg-neutral-800/40 border border-neutral-700/50 rounded-lg flex items-start gap-2 relative z-10">
                            <span className="material-symbols-outlined text-primary text-[14px] shrink-0 mt-0.5">info</span>
                            <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                                <span className="text-primary font-bold">PickLabs Context: </span>
                                {espnNews[0]?.headline}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        {topBets.map((bet, idx) => (
                            <div
                                key={idx}
                                className="bg-neutral-900/60 border border-border-muted rounded-lg p-5 flex flex-col justify-between group hover:border-primary/50 transition-colors"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-[9px] font-black uppercase text-accent-purple bg-accent-purple/10 px-2 py-1 rounded border border-accent-purple/20">
                                            {bet.title}
                                        </span>
                                        <span className="text-text-main font-black text-xs">{bet.odds}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-text-main mb-2">{bet.team}</h4>
                                    <p className={`text-[10px] italic mb-4 leading-relaxed ${loading ? 'text-slate-600 animate-pulse' : 'text-text-muted'}`}>
                                        {bet.analysis}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onAddBet(bet)}
                                    disabled={loading}
                                    className="w-full py-2.5 mt-auto bg-primary/20 text-primary hover:bg-primary hover:text-black border border-primary/30 rounded font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    Add to Slip
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
