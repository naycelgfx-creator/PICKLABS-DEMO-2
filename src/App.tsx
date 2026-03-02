import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { SimulationOverlay } from './components/ui/SimulationOverlay';
import { LiveBoard } from './components/live-board/LiveBoard';
import { Game } from './data/mockGames';
import { SharpToolsView } from './components/sharp-tools/SharpToolsView';
import { BankrollView } from './components/bankroll/BankrollView';
import { MatchupTerminalView } from './components/dashboard/MatchupTerminalView';
import { SocialDashboardView } from './components/dashboard/SocialDashboardView';
import { TeamsDirectory } from './components/directory/TeamsDirectory';
import { PopularBetsView } from './components/popular/PopularBetsView';
import { SavedPicksView } from './components/saved/SavedPicksView';
import { ValueFinderView } from './components/value-finder/ValueFinderView';
import { LandingPageView } from './components/landing/LandingPageView';
import { LoginPageView } from './components/auth/LoginPageView';
import { SportsbookView } from './components/sportsbook/SportsbookView';
import { HolographicBoardView } from './components/holographic-board/HolographicBoardView';
import { RookieTour } from './components/ui/RookieTour';
import { APP_SPORT_TO_ESPN, fetchESPNScoreboardByDate, ESPNGame, SportKey } from './data/espnScoreboard';
import { generateAIPrediction } from './data/espnTeams';
import { getCurrentUser, isAdminEmail } from './data/PickLabsAuthDB';
import { useRookieMode } from './contexts/RookieModeContext';

export interface BetPick {
  id: string;
  gameId: string;
  type: 'ML' | 'Spread' | 'Over' | 'Under' | 'Prop';
  team: string; // "Lakers" or "Lakers -8.5" or "LeBron Over 25.5 Pts"
  odds: string; // "+180" or "-110"
  matchupStr: string; // "Lakers vs Celtics"
  stake: number;
  gameStatus?: string;
  gameStatusName?: string;
  gameDate?: string;
}

export interface ResolvedTicket {
  id: string;
  picks: BetPick[];
  status: 'WON' | 'LOST';
  stake: number;
  payout: number;
  dateStr: string;
}

import { PremiumLockView, ViewType } from './components/shared/PremiumLockView';

// ─── Premium Lock Helper View ─────────────────────────────────────────────────
// Extracted to src/components/shared/PremiumLockView.tsx
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────

