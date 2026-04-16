import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BetPick } from '../../App';
import { fetchESPNScoreboardByDate, ESPNGame, APP_SPORT_TO_ESPN, SportKey, fetchESPNRoster, ESPNRosterPlayer } from '../../data/espnScoreboard';
import { generateAIPrediction } from '../../data/espnTeams';
import { RookieGuideBanner } from '../shared/RookieGuideBanner';
import { useRookieMode } from '../../contexts/RookieModeContext';
import { BetSlip } from '../live-board/BetSlip';
import { LiveTicketPanel } from '../shared/LiveTicketPanel';
import { useLiveOddsShift, applyOddsShift } from '../../hooks/useLiveOddsShift';
import { getWBCSchedule } from '../../data/mlbStatsService';
import { getCurrentUser, isAdminEmail } from '../../data/PickLabsAuthDB';

// Replace with real APIs eventually
interface SportsbookViewProps {
    betSlip: BetPick[];
    setBetSlip: React.Dispatch<React.SetStateAction<BetPick[]>>;
    activeTickets: BetPick[][];
    setActiveTickets: React.Dispatch<React.SetStateAction<BetPick[][]>>;
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
    onPlaceTicket?: (ticket: BetPick[], stake: number) => void;
    onResolveTicket?: (ticketIndex: number, status: 'WON' | 'LOST' | 'VOID', stake: number, payout: number) => void;
}

// ── Sport list ──────────────────────────────────────────────────────────────
const SPORTSBOOK_SPORTS = [
    { key: 'NBA', label: 'NBA', icon: 'sports_basketball', espn: 'NBA' as SportKey },
    { key: 'NFL', label: 'NFL', icon: 'sports_football', espn: 'NFL' as SportKey },
    { key: 'MLB', label: 'MLB', icon: 'sports_baseball', espn: 'MLB' as SportKey },
    { key: 'NHL', label: 'NHL', icon: 'sports_hockey', espn: 'NHL' as SportKey },
    { key: 'UFC', label: 'UFC', icon: 'sports_mma', espn: 'UFC' as SportKey },
    { key: 'NCAAM', label: 'NCAAM', icon: 'sports_basketball', espn: 'CBB' as SportKey },
    { key: 'NCAAB', label: 'NCAAB', icon: 'sports_baseball', espn: 'NCAAB' as SportKey },
    { key: 'NCAAW', label: 'NCAAW', icon: 'sports_basketball', espn: 'NCAAW' as SportKey },
    { key: 'CFB', label: 'CFB', icon: 'sports_football', espn: 'CFB' as SportKey },
    { key: 'Soccer', label: 'Soccer', icon: 'sports_soccer', espn: 'Soccer.EPL' as SportKey },
    { key: 'WBC', label: 'WBC', icon: 'public', espn: 'MLB' as SportKey },
] as const;

// ── Sport props config ────────────────────────────────────────────────────────
const SPORT_PROPS: Record<string, { label: string; baseMultiplier: number; odds: [string, string] }[]> = {
    NBA: [
        { label: 'Points', baseMultiplier: 1, odds: ['-115', '-105'] },
        { label: 'Rebounds', baseMultiplier: 0.35, odds: ['-110', '-110'] },
        { label: 'Assists', baseMultiplier: 0.28, odds: ['-120', '+100'] },
        { label: '3-Pointers Made', baseMultiplier: 0.18, odds: ['-115', '-105'] },
        { label: 'Steals', baseMultiplier: 0.12, odds: ['+100', '-120'] },
    ],
    NFL: [
        { label: 'Pass Yards', baseMultiplier: 1, odds: ['-110', '-110'] },
        { label: 'Rush Yards', baseMultiplier: 0.65, odds: ['-115', '-105'] },
        { label: 'Receiving Yds', baseMultiplier: 0.55, odds: ['-110', '-110'] },
        { label: 'TDs', baseMultiplier: 0.15, odds: ['+130', '-150'] },
        { label: 'Receptions', baseMultiplier: 0.40, odds: ['-115', '-105'] },
    ],
    MLB: [
        { label: 'Hits', baseMultiplier: 0.8, odds: ['-115', '-105'] },
        { label: 'RBIs', baseMultiplier: 0.5, odds: ['-110', '-110'] },
        { label: 'Strikeouts', baseMultiplier: 0.6, odds: ['-115', '-105'] },
        { label: 'Total Bases', baseMultiplier: 1.0, odds: ['-110', '-110'] },
        { label: 'Home Runs', baseMultiplier: 0.1, odds: ['+120', '-140'] },
    ],
    WBC: [
        { label: 'Hits', baseMultiplier: 0.8, odds: ['-115', '-105'] },
        { label: 'RBIs', baseMultiplier: 0.5, odds: ['-110', '-110'] },
        { label: 'Strikeouts', baseMultiplier: 0.6, odds: ['-115', '-105'] },
        { label: 'Total Bases', baseMultiplier: 1.0, odds: ['-110', '-110'] },
        { label: 'Home Runs', baseMultiplier: 0.1, odds: ['+120', '-140'] },
    ],
    NHL: [
        { label: 'Goals', baseMultiplier: 0.3, odds: ['+150', '-170'] },
        { label: 'Assists', baseMultiplier: 0.5, odds: ['-115', '-105'] },
        { label: 'Shots on Goal', baseMultiplier: 1.0, odds: ['-110', '-110'] },
        { label: 'Saves', baseMultiplier: 1.5, odds: ['-115', '-105'] },
    ],
    UFC: [
        { label: 'KO/TKO', baseMultiplier: 0.5, odds: ['+120', '-140'] },
        { label: 'Decision', baseMultiplier: 0.5, odds: ['-120', '+100'] },
        { label: 'Total Rounds', baseMultiplier: 1.0, odds: ['-110', '-110'] },
    ],
    Soccer: [
        { label: 'Goals', baseMultiplier: 0.4, odds: ['+130', '-150'] },
        { label: 'Assists', baseMultiplier: 0.3, odds: ['+150', '-170'] },
        { label: 'Shots on Target', baseMultiplier: 1.0, odds: ['-110', '-110'] },
    ],
    NCAAM: [
        { label: 'Points', baseMultiplier: 1, odds: ['-115', '-105'] },
        { label: 'Rebounds', baseMultiplier: 0.35, odds: ['-110', '-110'] },
        { label: 'Assists', baseMultiplier: 0.28, odds: ['-120', '+100'] },
    ],
    NCAAB: [
        { label: 'Hits', baseMultiplier: 0.8, odds: ['-115', '-105'] },
        { label: 'RBIs', baseMultiplier: 0.5, odds: ['-110', '-110'] },
        { label: 'Strikeouts', baseMultiplier: 0.6, odds: ['-115', '-105'] },
        { label: 'Total Bases', baseMultiplier: 1.0, odds: ['-110', '-110'] },
        { label: 'Home Runs', baseMultiplier: 0.08, odds: ['+120', '-140'] },
    ],
    NCAAW: [
        { label: 'Points', baseMultiplier: 1, odds: ['-115', '-105'] },
        { label: 'Rebounds', baseMultiplier: 0.35, odds: ['-110', '-110'] },
        { label: 'Assists', baseMultiplier: 0.28, odds: ['-120', '+100'] },
    ],
    CFB: [
        { label: 'Pass Yards', baseMultiplier: 1, odds: ['-110', '-110'] },
        { label: 'Rush Yards', baseMultiplier: 0.65, odds: ['-115', '-105'] },
        { label: 'Receiving Yds', baseMultiplier: 0.55, odds: ['-110', '-110'] },
        { label: 'TDs', baseMultiplier: 0.15, odds: ['+130', '-150'] },
    ],
};

