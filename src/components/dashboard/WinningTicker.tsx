import React, { useState, useEffect } from 'react';
import { fetchESPNScoreboardByDate, SportKey } from '../../data/espnScoreboard';

// ── PickLabs Lab Flask SVG icon ──────────────────────────────────────────────
const FlaskIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Flask body */}
        <path
            d="M9 3h6M8.5 3v6.5L4 18a2 2 0 001.8 2.9h12.4A2 2 0 0020 18l-4.5-8.5V3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {/* Liquid fill dots */}
        <circle cx="9.5" cy="16" r="1" fill="currentColor" opacity="0.85" />
        <circle cx="13" cy="18" r="1.2" fill="currentColor" opacity="0.85" />
        <circle cx="15" cy="15.5" r="0.8" fill="currentColor" opacity="0.6" />
    </svg>
);

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
        amount: "100",
        awayTeam: { abbr: "SA", logo: "https://a.espncdn.com/i/teamlogos/nba/500/sas.png", score: 105 },
        homeTeam: { abbr: "GS", logo: "https://a.espncdn.com/i/teamlogos/nba/500/gsw.png", score: 110 },
    },
    {
        id: "5",
        user: "A. Smith",
        amount: "12",
        awayTeam: { abbr: "EDI", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/102.png", score: 5 },
        homeTeam: { abbr: "UTA", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/399.png", score: 6 },
    },
    {
        id: "6",
        user: "GhostBettor",
        amount: "5",
        awayTeam: { abbr: "NSI", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/104.png", score: 5 },
        homeTeam: { abbr: "ANA", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/100.png", score: 0 },
    },
    {
        id: "7",
        user: "D. Johnson",
        amount: "5",
        awayTeam: { abbr: "VG", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/103.png", score: 2 },
        homeTeam: { abbr: "VA", logo: "https://a.espncdn.com/i/teamlogos/soccer/500/105.png", score: 1 },
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
                const yest = new Date();
                yest.setDate(yest.getDate() - 1);
                const dateStr = yest.toISOString().split('T')[0];

                const sportsToFetch: SportKey[] = ['NBA', 'NHL', 'CBB', 'Soccer.EPL'];
                const results = await Promise.all(
                    sportsToFetch.map(s => fetchESPNScoreboardByDate(s, dateStr))
                );

                const allGames = results.flat();
                const finishedGames = allGames.filter((g) => g.status === 'post');

                if (mounted && finishedGames.length > 0) {
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
                        setWins(dynamicWins as typeof FALLBACK_WINS);
                    }
                }
            } catch (e) {
                console.error('Failed to load real wins for ticker', e);
            }
        };

        loadRealWins();
        return () => { mounted = false; };
    }, []);

    const tickerItems = [...wins, ...wins, ...wins];

    return (
        <div className="fixed top-0 left-0 right-0 w-full bg-[#080b0a] border-b border-[#1a2b1f] overflow-hidden flex items-stretch z-[60]" style={{ minHeight: 36 }}>

            {/* ── Left brand label ── */}
            <div className="shrink-0 flex items-center gap-1.5 px-3 border-r border-[#1a2b1f] bg-[#0a120d] z-10">
                <FlaskIcon className="w-3.5 h-3.5 text-[#39FF14]" />
                <span className="text-[9px] font-black text-[#39FF14] uppercase tracking-[0.2em] whitespace-nowrap">
                    PickLabs Live
                </span>
                {/* Pulsing dot */}
                <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse shrink-0" />
            </div>

            {/* ── Scrolling ticker ── */}
            <div className="flex-1 overflow-hidden relative">
                {/* Fade masks */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#080b0a] to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#080b0a] to-transparent z-10 pointer-events-none" />

                <div className="flex w-[200%] animate-news-ticker hover:[animation-play-state:paused] whitespace-nowrap items-center h-full">
                    {tickerItems.map((win, idx) => (
                        <div
                            key={`${win.id}-${idx}`}
                            className="inline-flex items-center gap-2.5 pl-5 pr-4 border-r border-[#1a2b1f] last:border-r-0 h-full"
                        >
                            {/* ── User avatar + name ── */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                <div className="w-[18px] h-[18px] rounded bg-[#0f1f14] border border-[#2a4a30] text-[9px] font-black flex items-center justify-center text-[#39FF14] shrink-0 leading-none uppercase">
                                    {win.user.charAt(0)}
                                </div>
                                <span className="text-[11px] font-bold text-slate-200 tracking-tight">{win.user}</span>
                            </div>

                            {/* JUST WON label */}
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.15em]">Just Won</span>

                            {/* ── Amount badge with flask icon ── */}
                            <div className="inline-flex items-center gap-1 bg-[#0d1f10] border border-[#2a5a20] px-1.5 py-[2px] rounded-[4px] shrink-0">
                                <FlaskIcon className="w-2.5 h-2.5 text-[#39FF14]" />
                                <span className="text-[11px] font-black text-[#39FF14] tabular-nums leading-none">{win.amount}</span>
                            </div>

                            {/* ON label */}
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-[0.15em]">On</span>

                            {/* ── Game matchup ── */}
                            <div className="flex items-center gap-1.5 shrink-0">
                                {/* Away team */}
                                <div className="flex items-center gap-1">
                                    <div className="w-[18px] h-[18px] rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={win.awayTeam.logo}
                                            alt={win.awayTeam.abbr}
                                            className="w-3.5 h-3.5 object-contain"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-black text-white">{win.awayTeam.abbr}</span>
                                </div>

                                {/* Score pill */}
                                <div className="inline-flex items-center gap-0.5 bg-[#0a0a0a] border border-[#252525] rounded-[4px] px-1.5 py-[2px] shadow-[0_0_6px_rgba(57,255,20,0.06)]">
                                    <span className="text-[10px] font-black text-white tabular-nums">{win.awayTeam.score}</span>
                                    <span className="text-[8px] text-slate-600 font-bold mx-0.5">–</span>
                                    <span className="text-[10px] font-black text-white tabular-nums">{win.homeTeam.score}</span>
                                </div>

                                {/* Home team */}
                                <div className="flex items-center gap-1">
                                    <div className="w-[18px] h-[18px] rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={win.homeTeam.logo}
                                            alt={win.homeTeam.abbr}
                                            className="w-3.5 h-3.5 object-contain"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-black text-white">{win.homeTeam.abbr}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