function App() {
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (!getCurrentUser()) return 'landing-page';
    try {
      const saved = localStorage.getItem('picklabs_last_view') as ViewType;
      // Do not restore marketing views if already logged in
      if (saved && saved !== 'login-page' && saved !== 'landing-page') {
        return saved;
      }
    } catch { /* ignore */ }
    return 'live-board';
  });

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Persist current view changes to localStorage
  useEffect(() => {
    localStorage.setItem('picklabs_last_view', currentView);
  }, [currentView]);
  const [betSlip, setBetSlip] = useState<BetPick[]>([]);
  const [bankroll, setBankroll] = useState<number>(1000);
  const [ticketHistory, setTicketHistory] = useState<ResolvedTicket[]>([]);
  const [activeTickets, setActiveTickets] = useState<BetPick[][]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [isAIPickLoading, setIsAIPickLoading] = useState(false);

  // Free Tier Quota
  const { incrementQuota } = useRookieMode();

  // Bankroll Handlers
  const handlePlaceTicket = (ticket: BetPick[], totalStake: number) => {
    setBankroll(prev => prev - totalStake);
    setActiveTickets(prev => [ticket, ...prev]);
  };

  const handleResolveTicket = (ticketIndex: number, status: 'WON' | 'LOST', stake: number, payout: number) => {
    const ticket = activeTickets[ticketIndex];
    if (!ticket) return;

    if (status === 'WON') {
      setBankroll(prev => prev + payout);
    }

    const historyItem: ResolvedTicket = {
      id: crypto.randomUUID(),
      picks: ticket,
      status,
      stake,
      payout,
      dateStr: new Date().toISOString()
    };

    setTicketHistory(prev => [historyItem, ...prev]);
    setActiveTickets(prev => prev.filter((_, i) => i !== ticketIndex));
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
  };

  const handleSimulationComplete = () => {
    setIsSimulating(false);
    setHasSimulated(true);
  };

  const handleSimulationCancel = () => {
    setIsSimulating(false);
  };

  const handeAddBet = (bet: Omit<BetPick, 'id'>) => {
    if (bet.gameStatus === 'FINAL' || bet.gameStatus === 'post') {
      alert("You cannot add picks for games that have already finished.");
      return;
    }

    setBetSlip(prev => {
      const existingIdx = prev.findIndex(
        b => b.gameId === bet.gameId && b.type === bet.type && b.team === bet.team
      );
      // Toggle: if already in slip → remove
      if (existingIdx !== -1) {
        return prev.filter((_, i) => i !== existingIdx);
      }
      // If adding a new bet, enforce the 20 pick limit
      if (prev.length >= 20) {
        alert("You cannot add more than 20 picks to your bet slip.");
        return prev;
      }
      // otherwise → add
      return [...prev, { ...bet, id: crypto.randomUUID() }];
    });
  };

  // ─── AI Pick My Bets — uses real ESPN games + AI engine ──────────────────────
  const handleAIPicks = useCallback(async () => {
    if (isAIPickLoading) return;

    // Feature gating for AI Picks
    const user = getCurrentUser();
    const isPremiumUser = user?.isPremium || isAdminEmail(user?.email || '');

    if (!isPremiumUser) {
      if (!incrementQuota()) {
        alert("Free Trial Quota Exceeded. AI Pick My Bets is limited to 20 uses per week for Free Accounts. Please upgrade your account to unlock unlimited access.");
        return;
      }
    }

    setIsAIPickLoading(true);
    const today = new Date().toISOString().split('T')[0];

    // All sports we can fetch from ESPN today
    const sportKeys = Object.entries(APP_SPORT_TO_ESPN).filter(([, v]) => v != null) as [string, SportKey][];

    // Candidate picks with scored confidence
    type Candidate = BetPick & { score: number };
    const candidates: Candidate[] = [];

    const allGames: { game: ESPNGame, sportLabel: string }[] = [];

    await Promise.allSettled(
      sportKeys.map(async ([sportLabel, espnKey]) => {
        try {
          const games = await fetchESPNScoreboardByDate(espnKey, today);
          for (const game of games) {
            allGames.push({ game, sportLabel });
          }
        } catch { /* skip */ }
      })
    );

    if (allGames.length > 0) {
      try {
        const payload = allGames.map(g => {
          let decOdds = 1.90;
          // Generate local odds fallback to find ML
          const pred = generateAIPrediction(
            g.game.homeTeam.record,
            g.game.awayTeam.record,
            g.sportLabel,
            [],
            []
          );

          if (pred.moneylineHome && pred.moneylineHome !== 'N/A') {
            const ml = parseInt(pred.moneylineHome.replace(/[^0-9-]/g, ''));
            if (!isNaN(ml)) decOdds = ml < 0 ? (100 / Math.abs(ml)) + 1 : (ml / 100) + 1;
          }
          return { id: g.game.id, odds: decOdds };
        });

        const res = await fetch('http://localhost:8005/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ games: payload })
        });
        const data = await res.json();

        if (data.status === 'success' && data.predictions) {
          for (const { game, sportLabel } of allGames) {
            const aiData = data.predictions[game.id];
            if (!aiData) continue;

            // Generate fallback odds strings locally
            const pred = generateAIPrediction(
              game.homeTeam.record,
              game.awayTeam.record,
              sportLabel,
              [],
              []
            );

            const matchupStr = `${game.awayTeam.displayName} vs ${game.homeTeam.displayName}`;
            const gameId = `espn-${game.id}`;
            const edge = aiData.edge;

            // Pick 1: Kelly ML
            if (aiData.suggestions.kelly > 0) {
              const aiFavoredHome = aiData.ai_probability >= 50;
              const mlTeam = aiFavoredHome ? game.homeTeam.displayName : game.awayTeam.displayName;
              const mlOdds = aiFavoredHome ? pred.moneylineHome : pred.moneylineAway;
              candidates.push({
                id: `ai-ml-${game.id}`,
                gameId,
                type: 'ML',
                team: `${mlTeam} ML`,
                odds: mlOdds,
                matchupStr,
                stake: aiData.suggestions.kelly,
                score: aiData.ai_probability + edge * 2,
                gameStatus: game.status,
                gameStatusName: game.statusName,
                gameDate: game.date,
              });
            }

            // Pick 2: Target O/U
            if (aiData.suggestions.target > 0) {
              const ouPick = pred.overUnderPick;
              candidates.push({
                id: `ai-ou-${game.id}`,
                gameId,
                type: ouPick === 'Over' ? 'Over' : 'Under',
                team: `${ouPick} ${pred.total}`,
                odds: '-110',
                matchupStr,
                stake: aiData.suggestions.target,
                score: 50 + edge,
                gameStatus: game.status,
                gameStatusName: game.statusName,
                gameDate: game.date,
              });
            }

            // Pick 3: Fixed Spread
            if (aiData.suggestions.fixed > 0) {
              const aiFavoredHome = aiData.ai_probability >= 50;
              const spreadTeam = aiFavoredHome ? game.homeTeam.displayName : game.awayTeam.displayName;
              // Format spread relative to the favored team
              let spreadDisplay = pred.spread;
              if (!aiFavoredHome && spreadDisplay.startsWith('-')) {
                spreadDisplay = '+' + spreadDisplay.substring(1);
              } else if (!aiFavoredHome && spreadDisplay.startsWith('+')) {
                spreadDisplay = '-' + spreadDisplay.substring(1);
              }
              candidates.push({
                id: `ai-spread-${game.id}`,
                gameId,
                type: 'Spread',
                team: `${spreadTeam} ${spreadDisplay}`,
                odds: '-110',
                matchupStr,
                stake: aiData.suggestions.fixed,
                score: aiData.ai_probability + edge * 1.5,
                gameStatus: game.status,
                gameStatusName: game.statusName,
                gameDate: game.date,
              });
            }
          }
        }
      } catch (err) {
        console.error('AI API failed, falling back...', err);
      }
    }

    // Sort by score desc, pick top 5, deduplicate per game (max 1 pick per game)
    const seenGames = new Set<string>();
    const top = candidates
      .sort((a, b) => b.score - a.score)
      .filter(c => {
        if (seenGames.has(c.gameId)) return false;
        seenGames.add(c.gameId);
        return true;
      })
      .slice(0, 5)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ score, ...pick }) => ({ ...pick, id: crypto.randomUUID() }));

    if (top.length === 0) {
      // No ESPN games today — show an alert
      alert('No games found today for AI picks. Try selecting a different date or sport.');
    } else {
      setBetSlip(prev => [...prev.filter(p => !p.id.startsWith('ai-')), ...top]);
    }

    setIsAIPickLoading(false);
  }, [isAIPickLoading, incrementQuota]);

  const isMarketingView = currentView === 'landing-page' || currentView === 'login-page';

  return (
    <>
      <RookieTour />
      <div className={`flex flex-col min-h-screen overflow-x-hidden w-full ${!isMarketingView ? 'pb-10' : ''}`}>
        {!isMarketingView && (
          <Header
            currentView={currentView}
            setCurrentView={setCurrentView}
            onAIPick={handleAIPicks}
            isAIPickLoading={isAIPickLoading}
          />
        )}

        <main className={`flex-1 ${!isMarketingView ? 'pt-[80px]' : ''}`}>
          {currentView === 'landing-page' && (
            <LandingPageView onNavigate={(view) => setCurrentView(view as ViewType)} />
          )}

          {currentView === 'login-page' && (
            <LoginPageView onNavigate={(view) => setCurrentView(view as ViewType)} />
          )}

          {currentView === 'live-board' && (
            <LiveBoard
              setCurrentView={setCurrentView}
              onSelectGame={setSelectedGame}
              betSlip={betSlip}
              setBetSlip={setBetSlip}
              activeTickets={activeTickets}
              setActiveTickets={setActiveTickets}
              onAddBet={handeAddBet}
              onPlaceTicket={handlePlaceTicket}
              onResolveTicket={handleResolveTicket}
            />
          )}

          {currentView === 'matchup-terminal' && !selectedGame && (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
              <div className="w-20 h-20 rounded-full bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-accent-purple">model_training</span>
              </div>
              <h2 className="text-2xl font-black italic uppercase text-text-main mb-3 tracking-tight">
                No Matchup Selected
              </h2>
              <p className="text-sm text-text-muted max-w-md mb-8 leading-relaxed">
                Head to the <span className="text-primary font-bold">Live Board</span>, click on any game card, and hit <span className="text-primary font-bold">Open Matchup Terminal</span> to run AI simulations and deep analysis.
              </p>
              <button
                onClick={() => setCurrentView('live-board')}
                className="px-8 py-4 bg-accent-purple text-white font-black uppercase tracking-[0.2em] italic rounded-xl hover:bg-purple-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center gap-3"
              >
                <span className="material-symbols-outlined">sports_score</span>
                Browse Live Games
              </button>
            </div>
          )}

          {currentView === 'matchup-terminal' && selectedGame && (
            <MatchupTerminalView
              game={selectedGame}
              onAddBet={handeAddBet}
              hasSimulated={hasSimulated}
              onRunSimulation={handleRunSimulation}
              betSlip={betSlip}
              setBetSlip={setBetSlip}
            />
          )}

          {currentView === 'teams-directory' && (
            <TeamsDirectory />
          )}

          {currentView === 'sharp-tools' && (
            getCurrentUser()?.isPremium || isAdminEmail(getCurrentUser()?.email || '')
              ? <SharpToolsView selectedGame={selectedGame} />
              : <PremiumLockView featureName="Sharp Tools" onNavigate={(view) => setCurrentView(view)} />
          )}

          {currentView === 'bankroll' && (
            getCurrentUser()?.isPremium || isAdminEmail(getCurrentUser()?.email || '')
              ? <BankrollView bankroll={bankroll} ticketHistory={ticketHistory} />
              : <PremiumLockView featureName="Bankroll Tracking" onNavigate={(view) => setCurrentView(view)} />
          )}

          {currentView === 'popular-bets' && (
            getCurrentUser()?.isPremium || isAdminEmail(getCurrentUser()?.email || '')
              ? <PopularBetsView onAddBet={handeAddBet} />
              : <PremiumLockView featureName="Popular Bets" onNavigate={(view) => setCurrentView(view)} />
          )}

          {currentView === 'saved-picks' && (
            <SavedPicksView ticketHistory={ticketHistory} />
          )}

          {currentView === 'social-dashboard' && (
            getCurrentUser()?.isPremium || isAdminEmail(getCurrentUser()?.email || '')
              ? <SocialDashboardView />
              : <PremiumLockView featureName="Social Dashboard" onNavigate={(view) => setCurrentView(view)} />
          )}

          {currentView === 'value-finder' && (
            getCurrentUser()?.isPremium || isAdminEmail(getCurrentUser()?.email || '')
              ? <ValueFinderView betSlip={betSlip} onAddBet={handeAddBet} />
              : <PremiumLockView featureName="Value Finder" onNavigate={(view) => setCurrentView(view)} />
          )}

          {currentView === '3d-board' && (
            <HolographicBoardView betSlip={betSlip} activeTickets={activeTickets} />
          )}

          {currentView === 'sportsbook' && (
            <SportsbookView
              betSlip={betSlip}
              setBetSlip={setBetSlip}
              activeTickets={activeTickets}
              setActiveTickets={setActiveTickets}
              onAddBet={handeAddBet}
              onPlaceTicket={handlePlaceTicket}
              onResolveTicket={handleResolveTicket}
            />
          )}
        </main>

        {!isMarketingView && (
          <Footer />
        )}

        <SimulationOverlay
          isOpen={isSimulating}
          onCancel={handleSimulationCancel}
          onComplete={handleSimulationComplete}
        />
      </div>
    </>
  );
}

export default App;