// ── Rookie explanations ────────────────────────────────────────────────────────
const ROOKIE_TIPS: Record<string, string> = {
    ML: 'Moneyline — just pick who wins. No point spread.',
    Spread: 'Spread — the favored team must win by more than this number.',
    OVER: 'Over — both teams combined score MORE than the total.',
    UNDER: 'Under — both teams combined score LESS than the total.',
    Prop: 'Player Prop — bet on a specific player stat.',
};

// ── Tooltip wrapper ────────────────────────────────────────────────────────────
const Tip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    const [show, setShow] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    return (
        <div
            ref={ref}
            className="relative inline-block"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            {children}
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-yellow-400 text-black text-[10px] font-bold rounded-lg px-2.5 py-2 shadow-xl z-50 pointer-events-none leading-tight text-center">
                    <span className="material-symbols-outlined text-[11px] mr-0.5 align-middle">school</span>
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-yellow-400" />
                </div>
            )}
        </div>
    );
};

// ── Odds button ─────────────────────────────────────────────────────────────────
const OddsBtn: React.FC<{
    label: string;
    odds: string;
    isSelected: boolean;
    isAI?: boolean;
    rookieMode?: boolean;
    rookieTip?: string;
    disabled?: boolean;
    onClick: () => void;
}> = ({ label, odds, isSelected, isAI, rookieMode, rookieTip, disabled, onClick }) => {
    const btn = (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex flex-col items-center px-3 py-2 rounded-lg border transition-all text-center relative min-w-[56px] font-mono"
            style={{
                background: isSelected
                    ? 'rgba(34,197,94,0.18)'
                    : isAI
                        ? 'rgba(34,197,94,0.08)'
                        : 'rgba(255,255,255,0.03)',
                borderColor: isSelected
                    ? '#22c55e'
                    : isAI
                        ? 'rgba(34,197,94,0.45)'
                        : 'rgba(255,255,255,0.1)',
                boxShadow: isSelected
                    ? '0 0 14px rgba(34,197,94,0.6)'
                    : isAI
                        ? '0 0 10px rgba(34,197,94,0.3)'
                        : 'none',
                opacity: disabled ? 0.5 : 1,
            }}
        >
            {isAI && !isSelected && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase bg-green-500 text-black px-1.5 rounded-full whitespace-nowrap leading-4">
                    AI ★
                </span>
            )}
            {rookieMode && !isAI && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[6px] font-black uppercase bg-yellow-400/90 text-black px-1 rounded-full whitespace-nowrap leading-4">
                    ?
                </span>
            )}
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">{label}</span>
            <span className={`text-sm font-black tabular-nums ${isSelected ? 'text-green-400' : isAI ? 'text-green-400' : 'text-white'}`}>
                {odds}
            </span>
            {isSelected && <span className="text-green-500 text-[9px] font-black mt-0.5">✓ Added</span>}
        </button>
    );

    if (rookieMode && rookieTip) {
        return <Tip text={rookieTip}>{btn}</Tip>;
    }
    return btn;
};

// ── Team Odds Card ─────────────────────────────────────────────────────────────
interface TeamOddsCardProps {
    game: ESPNGame;
    aiMode: boolean;
    rookieMode: boolean;
    betSlip: BetPick[];
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
    sport: string;
    weatherAI?: boolean;
    aiML?: boolean;
    aiSpread?: boolean;
    aiOU?: boolean;
    isSelectedForAI?: boolean;
    onToggleAI?: (gameId: string) => void;
}

