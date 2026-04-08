import React, { useState, useEffect } from 'react';
import { Gem } from 'lucide-react';
import { fetchESPNScoreboardByDate, SportKey } from '../../data/espnScoreboard';

const FALLBACK_WINS = [
    {
        id: "1",
        user: "J. Reed",
        amount: "1",
        awayTeam: { abbr: "VAN", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/238.png", score: 75 },
        homeTeam: { abbr: "TENN", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png", score: 68 },
    },
    {
        id: "2",
        user: "M. Barnes",
        amount: "5",
        awayTeam: { abbr: "DUKE", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png", score: 82 },
        homeTeam: { abbr: "UNC", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/153.png", score: 78 },
    },
    {
        id: "3",
        user: "H. Fisher",
        amount: "53",
        awayTeam: { abbr: "MICH", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/130.png", score: 71 },
        homeTeam: { abbr: "OSU", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/194.png", score: 67 },
    },
    {
        id: "4",
        user: "T. Jenkins",
        amount: "2",
        awayTeam: { abbr: "LAL", logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png", score: 112 },
        homeTeam: { abbr: "PHX", logo: "https://a.espncdn.com/i/teamlogos/nba/500/phx.png", score: 108 },
    },
    {
        id: "5",
        user: "A. Smith",
        amount: "10",
        awayTeam: { abbr: "KC", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png", score: 31 },
        homeTeam: { abbr: "SF", logo: "https://a.espncdn.com/i/teamlogos/nfl/500/sf.png", score: 28 },
    },
    {
        id: "6",
        user: "GhostBettor",
        amount: "15",
        awayTeam: { abbr: "BOS", logo: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png", score: 120 },
        homeTeam: { abbr: "MIA", logo: "https://a.espncdn.com/i/teamlogos/nba/500/mia.png", score: 104 },
    },
    {
        id: "7",
        user: "D. Johnson",
        amount: "4",
        awayTeam: { abbr: "TEX", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/251.png", score: 65 },
        homeTeam: { abbr: "OU", logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/201.png", score: 60 },
    }
];

const RANDOM_USERS = ["J. Reed", "M. Barnes", "H. Fisher", "T. Jenkins", "A. Smith", "GhostBettor", "D. Johnson", "K. West", "V. Patel", "S. Carter", "BigMoney99", "L. James", "P. Gomez"];
const RANDOM_AMOUNTS = ["1", "5", "53", "2", "10", "15", "4", "25", "100", "7", "3", "50", "12", "8"];

export const WinningTicker: React.FC = () => {
    const [wins, setWins] = useState(FALLBACK_WINS);

    useEffect(() => {
        let mounted = true;
        const loadRealWins = async () => {
            try {
                // Determine yesterday's date
                const yest = new Date();
                yest.setDate(yest.getDate() - 1);
                const dateStr = yest.toISOString().split('T')[0];

                // Fetch yesterday's games for a few active sports
                const sportsToFetch: SportKey[] = ['NBA', 'NHL', 'CBB', 'Soccer.EPL'];
                const results = await Promise.all(
                    sportsToFetch.map(s => fetchESPNScoreboardByDate(s, dateStr))
                );
                
                const allGames = results.flat();
                // Filter only completed games with score
                const finishedGames = allGames.filter((g) => g.status === 'post');

                if (mounted && finishedGames.length > 0) {
                    // Randomize order
                    const shuffled = finishedGames.sort(() => 0.5 - Math.random());
                    
                    const dynamicWins = shuffled.slice(0, 15).map((game, idx) => {
                        const user = RANDOM_USERS[idx % RANDOM_USERS.length];
                        const amount = RANDOM_AMOUNTS[(idx + (parseInt(game.id) || 0)) % RANDOM_AMOUNTS.length] || "5";
                        
                        return {
                            id: game.id || String(Math.random()),
                            user,
                            amount,
                            awayTeam: { 
                                abbr: game.awayTeam.abbreviation || game.awayTeam.displayName.substring(0, 3).toUpperCase(), 
                                logo: game.awayTeam.logo, 
                                score: parseInt(game.awayTeam.score || '0') 
                            },
                            homeTeam: { 
                                abbr: game.homeTeam.abbreviation || game.homeTeam.displayName.substring(0, 3).toUpperCase(), 
                                logo: game.homeTeam.logo, 
                                score: parseInt(game.homeTeam.score || '0') 
                            },
                        };
                    });
                    
                    if (dynamicWins.length >= 3) {
                        setWins(dynamicWins as any);
                    }
                }
            } catch (e) {
                console.error('Failed to load real wins for ticker', e);
            }
        };
        
        loadRealWins();
        
        return () => { mounted = false; };
    }, []);

    // Duplicate the array to make the infinite scroll smooth
    const tickerItems = [...wins, ...wins, ...wins];

    return (
        <div className="w-full bg-neutral-900 border-b border-neutral-800 py-2.5 overflow-hidden flex items-center relative z-10">
            <div className="flex w-[200%] animate-news-ticker hover:[animation-play-state:paused] whitespace-nowrap">
                {tickerItems.map((win, idx) => (
                    <div key={`${win.id}-${idx}`} className="flex items-center gap-4 px-6 border-r border-neutral-800 last:border-r-0">
                        {/* User Avatar & Name */}
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-sm bg-slate-700 text-[10px] font-black flex items-center justify-center text-white shrink-0">
                                {win.user.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-slate-300">{win.user}</span>
                        </div>
                        
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Just Won</span>
                        
                        {/* Amount */}
                        <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/30 px-1.5 py-0.5 rounded">
                            <Gem className="w-3 h-3 text-green-400" />
                            <span className="text-xs font-black text-green-400">{win.amount}</span>
                        </div>
                        
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">On</span>
                        
                        {/* Game Matchup */}
                        <div className="flex items-center gap-2">
                            {/* Away */}
                            <div className="flex items-center gap-1.5">
                                <img src={win.awayTeam.logo} alt={win.awayTeam.abbr} className="w-4 h-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                <span className="text-xs font-black text-white">{win.awayTeam.abbr}</span>
                            </div>
                            
                            {/* Score Block */}
                            <div className="flex items-center gap-1 border border-neutral-700 bg-neutral-950 px-1.5 py-0.5 rounded uppercase font-black text-[10px]">
                                <span className="text-white">{win.awayTeam.score} - {win.homeTeam.score}</span>
                            </div>
                            
                            {/* Home */}
                            <div className="flex items-center gap-1.5">
                                <img src={win.homeTeam.logo} alt={win.homeTeam.abbr} className="w-4 h-4 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                <span className="text-xs font-black text-white">{win.homeTeam.abbr}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
