import React, { useState, useEffect, useCallback } from 'react';
import { SportsNav } from './SportsNav';
import { SoccerLeagueNav } from './SoccerLeagueNav';
import { TennisSubNav } from './TennisSubNav';
import { TennisTournamentPanel } from './TennisTournamentPanel';
import { GolfLeaderboardPanel } from './GolfLeaderboardPanel';
import { GameCard } from './GameCard';
import { BetSlip } from './BetSlip';
import { DateFilter } from './DateFilter';
import { SPORTS, Game } from '../../data/mockGames';
import { BetPick } from '../../App';
import { ESPNScoreboardPanel } from './ESPNScoreboardPanel';
import { APP_SPORT_TO_ESPN, SOCCER_LEAGUES, fetchESPNScoreboardByDate, ESPNGame, SportKey } from '../../data/espnScoreboard';
import { generateAIPrediction, fetchTeamLastFive } from '../../data/espnTeams';
import { RookieGuideBanner } from '../shared/RookieGuideBanner';

interface LiveBoardProps {
    setCurrentView: (view: 'live-board' | 'matchup-terminal') => void;
    onSelectGame: (game: Game) => void;
    betSlip: BetPick[];
    setBetSlip: React.Dispatch<React.SetStateAction<BetPick[]>>;
    activeTickets: BetPick[][];
    setActiveTickets: React.Dispatch<React.SetStateAction<BetPick[][]>>;
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
}

// Convert an ESPN game into the app's Game shape — uses real AI prediction engine
const espnGameToGame = (eg: ESPNGame, homeForm: ('W' | 'L' | 'D')[] = [], awayForm: ('W' | 'L' | 'D')[] = []): Game => {
    const isLive = eg.status === 'in';
    const isFinal = eg.status === 'post';

    // Use real AI prediction engine from espnTeams
    const prediction = generateAIPrediction(
        eg.homeTeam.record,
        eg.awayTeam.record,
        eg.sport,
        homeForm,
        awayForm,
    );

    const gameDate = eg.date ? eg.date.split('T')[0] : new Date().toISOString().split('T')[0];
    const statusLabel = isLive
        ? eg.statusDetail || 'LIVE'
        : isFinal
            ? `Final • ${eg.awayTeam.score}–${eg.homeTeam.score}`
            : eg.statusDetail || 'Upcoming';

    // Fallback form from record pct when ESPN schedule data unavailable
    const recordForm = (record: string): ('W' | 'L')[] => {
        const [w, l] = record.split('-').map(Number);
        const pct = (w || 0) / Math.max((w || 0) + (l || 0), 1);
        return Array.from({ length: 5 }, (_, i) => {
            // deterministic from record
            return ((w || 0) + i) % Math.round(1 / Math.max(1 - pct, 0.01)) === 0 ? 'L' : 'W';
        });
    };

    return {
        id: `espn-${eg.id}`,
        sport: eg.sport,
        sportLogo: eg.sport === 'CBB' ? '/CBB_logo.png' :
            eg.sport === 'NCAAW' ? '/NCAAW_logo.png' :
                eg.sport === 'CFB' ? '/NCAAF_logo.png' :
                    `https://a.espncdn.com/i/teamlogos/leagues/500/${eg.sport.toLowerCase()}.png`,
        status: isLive ? 'LIVE' : 'UPCOMING',
        timeLabel: statusLabel,
        matchupId: `#PL-${eg.id}`,
        date: gameDate,
        league: eg.sport,
        broadcast: eg.broadcast,
        venue: {
            name: eg.venue,
            location: eg.city,
        },
        awayTeam: {
            id: eg.awayTeam.id,
            name: eg.awayTeam.displayName,
            logo: eg.awayTeam.logo,
            record: eg.awayTeam.record,
            color: `#${eg.awayTeam.color}`,
            winProb: prediction.awayWinProb,
            recentForm: (awayForm.length >= 3 ? awayForm : recordForm(eg.awayTeam.record)).map(f => f === 'D' ? 'L' : f) as ('W' | 'L')[],
            score: isLive || isFinal ? parseInt(eg.awayTeam.score) || undefined : undefined,
        },
        homeTeam: {
            id: eg.homeTeam.id,
            name: eg.homeTeam.displayName,
            logo: eg.homeTeam.logo,
            record: eg.homeTeam.record,
            color: `#${eg.homeTeam.color}`,
            winProb: prediction.homeWinProb,
            recentForm: (homeForm.length >= 3 ? homeForm : recordForm(eg.homeTeam.record)).map(f => f === 'D' ? 'L' : f) as ('W' | 'L')[],
            score: isLive || isFinal ? parseInt(eg.homeTeam.score) || undefined : undefined,
        },
        odds: {
            moneyline: prediction.moneylineHome,
            spread: prediction.spread,
            overUnder: { value: prediction.total, pick: prediction.overUnderPick },
        },
        streakLabel: `PickLabs AI · ${prediction.confidence}% confidence · ${prediction.insight}`,
    };
};