const TeamOddsCard: React.FC<TeamOddsCardProps> = ({ game, aiMode, rookieMode, betSlip, onAddBet, sport, weatherAI, aiML, aiSpread, aiOU, isSelectedForAI, onToggleAI }) => {
    // Generate fallback prediction for standard odds formatting, but use AI prediction if available
    const pred = useMemo(() => generateAIPrediction(
        game.homeTeam.record, game.awayTeam.record, sport, [], []
    ), [game.homeTeam.record, game.awayTeam.record, sport]);

    // Simulate determinative weather impact for outdoor sports based on gameid
    const weatherAlert = useMemo(() => {
        if (!['mlb', 'nfl', 'soccer'].includes(sport.toLowerCase())) return null;
        let hash = 0;
        for (let i = 0; i < game.id.length; i++) hash += game.id.charCodeAt(i);
        const conditions = [
            { cond: 'Clear', bad: false },
            { cond: 'Partly Cloudy', bad: false },
            { cond: 'High Winds 20mph+', bad: true, icon: 'air', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
            { cond: 'Heavy Rain Tracking', bad: true, icon: 'rainy', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
            { cond: 'Snow Expected', bad: true, icon: 'ac_unit', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
            { cond: 'Dome', bad: false }
        ];
        const res = conditions[hash % conditions.length];
        return res.bad ? res : null;
    }, [game.id, sport]);

    const isFinal = game.status === 'post';
    const isLive = game.status === 'in';
    const isUpcoming = game.status === 'pre';
    const matchupStr = `${game.awayTeam.displayName} vs ${game.homeTeam.displayName}`;
    const gameId = `espn-${game.id}`;

    const isSel = (type: BetPick['type'], team: string) =>
        betSlip.some(b => b.gameId === gameId && b.type === type && b.team === team);

    // Use AI backend data if available, otherwise fallback to local mock 
    const confidence = pred.confidence;
    const aiHighlight = aiMode && confidence >= 55; // highlight if >= 55%

    const addBet = (type: BetPick['type'], team: string, odds?: string) => {
        if (!odds || odds === 'N/A') return;
        onAddBet({ gameId, type, team, odds, matchupStr, stake: 50, gameStatus: game.status, gameStatusName: game.statusName, gameDate: game.date });
    };

    // Apply shifting odds if the game is live
    const shifts = useLiveOddsShift(game.status, game.id);

    const TeamRow = ({ team, isHome }: { team: typeof game.homeTeam; isHome: boolean }) => {
        // Base Odds
        const baseMl = isHome ? pred.moneylineHome : pred.moneylineAway;
        const baseSpreadNum = parseFloat(pred.spread);
        // Apply Shift
        const spreadShift = isHome ? shifts.spreadShift : -shifts.spreadShift;
        const mlShift = isHome ? shifts.mlShift : -shifts.mlShift;

        const ml = applyOddsShift(baseMl, mlShift);
        const spreadNum = baseSpreadNum + spreadShift;

        const spreadVal = isHome
            ? (spreadNum > 0 ? `+${spreadNum.toFixed(1)}` : spreadNum === 0 ? 'PK' : `${spreadNum.toFixed(1)}`)
            : ((-spreadNum) > 0 ? `+${(-spreadNum).toFixed(1)}` : spreadNum === 0 ? 'PK' : `${(-spreadNum).toFixed(1)}`);

        let winPct = confidence;
        winPct = isHome ? pred.homeWinProb : pred.awayWinProb;

        // Slightly fluctuate confidence for live games
        if (isLive) {
            winPct = Math.min(99, Math.max(1, winPct + (isHome ? shifts.confidenceShift : -shifts.confidenceShift)));
        }

        const isFavoredContext = isHome ? winPct > 50 : winPct > 50;

        return (
            <div className={`flex items-center gap-3 py-3 px-4 border-b border-border-muted/50 last:border-0 transition-all ${aiHighlight && isFavoredContext ? 'bg-green-500/5' : ''}`}>
                {/* Logo */}
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-border-muted overflow-hidden flex-shrink-0">
                    <img
                        src={team.logo}
                        alt={team.abbreviation}
                        className="w-full h-full object-contain p-1"
                        onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${team.abbreviation}&background=1a1a2e&color=fff&rounded=true`; }}
                    />
                </div>

                {/* Name + Record */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-text-main truncate">{team.displayName}</span>
                        {aiHighlight && isFavoredContext && (
                            <span className="text-[8px] font-black bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                                AI Fav · {winPct.toFixed(0)}%
                            </span>
                        )}
                        {rookieMode && !aiMode && (
                            <span className="text-[8px] font-black bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                                {winPct.toFixed(0)}% win
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-text-muted font-medium">{team.record || '—'}</span>
                        {isLive && <span className="text-[10px] font-black font-mono text-primary tabular-nums">{team.score}</span>}
                    </div>
                </div>

                {/* Odds buttons + per-bet AI button */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="flex gap-1.5">
                        <OddsBtn
                            label="ML"
                            odds={ml}
                            isSelected={isSel('ML', `${team.displayName} ML`)}
                            isAI={(aiMode || aiML) && aiHighlight && isFavoredContext}
                            rookieMode={rookieMode}
                            rookieTip={ROOKIE_TIPS['ML']}
                            onClick={() => addBet('ML', `${team.displayName} ML`, ml || 'N/A')}
                        />
                        <OddsBtn
                            label="Spread"
                            odds={spreadVal}
                            isSelected={isSel('Spread', `${team.displayName} ${spreadVal}`)}
                            isAI={(aiMode || aiSpread) && aiHighlight && isFavoredContext}
                            rookieMode={rookieMode}
                            rookieTip={ROOKIE_TIPS['Spread'] + ` (${spreadVal})`}
                            onClick={() => addBet('Spread', `${team.displayName} ${spreadVal}`, '-110')}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`terminal-panel transition-all ${isLive ? '!border-red-500/40 shadow-[0_0_16px_rgba(239,68,68,0.1)]' :
            isFinal ? '!border-neutral-700/50' :
                aiHighlight ? '!border-green-500/35 shadow-[0_0_16px_rgba(34,197,94,0.08)]' :
                    ''
            } ${isSelectedForAI ? 'ring-2 ring-primary/50' : ''}`}>

            {/* Weather Alert (Visible if Weather AI toggled and conditions are bad) */}
            {weatherAI && weatherAlert && (
                <div className={`px-4 py-2 flex items-center gap-2 ${weatherAlert.color} border-b`}>
                    <span className="material-symbols-outlined text-[13px]">{weatherAlert.icon}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none mt-0.5">
                        Weather Alert: {weatherAlert.cond}
                    </span>
                    <span className="ml-auto text-[8px] font-bold uppercase tracking-wider opacity-60">High Impact</span>
                </div>
            )}

            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-[#1c2037]">
                <div className="flex items-center gap-2">
                    {onToggleAI && (
                        <button 
                            onClick={() => onToggleAI(game.id)}
                            className={`flex items-center justify-center w-5 h-5 rounded border ${isSelectedForAI ? 'bg-primary/20 border-primary text-primary' : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-slate-500'} transition-colors ml-[-4px]`}
                            title="Toggle for AI Analysis"
                        >
                            <span className="material-symbols-outlined text-[14px]">
                                {isSelectedForAI ? 'check' : 'add'}
                            </span>
                        </button>
                    )}
                    {isLive ? (
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
                            LIVE · {game.statusDetail}
                        </span>
                    ) : isFinal ? (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 inline-block" />
                            FINAL · {game.statusDetail}
                        </span>
                    ) : (
                        <span className="text-[10px] text-slate-400 font-medium">{game.statusDetail}</span>
                    )}
                    {game.broadcast && (
                        <span className="text-[9px] text-slate-600 bg-neutral-700/60 px-1.5 py-0.5 rounded">{game.broadcast}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Always-open betting badge */}
                    {(isLive || isUpcoming) && (
                        <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Bets Open
                        </span>
                    )}
                    {isFinal && (
                        <span className="text-[8px] font-black text-slate-500 bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Props Only
                        </span>
                    )}
                    {aiHighlight && (
                        <span className="text-[9px] font-black text-green-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">psychology</span>
                            {confidence}% edge
                        </span>
                    )}
                </div>
            </div>

            {/* Teams */}
            <TeamRow team={game.awayTeam} isHome={false} />
            <TeamRow team={game.homeTeam} isHome={true} />

            {/* O/U row */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-black/10 border-t border-[#1c2037]">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total · {applyOddsShift(pred.total, shifts.totalShift)}</span>
                    {rookieMode && <span className="text-[9px] text-yellow-400/80">Combined score O/U</span>}
                </div>
                <div className="flex gap-2 items-center">
                    <OddsBtn
                        label="OVER"
                        odds={isLive ? applyOddsShift('-110', Math.floor(shifts.spreadShift * 5)) : "-110"}
                        isSelected={isSel('Over', `Over ${applyOddsShift(pred.total, shifts.totalShift)}`)}
                        isAI={(aiMode || aiOU) && aiHighlight && pred.overUnderPick === 'Over'}
                        rookieMode={rookieMode}
                        rookieTip={ROOKIE_TIPS['OVER']}
                        onClick={() => addBet('Over', `Over ${applyOddsShift(pred.total, shifts.totalShift)}`, '-110')}
                    />
                    <OddsBtn
                        label="UNDER"
                        odds={isLive ? applyOddsShift('-110', -Math.floor(shifts.spreadShift * 5)) : "-110"}
                        isSelected={isSel('Under', `Under ${applyOddsShift(pred.total, shifts.totalShift)}`)}
                        isAI={(aiMode || aiOU) && aiHighlight && pred.overUnderPick === 'Under'}
                        rookieMode={rookieMode}
                        rookieTip={ROOKIE_TIPS['UNDER']}
                        onClick={() => addBet('Under', `Under ${applyOddsShift(pred.total, shifts.totalShift)}`, '-110')}
                    />
                </div>
            </div>

            {/* AI Best Pick Row (Always visible) */}
            <div className="flex items-center justify-center px-4 py-2 border-t border-[#1c2037] bg-green-500/5">
                <div className="flex items-center gap-2 text-[10px] font-black tracking-wider uppercase">
                    <span className="material-symbols-outlined text-[13px] text-[#A3FF00]">psychology</span>
                    <span className="text-[#A3FF00] opacity-80">PickLabs AI Best Pick:</span>
                    <span className="text-white bg-black/30 border border-green-500/30 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(163,255,0,0.15)]">
                        {confidence > 60
                            ? (pred.homeWinProb > pred.awayWinProb ? `${game.homeTeam.displayName} ML` : `${game.awayTeam.displayName} ML`)
                            : `${pred.overUnderPick} ${applyOddsShift(pred.total, shifts.totalShift)}`}
                        <span className="ml-1 text-[#A3FF00] text-[9px]">({confidence}%)</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

// ── Player Prop Card ──────────────────────────────────────────────────────────
interface PlayerPropCardProps {
    player: ESPNRosterPlayer;
    sport: string;
    gameId: string;
    gameStatus: string;
    gameDate: string;
    matchupStr: string;
    teamLogo?: string;
    betSlip: BetPick[];
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
    aiMode: boolean;
    aiPts?: boolean;
    aiReb?: boolean;
    aiAst?: boolean;
    rookieMode: boolean;
    isSelectedForAI?: boolean;
    onToggleAI?: (playerId: string) => void;
}

const PlayerPropCard: React.FC<PlayerPropCardProps> = ({
    player, sport, gameId, gameStatus, gameDate, matchupStr, teamName, teamLogo, betSlip, onAddBet, aiMode, aiPts, aiReb, aiAst, rookieMode, isSelectedForAI, onToggleAI
}) => {
    const isPitcher = (sport === 'MLB' || sport === 'WBC') && ['P', 'SP', 'RP'].includes(player.position.toUpperCase());
    const props = isPitcher ? [
        { label: 'Strikeouts', baseMultiplier: 0.5, odds: ['-110', '-110'] as [string, string] },
        { label: 'Walks', baseMultiplier: 0.15, odds: ['+110', '-130'] as [string, string] },
        { label: 'Earned Runs', baseMultiplier: 0.2, odds: ['-115', '-105'] as [string, string] },
        { label: 'Outs Recorded', baseMultiplier: 1.3, odds: ['-110', '-110'] as [string, string] }
    ] : (SPORT_PROPS[sport] || SPORT_PROPS['NBA']);

    // Generate stat line baseline per prop
    const seed = player.displayName.charCodeAt(0) + player.displayName.charCodeAt(player.displayName.length - 1);
    const base = 12 + (seed % 20);

    const propLines = props.slice(0, 4).map((p, i) => {
        const raw = base * p.baseMultiplier + (i * 1.5) + (seed % 5) * 0.5;
        const line = Math.max(0.5, Math.round(raw * 2) / 2).toFixed(1);
        
        let shouldHighlightStr = aiMode;
        if (!aiMode) {
            if (aiPts && ['Points', 'PTS', 'Goals', 'Pass Yards'].includes(p.label)) shouldHighlightStr = true;
            if (aiReb && ['Rebounds', 'REB', 'Hits', 'Rush Yards'].includes(p.label)) shouldHighlightStr = true;
            if (aiAst && ['Assists', 'AST', 'RBIs'].includes(p.label)) shouldHighlightStr = true;
        }

        // AI picks the 'Over' on the first prop for the position
        const aiPick = shouldHighlightStr && i === 0;
        return { ...p, line, aiPick };
    });

    const positionColor: Record<string, string> = {
        PG: 'text-blue-400', SG: 'text-cyan-400', SF: 'text-teal-400',
        PF: 'text-orange-400', C: 'text-red-400',
        QB: 'text-yellow-400', RB: 'text-green-400', WR: 'text-purple-400', TE: 'text-pink-400',
        P: 'text-emerald-400', G: 'text-lime-400', F: 'text-amber-400', D: 'text-rose-400',
    };

    return (
        <div className={`terminal-panel transition-all ${aiMode && propLines[0]?.aiPick ? '!border-green-500/35 shadow-[0_0_16px_rgba(34,197,94,0.08)]' : ''}`}>
            {/* Player header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1c2037] bg-black/20">
                <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-neutral-800 overflow-hidden shrink-0 relative group">
                        {onToggleAI && (
                            <button 
                                onClick={() => onToggleAI(player.id)}
                                className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isSelectedForAI ? 'bg-primary/40 opacity-100' : ''}`}
                                title="Toggle for AI Analysis"
                            >
                                <span className={`material-symbols-outlined text-[20px] ${isSelectedForAI ? 'text-white' : 'text-slate-300'}`}>
                                    {isSelectedForAI ? 'check_circle' : 'add_circle'}
                                </span>
                            </button>
                        )}
                        {player.headshot ? (
                            <img
                                src={player.headshot}
                                alt={player.displayName}
                                className="w-full h-full object-cover"
                                onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.displayName)}&background=0d0f1a&color=fff&rounded=true`; }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-muted text-sm font-black">
                                {player.displayName.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {/* Team logo badge — outside the mugshot, bottom-right */}
                    {teamLogo && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden shadow-md p-[2px]">
                            <img
                                src={teamLogo}
                                alt=""
                                className="w-full h-full object-contain"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-text-main truncate">{player.displayName}</span>
                        {aiMode && propLines[0]?.aiPick && (
                            <span className="text-[7px] font-black bg-green-500 text-black px-1.5 rounded-full uppercase flex-shrink-0">AI Pick</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-black font-mono ${positionColor[player.position] || 'text-text-muted'}`}>
                            #{player.jersey} {player.position}
                        </span>
                        <span className="text-[9px] text-border-muted">·</span>
                        <span className="text-[9px] text-text-muted truncate">{teamName}</span>
                    </div>
                </div>
            </div>

            {/* Props */}
            <div className="p-3 space-y-2">
                {propLines.map(({ label, line, odds, aiPick }) => {
                    const overKey = `${player.displayName} Over ${line} ${label}`;
                    const underKey = `${player.displayName} Under ${line} ${label}`;
                    const selOver = betSlip.some(b => b.gameId === gameId && b.team === overKey);
                    const selUnder = betSlip.some(b => b.gameId === gameId && b.team === underKey);

                    return (
                        <div key={label} className="flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] text-slate-300 font-bold truncate">{label}</span>
                                <span className="text-[9px] text-slate-600 tabular-nums">Line: {line}</span>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                                <OddsBtn
                                    label="OVER"
                                    odds={odds[0]}
                                    isSelected={selOver}
                                    isAI={aiMode && aiPick}
                                    rookieMode={rookieMode}
                                    rookieTip={`Over ${line} ${label} — you win if ${player.displayName.split(' ')[0]} gets MORE than ${line}.`}
                                    onClick={() => onAddBet({ gameId, type: 'Prop', team: overKey, odds: odds[0], matchupStr, stake: 25, gameStatus, gameDate })}
                                />
                                <OddsBtn
                                    label="UNDER"
                                    odds={odds[1]}
                                    isSelected={selUnder}
                                    isAI={false}
                                    rookieMode={rookieMode}
                                    rookieTip={`Under ${line} ${label} — you win if ${player.displayName.split(' ')[0]} gets LESS than ${line}.`}
                                    onClick={() => onAddBet({ gameId, type: 'Prop', team: underKey, odds: odds[1], matchupStr, stake: 25, gameStatus, gameDate })}
                                />
                                </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Roster Panel per game ─────────────────────────────────────────────────────
interface RosterPanelProps {
    game: ESPNGame;
    sport: string;
    betSlip: BetPick[];
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
    aiMode: boolean;
    aiPts?: boolean;
    aiReb?: boolean;
    aiAst?: boolean;
    rookieMode: boolean;
    searchQuery: string;
    selectedAIPlayers?: Set<string>;
    onToggleAI?: (playerId: string) => void;
}

const RosterPanel: React.FC<RosterPanelProps> = ({ game, sport, betSlip, onAddBet, aiMode, aiPts, aiReb, aiAst, rookieMode, searchQuery, selectedAIPlayers, onToggleAI }) => {
    const [homePlayers, setHomePlayers] = useState<ESPNRosterPlayer[]>([]);
    const [awayPlayers, setAwayPlayers] = useState<ESPNRosterPlayer[]>([]);
    const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
    const [rosterLoading, setRosterLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        setRosterLoading(true);
        Promise.all([
            fetchESPNRoster(sport, game.homeTeam.id),
            fetchESPNRoster(sport, game.awayTeam.id),
        ]).then(([home, away]) => {
            if (!mounted) return;
            setHomePlayers(home);
            setAwayPlayers(away);
            setRosterLoading(false);
        }).catch(() => {
            if (!mounted) return;
            setRosterLoading(false);
        });
        return () => { mounted = false; };
    }, [game.homeTeam.id, game.awayTeam.id, sport]);

    const players = activeTeam === 'home' ? homePlayers : awayPlayers;
    const teamName = activeTeam === 'home' ? game.homeTeam.displayName : game.awayTeam.displayName;
    const matchupStr = `${game.awayTeam.displayName} vs ${game.homeTeam.displayName}`;
    const gameId = `espn-${game.id}`;

    const filteredPlayers = useMemo(() => {
        if (!searchQuery.trim()) return players;
        const q = searchQuery.toLowerCase();
        return players.filter(p => p.displayName.toLowerCase().includes(q) || p.position.toLowerCase().includes(q));
    }, [players, searchQuery]);

    return (
        <div className="terminal-panel mb-4 overflow-visible">
            {/* Game matchup header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2037] bg-black/20 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <img src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} className="w-6 h-6 object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span className="text-xs font-black text-text-main font-mono uppercase tracking-wider">{game.awayTeam.abbreviation}</span>
                    </div>
                    <span className="text-text-muted text-xs">@</span>
                    <div className="flex items-center gap-1.5">
                        <img src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} className="w-6 h-6 object-contain"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span className="text-xs font-black text-text-main font-mono uppercase tracking-wider">{game.homeTeam.abbreviation}</span>
                    </div>
                    {game.status === 'in' && (
                        <span className="text-[8px] font-black text-red-400 bg-red-500/10 px-1.5 rounded-full border border-red-500/15 ml-1">LIVE</span>
                    )}
                </div>
                {/* Team switcher */}
                <div className="flex gap-1 bg-background-dark border border-border-muted rounded-lg p-0.5">
                    <button
                        onClick={() => setActiveTeam('away')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTeam === 'away' ? 'bg-primary text-black' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <img src={game.awayTeam.logo} alt="" className="w-4 h-4 object-contain" />
                        {game.awayTeam.abbreviation}
                    </button>
                    <button
                        onClick={() => setActiveTeam('home')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTeam === 'home' ? 'bg-primary text-black' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <img src={game.homeTeam.logo} alt="" className="w-4 h-4 object-contain" />
                        {game.homeTeam.abbreviation}
                    </button>
                </div>
            </div>

            {rosterLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 terminal-panel bg-black/10 animate-pulse" />
                    ))}
                </div>
            ) : filteredPlayers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
                    {filteredPlayers.map(player => (
                        <PlayerPropCard
                            key={player.id}
                            player={player}
                            sport={sport}
                            gameId={gameId}
                            gameStatus={game.status}
                            gameDate={game.date}
                            matchupStr={matchupStr}
                            teamName={teamName}
                            teamLogo={activeTeam === 'home' ? game.homeTeam.logo : game.awayTeam.logo}
                            betSlip={betSlip}
                            onAddBet={onAddBet}
                            aiMode={aiMode}
                            aiPts={aiPts}
                            aiReb={aiReb}
                            aiAst={aiAst}
                            rookieMode={rookieMode}
                            isSelectedForAI={selectedAIPlayers?.has(player.id)}
                            onToggleAI={onToggleAI}
                        />
                    ))}
                </div>
            ) : (
                <div className="py-10 flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-3xl text-text-muted/30 mb-2">person_off</span>
                    <p className="text-text-muted text-xs">No roster data found for {teamName}</p>
                </div>
            )}
        </div>
    );
};


// ── Main SportsbookView ────────────────────────────────────────────────────────
export const SportsbookView: React.FC<SportsbookViewProps> = ({ betSlip, setBetSlip, activeTickets, setActiveTickets, onAddBet, onPlaceTicket }) => {
    const { isRookieModeActive, toggleRookieMode, hasExceededQuota } = useRookieMode();

    const [activeSport, setActiveSport] = useState<string>('NBA');
    const [games, setGames] = useState<ESPNGame[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLiveTickets, setShowLiveTickets] = useState(true);
    const [showBetSlip, setShowBetSlip] = useState(() => window.innerWidth >= 1280);
    const [activePanel, setActivePanel] = useState<'teams' | 'players'>('teams');
    const [shakeRookieModeBtn, setShakeRookieModeBtn] = useState(false);
    const user = getCurrentUser();
    const isPremiumUser = user?.isPremium || isAdminEmail(user?.email || '');

    // ── AI Analysis State ──────────────────────────────────────────────────
    const [allGamesAI, setAllGamesAI] = useState(false);
    const [allPlayersAI, setAllPlayersAI] = useState(false);
    const [weatherAI, setWeatherAI] = useState(false);
    const [aiML, setAiML] = useState(false);
    const [aiSpread, setAiSpread] = useState(false);
    const [aiOU, setAiOU] = useState(false);
    
    // Player specific toggles
    const [aiPts, setAiPts] = useState(false);
    const [aiAst, setAiAst] = useState(false);
    const [aiReb, setAiReb] = useState(false);

    const [selectedAIGames, setSelectedAIGames] = useState<Set<string>>(new Set());
    const [selectedAIPlayers, setSelectedAIPlayers] = useState<Set<string>>(new Set());
    const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

    const today = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    })();

    const sportEntry = SPORTSBOOK_SPORTS.find(s => s.key === activeSport);

    const fetchGames = useCallback(async () => {
        if (!sportEntry) return;
        setLoading(true);
        try {
            if (sportEntry.key === 'WBC') {
                const tomorrowD = new Date();
                tomorrowD.setDate(tomorrowD.getDate() + 1);
                const tmrwYear = tomorrowD.getFullYear();
                const tmrwMonth = String(tomorrowD.getMonth() + 1).padStart(2, '0');
                const tmrwDay = String(tomorrowD.getDate()).padStart(2, '0');
                const tomorrow = `${tmrwYear}-${tmrwMonth}-${tmrwDay}`;

                const [todayData, tomorrowData] = await Promise.all([
                    getWBCSchedule(today),
                    getWBCSchedule(tomorrow)
                ]);

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let combined: any[] = [...todayData, ...tomorrowData];
                const seen = new Set();
                combined = combined.filter(g => {
                    if (seen.has(g.id)) return false;
                    seen.add(g.id);
                    return true;
                });

                // Hack to fix any errors without extensive refactoring mapping WBCGame.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setGames(combined as any[]);
            } else {
                const espnKey = APP_SPORT_TO_ESPN[sportEntry.key] as SportKey || sportEntry.espn;

                const tomorrowD = new Date();
                tomorrowD.setDate(tomorrowD.getDate() + 1);
                const tmrwYear = tomorrowD.getFullYear();
                const tmrwMonth = String(tomorrowD.getMonth() + 1).padStart(2, '0');
                const tmrwDay = String(tomorrowD.getDate()).padStart(2, '0');
                const tomorrow = `${tmrwYear}-${tmrwMonth}-${tmrwDay}`;

                const [todayData, tomorrowData] = await Promise.all([
                    fetchESPNScoreboardByDate(espnKey, today),
                    fetchESPNScoreboardByDate(espnKey, tomorrow)
                ]);

                let combined = [...todayData, ...tomorrowData];
                const seen = new Set();
                combined = combined.filter(g => {
                    if (seen.has(g.id)) return false;
                    seen.add(g.id);
                    return true;
                });

                setGames(combined);
            }
        } catch {
            setGames([]);
        } finally {
            setLoading(false);
        }
    }, [sportEntry, today]);

    useEffect(() => {
        fetchGames();
        const interval = setInterval(fetchGames, 43200000); // 12 hours
        return () => clearInterval(interval);
    }, [fetchGames]);

    // Removed local rookie mode sync

    // Removed AI backend fetching effect


    // Search-filtered games
    const filteredGames = useMemo(() => {
        if (!searchQuery.trim()) return games;
        const q = searchQuery.toLowerCase();
        return games.filter(g =>
            g.homeTeam.displayName.toLowerCase().includes(q) ||
            g.awayTeam.displayName.toLowerCase().includes(q) ||
            g.homeTeam.abbreviation.toLowerCase().includes(q) ||
            g.awayTeam.abbreviation.toLowerCase().includes(q)
        );
    }, [games, searchQuery]);

    // Status order: LIVE first, then upcoming, then final
    const statusOrder = (s: string) => s === 'in' ? 0 : s === 'pre' ? 1 : 2;
    const sortedGames = [...filteredGames].sort((a, b) => statusOrder(a.status) - statusOrder(b.status));

    const liveCount = games.filter(g => g.status === 'in').length;

    const toggleAIGame = (gameId: string) => {
        setSelectedAIGames(prev => {
            const next = new Set(prev);
            if (next.has(gameId)) next.delete(gameId);
            else next.add(gameId);
            return next;
        });
    };

    const toggleAIPlayer = (playerId: string) => {
        setSelectedAIPlayers(prev => {
            const next = new Set(prev);
            if (next.has(playerId)) next.delete(playerId);
            else next.add(playerId);
            return next;
        });
    };

    // ── Date grouping helpers ─────────────────────────────────────────────────
    const toggleDateCollapse = (dateKey: string) => {
        setCollapsedDates(prev => {
            const next = new Set(prev);
            if (next.has(dateKey)) next.delete(dateKey);
            else next.add(dateKey);
            return next;
        });
    };

    const formatDateLabel = (dateKey: string): string => {
        const todayD = new Date();
        todayD.setHours(0, 0, 0, 0);
        const yesterdayD = new Date(todayD);
        yesterdayD.setDate(todayD.getDate() - 1);
        const tomorrowD2 = new Date(todayD);
        tomorrowD2.setDate(todayD.getDate() + 1);
        const [y, m, d] = dateKey.split('-').map(Number);
        const target = new Date(y, m - 1, d);
        target.setHours(0, 0, 0, 0);
        if (target.getTime() === todayD.getTime()) return 'TODAY';
        if (target.getTime() === yesterdayD.getTime()) return 'YESTERDAY';
        if (target.getTime() === tomorrowD2.getTime()) return 'TOMORROW';
        return target.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    };

    // Group sorted games by date key (YYYY-MM-DD)
    const dateGroups: { dateKey: string; games: ESPNGame[] }[] = useMemo(() => {
        const map = new Map<string, ESPNGame[]>();
        sortedGames.forEach(g => {
            const dk = (g.date || '').slice(0, 10) || 'unknown';
            if (!map.has(dk)) map.set(dk, []);
            map.get(dk)!.push(g);
        });
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, games]) => ({ dateKey, games }));
    }, [sortedGames]);
    return (
        <div className="flex flex-col min-h-screen bg-background-dark">
            {/* ── Sticky Header ───────────────────────────────────── */}
            <div className="border-b border-border-muted bg-neutral-900/70 sticky top-[64px] z-30 backdrop-blur-md">
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
                    {/* Title row */}
                    <div className="flex items-center justify-between py-3 border-b border-border-muted/50 gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-xl">casino</span>
                            <div>
                                <h1 className="text-lg font-black text-text-main uppercase tracking-wider leading-none">Sportsbook</h1>
                                <p className="text-[10px] text-text-muted font-medium font-mono">
                                    LIVE ODDS BOARD · AI PREDICTIONS
                                    {liveCount > 0 && <span className="ml-2 text-red-400 animate-pulse">· {liveCount} LIVE</span>}
                                </p>
                            </div>
                            {loading && <span className="text-[9px] text-slate-600 font-bold animate-pulse">Updating...</span>}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {/* ── AI Analysis Toggles (replaces old AI Tabs) ── */}
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                                <button
                                    onClick={() => setAllGamesAI(!allGamesAI)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${allGamesAI ? 'bg-primary/20 border-primary/50 text-primary' : 'border-neutral-700 text-slate-500 hover:text-white hover:border-neutral-600'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[13px]">psychology</span>
                                    <span className="hidden sm:inline">AI: ALL GAMES</span>
                                </button>
                                <button
                                    onClick={() => setAllPlayersAI(!allPlayersAI)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${allPlayersAI ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-neutral-700 text-slate-500 hover:text-white hover:border-neutral-600'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[13px]">person_search</span>
                                    <span className="hidden sm:inline">AI: ALL PLAYERS</span>
                                </button>
                                <button
                                    onClick={() => setWeatherAI(!weatherAI)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${weatherAI ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'border-neutral-700 text-slate-500 hover:text-white hover:border-neutral-600'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[13px]">thunderstorm</span>
                                    <span className="hidden sm:inline">AI: WEATHER</span>
                                </button>
                                <div className="w-px h-4 bg-border-muted mx-0.5" />
                                <button
                                    onClick={() => setAiML(!aiML)}
                                    className={`flex items-center px-2 py-1.5 rounded border text-[9px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${aiML ? 'bg-primary/20 border-primary/50 text-primary' : 'border-neutral-800 text-slate-500 hover:text-white hover:border-neutral-600'}`}
                                >
                                    AI: ML
                                </button>
                                <button
                                    onClick={() => setAiSpread(!aiSpread)}
                                    className={`flex items-center px-2 py-1.5 rounded border text-[9px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${aiSpread ? 'bg-primary/20 border-primary/50 text-primary' : 'border-neutral-800 text-slate-500 hover:text-white hover:border-neutral-600'}`}
                                >
                                    AI: SPREAD
                                </button>
                                <button
                                    onClick={() => setAiOU(!aiOU)}
                                    className={`flex items-center px-2 py-1.5 rounded border text-[9px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${aiOU ? 'bg-primary/20 border-primary/50 text-primary' : 'border-neutral-800 text-slate-500 hover:text-white hover:border-neutral-600'}`}
                                >
                                    AI: O/U
                                </button>
                                <div className="w-px h-4 bg-border-muted mx-0.5" />
                                <button
                                    onClick={() => setAiPts(!aiPts)}
                                    className={`flex items-center px-2 py-1.5 rounded border text-[9px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${aiPts ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-neutral-800 text-slate-500 hover:text-white hover:border-neutral-600'}`}
                                >
                                    AI: PTS
                                </button>
                                <button
                                    onClick={() => setAiAst(!aiAst)}
                                    className={`flex items-center px-2 py-1.5 rounded border text-[9px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${aiAst ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-neutral-800 text-slate-500 hover:text-white hover:border-neutral-600'}`}
                                >
                                    AI: AST
                                </button>
                                <button
                                    onClick={() => setAiReb(!aiReb)}
                                    className={`flex items-center px-2 py-1.5 rounded border text-[9px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${aiReb ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-neutral-800 text-slate-500 hover:text-white hover:border-neutral-600'}`}
                                >
                                    AI: REB
                                </button>
                            </div>

                            {/* Rookie Mode */}
                            <button
                                onClick={() => {
                                    if (!isPremiumUser && hasExceededQuota && !isRookieModeActive) {
                                        setShakeRookieModeBtn(true);
                                        setTimeout(() => setShakeRookieModeBtn(false), 500);
                                        return;
                                    }
                                    toggleRookieMode();
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${shakeRookieModeBtn
                                    ? 'animate-shake border-red-500 text-red-500 bg-red-500/10'
                                    : isRookieModeActive
                                        ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.2)]'
                                        : 'border-neutral-700 text-slate-400 hover:border-yellow-400/30 hover:text-yellow-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">school</span>
                                Rookie Mode
                            </button>

                            {/* Live Tickets */}
                            <button
                                onClick={() => setShowLiveTickets(p => !p)}
                                title={showLiveTickets ? 'Hide Tickets' : 'Show Tickets'}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${showLiveTickets
                                    ? 'bg-[#A3FF00]/15 border-[#A3FF00]/40 text-[#A3FF00] shadow-[0_0_12px_rgba(163,255,0,0.2)]'
                                    : 'border-neutral-700 text-slate-400 hover:border-[#A3FF00]/30 hover:text-[#A3FF00]'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">confirmation_number</span>
                                Tickets
                            </button>

                            {/* Bet Slip */}
                            <button
                                onClick={() => setShowBetSlip(p => !p)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${showBetSlip
                                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                                    : 'border-neutral-700 text-slate-400 hover:border-neutral-600 hover:text-white'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">receipt_long</span>
                                Slip
                                {betSlip.length > 0 && (
                                    <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-purple-500 text-white text-[8px] font-black">
                                        {betSlip.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Sport nav */}
                    <div className="flex items-center gap-1 py-2 overflow-x-auto no-scrollbar">
                        {SPORTSBOOK_SPORTS.map(sport => (
                            <button
                                key={sport.key}
                                onClick={() => { setActiveSport(sport.key); setGames([]); setSearchQuery(''); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${activeSport === sport.key
                                    ? 'bg-primary text-black'
                                    : 'text-slate-400 hover:text-white hover:bg-neutral-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">{sport.icon}</span>
                                {sport.label}
                                {activeSport === sport.key && games.length > 0 && (
                                    <span className="text-[9px] opacity-70">({games.length})</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────── */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 w-full">
                <div className="flex gap-6 items-start">
                    {/* ── Left: Content ── */}
                    <div className="flex-1 min-w-0 space-y-4">
                        <RookieGuideBanner />
                        {showLiveTickets && <LiveTicketPanel activeTickets={activeTickets} onRemoveTicket={(idx) => setActiveTickets?.(prev => prev.filter((_, i) => i !== idx))} />}

                        {/* ── Analysis Panel (Removed) ── */}

                        {/* Search + Panel tabs */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[16px]">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search teams or players..."
                                    className="w-full bg-neutral-900 border border-border-muted rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-main placeholder-text-muted/40 focus:outline-none focus:border-primary/50 transition-all"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-1 bg-background-dark border border-border-muted rounded-lg p-1 flex-shrink-0">
                                <button
                                    onClick={() => setActivePanel('teams')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activePanel === 'teams' ? 'bg-primary text-black' : 'text-text-muted hover:text-text-main'}`}
                                >
                                    <span className="material-symbols-outlined text-[13px]">groups</span>
                                    Teams
                                </button>
                                <button
                                    onClick={() => setActivePanel('players')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activePanel === 'players' ? 'bg-primary text-black' : 'text-text-muted hover:text-text-main'}`}
                                >
                                    <span className="material-symbols-outlined text-[13px]">person</span>
                                    Players
                                </button>
                            </div>
                        </div>

                        {/* Status banners */}
                        {(allGamesAI || selectedAIGames.size > 0 || allPlayersAI || selectedAIPlayers.size > 0) && (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-green-500/25 bg-green-500/5 mb-4">
                                <span className="relative flex h-2 w-2 flex-shrink-0">
                                    <span className="animate-ping absolute inset-0 rounded-full bg-green-400 opacity-75" />
                                    <span className="relative rounded-full h-2 w-2 bg-green-500 inline-flex" />
                                </span>
                                <p className="text-[11px] text-green-400 font-bold">
                                    AI Pick Mode Active — highlighted odds buttons indicate high-confidence edge.
                                </p>
                            </div>
                        )}
                        {isRookieModeActive && (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-yellow-400/25 bg-yellow-400/5">
                                <span className="material-symbols-outlined text-yellow-400 text-sm">school</span>
                                <p className="text-[11px] text-yellow-300 font-bold">
                                    Rookie Mode — hover any bet button for an explanation of what it means.
                                </p>
                            </div>
                        )}

                        {/* ── TEAMS PANEL ── */}
                        {activePanel === 'teams' && (
                            <div>
                                {loading && sortedGames.length === 0 ? (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-48 terminal-panel bg-black/10 animate-pulse" />
                                        ))}
                                    </div>
                                ) : dateGroups.length > 0 ? (
                                    <div className="space-y-6">
                                        {dateGroups.map(({ dateKey, games: dGames }) => {
                                            const isCollapsed = collapsedDates.has(dateKey);
                                            const liveInDate = dGames.filter(g => g.status === 'in').length;
                                            const label = formatDateLabel(dateKey);
                                            const fullDate = (() => {
                                                const [y, m, d] = dateKey.split('-').map(Number);
                                                return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                                            })();
                                            return (
                                                <div key={dateKey}>
                                                    {/* Date header with collapse toggle */}
                                                    <button
                                                        onClick={() => toggleDateCollapse(dateKey)}
                                                        className="w-full flex items-center gap-3 mb-3 group"
                                                    >
                                                        <div className="flex items-center gap-2.5 flex-1">
                                                            {liveInDate > 0 && (
                                                                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                                                                    <span className="animate-ping absolute inset-0 rounded-full bg-red-400 opacity-75" />
                                                                    <span className="relative rounded-full h-2.5 w-2.5 bg-red-500 inline-flex" />
                                                                </span>
                                                            )}
                                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">{label}</span>
                                                            <span className="text-[10px] text-neutral-600 font-medium">{fullDate}</span>
                                                            <span className="text-[9px] font-black text-neutral-500 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">{dGames.length} games</span>
                                                            {liveInDate > 0 && (
                                                                <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">{liveInDate} LIVE</span>
                                                            )}
                                                        </div>
                                                        <span className={`material-symbols-outlined text-neutral-500 group-hover:text-primary transition-all text-[18px] ${isCollapsed ? 'rotate-180' : ''}`}>expand_less</span>
                                                    </button>
                                                    <div className="h-px bg-neutral-800 mb-3" />

                                                    {!isCollapsed && (
                                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                            {dGames.map(game => (
                                                                <TeamOddsCard
                                                                    key={game.id}
                                                                    game={game}
                                                                    sport={activeSport}
                                                                    aiMode={allGamesAI || selectedAIGames.has(game.id)}
                                                                    rookieMode={isRookieModeActive}
                                                                    betSlip={betSlip}
                                                                    onAddBet={onAddBet}
                                                                    weatherAI={weatherAI}
                                                                    aiML={aiML}
                                                                    aiSpread={aiSpread}
                                                                    aiOU={aiOU}
                                                                    isSelectedForAI={selectedAIGames.has(game.id)}
                                                                    onToggleAI={() => toggleAIGame(game.id)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center text-center border border-dashed border-border-muted rounded-xl">
                                        <span className="material-symbols-outlined text-4xl text-text-muted/30 mb-3">event_busy</span>
                                        <h3 className="text-text-main font-black uppercase tracking-widest text-sm mb-1">No Games Today</h3>
                                        <p className="text-text-muted text-xs">No {activeSport} games scheduled for today.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── PLAYERS PANEL ── */}
                        {activePanel === 'players' && (
                            <div>
                                {loading && games.length === 0 ? (
                                    <div className="space-y-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-64 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
                                        ))}
                                    </div>
                                ) : dateGroups.length > 0 ? (
                                    <div className="space-y-6">
                                        {dateGroups.map(({ dateKey, games: dGames }) => {
                                            const isCollapsed = collapsedDates.has(dateKey);
                                            const label = formatDateLabel(dateKey);
                                            const fullDate = (() => {
                                                const [y, m, d] = dateKey.split('-').map(Number);
                                                return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                                            })();
                                            const liveInDate = dGames.filter(g => g.status === 'in').length;
                                            return (
                                                <div key={dateKey}>
                                                    {/* Date header with collapse toggle */}
                                                    <button
                                                        onClick={() => toggleDateCollapse(dateKey)}
                                                        className="w-full flex items-center gap-3 mb-3 group"
                                                    >
                                                        <div className="flex items-center gap-2.5 flex-1">
                                                            {liveInDate > 0 && (
                                                                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                                                                    <span className="animate-ping absolute inset-0 rounded-full bg-red-400 opacity-75" />
                                                                    <span className="relative rounded-full h-2.5 w-2.5 bg-red-500 inline-flex" />
                                                                </span>
                                                            )}
                                                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">{label}</span>
                                                            <span className="text-[10px] text-neutral-600 font-medium">{fullDate}</span>
                                                            <span className="text-[9px] font-black text-neutral-500 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-full">{dGames.length} games</span>
                                                        </div>
                                                        <span className={`material-symbols-outlined text-neutral-500 group-hover:text-primary transition-all text-[18px] ${isCollapsed ? 'rotate-180' : ''}`}>expand_less</span>
                                                    </button>
                                                    <div className="h-px bg-neutral-800 mb-3" />

                                                    {!isCollapsed && dGames.map(game => (
                                                        <RosterPanel
                                                            key={game.id}
                                                            game={game}
                                                            sport={activeSport}
                                                            betSlip={betSlip}
                                                            onAddBet={onAddBet}
                                                            aiMode={allPlayersAI || selectedAIPlayers.size > 0}
                                                            rookieMode={isRookieModeActive}
                                                            searchQuery={searchQuery}
                                                            selectedAIPlayers={selectedAIPlayers}
                                                            onToggleAI={(playerId) => toggleAIPlayer(playerId)}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center text-center border border-dashed border-border-muted rounded-xl">
                                        <span className="material-symbols-outlined text-4xl text-text-muted/30 mb-3">person_off</span>
                                        <h3 className="text-text-main font-black uppercase tracking-widest text-sm mb-1">No Games Today</h3>
                                        <p className="text-text-muted text-xs">Switch to the Teams tab or select a different sport.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Right: Bet Slip ── */}
                    {showBetSlip && (
                        <div className="w-80 xl:w-96 shrink-0 sticky top-[144px]">
                            <BetSlip betSlip={betSlip} setBetSlip={setBetSlip} activeTickets={activeTickets} setActiveTickets={setActiveTickets} onPlaceTicket={onPlaceTicket} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
