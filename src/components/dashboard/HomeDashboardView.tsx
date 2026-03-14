import React, { useState, useEffect } from 'react';
import { ViewType } from '../shared/PremiumLockView';
import { cn } from '../../lib/utils';
import { REAL_TEAMS, Game, mockGamesBySport } from '../../data/mockGames';
import { Player, generateMockPlayers, getSportStatLabels } from '../../data/mockPlayers';
import { fetchESPNRosterBySport } from '../../data/espnService';
import { fetchMultiSportScoreboard, ESPNGame } from '../../data/espnScoreboard';
import { SGPBet, generateSGP } from '../popular/PopularBetsView';
import { ChevronRight, ChevronDown, TrendingUp, AlertCircle, Calendar, User, Ticket, Activity, BarChart2 } from 'lucide-react';
import { ComposedChart, Area, Line, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { WinningTicker } from './WinningTicker';

const TEAM_TREND_DATA = Array.from({ length: 20 }).map((_, i) => {
    const isWin = Math.random() > 0.4;
    const opponent = ['LAL', 'PHX', 'BOS', 'MIA', 'GSW', 'DEN', 'DAL', 'NYK'][Math.floor(Math.random() * 8)];
    
    // Generate dates working backwards from today
    const date = new Date();
    date.setDate(date.getDate() - (20 - i) * 2);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Realistic basketball-ish scores
    const teamScore = isWin ? 105 + Math.floor(Math.random() * 20) : 95 + Math.floor(Math.random() * 10);
    const oppScore = isWin ? teamScore - Math.floor(Math.random() * 15 + 1) : teamScore + Math.floor(Math.random() * 15 + 1);
    const margin = Math.abs(teamScore - oppScore);

    return {
        game: `G${i+1}`,
        date: dateStr,
        opponent: opponent,
        winProbability: 40 + Math.random() * 20 + (i * 0.5), // For Area chart trend
        actualScore: teamScore, // For Line chart actual value
        oppScore: oppScore,
        margin: margin,
        result: isWin ? 'W' : 'L'
    }
});

const TEAM_RADAR_DATA = [
    { subject: 'Offense', A: 85, fullMark: 100 },
    { subject: 'Defense', A: 92, fullMark: 100 },
    { subject: 'Pace', A: 78, fullMark: 100 },
    { subject: 'Rebounding', A: 88, fullMark: 100 },
    { subject: 'Shooting', A: 82, fullMark: 100 },
    { subject: 'Discipline', A: 65, fullMark: 100 },
];

interface HomeDashboardViewProps {
    onNavigate: (view: ViewType) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ onNavigate }) => {
    const [favoriteTeams, setFavoriteTeams] = useState<string[]>([]);
    const [statsCollapsed, setStatsCollapsed] = useState(true);
    const [trendRange, setTrendRange] = useState(20);

    const getLastGameStats = (sport: string) => {
        switch (sport?.toUpperCase()) {
            case 'NBA': return '24 PTS • 8 AST • 5 REB';
            case 'NFL': return '120 YDS • 2 TD • 8 REC';
            case 'MLB': return '2-4 • 1 HR • 3 RBI';
            case 'NHL': return '1 G • 2 A • 4 SOG';
            case 'SOCCER': return '1 G • 3 SOG • 88% PASS';
            default: return '24 PTS • 8 AST';
        }
    };

    useEffect(() => {
        try {
            const savedTeams = localStorage.getItem('favorite_teams');
            if (savedTeams) {
                setFavoriteTeams(JSON.parse(savedTeams));
            }
        } catch (e) {
            console.error('Failed to parse favorite teams:', e);
        }
    }, []);

    // Get favorite teams details
    const favoriteTeamDetails = favoriteTeams.map(teamId => {
        const [sport, abbr] = teamId.split('-');
        const sportTeams = REAL_TEAMS[sport] || [];
        const teamObj = sportTeams.find(t => t.abbr === abbr);
        return {
            id: teamId,
            sport,
            ...teamObj
        };
    }).filter(t => t.name);

    // Get dummy matches for favorites
    const upcomingFavoriteGames = favoriteTeamDetails.map(team => {
        const gamesForSport = mockGamesBySport[team.sport] || [];
        return gamesForSport.find(g =>
            g.homeTeam.name === team.name || g.awayTeam.name === team.name
        ) || gamesForSport[0]; // fallback
    }).filter(Boolean);

    const [topPlayers, setTopPlayers] = useState<(Player & { sport: string })[]>([]);
    const [aiPicks, setAiPicks] = useState<SGPBet[]>([]);
    const [addedBets, setAddedBets] = useState<Set<string>>(new Set());

    useEffect(() => {
        let isMounted = true;
        const loadPicks = async () => {
            if (!favoriteTeamDetails.length) {
                if (isMounted) setAiPicks([]);
                return;
            }
            const favoriteSports = Array.from(new Set(favoriteTeamDetails.map(t => t.sport))) as import('../../data/espnScoreboard').SportKey[];
            try {
                const data = await fetchMultiSportScoreboard(favoriteSports.length > 0 ? favoriteSports : ['NBA', 'NFL', 'MLB']);
                const fetchedGames: ESPNGame[] = Object.values(data).flat();
                if (isMounted && fetchedGames.length > 0) {
                    setAiPicks(Array.from({ length: 4 }).map((_, i) => generateSGP(fetchedGames[i % fetchedGames.length], i)));
                } else if (isMounted) {
                    setAiPicks([]);
                }
            } catch {
                if (isMounted) setAiPicks([]);
            }
        };
        loadPicks();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [favoriteTeams.join(',')]);

    useEffect(() => {
        let isMounted = true;
        const loadRealPlayers = async () => {
            if (!favoriteTeamDetails.length) {
                if (isMounted) setTopPlayers([]);
                return;
            }

            // User specifically requested 2 active players per favorite team
            const allocations = favoriteTeamDetails.map(t => ({ team: t, count: 2 }));

            const playersResult: (Player & { sport: string })[] = [];

            for (const { team, count } of allocations) {
                try {
                    const roster = await fetchESPNRosterBySport(team.name || '', team.sport);
                    const validAthletes = roster.filter(a => a.photoUrl && a.active !== false);

                    for (let i = 0; i < count && i < validAthletes.length; i++) {
                        const a = validAthletes[i];
                        const [mock] = generateMockPlayers(team.name || '', team.sport, 1);
                        playersResult.push({
                            ...mock,
                            id: a.id || mock.id,
                            name: a.fullName || mock.name,
                            photoUrl: a.photoUrl,
                            position: a.position?.abbreviation || mock.position,
                            sport: team.sport
                        });
                    }

                    const remaining = count - Math.min(count, validAthletes.length);
                    if (remaining > 0) {
                        const mocks = generateMockPlayers(team.name || '', team.sport, remaining);
                        playersResult.push(...mocks.map(m => ({ ...m, sport: team.sport })));
                    }
                } catch (e) {
                    console.error('Failed fetching roster for', team.abbr, e);
                    const mocks = generateMockPlayers(team.name || '', team.sport, count);
                    playersResult.push(...mocks.map(m => ({ ...m, sport: team.sport })));
                }
            }

            if (isMounted) {
                setTopPlayers(playersResult);
            }
        };

        loadRealPlayers();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [favoriteTeams.join(',')]);

    // Remove duplicates
    const uniqueGames = Array.from(new Set(upcomingFavoriteGames.map(g => g?.id)))
        .map(id => upcomingFavoriteGames.find(g => g?.id === id))
        .filter(Boolean) as Game[];

    return (
        <div className="flex-1 w-full bg-background-dark min-h-screen text-slate-100 overflow-y-auto font-display">
            <WinningTicker />
            <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
                            Your Basecamp
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm font-medium">
                            Personalized intel, news, and insights based on your favorites.
                        </p>
                    </div>
                </header>

                {favoriteTeamDetails.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* LEFT COLUMN: Games & News */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Upcoming Favorite Games */}
                            <section>
                                <h2 className="text-lg font-black uppercase text-white tracking-wider mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-accent-cyan" /> Upcoming Matchups
                                </h2>
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
                                    {uniqueGames.map((game) => (
                                        <div key={game.id} className="min-w-[280px] sm:min-w-[320px] shrink-0 bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors snap-start">
                                            <div className="flex justify-between text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
                                                <span>{game.sport} • {game.timeLabel}</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <img src={game.awayTeam.logo} alt={game.awayTeam.name} className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                        <span className="font-bold text-sm text-slate-200">{game.awayTeam.name}</span>
                                                    </div>
                                                    <span className={`text-sm font-black ${game.awayTeam.score !== undefined ? 'text-white' : 'text-slate-500'}`}>{game.awayTeam.score ?? game.odds.spread}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <img src={game.homeTeam.logo} alt={game.homeTeam.name} className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                        <span className="font-bold text-sm text-slate-200">{game.homeTeam.name}</span>
                                                    </div>
                                                    <span className={`text-sm font-black ${game.homeTeam.score !== undefined ? 'text-white' : 'text-slate-500'}`}>{game.homeTeam.score ?? (game.odds.spread.startsWith('-') ? game.odds.spread.replace('-', '+') : `-${game.odds.spread}`)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* TREND CHART: 5-10-20 Game Performance */}
                            <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                    <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-primary" /> Team Form & Trends
                                    </h2>
                                    <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-1 w-fit">
                                        {[5, 10, 20].map(span => (
                                            <button
                                                key={span}
                                                onClick={() => setTrendRange(span)}
                                                className={cn(
                                                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                                                    trendRange === span 
                                                        ? "bg-primary text-black shadow-[0_0_10px_rgba(17,248,183,0.3)]" 
                                                        : "text-slate-400 hover:text-white"
                                                )}
                                            >
                                                Last {span}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={TEAM_TREND_DATA.slice(-trendRange)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                                    {/* Using the user's primary theme color as primary */}
                                                    <stop offset="5%" stopColor="#11f8b7" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#11f8b7" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                                                    {/* Alternative team color logic could go here; hardcoding a slick secondary color for now */}
                                                    <stop offset="5%" stopColor="#3880fa" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#3880fa" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" vertical={false} />
                                            <XAxis dataKey="date" stroke="#8c8c8c" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                                            <YAxis stroke="#8c8c8c" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-lg shadow-xl">
                                                                <div className="text-[10px] font-black uppercase text-slate-400 mb-1 border-b border-neutral-800 pb-1">
                                                                    {data.date} • {data.game}
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-2">
                                                                    <div className={`text-xs font-black px-1.5 py-0.5 rounded ${data.result === 'W' ? 'bg-primary/20 text-primary' : 'bg-red-500/20 text-red-400'}`}>
                                                                        {data.result}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-white font-bold text-sm">vs {data.opponent}</span>
                                                                        <span className="text-slate-400 text-xs font-medium">
                                                                            {data.result === 'W' ? 'Won' : 'Lost'} {data.actualScore} - {data.oppScore}
                                                                        </span>
                                                                        <span className="text-[10px] text-accent-purple font-black mt-1 uppercase tracking-widest">
                                                                            Margin: {data.margin} PTS
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            {/* ZAxis handles the sizing of the bubbles for the Scatter graphic */}
                                            <ZAxis dataKey="margin" range={[50, 400]} name="Margin" />
                                            {/* Area chart uses Primary Color */}
                                            <Area type="monotone" dataKey="winProbability" name="Expected Form" fill="url(#colorPrimary)" stroke="none" />
                                            {/* Line chart uses Secondary Color */}
                                            <Line type="monotone" dataKey="actualScore" name="Actual Score" stroke="#3880fa" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#11f8b7', strokeWidth: 0 }} />
                                            {/* Scatter overlay creates variable-sized bubbles representing the point margin */}
                                            <Scatter dataKey="actualScore" fill="#9b4ff5" fillOpacity={0.6} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>

                            {/* Favorite Teams Bar */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-primary" /> My Teams
                                    </h2>
                                    <button
                                        onClick={() => onNavigate('team-selection')}
                                        className="text-xs text-primary hover:text-white transition-colors uppercase font-bold tracking-widest"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
                                    {favoriteTeamDetails.map(team => (
                                        <div key={team.id} className="min-w-[120px] bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex flex-col items-center gap-3 snap-start">
                                            <img
                                                src={team.url || `https://a.espncdn.com/i/teamlogos/${team.sport.toLowerCase()}/500/${team.abbr?.toLowerCase()}.png`}
                                                alt={team.name}
                                                className="w-12 h-12 object-contain"
                                                onError={(e) => { e.currentTarget.src = 'https://a.espncdn.com/i/teamlogos/default-team-logo-500.png'; }}
                                            />
                                            <div className="text-center">
                                                <div className="text-xs font-bold text-white leading-tight">{team.name}</div>
                                                <div className="text-[10px] text-slate-500 font-bold tracking-wider">{team.sport}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Top Players & Team Stats */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                                        <User className="w-5 h-5 text-accent-blue" /> Top Players &amp; Team Stats
                                    </h2>
                                    <button
                                        onClick={() => setStatsCollapsed(prev => !prev)}
                                        title={statsCollapsed ? 'Expand stats' : 'Minimize stats'}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-wider"
                                    >
                                        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-300', !statsCollapsed && 'rotate-180')} />
                                        {statsCollapsed ? 'Show all' : 'Minimize'}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {(statsCollapsed ? topPlayers.slice(0, 3) : topPlayers).map((player, idx) => {
                                        const teamObj = favoriteTeamDetails.find(t => t.name === player.teamName);
                                        const teamLogo = teamObj?.url || `https://a.espncdn.com/i/teamlogos/${player.sport.toLowerCase()}/500/${teamObj?.abbr?.toLowerCase() || ''}.png`;
                                        const [feet, inches] = player.height.split('-');
                                        const formattedHeight = feet && inches ? `${feet}' ${inches}"` : player.height;
                                        const jerseyNumber = `#${(player.id.length * 7 + idx) % 99 + 1}`;



                                        return (
                                            <div key={player.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-0 flex relative overflow-hidden group hover:border-neutral-700 transition-colors h-[190px]">
                                                {/* Number watermark */}
                                                <div className="absolute top-1/2 -translate-y-1/2 right-4 text-[72px] font-black italic text-neutral-800/60 select-none z-0">
                                                    {jerseyNumber}
                                                </div>

                                                {/* Left side: Photo on white bg with big logo */}
                                                <div className="w-36 md:w-40 h-full shrink-0 bg-white relative z-10 flex items-end justify-center pt-2 overflow-hidden">
                                                    <img src={teamLogo} alt={player.teamName} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-none w-[280px] h-[280px] object-contain pointer-events-none" />
                                                    <img src={player.photoUrl} alt={player.name} className="w-[110%] h-[110%] object-cover object-bottom relative z-10 drop-shadow-xl origin-bottom" onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-4xl text-neutral-600 self-center mb-6 z-10">person</span>';
                                                    }} />
                                                </div>

                                                {/* Right side: Info */}
                                                <div className="p-3 flex flex-col justify-between relative z-10 flex-1 ml-2 shadow-[-20px_0_20px_-10px_rgba(23,23,23,1)] bg-neutral-900 border-l border-neutral-800">
                                                    <div>
                                                        <div className="flex items-center justify-between pr-2">
                                                            <h3 className="text-sm md:text-base font-black text-white leading-tight truncate">{player.name}</h3>
                                                            <span className="text-primary font-black italic text-sm">{jerseyNumber}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 mb-1">
                                                            <span className="bg-accent-purple text-white px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider">{player.position}</span>
                                                            <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">{formattedHeight} • {player.weight} lbs</span>
                                                        </div>
                                                    </div>

                                                    {/* Last Game Stats & Date */}
                                                    <div className="bg-neutral-950/50 rounded-lg p-2 border border-neutral-800/50 mb-1 flex-1 flex flex-col justify-center">
                                                        <div className="flex justify-between items-center h-full">
                                                            <div className="flex flex-col justify-center h-full w-full">
                                                                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-0.5">Last Game</span>
                                                                <div className="text-[10px] md:text-[11px] font-black text-white tracking-wide">
                                                                    {player.recentLogs?.[0] ? (
                                                                        <div className="flex flex-col gap-0.5 leading-tight">
                                                                            <span>{player.recentLogs[0].stat1} {getSportStatLabels(player.sport).stat1}</span>
                                                                            <span className="text-[9px] text-slate-300">{player.recentLogs[0].stat2} {getSportStatLabels(player.sport).stat2} • {player.recentLogs[0].stat3} {getSportStatLabels(player.sport).stat3}</span>
                                                                        </div>
                                                                    ) : getLastGameStats(player.sport)}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end justify-between h-full pl-2 border-l border-neutral-800/50 shrink-0">
                                                                <img src={teamLogo} alt="Team" className="w-10 h-10 object-contain drop-shadow-md" />
                                                                <span className="text-[9px] text-slate-500 font-black tracking-widest text-primary flex items-center gap-1 mt-1">
                                                                    <Calendar className="w-3 h-3" /> {player.recentLogs?.[0]?.date || 'Mar 7'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Shortened Team Record */}
                                                    <div className="flex gap-4 items-center mt-1">
                                                        <div className="text-[9px] font-bold text-slate-500">HOME: <span className="text-white font-black">{player.teamRecord.home}</span></div>
                                                        <div className="text-[9px] font-bold text-slate-500">AWAY: <span className="text-white font-black">{player.teamRecord.away}</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {statsCollapsed && topPlayers.length > 3 && (
                                    <button
                                        onClick={() => setStatsCollapsed(false)}
                                        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-neutral-800 hover:border-neutral-700 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-colors"
                                    >
                                        <ChevronDown className="w-3 h-3" />
                                        {topPlayers.length - 3} more players
                                    </button>
                                )}
                            </section>


                            {/* Popular Tickets */}
                            {aiPicks.length > 0 && (
                                <section className="mt-8">
                                    <h2 className="text-lg font-black uppercase text-white tracking-wider mb-4 flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-orange-500" /> Popular Tickets For You
                                    </h2>
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
                                        {aiPicks.map(bet => (
                                            <div key={bet.id} className="min-w-[280px] sm:min-w-[320px] shrink-0 bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 transition-colors rounded-xl p-5 flex flex-col h-full relative overflow-hidden group snap-start">
                                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors pointer-events-none"></div>

                                                <div className="flex justify-between items-start mb-4 relative z-10">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest bg-primary/10 text-primary border border-primary/30">
                                                                {bet.sport}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-bold text-slate-300">{bet.awayTeam}</span>
                                                            <span className="text-slate-500 text-[10px]">@</span>
                                                            <span className="text-xs font-bold text-white">{bet.homeTeam}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded">{bet.odds}</span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 flex flex-col gap-2 mb-4 relative z-10">
                                                    {bet.legs.slice(0, 3).map((leg, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-neutral-950 border border-neutral-800/50 p-2.5 rounded-lg">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-white max-w-[120px] truncate">{leg.player}</span>
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                                    {leg.line === 'Yes' ? leg.prop : `Over ${leg.line.replace(/Over /, '')} ${leg.prop}`}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-primary ml-2">{leg.line === 'Yes' ? 'Yes' : leg.line.replace(/Over\s*/i, '').replace(/Under\s*/i, '')}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-auto flex items-center justify-between border-t border-neutral-800 pt-3.5 relative z-10">
                                                    <div className="flex items-center gap-1.5 text-orange-400 font-black text-[10px] uppercase tracking-widest">
                                                        <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                                                        {bet.placedCount} Placed
                                                    </div>
                                                    <button
                                                        disabled={addedBets.has(bet.id)}
                                                        onClick={() => setAddedBets(prev => new Set(prev).add(bet.id))}
                                                        className={`transition-colors px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-widest ${addedBets.has(bet.id)
                                                            ? 'bg-green-500 text-black border border-green-500 cursor-not-allowed'
                                                            : 'bg-primary text-black hover:bg-primary/80'
                                                            }`}
                                                    >
                                                        {addedBets.has(bet.id) ? 'Added' : 'Add Ticket'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                        </div>

                        {/* RIGHT COLUMN: AI Parlays */}
                        <div className="space-y-6">


                            {/* Top Predictions */}
                            <h2 className="text-lg font-black uppercase text-white tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">auto_awesome</span> Top Predictions for Your Teams
                            </h2>
                            <div className="bg-neutral-900 border border-primary/30 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(13,242,13,0.1)] mb-6">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none"></div>
                                <div className="p-6 relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="text-xs font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                                            Generated for you
                                        </div>
                                        <div className="text-sm font-black text-white">+480</div>
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        {uniqueGames.slice(0, 3).map((g, i) => (
                                            <div key={i} className="flex border-b border-white/10 pb-4 last:border-0 last:pb-0">
                                                <div className="w-1 bg-primary rounded-full mr-3"></div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-slate-400 font-bold mb-1">{g.awayTeam.name} @ {g.homeTeam.name}</div>
                                                    <div className="text-sm font-bold text-white">{g.homeTeam.name} Moneyline</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="w-full py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-primary transition-colors">
                                        Add to Betslip
                                    </button>
                                </div>
                            </div>

                            {/* Explore the Board */}
                            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 p-6 rounded-2xl border border-neutral-700 relative overflow-hidden mb-6">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none"></div>
                                <h3 className="text-lg font-black uppercase italic mb-2">Explore the Board</h3>
                                <p className="text-sm text-slate-400 mb-6 font-medium">Dive into the full slate of games, predictive analytics, and deep stats.</p>
                                <button
                                    onClick={() => onNavigate('live-board')}
                                    className="px-6 py-2.5 bg-neutral-800 border border-neutral-600 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-neutral-700 hover:text-white transition-all flex items-center gap-2"
                                >
                                    Go to Live Board <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* News & Injuries */}
                            <section>
                                <h2 className="text-lg font-black uppercase text-white tracking-wider mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-accent-purple" /> Injuries & News
                                </h2>
                                <div className="space-y-3">
                                    {[
                                        { title: "Star QB questionable for Sunday with minor ankle sprain", source: "ESPN", time: "2h ago", impact: "High" },
                                        { title: "Point Guard cleared to return after 3-game absence", source: "NBC Sports", time: "5h ago", impact: "Positive" },
                                        { title: "Head coach discusses defensive strategy changes", source: "The Athletic", time: "8h ago", impact: "Low" }
                                    ].map((news, i) => (
                                        <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-between items-center group cursor-pointer hover:bg-neutral-800 transition-colors">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">{news.title}</h3>
                                                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">{news.source} • {news.time}</p>
                                            </div>
                                            <div className={cn(
                                                "px-2 py-1 rounded text-[10px] font-black uppercase",
                                                news.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                                                    news.impact === 'Positive' ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'
                                            )}>
                                                {news.impact}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Performance Radar */}
                            <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-8">
                                <h2 className="text-lg font-black uppercase text-white tracking-wider mb-2 flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-accent-blue" /> Performance Radar
                                </h2>
                                <p className="text-xs text-slate-400 font-medium mb-4">Aggregated specific team metrics against league average.</p>
                                <div className="h-[260px] w-full -ml-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={TEAM_RADAR_DATA}>
                                            <PolarGrid stroke="#2c2c2c" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#8c8c8c', fontSize: 10, fontWeight: 'bold' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Team Metrics" dataKey="A" stroke="#3880fa" strokeWidth={2} fill="#3880fa" fillOpacity={0.3} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#161616', borderColor: '#2c2c2c', borderRadius: '8px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#3880fa' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>
                        </div>
                    </div>
                ) : (
                    // ZERO STATE: No favorite teams
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-900 border border-neutral-800 rounded-2xl">
                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-slate-500">sports_football</span>
                        </div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">No Favorites Yet</h2>
                        <p className="text-slate-400 max-w-md mx-auto mb-8">
                            Select your favorite teams to see personalized upcoming games, news, and tailored AI parlays right here on your dashboard.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => onNavigate('sport-selection')}
                                className="px-6 py-3 bg-primary text-black text-sm font-black uppercase tracking-widest rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(13,242,13,0.3)]"
                            >
                                Setup Basecamp
                            </button>
                            <button
                                onClick={() => onNavigate('live-board')}
                                className="px-6 py-3 bg-neutral-800 border border-neutral-700 text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-neutral-700 hover:text-white transition-all"
                            >
                                Go to Live Board
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