// Enrich a list of raw ESPN games with real last-5 form data (async)
const enrichWithLastFive = async (games: ESPNGame[], sport: string): Promise<Game[]> => {
    const results = await Promise.allSettled(
        games.map(async eg => {
            const [homeForm, awayForm] = await Promise.all([
                fetchTeamLastFive(eg.homeTeam.displayName, sport).catch(() => [] as ('W' | 'L' | 'D')[]),
                fetchTeamLastFive(eg.awayTeam.displayName, sport).catch(() => [] as ('W' | 'L' | 'D')[]),
            ]);
            return espnGameToGame(eg, homeForm, awayForm);
        })
    );
    return results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : espnGameToGame(games[i])
    );
};

export const LiveBoard: React.FC<LiveBoardProps> = ({ setCurrentView, onSelectGame, betSlip, setBetSlip, activeTickets, setActiveTickets, onAddBet }) => {
    const [activeSport, setActiveSport] = useState<string>(SPORTS[0]);
    const [activeTab, setActiveTab] = useState<'espn' | 'simulated'>('espn');
    const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
    const [showPublicBets, setShowPublicBets] = useState<boolean>(true);
    const [showBetSlip, setShowBetSlip] = useState<boolean>(true);
    const today = (() => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${day}`; })();
    const [selectedDate, setSelectedDate] = useState<string>(today);

    // Soccer league sub-selection (defaults to EPL)
    const [activeSoccerLeague, setActiveSoccerLeague] = useState<SportKey>('Soccer.EPL');
    const isSoccer = activeSport === 'Soccer';

    // Tennis tour sub-selection (defaults to ATP)
    const [activeTennisTour, setActiveTennisTour] = useState<SportKey>('Tennis.ATP');
    const isTennis = activeSport === 'Tennis';
    const isGolf = activeSport === 'Golf';

    // Sports that use TennisTournamentPanel (player-vs-player matches)
    const useTennisPanel = isTennis;
    // Golf uses dedicated leaderboard panel
    const useGolfPanel = isGolf;

    // The effective ESPN key: for Soccer use selected sub-league, for Tennis use selected tour, for Golf use PGA
    const effectiveEspnKey: SportKey | null = isSoccer
        ? activeSoccerLeague
        : isTennis
            ? activeTennisTour
            : (APP_SPORT_TO_ESPN[activeSport] as SportKey | null);

    // Real ESPN games for Simulated tab
    const [espnGames, setEspnGames] = useState<Game[]>([]);
    const [loadingEspn, setLoadingEspn] = useState(false);

    const hasESPN = effectiveEspnKey !== null;

    const loadGamesData = useCallback(async () => {
        if (!effectiveEspnKey) {
            // Sport has no ESPN scoreboard support — show no games
            setEspnGames([]);
            return;
        }
        setLoadingEspn(true);
        try {
            const raw = await fetchESPNScoreboardByDate(effectiveEspnKey, selectedDate);
            let games = raw.length > 0 ? raw.map(eg => espnGameToGame(eg)) : [];
            // First pass: fast render with record-based prediction
            setEspnGames(games);

            if (raw.length > 0) {
                if (activeTab === 'simulated') {
                    // Second pass: enrich with Python AI Edge API
                    try {
                        const payload = {
                            games: games.map(g => {
                                let decOdds = 1.90; // Default -110 odds manually parse
                                if (g.odds.moneyline && g.odds.moneyline !== 'N/A') {
                                    const ml = parseInt(g.odds.moneyline.replace(/[^0-9-]/g, ''));
                                    if (!isNaN(ml)) {
                                        decOdds = ml < 0 ? (100 / Math.abs(ml)) + 1 : (ml / 100) + 1;
                                    }
                                }
                                return { id: g.id, odds: decOdds };
                            })
                        };
                        const res = await fetch('http://localhost:8005/api/predict', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const data = await res.json();
                        if (data.status === 'success' && data.predictions) {
                            games = games.map(g => {
                                if (data.predictions[g.id]) {
                                    return {
                                        ...g,
                                        aiData: data.predictions[g.id],
                                        streakLabel: <><span className="material-symbols-outlined text-orange-500 text-[10px] align-middle mr-1">local_fire_department</span> AI STRATEGY ACTIVE</>
                                    };
                                }
                                return g;
                            });
                            setEspnGames(games);
                        }
                    } catch (e) {
                        console.error('Failed to fetch AI predictions from Python API', e);
                    }
                } else {
                    // Second pass: enrich with real last-5 W/L from ESPN schedule (async)
                    const enriched = await enrichWithLastFive(raw, activeSport);
                    setEspnGames(enriched);
                }
            }
        } catch {
            setEspnGames([]);
        } finally {
            setLoadingEspn(false);
        }
    }, [effectiveEspnKey, selectedDate, activeSport, activeTab]);

    useEffect(() => {
        loadGamesData();
    }, [loadGamesData]);

    // Split games into three status buckets
    const liveGames = espnGames.filter(g => g.status === 'LIVE');
    const upcomingGames = espnGames.filter(g => g.status === 'UPCOMING');
    const finalGames = espnGames.filter(g => g.status !== 'LIVE' && g.status !== 'UPCOMING');

    const statusSections = [
        { label: 'LIVE NOW', games: liveGames, dot: 'green' as const },
        { label: 'UPCOMING', games: upcomingGames, dot: 'yellow' as const },
        { label: 'FINAL', games: finalGames, dot: 'grey' as const },
    ].filter(s => s.games.length > 0);

    return (
        <>
            <SportsNav activeSport={activeSport} onSelectSport={(sport) => {
                setActiveSport(sport);
                const espnKey = sport === 'Soccer' ? activeSoccerLeague
                    : sport === 'Tennis' ? activeTennisTour
                        : APP_SPORT_TO_ESPN[sport];
                setActiveTab(espnKey ? 'espn' : 'simulated');
            }} />

            {/* Soccer league sub-nav */}
            {isSoccer && (
                <SoccerLeagueNav
                    activeLeague={activeSoccerLeague}
                    onSelectLeague={(league) => {
                        setActiveSoccerLeague(league);
                        setActiveTab('espn');
                    }}
                />
            )}

            {/* Tennis tour sub-nav — ATP / WTA */}
            {isTennis && (
                <TennisSubNav
                    activeTour={activeTennisTour}
                    onSelectTour={(tour) => {
                        setActiveTennisTour(tour);
                        setActiveTab('espn');
                    }}
                />
            )}

            <DateFilter selectedDate={selectedDate} onSelectDate={setSelectedDate} activeSport={activeSport} />
            <main className="max-w-[1536px] mx-auto px-3 sm:px-6 py-2 grid grid-cols-12 gap-3 sm:gap-6 relative">
                <div className="col-span-12 lg:col-span-9 space-y-6">
                    <RookieGuideBanner />
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Title: show league/tour name for soccer/tennis/golf, else sport name */}
                            {isSoccer ? (
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-text-main italic uppercase">
                                        {SOCCER_LEAGUES.find(l => l.key === activeSoccerLeague)?.label ?? 'Soccer'} Live Board
                                    </h2>
                                    <img
                                        src={SOCCER_LEAGUES.find(l => l.key === activeSoccerLeague)?.logo}
                                        alt=""
                                        className="h-7 w-7 object-contain opacity-80"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                            ) : isTennis ? (
                                <h2 className="text-2xl font-black text-text-main italic uppercase">
                                    {activeTennisTour === 'Tennis.ATP' ? 'ATP Tour' : 'WTA Tour'} Live Board
                                </h2>
                            ) : isGolf ? (
                                <h2 className="text-2xl font-black text-text-main italic uppercase">⛳ PGA Tour Live Board</h2>
                            ) : (
                                <h2 className="text-2xl font-black text-text-main italic uppercase">{activeSport} Live Board</h2>
                            )}
                        </div>

                        <div className="flex gap-1">
                            {/* Public Bets toggle */}
                            <button
                                onClick={() => setShowPublicBets(p => !p)}
                                title={showPublicBets ? 'Hide Public Bets' : 'Show Public Bets'}
                                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-sm border text-[10px] font-black uppercase tracking-wider transition-all ${showPublicBets
                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                    : 'border-border-muted text-text-muted hover:text-text-main hover:bg-neutral-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">group</span>
                                <span className="hidden sm:inline">Public</span>
                            </button>
                            {/* Bet Slip toggle */}
                            <button
                                onClick={() => setShowBetSlip(p => !p)}
                                title={showBetSlip ? 'Hide Bet Slip' : 'Show Bet Slip'}
                                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-sm border text-[10px] font-black uppercase tracking-wider transition-all ${showBetSlip
                                    ? 'bg-accent-purple/10 border-accent-purple/40 text-accent-purple'
                                    : 'border-border-muted text-text-muted hover:text-text-main hover:bg-neutral-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">receipt_long</span>
                                <span className="hidden sm:inline">Slip</span>
                                {betSlip.length > 0 && (
                                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-accent-purple text-white text-[9px] font-black">
                                        {betSlip.length}
                                    </span>
                                )}
                            </button>
                            {/* List view */}
                            <button
                                onClick={() => setLayoutMode('list')}
                                title="List View"
                                className={`p-2 rounded-sm border transition-all ${layoutMode === 'list'
                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                    : 'border-border-muted text-text-muted hover:text-text-main hover:bg-neutral-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">view_list</span>
                            </button>
                            {/* Grid view */}
                            <button
                                onClick={() => setLayoutMode('grid')}
                                title="Grid View"
                                className={`p-2 rounded-sm border transition-all ${layoutMode === 'grid'
                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                    : 'border-border-muted text-text-muted hover:text-text-main hover:bg-neutral-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">grid_view</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Toggle */}
                    <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded p-1 w-fit">
                        <button
                            onClick={() => setActiveTab('espn')}
                            disabled={!hasESPN}
                            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'espn' && hasESPN
                                ? 'bg-primary text-black shadow'
                                : 'text-slate-500 hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">wifi</span>
                            PickLabs Live
                        </button>
                        <button
                            onClick={() => setActiveTab('simulated')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'simulated'
                                ? 'bg-neutral-700 text-white shadow'
                                : 'text-slate-500 hover:text-text-main'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                            AI Predictions
                        </button>
                    </div>

                    {/* ESPN Live Tab */}
                    {activeTab === 'espn' && hasESPN && (
                        useTennisPanel ? (
                            // Tennis: player-vs-player with sets & country flags
                            <TennisTournamentPanel
                                sportKey={effectiveEspnKey!}
                                selectedDate={selectedDate}
                                onSelectGame={(game) => {
                                    onSelectGame(game);
                                    setCurrentView('matchup-terminal');
                                }}
                            />
                        ) : useGolfPanel ? (
                            // Golf: full tournament leaderboard
                            <GolfLeaderboardPanel
                                sportKey={effectiveEspnKey!}
                                selectedDate={selectedDate}
                                onSelectGame={(game) => {
                                    onSelectGame(game);
                                    setCurrentView('matchup-terminal');
                                }}
                            />
                        ) : (
                            // All team sports: standard ESPN scoreboard panel
                            <ESPNScoreboardPanel
                                sport={activeSport}
                                selectedDate={selectedDate}
                                overrideSportKey={effectiveEspnKey ?? undefined}
                                layoutMode={layoutMode}
                                onSelectGame={(espnGame) => {
                                    const game = espnGameToGame(espnGame);
                                    onSelectGame(game);
                                    setCurrentView('matchup-terminal');
                                }}
                            />
                        )
                    )}

                    {/* AI Predictions Tab — real ESPN games mapped to Game format */}
                    {activeTab === 'simulated' && (
                        <div className="space-y-8">
                            {/* Banner explaining this uses real ESPN game context */}
                            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                                <span className="material-symbols-outlined text-primary text-sm">psychology</span>
                                <p className="text-[11px] text-slate-400">
                                    <span className="text-primary font-bold">PickLabs AI Predictions — </span>
                                    Real games with AI-generated odds, props &amp; win probabilities. Click any card to open full AI Matchup Analysis.
                                </p>
                                {loadingEspn && (
                                    <span className="ml-auto text-[9px] text-slate-600 font-bold animate-pulse">Loading games...</span>
                                )}
                            </div>

                            {espnGames.length > 0 ? (
                                <div className="space-y-10">
                                    {statusSections.map(section => (
                                        <div key={section.label} className="space-y-4">
                                            {/* Section header with colored indicator dot */}
                                            <div className="flex items-center gap-3 pb-2 border-b border-border-muted/40">
                                                {section.dot === 'green' && (
                                                    <span className="relative flex h-2.5 w-2.5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                                    </span>
                                                )}
                                                {section.dot === 'yellow' && (
                                                    <span className="inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400"></span>
                                                )}
                                                {section.dot === 'grey' && (
                                                    <span className="inline-flex rounded-full h-2.5 w-2.5 bg-neutral-500"></span>
                                                )}
                                                <h3 className={`font-black uppercase tracking-widest text-xs ${section.dot === 'green' ? 'text-green-400' :
                                                    section.dot === 'yellow' ? 'text-yellow-400' :
                                                        'text-neutral-500'
                                                    }`}>{section.label}</h3>
                                                <span className="text-[10px] font-bold text-neutral-600">({section.games.length})</span>
                                                <div className="h-px bg-gradient-to-r from-border-muted/40 to-transparent flex-1"></div>
                                            </div>

                                            <div className={layoutMode === 'grid'
                                                ? 'grid grid-cols-1 xl:grid-cols-2 gap-6'
                                                : 'flex flex-col gap-3'
                                            }>
                                                {section.games.map(game => (
                                                    <GameCard
                                                        key={game.id}
                                                        game={game}
                                                        betSlip={betSlip}
                                                        publicBettingOpen={showPublicBets}
                                                        onPublicBettingToggle={() => setShowPublicBets(p => !p)}
                                                        onSelectGame={() => {
                                                            onSelectGame(game);
                                                            setCurrentView('matchup-terminal');
                                                        }}
                                                        onAddBet={onAddBet}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : loadingEspn ? (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border border-dashed border-border-muted rounded-xl bg-[#0a0f16]">
                                    <span className="material-symbols-outlined text-4xl text-primary mb-2 animate-pulse">sports_basketball</span>
                                    <h3 className="text-text-main font-black uppercase tracking-widest text-sm mb-1">Loading Games</h3>
                                    <p className="text-text-muted text-xs">Fetching live data...</p>
                                </div>
                            ) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border border-dashed border-border-muted rounded-xl bg-[#0a0f16]">
                                    <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">event_busy</span>
                                    <h3 className="text-text-main font-black uppercase tracking-widest text-sm mb-1">No Games Scheduled</h3>
                                    <p className="text-text-muted text-xs">
                                        There are no {activeSport} games on {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {showBetSlip && <BetSlip betSlip={betSlip} setBetSlip={setBetSlip} activeTickets={activeTickets} setActiveTickets={setActiveTickets} onClose={() => setShowBetSlip(false)} />}
            </main>
        </>
    );
};
