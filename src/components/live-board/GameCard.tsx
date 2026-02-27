import React from 'react';
import { Game } from '../../data/mockGames';
import { PublicBetting } from './PublicBetting';
import { BetPick } from '../../App';
import { useRookieMode } from '../../contexts/RookieModeContext';
import { GlossaryTooltip } from '../ui/GlossaryTooltip';
import { RiskMeter } from '../ui/RiskMeter';
import { PulsingBeacon } from '../ui/PulsingBeacon';

interface GameCardProps {
    game: Game;
    onSelectGame: () => void;
    onAddBet: (bet: Omit<BetPick, 'id'>) => void;
    showPublicBets?: boolean;
    publicBettingOpen?: boolean;
    onPublicBettingToggle?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onSelectGame, onAddBet, showPublicBets = true, publicBettingOpen = false, onPublicBettingToggle }) => {
    const isLive = game.status === 'LIVE';
    const { isRookieModeActive } = useRookieMode();

    // Build plain-English translations for rookie mode
    const spreadNum = parseFloat(game.odds.spread);
    const awaySpreadText = isNaN(spreadNum)
        ? `${game.awayTeam.name} must cover the spread.`
        : spreadNum < 0
            ? `${game.awayTeam.name} must win by more than ${Math.abs(spreadNum)} points.`
            : `${game.awayTeam.name} can lose by up to ${spreadNum} points and still win your bet.`;

    const mlOdds = game.odds.moneyline;
    const mlNum = parseInt(mlOdds.replace('+', ''));
    const mlText = !isNaN(mlNum) && mlNum < 0
        ? `${game.awayTeam.name} is the favorite — they must win outright.`
        : `${game.awayTeam.name} is the underdog — an upset wins your bet.`;

    const ouVal = game.odds.overUnder.value;
    const ouPick = game.odds.overUnder.pick;
    const ouText = `Combined score must be ${ouPick === 'Over' ? 'above' : 'below'} ${ouVal} total points.`;

    // Normalize colors for SVG strokes
    const getStrokeColor = (colorClass: string) => {
        if (colorClass.includes('primary')) return '#0df20d';
        if (colorClass.includes('accent')) return '#a855f7';
        return '#3b82f6';
    };


    return (
        <div className="terminal-panel p-5 space-y-6 flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                        <img src={game.sportLogo} alt={game.sport} className="h-3.5 object-contain mr-1 opacity-80" />
                        {isLive ? (
                            <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded italic">LIVE</span>
                        ) : (
                            <span className="text-[9px] font-black bg-neutral-800 text-text-muted px-2 py-0.5 rounded">UPCOMING</span>
                        )}
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{game.timeLabel}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-text-muted font-black uppercase tracking-tighter">Matchup ID</p>
                        <p className="text-[10px] text-text-main font-mono">{game.matchupId}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-border-muted/30 pt-3 text-[9px] font-bold text-text-muted uppercase tracking-widest">
                    {/* Broadcast: icon + text label only, no image */}
                    <div className="flex items-center gap-1.5 opacity-80">
                        <span className="material-symbols-outlined text-[11px] text-slate-600">tv</span>
                        <span>{game.broadcast}</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                        <span className="material-symbols-outlined text-[11px] text-slate-600">location_on</span>
                        <span className="truncate max-w-[150px] text-right">{game.venue.name}, {game.venue.location}</span>
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-7 gap-4 items-center flex-grow">
                <div className="col-span-2 text-center">
                    {game.awayTeam.logo ? (
                        <img
                            alt={game.awayTeam.name}
                            className="w-12 h-12 mx-auto object-contain mb-2"
                            src={game.awayTeam.logo}
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = game.sportLogo;
                            }}
                        />
                    ) : (
                        <div className="w-12 h-12 mx-auto bg-neutral-800 rounded-full flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-slate-500">
                                {game.sport === 'Soccer' ? 'sports_soccer' :
                                    game.sport === 'NFL' ? 'sports_football' :
                                        game.sport === 'MLB' ? 'sports_baseball' : 'sports_basketball'}
                            </span>
                        </div>
                    )}
                    <h3 className="text-sm font-black text-text-main uppercase italic truncate">
                        {game.awayTeam.name}
                        {isLive && game.awayTeam.score !== undefined && <span className="ml-2 text-primary">{game.awayTeam.score}</span>}
                    </h3>
                    <p className="text-[10px] text-slate-500">{game.awayTeam.record}</p>
                    <div className="mt-3 flex gap-1 justify-center">
                        {game.awayTeam.recentForm.map((f, i) => (
                            <span key={i} className={f === 'W' ? 'form-badge-w' : 'form-badge-l'}>{f}</span>
                        ))}
                    </div>
                </div>

                <div className="col-span-3 flex justify-around">
                    <div className="text-center">
                        <div className="relative w-16 h-16 flex items-center justify-center mb-1">
                            <svg className="w-full h-full -rotate-90">
                                <circle className="text-neutral-800" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                                <circle
                                    className="transition-all duration-1000 ease-out"
                                    cx="32" cy="32" fill="transparent" r="28"
                                    stroke={getStrokeColor(game.awayTeam.color)}
                                    strokeDasharray="176"
                                    strokeDashoffset={176 - (176 * (game.awayTeam.winProb / 100))}
                                    strokeLinecap="round" strokeWidth="4"
                                ></circle>
                            </svg>
                            <span className="absolute text-[10px] font-black text-text-main italic">{game.awayTeam.winProb}%</span>
                        </div>
                        <p className={`text-[8px] font-bold ${game.awayTeam.color} uppercase`}>Win Prob</p>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-black text-slate-600 mb-1">VS</span>
                        <div className="h-8 w-[1px] bg-border-muted"></div>
                    </div>
                    <div className="text-center">
                        <div className="relative w-16 h-16 flex items-center justify-center mb-1">
                            <svg className="w-full h-full -rotate-90">
                                <circle className="text-neutral-800" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                                <circle
                                    className="transition-all duration-1000 ease-out"
                                    cx="32" cy="32" fill="transparent" r="28"
                                    stroke={getStrokeColor(game.homeTeam.color)}
                                    strokeDasharray="176"
                                    strokeDashoffset={176 - (176 * (game.homeTeam.winProb / 100))}
                                    strokeLinecap="round" strokeWidth="4"
                                ></circle>
                            </svg>
                            <span className="absolute text-[10px] font-black text-text-main italic">{game.homeTeam.winProb}%</span>
                        </div>
                        <p className={`text-[8px] font-bold ${game.homeTeam.color} uppercase`}>Win Prob</p>
                    </div>
                </div>

                <div className="col-span-2 text-center">
                    {game.homeTeam.logo ? (
                        <img
                            alt={game.homeTeam.name}
                            className="w-12 h-12 mx-auto object-contain mb-2"
                            src={game.homeTeam.logo}
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = game.sportLogo;
                            }}
                        />
                    ) : (
                        <div className="w-12 h-12 mx-auto bg-neutral-800 rounded-full flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-slate-500">
                                {game.sport === 'Soccer' ? 'sports_soccer' :
                                    game.sport === 'NFL' ? 'sports_football' :
                                        game.sport === 'MLB' ? 'sports_baseball' : 'sports_basketball'}
                            </span>
                        </div>
                    )}
                    <h3 className="text-sm font-black text-text-main uppercase italic truncate">
                        {game.homeTeam.name}
                        {isLive && game.homeTeam.score !== undefined && <span className="ml-2 text-primary">{game.homeTeam.score}</span>}
                    </h3>
                    <p className="text-[10px] text-slate-500">{game.homeTeam.record}</p>
                    <div className="mt-3 flex gap-1 justify-center">
                        {game.homeTeam.recentForm.map((f, i) => (
                            <span key={i} className={f === 'W' ? 'form-badge-w' : 'form-badge-l'}>{f}</span>
                        ))}
                    </div>
                </div>
            </div>

            {isRookieModeActive ? (
                /* ── ROOKIE ODDS ROW ── */
                <div id="rookie-odds-row" className="grid grid-cols-3 gap-2 border-t border-border-muted pt-4">
                    {/* Moneyline */}
                    <div
                        className="cursor-pointer bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-2.5 hover:border-yellow-400/50 hover:bg-yellow-400/10 transition-all"
                        onClick={() => onAddBet({ gameId: game.id, type: 'ML', team: game.awayTeam.name, odds: game.odds.moneyline, matchupStr: `${game.awayTeam.name} @ ${game.homeTeam.name}`, stake: 10 })}
                    >
                        <div className="flex items-center gap-1 mb-1">
                            <PulsingBeacon color="yellow" />
                            <GlossaryTooltip
                                term="Moneyline"
                                definition="You are simply picking which team will win the game outright."
                                example={`If ${game.awayTeam.name} win the game, you win.`}
                            />
                        </div>
                        <p className="text-[10px] text-slate-300 leading-snug mb-2">{mlText}</p>
                        <RiskMeter odds={game.odds.moneyline} />
                    </div>
                    {/* Spread */}
                    <div
                        className="cursor-pointer bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-2.5 hover:border-yellow-400/50 hover:bg-yellow-400/10 transition-all"
                        onClick={() => onAddBet({ gameId: game.id, type: 'Spread', team: `${game.awayTeam.name} ${game.odds.spread}`, odds: '-110', matchupStr: `${game.awayTeam.name} @ ${game.homeTeam.name}`, stake: 10 })}
                    >
                        <div className="flex items-center gap-1 mb-1">
                            <PulsingBeacon color="yellow" />
                            <GlossaryTooltip
                                term="Point Spread"
                                definition="The predicted score gap. The favorite must win by more than this; the underdog must lose by less."
                                example={awaySpreadText}
                            />
                        </div>
                        <p className="text-[10px] text-slate-300 leading-snug mb-2">{awaySpreadText}</p>
                        <RiskMeter odds="-110" />
                    </div>
                    {/* Over/Under */}
                    <div
                        className="cursor-pointer bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-2.5 hover:border-yellow-400/50 hover:bg-yellow-400/10 transition-all"
                        onClick={() => onAddBet({ gameId: game.id, type: ouPick === 'Over' ? 'Over' : 'Under', team: `${ouPick} ${ouVal}`, odds: '-110', matchupStr: `${game.awayTeam.name} @ ${game.homeTeam.name}`, stake: 10 })}
                    >
                        <div className="flex items-center gap-1 mb-1">
                            <PulsingBeacon color="yellow" />
                            <GlossaryTooltip
                                term="Over/Under"
                                definition="A bet on the combined score. Pick Over if you think both teams will score a lot, Under if you expect a low-scoring game."
                                example={`If the total score is ${ouPick === 'Over' ? 'above' : 'below'} ${ouVal}, you win.`}
                            />
                        </div>
                        <p className="text-[10px] text-slate-300 leading-snug mb-2">{ouText}</p>
                        <RiskMeter odds="-110" />
                    </div>
                </div>
            ) : (
                /* ── STANDARD ODDS BOXES ── */
                <div className="grid grid-cols-3 gap-3 border-t border-border-muted pt-4">
                    <div
                        className="odd-box cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => onAddBet({
                            gameId: game.id,
                            type: 'ML',
                            team: game.awayTeam.name,
                            odds: game.odds.moneyline,
                            matchupStr: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
                            stake: 50
                        })}
                    >
                        <span className="text-[8px] text-slate-500 uppercase font-black">Moneyline</span>
                        <span className="text-xs font-black text-primary">{game.odds.moneyline}</span>
                    </div>
                    <div
                        className="odd-box cursor-pointer hover:border-accent-purple/40 transition-colors"
                        onClick={() => onAddBet({
                            gameId: game.id,
                            type: 'Spread',
                            team: `${game.awayTeam.name} ${game.odds.spread}`,
                            odds: '-110',
                            matchupStr: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
                            stake: 50
                        })}
                    >
                        <span className="text-[8px] text-slate-500 uppercase font-black">Spread</span>
                        <span className="text-xs font-black text-accent-purple">{game.odds.spread}</span>
                    </div>
                    <div
                        className="odd-box cursor-pointer hover:border-text-main/40 transition-colors"
                        onClick={() => onAddBet({
                            gameId: game.id,
                            type: game.odds.overUnder.pick === 'Over' ? 'Over' : 'Under',
                            team: `${game.odds.overUnder.pick} ${game.odds.overUnder.value}`,
                            odds: '-110',
                            matchupStr: `${game.awayTeam.name} @ ${game.homeTeam.name}`,
                            stake: 50
                        })}
                    >
                        <span className="text-[8px] text-slate-500 uppercase font-black">O/U {game.odds.overUnder.value}</span>
                        <span className="text-xs font-black text-text-main">{game.odds.overUnder.pick}</span>
                    </div>
                </div>
            )}

            <div className="mt-4 -mx-5 -mb-5 rounded-b-xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-center bg-background-darker px-5 py-3 border-t border-border-muted">
                    <div className="flex items-center gap-2">
                        {isLive ? (
                            <span className="text-[9px] text-primary font-black animate-glow-hot">{game.streakLabel}</span>
                        ) : (
                            <span className="text-[9px] text-slate-500 font-black">{game.streakLabel}</span>
                        )}
                    </div>
                </div>
                {showPublicBets && <PublicBetting game={game} onMatchDetailsClick={onSelectGame} isOpen={publicBettingOpen} onToggle={onPublicBettingToggle ?? (() => { })} />}
            </div>
        </div>
    );
};
