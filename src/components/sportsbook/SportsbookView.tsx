import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BetPick } from '../../App';
import { fetchESPNScoreboardByDate, ESPNGame, APP_SPORT_TO_ESPN, SportKey } from '../../data/espnScoreboard';
import { generateAIPrediction } from '../../data/espnTeams';
import { BetSlip } from '../live-board/BetSlip';
import { useRookieMode } from '../../contexts/RookieModeContext';

interface SportsbookViewProps {
    betSlip: BetPick[];
    setBetSlip: React.Dispatch<React.SetStateAction<BetPick[]>>;
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
}

// ── Sport list ──────────────────────────────────────────────────────────────
const SPORTSBOOK_SPORTS = [
    { key: 'NBA', label: 'NBA', icon: 'sports_basketball', espn: 'NBA' as SportKey },
    { key: 'NFL', label: 'NFL', icon: 'sports_football', espn: 'NFL' as SportKey },
    { key: 'MLB', label: 'MLB', icon: 'sports_baseball', espn: 'MLB' as SportKey },
    { key: 'NHL', label: 'NHL', icon: 'sports_hockey', espn: 'NHL' as SportKey },
    { key: 'UFC', label: 'UFC', icon: 'sports_mma', espn: 'UFC' as SportKey },
    { key: 'NCAAB', label: 'NCAAB', icon: 'sports_basketball', espn: 'CBB' as SportKey },
    { key: 'Soccer', label: 'Soccer', icon: 'sports_soccer', espn: 'Soccer.EPL' as SportKey },
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
    NCAAB: [
        { label: 'Points', baseMultiplier: 1, odds: ['-115', '-105'] },
        { label: 'Rebounds', baseMultiplier: 0.35, odds: ['-110', '-110'] },
        { label: 'Assists', baseMultiplier: 0.28, odds: ['-120', '+100'] },
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

// ── ESPN roster types ─────────────────────────────────────────────────────────
interface ESPNRosterPlayer {
    id: string;
    displayName: string;
    headshot?: string;
    position: string;
    jersey: string;
    status?: string;
}

// ── Fetch ESPN roster ─────────────────────────────────────────────────────────
async function fetchESPNRoster(sport: string, teamId: string): Promise<ESPNRosterPlayer[]> {
    const ESPN_LEAGUE: Record<string, string> = {
        NBA: 'basketball/nba',
        NFL: 'football/nfl',
        MLB: 'baseball/mlb',
        NHL: 'hockey/nhl',
        NCAAB: 'basketball/mens-college-basketball',
        Soccer: 'soccer/eng.1',
    };
    const league = ESPN_LEAGUE[sport];
    if (!league) return [];
    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${league}/teams/${teamId}/roster`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        const athletes: ESPNRosterPlayer[] = [];
        const groups = json.athletes || [];
        for (const group of groups) {
            for (const item of (group.items || [])) {
                athletes.push({
                    id: item.id,
                    displayName: item.displayName || item.fullName || '',
                    headshot: item.headshot?.href,
                    position: item.position?.abbreviation || '',
                    jersey: item.jersey || '',
                    status: item.status?.type?.name,
                });
            }
        }
        return athletes.slice(0, 20); // top 20 per team
    } catch {
        return [];
    }
}

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
}

const TeamOddsCard: React.FC<TeamOddsCardProps> = ({ game, aiMode, rookieMode, betSlip, onAddBet, sport }) => {
    const pred = useMemo(() => generateAIPrediction(
        game.homeTeam.record, game.awayTeam.record, sport, [], []
    ), [game.homeTeam.record, game.awayTeam.record, sport]);

    const isFinal = game.status === 'post';
    const isLive = game.status === 'in';
    const isUpcoming = game.status === 'pre';
    const matchupStr = `${game.awayTeam.displayName} vs ${game.homeTeam.displayName}`;
    const gameId = `espn-${game.id}`;

    const isSel = (type: BetPick['type'], team: string) =>
        betSlip.some(b => b.gameId === gameId && b.type === type && b.team === team);

    const confidence = pred.confidence;
    const aiHighlight = aiMode && confidence > 60;

    const addBet = (type: BetPick['type'], team: string, odds: string) => {
        onAddBet({ gameId, type, team, odds, matchupStr, stake: 50 });
    };

    const TeamRow = ({ team, isHome }: { team: typeof game.homeTeam; isHome: boolean }) => {
        const ml = isHome ? pred.moneylineHome : pred.moneylineAway;
        const spreadNum = parseFloat(pred.spread);
        const spreadVal = isHome
            ? (spreadNum >= 0 ? `+${spreadNum.toFixed(1)}` : `${spreadNum.toFixed(1)}`)
            : ((-spreadNum) >= 0 ? `+${(-spreadNum).toFixed(1)}` : `${(-spreadNum).toFixed(1)}`);
        const isFavored = isHome ? pred.homeWinProb > pred.awayWinProb : pred.awayWinProb > pred.homeWinProb;
        const winPct = isHome ? pred.homeWinProb : pred.awayWinProb;

        return (
            <div className={`flex items-center gap-3 py-3 px-4 border-b border-border-muted/50 last:border-0 transition-all ${aiHighlight && isFavored ? 'bg-green-500/5' : ''}`}>
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
                        {aiHighlight && isFavored && (
                            <span className="text-[8px] font-black bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                                AI Fav · {winPct}%
                            </span>
                        )}
                        {rookieMode && !aiMode && (
                            <span className="text-[8px] font-black bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
                                {winPct}% win
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-text-muted font-medium">{team.record || '—'}</span>
                        {isLive && <span className="text-[10px] font-black font-mono text-primary tabular-nums">{team.score}</span>}
                    </div>
                </div>

                {/* Odds buttons */}
                <div className="flex gap-1.5 flex-shrink-0">
                    <OddsBtn
                        label="ML"
                        odds={ml}
                        isSelected={isSel('ML', `${team.displayName} ML`)}
                        isAI={aiHighlight && isFavored}
                        rookieMode={rookieMode}
                        rookieTip={ROOKIE_TIPS['ML']}
                        onClick={() => addBet('ML', `${team.displayName} ML`, ml)}
                    />
                    <OddsBtn
                        label="Spread"
                        odds={spreadVal}
                        isSelected={isSel('Spread', `${team.displayName} ${spreadVal}`)}
                        isAI={aiHighlight && isFavored}
                        rookieMode={rookieMode}
                        rookieTip={ROOKIE_TIPS['Spread'] + ` (${spreadVal})`}
                        onClick={() => addBet('Spread', `${team.displayName} ${spreadVal}`, '-110')}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className={`terminal-panel transition-all ${isLive ? '!border-red-500/40 shadow-[0_0_16px_rgba(239,68,68,0.1)]' :
            isFinal ? '!border-neutral-700/50' :
                aiHighlight ? '!border-green-500/35 shadow-[0_0_16px_rgba(34,197,94,0.08)]' :
                    ''
            }`}>
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-[#1c2037]">
                <div className="flex items-center gap-2">
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
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total · {pred.total}</span>
                    {rookieMode && <span className="text-[9px] text-yellow-400/80">Combined score O/U</span>}
                </div>
                <div className="flex gap-2">
                    <OddsBtn
                        label="OVER"
                        odds="-110"
                        isSelected={isSel('Over', `Over ${pred.total}`)}
                        isAI={aiHighlight && pred.overUnderPick === 'Over'}
                        rookieMode={rookieMode}
                        rookieTip={ROOKIE_TIPS['OVER']}
                        onClick={() => addBet('Over', `Over ${pred.total}`, '-110')}
                    />
                    <OddsBtn
                        label="UNDER"
                        odds="-110"
                        isSelected={isSel('Under', `Under ${pred.total}`)}
                        isAI={aiHighlight && pred.overUnderPick === 'Under'}
                        rookieMode={rookieMode}
                        rookieTip={ROOKIE_TIPS['UNDER']}
                        onClick={() => addBet('Under', `Under ${pred.total}`, '-110')}
                    />
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
    matchupStr: string;
    teamName: string;
    betSlip: BetPick[];
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
    aiMode: boolean;
    rookieMode: boolean;
}

const PlayerPropCard: React.FC<PlayerPropCardProps> = ({
    player, sport, gameId, matchupStr, teamName, betSlip, onAddBet, aiMode, rookieMode
}) => {
    const props = SPORT_PROPS[sport] || SPORT_PROPS['NBA'];
    // Generate stat line baseline per prop
    const seed = player.displayName.charCodeAt(0) + player.displayName.charCodeAt(player.displayName.length - 1);
    const base = 12 + (seed % 20);

    const propLines = props.slice(0, 3).map((p, i) => {
        const raw = base * p.baseMultiplier + (i * 1.5) + (seed % 5) * 0.5;
        const line = Math.max(0.5, Math.round(raw * 2) / 2).toFixed(1);
        // AI picks the 'Over' on the first prop for the position
        const aiPick = aiMode && i === 0;
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
                <div className="w-11 h-11 rounded-full bg-neutral-800 border border-border-muted overflow-hidden flex-shrink-0 relative">
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
                    {player.jersey && (
                        <span className="absolute -bottom-0.5 -right-0.5 bg-neutral-900 border border-border-muted rounded-full text-[8px] font-black font-mono text-text-muted w-4 h-4 flex items-center justify-center leading-none">
                            {player.jersey}
                        </span>
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
                                    onClick={() => onAddBet({ gameId, type: 'Prop', team: overKey, odds: odds[0], matchupStr, stake: 25 })}
                                />
                                <OddsBtn
                                    label="UNDER"
                                    odds={odds[1]}
                                    isSelected={selUnder}
                                    isAI={false}
                                    rookieMode={rookieMode}
                                    rookieTip={`Under ${line} ${label} — you win if ${player.displayName.split(' ')[0]} gets LESS than ${line}.`}
                                    onClick={() => onAddBet({ gameId, type: 'Prop', team: underKey, odds: odds[1], matchupStr, stake: 25 })}
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
const RosterPanel: React.FC<{
    game: ESPNGame;
    sport: string;
    betSlip: BetPick[];
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
    aiMode: boolean;
    rookieMode: boolean;
    searchQuery: string;
}> = ({ game, sport, betSlip, onAddBet, aiMode, rookieMode, searchQuery }) => {
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
                        <img src={game.awayTeam.logo} alt="" className="w-3.5 h-3.5 object-contain" />
                        {game.awayTeam.abbreviation}
                    </button>
                    <button
                        onClick={() => setActiveTeam('home')}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${activeTeam === 'home' ? 'bg-primary text-black' : 'text-text-muted hover:text-text-main'}`}
                    >
                        <img src={game.homeTeam.logo} alt="" className="w-3.5 h-3.5 object-contain" />
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
                            matchupStr={matchupStr}
                            teamName={teamName}
                            betSlip={betSlip}
                            onAddBet={onAddBet}
                            aiMode={aiMode}
                            rookieMode={rookieMode}
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
export const SportsbookView: React.FC<SportsbookViewProps> = ({ betSlip, setBetSlip, onAddBet }) => {
    const { isRookieModeActive, toggleRookieMode } = useRookieMode();

    const [activeSport, setActiveSport] = useState<string>('NBA');
    const [games, setGames] = useState<ESPNGame[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [aiMode, setAiMode] = useState(false);
    const [rookieMode, setRookieMode] = useState(isRookieModeActive);
    const [showBetSlip, setShowBetSlip] = useState(true);
    const [activePanel, setActivePanel] = useState<'teams' | 'players'>('teams');

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
            const espnKey = APP_SPORT_TO_ESPN[sportEntry.key] as SportKey || sportEntry.espn;
            const data = await fetchESPNScoreboardByDate(espnKey, today);
            setGames(data);
        } catch {
            setGames([]);
        } finally {
            setLoading(false);
        }
    }, [sportEntry, today]);

    useEffect(() => {
        fetchGames();
        const interval = setInterval(fetchGames, 60_000);
        return () => clearInterval(interval);
    }, [fetchGames]);

    // Sync rookie mode with global context
    useEffect(() => {
        setRookieMode(isRookieModeActive);
    }, [isRookieModeActive]);

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
                            {/* AI Mode */}
                            <button
                                onClick={() => setAiMode(p => !p)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${aiMode
                                    ? 'bg-green-500/15 border-green-500/40 text-green-400 shadow-[0_0_14px_rgba(34,197,94,0.3)]'
                                    : 'border-neutral-700 text-slate-400 hover:border-green-500/30 hover:text-green-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">psychology</span>
                                AI Picks
                                {aiMode && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                            </button>

                            {/* Rookie Mode */}
                            <button
                                onClick={() => { setRookieMode(p => !p); toggleRookieMode(); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${rookieMode
                                    ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.2)]'
                                    : 'border-neutral-700 text-slate-400 hover:border-yellow-400/30 hover:text-yellow-300'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">school</span>
                                Rookie Mode
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
                        {aiMode && (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-green-500/25 bg-green-500/5">
                                <span className="relative flex h-2 w-2 flex-shrink-0">
                                    <span className="animate-ping absolute inset-0 rounded-full bg-green-400 opacity-75" />
                                    <span className="relative rounded-full h-2 w-2 bg-green-500 inline-flex" />
                                </span>
                                <p className="text-[11px] text-green-400 font-bold">
                                    AI Pick Mode — green glow = high-confidence edge. Click to add to slip.
                                </p>
                            </div>
                        )}
                        {rookieMode && (
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
                                ) : sortedGames.length > 0 ? (
                                    <>
                                        {(['in', 'pre', 'post'] as const).map(status => {
                                            const sectionGames = sortedGames.filter(g => g.status === status);
                                            if (sectionGames.length === 0) return null;
                                            const cfg = {
                                                in: { label: 'LIVE NOW — Bets Still Open', dot: 'green', color: 'text-green-400' },
                                                pre: { label: 'UPCOMING', dot: 'yellow', color: 'text-yellow-400' },
                                                post: { label: 'FINAL — Team Lines Closed', dot: 'grey', color: 'text-neutral-500' },
                                            }[status];
                                            return (
                                                <div key={status} className="mb-6 space-y-3">
                                                    <div className="flex items-center gap-2.5 border-b border-neutral-800 pb-2">
                                                        {cfg.dot === 'green' && (
                                                            <span className="relative flex h-2.5 w-2.5">
                                                                <span className="animate-ping absolute inset-0 rounded-full bg-green-400 opacity-75" />
                                                                <span className="relative rounded-full h-2.5 w-2.5 bg-green-500 inline-flex" />
                                                            </span>
                                                        )}
                                                        {cfg.dot === 'yellow' && <span className="inline-flex h-2.5 w-2.5 rounded-full bg-yellow-400" />}
                                                        {cfg.dot === 'grey' && <span className="inline-flex h-2.5 w-2.5 rounded-full bg-neutral-500" />}
                                                        <span className={`text-[11px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
                                                        <span className="text-[10px] text-neutral-600 font-bold">({sectionGames.length})</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                        {sectionGames.map(game => (
                                                            <TeamOddsCard
                                                                key={game.id}
                                                                game={game}
                                                                sport={activeSport}
                                                                aiMode={aiMode}
                                                                rookieMode={rookieMode}
                                                                betSlip={betSlip}
                                                                onAddBet={onAddBet}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
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
                                ) : sortedGames.length > 0 ? (
                                    sortedGames.map(game => (
                                        <RosterPanel
                                            key={game.id}
                                            game={game}
                                            sport={activeSport}
                                            betSlip={betSlip}
                                            onAddBet={onAddBet}
                                            aiMode={aiMode}
                                            rookieMode={rookieMode}
                                            searchQuery={searchQuery}
                                        />
                                    ))
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
                            <BetSlip betSlip={betSlip} setBetSlip={setBetSlip} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
